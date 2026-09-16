# System Architecture: Real-Time Airfare Price Index Platform for India (RT-APIP)

## 1. Executive Overview
The Real-Time Airfare Price Index Platform for India is a production-grade statistical measurement platform designed to ingest, validate, normalize, measure, and explain airfare movements across India's domestic aviation network. 

The core operational principle is:
```
OBSERVE → VALIDATE → NORMALIZE → MEASURE → EXPLAIN
```
The statistical measurement engine is the primary asset; collection adapters are decoupled extraction mechanisms that feed an immutable raw storage lake and streaming bus.

---

## 2. High-Level System Architecture

```
                  ┌──────────────────────────────────────────────┐
                  │          AIRLINE & OTA DATA SOURCES          │
                  │  (IndiGo, Air India, Akasa, SpiceJet, OTAs)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │           SOURCE ADAPTER RUNTIME             │
                  │  - HTTP API Adapters (Rate limited, compliant│
                  │  - Playwright Headless (fallback where req.) │
                  │  - Development / Demo Adapter (Deterministic)│
                  │  - Compliance Guard (robots.txt, TOS, auth)  │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            COLLECTION ORCHESTRATOR           │
                  │  - Route/Window Matrix Dispatcher            │
                  │  - Circuit Breakers & Source Health Check    │
                  └──────────────┬───────────────────────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────────────────────┐
                  │             APACHE KAFKA BROKER              │
                  │  Topic: airfare.raw                          │
                  │  Topic: airfare.normalized                   │
                  │  Topic: airfare.validated                    │
                  │  Topic: airfare.anomaly                      │
                  │  Topic: airfare.index                        │
                  │  Topic: airfare.dead-letter                  │
                  └──────────────┬───────────────────────┬───────┘
                                 │                       │
                                 ▼                       ▼
      ┌───────────────────────────────────┐    ┌──────────────────────────────────┐
      │     RAW DATA STORAGE (S3/MinIO)   │    │        PROCESSING PIPELINE       │
      │  Immutable object naming pattern: │    │ 1. Normalization Engine          │
      │  raw/{src}/{YYYY}/{MM}/{DD}/...   │    │ 2. Data Quality & Validation     │
      └───────────────────────────────────┘    │ 3. Anomaly Detection (IQR/MAD)   │
                                               └─────────────────┬────────────────┘
                                                                 │
                                                                 ▼
                                               ┌──────────────────────────────────┐
                                               │      STATISTICAL INDEX ENGINE    │
                                               │  - Jevons/Carli/Laspeyres Index  │
                                               │  - Configurable Route Baskets    │
                                               │  - Booking Window Elasticity     │
                                               │  - Backtesting against DGCA      │
                                               └─────────────────┬────────────────┘
                                                                 │
                                 ┌───────────────────────────────┴──────────────────────────────┐
                                 ▼                                                              ▼
               ┌───────────────────────────────────────────┐                  ┌──────────────────────────────────┐
               │         POSTGRESQL / TIMESCALEDB          │                  │       REDIS IN-MEMORY CACHE      │
               │  - Structured Observation Hypertables     │                  │  - Rate Limiter & Fast Sessions  │
               │  - Route Indices & Aggregate Series       │                  │  - Pre-warmed Analytics Cache    │
               │  - Audit Logs & Methodology Versions      │                  └──────────────────────────────────┘
               └─────────────────────┬─────────────────────┘
                                     │
                                     ▼
               ┌───────────────────────────────────────────┐
               │           FASTAPI REST API (v1)           │
               │  - JWT & OAuth2 / RBAC Validation         │
               │  - Lineage Query Engine                   │
               │  - OpenAPI & Institutional Data Endpoints │
               └─────────────────────┬─────────────────────┘
                                     │
                                     ▼
               ┌───────────────────────────────────────────┐
               │       NEXT.JS INSTITUTIONAL DASHBOARD     │
               │  - Apache ECharts Analytical Visualizations│
               │  - TanStack Query v5 + TypeScript         │
               │  - Modern Dark/Light Institutional UI     │
               │  - Traceability & Lineage Inspection Modals│
               └───────────────────────────────────────────┘
```

