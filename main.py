"""
where to PARTH — Unified Navigation Backend
FastAPI service interfacing with local OpenStreetMap + OSRM routing engine.
Executes:
1. Dynamic route request validation.
2. Reference driving route fetch via local OSRM /route.
3. Realistic NavIC GNSS noise observation simulation with calibrated 1e-8 deg^2 variance.
4. OSRM map-matching via local /match with timestamps, radiuses, and movement bearings.
5. Kalman filter fallback smoothing (metric coordinate frame) when matching fails or has low confidence.
6. Direct static asset and SPA serving of compiled React frontend.
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
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Logging & Environment Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
logger = logging.getLogger("parth_backend")

BASE_DIR: Path = Path(__file__).resolve().parent
CONFIG_PATH: Path = BASE_DIR / "noise_config.json"
STATIC_DIR: Path = BASE_DIR / "static"
ASSETS_DIR: Path = STATIC_DIR / "assets"

# Local OSRM Service URL (Dynamic via env, default to local port 5000)
def get_osrm_base_url() -> str:
    return os.getenv("OSRM_BASE_URL", "http://127.0.0.1:5000").rstrip("/")

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
    def validate_coordinate_displacement(self) -> "DynamicRouteRequest":
        dist = haversine_distance(self.start_lon, self.start_lat, self.end_lon, self.end_lat)
        if dist < 10.0:
            raise ValueError(
                f"Origin and destination coordinates are too close ({dist:.1f} m). Minimum distance required is 10 m."
            )
        return self


class TurnStep(BaseModel):
    name: Optional[str] = "Road"
    instruction: str
    distance_meters: float
    duration_seconds: float
    location: List[float]  # [lon, lat]
    type: Optional[str] = "turn"
    modifier: Optional[str] = None
    lane_guidance: Optional[str] = "Stay in Lane"


class ReferenceRoute(BaseModel):
    geometry: Dict[str, Any]  # GeoJSON LineString
    distance_meters: float
    duration_seconds: float
    steps: List[TurnStep] = Field(default_factory=list)


class ObservationPoint(BaseModel):
    index: int
    coord: List[float]  # [lon, lat]
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
# FastAPI Application & Static Assets Mounting
# ---------------------------------------------------------------------------
app = FastAPI(
    title="where to PARTH Navigation Service",
    description="Local OSM + OSRM routing, NavIC GNSS simulation, OSRM map-matching, and Kalman fallback.",
    version="2.0.0",
)

# Enable full CORS for frontend dev server
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount compiled static assets folder if present
if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")


# ---------------------------------------------------------------------------
# Geodetic & Coordinate Math Helpers
# ---------------------------------------------------------------------------
def haversine_distance(
    lon1: Any, lat1: Any, lon2: Optional[float] = None, lat2: Optional[float] = None
) -> float:
    if isinstance(lon1, (list, tuple)) and isinstance(lat1, (list, tuple)):
        p1, p2 = lon1, lat1
        _lon1, _lat1 = float(p1[0]), float(p1[1])
        _lon2, _lat2 = float(p2[0]), float(p2[1])
    else:
        _lon1, _lat1 = float(lon1), float(lat1)
        _lon2, _lat2 = float(lon2), float(lat2)

    R = 6371000.0
    phi1 = math.radians(_lat1)
    phi2 = math.radians(_lat2)
    delta_phi = math.radians(_lat2 - _lat1)
    delta_lambda = math.radians(_lon2 - _lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))
    return R * c


def calculate_bearing(
    lon1: Any, lat1: Any, lon2: Optional[float] = None, lat2: Optional[float] = None
) -> float:
    if isinstance(lon1, (list, tuple)) and isinstance(lat1, (list, tuple)):
        p1, p2 = lon1, lat1
        _lon1, _lat1 = float(p1[0]), float(p1[1])
        _lon2, _lat2 = float(p2[0]), float(p2[1])
    else:
        _lon1, _lat1 = float(lon1), float(lat1)
        _lon2, _lat2 = float(lon2), float(lat2)

    if _lon1 == _lon2 and _lat1 == _lat2:
        return 0.0

    phi1 = math.radians(_lat1)
    phi2 = math.radians(_lat2)
    delta_lambda = math.radians(_lon2 - _lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing_rad = math.atan2(y, x)
    return (math.degrees(bearing_rad) + 360.0) % 360.0


def variance_deg2_to_meters(lat_deg: float, var_lat_deg2: float, var_lon_deg2: float) -> float:
    m_per_deg_lat = 111132.92 - 559.82 * math.cos(2 * math.radians(lat_deg))
    m_per_deg_lon = 111412.84 * math.cos(math.radians(lat_deg))
    sigma_lat_m = math.sqrt(var_lat_deg2) * m_per_deg_lat
    sigma_lon_m = math.sqrt(var_lon_deg2) * m_per_deg_lon
    return math.sqrt(sigma_lat_m**2 + sigma_lon_m**2)


# ---------------------------------------------------------------------------
# 1. Fetch Reference Route (Local OSRM /route)
# ---------------------------------------------------------------------------
async def fetch_base_route(
    start_lon: float, start_lat: float, end_lon: float, end_lat: float
) -> ReferenceRoute:
    coord_str = f"{start_lon},{start_lat};{end_lon},{end_lat}"
    url = f"{get_osrm_base_url()}/route/v1/driving/{coord_str}"
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",
    }

    try:
        async with httpx.AsyncClient(timeout=OSRM_HTTP_TIMEOUT) as client:
            response = await client.get(url, params=params)
    except (httpx.ConnectError, httpx.TimeoutException, httpx.NetworkError) as exc:
        base_url = get_osrm_base_url()
        logger.error(f"Failed to connect to local OSRM at {base_url}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "OSRM_UNAVAILABLE",
                "message": f"Local OSRM service is unreachable at {base_url}. Ensure local OSRM container is running with the prepared regional road graph.",
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

            m_mod_str = str(m_mod) if m_mod else None
            m_mod_lower = m_mod_str.lower() if m_mod_str else ""
            if "right" in m_mod_lower:
                lane_rec = "Shift to Right Turn Lane" if "sharp" in m_mod_lower else "Stay in Right Lane"
            elif "left" in m_mod_lower:
                lane_rec = "Shift to Left Turn Lane" if "sharp" in m_mod_lower else "Stay in Left Lane"
            else:
                lane_rec = "Maintain Cruising Lane"

            parsed_steps.append(
                TurnStep(
                    name=s_name,
                    instruction=instruction,
                    distance_meters=float(s.get("distance", 0.0)),
                    duration_seconds=float(s.get("duration", 0.0)),
                    location=[float(m_loc[0]), float(m_loc[1])] if len(m_loc) >= 2 else [0.0, 0.0],
                    type=str(m_type),
                    modifier=m_mod_str,
                    lane_guidance=lane_rec,
                )
            )

    return ReferenceRoute(
        geometry=geometry,
        distance_meters=distance_meters,
        duration_seconds=duration_seconds,
        steps=parsed_steps,
    )


# ---------------------------------------------------------------------------
# 2. Simulated NavIC Observation Generation
# ---------------------------------------------------------------------------
def generate_navic_noise(
    base_coords: List[List[float]],
    start_timestamp: Optional[int] = None,
) -> List[ObservationPoint]:
    if not base_coords:
        return []

    if start_timestamp is None:
        start_timestamp = int(time.time())

    std_lat_deg = math.sqrt(LATITUDE_VARIANCE_DEG2)
    std_lon_deg = math.sqrt(LONGITUDE_VARIANCE_DEG2)

    avg_lat = sum(c[1] for c in base_coords) / len(base_coords)
    horizontal_accuracy_m = round(
        variance_deg2_to_meters(avg_lat, LATITUDE_VARIANCE_DEG2, LONGITUDE_VARIANCE_DEG2),
        2,
    )

    observations: List[ObservationPoint] = []
    current_time = float(start_timestamp)
    total_points = len(base_coords)

    for i, pt in enumerate(base_coords):
        is_endpoint = (i == 0 or i == total_points - 1)

        if not is_endpoint and random.random() < DROPOUT_PERCENTAGE:
            continue

        if is_endpoint:
            obs_lon = pt[0]
            obs_lat = pt[1]
        else:
            obs_lon = pt[0] + random.gauss(0.0, std_lon_deg)
            obs_lat = pt[1] + random.gauss(0.0, std_lat_deg)

        if i > 0:
            step_dist = haversine_distance(
                base_coords[i - 1][0],
                base_coords[i - 1][1],
                pt[0],
                pt[1],
            )
            dt = max(1.0, step_dist / SIMULATED_SPEED_MPS)
            current_time += dt

        observations.append(
            ObservationPoint(
                index=i,
                coord=[round(obs_lon, 6), round(obs_lat, 6)],
                timestamp=int(round(current_time)),
                accuracy_meters=horizontal_accuracy_m,
                bearing=None,
            )
        )

    for k in range(len(observations)):
        if k < len(observations) - 1:
            p1 = observations[k].coord
            p2 = observations[k + 1].coord
            raw_bearing = calculate_bearing(p1[0], p1[1], p2[0], p2[1])
            noisy_bearing = (raw_bearing + random.gauss(0.0, 5.0) + 360.0) % 360.0
            observations[k].bearing = round(noisy_bearing, 1)
        elif k > 0:
            observations[k].bearing = observations[k - 1].bearing
        else:
            observations[k].bearing = None

    return observations


# ---------------------------------------------------------------------------
# 3. Local OSRM Map Matching with Overlapping Windows
# ---------------------------------------------------------------------------
async def match_single_window(
    window_obs: List[ObservationPoint],
) -> Tuple[Dict[str, Any], int]:
    coord_string = ";".join(f"{o.coord[0]},{o.coord[1]}" for o in window_obs)
    timestamp_string = ";".join(str(o.timestamp) for o in window_obs)
    radius_string = ";".join(str(o.accuracy_meters) for o in window_obs)
    bearing_string = ";".join(
        f"{int(round(o.bearing))},25" if o.bearing is not None else "" for o in window_obs
    )

    url = f"{get_osrm_base_url()}/match/v1/driving/{coord_string}"
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
    if len(observations) < 2:
        return "NO_MATCH", MatchingResult(status="insufficient_observations", total_tracepoints=len(observations))

    windows: List[List[ObservationPoint]] = []
    step = MAX_MATCHING_BATCH_SIZE - MATCHING_OVERLAP
    i = 0
    while i < len(observations):
        batch = observations[i : i + MAX_MATCHING_BATCH_SIZE]
        if len(batch) >= 2:
            windows.append(batch)
        if i + MAX_MATCHING_BATCH_SIZE >= len(observations):
            break
        i += step

    matched_coords: List[List[float]] = []
    matched_positions: List[List[float]] = []
    confidences: List[float] = []
    total_tracepoints = len(observations)
    tracepoints_matched_count = 0
    had_osrm_network_error = False

    for window_obs in windows:
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

        for m in matchings:
            conf = m.get("confidence", 0.0)
            if conf > 0:
                confidences.append(conf)
            coords = m.get("geometry", {}).get("coordinates", [])
            for c in coords:
                if not matched_coords or matched_coords[-1] != c:
                    matched_coords.append(c)

        for tp in tracepoints:
            if tp and tp.get("location"):
                tracepoints_matched_count += 1
                loc = tp["location"]
                matched_positions.append([loc[0], loc[1]])

    if had_osrm_network_error and not matched_coords:
        return "OSRM_UNAVAILABLE", MatchingResult(
            status="OSRM_UNAVAILABLE",
            confidence=0.0,
            total_tracepoints=total_tracepoints,
        )

    if not matched_coords:
        return "NO_MATCH", MatchingResult(
            status="NO_MATCH",
            confidence=0.0,
            total_tracepoints=total_tracepoints,
        )

    avg_confidence = float(np.mean(confidences)) if confidences else 0.0

    if avg_confidence < CONFIDENCE_THRESHOLD:
        return "LOW_CONFIDENCE", MatchingResult(
            status="LOW_CONFIDENCE",
            confidence=round(avg_confidence, 3),
            geometry={"type": "LineString", "coordinates": matched_coords},
            matched_positions=matched_positions,
            tracepoints_matched=tracepoints_matched_count,
            total_tracepoints=total_tracepoints,
        )

    return "MATCHED", MatchingResult(
        status="MATCHED",
        confidence=round(avg_confidence, 3),
        geometry={"type": "LineString", "coordinates": matched_coords},
        matched_positions=matched_positions,
        tracepoints_matched=tracepoints_matched_count,
        total_tracepoints=total_tracepoints,
    )


# ---------------------------------------------------------------------------
# 4. 4D Metric Constant-Velocity Kalman Filter Fallback
# ---------------------------------------------------------------------------
def apply_kalman_smoothing(
    observations: List[ObservationPoint],
) -> KalmanFallbackResult:
    if len(observations) < 2:
        return KalmanFallbackResult(
            used=True,
            coordinates=[o.coord for o in observations],
            uncertainty_meters=50.0,
            status="insufficient_data",
        )

    origin_lon = observations[0].coord[0]
    origin_lat = observations[0].coord[1]

    meters_per_deg_lat = 111132.92
    meters_per_deg_lon = 111412.84 * math.cos(math.radians(origin_lat))

    metric_measurements = []
    timestamps = []
    for obs in observations:
        xm = (obs.coord[0] - origin_lon) * meters_per_deg_lon
        ym = (obs.coord[1] - origin_lat) * meters_per_deg_lat
        metric_measurements.append(np.array([xm, ym]))
        timestamps.append(obs.timestamp)

    dt_init = max(1.0, float(timestamps[1] - timestamps[0]))
    vx0 = (metric_measurements[1][0] - metric_measurements[0][0]) / dt_init
    vy0 = (metric_measurements[1][1] - metric_measurements[0][1]) / dt_init

    x_state = np.array([metric_measurements[0][0], metric_measurements[0][1], vx0, vy0], dtype=float)
    P = np.diag([100.0, 100.0, 25.0, 25.0]).astype(float)
    H = np.array([[1.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]])
    R = np.diag([12.0**2, 12.0**2]).astype(float)
    q_val = 0.5

    filtered_metric: List[Tuple[float, float]] = [(x_state[0], x_state[1])]

    for k in range(1, len(metric_measurements)):
        dt = max(0.1, float(timestamps[k] - timestamps[k - 1]))
        F = np.array([
            [1.0, 0.0, dt, 0.0],
            [0.0, 1.0, 0.0, dt],
            [0.0, 0.0, 1.0, 0.0],
            [0.0, 0.0, 0.0, 1.0],
        ])
        Q = np.array([
            [(dt**4) / 4.0, 0.0, (dt**3) / 2.0, 0.0],
            [0.0, (dt**4) / 4.0, 0.0, (dt**3) / 2.0],
            [(dt**3) / 2.0, 0.0, dt**2, 0.0],
            [0.0, (dt**3) / 2.0, 0.0, dt**2],
        ]) * q_val

        x_pred = F @ x_state
        P_pred = F @ P @ F.T + Q

        z = metric_measurements[k]
        y_residual = z - (H @ x_pred)
        S = H @ P_pred @ H.T + R
        K = P_pred @ H.T @ np.linalg.inv(S)

        x_state = x_pred + (K @ y_residual)
        P = (np.eye(4) - (K @ H)) @ P_pred
        filtered_metric.append((x_state[0], x_state[1]))

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
    osrm_status = "unreachable"
    base_url = get_osrm_base_url()
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{base_url}/route/v1/driving/77.47,12.90;77.52,12.85?overview=false")
            if resp.status_code == 200:
                osrm_status = "healthy"
    except Exception:
        osrm_status = "offline"

    return {
        "service": "where to PARTH Navigation Backend",
        "status": "online",
        "osrm_endpoint": base_url,
        "osrm_status": osrm_status,
    }


@app.post("/api/simulate", response_model=SimulationResponse)
@app.post("/simulate", response_model=SimulationResponse)
async def simulate_dynamic_route(request: DynamicRouteRequest) -> SimulationResponse:
    reference_route = await fetch_base_route(
        request.start_lon, request.start_lat, request.end_lon, request.end_lat
    )

    base_coords = reference_route.geometry.get("coordinates", [])
    if len(base_coords) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Reference route geometry contains insufficient coordinates.",
        )

    observations = generate_navic_noise(base_coords)
    raw_trace = [o.coord for o in observations]

    match_status, matching_result = await fetch_osrm_correction(observations)

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
    else:
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


# ---------------------------------------------------------------------------
# SPA Catch-All Route (Client-side React Router Fallback)
# ---------------------------------------------------------------------------
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    file_path = STATIC_DIR / full_path
    if full_path and file_path.is_file():
        return FileResponse(str(file_path))

    index_file = STATIC_DIR / "index.html"
    if index_file.is_file():
        return FileResponse(str(index_file))

    return {
        "service": "where to PARTH Navigation Backend",
        "message": "API online. Build frontend into static/ to serve UI directly.",
    }


if __name__ == "__main__":
    server_port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host="0.0.0.0", port=server_port, reload=True)
