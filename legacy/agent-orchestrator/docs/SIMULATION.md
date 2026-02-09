# Simulation Guide

## Purpose
Simulation runs scripted conversation scenarios to validate orchestration behavior, latency, and safety triggers outside manual UI testing.

## Script
Path: `scripts/simulate_conversations.py`

Default scenarios:
- availability check
- booking multi-turn flow
- ticket creation
- explicit human handoff

## Usage
Summary mode:
```bash
make simulate
```

Container-safe mode (recommended when host networking is restricted):
```bash
make simulate-docker
```

Custom:
```bash
python3 scripts/simulate_conversations.py --base-url http://localhost:8000 --repeat 5 --summary-only
```

Full output:
```bash
python3 scripts/simulate_conversations.py --base-url http://localhost:8000 --repeat 2
```

## Output Metrics
- turn latency min/avg/p95/max
- handoff count
- tool status counts (`success`, `timeout`, `error`, `circuit_open`)
- per-scenario turn traces

## How To Use In Release Validation
1. Deploy candidate build.
2. Run simulation script.
3. Confirm:
   - no unexpected `error`/`timeout` spikes
   - p95 latency within target
   - handoff rate is plausible for scenarios
