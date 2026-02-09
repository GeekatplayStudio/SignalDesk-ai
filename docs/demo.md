# Demo Scenarios (Draft)

These steps assume Postgres + Redis are running, Prisma client is generated, and demo data is seeded (`pnpm seed`).

## Scenario 1: Ingest to Agent Response
1) POST `/v1/ingest/chat` with a message payload (use any provider_message_id).
2) Worker processes the ingest event and persists it.
3) Call `POST /v1/agent/respond` with a user message.
4) View results in dashboard:
   - Conversations list and detail
   - Agent Runs page for tool call status

## Scenario 2: Run Evals
1) Navigate to Evals page in the dashboard.
2) Click “Run evals” (triggers `POST /v1/evals/run`).
3) Refresh list; confirm pass rate and status.

## Scenario 3: Metrics & Incidents
1) View Metrics page for p50/p95 latency, failure and handoff rates.
2) POST `/v1/incidents/simulate` with `{ "type": "traffic_spike" }`.
3) Verify on Incidents page.

## Scenario 4: Seeded Demo Walkthrough
1) Run `pnpm seed` to load conversations, messages, runs, evals, incidents.
2) Open Conversations page to browse seeded data; click into a conversation detail.
3) Open Agent Runs page to review tool calls.
4) Open Evals page to review seeded runs.
5) Open Metrics page to see aggregate stats.

## Troubleshooting
- If API returns 500, ensure Postgres/Redis are up and Prisma client is generated.
- If dashboard can’t load, verify `NEXT_PUBLIC_API_BASE_URL` and API health (`/v1/readyz`).
- Queue not processing? Check BullMQ worker logs and Redis connectivity.
