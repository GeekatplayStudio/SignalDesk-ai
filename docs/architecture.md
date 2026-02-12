# Geekatplay Studio Architecture

## System boundaries
- External providers send inbound events (chat/sms/voice) into API ingest routes.
- API owns validation, normalization, routing, persistence orchestration, and operator endpoints.
- Python planner owns model-based tool decisioning and assistant reply draft generation.
- Worker owns async queue processing and DLQ placement.
- Web app reads API state and presents operations views.

## Components
- API (`apps/api`)
  - Ingest router: `/v1/ingest/*`
  - Agent router: `/v1/agent/respond`, `/v1/agent/runs`, `/v1/conversations`
  - Eval router: `/v1/evals/*`
  - Ops router: `/v1/metrics/overview`, `/v1/incidents/*`, `/v1/simulations/*`
- Worker (`apps/worker`)
  - BullMQ consumer
  - Retry with exponential backoff
  - DLQ write for exhausted attempts
- AI Planner (`apps/ai-planner`)
  - FastAPI service
  - Calls OpenAI Chat Completions with connection pooling
  - Returns structured tool plan JSON to API
- Data
  - Postgres via Prisma (`packages/db`)
  - Redis for queue/idempotency/rate limits

## Assistant decision architecture
`AgentService` delegates planning to `AssistantPlanner`:

1. Build bounded context from recent conversation messages.
2. Ask planner to produce structured decision:
   - `tool`
   - `tool_input`
   - `assistant_reply`
   - `reasoning`
3. Execute tool.
4. Persist run + tool call details.
5. Return response payload to caller.

Planner implementations:
- Python planner first when `PYTHON_PLANNER_URL` is configured.
- OpenAI direct planner fallback when Python planner is unavailable.
- Rule-based planner as final reliability fallback.

## Data model highlights
- `Conversation`: chat thread root
- `Message`: user/assistant/system turns
- `IngestEvent`: normalized inbound provider events
- `AgentRun`: one orchestration cycle
- `ToolCall`: tool execution details tied to a run

## Reliability patterns
- Idempotency key by provider message ID
- Token bucket rate limiting by tenant
- Queue decoupling between ingress and persistence
- Worker retries and DLQ
- Planner failure cooldown to avoid repeated timeout penalties
- Health/readiness endpoints for service orchestration

## Security and safety posture (current)
- Input validation via Zod for public ingest and agent endpoints
- No secrets persisted in code
- OpenAI integration uses env-based API key
- Python planner is isolated as a separate service boundary
- Guardrail/eval scaffolding present; can be expanded with production policy checks

## Known architecture gaps
- Incidents/evals currently have partial in-memory storage paths
- No auth/tenant isolation enforcement on all routes yet
- No streaming assistant responses yet
- Tool implementations are deterministic stubs, not external production systems
