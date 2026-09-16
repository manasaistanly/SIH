"""
Unit & Statistical Tests: Statistical Engines (MAD, IQR, Jevons, Laspeyres)
"""

import sys
import os
import pytest
from decimal import Decimal

# Add apps/api to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from services.anomaly_engine import AnomalyEngine
from services.index_engine import IndexEngine


def test_geometric_mean():
    # Geometric mean of [2, 8] is sqrt(16) = 4.0
    vals = [2.0, 8.0]
    res = IndexEngine.geometric_mean(vals)
    assert abs(res - 4.0) < 1e-6

    # Geometric mean of [1, 2, 4] is (8)^(1/3) = 2.0
    vals = [1.0, 2.0, 4.0]
    res = IndexEngine.geometric_mean(vals)
    assert abs(res - 2.0) < 1e-6


def test_median_calculation():
    assert IndexEngine.median([1.0, 3.0, 2.0]) == 2.0
    assert IndexEngine.median([1.0, 2.0, 3.0, 4.0]) == 2.5


def test_mad_anomaly_detection():
    # Normal fares around 5000, with one extreme spike at 25000
    fares = [
        {"fare_id": f"f_{i}", "amount": 5000 + (i * 50), "route_id": "r1", "advance_days": 15}
        for i in range(10)
    ]
    # Add outlier
    fares.append({"fare_id": "f_outlier", "amount": 28000, "route_id": "r1", "advance_days": 15})

    anomalies = AnomalyEngine.detect_mad_anomalies(fares, multiplier=3.0)
    assert len(anomalies) >= 1
    flagged_ids = [a["fare_id"] for a in anomalies]
    assert "f_outlier" in flagged_ids


def test_iqr_anomaly_detection():
    fares = [
        {"fare_id": f"f_{i}", "amount": 4000 + (i * 100), "route_id": "r1", "advance_days": 7}
        for i in range(15)
    ]
    # Add low outlier
    fares.append({"fare_id": "f_low", "amount": 500, "route_id": "r1", "advance_days": 7})

    anomalies = AnomalyEngine.detect_iqr_anomalies(fares, iqr_multiplier=1.5)
    assert len(anomalies) >= 1
    flagged_ids = [a["fare_id"] for a in anomalies]
    assert "f_low" in flagged_ids
