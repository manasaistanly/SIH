"""
Intelligence Router: Interactive Map, Route Intelligence, Predictions & Attribution
Endpoints providing:
1. /map/routes - GeoJSON network for Google Maps (8 analytical modes)
2. /routes/{route_code}/intelligence - Comprehensive corridor statistics & decision support
3. /routes/{route_code}/prediction - Advance-purchase yield forecast & prediction intervals
4. /routes/{route_code}/observed-flights - Observed ticket options
5. /index/attribution - 'Why Did Airfare Move?' factor decomposition
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db, SyncSessionLocal
from services.intelligence_engine import IntelligenceEngine

router = APIRouter(prefix="/api/v1", tags=["Airfare Intelligence & Mapping"])


@router.get("/map/routes")
def get_map_routes():
    """
    Retrieve all active routes with geographic coordinates (origin & destination)
    and metrics across all 8 map analytical visualization modes.
    """
    session = SyncSessionLocal()
    try:
        data = IntelligenceEngine.get_map_routes(session)
        return data
    finally:
        session.close()


@router.get("/routes/{route_code}/intelligence")
def get_route_intelligence(route_code: str):
    """
    Retrieve deep statistical intelligence for a specific flight corridor.
    Includes percentiles, booking window curve, airline comparison, and decision recommendation.
    """
    session = SyncSessionLocal()
    try:
        data = IntelligenceEngine.get_route_intelligence(session, route_code.upper())
        if not data:
            raise HTTPException(status_code=404, detail=f"Route {route_code} not found.")
        return data
    finally:
        session.close()


@router.get("/routes/{route_code}/prediction")
def get_route_prediction(route_code: str, horizon_days: int = Query(14, ge=1, le=60)):
    """
    Retrieve advance-purchase statistical forecast, direction, and uncertainty interval.
    Clearly classified as PREDICTED with explicit confidence scores.
    """
    session = SyncSessionLocal()
    try:
        intel = IntelligenceEngine.get_route_intelligence(session, route_code.upper())
        if not intel:
            raise HTTPException(status_code=404, detail=f"Route {route_code} not found.")
        return intel["prediction"]
    finally:
        session.close()


@router.get("/routes/{route_code}/observed-flights")
def get_observed_flight_options(route_code: str):
    """
    Retrieve observed ticket quotes on the corridor for airline comparison.
    Clearly classified as OBSERVED FARE (not live booking inventory).
    """
    session = SyncSessionLocal()
    try:
        data = IntelligenceEngine.get_observed_flight_options(session, route_code.upper())
        return data
    finally:
        session.close()


@router.get("/index/attribution")
def get_index_attribution():
    """
    Answer: 'WHY DID AIRFARE MOVE?'
    Decomposes aggregate index changes into measurable drivers:
    route contributions, booking-window compression, carrier dispersion, and calendar effects.
    """
    session = SyncSessionLocal()
    try:
        data = IntelligenceEngine.get_index_attribution(session)
        return data
    finally:
        session.close()
