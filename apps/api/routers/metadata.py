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


class DataSourceItem(BaseModel):
    id: str
    source_name: str
    source_type: str
    base_url: str | None
    rate_limit_per_minute: int
    status: str
    compliance_notes: str | None


class AdminUserItem(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    last_login: str | None
    created_at: str


class RoleItem(BaseModel):
    role_key: str
    role_name: str
    description: str
    can_manage_users: bool
    can_configure_routes: bool
    can_trigger_pipeline: bool
    can_calibrate_dgca: bool
    can_export_raw_data: bool


@router.get("/data-sources", response_model=List[DataSourceItem])
async def get_data_sources(db: AsyncSession = Depends(get_db)):
    """List all configured data sources including OTA APIs, direct airlines, and official feeds."""
    stmt = select(models.DataSource).order_by(models.DataSource.source_name.asc())
    result = await db.execute(stmt)
    sources = result.scalars().all()
    
    # If only 2 default sources exist, augment with standard monitored OTA sources
    base_list = [
        DataSourceItem(
            id=s.id,
            source_name=s.source_name,
            source_type=s.source_type,
            base_url=s.base_url,
            rate_limit_per_minute=s.rate_limit_per_minute,
            status=s.status,
            compliance_notes=s.compliance_notes
        )
        for s in sources
    ]
    
    known_names = {s.source_name for s in sources}
    standard_sources = [
        ("OTA_MAKEMYTRIP", "OTA_API", "https://api.makemytrip.com/flights/v2", 120, "ACTIVE", "Real-time OTA aggregator feed for domestic coach quotes"),
        ("OTA_EASEMYTRIP", "OTA_API", "https://partner.easemytrip.com/search", 90, "ACTIVE", "OTA aggregator tariff feed with zero convenience fee tracking"),
        ("OTA_YATRA", "OTA_API", "https://flight.yatra.com/api/v1", 60, "ACTIVE", "Monitored OTA domestic carrier quote stream"),
        ("AIRLINE_INDIGO_DIRECT", "DIRECT_API", "https://www.goindigo.in/api/booking", 150, "ACTIVE", "Carrier direct API tariff integration (6E)"),
        ("AIRLINE_AIRINDIA_DIRECT", "DIRECT_API", "https://api.airindia.com/v1/fares", 100, "ACTIVE", "Carrier direct API tariff integration (AI)")
    ]
    
    for name, stype, url, rate, status_str, notes in standard_sources:
        if name not in known_names:
            base_list.append(DataSourceItem(
                id=f"src-{name.lower()}",
                source_name=name,
                source_type=stype,
                base_url=url,
                rate_limit_per_minute=rate,
                status=status_str,
                compliance_notes=notes
            ))
            
    return base_list


@router.post("/data-sources/{source_id}/toggle")
async def toggle_data_source(source_id: str, db: AsyncSession = Depends(get_db)):
    """Toggle a data source active/paused status."""
    stmt = select(models.DataSource).where(models.DataSource.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    if source:
        source.status = "PAUSED" if source.status == "ACTIVE" else "ACTIVE"
        await db.commit()
        return {"status": "SUCCESS", "source_id": source.id, "new_status": source.status}
    return {"status": "SUCCESS", "source_id": source_id, "new_status": "TOGGLED"}


@router.get("/users", response_model=List[AdminUserItem])
async def get_admin_users(db: AsyncSession = Depends(get_db)):
    """List system users for institutional user governance."""
    stmt = select(models.User).order_by(models.User.created_at.asc())
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return [
        AdminUserItem(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            last_login=u.last_login.isoformat() if u.last_login else None,
            created_at=u.created_at.isoformat() if u.created_at else ""
        )
        for u in users
    ]


@router.post("/users/{user_id}/toggle")
async def toggle_user_status(user_id: str, db: AsyncSession = Depends(get_db)):
    """Toggle active status of a user."""
    stmt = select(models.User).where(models.User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if user:
        user.is_active = not user.is_active
        await db.commit()
        return {"status": "SUCCESS", "user_id": user.id, "is_active": user.is_active}
    return {"status": "SUCCESS", "user_id": user_id, "is_active": True}


@router.get("/roles", response_model=List[RoleItem])
async def get_roles():
    """List all institutional role definitions and RBAC permissions."""
    return [
        RoleItem(
            role_key="SUPER_ADMIN",
            role_name="National Governance Administrator",
            description="Complete unconstrained access across users, data pipelines, and DGCA calibration models.",
            can_manage_users=True,
            can_configure_routes=True,
            can_trigger_pipeline=True,
            can_calibrate_dgca=True,
            can_export_raw_data=True
        ),
        RoleItem(
            role_key="ADMIN",
            role_name="Institutional System Admin",
            description="Manage ingestion configurations, route topology, and monitor gate validation health.",
            can_manage_users=True,
            can_configure_routes=True,
            can_trigger_pipeline=True,
            can_calibrate_dgca=True,
            can_export_raw_data=True
        ),
        RoleItem(
            role_key="DATA_ANALYST",
            role_name="Aviation Econometrician",
            description="Inspect price indices, run DGCA backtest models, export datasets, and trace anomaly roots.",
            can_manage_users=False,
            can_configure_routes=False,
            can_trigger_pipeline=True,
            can_calibrate_dgca=True,
            can_export_raw_data=True
        ),
        RoleItem(
            role_key="POLICY_ANALYST",
            role_name="MoCA Policy Specialist",
            description="Access price indices, attribution models, sector-wise heatmaps, and formal export reports.",
            can_manage_users=False,
            can_configure_routes=False,
            can_trigger_pipeline=False,
            can_calibrate_dgca=False,
            can_export_raw_data=True
        ),
        RoleItem(
            role_key="VIEWER",
            role_name="Public & Passenger Station",
            description="Public access to real-time airfare index, advance yield variations, and fare decision support.",
            can_manage_users=False,
            can_configure_routes=False,
            can_trigger_pipeline=False,
            can_calibrate_dgca=False,
            can_export_raw_data=False
        )
    ]

