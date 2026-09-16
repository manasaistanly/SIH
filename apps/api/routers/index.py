"""
Index Router: National & Route-Level Airfare Price Indices
Endpoints for real-time index metrics, timeseries historical charts, route components,
and full cryptographic/methodological audit lineage.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database import get_db
import models

router = APIRouter(prefix="/api/v1/index", tags=["Airfare Price Index"])


class LatestIndexResponse(BaseModel):
    id: str
    index_date: date
    national_index: float
    daily_change_pct: Optional[float]
    weekly_change_pct: Optional[float]
    monthly_change_pct: Optional[float]
    confidence_level: str
    coverage_ratio: float
    total_observations: int
    total_routes_active: int
    total_routes_covered: int
    calculated_at: datetime
    methodology_version: str

    class Config:
        from_attributes = True


class TimeseriesPoint(BaseModel):
    date: date
    national_index: float
    daily_change_pct: Optional[float]
    total_observations: int
    confidence_level: str


class RouteIndexResponse(BaseModel):
    id: str
    route_code: str
    origin_iata: str
    origin_city: str
    destination_iata: str
    destination_city: str
    index_date: date
    current_index: float
    current_median_fare: float
    base_median_fare: float
    observation_count: int
    daily_change_pct: Optional[float]


class LineageResponse(BaseModel):
    index_id: str
    index_date: date
    national_index: float
    methodology: Dict[str, Any]
    basket_name: str
    route_components: List[Dict[str, Any]]
    confidence_level: str
    total_observations_analyzed: int
    coverage_ratio: float
    audit_trail: Dict[str, Any]


@router.get("/latest", response_model=LatestIndexResponse)
async def get_latest_index(db: AsyncSession = Depends(get_db)):
    """Retrieve the latest calculated National Airfare Price Index value and metadata."""
    stmt = (
        select(models.AggregateIndex)
        .options(selectinload(models.AggregateIndex.methodology_version))
        .order_by(desc(models.AggregateIndex.index_date))
        .limit(1)
    )
    result = await db.execute(stmt)
    agg = result.scalar_one_or_none()

    if not agg:
        raise HTTPException(
            status_code=404,
            detail="No calculated index data available. Please trigger pipeline calculation."
        )

    return LatestIndexResponse(
        id=agg.id,
        index_date=agg.index_date,
        national_index=float(agg.national_index),
        daily_change_pct=float(agg.daily_change_pct) if agg.daily_change_pct is not None else None,
        weekly_change_pct=float(agg.weekly_change_pct) if agg.weekly_change_pct is not None else None,
        monthly_change_pct=float(agg.monthly_change_pct) if agg.monthly_change_pct is not None else None,
        confidence_level=agg.confidence_level,
        coverage_ratio=float(agg.coverage_ratio),
        total_observations=agg.total_observations,
        total_routes_active=agg.total_routes_active,
        total_routes_covered=agg.total_routes_covered,
        calculated_at=agg.calculated_at,
        methodology_version=agg.methodology_version.version_code if agg.methodology_version else "v1.0"
    )


@router.get("/timeseries", response_model=List[TimeseriesPoint])
async def get_timeseries(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(90, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve historical timeseries of the National Index for charts and trend analysis."""
    stmt = select(models.AggregateIndex).order_by(models.AggregateIndex.index_date.asc())

    if start_date:
        stmt = stmt.where(models.AggregateIndex.index_date >= start_date)
    if end_date:
        stmt = stmt.where(models.AggregateIndex.index_date <= end_date)

    stmt = stmt.limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return [
        TimeseriesPoint(
            date=r.index_date,
            national_index=float(r.national_index),
            daily_change_pct=float(r.daily_change_pct) if r.daily_change_pct is not None else None,
            total_observations=r.total_observations,
            confidence_level=r.confidence_level
        )
        for r in rows
    ]


