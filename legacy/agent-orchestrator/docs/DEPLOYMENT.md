# Deployment Guide

## 1. Environment Variables
Use `.env.example` as baseline:
- `DATABASE_URL`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `API_PORT`

## 2. Local Development Deployment
```bash
make up
```
Services:
- API: `http://localhost:8000`
- Postgres: `localhost:5432`

Stop:
```bash
make down
```

## 3. Production Baseline (Compose)
Use:
```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Characteristics:
- API and DB with restart policy
- DB healthcheck gating API start
- env-driven DB credentials and API port

## 4. Zero-Downtime / Hardening Recommendations
- Put API behind reverse proxy/load balancer.
- Externalize managed Postgres (do not run DB in same host/container set for production scale).
- Add structured logging + centralized log sink.
- Add metrics endpoint and alerting on:
  - p95 turn latency
  - tool timeout rate
  - handoff rate spikes

## 5. Rollback Strategy
- Tag docker images by release.
- Keep previous compose image tags.
- Roll back by redeploying previous image tag and running smoke checks.
