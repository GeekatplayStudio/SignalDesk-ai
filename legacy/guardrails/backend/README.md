# Sentinel Backend

Python package containing guardrails, prompt registry, eval runner, and CLI.

## Install
```
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Usage
Run evals against the bundled golden suites:
```
sentinel run-evals --goldens ../data/goldens --prompts_path ../prompts --prompt v1 --report ../report.json
```

## Development
- Run tests: `pytest`
- Add prompts: drop `vX.yaml` files in `prompts/` with keys `system_message`, `temperature`, `model_name`.
- Add goldens: place YAML files in `data/goldens/` (see examples). Each turn supports `expected_tool`, `expected_guardrail`, `expected_response`, `allow_refusal`.

## Notes
- SafetyFilter handles email/phone PII, policy keyword blocks, forbidden output words, and naive URL 404 detection.
- Cost guardrail flags any test case exceeding 1000 token approximation.
