Repository: https://github.com/rudraworkswcode/wheretoPARTH
Purpose: Record the requested corrections after reviewing the current backend and frontend implementation.

This is a change specification, not a new architecture decision. The transport mechanism, map provider, route tie-breaker and intro timing remain TBD unless explicitly stated below.
1. Spatial positioning — reduce GPS scatter
Affected files: main.py, noise_config.json, frontend/src/utils/geoUtils.js, frontend/src/components/RouteSelectionPage.jsx.
Current finding
The Python backend and frontend utility calculate coordinate standard deviation with the square root of the configured variance. The current variance is 0.00005 for latitude and longitude, so the resulting standard deviation is approximately 0.00707°.

At Bengaluru's approximate latitude (12.9° N), this corresponds to roughly 786 metres north/south and 767 metres east/west per standard deviation. This is far too large for a trace intended to remain close to a designated highway. The frontend route screen also exposes a noise slider that permits large values.
Required update
- Define the noise effect in physically meaningful units, preferably metres, rather than unexplained degree values.
- Keep generated points within a realistic, configurable corridor around the reference route.
- Apply latitude-aware coordinate conversion when noise is represented in metres.
- Keep the noise model consistent between Python and JavaScript.
- Preserve visible positioning error; do not make noisy points identical to the reference route.
- Remove user-facing noise sliders and configuration controls. Navigation users must not tune the noise model.
Acceptance criteria
- Noisy points remain close to the designated road corridor.
- The trace does not routinely jump hundreds of metres away from the highway.
- Backend and frontend noise behaviour use consistent units and parameters.
- Original and noisy positions remain distinguishable.
- Noise configuration is not exposed on the route-selection screen.
2. Temporal positioning — generate coordinates progressively
Affected files: main.py, frontend/src/utils/geoUtils.js, frontend/src/components/NavigationDashboard.jsx.
Current finding
GET /api/simulate/{route_id} currently loads the route, generates the complete noisy trace, sends the full trace to OSRM, and returns the trace and matching result together. The frontend also generates or fetches the complete trace when the navigation dashboard mounts, then advances an index through the prepared route. This is full-trace preparation followed by playback, not dynamic coordinate generation ahead of the active vehicle position.
Required update
- Generate and make position updates available progressively as navigation advances.
- Maintain only a limited look-ahead of upcoming coordinates ahead of the active vehicle position.
- Append or request new points as the vehicle approaches the end of the available look-ahead.
- Do not calculate and expose the entire future noisy trajectory before navigation starts.
- Keep active vehicle position, noisy observations and matched road position temporally aligned.
- Do not display the complete future noisy trace as already observed telemetry.
Implementation choice left open: The delivery mechanism (such as polling or a streaming connection) is not selected here. Follow the team's approved architecture; do not introduce a protocol without approval.
Acceptance criteria
- Navigation starts with the initial position and only the agreed look-ahead data available.
- New coordinates become available as navigation progresses.
- The displayed noisy trace grows progressively.
- The active marker never advances beyond available coordinates.
- Delayed or failed updates do not cause the vehicle to teleport to the destination.
3. Velocity and navigation terminology
Affected files: frontend/src/components/NavigationDashboard.jsx, SimulationControls.jsx, TelemetryHUD.jsx, RouteSelectionPage.jsx, AdvanceAlertBanner.jsx.
Current finding
NavigationDashboard.jsx currently starts with isPlaying = true and playbackSpeed = 2. The update interval is Math.max(50, Math.round(500 / playbackSpeed)), so at the default 2x setting a route index advances every 250 ms.

The displayed speed is separately calculated from a fixed 58 km/h baseline with a sine adjustment, or 32 km/h near a turn. It is not derived from actual coordinate displacement and elapsed time. The controls expose 1x, 2x, 5x and 10x playback speeds.
Required update
- Slow the vehicle's displayed and actual traversal to a realistic navigation pace.
- Derive displayed velocity from coordinate displacement and elapsed time, or from a consistent route-time model.
- Do not use an arbitrary fixed timer per vertex as a substitute for physical movement speed when coordinate spacing varies.
- Remove all user-facing playback-speed controls.
- Replace user-facing uses of Simulation, Telemetry Rerun, and similar playback terminology with Navigation and appropriate navigation wording.
- Use Start Navigation for the manual cockpit start action.
- Internal function or endpoint names need not be renamed solely to change UI wording.
Acceptance criteria
- Vehicle movement is not unrealistically fast.
- Displayed speed corresponds to the actual movement model.
- Navigation pace remains consistent across routes with different coordinate spacing.
- No 1x / 2x / 5x / 10x controls are visible.
- User-facing copy consistently describes navigation, not a playback demo.
4. Map colour scheme
Affected files: frontend/src/components/LeafletMap.jsx, frontend/src/index.css.
Current finding
The map currently uses CARTO Voyager tiles. Its overlays include cyan for the reference route, neon orange for the noisy trace, red for the matched route, green for the start marker, and other bright accent colours. A dark page background does not make the Voyager map itself a dark F1-style map.
Required update
Apply the agreed palette consistently:
Colour	Hex	Intended use
Red	#FF0000	Primary active route / key navigation emphasis
Neon Orange	#FF5F1F	Secondary trace / upcoming manoeuvre emphasis
White	#FFFFFF	Labels, text and high-contrast details
Black	#000000	Map/background base and dark surfaces


