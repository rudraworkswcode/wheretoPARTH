"""
where to PARTH — Unified Navigation Backend
FastAPI service interfacing with local OpenStreetMap + OSRM routing engine.
Executes:
1. Dynamic route request validation.
2. Reference driving route fetch via local OSRM /route.
3. Realistic NavIC GNSS noise observation simulation with calibrated 1e-8 deg^2 variance.
4. OSRM map-matching via local /match with timestamps, radiuses, and movement bearings.
5. Kalman filter fallback smoothing (metric coordinate frame) when matching fails or has low confidence.
"""

import json
import logging
import math
import os
import random
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Logging & Environment Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
logger = logging.getLogger("parth_backend")

BASE_DIR: Path = Path(__file__).resolve().parent
CONFIG_PATH: Path = BASE_DIR / "noise_config.json"

# Local OSRM Service URL (Configured via env, default to Docker internal http://osrm:5000)
OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "http://osrm:5000").rstrip("/")
OSRM_ROUTE_URL: str = f"{OSRM_BASE_URL}/route/v1/driving/{{coordinates}}"
OSRM_MATCH_URL: str = f"{OSRM_BASE_URL}/match/v1/driving/{{coordinates}}"

# Calibrated Noise & Matching Parameters
LATITUDE_VARIANCE_DEG2: float = 1e-8   # Variance in degrees squared (std = 0.0001° ≈ 11.1m)
LONGITUDE_VARIANCE_DEG2: float = 1e-8  # Variance in degrees squared
DROPOUT_PERCENTAGE: float = 0.02       # 2% intermediate dropouts
SIMULATED_SPEED_MPS: float = 12.5      # ~45 km/h simulated progression
CONFIDENCE_THRESHOLD: float = 0.65     # Minimum OSRM match confidence acceptance threshold
MAX_MATCHING_BATCH_SIZE: int = 40      # Max observations per OSRM matching window
MATCHING_OVERLAP: int = 5              # Overlap between consecutive matching windows
OSRM_HTTP_TIMEOUT: float = 12.0        # HTTP timeout for local OSRM queries

# ---------------------------------------------------------------------------
# Pydantic Request & Response Models
# ---------------------------------------------------------------------------
class DynamicRouteRequest(BaseModel):
    start_lon: float = Field(..., ge=-180.0, le=180.0, description="Origin longitude")
    start_lat: float = Field(..., ge=-90.0, le=90.0, description="Origin latitude")
    end_lon: float = Field(..., ge=-180.0, le=180.0, description="Destination longitude")
    end_lat: float = Field(..., ge=-90.0, le=90.0, description="Destination latitude")

    @model_validator(mode="after")
    def validate_distinct_coordinates(self) -> "DynamicRouteRequest":
        dist = haversine_distance([self.start_lon, self.start_lat], [self.end_lon, self.end_lat])
        if dist < 10.0:
            raise ValueError("Start and destination coordinates are too close (minimum 10 meters displacement required).")
        return self


class TurnStep(BaseModel):
    name: str = ""
    instruction: str = ""
    distance_meters: float = 0.0
    duration_seconds: float = 0.0
    type: str = "turn"
    modifier: Optional[str] = None
    location: List[float] = Field(default_factory=list)


class ReferenceRoute(BaseModel):
    geometry: Dict[str, Any]
    distance_meters: float
    duration_seconds: float
    steps: List[TurnStep]


class ObservationPoint(BaseModel):
    index: int
    coord: List[float]
    timestamp: int
    accuracy_meters: float
    bearing: Optional[float] = None


class MatchingResult(BaseModel):
    status: str
    confidence: Optional[float] = None
    geometry: Optional[Dict[str, Any]] = None
    matched_positions: List[List[float]] = Field(default_factory=list)
    tracepoints_matched: int = 0
    total_tracepoints: int = 0


class KalmanFallbackResult(BaseModel):
    used: bool
    coordinates: List[List[float]] = Field(default_factory=list)
    uncertainty_meters: Optional[float] = None
    status: str = "ok"


