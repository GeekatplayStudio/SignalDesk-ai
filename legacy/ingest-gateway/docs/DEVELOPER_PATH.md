# MCC-IG Developer Path

## 1) Codebase Map

- `src/api`
  - `controllers/ingestController.ts`: validation + response mapping
  - `routes.ts`: endpoint registration
  - `app.ts`: express app + health + internal test route
- `src/core`
  - `types.ts`: domain types
  - `schemas.ts`: Zod schemas
  - `normalize.ts`: channel-specific normalization
  - `ingestionService.ts`: idempotency + rate limit + queue orchestration
  - `ports.ts`: abstractions for infra
- `src/infra`
  - redis adapters (`idempotency`, `queue`, `rateLimiter`)
  - postgres adapter (`postgresConversationEventRepository.ts`)
  - `env.ts`
- `src/worker`
  - `worker.ts`: queue consumer with retries + DLQ
  - `index.ts`: process bootstrap
- `tests`
  - API, normalization, worker, repository tests

## 2) Request Lifecycle for New Contributors

1. Endpoint route receives request.
2. Controller validates body (Zod).
3. Normalizer creates a `ConversationEvent`.
4. `IngestionService` applies idempotency and tenant rate limits.
5. Accepted event is queued to Redis.
6. Worker reads event and inserts row into Postgres.
7. Failed inserts are retried and eventually moved to DLQ.

## 3) How to Add a New Channel

1. Add Zod schema in `src/core/schemas.ts`.
2. Add normalizer in `src/core/normalize.ts`.
3. Register endpoint in `src/api/routes.ts` using `createIngestHandler`.
4. Add tests in `tests/normalize.test.ts` and `tests/api.ingest.test.ts`.
5. Update docs (`MASTER_REFERENCE`, `APPLICATION_MANUAL`).

## 4) Design Notes

- Idempotency uses Redis `SET NX EX` to avoid race duplicates.
- Token bucket uses Redis Lua script for atomic refill+consume.
- DB still has a unique fail-safe on `provider_message_id`.
- Worker retries are exponential to tolerate transient DB failures.

## 5) Local Development

```bash
npm install
npm run dev
npm run dev:worker
npm test
npm run simulate
```

If using Docker only:

```bash
docker compose up --build
```

## 6) Suggested Next Engineering Steps

- Add structured logging + trace correlation IDs.
- Add Prometheus metrics (queue lag, retry count, DLQ count).
- Add integration tests with live Redis/Postgres in CI.
- Add authentication and tenant-level authorization at ingress.
