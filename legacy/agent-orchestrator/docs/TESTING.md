# Testing Strategy

## 1. Goals
- Catch regressions in orchestration and safety behavior.
- Validate API contract and tool execution logs.
- Ensure web app remains buildable and API-compatible.

## 2. Current Test Layers
### API automated tests (`pytest`)
Location: `apps/api/tests`

Covered behaviors:
- conversation creation and retrieval
- availability tool execution and logging
- low-confidence handoff
- manual handoff blocking future autonomous action
- multi-turn booking slot collection and booking execution

Run:
```bash
make install-api
make test-api
```

Container mode:
```bash
make test-api-docker
```

### Web validation
Build-based regression gate:
```bash
make install-web
make test-web
```

### Simulation scenarios
Synthetic end-to-end flow checks:
```bash
make simulate
```

## 3. Test Environment Notes
- API tests run against SQLite with isolated schema resets.
- `PYTHONPATH=apps` is required so `api.*` imports resolve.
- Circuit breaker state is reset between tests.

## 4. Recommended Next Additions
- Add per-tool timeout/circuit-breaker explicit unit tests.
- Add web component tests (Vitest + Testing Library).
- Add CI workflow with required checks on pull requests.