class SimulationResponse(BaseModel):
    status: str
    reference_route: ReferenceRoute
    observations: List[ObservationPoint]
    raw_trace: List[List[float]]
    matching: MatchingResult
    kalman_fallback: KalmanFallbackResult
    active_position_source: str


# ---------------------------------------------------------------------------
# FastAPI Application & CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="where to PARTH Navigation Service",
    description="Local OSM + OSRM routing, NavIC GNSS simulation, OSRM map-matching, and Kalman fallback.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Geodetic & Coordinate Math Helpers
# ---------------------------------------------------------------------------
def to_rad(deg: float) -> float:
    return deg * math.pi / 180.0


def to_deg(rad: float) -> float:
    return rad * 180.0 / math.pi


def haversine_distance(pt1: List[float], pt2: List[float]) -> float:
    """Calculates great-circle distance between two [lon, lat] coordinates in meters."""
    if not pt1 or not pt2:
        return 0.0
    lon1, lat1 = pt1[0], pt1[1]
    lon2, lat2 = pt2[0], pt2[1]
    r = 6371000.0
    d_lat = to_rad(lat2 - lat1)
    d_lon = to_rad(lon2 - lon1)
    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(to_rad(lat1)) * math.cos(to_rad(lat2)) * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return r * c


def calculate_bearing(pt1: List[float], pt2: List[float]) -> float:
    """Calculates compass heading angle (0-360 degrees) from pt1 to pt2 [lon, lat]."""
    if not pt1 or not pt2:
        return 0.0
    lon1, lat1 = pt1[0], pt1[1]
    lon2, lat2 = pt2[0], pt2[1]
    y = math.sin(to_rad(lon2 - lon1)) * math.cos(to_rad(lat2))
    x = math.cos(to_rad(lat1)) * math.sin(to_rad(lat2)) - math.sin(to_rad(lat1)) * math.cos(
        to_rad(lat2)
    ) * math.cos(to_rad(lon2 - lon1))
    b = to_deg(math.atan2(y, x))
    return (b + 360.0) % 360.0


# ---------------------------------------------------------------------------
# 1. Fetch Reference Route (Local OSRM /route)
# ---------------------------------------------------------------------------
async def fetch_base_route(
    start_lon: float, start_lat: float, end_lon: float, end_lat: float
) -> ReferenceRoute:
    """
    Fetches reference driving route from local OSRM service using the OpenStreetMap graph.
    The route is a reference corridor for simulation, not guaranteed vehicle ground truth.
    """
    coord_str = f"{start_lon},{start_lat};{end_lon},{end_lat}"
    url = OSRM_ROUTE_URL.format(coordinates=coord_str)
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=OSRM_HTTP_TIMEOUT) as client:
            response = await client.get(url, params=params)
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
        logger.error(f"Failed to connect to local OSRM at {OSRM_BASE_URL}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "OSRM_UNAVAILABLE",
                "message": f"Local OSRM service is unreachable at {OSRM_BASE_URL}. Ensure local OSRM container is running with the prepared regional road graph.",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "error": "OSRM_ERROR",
                "message": f"OSRM server returned HTTP status {response.status_code}: {response.text}",
            },
        )

    data = response.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "NO_ROUTE",
                "message": f"No driving route found between coordinates in local OSM dataset: {data.get('message', 'NoRoute')}",
            },
        )

    best_route = data["routes"][0]
    distance_meters = float(best_route.get("distance", 0.0))
    duration_seconds = float(best_route.get("duration", 0.0))
    geometry = best_route.get("geometry", {})

    # Parse route steps from legs
    parsed_steps: List[TurnStep] = []
    legs = best_route.get("legs", [])
    for leg in legs:
        for s in leg.get("steps", []):
            m = s.get("maneuver", {})
            m_type = m.get("type", "turn")
            m_mod = m.get("modifier")
            m_loc = m.get("location", [])
            s_name = s.get("name") or "Road"

            instruction = f"{m_type.capitalize()}"
            if m_mod:
                instruction += f" {m_mod}"
            if s_name:
                instruction += f" onto {s_name}"

            parsed_steps.append(
                TurnStep(
                    name=s_name,
                    instruction=instruction,
                    distance_meters=float(s.get("distance", 0.0)),
                    duration_seconds=float(s.get("duration", 0.0)),
                    type=m_type,
                    modifier=m_mod,
                    location=m_loc,
                )
            )

    return ReferenceRoute(
        geometry=geometry,
        distance_meters=distance_meters,
        duration_seconds=duration_seconds,
        steps=parsed_steps,
    )


