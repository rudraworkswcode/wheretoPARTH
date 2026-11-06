"""
Integration tests for the dynamic simulation pipeline, request validation, and OSRM matching outcomes.
"""

from unittest.mock import AsyncMock, patch

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
from pydantic import ValidationError

from main import (
    DynamicRouteRequest,
    fetch_osrm_correction,
    simulate_dynamic_route,
    ReferenceRoute,
    TurnStep,
    ObservationPoint,
    haversine_distance,
)


def test_dynamic_route_request_validation():
    """Verify validation logic on coordinates and minimum displacement."""
    # Valid coordinates
    req = DynamicRouteRequest(
        start_lon=77.4713,
        start_lat=12.9051,
        end_lon=77.5267,
        end_lat=12.8570,
    )
    assert req.start_lon == 77.4713

    # Out of bounds latitude
    with pytest.raises(ValidationError):
        DynamicRouteRequest(
            start_lon=77.4713,
            start_lat=95.0,  # Invalid
            end_lon=77.5267,
            end_lat=12.8570,
        )

    # Identical / too close coordinates (< 10 meters)
    with pytest.raises(ValidationError):
        DynamicRouteRequest(
            start_lon=77.471300,
            start_lat=12.905100,
            end_lon=77.471305,
            end_lat=12.905105,
        )


@pytest.mark.asyncio
async def test_match_windowing_exceeds_40_observations():
    """Verify traces longer than 40 coordinates are split into overlapping batches of <= 40."""
    # Create 85 observations
    observations = [
        ObservationPoint(
            index=i,
            coord=[round(77.50 + i * 0.0005, 6), round(12.90 + i * 0.0005, 6)],
            timestamp=1790000000 + i * 2,
            accuracy_meters=15.5,
            bearing=45.0 if i > 0 else None,
        )
        for i in range(85)
    ]

    mock_match_resp = {
        "code": "Ok",
        "matchings": [
            {
                "confidence": 0.92,
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[77.50, 12.90], [77.54, 12.94]],
                },
            }
        ],
        "tracepoints": [{"location": [77.50, 12.90]}] * 40,
    }

    with patch("main.match_single_window", new=AsyncMock(return_value=(mock_match_resp, 200))) as mock_match:
        status_label, matching_result = await fetch_osrm_correction(observations)

        # 85 items with window size 40 and overlap 5:
        # Window 0: 0..40 (step 35)
        # Window 1: 35..75 (step 35)
        # Window 2: 70..85
        # Total calls = 3
        assert mock_match.call_count == 3
        assert status_label == "MATCHED"
        assert matching_result.confidence == 0.92


@pytest.mark.asyncio
async def test_simulate_pipeline_matched_outcome():
    """Verify full end-to-end simulation flow when OSRM match succeeds with high confidence."""
    req = DynamicRouteRequest(
        start_lon=77.4713,
        start_lat=12.9051,
        end_lon=77.5267,
        end_lat=12.8570,
    )

    fake_ref_route = ReferenceRoute(
        geometry={
            "type": "LineString",
            "coordinates": [
                [77.4713, 12.9051],
                [77.4900, 12.8800],
                [77.5267, 12.8570],
            ],
        },
        distance_meters=8500.0,
        duration_seconds=640.0,
        steps=[
            TurnStep(
                name="Expressway",
                instruction="Turn right onto Expressway",
                distance_meters=4200.0,
                duration_seconds=320.0,
                type="turn",
                modifier="right",
                location=[77.4900, 12.8800],
            )
        ],
    )

    fake_match_data = {
        "code": "Ok",
        "matchings": [
            {
                "confidence": 0.88,
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [77.4713, 12.9051],
                        [77.4900, 12.8800],
                        [77.5267, 12.8570],
                    ],
                },
            }
        ],
        "tracepoints": [
            {"location": [77.4713, 12.9051]},
            {"location": [77.4900, 12.8800]},
            {"location": [77.5267, 12.8570]},
        ],
    }

    with patch("main.fetch_base_route", new=AsyncMock(return_value=fake_ref_route)):
        with patch("main.match_single_window", new=AsyncMock(return_value=(fake_match_data, 200))):
            res = await simulate_dynamic_route(req)

            assert res.status == "MATCHED"
            assert res.active_position_source == "osrm_match"
            assert res.kalman_fallback.used is False
            assert res.matching.confidence == 0.88
            assert len(res.reference_route.steps) == 1
            assert res.reference_route.distance_meters == 8500.0


@pytest.mark.asyncio
async def test_simulate_pipeline_low_confidence_fallback():
    """Verify that low-confidence OSRM matching triggers clearly-labelled Kalman fallback."""
    req = DynamicRouteRequest(
        start_lon=77.4713,
        start_lat=12.9051,
        end_lon=77.5267,
        end_lat=12.8570,
    )

    fake_ref_route = ReferenceRoute(
        geometry={
            "type": "LineString",
            "coordinates": [[77.4713, 12.9051], [77.5267, 12.8570]],
        },
        distance_meters=8500.0,
        duration_seconds=640.0,
        steps=[],
    )

    # Return confidence 0.35 (below 0.65 threshold)
    fake_match_low_conf = {
        "code": "Ok",
        "matchings": [
            {
                "confidence": 0.35,
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[77.4713, 12.9051], [77.5267, 12.8570]],
                },
            }
        ],
        "tracepoints": [
            {"location": [77.4713, 12.9051]},
            {"location": [77.5267, 12.8570]},
        ],
    }

    with patch("main.fetch_base_route", new=AsyncMock(return_value=fake_ref_route)):
        with patch("main.match_single_window", new=AsyncMock(return_value=(fake_match_low_conf, 200))):
            res = await simulate_dynamic_route(req)

            assert res.status == "LOW_CONFIDENCE"
            assert res.active_position_source == "kalman_estimate"
            assert res.kalman_fallback.used is True
            assert res.kalman_fallback.status == "kalman_estimate"
            assert len(res.kalman_fallback.coordinates) > 0
