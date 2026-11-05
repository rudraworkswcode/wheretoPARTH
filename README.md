# where to PARTH

> **Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way.**
>
> **Don't worry, Abhimanyu. This time, we'll get you out.**

**where to PARTH** is a software-based navigation prototype developed for the 24-hour hackathon problem statement:

**Lane-Level Vehicle Navigation Using NavIC Satellite Signals****Problem Statement ID:** 

Problem Statement ID: DL-SJBIT-HK26-GOVP009

The project explores how inaccurate vehicle-position data can be simulated, matched against road geometry and used as a foundation for more precise route guidance.

---

## Project Overview

Navigation systems can experience positioning errors that result in incorrect road identification and late turn notifications.

where to PARTH aims to address this problem through a software-based navigation workflow.

The current backend:
1. Loads predefined GeoJSON route geometry.
2. Generates simulated GPS noise.
3. Sends noisy coordinates to the OSRM Map Matching API.
4. Returns the noisy trace and matched or fallback geometry.

The intended complete product will also provide vehicle simulation, route visualisation and advance navigation alerts approximately 1 km before upcoming manoeuvres.

**Important:** The current implementation simulates positioning noise. It does not receive live NavIC satellite measurements. OSRM map matching alone does not guarantee lane-level positioning.

---

## Current Features

- FastAPI backend.
- Dynamic GeoJSON route discovery.
- GeoJSON LineString extraction.
- Gaussian GPS coordinate noise.
- Cumulative positional drift.
- Simulated coordinate dropout.
- OSRM Map Matching API integration.
- Matched GeoJSON response.
- No-match fallback handling.
- API error handling for missing routes and OSRM failures.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React (planned) |
| JavaScript Runtime | Node.js (role TBD) |
| Backend | FastAPI |
| Routing / Matching | OSRM API |
| Route Geometry | GeoJSON |
| Route Editor | GeoJSON.io |
| Numerical Processing | NumPy |
| HTTP Requests | HTTPX |
| Data Models | Pydantic |
| ASGI Server | Uvicorn |

### Optional UI Resources

- Motion Primitives
- 21st.dev
- Realtime Colors

These are optional resources and have not been established as project dependencies.

---

## Repository Structure

```text
wheretoPARTH/
│
├── main.py
│   └── FastAPI application
│       ├── Route listing
│       ├── GeoJSON processing
│       ├── GPS noise generation
│       └── OSRM map matching
│
├── noise_config.json
│   └── GPS noise configuration
│
├── requirements.txt
│   └── Python dependencies
│
├── mock_data/
│   ├── route_exit_A.geojson
│   └── return_route.geojson
│
├── README.md
│
├── PRD.md
├── Architecture.md
├── Tech-stack.md
├── User-Flow.md
├── Criteria.md
├── Sample Data.md
└── COMPONENTS.md
```

**Note:** The React frontend structure described in COMPONENTS.md is planned. The current repository does not yet contain the frontend directory.

---

## Getting Started

### Prerequisites

- Python 3.10 or newer.
- pip.
- Internet connectivity for the public OSRM demo service.

### Step 1 — Clone the Repository

```bash
git clone https://github.com/rudraworkswcode/wheretoPARTH.git

cd wheretoPARTH
```

### Step 2 — Create a Virtual Environment

**Windows:**

```powershell
python -m venv .venv

.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
python3 -m venv .venv

source .venv/bin/activate
```

### Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4 — Start the FastAPI Backend

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Alternatively:

```bash
python main.py
```

### Backend URLs

| Resource | URL |
|---|---|
| API | http://127.0.0.1:8000 |
| Swagger Documentation | http://127.0.0.1:8000/docs |
| OpenAPI Schema | http://127.0.0.1:8000/openapi.json |

---

## API Reference

### 1. GET `/api/routes`

Returns available GeoJSON route files from the `mock_data/` directory.

Example:

```http
GET http://127.0.0.1:8000/api/routes
```

Example response:

```json
[
  {
    "route_id": "route_exit_A.geojson",
    "start_point": [77.59129, 12.97159],
    "end_point": [77.6005, 12.9765]
  }
]
```

Coordinates follow GeoJSON order:

`[longitude, latitude]`

### 2. GET `/api/simulate/{route_id}`

Generates simulated GPS noise and requests OSRM map matching.

Example:

```http
GET http://127.0.0.1:8000/api/simulate/route_exit_A
```

The route identifier can be supplied with or without the `.geojson` extension.

### Response Fields

