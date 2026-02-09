# MCC-IG Console UI

Frontend operations console for the MCC-IG backend.

## Run

1. Install dependencies:

```bash
npm install
```

2. Configure API base URL (optional):

```bash
cp .env.example .env
```

3. Start dev server:

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

## Wired Backend Features

- Ingest Playground -> `POST /v1/ingest/sms|chat|voice`
- Replay Verification -> `GET /v1/internal/events/count`
- Dashboard health -> `GET /health`
- DLQ manager -> `GET /v1/internal/dlq`

Set `VITE_API_BASE_URL` if backend is not on the same origin.
