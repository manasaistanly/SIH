"""
SQLAlchemy ORM Models — RT-APIP
All models use UUIDv4 PKs, UTC timestamps, and soft-delete patterns.
"""
import uuid
from datetime import datetime, date
from typing import Optional
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer,
    JSON, Numeric, String, Text, UniqueConstraint, CheckConstraint, func
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import types
import enum

from database import Base


# ── Cross-DB UUID type ─────────────────────────────────────────────────────────
class UUIDType(types.TypeDecorator):
    """Portable UUID type: native on PostgreSQL, TEXT on SQLite."""
    impl = types.Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(types.String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        return str(value) if isinstance(value, uuid.UUID) else str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return str(value)


def new_uuid():
    return str(uuid.uuid4())


# ── Enumerations ───────────────────────────────────────────────────────────────
class SourceTypeEnum(str, enum.Enum):
    DIRECT_API = "DIRECT_API"
    OTA_API = "OTA_API"
    SCRAPER = "SCRAPER"
    DEMO = "DEMO"
    GDS = "GDS"
    OFFICIAL_GOVT = "OFFICIAL_GOVT"


class SourceStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    BLOCKED = "BLOCKED"
    REQUIRES_REVIEW = "REQUIRES_REVIEW"
    DISABLED = "DISABLED"


class JobStatusEnum(str, enum.Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    RETRYING = "RETRYING"
    CANCELLED = "CANCELLED"


class CabinClassEnum(str, enum.Enum):
    ECONOMY = "ECONOMY"
    PREMIUM_ECONOMY = "PREMIUM_ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"


class ValidationStatusEnum(str, enum.Enum):
    VALID = "VALID"
    INVALID = "INVALID"
    REVIEW = "REVIEW"
    MISSING = "MISSING"


class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    DATA_ANALYST = "DATA_ANALYST"
    DATA_ENGINEER = "DATA_ENGINEER"
    POLICY_ANALYST = "POLICY_ANALYST"
    API_CLIENT = "API_CLIENT"
    VIEWER = "VIEWER"


class ConfidenceLevelEnum(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    DEGRADED = "DEGRADED"


# ── Geography / Reference ──────────────────────────────────────────────────────
class Airport(Base):
    __tablename__ = "airports"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    iata_code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False, index=True)
    icao_code: Mapped[str] = mapped_column(String(4), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="India")
    latitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[float] = mapped_column(Numeric(9, 6), nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Kolkata")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    origin_routes: Mapped[list["Route"]] = relationship("Route", foreign_keys="Route.origin_airport_id", back_populates="origin")
    destination_routes: Mapped[list["Route"]] = relationship("Route", foreign_keys="Route.destination_airport_id", back_populates="destination")


class Route(Base):
    __tablename__ = "routes"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    origin_airport_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("airports.id"), nullable=False)
    destination_airport_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("airports.id"), nullable=False)
    route_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False, index=True)
    distance_km: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    dgca_category: Mapped[str] = mapped_column(String(50), default="METRO_METRO")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    origin: Mapped["Airport"] = relationship("Airport", foreign_keys=[origin_airport_id], back_populates="origin_routes")
    destination: Mapped["Airport"] = relationship("Airport", foreign_keys=[destination_airport_id], back_populates="destination_routes")
    basket_routes: Mapped[list["IndexBasketRoute"]] = relationship("IndexBasketRoute", back_populates="route")
    route_indices: Mapped[list["RouteIndex"]] = relationship("RouteIndex", back_populates="route")


# ── Airlines ───────────────────────────────────────────────────────────────────
class Airline(Base):
    __tablename__ = "airlines"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    iata_code: Mapped[str] = mapped_column(String(3), unique=True, nullable=False, index=True)
    icao_code: Mapped[str] = mapped_column(String(4), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    callsign: Mapped[Optional[str]] = mapped_column(String(100))
    country: Mapped[str] = mapped_column(String(100), default="India")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)


