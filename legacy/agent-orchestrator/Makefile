PYTHON ?= python3
WEB_DIR := apps/web
API_DIR := apps/api
COMPOSE_PROJECT := $(notdir $(CURDIR))

.PHONY: help install install-api install-web up down logs dev-api dev-web test test-api test-api-docker test-web simulate simulate-docker

help:
	@echo "Targets:"
	@echo "  install       Install API + Web dependencies"
	@echo "  up            Start API + Postgres with Docker Compose"
	@echo "  down          Stop Docker Compose services"
	@echo "  logs          Tail API logs"
	@echo "  dev-api       Run API locally (outside Docker)"
	@echo "  dev-web       Run web console locally"
	@echo "  test          Run API tests and web build check"
	@echo "  test-api      Run backend pytest suite"
	@echo "  test-api-docker Run backend tests inside api container"
	@echo "  test-web      Run web production build as test"
	@echo "  simulate      Run simulation scenarios against the API"
	@echo "  simulate-docker Run simulations from inside API container"

install: install-api install-web

install-api:
	$(PYTHON) -m pip install -r $(API_DIR)/requirements-dev.txt

install-web:
	npm --prefix $(WEB_DIR) install

up:
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f api

dev-api:
	PYTHONPATH=apps uvicorn api.main:app --reload --port 8000

dev-web:
	npm --prefix $(WEB_DIR) run dev

test: test-api test-web

test-api:
	PYTHONPATH=apps $(PYTHON) -m pytest $(API_DIR)/tests

test-api-docker:
	@CID=$$(docker ps --filter "label=com.docker.compose.project=$(COMPOSE_PROJECT)" --filter "label=com.docker.compose.service=api" --format '{{.ID}}' | head -n1); \
	if [ -z "$$CID" ]; then echo "API container not running. Run 'make up' first."; exit 1; fi; \
	docker exec $$CID sh -lc "pip install --no-cache-dir pytest pytest-cov httpx && PYTHONPATH=/app pytest api/tests -q"

test-web:
	npm --prefix $(WEB_DIR) run build

simulate:
	$(PYTHON) scripts/simulate_conversations.py --summary-only

simulate-docker:
	@CID=$$(docker ps --filter "label=com.docker.compose.project=$(COMPOSE_PROJECT)" --filter "label=com.docker.compose.service=api" --format '{{.ID}}' | head -n1); \
	if [ -z "$$CID" ]; then echo "API container not running. Run 'make up' first."; exit 1; fi; \
	docker exec $$CID python /app/scripts/simulate_conversations.py --base-url http://127.0.0.1:8000 --summary-only
