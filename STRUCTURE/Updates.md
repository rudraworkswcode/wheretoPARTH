Updates.md — Introduction & Navigation Transition Animations
Project: where to PARTH
Scope: Frontend experience and page-to-page transitions only
Status: Implementation specification — do not change components.md as part of this task.
1. Objective
Improve the website's introduction and route-to-map transitions so that the experience feels continuous, cinematic and intentional without making the animations look mechanically choreographed.

Implement the following user journey in this exact order:
1. Welcome screen
2. Pixel diffusion into a particle field
3. Particle field forms a globe, then splits apart
4. Mission brief screen
5. Start and destination entry
6. Parallel F1 traffic transition
7. Navigation map / cockpit
Do not redesign the navigation map, change the route-selection inputs, or modify the backend as part of this UI task.
2. Current repository findings
The implementation must account for the current code rather than assume the flow already exists.
Current file	Finding	Required action
frontend/src/App.jsx	Currently renders welcome, routes, and cockpit. It does not mount BriefPage.	Add explicit page/transition states so the required sequence is possible.
frontend/src/components/WelcomePage.jsx	Contains the welcome title, approved mission copy, crossing F1 cars, a proceed button and a 5.5-second automatic progression.	Separate the welcome greeting from the later brief stage, trigger the particle/globe transition, and make manual/automatic progression use the same sequence.
frontend/src/components/BriefPage.jsx	Already exists but is not currently connected by App.jsx.	Reconnect it as the screen shown after the globe animation. Preserve its existing content unless a separate content change is requested.
frontend/src/components/RouteSelectionPage.jsx	Contains the starting-point and destination dropdowns. Its submit callback currently launches the cockpit directly.	Keep the two inputs and send submission through the new traffic transition before opening the map.
frontend/src/components/NavigationDashboard.jsx	Hosts the navigation cockpit.	Keep this as the destination screen after the traffic transition. Do not start or reset navigation merely because the transition component mounted.
frontend/src/index.css	Contains the existing diagonal F1 animation keyframes and transition styles.	Correct the crossing trajectories and add styling only where needed for the two new transitions.
components.md	Existing component guide at the repository root. The filename is lowercase.	Update later with the new components and their file locations; do not edit it in this task.


3. Transition A — Welcome screen to particle diffusion to globe to Brief
3.1 Intended visual sequence
After the welcome message has been displayed, the visible welcome screen should appear to break apart into thousands of tiny, circular particles. Those particles should retain the colours of the pixels they came from.

