"""
GPS Simulation Backend - FastAPI Application
Simulates NavIC satellite GPS jitter, atmospheric drift, and signal dropouts,
and integrates with a local OSRM Map Matching container to reconstruct road geometries.
"""

import json
import logging
import math
import random
from pathlib import Path
from typing import Any, Dict, List

import httpx
import numpy as np
import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Logging & Paths
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)-7s | %(message)s")
logger = logging.getLogger("navic_simulator")

BASE_DIR: Path = Path(__file__).resolve().parent
MOCK_DATA_DIR: Path = BASE_DIR / "mock_data"
CONFIG_PATH: Path = BASE_DIR / "noise_config.json"

# Pointing to local WSL Docker container or public fallback
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

app = FastAPI(title="NavIC Simulation Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Core Logic
# ---------------------------------------------------------------------------
def load_noise_config() -> Dict[str, float]:
    default_config = {
        "latitude_variance": 0.00005,
        "longitude_variance": 0.00005,
        "dropout_percentage": 0.02,
        "drift_bias": 0.00001,
        "drift_bias_lat": 0.00001,
        "drift_bias_lon": -0.00001,
        "average_dropout_duration": 2.0,
    }
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            cfg = default_config.copy()
            for k, v in data.items():
                try:
                    cfg[k] = float(v)
                except (ValueError, TypeError):
                    continue
            return cfg
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

def generate_navic_noise(geojson_path: Path, config: Dict[str, float]) -> List[List[float]]:
    with open(geojson_path, "r", encoding="utf-8") as f:
        coords = extract_coordinates(json.load(f))

    if len(coords) < 2:
        raise ValueError("Requires at least 2 coordinates.")

    lat_std = math.sqrt(max(0.0, config.get("latitude_variance", 0.00005)))
    lon_std = math.sqrt(max(0.0, config.get("longitude_variance", 0.00005)))
    drift_lat = config.get("drift_bias_lat", config.get("drift_bias", 0.00001))
    drift_lon = config.get("drift_bias_lon", -config.get("drift_bias", 0.00001))
    dropout_pct = config.get("dropout_percentage", 0.02)

    noisy_trace = []
    for i, pt in enumerate(coords):
        if 0 < i < len(coords) - 1 and random.random() < dropout_pct:
            continue 

        lon_noise = float(np.random.normal(0.0, lon_std))
        lat_noise = float(np.random.normal(0.0, lat_std))
        cumulative_drift_lon = i * drift_lon
        cumulative_drift_lat = i * drift_lat

        noisy_trace.append([
            round(pt[0] + lon_noise + cumulative_drift_lon, 6),
            round(pt[1] + lat_noise + cumulative_drift_lat, 6)
        ])

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

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)