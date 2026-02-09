# PRD Compliance Checklist

## Core PRD Requirements

- [x] `POST /v1/ingest/sms` implemented.
- [x] `POST /v1/ingest/chat` implemented.
- [x] `POST /v1/ingest/voice` implemented.
- [x] Payload validation via Zod implemented.
- [x] Normalization into `ConversationEvent` implemented.
- [x] Redis idempotency implemented (24h TTL default).
- [x] Redis token bucket rate limiting by `tenant_id` implemented.
- [x] Queue producer/consumer implemented using Redis List (`RPUSH`/`BLPOP`).
- [x] Worker persistence to Postgres implemented.
- [x] Worker retry logic with exponential backoff implemented.
- [x] DLQ handoff after max retries implemented.

## Detailed Schema Requirements (Strict)

- [x] Table `conversation_events` implemented.
- [x] `id UUID PRIMARY KEY` implemented.
- [x] `tenant_id` implemented and indexed via composite index.
- [x] `provider_message_id` implemented with UNIQUE constraint.
- [x] `channel` implemented with allowed values `sms|chat|voice`.
- [x] `content` implemented.
- [x] `raw_metadata JSONB` implemented (stores original payload).
- [x] `created_at DEFAULT NOW()` implemented.
- [x] Composite index `(tenant_id, created_at)` implemented.

## Load Test Requirements (k6)

- [x] Scenario A (Good Citizen): 50 VUs with valid unique requests.
- [x] Scenario B (Replay Attack): 10 VUs with identical `provider_message_id`.
- [x] Scenario C (Noisy Neighbor): 200 RPS for one tenant.
- [x] Replay verification checks DB row count equals 1 via internal endpoint.

## Output/Documentation Requirements

- [x] `docker-compose.yml` provided.
- [x] DB schema SQL provided.
- [x] Core logic files present (normalizer, idempotency flow, worker).
- [x] API route/controller files present.
- [x] k6 load test script provided.
- [x] Master reference document created.
- [x] Application manual created.
- [x] Developer path document created.
- [x] Implemented vs pending features document created.
- [x] End-to-end simulation runner with test data generation (`npm run simulate`) created.

## UI Implementation (Requested Follow-up)

- [x] Figma-generated console UI integrated in `MCC-IG Console UI Design/`.
- [x] Ingest Playground wired to live backend ingest endpoints.
- [x] Replay Verification wired to internal count endpoint.
- [x] DLQ screen wired to internal DLQ endpoint.
- [x] Root scripts added for frontend install/dev/build.
