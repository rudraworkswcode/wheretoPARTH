# where to PARTH — Frontend Component Architecture & Replacement Guide

This document describes the location, role, and replacement steps for each component in the **where to PARTH** website application.

---

## Component Directory Map

```text
frontend/
├── index.html                           # Root HTML, fonts (Orbitron, Rajdhani, Inter), Leaflet CSS
├── src/
│   ├── main.jsx                         # Application entrypoint & DOM mounting
│   ├── App.jsx                          # Page routing & global telemetry state
│   ├── index.css                        # F1 theme styling, CSS variables, racing car animations
│   │
│   ├── data/
│   │   ├── rawRoutes.json               # Extracted coordinates for all 5 GeoJSON routes
│   │   └── routesData.js                # Route catalog metadata, metrics & maneuver precomputation
│   │
│   ├── utils/
│   │   └── geoUtils.js                  # Haversine distance, bearing, NavIC noise, dead reckoning
│   │
│   └── components/
│       ├── Header.jsx                   # Sticky racing navbar & live NavIC satellite lock indicator
│       ├── WelcomePage.jsx              # Welcome view with diagonal animated F1 cars
│       ├── BriefPage.jsx                # Official mission brief & technical pillars
│       ├── RouteSelectionPage.jsx       # Origin/Destination selector & noise parameter tuning
│       ├── NavigationDashboard.jsx      # Central telemetry cockpit controller
│       ├── LeafletMap.jsx               # Dark-mode Leaflet interactive map with trace layers
│       ├── AdvanceAlertBanner.jsx       # ~1 km advance turn notification & lane guidance
│       ├── SignalLossBanner.jsx         # Simulated GNSS dropout & Dead Reckoning alert
│       ├── TelemetryHUD.jsx             # Digital speedometer, tachometer, heading & error metrics
│       ├── SimulationControls.jsx       # Transport controls (Play/Pause/Step/Speed/Layer toggles)
│       └── TechnicalExplainer.jsx       # Hackathon problem statement & criteria disclosure modal
```

---

## Detailed Component Specifications & Replacement Guide

### 1. Header (`frontend/src/components/Header.jsx`)
- **Role:** Sticky top navigation bar. Displays the branding ("where to PARTH"), active page navigation tabs, live NavIC satellite constellation status (8 Satellites, L5/S-band, HDOP 1.08), and active route summary.
- **Props:**
  - `currentPage`: Current active view identifier (`'welcome' | 'brief' | 'routes' | 'cockpit'`).
  - `setCurrentPage`: State updater function to switch views.
  - `selectedRoute`: Currently active route object.
- **How to Replace / Modify:**
  - To add brand logos, replace the `Navigation` icon container around line 43 with your `<img>` or SVG asset.
  - To change page tabs, modify the `navItems` array at line 5.
  - To bind live GPS/GNSS receiver telemetry instead of simulated satellites, update the status indicators at line 102.

---

### 2. Welcome Page (`frontend/src/components/WelcomePage.jsx`)
- **Role:** First user landing page. Presents the mandatory exact welcome copy:
  `"Welcome to where to PARTH - Your smarter way to navigate through Life"`
  Features two F1 racing cars that enter from the left and right diagonally across the screen simultaneously using hardware-accelerated CSS keyframes.
- **Props:**
  - `onProceed`: Callback invoked when clicking "ENTER MISSION BRIEF" to transition to Phase 02.
- **How to Replace / Modify:**
  - To change car colors or SVGs, edit the `<F1CarSvg>` component props (`primaryColor`, `accentColor`, `glowColor`).
  - To adjust the speed or trajectory of the crossing cars, modify `@keyframes carLeftToRight` and `@keyframes carRightToLeft` in `frontend/src/index.css`.
  - The welcome message is located at line 144; preserve required hackathon copy if updating.

---

### 3. Brief Page (`frontend/src/components/BriefPage.jsx`)
- **Role:** Presents the official hackathon problem statement context and approved copy:
  `"Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way."`
  `"Dw, Abhimanyu. This time, we'll get you out."`
  Provides breakdown cards for NavIC noise modeling, OSRM snapping, 1 km advance warnings, and dead reckoning.
- **Props:**
  - `onProceed`: Navigates to Route Selection (`'routes'`).
  - `onBack`: Returns to Welcome view (`'welcome'`).
- **How to Replace / Modify:**
  - The approved copy in the blockquote must remain unaltered.
  - To add extra hackathon criteria or team member credits, append cards to the grid at line 90.

---

### 4. Route Selection Page (`frontend/src/components/RouteSelectionPage.jsx`)
- **Role:** Allows selection of start and destination points between Kengeri, Kanakapura, and Somapura. Displays route catalog cards (R-01 through R-05) with distance, estimated time, and turn count. Includes a noise parameter slider drawer and API toggle (`Standalone` vs `Local FastAPI`).
- **Props:**
  - `selectedRouteId`: Active route ID string (`'R-01'`, `'R-02'`, etc.).
  - `setSelectedRouteId`: Callback to switch route ID.
  - `noiseConfig`: Object containing jitter variance, drift bias, and dropout percentage.
  - `setNoiseConfig`: Callback to tune noise parameters.
  - `onLaunchSimulation`: Callback to switch into `'cockpit'` mode.
  - `useBackendApi`: Boolean toggle between client-side simulation and FastAPI backend.
- **How to Replace / Modify:**
  - To add custom GeoJSON files, add the file into `mock_data/` and re-run `node -e ...` or append to `rawRoutes.json`.
  - To replace dropdowns with a search input or map click picker, replace the filter container at line 164.

---

