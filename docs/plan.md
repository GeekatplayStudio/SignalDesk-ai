# AgentOps Studio Delivery Plan
_Updated: 2026-02-09_

## Checklist (source of truth)
- [x] 1) Intake: collect 4 repo paths/URLs and summarize contents.
- [x] 2) Create monorepo skeleton + workspace tooling baseline.
- [x] 3) Import code from each repo into appropriate app/package folders.
- [ ] 4) Standardize dependencies (single versions) and remove duplicates.
- [ ] 5) Build shared types/schemas and migrate each module to use them.
- [ ] 6) Implement DB schema + migrations and refactor modules to persist to DB.
- [ ] 7) Implement queue + worker processing with idempotency, retries, DLQ.
- [ ] 8) Implement agent orchestration + tools + storage + fallbacks.
- [ ] 9) Implement eval runner + goldens + storage + reporting.
- [ ] 10) Implement telemetry/logging/correlation IDs + basic metrics aggregation.
- [ ] 11) Build dashboard pages and connect all APIs with React Query.
- [ ] 12) Add demo seed scripts + demo control panel.
- [ ] 13) Add comprehensive tests (unit + integration + e2e) and make them pass.
- [ ] 14) Add docs: architecture, SLOs, runbook, demo instructions.
- [ ] 15) Final hardening: error handling, env validation, security baseline, performance.
- [ ] 16) Final summary: repo tree, run commands, known limitations, next improvements.

## Progress notes
- Steps 1–3 done: monorepo scaffolded, legacy repos staged, ingestion gateway integrated into `apps/api` and `apps/worker`, agent/eval/ops endpoints added, guardrail goldens/prompts copied into shared package, dashboard hooked to new APIs.

## Next actions
1) Finish Step 3: migrate agent orchestrator, guardrails runner, and ops observability code into TypeScript API/worker and shared packages; begin UI consolidation into `apps/web`.
2) Steps 4–7: align dependencies, wire Prisma migrations, and unify queue/idempotency paths.
3) Start dashboard wiring (Step 11) once core APIs are stable.
