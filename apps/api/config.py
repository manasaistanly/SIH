"""
RT-APIP Configuration Management
All settings are environment-variable driven; no secrets in code.
"""
import os
from functools import lru_cache
from typing import Literal
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ───────────────────────────────────────────────────────
    api_env: Literal["development", "staging", "production"] = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"

    # ── Database ──────────────────────────────────────────────────
    database_url: str = f"sqlite+aiosqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), 'airfare_index.db')).replace(chr(92), '/')}"
    database_url_sync: str = f"sqlite:///{os.path.abspath(os.path.join(os.path.dirname(__file__), 'airfare_index.db')).replace(chr(92), '/')}"
    db_pool_size: int = 10
    db_max_overflow: int = 20

    # ── Redis ─────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"
    redis_ttl_seconds: int = 300  # 5-minute default cache TTL

    # ── Kafka ─────────────────────────────────────────────────────
    kafka_brokers: str = "localhost:9092"
    kafka_topic_raw: str = "airfare.raw"
    kafka_topic_normalized: str = "airfare.normalized"
    kafka_topic_validated: str = "airfare.validated"
    kafka_topic_anomaly: str = "airfare.anomaly"
    kafka_topic_index: str = "airfare.index"
    kafka_topic_dead_letter: str = "airfare.dead-letter"
    kafka_consumer_group: str = "airfare-processor"

    # ── S3 / MinIO ────────────────────────────────────────────────
    s3_endpoint: str = "http://localhost:9000"
    s3_bucket: str = "airfare-raw"
    s3_region: str = "ap-south-1"
    aws_access_key_id: str = "minioadmin"
    aws_secret_access_key: str = "minioadmin123"

    # ── Authentication ────────────────────────────────────────────
    jwt_secret: str = "dev_secret_change_in_production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 7

    # ── Collection ────────────────────────────────────────────────
    collection_use_demo_adapter: bool = True
    collection_demo_seed: int = 42
    collection_booking_windows: str = "1,7,15,30,45"

    # ── Index Engine ──────────────────────────────────────────────
    index_methodology_version: str = "v1.0"
    index_base_period_start: str = "2024-01-01"
    index_base_period_end: str = "2024-01-31"
    index_confidence_high_threshold: float = 0.95
    index_confidence_medium_threshold: float = 0.80
    index_min_observations_per_route: int = 3

    # ── Rate Limiting ─────────────────────────────────────────────
    rate_limit_requests_per_minute: int = 120
    rate_limit_admin_per_minute: int = 30

    # ── Observability ─────────────────────────────────────────────
    sentry_dsn: str = ""
    otel_exporter_otlp_endpoint: str = "http://localhost:4318"

    @property
    def booking_windows_list(self) -> list[int]:
        return [int(w) for w in self.collection_booking_windows.split(",")]

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_sqlite(self) -> bool:
        return "sqlite" in self.database_url.lower()


@lru_cache
def get_settings() -> Settings:
    return Settings()
