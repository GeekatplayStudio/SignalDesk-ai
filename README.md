# Geekatplay Studio

Geekatplay Studio is a TypeScript monorepo for AI chat operations: multi-channel ingestion, assistant orchestration, eval/guardrail checks, and ops visibility in one stack.

## Repository layout
- `apps/api`: Express API (ingest, agent respond, evals, metrics, incidents)
- `apps/worker`: queue consumer for ingestion events
- `apps/web`: Next.js dashboard
- `packages/db`: Prisma schema/client
- `packages/shared`: shared schemas, prompts, and golden eval cases
- `infra`: Docker Compose + env template
- `docs`: architecture, explainer, runbook
- `legacy`: imported historical code for reference only

## OpenAI assistant integration
- `POST /v1/agent/respond` now routes through an OpenAI planner when `OPENAI_API_KEY` is configured.
- The planner returns structured JSON (`tool`, `tool_input`, `assistant_reply`, `reasoning`), then the API executes the selected tool and persists run metadata.
- If OpenAI is unavailable or returns malformed output, the service falls back to deterministic keyword routing so chat handling remains available.

## Quick start
```bash
pnpm install
cp infra/.env.example .env
pnpm db:push
pnpm seed
pnpm dev
```

## Docker (prod-like local run)
```bash
cd infra
docker compose up --build
```

## Quality checks (dry run)
```bash
pnpm lint
pnpm test
pnpm build
```

## Required environment variables
- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_API_BASE_URL`

## OpenAI environment variables (optional but recommended)
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `OPENAI_TIMEOUT_MS` (default: `8000`)

## Main docs
- `docs/app-explainer.md`
- `docs/architecture.md`
- `docs/runbook.md`
- `docs/risks.md`
