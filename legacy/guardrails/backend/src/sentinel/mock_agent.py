from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

from .costs import estimate_cost
from .guardrails import SafetyFilter


@dataclass
class AgentResponse:
    text: str
    tool_called: Optional[str]
    guardrail_triggers: List[str]
    latency_ms: float
    tokens_used: int
    cost_usd: float
    blocked: bool = False


class MockAgent:
    """A lightweight heuristic agent used for offline evals."""

    def __init__(self, prompt: dict, safety_filter: SafetyFilter | None = None):
        self.prompt = prompt
        self.safety = safety_filter or SafetyFilter()

    def respond(self, user_text: str) -> AgentResponse:
        input_result = self.safety.filter_input(user_text)
        triggers = list(input_result.triggered)

        # If policy block triggers, stop early
        blocked = any(t.startswith("POLICY_") for t in triggers)
        tool_called: Optional[str] = None
        response_text = ""

        if blocked:
            response_text = "Input blocked by policy"
        else:
            lowered = input_result.sanitized_text.lower()
            if "book" in lowered and "flight" in lowered:
                tool_called = "search_flights"
                response_text = "Calling search_flights with provided itinerary details."
            elif "email" in lowered or "@" in lowered:
                response_text = "I redacted your email for safety."
            elif "hotwire" in lowered:
                response_text = "I cannot assist with illegal activities."
            else:
                response_text = "Sure, I'll process that request responsibly."

        output_hits = self.safety.filter_output(response_text).triggered
        triggers += output_hits

        token_estimate = max(1, int(len(user_text) / 4) + int(len(response_text) / 4))
        cost = estimate_cost(self.prompt.get("model_name", "gpt-4o-mini"), token_estimate)
        latency_ms = 120 + min(400, token_estimate)  # simple deterministic latency

        return AgentResponse(
            text=response_text,
            tool_called=tool_called,
            guardrail_triggers=triggers,
            latency_ms=float(latency_ms),
            tokens_used=token_estimate,
            cost_usd=cost,
            blocked=blocked,
        )

