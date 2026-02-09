# Multi-Channel Conversation Ingestion Gateway (MCC-IG)

Event-driven ingestion gateway for SMS, chat, and voice messages.

## Stack

- Node.js + TypeScript + Express
- Redis (idempotency, token bucket rate limiting, queue, DLQ)
- PostgreSQL (`conversation_events` durable storage)
- Docker Compose (`app`, `worker`, `postgres`, `redis`)
- Vitest + Supertest (unit/integration-style tests)
- k6 (load testing scenarios)

## API Endpoints

- `POST /v1/ingest/sms`
- `POST /v1/ingest/chat`
- `POST /v1/ingest/voice`
- Compatibility aliases: `/ingest/sms`, `/ingest/chat`, `/ingest/voice`

Internal validation endpoint for load tests:

- `GET /v1/internal/events/count?provider_message_id=...`

## Strict Database Schema

Implemented in `docker/postgres/init.sql`:

- table: `conversation_events`
- columns: `id`, `tenant_id`, `provider_message_id` (UNIQUE), `channel`, `content`, `raw_metadata`, `created_at`
- composite index: `(tenant_id, created_at)`

## Run

1. Copy environment values:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Start the stack:

```bash
docker compose up --build
```

If `3005` is already in use:

```bash
APP_PORT=3010 PORT=3010 docker compose up --build
```

## Tests

```bash
npm test
```

## Console UI (Figma Implementation)

The frontend is implemented in:

- `MCC-IG Console UI Design`

Install and run:

```bash
npm run install:web
npm run dev:web
```

The UI runs on `http://localhost:5173` by default and calls the API at:

- `VITE_API_BASE_URL` (default `http://localhost:3005`)

Key live features wired to backend:

- Ingest Playground -> `POST /v1/ingest/*`
- Replay Verification -> `GET /v1/internal/events/count`
- DLQ Manager -> `GET /v1/internal/dlq`
- Dashboard Health -> `GET /health`

## Load Test (k6)

```bash
k6 run scripts/load_test.js
```

or

```bash
npm run load-test
```

Useful vars:

```bash
BASE_URL=http://localhost:3005 REPLAY_PROVIDER_ID=SM-REPLAY-001 k6 run scripts/load_test.js
```

## Simulation Mode (End-to-End Test Data)

Run full stack first:

```bash
docker compose up --build
```

In another terminal, run simulation traffic:

```bash
npm run simulate
```

What it does:

- Sends mixed valid SMS/CHAT/VOICE events
- Sends duplicate replay bursts (same `provider_message_id`)
- Sends noisy-neighbor bursts to trigger `429`
- Sends forced-failure events (when worker simulation mode is enabled) to verify DLQ

Enable forced worker failures for DLQ simulation:

```bash
ENABLE_SIMULATION_MODE=true
```

You can set it in `.env` and re-run `docker compose up --build`, or override per process locally.

Useful simulation env vars:

```bash
BASE_URL=http://localhost:3005
SIM_UNIQUE_REQUESTS=60
SIM_DUPLICATE_REQUESTS=10
SIM_NOISY_REQUESTS=250
SIM_FAILING_REQUESTS=5
SIM_CONCURRENCY=50
SIM_POST_WAIT_MS=3000
```

## Additional Docs

- `docs/MASTER_REFERENCE.md`
- `docs/APPLICATION_MANUAL.md`
- `docs/DEVELOPER_PATH.md`
- `docs/FEATURE_STATUS.md`
- `docs/PRD_COMPLIANCE_CHECKLIST.md`
