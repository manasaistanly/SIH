.PHONY: help setup seed run-api run-web test lint migrate

help:
	@echo "RT-APIP: Real-Time Airfare Price Index Platform"
	@echo ""
	@echo "  make setup      - Install Python + Node dependencies"
	@echo "  make migrate    - Run Alembic migrations"
	@echo "  make seed       - Seed reference + demo data"
	@echo "  make run-api    - Start FastAPI dev server (port 8000)"
	@echo "  make run-web    - Start Next.js dev server (port 3000)"
	@echo "  make test       - Run all tests"
	@echo "  make lint       - Run ruff + tsc linting"
	@echo "  make docker-up  - Start full Docker Compose stack"
	@echo "  make docker-down- Stop Docker Compose stack"

setup:
	pip install -r apps/api/requirements.txt
	cd apps/web && npm install

migrate:
	cd apps/api && alembic upgrade head

seed:
	cd apps/api && python -m database.seeds.seed_all

run-api:
	cd apps/api && uvicorn main:app --reload --host 0.0.0.0 --port 8000

run-web:
	cd apps/web && npm run dev

test:
	pytest tests/ -v --tb=short

test-unit:
	pytest tests/unit/ -v

test-integration:
	pytest tests/integration/ -v

test-statistical:
	pytest tests/statistical/ -v

lint:
	ruff check apps/api/
	cd apps/web && npx tsc --noEmit

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
