# Sentinel – AI Evaluation & Guardrails Platform

Sentinel is a dual-purpose toolkit:
- **Offline Eval Runner**: replay "golden" conversations against an agent to catch regressions before shipping.
- **Online Guardrails**: pluggable input/output filters for PII, policy violations, and unsafe responses.

This repo contains:
- `backend/` — Python 3.10+ package (`sentinel`) with CLI, guardrails, prompt registry, eval runner, and mock agent.
- `frontend/` — Next.js 14 + React + Tailwind + shadcn/ui dashboard (from provided Figma code) showing quality/compliance metrics.
- `data/goldens/` — Sample golden test cases.
- `prompts/` — Versioned prompt configs (`v1`, `v2`).
- `docs/` — Supplemental architecture & usage notes.

## Quickstart (Backend)
1) `cd backend`
2) (optional) `python -m venv .venv && source .venv/bin/activate`
3) `pip install -e .`
4) Run evals on sample goldens:
   ```bash
   sentinel run-evals --goldens ../data/goldens --prompts_path ../prompts --prompt v1 --report ../report.json
   ```
5) View console summary and JSON report at `report.json`.

## Tests
From `backend/` run:
```bash
pytest
```

## Frontend Dashboard
1) `cd frontend`
2) Install deps: `npm install`
3) Start dev server: `npm run dev`

## Folder Structure
```
backend/
  pyproject.toml
  src/sentinel/
    cli.py           # Typer CLI entrypoint
    eval_engine.py   # Eval runner + reporting
    guardrails.py    # SafetyFilter (PII redaction, policy & output scans)
    mock_agent.py    # Heuristic agent for offline evals
    prompt_registry.py
    costs.py
    types.py
  tests/             # pytest unit tests
frontend/            # React dashboard (Figma-derived)
data/goldens/        # Golden YAML examples (happy, PII, adversarial)
prompts/             # v1 and v2 prompt configs
```

## Key Features
- PII redaction (email/phone) and policy keyword blocking on inputs.
- Forbidden word + URL sanity checks on outputs.
- Budget guardrail: flag >1000 tokens per test.
- Cost estimation (simple per-1k pricing map).
- Prompt registry loads versioned YAML prompts as code.
- Rich console summary + JSON report for CI/CD.

## Demo Data
Golden cases live in `data/goldens/` and are used by tests and the runner. Frontend uses built-in mock diff data to visualize regressions and improvements.

## License / Attribution
Frontend UI is based on the provided Figma export (see `frontend/ATTRIBUTIONS.md`).