- Select or style map tiles so the map reads as a dark navigation surface.
- Remove unrelated cyan/green/yellow styling where decorative and inconsistent with the agreed palette.
- Keep route, vehicle, start, destination and alert markers legible.
- Do not add overlays or panels to occupy space left by removed controls.
The basemap provider or tile style is TBD; this document does not select one.
Acceptance criteria
- Map styling follows red, neon orange, white and black.
- The route is clearly distinguishable from the map background.
- Start, destination and active vehicle markers remain readable.
- The map no longer looks like a light Voyager map placed inside a dark page.
5. Global header — remove the top-right status element
Affected file: frontend/src/components/Header.jsx.
Current finding
The header renders a right-side status container showing NAVIC LOCK: OK, 8 Sats | HDOP 1.08, and selected route information. The satellite lock and quality values are static display content, not verified live measurements.
Required update
- Remove the complete top-right status container.
- Do not replace it with another status badge, mock telemetry block or decorative panel.
- Keep remaining brand treatment only where it supports the requested flow.
- Remove obsolete header navigation entries that allow users to jump separately to Paddock or Mission Brief.
Acceptance criteria
- No top-right NavIC lock, satellite count, HDOP or selected-route status block remains.
- No fabricated live satellite status is displayed.
- The remaining header does not provide a manual bypass around the automated introduction flow.
6. Paddock and Mission Brief — consolidate the introduction
Affected files: frontend/src/App.jsx, WelcomePage.jsx, BriefPage.jsx, Header.jsx.
Current finding
Welcome/Paddock and Mission Brief are currently separate pages. The welcome page has an ENTER MISSION BRIEF button. The brief page has a BACK TO PADDOCK action and a route-progression button. The header exposes separate navigation buttons for these pages.

The Welcome page includes three feature cards. The Brief page includes four technical feature modules and an explanatory paragraph about Abhimanyu/Chakravyuh lore.
Required update
- Merge Paddock/Welcome and Mission Brief into one introduction page/view.
- Progression through the merged introduction must be automatic; do not require a click to move between separate Paddock and Mission Brief pages.
- Automatically progress from the consolidated introduction to route configuration after its approved intro sequence.
- Remove the three feature cards from the Paddock/Welcome view.
- Remove the four technical feature modules from the Mission Brief view.
- Remove the explanatory epic-lore paragraph.
- Preserve the approved product brief exactly:
  Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way.
  Dw, Abhimanyu. This time, we'll get you out.
- Do not remove or rewrite the approved brief itself.
- Remove obsolete separate-page back/proceed controls and navigation links that conflict with automatic progression.
The exact duration or event that ends the intro sequence is TBD. Do not add a new user-facing control to replace the removed buttons.
Acceptance criteria
- Paddock and Mission Brief are no longer separate navigable pages.
- Welcome and approved brief content appear as one consolidated introduction experience.
- Progression happens automatically.
- Three welcome feature cards, four brief feature modules and the epic-lore paragraph are absent.
- The exact approved brief remains visible.
- No replacement cards or filler content are added.
7. Route configuration — two dropdowns only
Affected files: frontend/src/components/RouteSelectionPage.jsx, SimulationControls.jsx, App.jsx, frontend/src/data/routesData.js.
Current finding
The route-selection screen contains start/destination filter dropdowns, preconfigured route cards, route preference labels, distance/estimated-time/turn-count statistics, a noise-parameter drawer, and a manual toggle between standalone and local FastAPI modes. The cockpit also contains a separate quick route switcher.

This makes the interface behave like a route-planning dashboard rather than a minimal navigation setup.
Required update
The route-configuration view must accept only these two user inputs:
1. Starting Point — one dropdown.
2. Destination — one dropdown.
Remove:
- All preconfigured route cards.
- Route preference cards or labels.
- Distance, ETA and turn-count statistics on the route-selection view.
- Noise-parameter sliders and drawers.
- Manual backend/API mode toggles.
- Extra route-switching dropdowns in the cockpit.
- Any route-selection control beyond the two specified dropdowns.
The selected start/end pair should resolve to applicable route data internally. Do not expose route cards or statistics as a second selection method.
Route data clarification
The current route data contains two Kengeri → Kanakapura variants (R-01 and R-05). Because the UI may expose only start and destination, the application needs a deterministic internal rule for resolving that pair. The user must not be asked to choose between faster/slower route cards.

