# Roadmap

## Current State
Implemented:
- Stateful orchestration service with tool registry and guardrails
- Developer Console with live trace/state integration
- API test suite and simulation runner
- Dockerized local/prod baseline and structured docs

## Next Milestones
### M1: Engineering Hardening
- Add CI workflow (test + build + simulation smoke)
- Add linting/formatting gates (ruff/black for API, eslint/prettier for web)
- Add migration tooling (Alembic) instead of `create_all`

### M2: Observability and Reliability
- Add metrics endpoint (Prometheus/OpenTelemetry)
- Add distributed request IDs across message/tool logs
- Add alerting rules for SLA and tool failures

### M3: Product Capabilities
- Pluggable LLM provider abstraction with deterministic replay mode
- Richer slot extraction and validation
- Multi-user auth and role-based console actions

### M4: Production Readiness
- Managed Postgres and secrets manager integration
- Canary/blue-green deployment strategy
- Backup/restore and disaster recovery drills

## Open Backlog
- Frontend automated component tests.
- Dedicated load test profiles.
- Security review (input hardening, rate limiting, authN/Z).
