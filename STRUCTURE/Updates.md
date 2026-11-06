# MASTER INTEGRATION PROMPT — where to PARTH

Act as a senior full-stack engineer experienced in React, FastAPI, OpenStreetMap, OSRM, Docker and navigation systems.

Your task is to produce the final working application on the **`FINAL` branch** by combining:

- The new visual design from `master`.
- The working navigation functionality and backend infrastructure from `no-osrm`.
- The existing transition experience and application structure from `FINAL`, preserving its useful features.

Repository: https://github.com/rudraworkswcode/wheretoPARTH

## 1. Branch responsibilities — follow these strictly

### `master` — New visual design source

Current branch head: `beebc72a4ef5c6236f8a5601e095a166fd734bd9`

The important new component is:

`components/ui/waving-portfolio-landing.tsx`

It contains the new motorsport-inspired landing design, custom typography, central circuit, NavIC tracker and F1 car animations.

Important discovery: At the inspected branch head, this is not a complete React frontend. The branch does not contain a complete `frontend/src` application, an `App.jsx`, or even a corresponding `frontend/package.json`.

Therefore:
- Extract and integrate the actual new landing component.
- Adapt it into the existing frontend structure.
- Do not blindly replace the entire `frontend/` directory with `master`.
- Do not replace the current dependency manifest with an unmatched lockfile.
- Preserve the component's design and animation quality.

### `no-osrm` — Functional source of truth

Current branch head: `5207bbe517ec8b3c55464428ea3ffc617d4e3464`

Despite its branch name, this branch contains the local OSM/OSRM implementation. Do not interpret its name as an instruction to remove OSRM.

Preserve its working functionality, including:

- Dynamic route generation using local OSRM.
- `POST /api/simulate`.
- `DynamicRouteRequest` coordinate validation.
- Reference route generation through OSRM `/route`.
- NavIC noise generation.
- Timestamp and bearing-aware OSRM matching.
- Overlapping matching windows of up to 40 observations.
- Match confidence evaluation.
- Kalman fallback for unmatched, low-confidence or unavailable matching.
- Unified backend response.
- Docker and OSRM infrastructure.
- OSM graph preparation scripts.
- Existing automated tests.

Important source files include:
- `main.py`
- `backend/main.py`
- `requirements.txt`
- `backend/requirements.txt`
- `Dockerfile`
- `docker-compose.yml`
- `backend/Dockerfile`
- `scripts/prepare_osrm.sh`
- `scripts/prepare_osrm.ps1`
- `tests/`

Preserve the existing working implementation instead of rewriting it unnecessarily.

### `FINAL` — Integration target

Current branch head: `6ff7c65d9fb3489159dce2523ea1e03965b474aa`

All final changes must be made on this branch.

Do not modify `master` or `no-osrm`.

Before making changes, create a backup branch from the current `FINAL` head. Keep the three original source branches intact.

## 2. Integration strategy

Do not blindly merge the three branches.

`master` has no common Git ancestor with `no-osrm`, so a standard merge is not an appropriate way to integrate its frontend component.

Use selective file-level integration:

1. Start from `FINAL`.
2. Bring in the functional backend and infrastructure from `no-osrm`.
3. Integrate the new landing component from `master`.
4. Adapt the existing frontend components to communicate with the backend.
5. Resolve conflicting files deliberately.
6. Run the complete test and build process.

Do not overwrite an entire directory simply because another branch has newer files.

## 3. Frontend integration

Use the visual design from `master`, especially `WavingPortfolioLanding`, as the new landing experience.

Integrate it into:

`frontend/src/components/`

Make the component compatible with the existing React/Vite project. Preserve its visual design and avoid introducing unnecessary libraries or configuration.

The existing `FINAL` branch already contains:

- `ParticleGlobeTransition.jsx`
- `TrafficTransition.jsx`
- `BriefPage.jsx`
- `RouteSelectionPage.jsx`
- `NavigationDashboard.jsx`
- `LeafletMap.jsx`

Preserve and connect these useful components.

The intended application flow should remain:

**Welcome / New Landing Design → Particle Globe Transition → Brief → Route Selection → Traffic Transition → Navigation Cockpit**

Do not accidentally remove the particle/globe transition or the parallel traffic transition while introducing the master landing component.

When integrating `WavingPortfolioLanding`, inspect its callback behaviour carefully. It currently has multiple paths that can invoke `onProceed`, including its tracker completion and root click handler. Prevent accidental or repeated page transitions. The application must have one controlled, predictable transition into the next stage.

### Route Selection

Use the functional coordinate-selection behaviour from `no-osrm`.

The user must be able to choose a starting point and destination and obtain their actual longitude and latitude.

Retain the existing useful location presets and draggable map pins where applicable.

Do not restore static route-card navigation as the source of truth.

The selected coordinates must be passed to the backend.

### Navigation Cockpit

The cockpit must use the actual backend response.

Do not use:
- Static `ROUTE_LIST` coordinates as the active navigation route.
- Random frontend-generated noise as a substitute for backend observations.
- The reference route as a fake matched route.
- Hardcoded positioning-error reduction values.

Use the returned data correctly:

| Backend field | Frontend responsibility |
|---|---|
| `reference_route.geometry` | Original OSRM route |
| `observations` | Timestamped noisy observations |
| `raw_trace` | Raw noisy coordinate trace |
| `matching.geometry` | Road-matched geometry |
| `matching.confidence` | Match confidence |
| `kalman_fallback.coordinates` | Estimated fallback trajectory |
| `active_position_source` | Determines the active vehicle position source |

