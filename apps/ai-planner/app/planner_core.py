from __future__ import annotations

from typing import Any, Literal


ToolName = Literal["check_availability", "book_appointment", "create_ticket", "handoff_to_human"]


def choose_tool(message: str) -> ToolName:
    text = message.lower()
    if "schedule" in text or "book" in text or "reschedule" in text:
        return "book_appointment"
    if "availability" in text or "open" in text or "hours" in text:
        return "check_availability"
    if "ticket" in text or "issue" in text or "bug" in text or "problem" in text:
        return "create_ticket"
    if "human" in text or "agent" in text or "escalate" in text:
        return "handoff_to_human"
    return "check_availability"


def normalize_tool_name(value: Any, original_message: str) -> ToolName:
    if value == "check_availability":
        return "check_availability"
    if value == "book_appointment":
        return "book_appointment"
    if value == "create_ticket":
        return "create_ticket"
    if value == "handoff_to_human":
        return "handoff_to_human"
    return choose_tool(original_message)


def normalize_assistant_reply(value: Any, tool: ToolName) -> str:
    if isinstance(value, str) and value.strip():
        return truncate(value.strip(), 1000)
    return fallback_assistant_reply(tool)


def fallback_assistant_reply(tool: ToolName) -> str:
    if tool == "book_appointment":
        return "I can help schedule this for you. I am checking booking details now."
    if tool == "create_ticket":
        return "I can capture this as a support case. I am creating a ticket now."
    if tool == "handoff_to_human":
        return "I am escalating this to a human teammate so you can get direct help."
    return "I can help with that. I am checking current availability now."


def truncate(value: str, max_length: int) -> str:
    if len(value) <= max_length:
        return value
    return f"{value[: max_length - 1]}..."
