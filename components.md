# where to PARTH — Frontend Component Architecture & Replacement Guide

This document describes the location, role, input props, and replacement steps for each component in the **where to PARTH** application under the unified OpenStreetMap + OSRM dynamic navigation architecture.

---

## Component Directory Map

```text
frontend/
├── index.html                           # Root HTML, fonts (Orbitron, Rajdhani, Inter), Leaflet CSS
├── src/
│   ├── main.jsx                         # Application entrypoint & DOM mounting
│   ├── App.jsx                          # Page routing & unified POST /api/simulate orchestrator
│   ├── index.css                        # F1 theme styling, CSS variables, transitions, animations
│   │
│   ├── utils/
│   │   └── geoUtils.js                  # Haversine distance, bearing, dead reckoning helper
│   │
│   └── components/
│       ├── Header.jsx                   # Sticky navbar with functional home link ("WHERE TO PARTH")
│       ├── WelcomePage.jsx              # Opening homepage brief with crossing F1 cars & smooth transition
│       ├── RouteSelectionPage.jsx       # Dynamic departure & destination selector with validated presets
│       ├── NavigationDashboard.jsx      # Navigation cockpit orchestrator consuming unified backend payload
│       ├── LeafletMap.jsx               # Leaflet map rendering reference, raw, deep blue matched, and Kalman traces
│       ├── AdvanceAlertBanner.jsx       # ~1 km advance turn notification based on OSRM route steps
│       ├── SignalLossBanner.jsx         # Simulated GNSS dropout alert
│       ├── TelemetryHUD.jsx             # Speedometer (hard-capped at 120 km/h), measured accuracy, progress
│       └── SimulationControls.jsx       # Navigation transport with "Pause Navigation" / "Resume Navigation"
```

---

## Detailed Component Specifications & Replacement Guide

### 1. App (`frontend/src/App.jsx`)
- **Role:** Root application orchestrator. Coordinates page state (`'welcome' | 'routes' | 'cockpit'`), calls the unified `POST /api/simulate` endpoint with dynamic coordinates, and displays actionable error states if the local OSRM routing service is unreachable or unmapped.
- **Backend Communication:**
  - Endpoint: `POST ${VITE_API_URL || 'http://localhost:8000'}/api/simulate`
  - Payload: `{ start_lon, start_lat, end_lon, end_lat }`
- **How to Replace / Modify:**
  - To point to a remote server or staging cluster, set the `VITE_API_URL` environment variable.
  - To add authentication headers, inject `headers: { 'Authorization': '...' }` into `handleLaunchSimulation`.

---

### 2. Header (`frontend/src/components/Header.jsx`)
- **Role:** Sticky top navigation bar. Contains the **"WHERE TO PARTH"** brand logo and title, configured as a functional navigation link across all views to route directly back to the initial homepage brief.
- **Props:**
  - `onNavigateHome`: Callback function invoked when clicking the logo to return to the opening homepage brief.

---

### 3. Welcome Page (`frontend/src/components/WelcomePage.jsx`)
- **Role:** Opening homepage brief view. Presents the approved brief copy (*"Dw, Abhimanyu. This time, we'll get you out."*) and simultaneous diagonal crossing F1 racing cars with speed trails. Provides an interactive "PROCEED TO ROUTE SELECTION" button with a smooth state transition animation.
- **Props:**
  - `onProceed`: Callback invoked to smoothly transition to the route selection interface.

---

### 4. Route Selection Page (`frontend/src/components/RouteSelectionPage.jsx`)
- **Role:** Dynamic departure and destination selection interface. Replaces static mock GeoJSON files with validated coordinate presets (Kengeri, Kanakapura, Somapura) or arbitrary supported coordinates. Features an actionable error banner when OSRM routing fails and a primary action labeled **"PROCEED TO NAVIGATION"**.
- **Props:**
  - `onLaunchSimulation`: Callback function receiving `{ start_lon, start_lat, end_lon, end_lat, start_name, end_name }`.
  - `isLoading`: Boolean state showing spinner during local OSRM graph query.
  - `apiError`: Object `{ error, message }` containing actionable OSRM failure details.
  - `onClearError`: Callback to dismiss active error banner when inputs change.