The final rule for duplicate start/end pairs is TBD and must be confirmed by the team. Do not invent an additional UI control.
Preserve empty space
- Preserve the intended whitespace when cards, statistics, drawers or toggles are removed.
- Do not fill removed areas with new cards, charts, statistics, illustrations or controls.
- Keep route configuration deliberately minimal.
Acceptance criteria
- Exactly two route-input dropdowns appear: start and destination.
- The selected pair determines the route internally.
- No preconfigured route cards or route statistics are displayed.
- No noise sliders or configuration drawer are displayed.
- No manual API/standalone toggle is displayed.
- No extra route switcher appears in the cockpit.
- Removed sections leave clean whitespace rather than replacement content.
8. Cockpit — manual start and minimal controls
Affected files: frontend/src/components/NavigationDashboard.jsx, SimulationControls.jsx, TelemetryHUD.jsx.
Current finding
The cockpit starts moving immediately because isPlaying is initially true.

It also exposes Play/Pause, Step Forward, Reset, playback-speed selectors, Ground Truth/NavIC Noise/Map Matched layer toggles, a route switcher, and a RERUN TELEMETRY button after arrival.
Required update
- Entering the cockpit must not start vehicle movement automatically.
- Show one clear Start Navigation trigger before movement begins.
- Start advancing the vehicle only after the user activates that trigger.
- Remove all playback-speed controls.
- Remove all layer-visibility toggles.
- Remove the RERUN TELEMETRY button.
- Remove the cockpit route switcher; route input is handled by the two dropdowns on the previous view.
- Do not add replacement controls for deleted items.
- Do not start timers, consume route points, or advance the vehicle before manual start.
Pause/stop behaviour after navigation begins is not specified here. Do not add new cockpit controls unless the team requests them. The manual-start requirement must be satisfied first.
Acceptance criteria
- Opening the cockpit shows the vehicle at its initial position.
- No route progression occurs before the user selects Start Navigation.
- Selecting Start Navigation begins navigation.
- Playback-speed selectors, layer toggles, Rerun Telemetry and the cockpit route switcher are absent.
9. Related correctness checks
1. geoUtils.js creates lane-guidance text from turn-angle heuristics. Do not present a guessed lane as verified map-derived lane guidance.
2. AdvanceAlertBanner.jsx displays a lane recommendation field. Show lane-specific instructions only when map data supports them; otherwise use a road-level manoeuvre instruction.
3. The telemetry speed display is not tied to actual coordinate displacement and elapsed time. Correct its source before treating it as real vehicle speed.
4. Remove visible uses of "simulation" where they conflict with the requested navigation experience. Backend endpoint names need not be renamed solely for a UI terminology change.
10. Implementation order
1. Correct GPS noise scale and make backend/frontend noise behaviour consistent.
2. Change coordinate generation/delivery to progressive look-ahead updates.
3. Align movement timing and displayed velocity.
4. Consolidate welcome and brief views; remove unauthorised content.
5. Replace route cards/filters/settings with exactly two dropdowns.
6. Remove the header status element.
7. Apply the approved map palette.
8. Make cockpit entry stopped by default and add a manual Start Navigation trigger.
9. Remove specified cockpit controls and obsolete terminology.
10. Run the acceptance checks below.
This is an implementation checklist, not a new architecture proposal. Confirm unresolved choices with the team before adding new mechanisms.
11. Final acceptance checklist
- [ ] Noise remains within a realistic highway corridor.
- [ ] Backend and frontend noise settings use consistent units and behaviour.
- [ ] Coordinates are generated progressively ahead of the active vehicle position.
- [ ] No full future noisy trace is displayed as already observed at navigation start.
- [ ] Vehicle progression is realistic and speed is calculated consistently.
- [ ] User-facing terminology says Navigation rather than Simulation/Telemetry Rerun.
- [ ] Map styling follows red, neon orange, white and black.
- [ ] Top-right header status container is removed.
- [ ] Welcome/Paddock and Mission Brief are one consolidated view.
- [ ] Consolidated introduction progresses automatically.
- [ ] Three welcome feature cards are removed.
- [ ] Four brief feature modules are removed.
- [ ] Epic-lore paragraph is removed.
- [ ] Approved brief copy is preserved exactly.
- [ ] Route configuration contains exactly two dropdowns.
- [ ] Route cards and route statistics are removed.
- [ ] Noise controls and API mode toggle are removed.
- [ ] Removed UI areas remain empty; no filler content is added.
- [ ] Entering the cockpit does not start navigation.
- [ ] Start Navigation is the manual trigger.
- [ ] Playback-speed controls are removed.
- [ ] Layer toggles are removed.
- [ ] Rerun Telemetry is removed.
- [ ] Cockpit route switcher is removed.
- [ ] No lane-specific claim is made without supporting lane map data.