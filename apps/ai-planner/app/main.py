from __future__ import annotations

import json
import os
from typing import Any, Literal

import httpx
from fastapi import FastAPI
from pydantic import BaseModel, Field
from app.planner_core import (
    ToolName,
    choose_tool,
    fallback_assistant_reply,
    normalize_assistant_reply,
    normalize_tool_name,
    truncate,
)

APP_NAME = os.getenv("APP_NAME", "Geekatplay Studio")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
OPENAI_TIMEOUT_MS = int(os.getenv("OPENAI_TIMEOUT_MS", "8000"))

class ConversationTurn(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str = Field(min_length=1, max_length=1200)


class PlanRequest(BaseModel):
    latest_user_message: str = Field(min_length=1, max_length=1200)
    conversation_history: list[ConversationTurn] = Field(default_factory=list, max_length=12)


class PlanResponse(BaseModel):
    tool: ToolName
    tool_input: dict[str, Any] = Field(default_factory=dict)
    assistant_reply: str = Field(min_length=1, max_length=1000)
    reasoning: str = Field(min_length=1, max_length=200)
    model: str | None = None


app = FastAPI(title=f"{APP_NAME} AI Planner", version="0.1.0")
http_client: httpx.AsyncClient | None = None


@app.on_event("startup")
async def startup() -> None:
    global http_client
    # Keep-alive + connection pooling lowers per-request latency under load.
    timeout = httpx.Timeout(OPENAI_TIMEOUT_MS / 1000.0, connect=2.0)
    limits = httpx.Limits(max_connections=200, max_keepalive_connections=50)
    http_client = httpx.AsyncClient(timeout=timeout, limits=limits)


@app.on_event("shutdown")
async def shutdown() -> None:
    if http_client is not None:
        await http_client.aclose()


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/plan", response_model=PlanResponse)
async def plan(request: PlanRequest) -> PlanResponse:
    if not OPENAI_API_KEY:
        return build_rule_plan(request.latest_user_message, "openai_key_missing")

    payload = await fetch_openai_plan(request)
    if payload is None:
        # Service-level fallback keeps routing available even during model/network issues.
        return build_rule_plan(request.latest_user_message, "python_planner_fallback")

    return normalize_plan_payload(payload, request.latest_user_message)


async def fetch_openai_plan(request: PlanRequest) -> dict[str, Any] | None:
    if http_client is None:
        return None

    try:
        response = await http_client.post(
            f"{OPENAI_BASE_URL}/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "X-Application-Name": APP_NAME,
            },
            json={
                "model": OPENAI_MODEL,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "messages": build_messages(request),
            },
        )
    except Exception:
        return None

    if response.status_code >= 400:
        return None

    try:
        body = response.json()
    except ValueError:
        return None

    choices = body.get("choices", [])
    if not choices:
        return None

    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str):
        return None

    parsed = parse_json_object(content)
    if parsed is None:
        return None

    return parsed


def build_messages(request: PlanRequest) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": ASSISTANT_SYSTEM_PROMPT}]
    for turn in request.conversation_history[-12:]:
        messages.append({"role": turn.role, "content": truncate(turn.content, 1200)})

    if not request.conversation_history or request.conversation_history[-1].content.strip() != request.latest_user_message.strip():
        messages.append({"role": "user", "content": truncate(request.latest_user_message, 1200)})

    return messages


def normalize_plan_payload(payload: dict[str, Any], original_message: str) -> PlanResponse:
    tool = normalize_tool_name(payload.get("tool"), original_message)
    tool_input = payload.get("tool_input")
    assistant_reply = payload.get("assistant_reply")
    reasoning = payload.get("reasoning")

    return PlanResponse(
        tool=tool,
        tool_input=tool_input if isinstance(tool_input, dict) else {},
        assistant_reply=normalize_assistant_reply(assistant_reply, tool),
        reasoning=reasoning if isinstance(reasoning, str) else "python_planner",
        model=OPENAI_MODEL,
    )


def build_rule_plan(message: str, reason: str) -> PlanResponse:
    tool = choose_tool(message)
    return PlanResponse(
        tool=tool,
        tool_input={"raw_message": truncate(message, 300)},
        assistant_reply=fallback_assistant_reply(tool),
        reasoning=reason,
        model=None,
    )

def parse_json_object(content: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return None

    if isinstance(parsed, dict):
        return parsed
    return None

ASSISTANT_SYSTEM_PROMPT = """
You are the AI routing assistant for Geekatplay Studio chat management.

Your job:
1) Pick exactly one tool.
2) Provide a short customer-facing assistant reply.
3) Return only valid JSON with this exact shape:
{
  "tool": "check_availability|book_appointment|create_ticket|handoff_to_human",
  "tool_input": { "key": "value" },
  "assistant_reply": "short response to user",
  "reasoning": "short internal rationale"
}

Routing guidelines:
- Use "book_appointment" for booking, scheduling, rescheduling.
- Use "check_availability" for availability/opening-hours questions.
- Use "create_ticket" for bugs/issues/complaints needing follow-up.
- Use "handoff_to_human" for legal/financial/medical risk, explicit human request, or unresolved escalation.
- Keep assistant_reply concise and professional.
- Never include markdown, code fences, or any text outside the JSON object.
""".strip()
