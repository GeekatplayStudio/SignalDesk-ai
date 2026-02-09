import asyncio
import json
import re
import time
from typing import Any, Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import Conversation, Message, ToolLog
from .tools import ToolRegistry

GLOBAL_SLA_SECONDS = 5.0
TOOL_TIMEOUT_SECONDS = 1.0
LLM_TIMEOUT_SECONDS = 3.0
LOW_CONFIDENCE_THRESHOLD = 0.45
MAX_TURNS = 5

CALENDAR_TIMEOUT_FALLBACK = (
    "I'm having trouble checking the calendar right now, but I can take your contact info."
)
TOOL_FAILURE_FALLBACK = "I'm having trouble completing that action right now. I can connect you to a human."
GLOBAL_SLA_FALLBACK = "We are experiencing delays. Please try again later."


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 2, cooldown_seconds: float = 10.0):
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.failure_count = 0
        self.open_until = 0.0

    def allow_request(self) -> bool:
        return time.monotonic() >= self.open_until

    def record_success(self) -> None:
        self.failure_count = 0
        self.open_until = 0.0

    def record_failure(self) -> None:
        self.failure_count += 1
        if self.failure_count >= self.failure_threshold:
            self.open_until = time.monotonic() + self.cooldown_seconds


TOOL_CIRCUITS: Dict[str, CircuitBreaker] = {}


def _get_circuit(tool_name: str) -> CircuitBreaker:
    if tool_name not in TOOL_CIRCUITS:
        TOOL_CIRCUITS[tool_name] = CircuitBreaker()
    return TOOL_CIRCUITS[tool_name]


def _model_dump(data: Any) -> Dict[str, Any]:
    if data is None:
        return {}
    if isinstance(data, dict):
        return data
    if hasattr(data, "model_dump"):
        return data.model_dump()
    if hasattr(data, "dict"):
        return data.dict()
    return dict(data)


def _latest_message_by_role(history: List[Dict[str, str]], role: str) -> str:
    for item in reversed(history):
        if item.get("role") == role:
            return item.get("content", "")
    return ""


def _next_order_index(db: Session, conversation_id: str) -> int:
    current_max = db.query(func.max(Message.order_index)).filter(
        Message.conversation_id == conversation_id
    ).scalar()
    return int(current_max or 0) + 1


