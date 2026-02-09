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
- Docs: `docs`

## Getting Started (WIP)
```
pnpm install
pnpm dev
```

Detailed setup, architecture, and run instructions will be documented as integration proceeds.
