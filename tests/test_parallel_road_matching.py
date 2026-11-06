"""
Parallel road disambiguation and edge-case validation test suite:
1. Controlled lateral displacement towards parallel service/frontage road.
2. Temporal continuity and bearing preservation during sequence matching.
3. Reverse direction sequence testing.
4. GNSS dropout gap handling.
5. Distinction between NO_MATCH (unmapped) and OSRM_UNAVAILABLE (outage).
"""

from unittest.mock import AsyncMock, patch
import httpx

try:
    import pytest
except ImportError:
    class MockPytest:
        class mark:
            @staticmethod
            def asyncio(fn):
                return fn
        class raises:
            def __init__(self, expected_exc):
                self.expected_exc = expected_exc
            def __enter__(self):
                return self
            def __exit__(self, exc_type, exc_val, exc_tb):
                if exc_type is None:
                    raise AssertionError(f"Expected {self.expected_exc} was not raised")
                return issubclass(exc_type, self.expected_exc)
    pytest = MockPytest()

from main import (
    ObservationPoint,
    fetch_osrm_correction,
    haversine_distance,
    calculate_bearing,
)


def create_parallel_road_trace(
    reverse: bool = False,
    inject_gap: bool = False,
    lateral_shift_meters: float = 18.0,
):
    """
    Simulates a 20-point trajectory along an arterial road corridor (e.g. Outer Ring Road, Bengaluru)
    with parallel frontage road ~25m to the east.
    Controlled lateral noise shifts points 18m eastward (closer to frontage road),
    relying on timestamps, radiuses, and bearings to preserve main-corridor matching.
    """
    base_lons = [round(77.5600 + i * 0.0004, 6) for i in range(20)]
    base_lats = [round(12.9200 + i * 0.0004, 6) for i in range(20)]

    if reverse:
        base_lons = list(reversed(base_lons))
        base_lats = list(reversed(base_lats))

    t0 = 1790000000
    observations = []

    for idx, (lon, lat) in enumerate(zip(base_lons, base_lats)):
        # Optional GNSS gap: drop indices 8, 9, 10
        if inject_gap and 8 <= idx <= 10:
            continue

        # Inject lateral shift (closer to parallel road)
        # 18 meters east:
        dlon = lateral_shift_meters / (111139.0 * 0.9747)
        shifted_lon = round(lon + dlon, 6)
        shifted_lat = lat

        t = t0 + idx * 3  # 3 seconds per step (~48 km/h)

        observations.append(
            ObservationPoint(
                index=idx,
                coord=[shifted_lon, shifted_lat],
                timestamp=t,
                accuracy_meters=15.5,
                bearing=None,
            )
        )

    # Derive bearings
    for k in range(1, len(observations)):
        disp = haversine_distance(observations[k - 1].coord, observations[k].coord)
        if disp >= 2.0:
            observations[k].bearing = round(
                calculate_bearing(observations[k - 1].coord, observations[k].coord), 1
            )

    return observations


@pytest.mark.asyncio
async def test_parallel_road_matching_preserves_bearing_and_radiuses():
    """Verify that matching payload passes bearings and search radiuses for disambiguation."""
    obs = create_parallel_road_trace(reverse=False, inject_gap=False)

    captured_url = None
    captured_params = None

    async def mock_get(url, params=None):
        nonlocal captured_url, captured_params
        captured_url = url
        captured_params = params
        return httpx.Response(
            200,
            json={
                "code": "Ok",
                "matchings": [
                    {
                        "confidence": 0.89,
                        "geometry": {
                            "type": "LineString",
                            "coordinates": [o.coord for o in obs],
                        },
                    }
                ],
                "tracepoints": [{"location": o.coord} for o in obs],
            },
        )

    with patch("httpx.AsyncClient.get", side_effect=mock_get):
        status_label, matching_result = await fetch_osrm_correction(obs)

        assert status_label == "MATCHED"
        assert matching_result.confidence == 0.89
        assert captured_params is not None
        assert "bearings" in captured_params
        assert "radiuses" in captured_params
        assert "timestamps" in captured_params
        # Bearings must be formatted as "{bearing},{tolerance}" (e.g. "45,25")
        assert ",25" in captured_params["bearings"]


@pytest.mark.asyncio
async def test_parallel_road_reverse_direction_and_gap():
    """Verify reverse direction with gap preserves split handling and monotonic timestamps."""
    obs_rev = create_parallel_road_trace(reverse=True, inject_gap=True)

    # Ensure timestamps remain strictly increasing despite reverse spatial movement
    for k in range(1, len(obs_rev)):
        assert obs_rev[k].timestamp > obs_rev[k - 1].timestamp

    mock_resp = {
        "code": "Ok",
        "matchings": [
            {
                "confidence": 0.84,
                "geometry": {
                    "type": "LineString",
                    "coordinates": [o.coord for o in obs_rev],
                },
            }
        ],
        "tracepoints": [{"location": o.coord} for o in obs_rev],
    }

    with patch("main.match_single_window", new=AsyncMock(return_value=(mock_resp, 200))):
        status_label, matching_result = await fetch_osrm_correction(obs_rev)
        assert status_label == "MATCHED"
        assert matching_result.confidence == 0.84


@pytest.mark.asyncio
async def test_distinguish_no_match_vs_osrm_unavailable():
    """Verify distinct handling of unmapped road (NO_MATCH) vs infrastructure failure (OSRM_UNAVAILABLE)."""
    obs = create_parallel_road_trace()

    # Case 1: Unmapped / out-of-coverage coordinates -> OSRM returns NoMatch
    no_match_resp = {"code": "NoMatch", "message": "Could not match tracepoints"}
    with patch("main.match_single_window", new=AsyncMock(return_value=(no_match_resp, 200))):
        status_label, matching_result = await fetch_osrm_correction(obs)
        assert status_label == "NO_MATCH"
        assert matching_result.geometry is None

    # Case 2: Infrastructure outage (Connection error / container stopped)
    with patch("main.match_single_window", side_effect=httpx.ConnectError("Connection refused")):
        status_label, matching_result = await fetch_osrm_correction(obs)
        assert status_label == "OSRM_UNAVAILABLE"
        assert matching_result.status == "OSRM_UNAVAILABLE"