# ---------------------------------------------------------------------------
# 2. Calibrated NavIC GNSS Noise Simulation
# ---------------------------------------------------------------------------
def generate_navic_noise(
    base_coordinates: List[List[float]],
    start_timestamp: Optional[int] = None,
) -> List[ObservationPoint]:
    """
    Generates realistic simulated NavIC/GNSS observations along the reference route:
    - Calibrated variance: 1e-8 deg^2 (standard deviation sqrt(1e-8) = 0.0001°).
    - Latitude scaling: 0.0001° ≈ 11.11m in latitude.
    - Longitude scaling accounts for latitude: 0.0001° * 111139 * cos(lat) ≈ 10.83m at 12.9°N.
    - Resulting horizontal standard error: ~15.5m (converted to accuracy_meters for matching radiuses).
    - Monotonically increasing Unix timestamps derived from inter-point displacement.
    - 2% dropout rate for intermediate points; start and destination are preserved.
    - Observed bearings derived from successive noisy coordinates (when displacement >= 2.0m).
    """
    if len(base_coordinates) < 2:
        raise ValueError("Requires at least 2 reference route coordinates.")

    std_lat_deg = math.sqrt(LATITUDE_VARIANCE_DEG2)  # 0.0001°
    std_lon_deg = math.sqrt(LONGITUDE_VARIANCE_DEG2)  # 0.0001°

    t_current = start_timestamp if start_timestamp is not None else int(time.time())
    observations: List[ObservationPoint] = []

    for i, pt in enumerate(base_coordinates):
        # Time progression derived from reference displacement and simulated velocity
        if i > 0:
            segment_m = haversine_distance(base_coordinates[i - 1], pt)
            dt_seconds = max(1, int(round(segment_m / SIMULATED_SPEED_MPS)))
            t_current += dt_seconds

        # 2% coordinate dropout for intermediate points
        if 0 < i < len(base_coordinates) - 1 and random.random() < DROPOUT_PERCENTAGE:
            continue

        ref_lon, ref_lat = pt[0], pt[1]

        # Gaussian coordinate jitter using calibrated degree standard deviation
        d_lat = float(np.random.normal(0.0, std_lat_deg))
        d_lon = float(np.random.normal(0.0, std_lon_deg))

        noisy_lon = round(ref_lon + d_lon, 6)
        noisy_lat = round(ref_lat + d_lat, 6)

        # Convert uncertainty in degrees to horizontal standard error in meters
        lat_rad = to_rad(ref_lat)
        sigma_lat_m = std_lat_deg * 111139.0
        sigma_lon_m = std_lon_deg * (111139.0 * math.cos(lat_rad))
        accuracy_meters = round(math.sqrt(sigma_lat_m**2 + sigma_lon_m**2), 1)

        observations.append(
            ObservationPoint(
                index=i,
                coord=[noisy_lon, noisy_lat],
                timestamp=t_current,
                accuracy_meters=accuracy_meters,
                bearing=None,
            )
        )

    # Derive movement bearings from successive observed positions
    for k in range(1, len(observations)):
        disp_m = haversine_distance(observations[k - 1].coord, observations[k].coord)
        if disp_m >= 2.0:  # Stable movement displacement threshold
            observations[k].bearing = round(
                calculate_bearing(observations[k - 1].coord, observations[k].coord), 1
            )
        else:
            observations[k].bearing = None

    return observations


