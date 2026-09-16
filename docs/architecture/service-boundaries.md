# Service Boundaries and Contracts

## 1. Domain Service Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             API GATEWAY / FASTAPI                           │
│  - REST API v1 Consumer Interface                                           │
│  - Authentication, Token Validation (JWT / RBAC)                            │
│  - Read-Only Query Models, Data Lineage Resolution                          │
│  - Administrative Operations (Schedules, Methodology, Baskets)              │
└──────────────┬───────────────────────────────┬──────────────────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐┌─────────────────────────────────────────────┐
│     COLLECTOR SERVICE        ││              PROCESSOR SERVICE              │
│ - BaseFareSourceAdapter      ││ - Normalization Engine (polars/pydantic)    │
│ - Compliance & Rate Limiter  ││ - Data Quality Engine (12+ deterministic)   │
│ - Scraper & API Orchestrator ││ - Anomaly Detection (MAD / IQR)             │
│ - Writes to S3/MinIO & Kafka ││ - Hypertable Ingestion                      │
└──────────────┬───────────────┘└──────────────────────┬──────────────────────┘
               │                                       │
               ▼                                       ▼
┌──────────────────────────────┐┌─────────────────────────────────────────────┐
│       KAFKA MESSAGING        ││             INDEX ENGINE SERVICE            │
│ - Raw & Normalized Topics    ││ - Price Relative Aggregation                │
│ - Dead-Letter Exchanges      ││ - Route Index & National Index Calculation  │
│                              ││ - Booking-Window Curve Synthesis            │
│                              ││ - Backtesting against DGCA benchmarks       │
└──────────────────────────────┘└─────────────────────────────────────────────┘
```

---

## 2. Service Responsibilities & Boundaries

### 2.1 Ingestion / Collector Service (`services/collector`)
- **Boundary**: Pure external extraction and raw ingestion.
- **Responsibilities**:
  - Connect to permitted airline APIs, OTA endpoints, or deterministic test adapters.
  - Check `robots.txt` compliance and rate limit adherence.
  - Save unmodified raw payload to S3/MinIO at `raw/{source}/{YYYY}/{MM}/{DD}/{collection_run_id}/{observation_id}.json`.
  - Publish `RawFareQuoteEvent` to Kafka topic `airfare.raw`.
- **Constraint**: The collector has ZERO knowledge of index math or database tables. It only knows source contracts and raw object storage.

### 2.2 Processing & Quality Service (`services/processor` & `services/quality-engine`)
- **Boundary**: Raw-to-clean transformation, structural and financial validation, anomaly scoring.
- **Responsibilities**:
  - Consume from `airfare.raw`.
  - Normalize components into standard base fare, taxes, convenience fees, and UDF.
  - Execute deterministic validations (missing fields, inverted airport pairs, unrealistic totals).
  - Compute statistical anomaly scores (MAD, IQR) against 14-day rolling window statistics.
  - Insert valid observations into PostgreSQL `flight_observations` and `fare_observations`.
  - Record failures in `quality_results` and `anomaly_events`.
  - Publish normalized and validated events to `airfare.validated`.

### 2.3 Statistical Index Engine (`services/index-engine`)
- **Boundary**: Offline/batch statistical synthesis and backtesting.
- **Responsibilities**:
  - Execute scheduled index computation runs (daily at 00:00 UTC / 05:30 IST).
  - Query validated observations for active basket routes and booking windows ($T+1 \dots T+45$).
  - Compute geometric median price relatives for each route.
  - Compute volume-weighted Laspeyres national index and confidence metrics.
  - Compute booking-window price elasticity curves.
  - Execute backtesting against DGCA historical benchmarks.
  - Store results in `route_indices`, `aggregate_indices`, and `backtest_results`.
- **Constraint**: Index computation NEVER occurs on-demand inside the user-facing web request cycle.

### 2.4 REST API Service (`apps/api`)
- **Boundary**: Read models, institutional data distribution, access control, and metadata administration.
- **Responsibilities**:
  - Serve cached, pre-computed indices, routes, and quality metrics with sub-10ms response times.
  - Serve full data lineage drilldowns (`/api/v1/index/{id}/lineage`).
  - Provide RBAC-guarded endpoints for admin jobs, methodology adjustments, and source status overrides.
  - Generate standards-compliant OpenAPI (Swagger) documentation.

### 2.5 Web Frontend (`apps/web`)
- **Boundary**: Institutional presentation, dashboard analytics, interactive charts, and audit inspection.
- **Responsibilities**:
  - Consume API v1 via TanStack Query.
  - Render Apache ECharts for index trends, route comparisons, booking window curves, and anomaly feeds.
  - Provide complete accessibility, high data density, dark mode, and zero mock/fake data.
