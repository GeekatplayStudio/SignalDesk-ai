# Geekatplay AI Planner (Python)

This service provides low-latency assistant tool planning for `apps/api`.

## Why this exists
- Keeps model-routing logic in Python with async HTTP pooling to OpenAI.
- Lets Node API focus on ingestion, persistence, and orchestration.
- Adds an isolated scaling unit for AI planning workloads.

## Run locally
```bash
cd apps/ai-planner
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

## Required env
- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, default `gpt-4.1-mini`)
- `OPENAI_BASE_URL` (optional, default `https://api.openai.com/v1`)
- `OPENAI_TIMEOUT_MS` (optional, default `8000`)

## API
- `GET /health`
- `POST /v1/plan`
