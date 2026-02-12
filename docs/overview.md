# Geekatplay Studio Overview

Geekatplay Studio is a chat-operations platform that combines:
- multichannel ingestion (`sms`, `chat`, `voice`)
- AI assistant orchestration with tool execution
- eval/guardrail replay
- reliability and incident visibility

## Core capabilities
- API ingest with idempotency + per-tenant rate limiting
- Redis queue + worker processing with retries and DLQ
- Hybrid planner chain (Python planner -> OpenAI direct -> rules fallback)
- Persistent storage for conversations/messages/runs/tool calls in Postgres (Prisma)
- Simulation server for scenario drills with critical-issue detection
- Dashboard for conversations, runs, evals, metrics, incidents, and simulation runs

## Architecture snapshot
- `apps/api`: runtime control plane and assistant orchestration
- `apps/worker`: queue consumer for ingestion workloads
- `apps/web`: operator dashboard
- `apps/ai-planner`: Python FastAPI service for low-latency planning
- `packages/db`: Prisma schema and generated client
- `packages/shared`: common schemas, prompts, and golden cases
- `infra`: Docker Compose for local stack

## Why this design
- Queueing isolates ingest spikes from processing and gives retry semantics.
- Idempotency prevents duplicate provider events from corrupting chat state.
- Splitting AI planning into Python while keeping orchestration in Node balances latency and operational simplicity.
- Monorepo centralizes contracts and reduces drift across API/worker/web.
