# RT-APIP — Real-Time Airfare Price Index Platform for India

## Product Overview
A production-grade statistical measurement platform that transforms airfare observations across India's domestic aviation network into a continuously updated, auditable, and reproducible **National Airfare Price Index**.

**Core Principle**: `OBSERVE → VALIDATE → NORMALIZE → MEASURE → EXPLAIN`

Every index value on the dashboard is:
- Traceable to validated fare observations
- Referenced to a published methodology version
- Comparable against official DGCA statistics
- Immutable once published (revision-controlled if corrected)

---

## Architecture
- **Ingestion**: Modular source adapter system (compliant HTTP/API + deterministic demo adapter for development)
- **Messaging**: Apache Kafka topics for raw, normalized, validated, anomaly, and dead-letter events
- **Storage**: PostgreSQL (TimescaleDB hypertables for time-series) + S3/MinIO raw lake
- **Processing**: Polars/NumPy normalization, 12-gate quality engine, MAD/IQR anomaly detection
- **Index Engine**: Jevons price relatives + volume-weighted Laspeyres national aggregate
- **API**: FastAPI v1 (REST, OpenAPI, JWT/RBAC, full lineage endpoints)
- **Dashboard**: Next.js 14 + TypeScript + Tailwind CSS + Apache ECharts
- **Observability**: Prometheus + Grafana + OpenTelemetry + Sentry

## Technology Stack
| Layer | Technology |
|:------|:-----------|
| Backend API | Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2 |
| Database | PostgreSQL 16 + TimescaleDB |
| Cache | Redis |
| Messaging | Apache Kafka |
| Object Storage | MinIO (dev) / AWS S3 (prod) |
| Scheduler | Apache Airflow |
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Apache ECharts |
| Statistical | Polars, NumPy, SciPy |
| Auth | JWT / OAuth2 / Keycloak-compatible |
| Containers | Docker + Docker Compose |
| IaC | Terraform |
| CI/CD | GitHub Actions |

## Local Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Docker Desktop (for full stack) OR use local SQLite mode for API-only development

### Quick Start (Local / No Docker)
```powershell
# 1. Install Python dependencies
pip install -r apps/api/requirements.txt

# 2. Set up environment
copy .env.example .env
# Edit .env: set DATABASE_URL=sqlite:///./airfare_index.db for local dev

# 3. Run database migrations
cd apps/api
alembic upgrade head

# 4. Seed reference data
python -m database.seeds.seed_all

# 5. Start API server
uvicorn main:app --reload --port 8000

# 6. Start frontend (new terminal)
cd apps/web
npm install
npm run dev
```

### Full Stack (Docker)
```powershell
docker compose up
```

Services:
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Frontend: http://localhost:3000
- MinIO Console: http://localhost:9001
- Grafana: http://localhost:3001

## Environment Variables
See `.env.example` for all required variables.

## Data Methodology
See [docs/methodology/index-methodology.md](docs/methodology/index-methodology.md)

## API Documentation
See [docs/api/README.md](docs/api/README.md) or visit http://localhost:8000/docs

## Reference Data Sources
- **Airport/Airline Reference**: DGCA Aircraft Accident Digest, AAI Airport Directory
- **Backtesting Benchmark**: DGCA Monthly Domestic Airline Statistics (publicly published)
- **Route Basket Weights**: Based on DGCA City-Pair Traffic Statistics
- **Demo/Development Data**: Deterministic synthetic adapter (`source_type = DEMO`), never mixed with official data

## Security
- Never commit credentials — use `.env.example` as template only
- All production secrets managed via AWS Secrets Manager (Terraform-provisioned)
- RBAC enforced at API layer: SUPER_ADMIN, ADMIN, DATA_ANALYST, DATA_ENGINEER, POLICY_ANALYST, API_CLIENT, VIEWER

## Compliance & Ethics
The system strictly respects:
- robots.txt directives for all external sources
- Source terms of service
- Rate limits and reasonable request frequencies
- Zero CAPTCHA bypass or anti-bot circumvention
- Only permitted APIs, official data feeds, or DGCA public statistics are used in production

## License
Internal research and development platform. All third-party data used in compliance with applicable terms of service and government open data policies.