def _append_message(db: Session, conversation_id: str, role: str, content: str) -> Message:
    message = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        order_index=_next_order_index(db, conversation_id),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def _extract_slots(message: str, existing_slots: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    slots = dict(existing_slots or {})
    lowered = message.lower()

    email_match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", message)
    if email_match:
        slots["email"] = email_match.group(0)

    date_match = re.search(r"\b\d{4}-\d{2}-\d{2}\b", message)
    if date_match:
        slots["date"] = date_match.group(0)
    elif "tomorrow" in lowered:
        slots["date"] = "tomorrow"
    elif "today" in lowered:
        slots["date"] = "today"

    time_match = re.search(r"\b\d{1,2}(:\d{2})?\s?(am|pm)?\b", lowered)
    if time_match and ":" in time_match.group(0):
        slots["time"] = time_match.group(0).replace(" ", "")

    if any(word in lowered for word in ["book", "appointment", "schedule"]):
        slots["intent"] = "booking"
    elif any(word in lowered for word in ["availability", "check", "slot"]):
        slots["intent"] = "availability"
    elif any(word in lowered for word in ["issue", "ticket", "problem"]):
        slots["intent"] = "ticket"
    elif any(word in lowered for word in ["human", "operator", "agent"]):
        slots["intent"] = "handoff"

    return slots


def _serialize_tool_log(log: ToolLog) -> Dict[str, Any]:
    return {
        "id": log.id,
        "tool_name": log.tool_name,
        "input_json": log.input_params or {},
        "output_json": log.output or {},
        "duration_ms": log.execution_time_ms,
        "status": log.status,
        "error_msg": log.error_msg,
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


def _respond_with_tool_output(tool_name: str, output: Dict[str, Any]) -> str:
    if tool_name == "check_availability":
        slots = ", ".join(output.get("slots", []))
        date = output.get("date", "that day")
        return f"I found availability for {date}: {slots}."
    if tool_name == "book_appointment":
        details = output.get("details", {})
        return (
            f"Booked successfully for {details.get('date')} at {details.get('time')}. "
            f"Confirmation ID: {output.get('confirmation_id')}."
        )
    if tool_name == "create_ticket":
        return f"I created ticket {output.get('ticket_id')} for your issue."
    if tool_name == "handoff_to_human":
        return "I am connecting you to an operator now."
    return "Done."


class AgentOrchestrator:
    hostile_keywords = ["idiot", "stupid", "hate you", "useless", "kill"]

    def _confidence_score(self, content: str) -> float:
        normalized = re.sub(r"\s+", " ", content.strip().lower())
        if not normalized:
            return 0.1
        if re.fullmatch(r"[^a-z0-9]+", normalized):
            return 0.1
        if len(normalized) < 4:
            return 0.25
        if any(word in normalized for word in ["book", "appointment", "availability", "ticket", "human"]):
            return 0.9
        return 0.55

    def decide_next_step(
        self, history: List[Dict[str, str]], slots: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not history:
            return {"action": "reply", "content": "Hello, how can I help?", "confidence": 1.0}

        slots = slots or {}
        last_user_message = _latest_message_by_role(history, "user")
        content = last_user_message.lower()
        confidence = self._confidence_score(content)

        if any(keyword in content for keyword in self.hostile_keywords):
            return {
                "action": "tool",
                "tool_name": "handoff_to_human",
                "params": {"reason": "Hostile input detected"},
                "confidence": 0.2,
            }

        if "human" in content or "operator" in content:
            return {
                "action": "tool",
                "tool_name": "handoff_to_human",
                "params": {"reason": "User requested human"},
                "confidence": 0.95,
            }

        if confidence < LOW_CONFIDENCE_THRESHOLD:
            return {
                "action": "tool",
                "tool_name": "handoff_to_human",
                "params": {"reason": f"Low confidence ({confidence:.2f})"},
                "confidence": confidence,
            }

        if "ticket" in content or "issue" in content or "problem" in content:
            return {
                "action": "tool",
                "tool_name": "create_ticket",
                "params": {"issue_summary": last_user_message[:300]},
                "confidence": confidence,
            }

        if "availability" in content or ("check" in content and "calendar" in content) or "slots" in content:
            return {
                "action": "tool",
                "tool_name": "check_availability",
                "params": {"date": slots.get("date", "tomorrow")},
                "confidence": confidence,
            }

        if "book" in content or "appointment" in content or slots.get("intent") == "booking":
            if not slots.get("date"):
                return {
                    "action": "reply",
                    "content": "What date should I book the appointment for?",
                    "confidence": confidence,
                }
            if not slots.get("time"):
                return {
                    "action": "reply",
                    "content": "What time works best for you?",
                    "confidence": confidence,
                }
            if not slots.get("email"):
                return {
                    "action": "reply",
                    "content": "Please share your email so I can finalize the booking.",
                    "confidence": confidence,
                }

            return {
                "action": "tool",
                "tool_name": "book_appointment",
                "params": {
                    "date": slots.get("date"),
                    "time": slots.get("time"),
                    "email": slots.get("email"),
                },
                "confidence": confidence,
            }

        return {
            "action": "reply",
            "content": "I can check availability, book an appointment, create a ticket, or connect you to a human.",
            "confidence": confidence,
        }


def _build_turn_response(
    response_text: str,
    conversation: Conversation,
    tool_calls: List[Dict[str, Any]],
    latency_ms: int,
    confidence: Optional[float],
) -> Dict[str, Any]:
    return {
        "response": response_text,
        "tool_calls": tool_calls,
        "conversation_status": conversation.status,
        "latency_ms": latency_ms,
        "confidence": confidence,
        "slots": conversation.slots or {},
    }


async def run_agent_loop(conversation_id: str, new_user_message: str, db: Session) -> Dict[str, Any]:
    total_start = time.monotonic()
    tool_calls_this_turn: List[Dict[str, Any]] = []
    last_confidence: Optional[float] = None

    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise ValueError("Conversation not found")

    user_message = _append_message(db, conversation_id, "user", new_user_message)

    updated_slots = _extract_slots(new_user_message, _model_dump(conversation.slots))
    conversation.slots = updated_slots
    db.commit()
    db.refresh(conversation)

    orchestrator = AgentOrchestrator()

    for _ in range(MAX_TURNS):
        elapsed = time.monotonic() - total_start
        if elapsed > GLOBAL_SLA_SECONDS:
            assistant = _append_message(db, conversation_id, "assistant", GLOBAL_SLA_FALLBACK)
            return _build_turn_response(
                assistant.content,
                conversation,
                tool_calls_this_turn,
                int((time.monotonic() - total_start) * 1000),
                last_confidence,
            )

        history_rows = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.order_index, Message.id)
            .all()
        )
        history = [{"role": row.role, "content": row.content} for row in history_rows]

        llm_timeout = min(LLM_TIMEOUT_SECONDS, max(0.05, GLOBAL_SLA_SECONDS - elapsed))
        try:
            step = await asyncio.wait_for(
                asyncio.to_thread(orchestrator.decide_next_step, history, conversation.slots or {}),
                timeout=llm_timeout,
            )
        except asyncio.TimeoutError:
            assistant = _append_message(db, conversation_id, "assistant", GLOBAL_SLA_FALLBACK)
            return _build_turn_response(
                assistant.content,
                conversation,
                tool_calls_this_turn,
                int((time.monotonic() - total_start) * 1000),
                last_confidence,
            )

        last_confidence = step.get("confidence")

        if step["action"] == "reply":
            assistant = _append_message(db, conversation_id, "assistant", step["content"])
            return _build_turn_response(
                assistant.content,
                conversation,
                tool_calls_this_turn,
                int((time.monotonic() - total_start) * 1000),
                last_confidence,
            )

        if step["action"] != "tool":
            assistant = _append_message(db, conversation_id, "assistant", "I could not determine the next step.")
            return _build_turn_response(
                assistant.content,
                conversation,
                tool_calls_this_turn,
                int((time.monotonic() - total_start) * 1000),
                last_confidence,
            )

        tool_name = step["tool_name"]
        raw_params = step.get("params", {})
        validated_params: Dict[str, Any] = raw_params
        circuit = _get_circuit(tool_name)
        tool_start = time.monotonic()
        status = "success"
        error_msg = None
        output: Dict[str, Any] = {}

        if not circuit.allow_request():
            status = "circuit_open"
            error_msg = "Circuit breaker is open"
            output = {"error": error_msg}
        else:
            try:
                validated_params = ToolRegistry.validate_input(tool_name, raw_params)
                remaining = max(0.05, GLOBAL_SLA_SECONDS - (time.monotonic() - total_start))
                output = await asyncio.wait_for(
                    ToolRegistry.execute_tool(tool_name, **validated_params),
                    timeout=min(TOOL_TIMEOUT_SECONDS, remaining),
                )
                circuit.record_success()
            except asyncio.TimeoutError:
                status = "timeout"
                error_msg = "Tool execution timed out"
                output = {"error": error_msg}
                circuit.record_failure()
            except Exception as exc:
                status = "error"
                error_msg = str(exc)
                output = {"error": error_msg}
                circuit.record_failure()

        duration_ms = int((time.monotonic() - tool_start) * 1000)

        log = ToolLog(
            conversation_id=conversation_id,
            message_id=user_message.id,
            tool_name=tool_name,
            input_params=validated_params,
            output=output,
            execution_time_ms=duration_ms,
            status=status,
            error_msg=error_msg,
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        tool_calls_this_turn.append(_serialize_tool_log(log))

        if status in {"timeout", "circuit_open"}:
            fallback = CALENDAR_TIMEOUT_FALLBACK if tool_name == "check_availability" else TOOL_FAILURE_FALLBACK
            assistant = _append_message(db, conversation_id, "assistant", fallback)
            return _build_turn_response(
                assistant.content,
                conversation,
                tool_calls_this_turn,
                int((time.monotonic() - total_start) * 1000),
                last_confidence,
            )

        if status == "error":
            assistant = _append_message(db, conversation_id, "assistant", TOOL_FAILURE_FALLBACK)
            return _build_turn_response(
                assistant.content,
                conversation,
                tool_calls_this_turn,
                int((time.monotonic() - total_start) * 1000),
                last_confidence,
            )

        tool_message_content = json.dumps({"tool_name": tool_name, "result": output})
        _append_message(db, conversation_id, "tool", tool_message_content)

        if tool_name == "handoff_to_human":
            conversation.status = "handoff"
            db.commit()
            db.refresh(conversation)
            assistant = _append_message(db, conversation_id, "assistant", "I am connecting you to an operator now.")
            return _build_turn_response(
                assistant.content,
                conversation,
                tool_calls_this_turn,
                int((time.monotonic() - total_start) * 1000),
                last_confidence,
            )

        if tool_name == "check_availability":
            conversation.slots = {**_model_dump(conversation.slots), "available_slots": output.get("slots", [])}
            db.commit()
            db.refresh(conversation)
        if tool_name == "book_appointment":
            conversation.slots = {
                **_model_dump(conversation.slots),
                "confirmation_id": output.get("confirmation_id"),
            }
            db.commit()
            db.refresh(conversation)

        assistant_text = _respond_with_tool_output(tool_name, output)
        assistant = _append_message(db, conversation_id, "assistant", assistant_text)
        return _build_turn_response(
            assistant.content,
            conversation,
            tool_calls_this_turn,
            int((time.monotonic() - total_start) * 1000),
            last_confidence,
        )

    assistant = _append_message(db, conversation_id, "assistant", GLOBAL_SLA_FALLBACK)
    return _build_turn_response(
        assistant.content,
        conversation,
        tool_calls_this_turn,
        int((time.monotonic() - total_start) * 1000),
        last_confidence,
    )