# ---------------------------------------------------------------------------
# 3. Local OSRM Map Matching with Overlapping Windows
# ---------------------------------------------------------------------------
async def match_single_window(
    window_obs: List[ObservationPoint],
) -> Tuple[Dict[str, Any], int]:
    """Sends one batch of at most 40 observations to local OSRM /match."""
    coord_string = ";".join(f"{o.coord[0]},{o.coord[1]}" for o in window_obs)
    timestamp_string = ";".join(str(o.timestamp) for o in window_obs)
    radius_string = ";".join(str(o.accuracy_meters) for o in window_obs)
    bearing_string = ";".join(
        f"{int(round(o.bearing))},25" if o.bearing is not None else "" for o in window_obs
    )

    url = OSRM_MATCH_URL.format(coordinates=coord_string)
    params = {
        "geometries": "geojson",
        "overview": "simplified",
        "steps": "false",
        "gaps": "split",
        "radiuses": radius_string,
        "timestamps": timestamp_string,
        "bearings": bearing_string,
    }

    async with httpx.AsyncClient(timeout=OSRM_HTTP_TIMEOUT) as client:
        response = await client.get(url, params=params)

    if response.status_code != 200:
        return {"code": "Error", "message": response.text}, response.status_code

    return response.json(), 200


async def fetch_osrm_correction(
    observations: List[ObservationPoint],
) -> Tuple[str, MatchingResult]:
    """
    Sends ordered observations to local OSRM Match service.
    Splits traces longer than 40 coordinates into sequential overlapping windows (overlap: 5)
    to preserve input-size bounds and local topological continuity.
    Returns: (match_status_label, MatchingResult)
    """
    if len(observations) < 2:
        return "NO_MATCH", MatchingResult(status="InsufficientCoordinates")

    # Construct overlapping windows of at most MAX_MATCHING_BATCH_SIZE
    windows: List[List[ObservationPoint]] = []
    start_idx = 0
    while start_idx < len(observations):
        end_idx = min(len(observations), start_idx + MAX_MATCHING_BATCH_SIZE)
        windows.append(observations[start_idx:end_idx])
        if end_idx == len(observations):
            break
        start_idx += MAX_MATCHING_BATCH_SIZE - MATCHING_OVERLAP

    all_matched_positions: List[Optional[List[float]]] = [None] * len(observations)
    combined_coordinates: List[List[float]] = []
    confidences: List[float] = []
    total_tracepoints = len(observations)
    tracepoints_matched_count = 0
    had_osrm_network_error = False

    current_offset = 0
    for w_idx, window_obs in enumerate(windows):
        try:
            data, status_code = await match_single_window(window_obs)
        except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
            logger.warning(f"OSRM match request failed: {exc}")
            had_osrm_network_error = True
            break

        if status_code != 200 or data.get("code") != "Ok":
            continue

        matchings = data.get("matchings", [])
        tracepoints = data.get("tracepoints", [])

        # Process matched geometries
        for m in matchings:
            conf = m.get("confidence", 0.0)
            if conf > 0:
                confidences.append(conf)
            coords = m.get("geometry", {}).get("coordinates", [])
            for c in coords:
                if not combined_coordinates or c != combined_coordinates[-1]:
                    combined_coordinates.append(c)

        # Associate matched tracepoints to original input observations
        for local_i, tp in enumerate(tracepoints):
            global_i = current_offset + local_i
            if global_i < len(all_matched_positions) and tp is not None:
                all_matched_positions[global_i] = tp.get("location")
                tracepoints_matched_count += 1

        current_offset += len(window_obs) - (MATCHING_OVERLAP if w_idx < len(windows) - 1 else 0)

    if had_osrm_network_error:
        return "OSRM_UNAVAILABLE", MatchingResult(status="OSRM_UNAVAILABLE")

    # Flatten matched positions; fallback to None when a point was unmatched
    final_matched_positions = [
        pos if pos is not None else observations[idx].coord
        for idx, pos in enumerate(all_matched_positions)
    ]

    avg_confidence = float(np.mean(confidences)) if confidences else 0.0

    if not combined_coordinates or tracepoints_matched_count == 0:
        return "NO_MATCH", MatchingResult(
            status="NoMatch",
            confidence=0.0,
            geometry=None,
            matched_positions=final_matched_positions,
            tracepoints_matched=0,
            total_tracepoints=total_tracepoints,
        )

    matched_geom = {"type": "LineString", "coordinates": combined_coordinates}

    if avg_confidence < CONFIDENCE_THRESHOLD:
        return "LOW_CONFIDENCE", MatchingResult(
            status="LowConfidence",
            confidence=round(avg_confidence, 3),
            geometry=matched_geom,
            matched_positions=final_matched_positions,
            tracepoints_matched=tracepoints_matched_count,
            total_tracepoints=total_tracepoints,
        )

    return "MATCHED", MatchingResult(
        status="Ok",
        confidence=round(avg_confidence, 3),
        geometry=matched_geom,
        matched_positions=final_matched_positions,
        tracepoints_matched=tracepoints_matched_count,
        total_tracepoints=total_tracepoints,
    )


