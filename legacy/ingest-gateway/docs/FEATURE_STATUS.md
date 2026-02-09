# MCC-IG Feature Status

## Implemented

- API endpoints for all three channels:
  - `POST /v1/ingest/sms`
  - `POST /v1/ingest/chat`
  - `POST /v1/ingest/voice`
- Compatibility endpoint aliases:
  - `/ingest/sms`, `/ingest/chat`, `/ingest/voice`
- Zod request validation per channel.
- Normalization to a shared `ConversationEvent` model.
- Redis idempotency with TTL (default 24h).
- Per-tenant Redis token bucket rate limiting.
- Redis queue producer (`RPUSH`) and consumer (`BLPOP`).
- Worker retry logic with exponential backoff.
- DLQ routing after max retry attempts.
- PostgreSQL persistence with strict schema:
  - `id`, `tenant_id`, `provider_message_id` (UNIQUE), `channel`, `content`, `raw_metadata`, `created_at`
  - index `(tenant_id, created_at)`
- Docker Compose stack for app + worker + Postgres + Redis.
- Operations Console frontend implemented from Figma bundle:
  - Dashboard
  - Ingest Playground (live API calls)
  - Replay Verification (live dedupe verification)
  - Rate Limit Monitor
  - DLQ & Failures (live DLQ read endpoint)
  - API Docs Lite
- Automated tests:
  - normalization
  - ingestion behavior (accepted/duplicate/429/validation)
  - worker retry + DLQ
  - repository SQL mapping
- k6 load test script with required scenarios:
  - Good Citizen (50 VUs)
  - Replay Attack (10 VUs same provider id)
  - Noisy Neighbor (200 RPS)
- Node-based simulation runner (`npm run simulate`) for end-to-end test data generation and verification:
  - mixed channel ingestion traffic
  - duplicate replay verification
  - noisy-neighbor `429` verification
  - optional forced-failure flow to DLQ (`ENABLE_SIMULATION_MODE=true`)

## Partially Implemented / Environment-Dependent

- End-to-end simulation with Docker requires local Docker daemon access.
- k6 script verifies replay DB row count via internal endpoint; this endpoint is intended for non-production validation and can be disabled with `ENABLE_INTERNAL_ENDPOINTS=false`.

## Not Yet Implemented (Recommended)

- AuthN/AuthZ on ingestion endpoints.
- Production-grade observability dashboards/alerts (metrics + tracing).
- Automated CI pipeline running integration tests against ephemeral Redis/Postgres.
- Optional Redis Streams/RabbitMQ implementation for stronger queue durability and consumer groups.
- Operational tooling for DLQ replay workflows.
