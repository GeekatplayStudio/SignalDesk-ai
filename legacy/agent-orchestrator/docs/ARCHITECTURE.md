# Architecture

## 1. System Overview
The platform follows a two-app monorepo layout:
- `apps/api`: FastAPI service for orchestration/state/tool execution.
- `apps/web`: React dashboard for conversation/trace monitoring.

Supporting services:
- PostgreSQL for persisted session state.
- Docker Compose for local/prod baseline orchestration.

## 2. API Service Design
### Core Modules
- `main.py`: HTTP endpoints, startup bootstrapping, dependency injection.
- `orchestrator.py`: agent state machine, tool routing, budgets, circuit breaker.
- `tools.py`: tool registry and Pydantic-validated tool inputs.
- `database.py`: SQLAlchemy models/session setup.
- `schema.sql`: relational schema reference.

### Agent Loop
1. Persist inbound user message.
2. Update extracted conversation slots.
3. Decide next action using orchestrator logic.
4. Execute tool when needed (validated inputs + timeout).
5. Log tool call to `tool_logs`.
6. Persist assistant response and return turn payload.

### Guardrails
- Global SLA timeout (5s) with static fallback.
- Tool timeout (1s hard).
- Circuit breaker per tool (opens after repeated failures).
- Low-confidence and hostile input automatic handoff.
- Manual handoff endpoint.

## 3. Data Model
- Conversation:
  - lifecycle: `active -> handoff -> closed`
  - includes `slots` JSON for extracted context
- Message:
  - ordered by `order_index` for deterministic replay
- ToolLog:
  - includes `status`, `latency`, `input/output`, `error_msg`

## 4. Web Console Integration
The web app maps backend objects directly:
- Chat column reads `/history`.
- Trace column reads `/logs`.
- Context panel reads `/conversation/{id}` slots + status.
- Emergency button triggers `/handoff`.

## 5. Deployment Topology
- Local: `docker-compose.yml` (api + db) + local `npm run dev` for web.
- Baseline prod: `docker-compose.prod.yml` (api + db, env-driven config).