# ── Data Sources ───────────────────────────────────────────────────────────────
class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    source_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(30), nullable=False)
    base_url: Mapped[Optional[str]] = mapped_column(Text)
    rate_limit_per_minute: Mapped[int] = mapped_column(Integer, default=60)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE")
    compliance_notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    collection_jobs: Mapped[list["CollectionJob"]] = relationship("CollectionJob", back_populates="source")
    collection_runs: Mapped[list["CollectionRun"]] = relationship("CollectionRun", back_populates="source")


# ── Collection Jobs & Runs ─────────────────────────────────────────────────────
class CollectionJob(Base):
    __tablename__ = "collection_jobs"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    source_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("data_sources.id"), nullable=False)
    route_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("routes.id"), nullable=False)
    departure_date: Mapped[date] = mapped_column(Date, nullable=False)
    advance_purchase_days: Mapped[int] = mapped_column(Integer, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=5)
    status: Mapped[str] = mapped_column(String(20), default="QUEUED", index=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    max_retries: Mapped[int] = mapped_column(Integer, default=3)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    source: Mapped["DataSource"] = relationship("DataSource", back_populates="collection_jobs")
    runs: Mapped[list["CollectionRun"]] = relationship("CollectionRun", back_populates="job")


class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    job_id: Mapped[Optional[str]] = mapped_column(UUIDType, ForeignKey("collection_jobs.id"))
    source_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("data_sources.id"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    records_observed: Mapped[int] = mapped_column(Integer, default=0)
    records_valid: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    raw_s3_path: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    job: Mapped[Optional["CollectionJob"]] = relationship("CollectionJob", back_populates="runs")
    source: Mapped["DataSource"] = relationship("DataSource", back_populates="collection_runs")
    flight_observations: Mapped[list["FlightObservation"]] = relationship("FlightObservation", back_populates="collection_run")


# ── Observations ───────────────────────────────────────────────────────────────
class FlightObservation(Base):
    __tablename__ = "flight_observations"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    collection_run_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("collection_runs.id"), nullable=False, index=True)
    airline_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("airlines.id"), nullable=False, index=True)
    flight_number: Mapped[str] = mapped_column(String(20), nullable=False)
    origin_airport_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("airports.id"), nullable=False, index=True)
    destination_airport_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("airports.id"), nullable=False, index=True)
    departure_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    arrival_datetime: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_non_stop: Mapped[bool] = mapped_column(Boolean, default=True)
    stops_count: Mapped[int] = mapped_column(Integer, default=0)
    aircraft_type: Mapped[Optional[str]] = mapped_column(String(50))
    collected_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    collection_run: Mapped["CollectionRun"] = relationship("CollectionRun", back_populates="flight_observations")
    fare: Mapped[Optional["FareObservation"]] = relationship("FareObservation", back_populates="flight", uselist=False)


class FareObservation(Base):
    __tablename__ = "fare_observations"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    flight_observation_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("flight_observations.id"), unique=True, nullable=False, index=True)
    source_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("data_sources.id"), nullable=False, index=True)
    cabin_class: Mapped[str] = mapped_column(String(20), default="ECONOMY")
    fare_class: Mapped[str] = mapped_column(String(10), default="Y")
    advance_purchase_days: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    base_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    user_development_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    convenience_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    fuel_surcharge: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    taxes: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    other_fees: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    total_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR")

    seats_remaining: Mapped[Optional[int]] = mapped_column(Integer)
    source_url_or_ref: Mapped[Optional[str]] = mapped_column(Text)
    raw_snapshot_hash: Mapped[Optional[str]] = mapped_column(String(64))
    raw_s3_uri: Mapped[Optional[str]] = mapped_column(Text)

    quality_score: Mapped[float] = mapped_column(Numeric(5, 4), default=1.0000)
    validation_status: Mapped[str] = mapped_column(String(20), default="VALID", index=True)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False, index=True)

    flight: Mapped["FlightObservation"] = relationship("FlightObservation", back_populates="fare")
    source: Mapped["DataSource"] = relationship("DataSource")
    components: Mapped[list["FareComponent"]] = relationship("FareComponent", back_populates="fare_observation", cascade="all, delete-orphan")
    quality_results: Mapped[list["QualityResult"]] = relationship("QualityResult", back_populates="fare_observation", cascade="all, delete-orphan")
    anomaly_events: Mapped[list["AnomalyEvent"]] = relationship("AnomalyEvent", back_populates="fare_observation")


