# Geekatplay Studio Overview

Geekatplay Studio is a chat-operations platform that combines:
- multichannel ingestion (`sms`, `chat`, `voice`)
- AI assistant orchestration with tool execution
- eval/guardrail replay
- reliability and incident visibility

## Core capabilities
- API ingest with idempotency + per-tenant rate limiting
- Redis queue + worker processing with retries and DLQ
- OpenAI-assisted tool planning with deterministic fallback
- Persistent storage for conversations/messages/runs/tool calls in Postgres (Prisma)
- Dashboard for conversations, runs, evals, metrics, and incident simulations

## Architecture snapshot
- `apps/api`: runtime control plane and assistant orchestration
- `apps/worker`: queue consumer for ingestion workloads
- `apps/web`: operator dashboard
- `packages/db`: Prisma schema and generated client
- `packages/shared`: common schemas, prompts, and golden cases
- `infra`: Docker Compose for local stack

## Why this design
- Queueing isolates ingest spikes from processing and gives retry semantics.
- Idempotency prevents duplicate provider events from corrupting chat state.
- OpenAI planner + fallback keeps assistant quality high while preserving uptime.
- Monorepo centralizes contracts and reduces drift across API/worker/web.
