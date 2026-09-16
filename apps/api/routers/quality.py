"""
Quality Router: Data Quality, Validation Gates & Anomaly Audits
Endpoints for 12-gate pass/fail metrics, data integrity scores, and statistical outlier feeds.
"""

from datetime import datetime, date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload

from database import get_db
import models

router = APIRouter(prefix="/api/v1/quality", tags=["Data Quality & Anomalies"])


class QualitySummaryResponse(BaseModel):
    total_observations: int
    valid_observations: int
    invalid_observations: int
    review_observations: int
    overall_pass_rate_pct: float
    average_quality_score: float
    gate_breakdown: List[Dict[str, Any]]


class AnomalyItem(BaseModel):
    id: str
    route_code: str
    advance_purchase_days: int
    method: str
    fare_amount: float
    expected_lower: float
    expected_upper: float
    severity: str
    status: str
    detected_at: datetime


@router.get("/summary", response_model=QualitySummaryResponse)
async def get_quality_summary(db: AsyncSession = Depends(get_db)):
    """Retrieve overall quality health metrics across all ingested fare observations."""
    total_obs = await db.scalar(select(func.count(models.FareObservation.id))) or 0
    valid_obs = await db.scalar(select(func.count(models.FareObservation.id)).where(models.FareObservation.validation_status == "VALID")) or 0
    invalid_obs = await db.scalar(select(func.count(models.FareObservation.id)).where(models.FareObservation.validation_status == "INVALID")) or 0
    review_obs = await db.scalar(select(func.count(models.FareObservation.id)).where(models.FareObservation.validation_status == "REVIEW")) or 0

    avg_score = await db.scalar(select(func.avg(models.FareObservation.quality_score))) or 1.0

    # Gate breakdown from quality_results
    gate_stmt = (
        select(
            models.QualityResult.check_name,
            func.count(models.QualityResult.id).label("total_checks"),
            func.sum(func.cast(models.QualityResult.passed, models.Integer)).label("passed_checks")
        )
        .group_by(models.QualityResult.check_name)
    )
    gate_res = await db.execute(gate_stmt)
    gate_rows = gate_res.all()

    gate_breakdown = []
    for row in gate_rows:
        check_name, total_c, passed_c = row
        pass_rate = round((passed_c / total_c * 100.0), 2) if total_c > 0 else 100.0
        gate_breakdown.append({
            "gate_name": check_name,
            "total_evaluated": total_c,
            "passed_count": passed_c,
            "pass_rate_pct": pass_rate
        })

    pass_rate = round((valid_obs / total_obs * 100.0), 2) if total_obs > 0 else 100.0

    return QualitySummaryResponse(
        total_observations=total_obs,
        valid_observations=valid_obs,
        invalid_observations=invalid_obs,
        review_observations=review_obs,
        overall_pass_rate_pct=pass_rate,
        average_quality_score=round(float(avg_score), 4),
        gate_breakdown=gate_breakdown
    )


@router.get("/anomalies", response_model=List[AnomalyItem])
async def get_anomalies(
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve list of flagged statistical anomalies with MAD / IQR boundary estimates."""
    stmt = (
        select(models.AnomalyEvent)
        .options(
            selectinload(models.AnomalyEvent.route),
            selectinload(models.AnomalyEvent.fare_observation)
        )
        .order_by(desc(models.AnomalyEvent.detected_at))
    )
    if severity:
        stmt = stmt.where(models.AnomalyEvent.severity == severity.upper())

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    anomalies = result.scalars().all()

    return [
        AnomalyItem(
            id=a.id,
            route_code=a.route.route_code if a.route else "UNKNOWN",
            advance_purchase_days=a.advance_purchase_days,
            method=a.method,
            fare_amount=float(a.metric_value),
            expected_lower=float(a.expected_range_lower),
            expected_upper=float(a.expected_range_upper),
            severity=a.severity,
            status=a.status,
            detected_at=a.detected_at
        )
        for a in anomalies
    ]