### 5. Leaflet Map (`frontend/src/components/LeafletMap.jsx`)
- **Role:** Interactive dark-mode map powered by Leaflet. Renders:
  1. Cyan line: Ground truth reference path.
  2. Neon Orange dashed line & dots: Simulated noisy satellite coordinates.
  3. Red line: Snapped/matched road trace.
  4. Animated F1 car marker dynamically rotated along its current heading.
  5. Start & finish badges and numbered maneuver pins.
- **Props:**
  - `route`: Route data object with coordinate geometry.
  - `noisyTrace`: Array of noisy GPS points.
  - `matchedTrace`: Array of snapped road coordinates.
  - `currentCoord`: Current `[lon, lat]` position of the vehicle.
  - `currentBearing`: Heading angle (0–360°) for car rotation.
  - `layerVisibility`: Visibility toggles for the three trace layers.
  - `activeAlertManeuver`: Currently approaching turn milestone.
- **How to Replace / Modify:**
  - **To switch map providers** (e.g. Mapbox GL JS, MapLibre, Google Maps):
    Replace `LeafletMap.jsx` with your wrapper. Keep the same props (`route`, `currentCoord`, `currentBearing`, `layerVisibility`) to preserve complete compatibility with `NavigationDashboard.jsx`.
  - **To change tile style**:
    Modify the `L.tileLayer` URL on line 37 (e.g., standard OSM: `'https://tile.openstreetmap.org/{z}/{x}/{y}.png'`).

---

### 6. Advance Alert Banner (`frontend/src/components/AdvanceAlertBanner.jsx`)
- **Role:** Automatically displays high-priority guidance when the vehicle approaches within ~1000m (1 km) of an upcoming turn or highway exit. Displays turn direction, remaining distance countdown, and lane-guidance recommendations.
- **Props:**
  - `activeAlert`: `{ maneuver, distanceMeters }` or `null` when clear.
- **How to Replace / Modify:**
  - To change alert distance threshold (e.g., from 1000m to 1500m or 500m), adjust the condition in `NavigationDashboard.jsx` (line 144).
  - To replace icons with audio turn instructions or speech synthesis, add `new SpeechSynthesisUtterance()` inside an effect when `activeAlert` changes.

---

### 7. Signal Loss & Dead Reckoning Banner (`frontend/src/components/SignalLossBanner.jsx`)
- **Role:** Triggers automatically during simulated GNSS coordinate dropouts (e.g. tunnels, dense urban tree canopies, multi-path blockage). Notifies user that Dead Reckoning has taken over using historical velocity and heading vectors.
- **Props:**
  - `isSignalLost`: Boolean indicating whether satellite fix is interrupted.
  - `deadReckoningData`: Object containing projected velocity, heading, and projected coordinates.
- **How to Replace / Modify:**
  - To enhance the dead-reckoning algorithm (e.g. Extended Kalman Filter), modify `estimateDeadReckoning()` in `geoUtils.js`.

---

### 8. Telemetry HUD (`frontend/src/components/TelemetryHUD.jsx`)
- **Role:** Racing-style dashboard displaying live digital speedometer (km/h), F1 tachometer RPM bars, compass bearing & cardinal orientation, positioning accuracy error comparison (Raw NavIC deviation vs Map-Matched road deviation), journey progress %, and remaining ETA.
- **Props:**
  - `speedKmh`, `bearing`, `currentCoord`, `errorMetrics`, `progressPercent`, `distanceCoveredKm`, `distanceRemainingKm`, `etaMinutes`.
- **How to Replace / Modify:**
  - To display additional telemetry fields (e.g. lateral G-force, altitude, or battery voltage), add cards into the grid at line 24.

---

### 9. Simulation Controls (`frontend/src/components/SimulationControls.jsx`)
- **Role:** Interactive transport bar with Play/Pause, Step Forward, Reset, Speed Multipliers (1x, 2x, 5x, 10x), layer visibility toggles (Ground Truth, NavIC Noise, Map Matched), and quick route switcher.
- **Props:**
  - `isPlaying`, `onTogglePlay`, `onReset`, `onStepForward`, `playbackSpeed`, `onChangeSpeed`, `layerVisibility`, `onToggleLayer`, `routes`, `selectedRouteId`, `onSelectRoute`.
- **How to Replace / Modify:**
  - To add keyboard shortcuts (e.g. Spacebar for play/pause, R for reset), attach an event listener in `NavigationDashboard.jsx` and pass the triggers to these props.

---

### 10. Technical Explainer Modal (`frontend/src/components/TechnicalExplainer.jsx`)
- **Role:** Provides transparent evaluation criteria disclosure for hackathon judges, explaining the distinction between simulated GNSS noise, OSRM road matching, and lane-level positioning.
- **Props:**
  - `isOpen`: Boolean modal state.
  - `onClose`: Callback to dismiss modal.
- **How to Replace / Modify:**
  - To update hackathon answers or add references to research papers, edit the text blocks inside lines 38–60.

---

### 11. Geographic Utilities (`frontend/src/utils/geoUtils.js`)
- **Role:** Pure mathematical utility functions:
  - `haversineDistance(pt1, pt2)`: Distance between two coordinates in meters.
  - `calculateBearing(pt1, pt2)`: Direction angle in degrees (0–360°).
  - `generateNavicNoise(coordinates, config)`: Generates Gaussian jitter, drift, and dropouts matching `noise_config.json`.
  - `detectManeuvers(coordinates)`: Detects route turns > 25° and precomputes cumulative distance milestones.
  - `estimateDeadReckoning(...)`: Projects vehicle location during satellite dropout.
- **How to Replace / Modify:**
  - If integrating an external navigation engine (e.g. Mapbox Directions API, Valhalla, GraphHopper), replace `detectManeuvers()` with the API's turn step payload.

