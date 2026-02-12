# Geekatplay Studio App Explainer

## Purpose
Geekatplay Studio is an operator-facing platform for AI chat management. It gives one runtime for:
- receiving customer messages across channels
- routing each message through assistant logic + tools
- recording outcomes for observability/evals
- surfacing operational status in a dashboard

## Monorepo modules
- `apps/api`: ingest endpoints, agent routes, eval routes, ops metrics routes
- `apps/worker`: async ingestion processor via Redis queue
- `apps/web`: Next.js dashboard for operators
- `packages/db`: Prisma schema and data access contract
- `packages/shared`: shared types, prompts, and eval goldens

## Runtime flow
1. Provider sends inbound payload to `/v1/ingest/{sms|chat|voice}`.
2. API normalizes payload into a common `ConversationEvent`.
3. API applies idempotency and tenant rate-limit checks.
4. Accepted events are queued in Redis (BullMQ).
5. Worker consumes queued events and persists them; retries on transient failures; pushes exhausted failures to DLQ.
6. For direct assistant replies (`/v1/agent/respond`), API stores user message, asks planner to choose a tool, executes tool, stores assistant reply + run metadata.
7. Dashboard pages query runs/messages/metrics/evals/incidents from API.

## OpenAI assistant integration
The assistant routing path in `apps/api/src/core/agentService.ts` now uses `apps/api/src/core/assistantPlanner.ts`.

Planner behavior:
- If `OPENAI_API_KEY` exists, planner calls OpenAI Chat Completions with a strict JSON output contract.
- JSON output includes:
  - `tool`
  - `tool_input`
  - `assistant_reply`
  - `reasoning`
- API executes selected tool and stores planner metadata in `ToolCall.request`.
- If OpenAI fails, times out, or returns invalid JSON, planner falls back to deterministic keyword routing.

Why this hybrid model was chosen:
- OpenAI improves routing quality and response quality for ambiguous user requests.
- Deterministic fallback protects reliability during model/network incidents.
- Structured JSON output keeps tool execution safe and auditable.

## Key design choices and rationale
- Idempotency before queue push:
  - Prevents duplicate provider retries from creating duplicate events.
  - Keeps downstream worker load stable.
- Rate-limit rollback of idempotency claim:
  - If a request is rejected for rate limits, claim is removed so client can retry later.
- Queue + worker split:
  - Ingestion remains fast even when persistence is slow.
  - Retries and DLQ provide operability.
- Bounded chat context (last 12 messages) for OpenAI:
  - Prevents unbounded latency/cost growth on long conversations.
- Tool execution recorded with request/response:
  - Enables debugging, audits, and metrics calculations.

## What the dashboard shows
- Overview: latency + failure/handoff rates
- Conversations: list and details (messages + runs)
- Agent runs: tool-level execution history
- Evals: golden-suite replay status
- Metrics: aggregate reliability indicators
- Incidents: simulation history

## Common failure modes and handling
- OpenAI unavailable:
  - Service falls back to rule routing.
  - `ToolCall.request` records fallback reason.
- Redis unavailable:
  - Ingest/worker operations fail; API returns errors; compose health checks reveal status.
- Postgres unavailable:
  - Agent run persistence and worker inserts fail; worker retries then DLQ.
- Invalid provider payloads:
  - Zod validation returns HTTP 400 with field-level issue info.
- Duplicate provider message IDs:
  - Returned as `status: duplicate` without reprocessing.

## Where to read next
- Architecture detail: `docs/architecture.md`
- Operational procedures: `docs/runbook.md`
- High-level product view: `docs/overview.md`
