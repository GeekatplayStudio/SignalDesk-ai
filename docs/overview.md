# AgentOps Studio – Product & Technical Overview

## What this program is for
AgentOps Studio is a unified platform to ingest multi-channel conversations, orchestrate AI agents with tool calls, evaluate/guardrail them, and observe reliability/operations from a single dashboard. It aims to give teams a production-ready control plane for AI customer workflows (SMS/chat/voice), with reliability (queues, DLQ, retries), safety (guardrails/evals), and observability (metrics, incidents, SLOs).

## What it does (capabilities)
- **Ingestion gateway**: Accepts SMS/chat/voice events with idempotency, rate limits, Redis-backed queue, DLQ.
- **Agent orchestration**: Handles user turns, selects/executes tools (`check_availability`, `book_appointment`, `create_ticket`, `handoff_to_human`), persists conversations, messages, runs, and tool calls in Postgres via Prisma.
- **Evaluations & guardrails**: Replays golden cases, records pass/fail and guardrail violations; goldens and prompts are versioned in `packages/shared`.
- **Observability & incidents**: Exposes metrics (latency, failure/handoff rates), incident simulations, structured logging, and is wired for OpenTelemetry.
- **Dashboard (Next.js)**: Pages for overview, conversations (list + detail), agent runs, evals (with “Run evals”), metrics, incidents; uses React Query + TanStack Table; shadcn/tailwind styling.
- **Seeds & demo**: Seed script creates demo conversations/messages/runs/evals/incidents for deterministic demos.

## How it does it (architecture)
- **Monorepo (pnpm workspaces)**  
  - `apps/api`: Express API; endpoints for ingest, agent respond, evals, metrics, incidents; pushes ingest jobs to BullMQ; Prisma for persistence.  
  - `apps/worker`: BullMQ worker consuming ingest jobs; writes to Postgres via Prisma.  
  - `apps/web`: Next.js App Router dashboard; React Query for data, TanStack Table for lists, shadcn/tailwind for UI.  
  - `packages/db`: Prisma schema & client.  
  - `packages/shared`: Zod schemas, shared types, goldens, prompts.  
  - `packages/telemetry`: OpenTelemetry helpers.  
  - `packages/ui`: shared UI placeholder.  
  - `infra`: docker-compose + env examples for Postgres, Redis, api, worker, web.  
  - `docs`: plan, overview, architecture/runbook/SLO stubs.
- **Data layer**: Postgres via Prisma; core entities include Conversation, Message, IngestEvent, AgentRun, ToolCall, EvalSuite/Run/Case, GuardrailViolation, MetricPoint, Incident.
- **Queues**: BullMQ on Redis; retries/backoff and DLQ ready; ingestion is enqueue-only, processing in worker.
- **Reliability**: Idempotency keys on ingest, rate limiting, queue-based at-least-once, dead-letter queue, health checks in compose.
- **Testing targets**: Vitest for unit/integration, Playwright for E2E (to be filled), seed data for deterministic checks.
- **Deployment**: Dockerfiles per app; compose wiring with healthchecks; env-driven config; API/worker/web expose health/ready endpoints.

## Who can use this and why
- **AI/ML platform teams**: need a governed, observable way to run agents in prod with evals/guardrails and operational controls.  
- **Product/ops teams**: run demos, incidents, and monitor latency/failure/handoff/SLOs from one console.  
- **Developers**: extend tools, prompts, guardrails, and add channels without rebuilding infra; monorepo + pnpm eases iteration.

## Structure at a glance
- Entry points: `apps/api/src/server.ts`, `apps/worker/src/index.ts`, `apps/web/app/page.tsx` (and feature subpages).
- Schemas/models: `packages/db/prisma/schema.prisma`, `packages/shared/src/index.ts`.
- Goldens/prompts: `packages/shared/goldens`, `packages/shared/prompts`.
- Infra: `infra/docker-compose.yml`, `infra/.env.example`.
- Seeds: `scripts/seed.ts`.

## Current status & prerequisites
- Builds pass for api/worker/web.  
- Prisma client generation must be run locally (sandbox can’t write cache):  
  `cd packages/db && PRISMA_ENGINE_CACHE_DIR="$(pwd)/.prisma-cache" pnpm db:generate`  
  then `pnpm db:push` and `pnpm seed` with Postgres/Redis running.

## How to run (dev/prod)
- Dev (concurrent): `pnpm dev` (requires env + Postgres/Redis; see infra compose).  
- Compose (prod-like): `cd infra && docker compose up --build`.  
- Web env: set `NEXT_PUBLIC_API_BASE_URL` (compose example provided).  
- Seeds: `pnpm seed` after DB is up and Prisma client generated.

## Roadmap (remaining work)
- Migrations + automatic apply, richer guardrails/eval storage, queue DLQ surfacing, telemetry wiring, table pagination/filters, demo control panel, tests (Vitest + Playwright), SLOs/runbook/docs hardening.
