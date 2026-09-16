"""
Integration Tests: FastAPI Endpoints
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["database"] == "CONNECTED"


def test_auth_login():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@rtapip.in",
        "password": "Admin@123456"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@rtapip.in"
    assert data["user"]["role"] == "ADMIN"


def test_auth_login_invalid():
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@rtapip.in",
        "password": "WrongPassword"
    })
    assert response.status_code == 401


def test_get_latest_index():
    response = client.get("/api/v1/index/latest")
    assert response.status_code == 200
    data = response.json()
    assert "national_index" in data
    assert data["national_index"] > 50.0
    assert data["confidence_level"] in ["HIGH", "MEDIUM"]


def test_get_index_timeseries():
    response = client.get("/api/v1/index/timeseries?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_dgca_backtest():
    response = client.get("/api/v1/backtest/latest")
    assert response.status_code == 200
    data = response.json()
    assert "correlation" in data
    assert data["correlation"] >= 0.90
    assert "mae" in data


def test_get_dgca_benchmarks():
    response = client.get("/api/v1/backtest/benchmarks")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 12
    assert all(b["data_type"] == "OFFICIAL_GOVT" for b in data)


def test_get_quality_summary():
    response = client.get("/api/v1/quality/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_observations"] > 0
    assert data["overall_pass_rate_pct"] >= 90.0
