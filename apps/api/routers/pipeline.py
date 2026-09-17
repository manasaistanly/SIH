"""
Pipeline Router: Batch Collection & Index Computation Orchestration
Endpoints to initiate pipeline cycles and monitor collection run telemetry.
"""

from datetime import date, datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from database import get_db
import models
from services.pipeline import execute_full_pipeline
from auth import require_role

router = APIRouter(prefix="/api/v1/pipeline", tags=["Pipeline Orchestration"])


class PipelineTriggerRequest(BaseModel):
    collection_date: Optional[date] = None
    seed: Optional[int] = 42


class RunTelemetryResponse(BaseModel):
    id: str
    source_name: str
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    records_observed: int
    records_valid: int
    created_at: datetime


from config import get_settings
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth import get_current_user

settings = get_settings()
optional_security = HTTPBearer(auto_error=False)


@router.post("/trigger", response_model=Dict[str, Any])
async def trigger_pipeline_run(
    payload: Optional[PipelineTriggerRequest] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger end-to-end collection, 12-gate quality verification,
    anomaly detection, and daily Laspeyres index computation.
    Requires ADMIN role (or development mode).
    """
    user_email = "admin@rtapip.gov.in"
    if credentials:
        user = await get_current_user(credentials, db)
        if user.role != "ADMIN":
            raise HTTPException(
                status_code=403,
                detail="Operation not permitted. Required role: ADMIN"
            )
        user_email = user.email
    elif settings.api_env != "development":
        raise HTTPException(
            status_code=401,
            detail="Authentication required for production pipeline execution."
        )

    target_date = payload.collection_date if payload and payload.collection_date else date.today()
    seed_val = payload.seed if payload and payload.seed is not None else 42

    try:
        summary = execute_full_pipeline(collection_date=target_date, seed=seed_val)
        return {
            "status": "COMPLETED",
            "executed_by": user_email,
            "pipeline_summary": summary
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline execution failed: {str(e)}"
        )


@router.get("/runs", response_model=List[RunTelemetryResponse])
async def list_collection_runs(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve collection run operational history and record throughput."""
    stmt = (
        select(models.CollectionRun)
        .options(selectinload(models.CollectionRun.source))
        .order_by(desc(models.CollectionRun.started_at))
        .limit(limit)
    )
    result = await db.execute(stmt)
    runs = result.scalars().all()

    return [
        RunTelemetryResponse(
            id=r.id,
            source_name=r.source.source_name if r.source else "UNKNOWN",
            started_at=r.started_at,
            completed_at=r.completed_at,
            status=r.status,
            records_observed=r.records_observed,
            records_valid=r.records_valid,
            created_at=r.created_at
        )
        for r in runs
    ]