The sequence is:
1. Welcome hold: Show the welcome screen and its existing visual identity. The exact welcome text is: Welcome to where to PARTH - Your smarter way to navigate through Life.
2. Pixel breakup: The visible welcome composition dissolves into tiny circular particles. Particles should be derived from the rendered screen's existing pixels, so a red pixel becomes a red particle, a white pixel becomes a white particle, and so on. Do not generate a new rainbow palette or assign arbitrary colours.
3. Natural diffusion: The particles burst outward with high diffusion. Their motion should feel organic and physically loose, not like each particle has been assigned a deliberate left or right lane. Some naturally drift left, some right, some upward or downward, with varied speed and slight turbulence. Avoid a uniform radial explosion, synchronized movement, or rigid rows.
4. Particle settling / globe formation: As the cloud disperses, the same particles reduce into small circular atoms and gradually reorganize into the silhouette of a planet or globe. Preserve each particle's sampled source colour throughout the transformation. The globe may use subtle depth, shading and density to read as spherical, but must not introduce unrelated colours.
5. Globe separation: Split the globe vertically into two broad halves. The left half travels toward the left edge and the right half travels toward the right edge. Make the separation feel like the particle mass is drifting apart, not like a hard rectangular wipe. A slight stagger between the two halves is acceptable, but both must clearly move outward.
6. Brief reveal: As the two halves leave the center, reveal the mission brief screen underneath or immediately after them. The Brief screen must appear only after the globe transition reaches its exit point; do not jump directly from the welcome screen to route entry.
3.2 Colour and particle rules
- Use the colours sampled from the welcome screen itself. The particle colours must be the colours the original pixels were already holding.
- Keep the overall palette consistent with the existing site: red #FF0000, neon orange #FF5F1F, white #FFFFFF, black #000000, plus only the colours naturally present in the captured source pixels.
- Particles must be circular, very small and varied slightly in size. They should read as tiny atoms, not large bubbles, stars, confetti or square pixels.
- Do not add a decorative rainbow, new neon palette, random coloured sparks, smoke, fire or an unrelated galaxy effect.
- Keep the screen background consistent with the existing dark design.
- The globe must be formed from the same particle population and source colours. Do not replace it with a stock planet image or a separately coloured 3D globe.
3.3 Implementation guidance
- Create a focused transition component, suggested path: frontend/src/components/ParticleGlobeTransition.jsx.
- The transition should capture or rasterize the visible welcome composition and sample its pixel colours and positions. DOM elements cannot be read directly as canvas pixels, so choose a reliable DOM-to-raster/canvas approach; add a dependency only if the existing browser APIs and project setup cannot provide a reliable capture.
- Prefer a canvas-based particle renderer over creating thousands of React DOM nodes. Keep React responsible for the transition lifecycle and page-state callbacks; let the canvas handle per-frame particle motion.
- Use a seeded or otherwise stable mapping from source particles to globe target positions so the globe forms coherently instead of flickering between unrelated arrangements.
- Use a diffusion/turbulence force with varied per-particle velocity and damping. A mild left/right drift bias may emerge naturally, but must not turn into two visibly choreographed streams during the diffusion stage.
- Use requestAnimationFrame or an equivalent animation loop. Cancel the animation frame, clear timers and remove event listeners when the component unmounts or the transition is cancelled.
- Avoid repeatedly capturing the page or recreating all particles on every React render.
- Keep the animation responsive: cap particle count according to viewport size/device capability, and avoid blocking scrolling or the main UI longer than necessary.
- Support prefers-reduced-motion: skip or greatly simplify the visual effect while still advancing to the Brief screen correctly.
3.4 Welcome progression and safety against duplicate transitions
- Both the existing automatic progression and any remaining welcome-page proceed action must enter the same transition sequence.
- Do not allow the automatic timer and a button click to trigger two simultaneous particle animations or mount the Brief screen twice.
- The transition must call the next-page callback exactly once after completion.
- Clean up the current 5.5-second timer and any transition timer when the page unmounts. Adjust the welcome hold and animation durations to fit the sequence; do not let the welcome's old timer bypass the particle/globe effect.
- Do not make the Brief screen appear before the animation completes.
4. Correct the original diagonal F1 car crossing
4.1 Required movement
The two cars must travel across the complete viewport on opposite diagonal paths at approximately the same time:
- The car starting at the extreme left must travel diagonally all the way to the extreme right.
- The car starting at the extreme right must travel diagonally all the way to the extreme left.
Both cars must visibly enter from outside or at the edge of the viewport, cross the screen, and leave fully beyond the opposite edge. Their paths should be clearly diagonal rather than mostly horizontal or vertical.
4.2 Current issue to correct
frontend/src/index.css already contains carLeftToRight and carRightToLeft keyframes, but the visual result has not reliably communicated the full opposite-edge crossing. Do not merely rename the keyframes. Inspect the rendered result and correct the element anchor, transform distances, start/end coordinates, clipping and orientation so the actual cars follow the requested paths.
4.3 Behaviour and visual requirements
- Keep both cars moving simultaneously, with only a small timing offset if needed to make the crossing readable.
- The left-origin car travels left-to-right; the right-origin car travels right-to-left. Do not reverse these directions.
- Align each car's visual facing direction with its direction of travel. In particular, the right-to-left car should not appear to drive backwards just because its container is translating left.
- Ensure the cars are not clipped by the welcome content container before reaching the viewport edge.
- Keep the existing F1 car artwork and red/neon-orange/white identity. Do not replace the cars with generic icons.
- Preserve the text's readability. The cars may pass behind the hero content where necessary, but should remain visible enough to communicate the crossing.
- Keep the animation responsive to different viewport widths and heights.
5. Transition B — Route entry to navigation map
5.1 Intended visual sequence
After the user selects the starting point and destination and submits the route form, do not open the map immediately. Show a short F1 traffic transition first:
1. A small group of cars enters from the top of the screen and travels downward.
2. Another small group enters from the bottom and travels upward.
3. Cars within each group move in parallel directions, as if travelling in parallel lanes. Keep the formation compact and the cars small relative to the screen.
4. The two groups pass through the visual field in opposite directions. Use slight per-car timing offsets so it feels alive, but keep the parallel movement legible.
5. Once the transition completes, reveal the navigation map/cockpit with the selected start and destination unchanged.
5.2 Visual requirements
- Use the existing F1 car visual language. Cars can be simplified or scaled down for this transition, but must still read as cars rather than dots or generic arrows.
- Top-origin traffic moves downward; bottom-origin traffic moves upward. Do not send both groups in the same direction.
- Keep the animation compact and short. It should bridge the route form and the map, not become a second welcome animation.
- Maintain parallel spacing within each group. Avoid collisions, overlap that makes the cars unreadable, and erratic random paths.
- Use the existing red, neon orange, white and black palette.
- The transition should cover or overlay the route-selection screen cleanly, then clear fully before the map is interacted with.
5.3 Implementation guidance
- Create a dedicated component, suggested path: frontend/src/components/TrafficTransition.jsx.
- Trigger it from the route-selection submit callback in App.jsx (or from a small transition controller owned by App.jsx).
- Do not change the meaning of the start/destination form or add extra inputs, route cards or settings.
- Preserve the selected start and destination through the transition. Do not recompute or clear them while the animation is playing.
- Mount or reveal NavigationDashboard only after the transition completes. Avoid initializing Leaflet multiple times or starting navigation movement just because the transition finished.
- Guard against repeated submit actions while the animation is active. The next-page callback should run once.
- Clean up timers, animation frames and listeners on unmount.
- Support prefers-reduced-motion by shortening or skipping the animation without blocking entry to the map.
6. Required application flow and state ownership
Wire the application into this exact sequence:

