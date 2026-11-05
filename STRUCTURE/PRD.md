# where to PARTH — Product Requirements Document

## 1. Product Overview

**Project Name:** where to PARTH  
**Hackathon:** 24-Hour Hackathon  
**Problem Statement:** Lane-Level Vehicle Navigation Using NavIC Satellite Signals  
**Problem Statement ID:** DL-SJBIT-HK26-GOVP009

### Product Brief

> Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way.
>
> Dw, Abhimanyu. This time, we'll get you out.

### Welcome Message

> Welcome to where to PARTH - Your smarter way to navigate through Life

where to PARTH is a software-based intelligent navigation prototype designed to improve vehicle positioning and route guidance.

The project explores how inaccurate location coordinates can be simulated, matched against road geometry, and used to provide better route guidance and advance turn notifications.

The current repository contains a Python-based FastAPI backend that generates simulated GPS noise and uses OSRM map matching.

The planned product also includes a React website with a welcome page, brief page, location selection, route display, and navigation alerts.

---

## 2. Problem Statement

Navigation systems can experience positioning errors due to inaccurate satellite location measurements.

These errors can result in:
- Incorrect road identification.
- Late turn notifications.
- Difficulty identifying the correct road segment.
- Incorrect lane guidance.
- Positioning interruptions due to temporary signal loss.

The problem statement expects a solution capable of:

1. Using publicly available NavIC/GNSS location data.
2. Improving vehicle positioning accuracy.
3. Identifying road segments and lanes wherever map data permits.
4. Detecting positioning errors.
5. Providing turn-by-turn navigation.
6. Suggesting alternative routes.
7. Estimating vehicle movement during temporary signal loss using historical movement patterns.
8. Operating without specialised hardware or raw satellite signal collection.

---

## 3. Proposed Solution

Our approach consists of the following workflow:

1. Create predefined route geometries using GeoJSON.io.
2. Store route geometry in GeoJSON files.
3. Generate slightly distorted GPS coordinates using a noise-generator script.
4. Send noisy coordinates to the OSRM Map Matching API.
5. Obtain matched road geometry where OSRM successfully matches the trace.
6. Simulate vehicle movement along predefined routes.
7. Identify upcoming turns and manoeuvres.
8. Alert drivers approximately 1 km before an upcoming manoeuvre.

The objective is to demonstrate how inaccurate positioning data can be processed to generate more useful route guidance.

**Technical clarification:** The current noise generator simulates positioning errors; it does not receive live NavIC satellite measurements. OSRM map matching does not automatically guarantee lane-level positioning. Lane-specific guidance depends on available lane-level map information and additional processing.

---

## 4. Target Users

### Primary User
A driver who wants clear navigation instructions and advance warnings before upcoming turns.

### Demonstration User
Hackathon judges and evaluators who interact with the website and observe the positioning and navigation simulation.

---

## 5. Product User Journey

The intended website journey is:

1. User opens the website.
2. Welcome page appears.
3. User proceeds to the brief page.
4. User selects a starting point.
5. User selects a destination.
6. The application loads or generates the appropriate route.
7. Route is displayed on the map.
8. Vehicle simulation begins.
9. Upcoming manoeuvres are identified.
10. Advance navigation alerts are displayed.
11. Vehicle reaches the destination.

---

## 6. Functional Requirements

| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | Display welcome page. | Must | Planned |
| FR-02 | Display exact welcome message. | Must | Copy confirmed |
| FR-03 | Display brief page. | Must | Copy confirmed |
| FR-04 | Allow Kengeri as a starting point. | Must | Route selection planned |
| FR-05 | Allow Kanakapura as a starting point. | Must | Route selection planned |
| FR-06 | Support Somapura as a destination. | Must | Route selection planned |
| FR-07 | Display selected route. | Must | Frontend planned |
| FR-08 | Load GeoJSON route geometry. | Must | Backend supports it |
| FR-09 | Generate simulated GPS noise. | Must | Backend implemented |
| FR-10 | Integrate OSRM map matching. | Must | Backend implemented |
| FR-11 | Return noisy and matched traces. | Must | Backend implemented |
| FR-12 | Simulate vehicle movement. | Must | Not verified in repository |
| FR-13 | Identify upcoming manoeuvres. | Must | To implement |
| FR-14 | Alert approximately 1 km before a manoeuvre. | Must | To implement |
| FR-15 | Suggest alternative routes. | Should | To implement |
| FR-16 | Estimate movement during signal loss. | Stretch | Not confirmed |
| FR-17 | Display lane-specific guidance when map data permits. | Conditional | Data-dependent |

---

## 7. Non-Functional Requirements

- The website should be intuitive and easy to navigate.
- Route information should be clearly visible.
- Navigation alerts should be understandable.
- The application should handle API failures.
- Components should have clearly defined locations.
- Simulated positioning data must be labelled honestly.
- The interface should maintain consistent styling.
- The prototype should be suitable for a live hackathon demonstration.

---

## 8. UI/UX Requirements

### Design Direction

F1-inspired racing interface.

### Colour Palette

| Colour | Hex |
|---|---|
| Red | `#FF0000` |
| Neon Orange | `#FF5F1F` |
| White | `#FFFFFF` |
| Black | `#000000` |

### Welcome Page Animation

The welcome page should contain:

- Two F1 cars.
- One car entering from the left.
- Another car entering from the right.
- Both cars moving diagonally across the screen simultaneously.
- Smooth and visually attractive movement.
- Readable welcome text.
- A clear navigation action.

Motion Primitives and 21st.dev can be explored as optional UI resources.

---

## 9. Brief Page Copy

The following is the approved and final brief:

> Every journey deserves the right direction and every turn, the right guidance. Your destination is the goal, we'll help you find the way.
>
> Dw, Abhimanyu. This time, we'll get you out.

The wording must be preserved.

---

## 10. Current Implementation Scope

The inspected repository currently contains:

- `main.py` — FastAPI application, GPS noise generation and OSRM map matching.
- `noise_config.json` — noise configuration.
- `mock_data/` — sample GeoJSON route files.
- `requirements.txt` — Python dependencies.
- `README.md` — project documentation.

The React frontend, Node.js service, separate vehicle simulation and navigation-alert interface are planned components, not verified existing files.

---

## 11. Success Criteria

The project demonstration should establish that:

1. The user can navigate through the welcome and brief pages.
2. The user can select a supported route.
3. The route is displayed on a map.
4. Noisy coordinates are generated.
5. OSRM matching is demonstrated.
6. A simulated vehicle moves along the route.
7. Advance turn notifications appear approximately 1 km before manoeuvres.
8. The team can explain the distinction between simulated GNSS noise, road matching and actual lane-level positioning.

---

## 12. Open Questions

- What are the verified coordinates of Kengeri, Kanakapura and Somapura?
- Which of the five supplied route combinations should be selectable?
- Should the 1 km alert use distance along the route?
- Which map-rendering library will be used?
- What are the final responsibilities of Node.js and FastAPI?
- Is temporary signal-loss estimation mandatory for the demonstration?
- What is the final noise configuration format?