| Field | Description |
|---|---|
| status | Request status |
| route_id | Selected route file |
| raw_trace | Simulated noisy coordinates |
| corrected_trace | Matched or fallback GeoJSON Feature |

### Match Status

The `corrected_trace.properties.match_status` field indicates the result:

- `Ok` — OSRM returned a matched geometry.
- `NoMatch` — OSRM did not return a match and the backend generated a fallback geometry.

The fallback must not be presented as verified road-matched geometry.

---

## Route Catalogue

The project uses three named geographical locations.

| Location | Initial Role |
|---|---|
| Kengeri | Starting point |
| Kanakapura | Starting point |
| Somapura | Destination |

### Supplied Routes

| Route ID | From | To | Preference |
|---|---|---|---|
| R-01 | Kengeri | Kanakapura | Faster |
| R-02 | Kanakapura | Kengeri | Normal |
| R-03 | Somapura | Kengeri | Normal |
| R-04 | Somapura | Kanakapura | Normal |
| R-05 | Kengeri | Kanakapura | Slower |

The current sample GeoJSON files are generic route examples. Their coordinates have not yet been verified as the actual Kengeri, Kanakapura and Somapura journeys.

Verified route geometry must be supplied before using these files for real-world navigation demonstrations.

---

## Planned Website Experience

The intended user journey consists of five stages.

### 1. Welcome Page

Displays:

"Welcome to where to PARTH - Your smarter way to navigate through Life"

Visual requirements:
- F1-inspired design.
- Two F1 cars.
- One car approaching from the left.
- Another approaching from the right.
- Both cars racing diagonally across the screen simultaneously.

### 2. Brief Page

Displays:

"Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way.

Dw, Abhimanyu. This time, we'll get you out."

### 3. Location Selection

Allows users to choose a starting point and destination from the supported route catalogue.

### 4. Route Display

Displays the selected route and relevant geographical information.

### 5. Navigation

The intended navigation experience includes:
- Vehicle simulation.
- Position updates.
- Upcoming manoeuvre detection.
- Advance notifications approximately 1 km before turns.

These frontend and navigation features are planned rather than implemented in the current repository snapshot.

---

## Design Guidelines

### Colour Palette

| Colour | Hex |
|---|---|
| Red | `#FF0000` |
| Neon Orange | `#FF5F1F` |
| White | `#FFFFFF` |
| Black | `#000000` |

### Design Direction

The interface follows an F1-inspired racing aesthetic with strong contrast, racing visuals and clear navigation information.

---

## Known Issues and Limitations

### 1. Noise Configuration Mismatch

`main.py` reads `drift_bias`, but `noise_config.json` contains `drift_bias_lat` and `drift_bias_lon`.

The backend therefore falls back to its default drift value unless the configuration or code is aligned.

The configuration also contains `average_dropout_duration`, which the current implementation does not read.

### 2. OSRM Fallback

When OSRM cannot match a trace, the backend returns sampled noisy coordinates as fallback geometry.

This is not a corrected road trace.

### 3. Public OSRM Service

The project currently uses the public OSRM demo service.

Its availability and usage limits are outside the project's control.

### 4. NavIC Integration

The current backend simulates positioning errors. It does not process live NavIC satellite measurements.

### 5. Lane-Level Positioning

OSRM map matching does not automatically provide lane-level accuracy.

Lane-specific guidance depends on the availability of appropriate lane-level map data and additional processing.

### 6. Frontend and Vehicle Navigation

The React frontend, map display, vehicle animation, manoeuvre detection and 1 km alerts are not implemented in the current repository snapshot.

---

## Project Documentation

The following documents describe the project:

| File | Purpose |
|---|---|
| PRD.md | Product requirements and scope |
| Architecture.md | Existing backend and planned architecture |
| Tech-stack.md | Technologies and responsibilities |
| User-Flow.md | Website and navigation flow |
| Criteria.md | Problem coverage and evaluation checklist |
| Sample Data.md | Locations and route catalogue |
| COMPONENTS.md | Frontend component directory guide |

---

## Problem Statement

**Problem Statement Name:** Lane-Level Vehicle Navigation Using NavIC Satellite Signals

**Problem Statement ID:** DL-SJBIT-HK26-GOVP009

The objective is to build a software-based intelligent navigation platform that improves vehicle positioning and route guidance using publicly available location data and digital road maps.

where to PARTH explores this through simulated positioning errors, OSRM map matching and a planned navigation interface.

**Every journey deserves the right direction and every turn, the right guidance.**

**Don't worry, Abhimanyu. This time, we'll get you out.**
