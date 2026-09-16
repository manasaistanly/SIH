"""
SQLAlchemy 2.0 async database engine and session factory.
Supports both SQLite (local dev) and PostgreSQL (production).
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from typing import AsyncGenerator

from config import get_settings

settings = get_settings()

# ── Async engine (FastAPI request cycle) ─────────────────────────
connect_args = {}
if settings.is_sqlite:
    connect_args = {"check_same_thread": False, "timeout": 30}

async_engine = create_async_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False,
    pool_pre_ping=True,
)

from sqlalchemy import event
from sqlite3 import Connection as SQLite3Connection

@event.listens_for(async_engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ── Sync engine (Alembic migrations, seeds) ───────────────────────
sync_engine = create_engine(
    settings.database_url_sync,
    connect_args=connect_args if settings.is_sqlite else {},
    echo=False,
)

SyncSessionLocal = sessionmaker(bind=sync_engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
