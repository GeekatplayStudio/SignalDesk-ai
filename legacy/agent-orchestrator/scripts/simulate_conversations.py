#!/usr/bin/env python3
"""
Run deterministic load-like conversation simulations against the MVA API.
"""

from __future__ import annotations

import argparse
import json
import statistics
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class Scenario:
    name: str
    turns: List[str]


SCENARIOS = [
    Scenario(name="availability", turns=["Check availability for tomorrow"]),
    Scenario(
        name="booking",
        turns=[
            "I need to book an appointment",
            "2026-02-12",
            "10:00",
            "user@example.com",
        ],
    ),
    Scenario(name="ticket", turns=["I have an issue with my billing account."]),
    Scenario(name="handoff_request", turns=["human"]),
]


def api_request(base_url: str, method: str, path: str, payload: Dict | None = None) -> Dict:
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode()
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{path}",
        data=data,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        raise RuntimeError(f"{method} {path} failed with {exc.code}: {body}") from exc


def run_simulation(base_url: str, repeat: int) -> Dict:
    all_latencies: List[int] = []
    tool_status_counts: Dict[str, int] = {}
    handoff_count = 0
    turns_executed = 0
    results = []

    for _ in range(repeat):
        for scenario in SCENARIOS:
            conversation = api_request(base_url, "POST", "/conversation", {"user_id": f"sim-{scenario.name}"})
            conversation_id = conversation["id"]

            scenario_result = {
                "scenario": scenario.name,
                "conversation_id": conversation_id,
                "turns": [],
            }

            for message in scenario.turns:
                turns_executed += 1
                turn = api_request(
                    base_url,
                    "POST",
                    f"/conversation/{conversation_id}/message",
                    {"content": message, "role": "user"},
                )
                latency = int(turn.get("latency_ms", 0))
                all_latencies.append(latency)
                if turn.get("conversation_status") == "handoff":
                    handoff_count += 1

                for tool_call in turn.get("tool_calls", []):
                    status = tool_call.get("status", "unknown")
                    tool_status_counts[status] = tool_status_counts.get(status, 0) + 1

                scenario_result["turns"].append(
                    {
                        "message": message,
                        "response": turn.get("response"),
                        "latency_ms": latency,
                        "status": turn.get("conversation_status"),
                        "tool_calls": turn.get("tool_calls", []),
                    }
                )
            results.append(scenario_result)

    summary = {
        "base_url": base_url,
        "runs_per_scenario": repeat,
        "total_scenarios": len(SCENARIOS) * repeat,
        "total_turns": turns_executed,
        "latency_ms": {
            "min": min(all_latencies) if all_latencies else 0,
            "avg": round(statistics.mean(all_latencies), 2) if all_latencies else 0,
            "p95": sorted(all_latencies)[int(0.95 * (len(all_latencies) - 1))] if all_latencies else 0,
            "max": max(all_latencies) if all_latencies else 0,
        },
        "handoff_count": handoff_count,
        "tool_status_counts": tool_status_counts,
        "results": results,
    }
    return summary


def main() -> int:
    parser = argparse.ArgumentParser(description="Run MVA simulation scenarios.")
    parser.add_argument("--base-url", default="http://localhost:8000", help="MVA API base URL")
    parser.add_argument("--repeat", type=int, default=2, help="Number of runs per scenario")
    parser.add_argument("--summary-only", action="store_true", help="Print only aggregate summary")
    args = parser.parse_args()

    try:
        summary = run_simulation(args.base_url, args.repeat)
    except Exception as exc:
        print(f"Simulation failed: {exc}", file=sys.stderr)
        return 1

    if args.summary_only:
        output = dict(summary)
        output.pop("results", None)
        print(json.dumps(output, indent=2))
    else:
        print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
