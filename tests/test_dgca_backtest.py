"""
Statistical Alignment Tests: DGCA Official Government Data Backtesting
Verifies Pearson correlation r >= 0.95, MAE <= 2.5 index points, and MAPE <= 3.0%
against official published Directorate General of Civil Aviation tariff statistics.
"""

import sys
import os
import pytest
from decimal import Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))

from database import SyncSessionLocal
from services.backtester import BacktestEngine
import models


def test_dgca_backtest_statistical_alignment():
    session = SyncSessionLocal()
    try:
        # Run backtest against DGCA official benchmark table
        results = BacktestEngine.run_backtest(
            session=session,
            methodology_version_code="v1.0",
            benchmark_source="DGCA_MONTHLY_STATS"
        )

        assert "error" not in results
        assert results["sample_size"] >= 12
        assert results["correlation"] >= 0.95
        assert results["mae"] <= 2.5
        assert results["rmse"] <= 3.0
        assert results["mape_pct"] <= 3.0
        assert results["alignment_rating"] == "EXCELLENT"

        # Verify all pairs compare valid government figures
        for pair in results["data_pairs"]:
            assert pair["dgca_actual"] > 0
            assert pair["model_predicted"] > 0
            assert pair["raw_dgca_fare"] >= 3500.0
    finally:
        session.close()
