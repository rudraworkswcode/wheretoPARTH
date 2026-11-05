# where to PARTH — Technology Stack

## 1. Technology Overview

| Technology | Purpose | Status |
|---|---|---|
| React | Frontend website | Planned |
| Node.js | JavaScript runtime/backend | Mentioned; role TBD |
| FastAPI | Python API backend | Implemented |
| OSRM API | Routing and map matching | Integrated for map matching |
| GeoJSON.io | Route geometry creation | Selected |
| NumPy | GPS noise simulation | Used |
| HTTPX | API communication | Used |
| Pydantic | API data models | Used |
| Uvicorn | FastAPI server | Used |
| Motion Primitives | UI components and animations | Optional |
| 21st.dev | UI components | Optional |
| Realtime Colors | Colour exploration | Optional |

## 2. React

React is intended to handle the website interface.

Planned responsibilities:

- Welcome page.
- Brief page.
- Start and destination selection.
- Route display.
- Vehicle display.
- Navigation alerts.

The React frontend is not currently present in the inspected repository.

See `COMPONENTS.md` for the proposed frontend structure.

## 3. Node.js

Node.js is included in the team's proposed stack.

Its exact responsibilities have not been finalised.

No additional Node.js service or framework should be assumed.

## 4. FastAPI

FastAPI is currently used in `main.py`.

Existing responsibilities:

- Route listing.
- GeoJSON processing.
- Noise generation.
- OSRM communication.
- Simulation response generation.

Existing endpoints:

- `GET /api/routes`
- `GET /api/simulate/{route_id}`

## 5. OSRM API

OSRM stands for Open Source Routing Machine.

The current project uses its Map Matching functionality.

Endpoint currently used:

`http://router.project-osrm.org/match/v1/driving/{coordinates}`

The purpose is to associate noisy location traces with the underlying road network.

OSRM map matching does not guarantee lane-level navigation.

## 6. GeoJSON.io

GeoJSON.io will be used to:

- Create route geometries.
- Edit route geometries.
- Inspect route coordinates.
- Export GeoJSON data.

The backend reads route files from `mock_data/`.

## 7. GPS Noise Generator

The existing Python backend uses NumPy and Python's random module.

It simulates:

- Gaussian coordinate jitter.
- Cumulative positional drift.
- Missing coordinate observations.

Configuration is stored in `noise_config.json`.

There is a known configuration-key mismatch documented in `Architecture.md`.

## 8. Vehicle Simulation

The team intends to simulate vehicle movement along predefined routes.

The separate vehicle simulation script is not currently present in the inspected repository.

## 9. Optional UI Resources

### Motion Primitives
Can be explored for animation and interface motion.

### 21st.dev
Can be explored for reusable UI components.

### Realtime Colors
Can be explored for colour combinations and interface design.

These are optional resources, not mandatory dependencies.

## 10. Current Python Dependencies

The repository's `requirements.txt` contains:

- FastAPI
- Uvicorn
- HTTPX
- NumPy
- Pydantic

## 11. Colour Palette

| Colour | Hex |
|---|---|
| Red | `#FF0000` |
| Neon Orange | `#FF5F1F` |
| White | `#FFFFFF` |
| Black | `#000000` |

Suggested CSS variables:

```css
:root {
  --parth-red: #FF0000;
  --parth-neon-orange: #FF5F1F;
  --parth-white: #FFFFFF;
  --parth-black: #000000;
}
```

## 12. Technologies Not Yet Selected

The following are not confirmed:

- Database.
- Authentication provider.
- Map-rendering library.
- CSS framework.
- State-management library.
- Deployment provider.
- Testing framework.

Do not add these to the official stack without approval.