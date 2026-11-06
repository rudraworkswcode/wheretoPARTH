"""
GPS Navigation Backend - FastAPI Application
Simulates NavIC satellite GPS jitter, atmospheric drift, and signal dropouts,
and integrates with OSRM Map Matching to reconstruct road geometries.
Coordinates can be generated progressively with look-ahead support.
"""

import json
import logging
import math
import random
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging & Paths
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
logger = logging.getLogger("navic_navigator")

BASE_DIR: Path = Path(__file__).resolve().parent
MOCK_DATA_DIR: Path = BASE_DIR / "mock_data"
CONFIG_PATH: Path = BASE_DIR / "noise_config.json"

OSRM_LOCAL_URL: str = "http://127.0.0.1:5000/match/v1/driving/{coordinates}"
OSRM_PUBLIC_URL: str = "http://router.project-osrm.org/match/v1/driving/{coordinates}"
FRONTEND_DIST: Path = BASE_DIR / "frontend" / "dist"

MOCK_DATA_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Models & FastAPI Setup
# ---------------------------------------------------------------------------
class RouteSummary(BaseModel):
    route_id: str
    start_point: List[float]
    end_point: List[float]

class SimulationResponse(BaseModel):
    status: str = "success"
    route_id: str
    raw_trace: List[List[float]]
    corrected_trace: Dict[str, Any]

class ProgressiveUpdateResponse(BaseModel):
    status: str = "success"
    route_id: str
    start_index: int
    end_index: int
    coordinates: List[List[float]]
    has_more: bool

app = FastAPI(title="NavIC Navigation Service")

# ---------------------------------------------------------------------------
# Static file serving - FastAPI serves the React build (2-tier architecture)
# ---------------------------------------------------------------------------
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="static")

# ---------------------------------------------------------------------------
# Core Logic
# ---------------------------------------------------------------------------
def load_noise_config() -> Dict[str, float]:
    """
    Loads noise configuration defined in metres.
    Default standard deviation is 6.0 metres (realistic GNSS corridor).
    """
    default_config = {
        "noise_std_meters": 6.0,
        "drift_bias_lat_meters": 0.05,
        "drift_bias_lon_meters": -0.05,
        "dropout_percentage": 0.02,
        "average_dropout_duration": 2.0,
    }
    try:
        if CONFIG_PATH.is_file():
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                cfg = default_config.copy()
                for k, v in data.items():
                    try:
                        cfg[k] = float(v)
                    except (ValueError, TypeError):
                        continue
                return cfg
        return default_config
    except Exception as exc:
        logger.warning(f"Config error, using defaults: {exc}")
        return default_config

def extract_coordinates(geojson_data: Dict[str, Any]) -> List[List[float]]:
    try:
        features = geojson_data.get("features", [])
        if features:
            return [c[:2] for c in features[0]["geometry"]["coordinates"]]
        return [c[:2] for c in geojson_data.get("coordinates", [])]
    except Exception:
        raise ValueError("Invalid GeoJSON LineString format.")

def meters_to_lat_deg(meters: float) -> float:
    return meters / 111139.0

def meters_to_lon_deg(meters: float, lat: float) -> float:
    return meters / (111139.0 * math.cos(math.radians(lat)))

def generate_noisy_point(pt: List[float], index: int, config: Dict[str, float]) -> List[float]:
    """Generates a latitude-aware noisy coordinate within a physically realistic meter corridor."""
    lon, lat = pt[0], pt[1]
    std_m = max(0.5, config.get("noise_std_meters", 6.0))
    drift_lat_m = config.get("drift_bias_lat_meters", 0.05)
    drift_lon_m = config.get("drift_bias_lon_meters", -0.05)

    noise_lat_m = float(np.random.normal(0.0, std_m))
    noise_lon_m = float(np.random.normal(0.0, std_m))
    cum_drift_lat_m = index * drift_lat_m
    cum_drift_lon_m = index * drift_lon_m

    dlat = meters_to_lat_deg(noise_lat_m + cum_drift_lat_m)
    dlon = meters_to_lon_deg(noise_lon_m + cum_drift_lon_m, lat)

    return [round(lon + dlon, 6), round(lat + dlat, 6)]

