# API Service

FastAPI orchestration backend for the MVA platform.

## Local Run
```bash
PYTHONPATH=apps uvicorn api.main:app --reload --port 8000
```

## Tests
```bash
PYTHONPATH=apps python3 -m pytest apps/api/tests
```

## Main Responsibilities
- conversation state management
- orchestration decision loop
- tool execution with timeout + circuit breaker
- safety handoff logic
- audit logging for tool calls
