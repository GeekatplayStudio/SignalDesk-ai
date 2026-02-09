# Sentinel Architecture & Workflows

## Components
- **Guardrails (sentinel/guardrails.py)**
  - `sanitize_input(text)` redacts emails and phone numbers.
  - `check_policy(text)` blocks forbidden phrases (e.g., "ignore instructions", "system prompt").
  - `scan_output(text)` flags forbidden words and suspicious URLs.
  - `filter_input` / `filter_output` compose the above and return triggers.

- **Prompt Registry (sentinel/prompt_registry.py)**
  - Loads YAML prompts by version (`prompts/v1.yaml`, `prompts/v2.yaml`).
  - Validates required keys: `system_message`, `temperature`, `model_name`.

- **Eval Engine (sentinel/eval_engine.py)**
  - Loads golden YAMLs from `data/goldens/` into `TestCase` models.
  - Executes turns through `MockAgent` + `SafetyFilter` and scores tool/guardrail/response expectations.
  - Applies budget guardrail for >1000 tokens per test case.
  - Emits `EvalRun` with per-test `EvalResult`, prints rich table, writes JSON report.

- **Mock Agent (sentinel/mock_agent.py)**
  - Heuristic responses for booking intents, PII acknowledgements, and adversarial prompts.
  - Deterministic latency + token estimates; cost via `estimate_cost`.

## Data Model (pydantic)
- `TestCase` → `turns: List[GoldenTurn]`
- `EvalResult` → latency_ms, tokens_used, cost_usd, status, details.
- `EvalRun` → aggregate pass rate, total cost, timestamp, agent_version.

## CLI
- `sentinel run-evals --goldens data/goldens --prompt v1 --prompts_path prompts --report report.json`
- `sentinel version`

## Golden YAML Examples
See `data/goldens/`: `booking_happy.yaml`, `pii_injection.yaml`, `adversarial_prompt.yaml`.

## Extension Points
- Replace `MockAgent` with real API client; keep SafetyFilter unchanged.
- Add embeddings or LLM judge for semantic scoring inside `_score_turn`.
- Expand `FORBIDDEN_KEYWORDS` and regex patterns per policy needs.
- Swap cost map in `costs.py` for live pricing or per-model tiers.

## CI Recommendations
- Run `pytest` for fast unit tests.
- Run `sentinel run-evals ...` in CI against your golden suites; fail build if pass rate drops or cost exceeds budget.
