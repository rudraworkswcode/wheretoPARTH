# where to PARTH — Criteria and Problem Statement Coverage

## 1. Purpose

This document maps the hackathon problem statement to the current solution and identifies what can be demonstrated.

It distinguishes implemented features from planned features.

## 2. Problem Statement Coverage

| Requirement | Proposed solution | Demonstration evidence | Status |
|---|---|---|---|
| NavIC/GNSS location data | Simulated coordinates | Explain coordinate source | Live NavIC not implemented |
| Digital road maps | GeoJSON and OSRM | Show route geometry | Sample routes need real-world validation |
| Positioning improvement | Noise generation and OSRM matching | Compare noisy and matched traces | Backend workflow implemented; accuracy not measured |
| Road segment identification | OSRM Map Matching | Show matched geometry | Depends on map coverage |
| Lane identification | Lane-aware map data | Show actual lane metadata | Not guaranteed by OSRM |
| Error detection | Compare reference and noisy coordinates | Show deviation | Metric TBD |
| Turn-by-turn guidance | Manoeuvre detection | Display upcoming turn | To implement |
| Alternative routes | Routing alternatives | Show alternative route | To implement |
| Temporary signal loss | Historical movement estimation | Show estimated positions during signal gap | Not confirmed implemented |
| No specialised hardware | Software-based implementation | Run on development machine | Consistent with approach |
| No raw satellite collection | Simulated coordinate input | Explain simulation | No raw collection in current code |

---

## 3. Website Acceptance Checklist

### Welcome Page
- [ ] Exact welcome message is displayed.
- [ ] F1-inspired styling is implemented.
- [ ] Two F1 cars are visible.
- [ ] Left car moves diagonally.
- [ ] Right car moves diagonally.
- [ ] Both animations happen simultaneously.
- [ ] Navigation action works.

### Brief Page
- [ ] Approved brief is displayed exactly.
- [ ] Abhimanyu reference is preserved.
- [ ] Continue action works.

### Location Selection
- [ ] Kengeri is available where supported.
- [ ] Kanakapura is available where supported.
- [ ] Somapura is available where supported.
- [ ] Supported route pairs can be selected.
- [ ] Unsupported combinations are handled.

### Route Display
- [ ] GeoJSON files load.
- [ ] Route geometry is displayed.
- [ ] Starting point is identifiable.
- [ ] Destination is identifiable.
- [ ] OSRM integration works.
- [ ] Routing errors are handled.

### Positioning
- [ ] Noise generator produces distorted coordinates.
- [ ] Reference and noisy coordinates can be compared.
- [ ] OSRM matching result can be displayed.
- [ ] No-match fallback is clearly identified.
- [ ] Simulated data is labelled correctly.

### Navigation
- [ ] Vehicle simulation progresses along the route.
- [ ] Next manoeuvre is identified.
- [ ] Remaining route distance is calculated.
- [ ] Alert appears approximately 1 km before the manoeuvre.
- [ ] Alert text is understandable.
- [ ] Lane instructions are only shown when supported by map data.

---

## 4. Evidence for Judges

Prepare these demonstrations:

1. GeoJSON route geometry.
2. Original route versus noisy coordinates.
3. Noisy coordinates versus OSRM-matched geometry.
4. OSRM matching confidence or no-match state.
5. Vehicle moving along the route.
6. Advance turn alert.
7. Alternative route demonstration, if implemented.
8. Temporary signal-loss estimation, if implemented.

---

## 5. Technical Limitations

The team must not claim:

- Live NavIC reception unless implemented.
- Guaranteed lane-level positioning from OSRM alone.
- Lane data availability on every road.
- Real-world GPS accuracy based only on simulated noise.
- That a no-match fallback is a corrected road trace.
- Signal-loss prediction unless it is implemented and demonstrated.

---

## 6. Performance Metrics

| Metric | Purpose |
|---|---|
| Position error before matching | Measure simulated coordinate deviation |
| Position error after matching | Measure positioning improvement |
| Match success rate | Measure successful OSRM matching |
| Match confidence | Inspect OSRM matching confidence |
| Alert distance error | Measure accuracy of advance alerts |
| API response time | Measure backend response time |
| Route completion | Check whether simulation reaches destination |

Agree on numerical targets before testing.

Do not invent performance results.