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
- `apps/ai-planner`: Python FastAPI service that handles model-based tool planning
- `packages/db`: Prisma schema and data access contract
- `packages/shared`: shared types, prompts, and eval goldens

## Runtime flow
1. Provider sends inbound payload to `/v1/ingest/{sms|chat|voice}`.
2. API normalizes payload into a common `ConversationEvent`.
3. API applies idempotency and tenant rate-limit checks.
4. Accepted events are queued in Redis (BullMQ).
5. Worker consumes queued events and persists them; retries on transient failures; pushes exhausted failures to DLQ.
6. For direct assistant replies (`/v1/agent/respond`), API stores user message, asks planner chain to choose a tool, executes tool, stores assistant reply + run metadata.
7. Dashboard pages query runs/messages/metrics/evals/incidents from API.

## Hybrid planner integration (Node + Python)
The assistant routing path in `apps/api/src/core/agentService.ts` now uses `apps/api/src/core/assistantPlanner.ts`.

Planner behavior:
- If `PYTHON_PLANNER_URL` is configured, API calls the Python planner first.
- If Python planner fails, API falls back to direct OpenAI planning when `OPENAI_API_KEY` exists.
- If OpenAI fails too, API falls back to deterministic keyword routing.
- JSON output includes:
  - `tool`
  - `tool_input`
  - `assistant_reply`
  - `reasoning`
- API executes selected tool and stores planner metadata in `ToolCall.request`.
- A failure cooldown (`PYTHON_PLANNER_FAILURE_COOLDOWN_MS`) prevents repeated slow calls when Python planner is down.

Why this hybrid model was chosen:
- Python planner isolates AI-routing compute and connection pooling for lower planning latency.
- Node API stays focused on I/O-heavy orchestration (ingest, persistence, queueing, dashboard APIs).
- Multi-level fallback protects reliability during service/model/network incidents.
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
- Planner failure cooldown:
  - Avoids per-request timeout penalties when Python planner is unhealthy.
- Tool execution recorded with request/response:
  - Enables debugging, audits, and metrics calculations.

## What the dashboard shows
- Overview: latency + failure/handoff rates
- Conversations: list and details (messages + runs)
- Agent runs: tool-level execution history
- Evals: golden-suite replay status
- Metrics: aggregate reliability indicators
- Incidents: simulation history
- Simulations: scenario catalog, active run state, step-by-step execution, and critical issue reporting
- Planner observability: each run now exposes planner source (`python` / `openai` / `rules`), with planner mix visible in overview.

## Simulation server (live scenario runner)
The API exposes a simulation service for controlled operator drills:
- `GET /v1/simulations/config`: simulation mode + active scenario/run
- `GET /v1/simulations/scenarios`: supported scenarios with live examples and critical checks
- `POST /v1/simulations/run`: start a scenario run
- `GET /v1/simulations/runs`: latest simulation run history
- `GET /v1/simulations/runs/:id`: per-run detail

How a simulation run works:
1. Operator chooses a named scenario (for example, booking flow or legal-risk handoff).
2. Service creates a dedicated simulation conversation and reuses real `AgentService.respond` path.
3. Each turn is executed as a normal assistant interaction (planner -> tool call -> assistant reply persistence).
4. Run evaluator checks critical constraints per turn:
   - expected tool mismatch
   - failed tool call
   - missing assistant reply
   - latency budget overrun
   - fallback to rules when model planners are expected
5. Run is finalized as `completed`, `completed_with_critical_issues`, or `failed`.
6. Critical simulation outcomes are mirrored into incident history for ops visibility.

Why this approach was chosen:
- Uses the real production path instead of mock-only behavior.
- Gives immediate operational signal on regressions before customer impact.
- Keeps scenario definitions explicit and auditable in code.

## Common failure modes and handling
- Python planner unavailable:
  - API auto-falls back to OpenAI direct planner.
  - Cooldown prevents repeated slow failing calls until retry window.
- OpenAI unavailable:
  - Service falls back to rule routing.
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
