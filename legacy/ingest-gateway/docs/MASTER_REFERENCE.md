# MCC-IG Master Reference

## 1) Purpose

MCC-IG is the ingestion front door for multi-channel conversation data. It receives SMS/chat/voice payloads, validates and normalizes them, applies idempotency + rate limits, enqueues events, and persists them asynchronously through a worker.

## 2) End-to-End Flow

1. Client/provider sends request to `POST /v1/ingest/{sms|chat|voice}`.
2. Request body is validated with Zod.
3. Payload is normalized into a `ConversationEvent`.
4. Redis idempotency key (`provider_message_id`) is checked/claimed with TTL.
5. Redis token bucket enforces per-tenant limits.
6. Accepted event is queued (`RPUSH queue:conversations`).
7. Worker consumes queue (`BLPOP`), retries DB insert with exponential backoff.
8. After max retries, event is pushed to `dlq:conversations`.

## 3) Normalized Event Contract

```ts
interface ConversationEvent {
  event_id: string;
  provider_message_id: string;
  tenant_id: string;
  channel_type: 'SMS' | 'CHAT' | 'VOICE';
  timestamp: string;
  content: string;
  metadata: Record<string, unknown>;
  raw_metadata: Record<string, unknown>; // original input payload
}
```

## 4) API Contracts

### `POST /v1/ingest/sms`

Required body fields:
- `tenant_id`
- `From`
- `To`
- `Body`
- `MessageSid`

Optional:
- `Timestamp` (ISO8601)

### `POST /v1/ingest/chat`

Required body fields:
- `tenant_id`
- `userId`
- `message`
- `chatId`

Optional:
- `timestamp` (ISO8601)
- `messageId`
- `metadata`

### `POST /v1/ingest/voice`

Required body fields:
- `tenant_id`
- `callId`
- `transcript_text`
- `confidence` (0..1)

Optional:
- `duration`
- `timestamp` (ISO8601)
- `segmentId`
- `metadata`

### Responses

- `201` accepted + enqueued
- `200` duplicate (`provider_message_id` already seen)
- `429` rate limited
- `400` validation error
- `500` internal error

## 5) Idempotency and Rate Limiting

- Idempotency key: `idempotency:{provider_message_id}`
- TTL default: 24h (`IDEMPOTENCY_TTL_SECONDS=86400`)
- Duplicate behavior: return `200` without reprocessing
- Rate limiting: Redis Lua token bucket keyed by `tenant_id`

## 6) Queue and Worker

- Queue key: `queue:conversations`
- DLQ key: `dlq:conversations`
- Worker retries: configurable (`WORKER_MAX_RETRIES`, `WORKER_BASE_BACKOFF_MS`)
- Backoff: exponential (`base * 2^(attempt-1)`)

## 7) Strict PostgreSQL Schema

```sql
CREATE TABLE conversation_events (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  provider_message_id TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'chat', 'voice')),
  content TEXT NOT NULL,
  raw_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversation_events_tenant_created_at
ON conversation_events (tenant_id, created_at);
```

## 8) Internal Test Endpoint

For replay-test DB verification:
- `GET /v1/internal/events/count?provider_message_id=...`
- `GET /v1/internal/dlq?limit=50`

Enabled by:
- `ENABLE_INTERNAL_ENDPOINTS=true`

Cross-origin frontend access:
- `ENABLE_CORS=true`
- `CORS_ORIGIN=*` (or a specific UI origin)

## 9) Key Files

- API routes: `src/api/routes.ts`
- API controller: `src/api/controllers/ingestController.ts`
- Ingestion orchestration: `src/core/ingestionService.ts`
- Normalization: `src/core/normalize.ts`
- Redis limiter: `src/infra/redisTokenBucketRateLimiter.ts`
- Worker loop: `src/worker/worker.ts`
- DB schema: `docker/postgres/init.sql`
- k6 test: `scripts/load_test.js`
- Simulation runner: `scripts/simulate-system.ts`