---

### 5. Navigation Dashboard (`frontend/src/components/NavigationDashboard.jsx`)
- **Role:** Primary telemetry and simulation cockpit. Consumes the unified response model from `POST /api/simulate`:
  - `reference_route`: Reference driving corridor from local OSRM `/route`.
  - `observations`: Ordered simulated NavIC GNSS fixes with calibrated 1e-8 deg² variance and ~15.5m accuracy.
  - `matching`: Snapped geometry and positions from local OSRM `/match`.
  - `kalman_fallback`: 4D constant-velocity Kalman filter estimate used when OSRM matching fails or returns low confidence.
  - `active_position_source`: Explicit source label (`osrm_match` vs `kalman_estimate`).
- **Vehicle Position Selection:**
  - Vehicle marker advances along `matching.matched_positions` when status is `MATCHED`.
  - If status is `LOW_CONFIDENCE` or `NO_MATCH`, vehicle advances along `kalman_fallback.coordinates`.
  - The vehicle marker is **never** snapped directly to the reference route.
- **Advance Alerts:**
  - Monitors distance along the route to upcoming turn maneuvers using `reference_route.steps` (OSRM `/route` steps), triggering warnings approximately 1.0 km prior.
- **Props:**
  - `simulationData`: Full response payload from `POST /api/simulate`.
  - `onBackToSelection`: Callback to return to route selection.

---

### 6. Leaflet Map (`frontend/src/components/LeafletMap.jsx`)
- **Role:** Interactive dark-mode navigation map powered by Leaflet. Renders separate, truthful visual layers:
  1. **Reference Route** (Cyan `#00F0FF` dashed): OSRM reference corridor.
  2. **Noisy GPS Signal** (Neon Orange `#FF5F1F` dashed/dots): Raw simulated NavIC observations.
  3. **Matched Active Route** (Deep Blue `#0047AB` solid): OSRM map-matched road line (rendered **only** when `status === 'MATCHED'`).
  4. **Kalman Fallback Estimate** (Amber `#D97706` dashed): Filtered position estimate (rendered **only** when Kalman fallback is active).
  5. Animated vehicle marker rotated according to observed movement heading.
- **Zoom Retention:**
  - Preserves user zoom level during navigation start and progression (`fittedRouteHashRef` triggers only on initial route selection).
- **Props:**
  - `referenceTrace`, `noisyTrace`, `matchedTrace`, `kalmanTrace`, `currentCoord`, `currentBearing`, `activePositionSource`, `turnSteps`.

---

### 7. Telemetry HUD (`frontend/src/components/TelemetryHUD.jsx`)
- **Role:** Telemetry cockpit cards displaying:
  - Digital speedometer with **hard limit at 120 km/h** (`Math.min(120, ...)`).
  - Compass heading in degrees and cardinal orientation.
  - Measured GNSS accuracy (`accuracy_meters`, e.g. `±15.5m`).
  - Journey progress percentage and remaining distance based on reference route.
- **Props:**
  - `speedKmh`, `bearing`, `errorMetrics`, `progressPercent`, `distanceCoveredKm`, `distanceRemainingKm`, `etaMinutes`.

---

### 8. Simulation Controls (`frontend/src/components/SimulationControls.jsx`)
- **Role:** Active navigation transport bar.
- **Controls:**
  - **"START NAVIGATION"** before departure.
  - **"Pause Navigation"** control that immediately toggles to **"Resume Navigation"** when clicked.
  - **"RESTART NAVIGATION"** to reset vehicle back to start.
- **Props:**
  - `hasStarted`, `isPaused`, `onStartNavigation`, `onTogglePause`, `onReset`.

---

### 9. Geographic Utilities (`frontend/src/utils/geoUtils.js`)
- **Role:** Pure mathematical geodetic utilities:
  - `haversineDistance(pt1, pt2)`: Distance between two coordinates in meters.
  - `calculateBearing(pt1, pt2)`: Direction angle in degrees (0–360°).
  - `estimateDeadReckoning(...)`: Extrapolates position during satellite dropouts.
  - Completely decoupled from static route catalogues.