# ---------------------------------------------------------------------------
# 4. Kalman Filter Fallback (Local Metric Cartesian Frame)
# ---------------------------------------------------------------------------
def apply_kalman_smoothing(
    observations: List[ObservationPoint],
) -> KalmanFallbackResult:
    """
    Causal constant-velocity 4D Kalman filter [x, y, vx, vy] in a local metric frame.
    Estimates vehicle positions during OSRM matching failure or low confidence.
    Never reported as a map-matched road position.
    """
    if len(observations) < 2:
        return KalmanFallbackResult(
            used=True,
            coordinates=[o.coord for o in observations],
            uncertainty_meters=None,
            status="insufficient_data",
        )

    origin_lon = observations[0].coord[0]
    origin_lat = observations[0].coord[1]
    origin_lat_rad = to_rad(origin_lat)
    meters_per_deg_lat = 111139.0
    meters_per_deg_lon = 111139.0 * math.cos(origin_lat_rad)

    # Convert observations to local metric frame (meters)
    metric_obs: List[Tuple[float, float, float]] = []
    for o in observations:
        x_m = (o.coord[0] - origin_lon) * meters_per_deg_lon
        y_m = (o.coord[1] - origin_lat) * meters_per_deg_lat
        metric_obs.append((x_m, y_m, float(o.timestamp)))

    # Initial state [x, y, vx, vy]
    dt0 = max(1.0, metric_obs[1][2] - metric_obs[0][2])
    vx0 = (metric_obs[1][0] - metric_obs[0][0]) / dt0
    vy0 = (metric_obs[1][1] - metric_obs[0][1]) / dt0
    x_state = np.array([metric_obs[0][0], metric_obs[0][1], vx0, vy0], dtype=float)

    # Covariances
    P = np.diag([20.0**2, 20.0**2, 5.0**2, 5.0**2])  # Initial state covariance
    q_var = 1.0  # Acceleration disturbance variance (m/s^2)^2
    r_var = observations[0].accuracy_meters**2  # Measurement noise variance (m^2)
    R = np.diag([r_var, r_var])
    H = np.array([[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]], dtype=float)

    filtered_metric: List[Tuple[float, float]] = [(metric_obs[0][0], metric_obs[0][1])]

    for k in range(1, len(metric_obs)):
        dt = max(0.2, metric_obs[k][2] - metric_obs[k - 1][2])

        # State Transition Matrix F
        F = np.array(
            [[1.0, 0.0, dt, 0.0], [0.0, 1.0, 0.0, dt], [0.0, 0.0, 1.0, 0.0], [0.0, 0.0, 0.0, 1.0]],
            dtype=float,
        )

        # Process Noise Covariance Q
        dt2 = 0.5 * (dt**2)
        G = np.array([[dt2, 0.0], [0.0, dt2], [dt, 0.0], [0.0, dt]], dtype=float)
        Q = G @ np.diag([q_var, q_var]) @ G.T

        # Prediction step
        x_pred = F @ x_state
        P_pred = F @ P @ F.T + Q

        # Measurement update step
        z = np.array([metric_obs[k][0], metric_obs[k][1]], dtype=float)
        y_residual = z - (H @ x_pred)
        S = H @ P_pred @ H.T + R
        K = P_pred @ H.T @ np.linalg.inv(S)

        x_state = x_pred + (K @ y_residual)
        P = (np.eye(4) - K @ H) @ P_pred

        filtered_metric.append((x_state[0], x_state[1]))

    # Convert metric coordinates back to [lon, lat]
    kalman_coords: List[List[float]] = []
    for xm, ym in filtered_metric:
        lon_c = round(origin_lon + (xm / meters_per_deg_lon), 6)
        lat_c = round(origin_lat + (ym / meters_per_deg_lat), 6)
        kalman_coords.append([lon_c, lat_c])

    final_uncertainty = round(float(math.sqrt(P[0, 0] + P[1, 1])), 2)

    return KalmanFallbackResult(
        used=True,
        coordinates=kalman_coords,
        uncertainty_meters=final_uncertainty,
        status="kalman_estimate",
    )


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
@app.get("/api/health")
async def health_check() -> Dict[str, Any]:
    """Health check validating backend and connectivity to local OSRM instance."""
    osrm_status = "unreachable"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{OSRM_BASE_URL}/route/v1/driving/77.47,12.90;77.52,12.85?overview=false")
            if resp.status_code == 200:
                osrm_status = "healthy"
    except Exception:
        osrm_status = "offline"

    return {
        "service": "where to PARTH Navigation Backend",
        "status": "online",
        "osrm_endpoint": OSRM_BASE_URL,
        "osrm_status": osrm_status,
    }