def generate_navic_noise(geojson_path: Path, config: Dict[str, float]) -> List[List[float]]:
    with open(geojson_path, "r", encoding="utf-8") as f:
        coords = extract_coordinates(json.load(f))

    if len(coords) < 2:
        raise ValueError("Requires at least 2 coordinates.")

    dropout_pct = config.get("dropout_percentage", 0.02)
    noisy_trace = []
    for i, pt in enumerate(coords):
        if 0 < i < len(coords) - 1 and random.random() < dropout_pct:
            continue
        noisy_trace.append(generate_noisy_point(pt, i, config))

    return noisy_trace

async def fetch_osrm_correction(noisy_coords: List[List[float]]) -> Dict[str, Any]:
    if len(noisy_coords) > 100:
        indices = np.linspace(0, len(noisy_coords) - 1, 100, dtype=int)
        sampled_coords = [noisy_coords[idx] for idx in indices]
    else:
        sampled_coords = noisy_coords

    coord_string = ";".join(f"{lon},{lat}" for lon, lat in sampled_coords)
    radius_string = ";".join("50" for _ in sampled_coords)

    params = {
        "geometries": "geojson",
        "overview": "full",
        "steps": "false",
        "radiuses": radius_string
    }

    # Attempt local WSL OSRM container first, then public OSRM fallback
    for url_template in [OSRM_LOCAL_URL, OSRM_PUBLIC_URL]:
        try:
            url = url_template.format(coordinates=coord_string)
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Ok" and data.get("matchings"):
                        best_match = data["matchings"][0]
                        return {
                            "type": "Feature",
                            "properties": {
                                "match_status": "Ok",
                                "confidence": best_match.get("confidence", 0.0),
                            },
                            "geometry": best_match.get("geometry", {}),
                        }
        except Exception as exc:
            logger.debug(f"OSRM endpoint {url_template} failed or timed out: {exc}")
            continue

    # Graceful fallback when OSRM is offline or no matching is found
    return {
        "type": "Feature",
        "properties": {"match_status": "NoMatch", "confidence": 0.0},
        "geometry": {"type": "LineString", "coordinates": sampled_coords},
    }

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/routes", response_model=List[RouteSummary])
def get_routes():
    routes = []
    if MOCK_DATA_DIR.exists():
        for file_path in MOCK_DATA_DIR.glob("*.geojson"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    coords = extract_coordinates(json.load(f))
                if len(coords) >= 2:
                    routes.append(RouteSummary(
                        route_id=file_path.name,
                        start_point=coords[0],
                        end_point=coords[-1]
                    ))
            except Exception:
                continue
    return routes

@app.get("/api/simulate/{route_id}", response_model=SimulationResponse)
async def simulate_route(route_id: str):
    target = route_id if route_id.endswith(".geojson") else f"{route_id}.geojson"
    path = MOCK_DATA_DIR / target

    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Route not found")

    config = load_noise_config()
    noisy_trace = generate_navic_noise(path, config)
    corrected_geojson = await fetch_osrm_correction(noisy_trace)

    return SimulationResponse(
        route_id=target,
        raw_trace=noisy_trace,
        corrected_trace=corrected_geojson,
    )

@app.get("/api/routes/{route_id}/lookahead", response_model=ProgressiveUpdateResponse)
def get_progressive_lookahead(
    route_id: str,
    from_index: int = Query(0, ge=0),
    count: int = Query(5, ge=1, le=20)
):
    """
    Returns progressive coordinate look-ahead ahead of active vehicle position.
    """
    target = route_id if route_id.endswith(".geojson") else f"{route_id}.geojson"
    path = MOCK_DATA_DIR / target
    if not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Route not found")

    with open(path, "r", encoding="utf-8") as f:
        coords = extract_coordinates(json.load(f))

    config = load_noise_config()
    end_idx = min(len(coords), from_index + count)
    slice_coords = coords[from_index:end_idx]

    noisy_slice = [generate_noisy_point(pt, from_index + i, config) for i, pt in enumerate(slice_coords)]

    return ProgressiveUpdateResponse(
        route_id=target,
        start_index=from_index,
        end_index=end_idx,
        coordinates=noisy_slice,
        has_more=end_idx < len(coords)
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
