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
│   ├── index.css                        # F1 theme styling, CSS variables, transitions, animations
│   │
│   ├── data/
│   │   ├── rawRoutes.json               # Extracted coordinates for all 5 GeoJSON routes
│   │   └── routesData.js                # Route catalog metadata, metrics & maneuver precomputation
│   │
│   ├── utils/
│   │   └── geoUtils.js                  # Haversine distance, bearing, NavIC noise, dead reckoning
│   │
│   └── components/
│       ├── Header.jsx                   # Sticky navbar with functional home link ("WHERE TO PARTH")
│       ├── WelcomePage.jsx              # Opening homepage brief with crossing F1 cars & smooth transition
│       ├── RouteSelectionPage.jsx       # Origin/Destination selector with "PROCEED TO NAVIGATION"
│       ├── NavigationDashboard.jsx      # Navigation cockpit orchestrator
│       ├── LeafletMap.jsx               # Leaflet map retaining user zoom during navigation start/progress
│       ├── AdvanceAlertBanner.jsx       # ~1 km advance turn notification & lane guidance
│       ├── SignalLossBanner.jsx         # Simulated GNSS dropout & Dead Reckoning alert
│       ├── TelemetryHUD.jsx             # Speedometer (hard-capped at 120 km/h), compass & progress
│       └── SimulationControls.jsx       # Navigation transport with "Pause Navigation" / "Resume Navigation"
```

---

## Detailed Component Specifications & Replacement Guide

### 1. Header (`frontend/src/components/Header.jsx`)
- **Role:** Sticky top navigation bar. Contains the **"WHERE TO PARTH"** brand logo and title, configured as a functional navigation link across all application views to return directly to the opening homepage brief.
- **Props:**
  - `onNavigateHome`: Callback function invoked when clicking the logo to route the user back to the opening homepage brief.
- **How to Replace / Modify:**
  - To change destination route when clicking the logo, adjust the `onNavigateHome` trigger or URL router in `App.jsx`.
  - To customize the logo icon or banner typography, modify lines 30–42.

---

### 2. Welcome Page (`frontend/src/components/WelcomePage.jsx`)
- **Role:** Opening homepage brief view. Presents the approved brief copy and simultaneous diagonal crossing F1 racing cars with speed trails. Provides an interactive "PROCEED TO ROUTE SELECTION" button with a smooth state transition animation (and automatic 5.5s fallback progression).
- **Props:**
  - `onProceed`: Callback invoked to smoothly transition to the route selection interface.
- **How to Replace / Modify:**
  - To adjust the transition timing or cubic-bezier easing curve, modify `.view-transition-wrapper` and `.view-transition-exit` in `frontend/src/index.css`.
  - The brief copy is located at lines 165–173; preserve required hackathon copy if updating.

---

### 3. Route Selection Page (`frontend/src/components/RouteSelectionPage.jsx`)
- **Role:** Route dispatch interface allowing selection of start and destination points between Kengeri, Kanakapura, and Somapura, displaying distance, travel duration, and route preferences. Features a primary submission action labeled **"PROCEED TO NAVIGATION"**.
- **Props:**
  - `selectedRouteId`: Active route ID string (`'R-01'`, `'R-02'`, etc.).
  - `setSelectedRouteId`: Callback to switch route ID.
  - `onLaunchSimulation`: Callback to initialize the active navigation cockpit.
- **How to Replace / Modify:**
  - The submission button text is defined at line 134 (`PROCEED TO NAVIGATION`).
  - To add route waypoints or custom route criteria, update `routesData.js`.

---

### 4. Leaflet Map (`frontend/src/components/LeafletMap.jsx`)
- **Role:** Interactive dark-mode navigation map powered by Leaflet. Renders the matched route (Deep Blue #0047AB), progressive observed noisy GPS trace (Neon Orange), start/finish pins, and animated heading-rotated vehicle marker. Legend reflects "Matched Active Route" (Deep Blue) and "Noisy GPS Signal" (Neon Orange).
- **Zoom-Retaining Behavior:**
  - Calling `fitBounds` is restricted strictly to initial route selection (`fittedRouteIdRef`).
  - Dynamic additions of observed satellite coordinates and clicking **"START NAVIGATION"** do NOT re-fit bounds, completely preventing unexpected map zoom-out and ensuring the map retains the user's current zoom level.
- **Props:**
  - `route`: Route data object with coordinate geometry.
  - `noisyTrace`: Array of observed noisy GPS points.
  - `matchedTrace`: Array of snapped road coordinates.
  - `currentCoord`: Current `[lon, lat]` position of the vehicle.
  - `currentBearing`: Heading angle (0–360°) for car rotation.
  - `activeAlertManeuver`: Approaching turn milestone.
- **How to Replace / Modify:**
  - To adjust initial zoom padding, modify line 124 (`padding: [50, 50]`).
  - To swap tile providers, edit the `L.tileLayer` basemap URL at line 37.

---

### 5. Telemetry HUD (`frontend/src/components/TelemetryHUD.jsx`)
- **Role:** Racing-style dashboard displaying live speedometer velocity, tachometer RPM gauge, compass bearing, positioning error reduction, and journey progress.
- **Hard Limit:**
  - The speedometer velocity is strictly hard-capped using `Math.min(120, Math.max(0, Math.round(speedKmh)))`, guaranteeing the displayed speed never exceeds **120 km/h**.
- **Props:**
  - `speedKmh`, `bearing`, `errorMetrics`, `progressPercent`, `distanceCoveredKm`, `distanceRemainingKm`, `etaMinutes`.
- **How to Replace / Modify:**
  - To change velocity display units or threshold colors, edit lines 34–57.

---

### 6. Simulation Controls (`frontend/src/components/SimulationControls.jsx`)
- **Role:** Active navigation transport controls. Features:
  - **"START NAVIGATION"** button before departure.
  - **"Pause Navigation"** control that immediately toggles to **"Resume Navigation"** when clicked (and vice versa).
  - **"RESTART NAVIGATION"** control to reset the journey back to origin.
- **Props:**
  - `hasStarted`: Boolean indicating if departure occurred.
  - `isPaused`: Boolean indicating active pause state.
  - `onStartNavigation`: Callback to commence navigation.
  - `onTogglePause`: Callback to toggle between paused and active navigation.
  - `onReset`: Callback to reset navigation.
- **How to Replace / Modify:**
  - To customize button icons or label wording, modify lines 36–50.

---

### 7. Advance Alert Banner (`frontend/src/components/AdvanceAlertBanner.jsx`)
- **Role:** Monitors remaining route distance to upcoming turns and displays prominent advance guidance when within ~1000m (1 km).
- **Props:**
  - `activeAlert`: `{ maneuver, distanceMeters }` or `null`.

---

### 8. Signal Loss & Dead Reckoning Banner (`frontend/src/components/SignalLossBanner.jsx`)
- **Role:** Triggers automatically during simulated GNSS satellite dropouts, notifying user that Dead Reckoning has taken over using velocity and heading vectors.
- **Props:**
  - `isSignalLost`: Boolean indicating whether satellite fix is interrupted.
  - `deadReckoningData`: Object containing projected velocity, heading, and projected coordinates.