WelcomePage → ParticleGlobeTransition → BriefPage → RouteSelectionPage → TrafficTransition → NavigationDashboard

Implementation responsibilities:
- App.jsx owns the active page/transition state and selected route/location values.
- WelcomePage.jsx shows the welcome message and starts the first transition. It must not directly navigate to route entry.
- ParticleGlobeTransition.jsx runs the pixel diffusion, globe formation and two-half separation, then signals completion.
- BriefPage.jsx appears after the first transition and proceeds to route selection using its existing navigation callback.
- RouteSelectionPage.jsx retains the starting-point and destination inputs. Its submit action starts the traffic transition rather than mounting the cockpit immediately.
- TrafficTransition.jsx plays the top-to-bottom and bottom-to-top car-group movement, then signals completion.
- NavigationDashboard.jsx is displayed only after the second transition completes.
Do not put the entire animation system inside App.jsx or overload WelcomePage.jsx with all particle and traffic rendering. Keep transition components isolated, reusable and easy to modify.
7. Component guide update — later task, not part of this change
After the UI implementation is complete, update the existing root-level components.md (lowercase filename) with the new component locations and responsibilities. Do not create a competing Components.md file and do not edit the guide during this task.

Add entries for:
Component	File location	Responsibility to document
Particle / Globe Transition	frontend/src/components/ParticleGlobeTransition.jsx	Captures the welcome composition's pixel colours, diffuses circular particles, forms a globe, splits the globe into left/right halves and signals when the Brief screen can appear.
Traffic Transition	frontend/src/components/TrafficTransition.jsx	Animates small F1 car groups from the top and bottom in opposite parallel directions between route entry and the navigation map.


Also update the existing entries for:
- frontend/src/App.jsx — documents the complete page flow and transition-state ownership.
- frontend/src/components/WelcomePage.jsx — documents the welcome greeting and handoff to the particle/globe sequence.
- frontend/src/components/BriefPage.jsx — documents its position after the globe transition.
- frontend/src/components/RouteSelectionPage.jsx — documents that submitting the two locations starts the traffic transition.
- frontend/src/index.css — documents the revised diagonal F1 keyframes and transition styling.
8. Acceptance checklist
Welcome and globe transition
- [ ] The welcome greeting is shown before the transition begins.
- [ ] The welcome composition visibly breaks into tiny circular particles.
- [ ] Particle colours are sampled from the original visible pixels; no arbitrary rainbow palette is introduced.
- [ ] Diffusion looks organic and high-energy, with particles moving in varied directions rather than in choreographed streams.
- [ ] Particles reorganize into a recognizable globe while retaining their source colours.
- [ ] The globe separates into a left half moving left and a right half moving right.
- [ ] The Brief screen appears only after the globe has moved apart.
- [ ] Automatic and manual progression cannot start duplicate animations.
Diagonal F1 cars
- [ ] The left-origin car finishes beyond the right edge.
- [ ] The right-origin car finishes beyond the left edge.
- [ ] Both paths are clearly diagonal and span the viewport.
- [ ] Each car visually faces the direction in which it travels.
- [ ] The cars remain legible and do not obscure the welcome copy.
Route-to-map traffic transition
- [ ] The start and destination fields remain the only route inputs.
- [ ] Submitting the route form starts the traffic transition.
- [ ] The upper group moves downward and the lower group moves upward.
- [ ] Cars travel in parallel lanes with small timing variation.
- [ ] The map appears only after the transition completes.
- [ ] Selected start and destination values are preserved.
- [ ] No duplicate map initialization or unintended navigation start occurs.
Quality and compatibility
- [ ] Animations are responsive to desktop and mobile screen sizes.
- [ ] Animation loops, timers and event listeners are cleaned up.
- [ ] Reduced-motion settings do not trap the user or prevent page progression.
- [ ] No backend, route-generation or map-matching code is changed as part of this task.
- [ ] Existing visual identity and approved copy are preserved except where the welcome and brief content must be separated into their correct stages.
9. Out of scope
- Do not change the OSRM / OpenStreetMap backend, routing pipeline or Kalman filtering.
- Do not modify route geometry, selected locations or the two-dropdown route-selection requirement.
- Do not redesign the navigation cockpit or Leaflet map.
- Do not add unrelated particle colours, extra decorative effects, new cards or filler sections.
- Do not update components.md yet; document the intended follow-up locations only.