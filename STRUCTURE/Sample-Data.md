# where to PARTH — Sample Data and Route Catalogue

## 1. Predefined Locations

The project currently works with three named locations.

| Location | Initial role | Coordinates |
|---|---|---|
| Kengeri | Starting point | To be verified |
| Kanakapura | Starting point | To be verified |
| Somapura | Destination | To be verified |

Exact latitude and longitude values must be verified before being used in the final route geometry.

No coordinates are invented in this document.

---

## 2. Predefined Routes

The following route combinations were supplied by the team.

| Route ID | Starting Point | Destination | Preference |
|---|---|---|---|
| R-01 | Kengeri | Kanakapura | Faster |
| R-02 | Kanakapura | Kengeri | Not specified |
| R-03 | Somapura | Kengeri | Not specified |
| R-04 | Somapura | Kanakapura | Not specified |
| R-05 | Kengeri | Kanakapura | Slower |

---

## 3. Existing GeoJSON Files

The repository currently contains two sample route files.

| File | Feature Name | Geometry |
|---|---|---|
| `mock_data/route_exit_A.geojson` | Route Exit A | LineString |
| `mock_data/return_route.geojson` | Return Route | LineString |

Both files contain eight coordinate pairs in a GeoJSON FeatureCollection.

### Coordinate Format

GeoJSON uses:

`[longitude, latitude]`

The existing backend extracts coordinates from supported LineString geometry.

**Important:** These two files are generic sample routes. They have not been geographically verified as Kengeri, Kanakapura or Somapura routes.

They must be validated or replaced before being presented as the actual routes.

---

## 4. Route Metadata Requirements

Each final route should be associated with:

| Field | Description |
|---|---|
| routeId | Unique identifier such as R-01 |
| startName | Starting location |
| endName | Destination |
| preference | Faster, slower or unspecified |
| geojsonFile | Corresponding GeoJSON file |
| verified | Whether geographic coordinates have been checked |
| notes | Additional route information |

This is a documentation checklist, not a decision to introduce a database or a specific storage schema.

---

## 5. GeoJSON Requirements

The existing backend supports:

- FeatureCollection containing a LineString.
- FeatureCollection containing a MultiLineString.
- Feature containing a LineString.
- Bare LineString geometry.

The backend currently selects the first supported LineString it encounters. For a MultiLineString, it uses the first line.

A route must contain at least two coordinate pairs.

---

## 6. Route Definition Clarification

The initial description states:

- Kengeri and Kanakapura are starting points.
- Somapura is the destination.

However, the supplied route catalogue includes journeys in which:
- Kengeri is the destination.
- Somapura is the starting point.
- Kengeri and Kanakapura are connected directly.

All five route combinations are preserved exactly as supplied.

The team must confirm the final route-selection rules before frontend implementation.