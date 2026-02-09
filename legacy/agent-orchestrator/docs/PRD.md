# Product Requirements Document (PRD)

## 1. Product Summary
The Minimum Viable Agent (MVA) Platform is a stateful orchestration service for multi-turn user-agent conversations. It manages context, executes tools, logs trace data, and enforces safety and latency guardrails.

## 2. Goals
- Persist session state and extracted slots across turns.
- Decide deterministically when to call tools versus respond directly.
- Handle tool failures/timeouts without hanging user requests.
- Trigger safe handoff to human operators when needed.
- Expose observability data for support and engineering teams.

## 3. Non-Goals
- Advanced LLM reasoning quality optimization.
- Multi-tenant auth/permissions model.
- Production-grade analytics pipeline beyond session-level traces.

## 4. Personas
- Support Operator: monitors traces and intervenes during failures.
- Backend Engineer: builds orchestration, tool execution, and safety controls.
- QA Engineer: validates flows under normal and degraded conditions.

## 5. Functional Requirements
### 5.1 Conversation API
- Start conversation: `POST /conversation`
- Send message: `POST /conversation/{id}/message`
- Chat alias: `POST /chat`
- Retrieve history/logs/state via GET endpoints.

### 5.2 Tooling
- `check_availability(date)`
- `book_appointment(date, time, email)`
- `create_ticket(issue_summary)`
- `handoff_to_human(reason)`

### 5.3 Safety
- Handoff triggers:
  - explicit user request (`human`, `operator`)
  - hostile input
  - low-confidence decision path
- Manual emergency takeover endpoint:
  - `POST /conversation/{id}/handoff`

### 5.4 Resiliency and SLA
- Global request budget: `< 5000ms`
- Tool timeout: `< 1000ms` hard timeout
- Decision budget (LLM/rules): `< 3000ms`
- Timeout fallback message for calendar checks:
  - "I'm having trouble checking the calendar right now, but I can take your contact info."

## 6. Data Requirements
- `conversations`: `id`, `user_id`, `status`, `slots`, `created_at`
- `messages`: `id`, `conversation_id`, `role`, `content`, `order_index`, `created_at`
- `tool_logs`: tool name, inputs, outputs, latency, status, error

## 7. UX Requirements (Developer Console)
- 3-column mission-control layout:
  - chat feed
  - trace/timeline + tool cards
  - state/context + health + emergency takeover
- Must display real backend trace/state data.

## 8. Acceptance Criteria
- Conversation endpoints return deterministic payloads and logs.
- Tool failures do not crash requests.
- Handoff state prevents further autonomous action.
- Automated tests pass and simulation script reports metrics.