class FareComponent(Base):
    __tablename__ = "fare_components"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    fare_observation_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("fare_observations.id", ondelete="CASCADE"), nullable=False, index=True)
    component_name: Mapped[str] = mapped_column(String(100), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    fare_observation: Mapped["FareObservation"] = relationship("FareObservation", back_populates="components")


# ── Quality & Anomalies ────────────────────────────────────────────────────────
class QualityResult(Base):
    __tablename__ = "quality_results"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    fare_observation_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("fare_observations.id", ondelete="CASCADE"), nullable=False, index=True)
    check_name: Mapped[str] = mapped_column(String(100), nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="ERROR")
    message: Mapped[Optional[str]] = mapped_column(Text)
    executed_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    fare_observation: Mapped["FareObservation"] = relationship("FareObservation", back_populates="quality_results")


class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    fare_observation_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("fare_observations.id"), nullable=False, index=True)
    route_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("routes.id"), nullable=False, index=True)
    advance_purchase_days: Mapped[int] = mapped_column(Integer, nullable=False)
    method: Mapped[str] = mapped_column(String(50), nullable=False)
    metric_value: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    expected_range_lower: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    expected_range_upper: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="MEDIUM")
    status: Mapped[str] = mapped_column(String(20), default="UNRESOLVED")
    detected_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    fare_observation: Mapped["FareObservation"] = relationship("FareObservation", back_populates="anomaly_events")
    route: Mapped["Route"] = relationship("Route")


# ── Methodologies, Baskets & Index Outputs ─────────────────────────────────────
class MethodologyVersion(Base):
    __tablename__ = "methodology_versions"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    version_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    formula_name: Mapped[str] = mapped_column(String(50), nullable=False)
    base_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    base_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    base_index_value: Mapped[float] = mapped_column(Numeric(8, 2), default=100.00)
    aggregation_rules: Mapped[dict] = mapped_column(JSON, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    activated_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    baskets: Mapped[list["IndexBasket"]] = relationship("IndexBasket", back_populates="methodology_version")
    route_indices: Mapped[list["RouteIndex"]] = relationship("RouteIndex", back_populates="methodology_version")
    aggregate_indices: Mapped[list["AggregateIndex"]] = relationship("AggregateIndex", back_populates="methodology_version")


class IndexBasket(Base):
    __tablename__ = "index_baskets"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    basket_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    methodology_version_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("methodology_versions.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    methodology_version: Mapped["MethodologyVersion"] = relationship("MethodologyVersion", back_populates="baskets")
    basket_routes: Mapped[list["IndexBasketRoute"]] = relationship("IndexBasketRoute", back_populates="basket")
    aggregate_indices: Mapped[list["AggregateIndex"]] = relationship("AggregateIndex", back_populates="basket")


class IndexBasketRoute(Base):
    __tablename__ = "index_basket_routes"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    index_basket_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("index_baskets.id"), nullable=False, index=True)
    route_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("routes.id"), nullable=False, index=True)
    weight: Mapped[float] = mapped_column(Numeric(7, 6), nullable=False)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_to: Mapped[Optional[date]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    basket: Mapped["IndexBasket"] = relationship("IndexBasket", back_populates="basket_routes")
    route: Mapped["Route"] = relationship("Route", back_populates="basket_routes")


class RouteIndex(Base):
    __tablename__ = "route_indices"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    methodology_version_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("methodology_versions.id"), nullable=False)
    route_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("routes.id"), nullable=False, index=True)
    index_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    current_index: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    base_median_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    current_median_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    current_mean_fare: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    observation_count: Mapped[int] = mapped_column(Integer, nullable=False)
    valid_observation_count: Mapped[int] = mapped_column(Integer, nullable=False)
    coverage_ratio: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)

    daily_change_pct: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    weekly_change_pct: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    monthly_change_pct: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))

    # Booking window medians as JSON
    booking_window_data: Mapped[Optional[dict]] = mapped_column(JSON)

    revision_number: Mapped[int] = mapped_column(Integer, default=1)
    is_official: Mapped[bool] = mapped_column(Boolean, default=True)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    methodology_version: Mapped["MethodologyVersion"] = relationship("MethodologyVersion", back_populates="route_indices")
    route: Mapped["Route"] = relationship("Route", back_populates="route_indices")

    __table_args__ = (
        UniqueConstraint("methodology_version_id", "route_id", "index_date", "revision_number",
                         name="uq_route_index_date"),
    )


