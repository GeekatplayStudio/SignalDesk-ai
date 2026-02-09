from __future__ import annotations

import json
import time
from datetime import datetime
from pathlib import Path
from typing import List, Tuple

import yaml
from rich.table import Table
from rich.console import Console

from .guardrails import SafetyFilter
from .mock_agent import MockAgent, AgentResponse
from .prompt_registry import load_prompt
from .types import EvalResult, EvalRun, TestCase, GoldenTurn


console = Console()


def _load_test_case(path: Path) -> TestCase:
    data = yaml.safe_load(path.read_text())
    # Accept both list-of-turns (legacy) and structured format
    if isinstance(data, list):
        turns = [GoldenTurn(**item) for item in data]
        tc = TestCase(id=path.stem, category="uncategorized", turns=turns)
    elif isinstance(data, dict):
        turns = [GoldenTurn(**item) for item in data.get("turns", [])]
        tc = TestCase(
            id=data.get("id", path.stem),
            category=data.get("category", "uncategorized"),
            description=data.get("description"),
            turns=turns,
        )
    else:
        raise ValueError(f"Unsupported test case format in {path}")
    return tc


def load_test_cases(folder: str | Path) -> List[TestCase]:
    folder_path = Path(folder)
    files = sorted(folder_path.glob("*.yaml"))
    if not files:
        raise FileNotFoundError(f"No golden YAML files found in {folder_path}")
    return [_load_test_case(p) for p in files]


def _score_turn(turn: GoldenTurn, response: AgentResponse) -> Tuple[bool, str]:
    reasons: list[str] = []
    passed = True

    if turn.expected_tool:
        if response.tool_called != turn.expected_tool:
            passed = False
            reasons.append(
                f"Expected tool {turn.expected_tool}, got {response.tool_called or 'none'}"
            )

    if turn.expected_guardrail:
        if turn.expected_guardrail not in response.guardrail_triggers:
            passed = False
            reasons.append(
                f"Expected guardrail {turn.expected_guardrail} not triggered; got {response.guardrail_triggers}"
            )

    if turn.expected_response:
        if turn.expected_response.lower() not in response.text.lower():
            passed = False
            reasons.append("Response did not match expected snippet")

    if not turn.allow_refusal and response.blocked:
        passed = False
        reasons.append("Input was blocked unexpectedly")

    return passed, "; ".join(reasons)


def _build_result(
    run_id: str, test_case: TestCase, prompt: dict, safety: SafetyFilter
) -> EvalResult:
    agent = MockAgent(prompt=prompt, safety_filter=safety)
    all_passed = True
    reasons: list[str] = []
    total_tokens = 0
    total_cost = 0.0
    start = time.perf_counter()

    for turn in test_case.turns:
        response = agent.respond(turn.user)
        turn_passed, reason = _score_turn(turn, response)
        if not turn_passed:
            all_passed = False
            reasons.append(reason)
        total_tokens += response.tokens_used
        total_cost += response.cost_usd

    latency_ms = (time.perf_counter() - start) * 1000
    status = "PASS" if all_passed else "FAIL"
    details = {
        "reasons": reasons,
        "total_tokens": total_tokens,
    }

    if total_tokens > 1000:
        details["cost_violation"] = "Response exceeded 1000 token budget"
        status = "FAIL"

    return EvalResult(
        run_id=run_id,
        test_case_id=test_case.id,
        status=status,
        latency_ms=round(latency_ms, 2),
        tokens_used=total_tokens,
        cost_usd=round(total_cost, 6),
        details=details,
    )


def run_eval(
    goldens_folder: str | Path,
    prompt_version: str = "v1",
    agent_version: str = "dev",
    prompts_path: str | Path | None = None,
) -> EvalRun:
    prompt = load_prompt(prompt_version, base_path=prompts_path)
    safety = SafetyFilter()
    run_id = f"run_{int(time.time())}"

    test_cases = load_test_cases(goldens_folder)
    results = [_build_result(run_id, tc, prompt, safety) for tc in test_cases]

    passed = sum(1 for r in results if r.status == "PASS")
    pass_rate = (passed / len(results)) * 100
    total_cost = round(sum(r.cost_usd for r in results), 6)

    return EvalRun(
        id=run_id,
        agent_version=agent_version,
        timestamp=datetime.utcnow(),
        total_cost=total_cost,
        pass_rate=pass_rate,
        results=results,
    )


def write_report(eval_run: EvalRun, output_path: str | Path) -> Path:
    output_path = Path(output_path)
    payload = eval_run.model_dump(mode="json")
    output_path.write_text(json.dumps(payload, indent=2))
    return output_path


def print_summary(eval_run: EvalRun) -> None:
    table = Table(title="Sentinel Eval Summary")
    table.add_column("Test Case")
    table.add_column("Status")
    table.add_column("Latency (ms)")
    table.add_column("Tokens")
    table.add_column("Cost ($)")
    for r in eval_run.results:
        table.add_row(
            r.test_case_id,
            r.status,
            f"{r.latency_ms:.1f}",
            str(r.tokens_used),
            f"{r.cost_usd:.6f}",
        )
    console.print(table)
    console.print(
        f"Passed {eval_run.passed}/{eval_run.total_tests} tests | Pass rate: {eval_run.pass_rate:.1f}% | Total cost: ${eval_run.total_cost:.6f}"
    )

