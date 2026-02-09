# Operations Manual

## 1. Daily Operations
### Start stack
```bash
make up
```

### Tail API logs
```bash
make logs
```

### Stop stack
```bash
make down
```

## 2. Runbook: Common Incidents
### API not starting
- Check DB container health (`docker compose ps`).
- Inspect API logs for startup retries.
- Validate `DATABASE_URL`.

### High timeout rate
- Inspect `/conversation/{id}/logs` for repeated tool timeouts.
- Check circuit breaker status via logs (`status=circuit_open`).
- Use emergency handoff for impacted sessions.

### Conversation stuck in handoff
- Expected behavior: autonomous loop is intentionally blocked.
- If needed, close or recreate session after operator completion.

## 3. Manual Emergency Takeover
API:
```bash
curl -X POST http://localhost:8000/conversation/<id>/handoff \
  -H "Content-Type: application/json" \
  -d '{"reason":"manual override"}'
```

Web:
- Use `EMERGENCY TAKEOVER` button in the right panel.

## 4. Health Checks
- API: `GET /`
- DB: `pg_isready` healthcheck in compose.

## 5. Safe Change Procedure
1. Run tests.
2. Run simulation.
3. Deploy to staging.
4. Run smoke scenarios.
5. Deploy to production.
