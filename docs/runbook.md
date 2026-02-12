# Geekatplay Studio Runbook

## Startup checklist
1. Ensure `.env` exists (`cp infra/.env.example .env`).
2. Start infrastructure: `cd infra && docker compose up --build`.
3. Apply DB schema: `pnpm db:push`.
4. Seed deterministic demo data: `pnpm seed`.
5. Validate health:
   - API: `GET /v1/healthz` and `GET /v1/readyz`
   - Web: `GET /`
   - Redis: `redis-cli ping`
   - Postgres: `pg_isready`

## Required env vars
- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## Optional OpenAI vars
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `OPENAI_TIMEOUT_MS`

If OpenAI vars are missing or invalid, assistant routing still works via fallback rules.

## Dry-run quality commands
- `pnpm lint`
- `pnpm test`
- `pnpm build`

Run these before deploy to catch regressions in API/worker/web behavior.

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
2. Check latest failed tool calls in `AgentRun` records.
3. Inspect DLQ entries for replay candidates.
4. If OpenAI degraded, keep service up using fallback mode while investigating key/model/network issues.

## Known problems to watch
- Duplicate provider message IDs from upstream systems:
  - Expected; service returns `duplicate`.
- Queue backlog growth:
  - Usually indicates worker/downstream DB pressure.
- High handoff rate:
  - Can indicate weak tool coverage or over-conservative prompt routing.
- Invalid/malformed model JSON:
  - Planner auto-fallback protects uptime, but quality can drop.
