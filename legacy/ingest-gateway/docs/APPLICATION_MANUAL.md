# MCC-IG Application Manual

## 1) Prerequisites

- Docker + Docker Compose
- Node.js 22+
- npm
- k6 (optional, for load tests)

## 2) Start the Full Stack

```bash
cp .env.example .env
npm install
docker compose up --build
```

Services:
- API: `http://localhost:3005`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

If port `3005` is already occupied:

```bash
APP_PORT=3010 PORT=3010 docker compose up --build
```

## 3) Send Sample Requests

### SMS

```bash
curl -s -X POST http://localhost:3005/v1/ingest/sms \
  -H 'content-type: application/json' \
  -d '{
    "tenant_id":"tenant-a",
    "From":"+14155550001",
    "To":"+14155550002",
    "Body":"hello",
    "MessageSid":"SM-001",
    "Timestamp":"2026-02-09T12:00:00.000Z"
  }'
```

### Chat

```bash
curl -s -X POST http://localhost:3005/v1/ingest/chat \
  -H 'content-type: application/json' \
  -d '{
    "tenant_id":"tenant-a",
    "userId":"user-1",
    "message":"hello from chat",
    "chatId":"chat-1",
    "timestamp":"2026-02-09T12:01:00.000Z",
    "messageId":"CHAT-001"
  }'
```

### Voice

```bash
curl -s -X POST http://localhost:3005/v1/ingest/voice \
  -H 'content-type: application/json' \
  -d '{
    "tenant_id":"tenant-a",
    "callId":"call-1",
    "transcript_text":"customer asked for refund",
    "confidence":0.91,
    "duration":22,
    "timestamp":"2026-02-09T12:02:00.000Z"
  }'
```

## 4) Operational Semantics

- First accepted event returns `201`.
- Duplicate `provider_message_id` returns `200`.
- Rate limit violations return `429`.
- Invalid payload returns `400`.

## 5) Verify Replay Deduplication in DB

```bash
curl -s "http://localhost:3005/v1/internal/events/count?provider_message_id=SM-001"
```

Expected:
- `{ "provider_message_id": "SM-001", "count": 1 }`

## 6) Run Tests

```bash
npm test
```

## 7) Run Load Test (k6)

```bash
k6 run scripts/load_test.js
```

or

```bash
npm run load-test
```

Optional env:

```bash
BASE_URL=http://localhost:3005 REPLAY_PROVIDER_ID=SM-REPLAY-001 k6 run scripts/load_test.js
```

If replay DB verification is needed, ensure:

```bash
ENABLE_INTERNAL_ENDPOINTS=true
```

## 8) Shut Down

```bash
docker compose down
```

## 9) Simulation Mode (Recommended Demo)

Simulation mode generates realistic mixed traffic and verifies:
- accepted ingestion (`201`)
- duplicate deduplication (`200`)
- noisy-neighbor throttling (`429`)
- DLQ handling for forced worker failures

Run:

```bash
npm run simulate
```

Optional knobs:

```bash
BASE_URL=http://localhost:3005
SIM_UNIQUE_REQUESTS=60
SIM_DUPLICATE_REQUESTS=10
SIM_NOISY_REQUESTS=250
SIM_FAILING_REQUESTS=5
SIM_CONCURRENCY=50
SIM_POST_WAIT_MS=3000
```

To force worker-side failures and prove DLQ behavior, enable:

```bash
ENABLE_SIMULATION_MODE=true
```

When using Docker Compose, set `ENABLE_SIMULATION_MODE=true` for the `worker` service and restart.

## 10) Run Console UI

```bash
npm run install:web
npm run dev:web
```

Optional frontend env:

```bash
cp "MCC-IG Console UI Design/.env.example" "MCC-IG Console UI Design/.env"
```