---

## 3. Subsystem Breakdown

### 3.1 Data Ingestion Subsystem
- **Source Adapters**: Inherit from abstract `BaseFareSourceAdapter`. Every adapter returns standardized `RawFareQuote` payloads with source metadata, response payload hashes, and HTTP status codes.
- **Compliance Guard**: Enforces request rate limiting, User-Agent identification, respects `robots.txt`, and terminates any request chain that encounters CAPTCHA or blocking instead of attempting bypasses.
- **Collection Orchestrator**: Evaluates active collection schedules (booking windows T+1, T+7, T+15, T+30, T+45 across top domestic corridors: DEL-BOM, DEL-BLR, BOM-BLR, DEL-CCU, BLR-HYD, MAA-DEL). Dispatches collection jobs into execution queues.

### 3.2 Messaging and Ingestion Pipeline
- **Apache Kafka Topics**:
  - `airfare.raw`: Raw unparsed quotes with ingestion timestamps and adapter versions.
  - `airfare.normalized`: Schema-conforming quotes broken into base fare, UDF, convenience fee, fuel surcharge, and taxes.
  - `airfare.validated`: Observations that have cleared deterministic schema and range checks.
  - `airfare.anomaly`: Observations flagged with statistical anomaly scores (Z-score, MAD, IQR).
  - `airfare.index`: Batch events indicating new index calculations are ready.
  - `airfare.dead-letter`: Malformed payloads with error taxonomy.

### 3.3 Storage Layer
- **PostgreSQL 16 + TimescaleDB**:
  - Hypertables partitioned on `collected_at` and `departure_datetime`.
  - Tables for geography, airlines, flight observations, fare components, quality checks, anomalies, methodology versions, index baskets, backtest runs, and immutable audit logs.
- **S3 / MinIO Raw Lake**:
  - Objects partitioned: `raw/{source}/{YYYY}/{MM}/{DD}/{collection_run_id}/{observation_id}.json`.
  - Stored with SHA-256 integrity checksums for full audit trail.
- **Redis**:
  - Caching hot index series (national index, route 30d trends).
  - Distributed lock for scheduler orchestration.
  - Token revocation list and rate-limiting buckets.

### 3.4 Data Quality & Statistical Index Engine
- **Quality Engine**: Runs 12+ deterministic checks (negative fare, invalid IATA, inverted taxes, duplicate flights, stale observations, booking window mismatch). Assigns composite quality score `[0.0, 1.0]`.
- **Anomaly Detection**: Non-parametric MAD (Median Absolute Deviation) and IQR bounds computed over rolling 14-day windows per route and booking window.
- **Index Engine**:
  - Implements Laspeyres, Paasche, Fisher, and Jevons price relatives over defined passenger-traffic weighted baskets.
  - Aggregates route price relatives into the National Airfare Price Index ($I_t$).
  - Evaluates booking-window elasticity curves ($T+1 \dots T+45$).
  - Tracks complete statistical lineage back to constituent observations.

### 3.5 API & Security Subsystem
- **FastAPI**: Fully asynchronous endpoints typed with Pydantic v2.
- **RBAC Matrix**: `SUPER_ADMIN`, `ADMIN`, `DATA_ANALYST`, `DATA_ENGINEER`, `POLICY_ANALYST`, `API_CLIENT`, `VIEWER`.
- **Audit Logging**: Every administrative modification (basket weights, source configuration, methodology revision) creates an immutable audit record with user ID, client IP, previous value, and new value.

### 3.6 Frontend Analytical Dashboard
- Built with **Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, TanStack Query, and Apache ECharts**.
- Modern institutional styling: Dark-mode ready, dense typography, zero fake animations, full chart interactivity, and data lineage inspection.
