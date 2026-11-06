"""
Unit tests for calibrated noise generation, variance calculations, and geodetic math.
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
    haversine_distance,
    calculate_bearing,
    generate_navic_noise,
    LATITUDE_VARIANCE_DEG2,
    LONGITUDE_VARIANCE_DEG2,
    DROPOUT_PERCENTAGE,
    SIMULATED_SPEED_MPS,
)


def test_noise_calibration_units():
    """Verify that variances are 1e-8 deg^2 and standard deviation is 0.0001 deg."""
    assert LATITUDE_VARIANCE_DEG2 == 1e-8
    assert LONGITUDE_VARIANCE_DEG2 == 1e-8

    std_lat_deg = math.sqrt(LATITUDE_VARIANCE_DEG2)
    std_lon_deg = math.sqrt(LONGITUDE_VARIANCE_DEG2)
    assert math.isclose(std_lat_deg, 0.0001, rel_tol=1e-6)
    assert math.isclose(std_lon_deg, 0.0001, rel_tol=1e-6)

    # Around Bengaluru latitude 12.9 deg N
    lat_rad = math.radians(12.9)
    sigma_lat_m = std_lat_deg * 111139.0
    sigma_lon_m = std_lon_deg * (111139.0 * math.cos(lat_rad))
    sigma_h_m = math.sqrt(sigma_lat_m**2 + sigma_lon_m**2)

    # 11.11m in lat, 10.83m in lon -> ~15.5m horizontal accuracy
    assert 11.0 <= sigma_lat_m <= 11.2
    assert 10.7 <= sigma_lon_m <= 11.0
    assert 15.0 <= sigma_h_m <= 16.0


def test_haversine_and_bearing():
    """Verify haversine distance and compass bearing calculations."""
    pt1 = [77.4713, 12.9051]
    pt2 = [77.5267, 12.8570]

    dist = haversine_distance(pt1, pt2)
    assert 7500.0 <= dist <= 8500.0  # Approx 8 km

    bearing = calculate_bearing(pt1, pt2)
    assert 120.0 <= bearing <= 150.0  # Southeast orientation

    # Identical points
    assert haversine_distance(pt1, pt1) == 0.0
    assert calculate_bearing(pt1, pt1) == 0.0


def test_observation_generation_properties():
    """Verify generated observations have strictly monotonic timestamps and preserved endpoints."""
    # Synthetic 50-point straight corridor
    base_coords = [
        [round(77.50 + i * 0.001, 6), round(12.90 + i * 0.0005, 6)]
        for i in range(50)
    ]

    start_time = 1790000000
    observations = generate_navic_noise(base_coords, start_timestamp=start_time)

    # Endpoints must be strictly preserved
    assert observations[0].index == 0
    assert observations[-1].index == len(base_coords) - 1

    # Timestamps must be strictly monotonically increasing
    for k in range(1, len(observations)):
        assert observations[k].timestamp > observations[k - 1].timestamp

    # Accuracy must be ~15.5m
    for obs in observations:
        assert 15.0 <= obs.accuracy_meters <= 16.0
        assert len(obs.coord) == 2

    # Bearings should be populated for moving observations
    valid_bearings = [o.bearing for o in observations if o.bearing is not None]
    assert len(valid_bearings) > 0
    for b in valid_bearings:
        assert 0.0 <= b <= 360.0
