# Geekatplay Studio

Geekatplay Studio is a TypeScript monorepo for AI chat operations: multi-channel ingestion, assistant orchestration, eval/guardrail checks, and ops visibility in one stack.

## Repository layout
- `apps/api`: Express API (ingest, agent respond, evals, metrics, incidents)
- `apps/worker`: queue consumer for ingestion events
- `apps/web`: Next.js dashboard
- `apps/ai-planner`: Python FastAPI planner service for low-latency tool routing
- `packages/db`: Prisma schema/client
- `packages/shared`: shared schemas, prompts, and golden eval cases
- `infra`: Docker Compose + env template
- `docs`: architecture, explainer, runbook
- `legacy`: imported historical code for reference only

## Hybrid assistant integration (Node + Python)
- `POST /v1/agent/respond` uses a planner chain:
  - Python planner service (`PYTHON_PLANNER_URL`) for fast-path routing
  - OpenAI direct planner fallback from API
  - deterministic rule fallback as final safety net
- The planner returns structured JSON (`tool`, `tool_input`, `assistant_reply`, `reasoning`), then the API executes the selected tool and persists run metadata.
- If upstream planners are unavailable or return malformed output, chat handling remains available through fallback routing.

## Quick start
```bash
pnpm install
cp infra/.env.example .env
pnpm db:push
pnpm seed
pnpm dev
# optional outside compose: start Python planner for lower planner latency
# cd apps/ai-planner && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8080
```

## Docker (prod-like local run)
```bash
cd infra
docker compose up --build
```

## Docker (isolated, non-interfering local run)
This stack is designed to avoid clashing with other local services:
- dedicated Compose project name (`geekatplay_isolated`)
- no host port exposure for Postgres/Redis
- web/api mapped to isolated ports (`3400/3401` by default)

```bash
pnpm compose:isolated:up
```

Then open:
- web: `http://localhost:3400`
- api: `http://localhost:3401`

Shutdown:
```bash
pnpm compose:isolated:down
```

View logs:
```bash
pnpm compose:isolated:logs
```

## Quality checks (dry run)
```bash
pnpm lint
pnpm test
pnpm build
```
`pnpm test` runs API + worker Vitest suites and Python planner unit tests.

## Simulation server (operator drills)
- Simulation mode is disabled by default; enable with:
  - `ENABLE_SIMULATION_MODE=true`
- Dashboard tools:
  - `http://localhost:3400/simulations` (or `/simulations` on your configured web host)
  - runtime toggle in page header to enable/disable simulation mode without restart
- API endpoints:
  - `GET /v1/simulations/config`
  - `GET /v1/simulations/scenarios`
  - `POST /v1/simulations/run`
  - `GET /v1/simulations/runs`
  - `GET /v1/simulations/runs/:id`
- CLI runner:
```bash
pnpm simulate -- --base-url http://localhost:3401 --scenario booking_happy_path
```
The simulation runner reports active scenario, per-run status, and critical issues (tool mismatch, failed tool calls, fallback to rules, latency budget breaches).

## Required environment variables
- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `ENABLE_SIMULATION_MODE` (default: `false`)

## OpenAI environment variables (optional but recommended)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `OPENAI_TIMEOUT_MS` (default: `8000`)

## Python planner environment variables (recommended for best performance)
- `PYTHON_PLANNER_URL` (default in compose: `http://ai-planner:8080`)
- `PYTHON_PLANNER_TIMEOUT_MS` (default: `1500`)
- `PYTHON_PLANNER_FAILURE_COOLDOWN_MS` (default: `3000`)

## Main docs
- `docs/app-explainer.md`
- `docs/architecture.md`
- `docs/runbook.md`
- `docs/simulation.md`
- `docs/risks.md`
