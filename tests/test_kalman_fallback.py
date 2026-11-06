"""
Unit tests for the 4D constant-velocity Kalman filter fallback in local metric Cartesian frame.
"""

import math
import numpy as np

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
    apply_kalman_smoothing,
    haversine_distance,
)


def test_kalman_smoothing_reduces_noise():
    """Verify that Kalman filtering in metric space smooths noisy observations along a corridor."""
    # True vehicle motion: 30 points along a straight line at 15 m/s (~54 km/h)
    true_points = []
    t0 = 1790000000
    for i in range(30):
        # 15 meters step northward
        lat = 12.90 + (i * 15.0 / 111139.0)
        lon = 77.50
        true_points.append([lon, lat])

    # Inject artificial zero-mean Gaussian noise with std 15m
    np.random.seed(42)
    observations = []
    for i, pt in enumerate(true_points):
        noise_lat_m = float(np.random.normal(0.0, 15.0))
        noise_lon_m = float(np.random.normal(0.0, 15.0))
        dlat = noise_lat_m / 111139.0
        dlon = noise_lon_m / (111139.0 * math.cos(math.radians(pt[1])))
        observations.append(
            ObservationPoint(
                index=i,
                coord=[round(pt[0] + dlon, 6), round(pt[1] + dlat, 6)],
                timestamp=t0 + i,
                accuracy_meters=15.5,
                bearing=0.0 if i > 0 else None,
            )
        )

    result = apply_kalman_smoothing(observations)

    assert result.used is True
    assert result.status == "kalman_estimate"
    assert len(result.coordinates) == len(observations)
    assert result.uncertainty_meters is not None
    assert result.uncertainty_meters > 0.0

    # Calculate RMSE of raw observations vs true points
    raw_errors = [
        haversine_distance(obs.coord, true_pt)
        for obs, true_pt in zip(observations, true_points)
    ]
    raw_rmse = math.sqrt(sum(e**2 for e in raw_errors) / len(raw_errors))

    # Calculate RMSE of Kalman estimated coordinates vs true points (excluding initial transient step 0)
    kalman_errors = [
        haversine_distance(k_pt, true_pt)
        for k_pt, true_pt in zip(result.coordinates[3:], true_points[3:])
    ]
    kalman_rmse = math.sqrt(sum(e**2 for e in kalman_errors) / len(kalman_errors))

    # Kalman filter must produce a smoothed estimate with lower variance than raw noisy trace
    assert kalman_rmse < raw_rmse


def test_kalman_fallback_insufficient_data():
    """Verify safe fallback when observation sequence has fewer than 2 points."""
    obs = [
        ObservationPoint(
            index=0,
            coord=[77.50, 12.90],
            timestamp=1790000000,
            accuracy_meters=15.5,
        )
    ]
    result = apply_kalman_smoothing(obs)
    assert result.used is True
    assert result.status == "insufficient_data"
    assert len(result.coordinates) == 1