class AggregateIndex(Base):
    __tablename__ = "aggregate_indices"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    methodology_version_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("methodology_versions.id"), nullable=False)
    index_basket_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("index_baskets.id"), nullable=False)
    index_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    national_index: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    daily_change_pct: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    weekly_change_pct: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    monthly_change_pct: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))

    total_observations: Mapped[int] = mapped_column(Integer, nullable=False)
    total_routes_active: Mapped[int] = mapped_column(Integer, nullable=False)
    total_routes_covered: Mapped[int] = mapped_column(Integer, nullable=False)
    coverage_ratio: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    confidence_level: Mapped[str] = mapped_column(String(20), default="HIGH")

    revision_number: Mapped[int] = mapped_column(Integer, default=1)
    is_official: Mapped[bool] = mapped_column(Boolean, default=True)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    methodology_version: Mapped["MethodologyVersion"] = relationship("MethodologyVersion", back_populates="aggregate_indices")
    basket: Mapped["IndexBasket"] = relationship("IndexBasket", back_populates="aggregate_indices")

    __table_args__ = (
        UniqueConstraint("methodology_version_id", "index_date", "revision_number",
                         name="uq_agg_index_date"),
    )


# ── DGCA Reference Benchmarks (Official Government Data) ──────────────────────
class DGCABenchmark(Base):
    """
    Official DGCA Monthly Average Domestic Fare Statistics.
    Source: DGCA Monthly Statistics publications (publicly available).
    These are OFFICIAL GOVERNMENT DATA points used exclusively for backtesting.
    """
    __tablename__ = "dgca_benchmarks"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    reference_period: Mapped[date] = mapped_column(Date, nullable=False, unique=True, index=True)
    route_code: Mapped[Optional[str]] = mapped_column(String(10), index=True)  # NULL = national aggregate
    avg_fare_inr: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    median_fare_inr: Mapped[Optional[float]] = mapped_column(Numeric(12, 2))
    total_passengers: Mapped[Optional[int]] = mapped_column(Integer)
    data_source: Mapped[str] = mapped_column(String(100), default="DGCA_MONTHLY_STATS")
    publication_url: Mapped[Optional[str]] = mapped_column(Text)
    data_type: Mapped[str] = mapped_column(String(30), default="OFFICIAL_GOVT")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)


# ── Backtesting ────────────────────────────────────────────────────────────────
class BacktestRun(Base):
    __tablename__ = "backtest_runs"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    methodology_version_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("methodology_versions.id"), nullable=False)
    index_basket_id: Mapped[str] = mapped_column(UUIDType, ForeignKey("index_baskets.id"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference_benchmark_name: Mapped[str] = mapped_column(String(100), default="DGCA_MONTHLY_AVERAGE")
    mae: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    rmse: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    mape: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    correlation: Mapped[Optional[float]] = mapped_column(Numeric(6, 4))
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    methodology_version: Mapped["MethodologyVersion"] = relationship("MethodologyVersion")
    index_basket: Mapped["IndexBasket"] = relationship("IndexBasket")


# ── Users & RBAC ──────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False, default="VIEWER")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())


# ── Audit Logs ────────────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(UUIDType, primary_key=True, default=new_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(UUIDType)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[Optional[str]] = mapped_column(UUIDType, index=True)
    old_value: Mapped[Optional[dict]] = mapped_column(JSON)
    new_value: Mapped[Optional[dict]] = mapped_column(JSON)
    client_ip: Mapped[Optional[str]] = mapped_column(String(50))
    user_agent: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False, index=True)
