"""
GPS Simulation Backend - FastAPI Application
Simulates NavIC satellite GPS jitter, atmospheric drift, and signal dropouts,
and integrates with the OSRM (Open Source Routing Machine) Map Matching API
to reconstruct snapped, map-matched road geometries.
"""

import json
import logging
import math
import random
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("navic_simulator")

# ---------------------------------------------------------------------------
# Path & Environment Constants
# ---------------------------------------------------------------------------
BASE_DIR: Path = Path(__file__).resolve().parent
MOCK_DATA_DIR: Path = BASE_DIR / "mock_data"
CONFIG_PATH: Path = BASE_DIR / "noise_config.json"
OSRM_MATCH_URL: str = "http://router.project-osrm.org/match/v1/driving/{coordinates}"

# Ensure mock_data directory exists on startup
MOCK_DATA_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Pydantic Response Models
# ---------------------------------------------------------------------------
class RouteSummary(BaseModel):
    """Metadata summary of an available GeoJSON route."""
    route_id: str = Field(..., description="Filename identifier of the route")
    start_point: List[float] = Field(..., description="[longitude, latitude] of route start")
    end_point: List[float] = Field(..., description="[longitude, latitude] of route finish")


class SimulationResponse(BaseModel):
    """Response payload containing raw noisy points and map-matched GeoJSON."""
    status: str = Field(default="success", description="Status indicator")
    route_id: str = Field(..., description="Queried route identifier")
    raw_trace: List[List[float]] = Field(
        ..., description="Simulated noisy GPS coordinates [[lon, lat], ...]"
    )
    corrected_trace: Dict[str, Any] = Field(
        ..., description="OSRM map-matched GeoJSON feature/geometry"
    )


# ---------------------------------------------------------------------------
# FastAPI Application & CORS Configuration
# ---------------------------------------------------------------------------
app = FastAPI(
    title="NavIC GPS Simulation & Map-Matching Service",
    description="Simulates NavIC constellation noise on GeoJSON routes and matches traces using OSRM.",
    version="1.0.0",
)

# Allow all local origins (all ports on localhost & 127.0.0.1 for local frontend dev)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Helper Functions: Configuration & GeoJSON Parsing
# ---------------------------------------------------------------------------
def load_noise_config(config_path: Path = CONFIG_PATH) -> Dict[str, float]:
    """
    Reads the latest noise configuration from disk.
    
    Returns default parameters if the configuration file is missing or malformed.
    """
    default_config: Dict[str, float] = {
        "latitude_variance": 0.0003,
        "longitude_variance": 0.0003,
        "dropout_percentage": 0.05,
        "drift_bias": 0.0001,
    }

    if not config_path.is_file():
        logger.warning(
            "Noise config file not found at %s. Falling back to default parameters.",
            config_path,
        )
        return default_config

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return {
                "latitude_variance": float(data.get("latitude_variance", default_config["latitude_variance"])),
                "longitude_variance": float(data.get("longitude_variance", default_config["longitude_variance"])),
                "dropout_percentage": float(data.get("dropout_percentage", default_config["dropout_percentage"])),
                "drift_bias": float(data.get("drift_bias", default_config["drift_bias"])),
            }
    except Exception as exc:
        logger.error("Failed to parse noise config at %s: %s", config_path, exc)
        return default_config


def extract_coordinates_from_geojson(geojson_data: Dict[str, Any]) -> List[List[float]]:
    """
    Extracts ordered [lon, lat] coordinate pairs from FeatureCollection, Feature,
    or bare Geometry LineString representations.
    """
    data_type = geojson_data.get("type")

    if data_type == "FeatureCollection":
        features = geojson_data.get("features", [])
        for feat in features:
            geom = feat.get("geometry", {})
            if geom.get("type") == "LineString":
                return [c[:2] for c in geom.get("coordinates", [])]
            if geom.get("type") == "MultiLineString":
                coords = geom.get("coordinates", [])
                if coords and len(coords[0]) > 0:
                    return [c[:2] for c in coords[0]]

    elif data_type == "Feature":
        geom = geojson_data.get("geometry", {})
        if geom.get("type") == "LineString":
            return [c[:2] for c in geom.get("coordinates", [])]

    elif data_type == "LineString":
        return [c[:2] for c in geojson_data.get("coordinates", [])]

    raise ValueError("No supported LineString geometry found in the provided GeoJSON file.")


