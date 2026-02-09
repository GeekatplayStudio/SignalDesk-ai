# Minimum Viable Agent (MVA) Platform

Stateful orchestration platform for multi-turn AI-agent conversations with strict safety, resiliency, and traceability requirements.

## Repository Structure
- `apps/api`: FastAPI orchestration service + Postgres models.
- `apps/web`: React/Vite Developer Console (Figma-derived and productionized naming/structure).
- `docs`: PRD, architecture, operations manual, deployment, testing, simulation, roadmap.
- `scripts`: operational helpers including simulation runner.
- `docker-compose.yml`: local development stack.
- `docker-compose.prod.yml`: production-oriented compose baseline.
- `Makefile`: standard project commands.

## Quick Start (Local)
1. Start API + Postgres:
```bash
make up
```
2. Start web console:
```bash
make install-web
cp apps/web/.env.example apps/web/.env
make dev-web
```
3. Open:
- API: `http://localhost:8000`
- Web: `http://localhost:5173`

## Core API Endpoints
- `POST /conversation`
- `POST /conversation/{id}/message`
- `POST /chat`
- `POST /conversation/{id}/handoff`
- `GET /conversation/{id}`
- `GET /conversation/{id}/history`
- `GET /conversation/{id}/logs`

## Quality Gates
- API tests:
```bash
make install-api
make test-api
```
or:
```bash
make test-api-docker
```
- Web build validation:
```bash
make test-web
```
- End-to-end simulation:
```bash
make simulate
```
or:
```bash
make simulate-docker
```

## Documentation Index
- Product requirements: `docs/PRD.md`
- Architecture: `docs/ARCHITECTURE.md`
- Testing strategy and commands: `docs/TESTING.md`
- Deployment guide: `docs/DEPLOYMENT.md`
- Simulation guide: `docs/SIMULATION.md`
- Operations manual: `docs/OPERATIONS_MANUAL.md`
- Roadmap and backlog: `docs/ROADMAP.md`
