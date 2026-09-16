# Development Implementation Plan: RT-APIP

## 1. Development Sequence Roadmap

| Phase | Milestone | Scope / Deliverables | Success Criteria |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Core Foundation & Infrastructure** | Monorepo structure, Docker Compose (PostgreSQL, Timescale, Redis, Kafka, MinIO), FastAPI skeleton, Next.js skeleton, Database migrations (Alembic), Health checks | `docker compose up` or local script starts clean; `/health` returns 200 OK across services |
| **Phase 2** | **Reference Data & Seed Subsystem** | Indian airports, airlines, 6 core routes, booking windows, methodology v1.0, test users & RBAC roles | DB populated with authoritative reference entities; no arbitrary constants in code |
| **Phase 3** | **Data Ingestion & Adapters** | `BaseFareSourceAdapter` contract, `DemoFareSourceAdapter` with deterministic test fares, compliance limiter, raw S3 storage | Raw payloads stored with SHA-256 hash and dispatched to Kafka `airfare.raw` |
| **Phase 4** | **Normalization & Quality Pipeline** | Ingestion worker, 12 deterministic validation rules, non-parametric MAD/IQR anomaly detection | Observations tagged `VALID`/`INVALID`/`REVIEW`; failures logged in `quality_results` |
| **Phase 5** | **Statistical Index & Backtesting Engine** | Route median fare aggregation, geometric price relative calculation, weighted Laspeyres aggregation, DGCA backtest runner | Accurate mathematical indices produced; backtests against 30-day benchmark compute MAE/RMSE |
| **Phase 6** | **FastAPI Institutional Endpoints** | REST endpoints (`/index/current`, `/index/history`, `/routes`, `/booking-window`, `/data-quality`, `/backtests`, `/lineage`, `/admin`) | Endpoints return typed Pydantic responses, JWT auth, RBAC permissions, audit logging |
| **Phase 7** | **Institutional Modern Frontend** | Next.js App Router, Tailwind CSS, TanStack Query, Apache ECharts, dark mode, route drilldown, booking window elasticity, lineage inspector | Zero hardcoded numbers; 100% dynamic API integration, responsive, modern institutional UX |
| **Phase 8** | **Automated Testing & Production Readiness** | Pytest unit/integration tests, statistical verification fixtures, CI/CD GitHub Actions, Terraform IaC | Automated tests pass; reproducible deployment documentation complete |