@app.post("/api/simulate", response_model=SimulationResponse)
@app.post("/simulate", response_model=SimulationResponse)
async def simulate_dynamic_route(request: DynamicRouteRequest) -> SimulationResponse:
    """
    Unified Simulation Pipeline:
    1. Validate coordinates.
    2. Fetch reference driving route from local OSRM.
    3. Generate realistic simulated NavIC observations with calibrated 1e-8 deg^2 noise.
    4. Execute local OSRM Map Matching with timestamps, radiuses, and bearings.
    5. Choose matched result or clearly labelled Kalman fallback.
    """
    # Step 1 & 2: Fetch reference route from local OSM road graph
    reference_route = await fetch_base_route(
        request.start_lon, request.start_lat, request.end_lon, request.end_lat
    )
    base_coords = reference_route.geometry.get("coordinates", [])

    if len(base_coords) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Reference route geometry contains insufficient coordinates.",
        )

    # Step 3: Calibrated NavIC noise generation
    observations = generate_navic_noise(base_coords)
    raw_trace = [o.coord for o in observations]

    # Step 4: Map matching via local OSRM
    match_status, matching_result = await fetch_osrm_correction(observations)

    # Step 5: Active position and fallback selection
    if match_status == "MATCHED":
        status_label = "MATCHED"
        active_source = "osrm_match"
        kalman_fallback = KalmanFallbackResult(used=False, coordinates=[], uncertainty_meters=None)
    elif match_status == "LOW_CONFIDENCE":
        status_label = "LOW_CONFIDENCE"
        active_source = "kalman_estimate"
        kalman_fallback = apply_kalman_smoothing(observations)
    elif match_status == "NO_MATCH":
        status_label = "NO_MATCH"
        active_source = "kalman_estimate"
        kalman_fallback = apply_kalman_smoothing(observations)
    else:  # OSRM_UNAVAILABLE
        status_label = "OSRM_UNAVAILABLE"
        active_source = "kalman_estimate"
        kalman_fallback = apply_kalman_smoothing(observations)

    return SimulationResponse(
        status=status_label,
        reference_route=reference_route,
        observations=observations,
        raw_trace=raw_trace,
        matching=matching_result,
        kalman_fallback=kalman_fallback,
        active_position_source=active_source,
    )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