# ---------------------------------------------------------------------------
# Core Simulation Logic: Dynamic NavIC Noise Generation
# ---------------------------------------------------------------------------
def generate_navic_noise(geojson_path: Path, config: Dict[str, float]) -> List[List[float]]:
    """
    Extracts coordinates from a GeoJSON LineString and applies NavIC simulation noise.
    
    - Variance: Gaussian random perturbation with standard deviation = sqrt(variance).
    - Drift Bias: Systematic temporal cumulative drift simulating NavIC clock / ephemeris drift.
    - Dropout: Drops coordinates stochastically based on dropout_percentage, preserving
      route bounds and maintaining at least 2 points for map matching.
    """
    if not geojson_path.is_file():
        raise FileNotFoundError(f"GeoJSON file '{geojson_path.name}' does not exist.")

    try:
        with open(geojson_path, "r", encoding="utf-8") as f:
            geojson_data = json.load(f)
    except Exception as exc:
        raise ValueError(f"Invalid JSON format in '{geojson_path.name}': {exc}") from exc

    coords = extract_coordinates_from_geojson(geojson_data)
    if len(coords) < 2:
        raise ValueError("LineString must contain at least 2 coordinates.")

    lat_variance = config.get("latitude_variance", 0.0003)
    lon_variance = config.get("longitude_variance", 0.0003)
    drift_bias = config.get("drift_bias", 0.0001)
    dropout_percentage = config.get("dropout_percentage", 0.05)

    # Standard deviations for Gaussian jitter (sigma = sqrt(variance))
    lat_std = math.sqrt(max(0.0, lat_variance))
    lon_std = math.sqrt(max(0.0, lon_variance))

    noisy_trace: List[List[float]] = []
    total_points = len(coords)

    for i, pt in enumerate(coords):
        # Apply dropout check: preserve first and last point so route extent is intact
        is_terminal_point = (i == 0 or i == total_points - 1)
        if not is_terminal_point and (random.random() < dropout_percentage):
            continue  # Drop this coordinate to simulate packet loss / multipath outage

        lon, lat = pt[0], pt[1]

        # NavIC random Gaussian perturbation
        lon_noise = float(np.random.normal(loc=0.0, scale=lon_std))
        lat_noise = float(np.random.normal(loc=0.0, scale=lat_std))

        # Temporal cumulative drift bias along the trajectory
        cumulative_drift = i * drift_bias

        perturbed_lon = round(lon + lon_noise + cumulative_drift, 6)
        perturbed_lat = round(lat + lat_noise + cumulative_drift, 6)

        noisy_trace.append([perturbed_lon, perturbed_lat])

    # Safeguard: ensure minimum 2 points exist for map matching
    if len(noisy_trace) < 2:
        logger.warning("Dropout dropped too many points. Preserving raw endpoints with jitter.")
        noisy_trace = [
            [round(coords[0][0] + lon_noise, 6), round(coords[0][1] + lat_noise, 6)],
            [round(coords[-1][0] + lon_noise, 6), round(coords[-1][1] + lat_noise, 6)],
        ]

    return noisy_trace