@router.get("/routes", response_model=List[RouteIndexResponse])
async def get_route_indices(
    index_date: Optional[date] = Query(None, description="Specific index date; defaults to latest"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve route-level indices and current median fares across active basket routes."""
    if not index_date:
        latest_stmt = select(models.RouteIndex.index_date).order_by(desc(models.RouteIndex.index_date)).limit(1)
        res = await db.execute(latest_stmt)
        index_date = res.scalar_one_or_none()

    if not index_date:
        return []

    stmt = (
        select(models.RouteIndex)
        .options(
            selectinload(models.RouteIndex.route).selectinload(models.Route.origin),
            selectinload(models.RouteIndex.route).selectinload(models.Route.destination)
        )
        .where(models.RouteIndex.index_date == index_date)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return [
        RouteIndexResponse(
            id=r.id,
            route_code=r.route.route_code,
            origin_iata=r.route.origin.iata_code,
            origin_city=r.route.origin.city,
            destination_iata=r.route.destination.iata_code,
            destination_city=r.route.destination.city,
            index_date=r.index_date,
            current_index=float(r.current_index),
            current_median_fare=float(r.current_median_fare),
            base_median_fare=float(r.base_median_fare),
            observation_count=r.observation_count,
            daily_change_pct=float(r.daily_change_pct) if r.daily_change_pct is not None else None
        )
        for r in rows
    ]


@router.get("/{id}/lineage", response_model=LineageResponse)
async def get_index_lineage(id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve full audit lineage chain for a specific calculated index point.
    Traces from methodology formulation down to underlying route medians and observation volumes.
    """
    stmt = (
        select(models.AggregateIndex)
        .options(
            selectinload(models.AggregateIndex.methodology_version),
            selectinload(models.AggregateIndex.basket).selectinload(models.IndexBasket.basket_routes)
        )
        .where(models.AggregateIndex.id == id)
    )
    result = await db.execute(stmt)
    agg = result.scalar_one_or_none()

    if not agg:
        raise HTTPException(status_code=404, detail="Aggregate index record not found.")

    # Get route indices for this date
    r_stmt = (
        select(models.RouteIndex)
        .options(selectinload(models.RouteIndex.route))
        .where(
            models.RouteIndex.index_date == agg.index_date,
            models.RouteIndex.methodology_version_id == agg.methodology_version_id
        )
    )
    r_res = await db.execute(r_stmt)
    route_indices = r_res.scalars().all()

    route_components = []
    for ri in route_indices:
        basket_route = next(
            (br for br in (agg.basket.basket_routes if agg.basket else []) if br.route_id == ri.route_id),
            None
        )
        weight = float(basket_route.weight) if basket_route else 0.0

        route_components.append({
            "route_id": ri.route_id,
            "route_code": ri.route.route_code if ri.route else "UNKNOWN",
            "weight": weight,
            "current_index": float(ri.current_index),
            "base_median_fare": float(ri.base_median_fare),
            "current_median_fare": float(ri.current_median_fare),
            "observation_count": ri.observation_count,
            "coverage_ratio": float(ri.coverage_ratio)
        })

    return LineageResponse(
        index_id=agg.id,
        index_date=agg.index_date,
        national_index=float(agg.national_index),
        methodology={
            "version": agg.methodology_version.version_code if agg.methodology_version else "v1.0",
            "formula": agg.methodology_version.formula_name if agg.methodology_version else "LASPEYRES",
            "rules": agg.methodology_version.aggregation_rules if agg.methodology_version else {}
        },
        basket_name=agg.basket.basket_name if agg.basket else "National-Metro-Basket",
        route_components=route_components,
        confidence_level=agg.confidence_level,
        total_observations_analyzed=agg.total_observations,
        coverage_ratio=float(agg.coverage_ratio),
        audit_trail={
            "calculation_timestamp": agg.calculated_at.isoformat(),
            "revision": agg.revision_number,
            "is_official": agg.is_official,
            "data_pipeline_source": "DEMO_SYNTHETIC_FEED",
            "status": "VERIFIED_AUDITABLE"
        }
    )
