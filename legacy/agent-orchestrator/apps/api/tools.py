import asyncio
import re
from typing import Any, Dict, Type

from pydantic import BaseModel, ValidationError


class CheckAvailabilityInput(BaseModel):
    date: str


class BookAppointmentInput(BaseModel):
    date: str
    time: str
    email: str


class CreateTicketInput(BaseModel):
    issue_summary: str


class HandoffInput(BaseModel):
    reason: str


class ToolRegistry:
    INPUT_MODELS: Dict[str, Type[BaseModel]] = {
        "check_availability": CheckAvailabilityInput,
        "book_appointment": BookAppointmentInput,
        "create_ticket": CreateTicketInput,
        "handoff_to_human": HandoffInput,
    }

    @staticmethod
    async def check_availability(date: str) -> Dict[str, Any]:
        await asyncio.sleep(0.2)
        return {"date": date, "slots": ["09:00", "10:00", "14:00", "15:30"]}

    @staticmethod
    async def book_appointment(date: str, time: str, email: str) -> Dict[str, Any]:
        await asyncio.sleep(0.5)
        return {
            "status": "confirmed",
            "confirmation_id": "APT-12345",
            "details": {"date": date, "time": time, "email": email},
        }

    @staticmethod
    async def create_ticket(issue_summary: str) -> Dict[str, Any]:
        await asyncio.sleep(0.3)
        return {"ticket_id": "TKT-998877", "status": "open", "issue_summary": issue_summary}

    @staticmethod
    async def handoff_to_human(reason: str) -> Dict[str, Any]:
        return {"status": "handoff_initiated", "reason": reason}

    @staticmethod
    def _to_dict(model: BaseModel) -> Dict[str, Any]:
        if hasattr(model, "model_dump"):
            return model.model_dump()
        return model.dict()

    @staticmethod
    def validate_input(tool_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        model_cls = ToolRegistry.INPUT_MODELS.get(tool_name)
        if not model_cls:
            raise ValueError(f"Unknown tool: {tool_name}")

        try:
            payload = ToolRegistry._to_dict(model_cls(**params))
        except ValidationError as exc:
            raise ValueError(f"Invalid input for {tool_name}: {exc}") from exc

        if "email" in payload and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", payload["email"]):
            raise ValueError("Invalid email format for book_appointment")

        return payload

    @staticmethod
    async def execute_tool(tool_name: str, **kwargs) -> Dict[str, Any]:
        if tool_name == "check_availability":
            return await ToolRegistry.check_availability(kwargs["date"])
        if tool_name == "book_appointment":
            return await ToolRegistry.book_appointment(kwargs["date"], kwargs["time"], kwargs["email"])
        if tool_name == "create_ticket":
            return await ToolRegistry.create_ticket(kwargs["issue_summary"])
        if tool_name == "handoff_to_human":
            return await ToolRegistry.handoff_to_human(kwargs["reason"])
        raise ValueError(f"Unknown tool: {tool_name}")