# ---------------------------------------------------------------------------
# OSRM Connector: Asynchronous Map-Matching Client
# ---------------------------------------------------------------------------
async def fetch_osrm_correction(noisy_coords: List[List[float]]) -> Dict[str, Any]:
    """
    Sends noisy coordinates to the public OSRM Map Matching service and returns
    snapped, road-matched GeoJSON.
    
    Coordinates are formatted as {lon},{lat};{lon},{lat}.
    Handles public API limits (URL length, max coordinate limits, 429 rate limits).
    """
    if len(noisy_coords) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 points are required for map matching.",
        )

    # OSRM public demo server enforces coordinate limits (typically <= 100 points per call)
    MAX_OSRM_POINTS = 100
    if len(noisy_coords) > MAX_OSRM_POINTS:
        logger.warning(
            "Coordinate count (%d) exceeds OSRM public server threshold. Downsampling to %d points.",
            len(noisy_coords),
            MAX_OSRM_POINTS,
        )
        indices = np.linspace(0, len(noisy_coords) - 1, MAX_OSRM_POINTS, dtype=int)
        sampled_coords = [noisy_coords[idx] for idx in indices]
    else:
        sampled_coords = noisy_coords

    # Build semicolon-separated lon,lat string
    coord_string = ";".join(f"{lon},{lat}" for lon, lat in sampled_coords)
    url = OSRM_MATCH_URL.format(coordinates=coord_string)
    params = {
        "geometries": "geojson",
        "overview": "full",
        "steps": "false",
    }

    async with httpx.AsyncClient(timeout=httpx.Timeout(12.0, connect=5.0)) as client:
        try:
            response = await client.get(url, params=params)

            # Handle rate limiting from public demo server
            if response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Public OSRM demo server rate limit reached. Please retry in a few moments.",
                )

            response.raise_for_status()
            data = response.json()

        except httpx.TimeoutException:
            logger.error("OSRM API request timed out.")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="OSRM Map Matching service timed out. Please try again.",
            )
        except httpx.HTTPStatusError as exc:
            logger.error("OSRM HTTP error: %s - %s", exc.response.status_code, exc.response.text)
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"OSRM API returned error: {exc.response.text}",
            )
        except httpx.RequestError as exc:
            logger.error("Network error while connecting to OSRM: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Unable to connect to OSRM service. Check network connectivity.",
            )

    # Verify OSRM internal status code
    if data.get("code") != "Ok" or not data.get("matchings"):
        logger.warning("OSRM could not match points to road network: %s", data.get("code"))
        # Fallback: construct GeoJSON LineString from sampled points if map-matching failed
        return {
            "type": "Feature",
            "properties": {
                "match_status": "NoMatch",
                "osrm_code": data.get("code", "Unknown"),
                "fallback": True,
            },
            "geometry": {
                "type": "LineString",
                "coordinates": sampled_coords,
            },
        }

    # Extract primary matched geometry
    best_matching = data["matchings"][0]
    matched_geometry = best_matching.get("geometry", {})
    confidence = best_matching.get("confidence", 0.0)

    return {
        "type": "Feature",
        "properties": {
            "match_status": "Ok",
            "confidence": confidence,
            "matched_points_count": len(matched_geometry.get("coordinates", [])),
        },
        "geometry": matched_geometry,
    }


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/api/routes",
    response_model=List[RouteSummary],
    tags=["Routes"],
    summary="List all available route files in mock_data directory",
)
def get_available_routes() -> List[RouteSummary]:
    """
    Dynamically scans the 'mock_data' folder on each request.
    Hot-reloads newly dropped .geojson files without requiring a server restart.
    """
    routes: List[RouteSummary] = []

    if not MOCK_DATA_DIR.exists():
        return routes

    # Scan directory dynamically
    for file_path in sorted(MOCK_DATA_DIR.glob("*.geojson")):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                geojson_data = json.load(f)
            coords = extract_coordinates_from_geojson(geojson_data)
            if len(coords) >= 2:
                routes.append(
                    RouteSummary(
                        route_id=file_path.name,
                        start_point=coords[0],
                        end_point=coords[-1],
                    )
                )
        except Exception as exc:
            logger.warning("Skipping invalid route file '%s': %s", file_path.name, exc)
            continue

    return routes


@app.get(
    "/api/simulate/{route_id}",
    response_model=SimulationResponse,
    tags=["Simulation"],
    summary="Simulate NavIC GPS noise on a route and apply OSRM map-matching",
)
async def simulate_route(route_id: str) -> SimulationResponse:
    """
    1. Loads the specified GeoJSON route from 'mock_data'.
    2. Reads the active 'noise_config.json' dynamically.
    3. Simulates NavIC noise (variance, drift bias, dropouts).
    4. Connects asynchronously to OSRM to generate map-matched geometry.
    5. Returns both raw noisy trace and corrected GeoJSON.
    """
    # Accept route_id with or without .geojson extension
    target_filename = route_id if route_id.endswith(".geojson") else f"{route_id}.geojson"
    geojson_path = MOCK_DATA_DIR / target_filename

    if not geojson_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Route '{target_filename}' not found in 'mock_data'. Available routes can be listed via GET /api/routes.",
        )

    # 1. Read latest config dynamically
    config = load_noise_config(CONFIG_PATH)

    # 2. Generate noisy GPS coordinates
    try:
        raw_noisy_trace = generate_navic_noise(geojson_path, config)
    except Exception as exc:
        logger.error("Simulation error on route '%s': %s", target_filename, exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unable to process route geometry: {str(exc)}",
        )

    # 3. Request OSRM correction
    corrected_geojson = await fetch_osrm_correction(raw_noisy_trace)

    return SimulationResponse(
        status="success",
        route_id=target_filename,
        raw_trace=raw_noisy_trace,
        corrected_trace=corrected_geojson,
    )


# ---------------------------------------------------------------------------
# Server Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