The active vehicle marker must follow the actual active position source.

Clearly distinguish:
- Reference route.
- Raw noisy GPS observations.
- OSRM-matched road trajectory.
- Kalman-estimated trajectory.

A Kalman estimate must never be labelled as a confirmed road match.

Preserve useful cockpit features such as speed, heading, distance, progress, turn alerts and signal-loss information, but make them depend on actual route and position data rather than static mock values.

## 4. Backend integration

Use the backend implementation from `no-osrm` as the functional foundation.

The main API contract must remain:

`POST /api/simulate`

Request:

```json
{
  "start_lon": 77.471314,
  "start_lat": 12.905128,
  "end_lon": 77.526668,
  "end_lat": 12.856989
}
```

The backend must perform:

1. Validate the requested coordinates.
2. Fetch the reference driving route using the local OSRM `/route` service.
3. Generate NavIC noise observations from the returned coordinate array.
4. Preserve timestamps, accuracy and travel bearings.
5. Perform sequence-based matching through local OSRM `/match`.
6. Evaluate matching confidence.
7. Apply Kalman fallback when matching fails or confidence is insufficient.
8. Return the unified response expected by the frontend.

Preserve the existing noise calibration, matching window size, overlap, confidence threshold and error handling unless a genuine defect is found and justified.

Do not reintroduce static GeoJSON files as a runtime routing dependency.

Do not introduce a public OSRM fallback. The application must use the locally configured OSRM service.

## 5. Docker and OpenStreetMap infrastructure

Retain the working OSM/OSRM infrastructure from `no-osrm`.

Verify that:

- The OSRM container uses the prepared regional `.osrm` dataset.
- The backend container connects through `OSRM_BASE_URL=http://osrm:5000`.
- The backend is accessible on the expected application port.
- The root Dockerfile builds the frontend and serves the resulting assets through FastAPI.
- The OSRM preparation scripts work on both Windows PowerShell and Linux/macOS.
- `docker-compose.yml` uses the correct graph filename.

Keep generated `.osm.pbf` and `.osrm` graph files outside Git. Do not commit large map datasets or generated dependency folders.

Do not silently change the OSRM algorithm, graph filename or dataset configuration.

## 6. Resolve backend duplication

The `no-osrm` branch contains both root `main.py` and `backend/main.py`.

The root Dockerfile copies `backend/main.py` into the runtime image, while the existing test suite imports `main.py`.

Inspect whether both files are identical.

Establish one clear source of truth, or ensure both copies remain synchronised and that automated tests execute the same backend implementation that Docker deploys.

Do not allow the development and production backends to behave differently.

Also verify whether `pykalman` is actually used. The existing implementation contains a NumPy-based Kalman filter. Do not rewrite it or introduce a second implementation unnecessarily.

## 7. Protect against regressions

The following existing capabilities must continue working:

- Dynamic start-to-destination routing.
- Location coordinate validation.
- NavIC noise generation.
- GPS dropout handling.
- Timestamp-aware and bearing-aware sequence matching.
- Parallel-road disambiguation.
- Matching confidence evaluation.
- Kalman fallback.
- Separate handling of `NO_MATCH` and `OSRM_UNAVAILABLE`.
- Frontend API error handling.
- Navigation map rendering.
- Turn notifications and vehicle progression.

Do not claim lane-level accuracy solely because OSRM returns a matched road geometry.

## 8. Testing and acceptance criteria

Run the existing backend test suites, including:

- `test_noise_and_math.py`
- `test_kalman_fallback.py`
- `test_pipeline_api.py`
- `test_parallel_road_matching.py`

Run the frontend production build:

```bash
cd frontend
npm install
npm run build
```

Run the backend tests:

```bash
pytest -q
```

Also verify the following:

1. The new master landing component renders correctly.
2. The complete introduction and transition flow works.
3. Route selection sends the correct coordinates to the backend.
4. The backend returns a valid dynamic route.
5. The cockpit renders actual backend data.
6. OSRM matching success activates the matched trajectory.
7. Low-confidence or failed matching activates the Kalman estimate.
8. A failed OSRM connection is reported distinctly from an unmapped road.
9. The Docker build completes.
10. The application works without depending on static mock route files.

Do not report a test as passed unless it was actually executed.

If the regional OSM graph file is not available in the environment, do not fabricate a successful live-routing test. Clearly report that the graph-dependent integration test requires the local dataset.

## 9. Scope and final delivery

The target is one coherent, working application on `FINAL`, not three separate implementations.

Prioritise:
1. Functional correctness.
2. Correct frontend/backend integration.
3. Preservation of the new visual design.
4. Reliable Docker and OSRM execution.
5. Clean project structure.

Avoid unrelated redesigns, unnecessary dependency changes, duplicated components, mock functionality and architectural rewrites.

Update `components.md` and `README.md` only after the final integration is complete, so the documentation describes the actual resulting code.

At the end, provide:
- Summary of what was integrated from each branch.
- List of files created, modified and removed.
- Backend and frontend test results.
- Docker build status.
- Any remaining blockers.
- Confirmation that all work is committed to `FINAL`.

**Final rule: Do not sacrifice the working navigation functionality to obtain the new UI, and do not sacrifice the new UI to preserve the old frontend. Integrate both deliberately.**