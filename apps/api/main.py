"""
Real-Time Airfare Price Index Platform for India (RT-APIP)
Core FastAPI Application Entrypoint
"""

from contextlib import asynccontextmanager
from datetime import date, timedelta
from fastapi import FastAPI, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from config import get_settings
from database import get_db, SyncSessionLocal
import models
from services.pipeline import execute_full_pipeline
from services.backtester import BacktestEngine

from routers import auth, index, quality, backtest, pipeline, metadata, intelligence

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle management.
    Ensures baseline index data points exist for the dashboard upon initial launch.
    """
    print(f"[RT-APIP] Starting API Server in {settings.api_env.upper()} mode...")

    # Check if we have recent index values, if not, generate 14-day historical baseline series
    session = SyncSessionLocal()
    try:
        count = session.query(models.AggregateIndex).count()
        if count < 7:
            print("[RT-APIP] Bootstrapping initial historical index series (14 days)...")
            today = date.today()
            for day_offset in range(14, -1, -1):
                hist_date = today - timedelta(days=day_offset)
                try:
                    execute_full_pipeline(collection_date=hist_date, seed=42 + day_offset)
                except Exception as ex:
                    print(f"[RT-APIP] Seed day {hist_date} failed: {ex}")

            # Run baseline backtest
            try:
                BacktestEngine.run_backtest(session=session)
                print("[RT-APIP] Initial DGCA backtesting validation completed.")
            except Exception as ex:
                print(f"[RT-APIP] Initial backtest failed: {ex}")
    finally:
        session.close()

    yield
    print("[RT-APIP] Shutting down API Server cleanly.")


app = FastAPI(
    title="Real-Time Airfare Price Index Platform for India (RT-APIP)",
    description=(
        "Production-grade, statistically rigorous platform tracking domestic Indian airfare "
        "movements using Laspeyres index methodology, 12-gate quality verification, "
        "and empirical validation against official DGCA government statistics."
    ),
    version="1.0.0",
    lifespan=lifespan
)

# ── CORS Middleware ───────────────────────────────────────────────────────────
configured_origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
dev_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]
all_origins = list(set(configured_origins + dev_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=all_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|.*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ── Include Routers ───────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(index.router)
app.include_router(quality.router)
app.include_router(backtest.router)
app.include_router(pipeline.router)
app.include_router(metadata.router)
app.include_router(intelligence.router)



# ── Health & Diagnostics ──────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
@app.get("/api/v1/health", tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_db)):
    """Health check validating database connectivity and service status."""
    try:
        await db.execute(text("SELECT 1"))
        db_status = "CONNECTED"
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "UNHEALTHY",
                "database": f"ERROR: {str(e)}",
                "environment": settings.api_env,
                "version": "1.0.0"
            }
        )

    return {
        "status": "HEALTHY",
        "service": "RT-APIP API",
        "database": db_status,
        "database_backend": "SQLITE" if settings.is_sqlite else "POSTGRESQL",
        "environment": settings.api_env,
        "version": "1.0.0"
    }
