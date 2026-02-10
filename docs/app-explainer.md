# AgentOps Studio – Detailed Guide

## What this application is
AgentOps Studio is a monorepo that delivers a production-style control plane for AI agent operations. It ingests multichannel user events, runs agent tools, evaluates quality/guardrails, and surfaces operational metrics/incidents in a Next.js dashboard.

## Core pieces (monorepo layout)
- `apps/api` — Express API that exposes ingest endpoints, agent respond, eval triggers, metrics, and incident simulation.
- `apps/worker` — BullMQ worker that consumes queued ingest jobs (primes for async processing/retries).
- `apps/web` — Next.js App Router dashboard (React + Tailwind + React Query + TanStack Table).
- `packages/db` — Prisma schema/client for Postgres; single source of truth for entities.
- `packages/shared` — Zod schemas/types, plus goldens/prompts referenced by evals.
- `packages/telemetry` — OpenTelemetry SDK helper for future tracing/metrics export.
- `packages/ui` — placeholder for shared UI components (not yet populated).
- `infra` — docker-compose to run Postgres, Redis, API, worker, and web together.
- `scripts/seed.ts` — deterministic demo data seeding (conversations, messages, runs, evals, incidents).

## Key terminology (data model)
- **Tenant**: optional owner namespace for conversations.
- **Conversation**: thread of messages; created on ingest or agent response.
- **Message**: individual turn (`user` / `assistant` / `system`).
- **IngestEvent**: normalized record of incoming provider events (SMS/chat/voice) with idempotent `providerMessageId`.
- **AgentRun**: a single agent execution over a conversation; contains status, latency, and tool calls.
- **ToolCall**: an invoked tool (e.g., `check_availability`, `book_appointment`, `create_ticket`, `handoff_to_human`) with request/response and latency.
- **EvalSuite / EvalRun / EvalCase**: collection of golden cases; each run records pass/fail rate.
- **GuardrailViolation**: stored violation of a policy (e.g., PII).
- **MetricPoint**: generic metric record; currently derived on the fly from runs.
- **Incident**: simulated operational incident (type + status).

## How it works (runtime flow)
1) **Ingestion API** (`apps/api/src/api/routes.ts`):
   - Endpoints: `/v1/ingest/{sms,chat,voice}` normalize payloads and enqueue jobs.
   - Uses Redis token-bucket rate limiting and idempotency (stores providerMessageId) to prevent duplicates.
2) **Queue & Worker**:
   - Jobs land in a BullMQ queue (`createIngestQueue`).
   - `apps/worker` consumes jobs (hook points for persistence/processing; current scaffold is minimal).
3) **Agent Respond** (`/v1/agent/respond`):
   - Creates/upsserts a conversation, writes the user message, chooses a tool (stubbed selector), runs the tool, writes assistant reply, records `AgentRun` + `ToolCall`, and returns the run plus messages.
4) **Evals** (`/v1/evals/run`):
   - Triggers `runEvalSuite` over goldens in `packages/shared/goldens`; responses stored in memory for now and exposed via `/v1/evals/runs`.
5) **Ops/Observability** (`/v1/metrics/overview`, `/v1/incidents`):
   - Computes p50/p95 latency, tool failure rate, and handoff rate from stored runs.
   - Simulated incidents can be posted to `/v1/incidents/simulate`; history kept in-memory.
6) **Dashboard** (`apps/web`):
   - React Query fetches API endpoints for overview, conversations, runs, evals, metrics, and incidents.
   - TanStack Table renders conversation and agent-run lists.
   - Responsive shell: sidebar on desktop, chip nav on mobile; tables are horizontally scrollable on small screens.

## Why it’s useful (benefits)
- **Unified surface**: ingest, orchestrate, evaluate, and observe agent behavior in one stack.
- **Deterministic demos**: seed script produces consistent conversations/runs/evals/incidents for live demos.
- **Operational posture**: built-in rate limiting, idempotency, queueing, and basic incident simulation.
- **Extensibility**: Prisma schema + shared Zod types centralize contracts; queue/worker pattern is ready for real tool logic; web dashboard already wired to API.
- **Deployable locally**: docker-compose spins up DB/Redis/API/worker/web with env defaults.

## Current limitations / improvement ideas
- **UI kit completion**: install shadcn dependencies (`class-variance-authority`, `tailwind-merge`, `@radix-ui/react-slot`, `lucide-react`) and refactor primitives to use them.
- **Testing**: replace smoke Vitest tests with real API/worker integration tests (ingest idempotency, rate limits, agent respond, metrics).
- **Persistence breadth**: incidents, eval runs, and metrics are in-memory; move them to Postgres and expose pagination/filtering.
- **Auth & multitenancy**: add API auth (keys/JWT) and tenant scoping across all queries.
- **Error handling & validation**: strengthen schema validation on ingest/agent paths; return typed error responses.
- **Telemetry**: wire `packages/telemetry` to export traces/metrics to OTLP (e.g., collector) and add request/queue spans.
- **Migrations & CI**: add Prisma migrations, CI for lint/test/build, and seeded test DB for reproducible checks.
- **UX polish**: add sorting/filtering to TanStack tables, skeleton loaders, and richer empty/error states.
