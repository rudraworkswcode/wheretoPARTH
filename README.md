# where to PARTH — Lane-Level Navigation Pipeline

> **Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way.**
>
> **Dw, Abhimanyu. This time, we'll get you out.**

**where to PARTH** is an intelligent navigation system built for the 24-hour hackathon problem statement:
- **Problem Statement:** Lane-Level Vehicle Navigation Using NavIC Satellite Signals
- **Problem Statement ID:** DL-SJBIT-HK26-GOVP009

---

## Architecture & Navigation Pipeline

The project replaces static route corridors with a locally hosted OpenStreetMap road graph and OSRM routing engine:

```text
[Frontend: Departure & Destination Coordinates]
                     │
                     ▼
             [POST /api/simulate]
                     │
                     ▼
       [Local OSRM /route Engine]
  (Queries local OSM road graph for driving reference corridor)
                     │
                     ▼
     [Calibrated NavIC GNSS Simulation]
  (1e-8 deg² variance, ~15.5m error, timestamps, observed bearings)
                     │
                     ▼
       [Local OSRM /match Engine]
  (Overlapping windows ≤40 coords, radiuses, timestamps, bearings)
                     │
           ┌─────────┴─────────┐
      [MATCHED]        [LOW_CONFIDENCE / NO_MATCH]
           │                         │
           ▼                         ▼
   [OSRM Snapped Road]     [4D Metric Kalman Filter Fallback]
           │                         │
           └─────────┬───────────────┘
                     │
                     ▼
 [Truthful Visualisation: Leaflet Map, Telemetry HUD, Advance Alerts]
```

1. **Dynamic Reference Route**: The user selects or inputs origin and destination coordinates. The backend queries the local OSRM routing service (`/route`) using the prepared OpenStreetMap road network.
2. **Calibrated GNSS Noise**: Simulates satellite positioning observations along the reference route with calibrated degree-squared variance ($10^{-8} \text{ deg}^2$, standard deviation $0.0001^\circ \approx 11.1\text{m}$ in latitude, converted to horizontal accuracy $\approx 15.5\text{m}$), strictly monotonic Unix timestamps, and observed movement bearings.
3. **OSRM Map Matching**: Sends ordered observations to local OSRM `/match` in sequential overlapping windows of at most 40 coordinates to maintain local topological continuity.
4. **Kalman Fallback**: When matching fails (`NO_MATCH`) or returns a low-confidence result (`LOW_CONFIDENCE`), a 4D constant-velocity Kalman filter ($[x, y, v_x, v_y]$) computes metric-frame smoothed positions. This estimate is explicitly labeled as `kalman_estimate` and is **never** represented as an OSRM road match.
5. **Truthful UI State**: The frontend Leaflet map renders the reference corridor, raw noisy GPS fixes, deep blue matched route (only when matched), and amber Kalman estimate (only when fallback is active), with telemetry reflecting measured accuracy.

---

## Technical Disclosures & Limitations

- **Reference Route vs Ground Truth**: The route returned by OSRM `/route` is a reference driving corridor for simulation. It is not real-world ground truth or proof of a vehicle's actual path.
- **Simulated GNSS vs Live NavIC**: The project models satellite positioning noise through mathematical Gaussian jitter, drift, and dropouts. It does not interface with raw RF hardware receivers.
- **Road Snapping vs Lane Positioning**: OSRM map-matching snaps coordinates to digital road centerlines. True lane-level guidance depends on detailed road width and lane metadata in the underlying map data. When lane attributes are absent, road-level guidance is safely provided.

---

## Local OSM and OSRM Infrastructure Setup

The backend connects directly to a locally hosted OSRM service. No public OSRM demo server is used.

### 1. Download Regional OpenStreetMap PBF
Download a regional `.osm.pbf` file (e.g., `karnataka-latest.osm.pbf` or `southern-zone-latest.osm.pbf`) from [Geofabrik Asia / India](https://download.geofabrik.de/asia/india.html):
```bash
mkdir -p osrm-data
# Place your downloaded PBF file into osrm-data/:
# Example: osrm-data/karnataka-latest.osm.pbf
```

### 2. Prepare OSRM Graph (One-Time Preparation)
Run the reproducible graph preparation script using the pinned OSRM Docker image (`ghcr.io/project-osrm/osrm-backend:v5.27.1`):

**Linux / macOS / WSL:**
```bash
chmod +x ./scripts/prepare_osrm.sh
./scripts/prepare_osrm.sh ./osrm-data karnataka-latest.osm.pbf
```

**Windows PowerShell:**
```powershell
.\scripts\prepare_osrm.ps1 -DataDir .\osrm-data -PbfName karnataka-latest.osm.pbf
```

This runs:
1. `osrm-extract -p /opt/car.lua /data/<region>.osm.pbf`
2. `osrm-partition /data/<region>.osrm`
3. `osrm-customize /data/<region>.osrm`

### 3. Run with Docker Compose
Start the complete stack (OSRM service, FastAPI backend, React frontend):
```bash
docker compose up
```
- **OSRM Service**: `http://localhost:5000`
- **FastAPI Backend**: `http://localhost:8000` (Interactive docs: `http://localhost:8000/docs`)
- **React Frontend**: `http://localhost:5173`

---

## Manual / Local Development Setup

### Backend (FastAPI)
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Run backend (points to local OSRM at http://127.0.0.1:5000)
export OSRM_BASE_URL=http://127.0.0.1:5000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

---

## API Contract

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "service": "where to PARTH Navigation Backend",
  "status": "online",
  "osrm_endpoint": "http://127.0.0.1:5000",
  "osrm_status": "healthy"
}
```

### Dynamic Simulation Pipeline
```http
POST /api/simulate
Content-Type: application/json
```

**Request Body:**
```json
{
  "start_lon": 77.471314,
  "start_lat": 12.905128,
  "end_lon": 77.526668,
  "end_lat": 12.856989
}
```

**Response Body:**
```json
{
  "status": "MATCHED",
  "reference_route": {
    "geometry": {
      "type": "LineString",
      "coordinates": [[77.471314, 12.905128], ...]
    },
    "distance_meters": 8412.5,
    "duration_seconds": 634.0,
    "steps": [
      {
        "name": "Kanakapura Road",
        "instruction": "Turn left onto Kanakapura Road",
        "distance_meters": 450.0,
        "duration_seconds": 36.0,
        "type": "turn",
        "modifier": "left",
        "location": [77.4812, 12.8914]
      }
    ]
  },
  "observations": [
    {
      "index": 0,
      "coord": [77.471289, 12.905141],
      "timestamp": 1790000000,
      "accuracy_meters": 15.5,
      "bearing": 135.2
    }
  ],
  "raw_trace": [[77.471289, 12.905141], ...],
  "matching": {
    "status": "Ok",
    "confidence": 0.88,
    "geometry": { "type": "LineString", "coordinates": [...] },
    "matched_positions": [[77.471314, 12.905128], ...]
  },
  "kalman_fallback": {
    "used": false,
    "coordinates": [],
    "uncertainty_meters": null
  },
  "active_position_source": "osrm_match"
}
```

---

## Testing

Run unit and integration tests covering coordinate validation, noise calibration, window batching, Kalman filtering, and parallel-road disambiguation:
```bash
pytest tests/ -v
```
