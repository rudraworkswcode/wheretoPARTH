"""
where to PARTH — Test Suite Runner
Runs unit and integration tests across:
- test_noise_and_math.py
- test_kalman_fallback.py
- test_pipeline_api.py
- test_parallel_road_matching.py
"""

import asyncio
import inspect
import sys
import time

import tests.test_noise_and_math as t_noise
import tests.test_kalman_fallback as t_kalman
import tests.test_pipeline_api as t_pipeline
import tests.test_parallel_road_matching as t_parallel


def run_module_tests(module, name):
    print(f"\n=======================================================")
    print(f"Running Test Suite: {name}")
    print(f"=======================================================")
    passed = 0
    failed = 0

    for attr_name in dir(module):
        if attr_name.startswith("test_"):
            test_fn = getattr(module, attr_name)
            if callable(test_fn):
                t0 = time.time()
                try:
                    if inspect.iscoroutinefunction(test_fn):
                        asyncio.run(test_fn())
                    else:
                        test_fn()
                    elapsed = (time.time() - t0) * 1000
                    print(f"  ✓ {attr_name} ({elapsed:.1f}ms)")
                    passed += 1
                except Exception as exc:
                    elapsed = (time.time() - t0) * 1000
                    print(f"  ✗ {attr_name} FAILED ({elapsed:.1f}ms): {exc}")
                    failed += 1

    return passed, failed


def main():
    total_passed = 0
    total_failed = 0

    suites = [
        (t_noise, "Noise Calibration & Geodetic Math"),
        (t_kalman, "4D Metric Kalman Filter Fallback"),
        (t_pipeline, "Dynamic Pipeline & OSRM Match Windowing"),
        (t_parallel, "Parallel Road Disambiguation & Outage Handling"),
    ]

    for mod, desc in suites:
        p, f = run_module_tests(mod, desc)
        total_passed += p
        total_failed += f

    print(f"\n-------------------------------------------------------")
    print(f"Test Summary: {total_passed} Passed, {total_failed} Failed")
    print(f"-------------------------------------------------------")

    if total_failed > 0:
        sys.exit(1)
    print("ALL TESTS PASSED SUCCESSFULLY! ✓\n")


if __name__ == "__main__":
    main()

