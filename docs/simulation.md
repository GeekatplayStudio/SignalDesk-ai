# Geekatplay Studio Simulation Guide

## Goal
Simulation mode runs realistic chat scenarios through the real assistant path so operators can validate:
- planner/tool routing behavior
- operational handling of high-risk requests
- critical issue detection before production impact

## Enable simulation mode
1. Set `ENABLE_SIMULATION_MODE=true` in `.env`.
2. Restart API + worker.

If disabled, `POST /v1/simulations/run` returns `403 simulation_mode_disabled`.

## Available endpoints
- `GET /v1/simulations/config`
- `GET /v1/simulations/scenarios`
- `POST /v1/simulations/run`
- `GET /v1/simulations/runs`
- `GET /v1/simulations/runs/:id`

## Dashboard usage
- Open `/simulations`.
- Use the top-right toggle to enable/disable simulation mode at runtime.
- Choose a scenario from the catalog.
- Click `Run Scenario`.
- Watch:
  - active scenario state
  - per-turn tool/planner/latency
  - run-level critical issues

Critical simulation outcomes are mirrored into `/incidents`.

Note: UI toggle changes runtime mode in memory for the running API process. For persistent defaults across restarts, keep `ENABLE_SIMULATION_MODE` in `.env`.

## CLI usage
```bash
pnpm simulate -- --base-url http://localhost:3401 --scenario booking_happy_path
```

Optional flags:
- `--base-url` API host
- `--scenario` scenario id
- `--timeout-seconds` run timeout (default 90)

## Critical issue rules
Each simulation turn can raise critical issues for:
- expected tool mismatch
- failed tool call status
- missing assistant reply
- latency budget exceedance
- planner fallback to rules (when model planners are expected)
