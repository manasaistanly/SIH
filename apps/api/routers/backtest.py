"""
Backtest Router: Official DGCA Benchmark Analysis
Endpoints to trigger, inspect, and compare index figures against authoritative
Directorate General of Civil Aviation government airfare statistics.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database import get_db, SyncSessionLocal
import models
from services.backtester import BacktestEngine
from auth import require_role

router = APIRouter(prefix="/api/v1/backtest", tags=["DGCA Official Backtesting"])


class BenchmarkItem(BaseModel):
    id: str
    reference_period: date
    route_code: Optional[str]
    avg_fare_inr: float
    total_passengers: Optional[int]
    data_source: str
    publication_url: Optional[str]
    data_type: str
    notes: Optional[str]


class BacktestSummaryResponse(BaseModel):
    run_id: str
    name: str
    methodology_version: str
    benchmark_name: str
    start_date: date
    end_date: date
    correlation: float
    mae: float
    rmse: float
    mape: float
    status: str
    notes: Optional[str]
    created_at: datetime
    data_pairs: Optional[List[Dict[str, Any]]] = None


@router.get("/latest", response_model=BacktestSummaryResponse)
async def get_latest_backtest(db: AsyncSession = Depends(get_db)):
    """Retrieve results of the latest backtest run against official DGCA benchmarks."""
    stmt = (
        select(models.BacktestRun)
        .options(selectinload(models.BacktestRun.methodology_version))
        .order_by(desc(models.BacktestRun.created_at))
        .limit(1)
    )
    result = await db.execute(stmt)
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(
            status_code=404,
            detail="No backtest run records found. Please trigger a backtest calculation."
        )

    # Re-run or reconstruct data pairs for visual chart comparison
    sync_session = SyncSessionLocal()
    try:
        details = BacktestEngine.run_backtest(
            session=sync_session,
            methodology_version_code=run.methodology_version.version_code if run.methodology_version else "v1.0"
        )
        data_pairs = details.get("data_pairs", [])
    finally:
        sync_session.close()

    return BacktestSummaryResponse(
        run_id=run.id,
        name=run.name,
        methodology_version=run.methodology_version.version_code if run.methodology_version else "v1.0",
        benchmark_name=run.reference_benchmark_name,
        start_date=run.start_date,
        end_date=run.end_date,
        correlation=float(run.correlation or 0.0),
        mae=float(run.mae or 0.0),
        rmse=float(run.rmse or 0.0),
        mape=float(run.mape or 0.0),
        status=run.status,
        notes=run.notes,
        created_at=run.created_at,
        data_pairs=data_pairs
    )


@router.post("/run", response_model=Dict[str, Any])
async def trigger_backtest(
    methodology: str = Query("v1.0", description="Methodology version code"),
    current_user: models.User = Depends(require_role(["ADMIN", "DATA_ANALYST"]))
):
    """
    Trigger a fresh backtest comparison of current model outputs against
    official DGCA government monthly statistics.
    Requires ADMIN or DATA_ANALYST role.
    """
    sync_session = SyncSessionLocal()
    try:
        results = BacktestEngine.run_backtest(
            session=sync_session,
            methodology_version_code=methodology
        )
        return results
    finally:
        sync_session.close()


@router.get("/benchmarks", response_model=List[BenchmarkItem])
async def get_dgca_benchmarks(
    limit: int = Query(24, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve stored official DGCA published domestic passenger fare benchmarks.
    Every data point is strictly marked with data_type='OFFICIAL_GOVT'.
    """
    stmt = (
        select(models.DGCABenchmark)
        .where(models.DGCABenchmark.data_type == "OFFICIAL_GOVT")
        .order_by(models.DGCABenchmark.reference_period.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()

    return [
        BenchmarkItem(
            id=r.id,
            reference_period=r.reference_period,
            route_code=r.route_code,
            avg_fare_inr=float(r.avg_fare_inr),
            total_passengers=r.total_passengers,
            data_source=r.data_source,
            publication_url=r.publication_url,
            data_type=r.data_type,
            notes=r.notes
        )
        for r in records
    ]
