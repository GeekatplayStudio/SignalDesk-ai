# AgentOps Studio

Monorepo combining ingestion gateway, agent orchestration, evaluations/guardrails, and observability/incident tooling into a single TypeScript/Node/Next.js stack.

Imported source (for reference while refactoring) lives under `legacy/`:
- `legacy/ingest-gateway` (MCC-IG Express + Redis + Postgres)
- `legacy/agent-orchestrator` (FastAPI + React console)
- `legacy/guardrails` (Sentinel eval/guardrails + Next dashboard)
- `legacy/ops-guard` (Ops observability Express backend + Next UI)

## Workspace
- Package manager: pnpm workspaces
- Apps: `apps/api`, `apps/web`, `apps/worker`
- Packages: `packages/shared`, `packages/db`, `packages/telemetry`, `packages/ui`
- Infra: `infra` (docker-compose, env examples)
- Docs: `docs` (overview in `docs/overview.md`, plan in `docs/plan.md`)

## Getting Started (demo-ready)
```
# install deps (reuse existing pnpm store path if present)
pnpm install --store-dir "$HOME/Library/pnpm/store/v3"

# generate Prisma client (needs writable cache path in some sandboxes)
cd packages/db
PRISMA_ENGINE_CACHE_DIR="$(pwd)/.prisma-cache" pnpm prisma generate
cd ../..

# push schema and seed demo data (Postgres + Redis must be running)
pnpm db:push
pnpm seed

# run all apps (api, worker, web)
pnpm dev
```

### Docker Compose (prod-like demo)
```
cd infra
cp .env.example ../.env   # adjust if needed
docker compose up --build
```
`NEXT_PUBLIC_API_BASE_URL` is pre-set for compose; keep ports 3000 (web) and 3001 (api) free.
