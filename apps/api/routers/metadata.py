"""
Metadata Router: Reference & Structural Topology
Endpoints for airports, airlines, active basket routes, and formal methodology definitions.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
import models

router = APIRouter(prefix="/api/v1/metadata", tags=["Reference Topology & Methodology"])


class AirportItem(BaseModel):
    id: str
    iata_code: str
    icao_code: str
    name: str
    city: str
    state: str
    country: str
    latitude: float
    longitude: float


class AirlineItem(BaseModel):
    id: str
    iata_code: str
    icao_code: str
    name: str
    callsign: str | None


class RouteItem(BaseModel):
    id: str
    route_code: str
    origin_iata: str
    origin_city: str
    destination_iata: str
    destination_city: str
    distance_km: float
    dgca_category: str


class MethodologyResponse(BaseModel):
    version_code: str
    formula_name: str
    base_index_value: float
    description: str
    aggregation_rules: Dict[str, Any]


@router.get("/airports", response_model=List[AirportItem])
async def get_airports(db: AsyncSession = Depends(get_db)):
    """List all configured civil aviation airports with coordinates."""
    stmt = select(models.Airport).where(models.Airport.is_active == True).order_by(models.Airport.iata_code.asc())
    result = await db.execute(stmt)
    airports = result.scalars().all()
    return [
        AirportItem(
            id=a.id,
            iata_code=a.iata_code,
            icao_code=a.icao_code,
            name=a.name,
            city=a.city,
            state=a.state,
            country=a.country,
            latitude=float(a.latitude),
            longitude=float(a.longitude)
        )
        for a in airports
    ]


@router.get("/airlines", response_model=List[AirlineItem])
async def get_airlines(db: AsyncSession = Depends(get_db)):
    """List scheduled domestic commercial airlines."""
    stmt = select(models.Airline).where(models.Airline.is_active == True).order_by(models.Airline.name.asc())
    result = await db.execute(stmt)
    airlines = result.scalars().all()
    return [
        AirlineItem(
            id=a.id,
            iata_code=a.iata_code,
            icao_code=a.icao_code,
            name=a.name,
            callsign=a.callsign
        )
        for a in airlines
    ]


@router.get("/routes", response_model=List[RouteItem])
async def get_routes(db: AsyncSession = Depends(get_db)):
    """List monitored trunk routes with distance and airport metadata."""
    stmt = (
        select(models.Route)
        .options(selectinload(models.Route.origin), selectinload(models.Route.destination))
        .where(models.Route.is_active == True)
        .order_by(models.Route.route_code.asc())
    )
    result = await db.execute(stmt)
    routes = result.scalars().all()
    return [
        RouteItem(
            id=r.id,
            route_code=r.route_code,
            origin_iata=r.origin.iata_code,
            origin_city=r.origin.city,
            destination_iata=r.destination.iata_code,
            destination_city=r.destination.city,
            distance_km=float(r.distance_km),
            dgca_category=r.dgca_category
        )
        for r in routes
    ]


@router.get("/methodology", response_model=MethodologyResponse)
async def get_methodology(db: AsyncSession = Depends(get_db)):
    """Retrieve current official mathematical index methodology specifications."""
    stmt = select(models.MethodologyVersion).where(models.MethodologyVersion.is_active == True).limit(1)
    result = await db.execute(stmt)
    meth = result.scalar_one_or_none()

    if not meth:
        return MethodologyResponse(
            version_code="v1.0",
            formula_name="LASPEYRES",
            base_index_value=100.0,
            description="Default Laspeyres domestic index methodology.",
            aggregation_rules={}
        )

    return MethodologyResponse(
        version_code=meth.version_code,
        formula_name=meth.formula_name,
        base_index_value=float(meth.base_index_value),
        description=meth.description or "",
        aggregation_rules=meth.aggregation_rules or {}
    )
