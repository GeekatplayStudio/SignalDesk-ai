# Runbook (Draft)

## Startup
1) Ensure env vars in `.env` (or `infra/.env.example` copied).
2) Start services: `cd infra && docker compose up --build`.
3) Generate Prisma client (local): `cd packages/db && PRISMA_ENGINE_CACHE_DIR="$(pwd)/.prisma-cache" pnpm db:generate`.
4) Push schema (dev): `pnpm db:push`; seed: `pnpm seed`.
5) Health checks: API `/v1/readyz`, Web `/` load, Redis ping, Postgres `pg_isready`.

## Health/Diagnostics
- API: `/v1/healthz`, `/v1/readyz`.
- Worker: monitor BullMQ events/logs; check Redis connectivity.
- DB: `pg_isready -U agentops -d agentops`.
- Redis: `redis-cli ping`.

## Incidents
- Simulate via `POST /v1/incidents/simulate` (types: `tool_latency_spike`, `redis_down`, `traffic_spike`, etc.).
- DLQ visibility (to add UI): inspect Redis DLQ key.
- Kill switches / feature flags (planned): disable specific tools or guardrails if causing harm.

## Backups & Data
- Postgres volume `pgdata` (compose) holds state; snapshot before risky changes.
- Redis is ephemeral in dev; in prod use managed Redis with persistence.

## Deploy
- Build images via app Dockerfiles; compose uses healthchecks for ordering.
- Required env: `DATABASE_URL`, `REDIS_URL`, `PORT`, `NEXT_PUBLIC_API_BASE_URL`.

## Common Issues
- **Prisma generate fails**: set `PRISMA_ENGINE_CACHE_DIR` to writable path.
- **Dashboard blank**: check `NEXT_PUBLIC_API_BASE_URL` points to API, ensure CORS if custom host.
- **Queue stuck**: verify Redis connectivity, check BullMQ worker logs, ensure API enqueue keys match worker queue name.
