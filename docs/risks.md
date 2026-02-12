# Geekatplay Studio Risk Register

## 1) OpenAI dependency outage or latency spikes
- Impact: degraded assistant quality or slower agent responses.
- Mitigation: planner fallback to deterministic tool routing; configurable timeout (`OPENAI_TIMEOUT_MS`).
- Next hardening step: add circuit-breaker and fallback rate metric.

## 2) Prompt/schema drift from model output
- Impact: malformed tool payloads or wrong tool selection.
- Mitigation: strict JSON response contract and parse guard with fallback.
- Next hardening step: add eval suite cases specifically for tool-selection precision.

## 3) Queue backlog during traffic spikes
- Impact: delayed ingestion processing and stale conversation state.
- Mitigation: worker retries + DLQ; queue decoupling keeps API responsive.
- Next hardening step: queue depth alerting and autoscaling policy.

## 4) Duplicate provider events
- Impact: duplicate conversation artifacts and noisy metrics.
- Mitigation: provider-message idempotency key and duplicate short-circuit.
- Next hardening step: provider-specific replay dashboards.

## 5) Missing auth/tenant isolation on some routes
- Impact: data exposure in multi-tenant deployments.
- Mitigation: currently controlled by deployment perimeter only.
- Next hardening step: enforce API auth and tenant scoping middleware before production.

## 6) Partial in-memory ops/eval state
- Impact: state loss on restart for incidents/eval runs in current implementation.
- Mitigation: acceptable for local/demo usage.
- Next hardening step: persist all ops/eval records in Postgres with pagination APIs.
