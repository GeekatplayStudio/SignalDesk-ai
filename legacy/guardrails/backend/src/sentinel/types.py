from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class GoldenTurn(BaseModel):
    user: str
    expected_tool: Optional[str] = Field(
        default=None, description="Expected tool name the agent should call"
    )
    expected_guardrail: Optional[str] = Field(
        default=None, description="Guardrail tag that should trigger"
    )
    expected_response: Optional[str] = Field(
        default=None, description="Expected natural-language response"
    )
    allow_refusal: bool = Field(
        default=False, description="If true, an agent refusal is acceptable"
    )


class TestCase(BaseModel):
    id: str
    category: str
    description: Optional[str] = None
    turns: List[GoldenTurn]

    @field_validator("turns")
    @classmethod
    def ensure_turns(cls, value: List[GoldenTurn]):
        if not value:
            raise ValueError("TestCase must contain at least one turn")
        return value


class EvalResult(BaseModel):
    run_id: str
    test_case_id: str
    status: Literal["PASS", "FAIL"]
    latency_ms: float
    tokens_used: int
    cost_usd: float
    details: Dict[str, Any] = Field(default_factory=dict)


class EvalRun(BaseModel):
    id: str
    agent_version: str
    timestamp: datetime
    total_cost: float
    pass_rate: float
    results: List[EvalResult]

    @property
    def total_tests(self) -> int:
        return len(self.results)

    @property
    def passed(self) -> int:
        return sum(1 for r in self.results if r.status == "PASS")

