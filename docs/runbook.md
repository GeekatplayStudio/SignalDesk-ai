# Geekatplay Studio Runbook

## Startup checklist
1. Ensure `.env` exists (`cp infra/.env.example .env`).
2. Start infrastructure: `cd infra && docker compose up --build`.
3. Seed deterministic demo data: `pnpm seed`.
4. Validate health:
   - API: `GET /v1/healthz` and `GET /v1/readyz`
   - AI planner: `GET /health` on service `ai-planner`
   - Web: `GET /`
   - Redis: `redis-cli ping`
   - Postgres: `pg_isready`

Notes:
- In Docker Compose mode, API startup automatically runs `pnpm db:push`.
- In non-Compose local runs, apply schema manually with `pnpm db:push`.

## Isolated compose mode (recommended when other local servers are running)
Use:
- `pnpm compose:isolated:up`
- `pnpm compose:isolated:logs`
- `pnpm compose:isolated:down`

Default exposed host ports:
- Web: `3400`
- API: `3401`

No host ports are exposed for Postgres/Redis in isolated mode, reducing interference risk.

## Required env vars
- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## Python planner vars (recommended for performance)
- `PYTHON_PLANNER_URL`
- `PYTHON_PLANNER_TIMEOUT_MS`
- `PYTHON_PLANNER_FAILURE_COOLDOWN_MS`

## Optional OpenAI vars
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `OPENAI_TIMEOUT_MS`

If Python planner is unavailable, API falls back to direct OpenAI planning.
If OpenAI vars are missing or invalid, assistant routing still works via fallback rules.

## Dry-run quality commands
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Run these before deploy to catch regressions in API/worker/web behavior.

## Simulation server operations
Enable simulation mode:
1. Set `ENABLE_SIMULATION_MODE=true` in `.env`.
2. Restart API + worker (`docker compose up --build` or `pnpm dev` restart).

Run from dashboard:
- Open `/simulations`
- Use runtime toggle in the page header to enable/disable simulation mode
- Pick a scenario and click `Run Scenario`
- Monitor active scenario + step-level status + critical issue list
- Confirm start feedback labels (`Starting…`, `Started`) and the success banner after run launch
- Include critical-risk drills in regular checks: `security_intrusion_attempt`, `abusive_language_escalation`, `prompt_injection_overflow`

Run from CLI:
- `pnpm simulate -- --base-url http://localhost:3401 --scenario booking_happy_path`

Simulation API endpoints:
- `GET /v1/simulations/config`
- `GET /v1/simulations/scenarios`
- `POST /v1/simulations/run`
- `GET /v1/simulations/runs`
- `GET /v1/simulations/runs/:id`

Simulation dashboard fetch failures (`Failed to fetch`):
1. Verify API is healthy on isolated port: `http://localhost:3401/v1/readyz`.
2. Ensure web is running on `http://localhost:3400`.
3. Rebuild stack so web picks up correct public API base URL:
   - `pnpm compose:isolated:up`

## Operational diagnostics
- API
  - health: `/v1/healthz`
  - readiness: `/v1/readyz`
  - metrics summary: `/v1/metrics/overview`
- Worker
  - inspect logs for failed jobs
  - verify Redis queue key and DLQ key
- Data
  - verify new `Message`, `AgentRun`, and `ToolCall` records for live requests

## Incident handling quick guide
1. Confirm dependency health (Redis/Postgres/OpenAI reachability).
2. Confirm Python planner health.
3. Check API logs for planner fallback events/timeouts.
4. Check latest failed tool calls in `AgentRun` records.
5. Inspect DLQ entries for replay candidates.
6. If both planner paths are degraded, keep service up using rule fallback mode while investigating.

## Known problems to watch
- Duplicate provider message IDs from upstream systems:
  - Expected; service returns `duplicate`.
- Queue backlog growth:
  - Usually indicates worker/downstream DB pressure.
- High handoff rate:
  - Can indicate weak tool coverage or over-conservative prompt routing.
- Invalid/malformed model JSON:
  - Planner auto-fallback protects uptime, but quality can drop.
