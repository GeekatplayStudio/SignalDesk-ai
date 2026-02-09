import asyncio
import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from .database import Base, Conversation as DBConversation
from .database import Message as DBMessage
from .database import ToolLog, engine, get_db
from .orchestrator import run_agent_loop

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(_: FastAPI):
    attempts = 10
    for attempt in range(1, attempts + 1):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except Exception:
            if attempt == attempts:
                raise
            logger.warning("Database not ready (attempt %s/%s), retrying...", attempt, attempts)
            await asyncio.sleep(1)
    yield


app = FastAPI(title="Minimum Viable Agent Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConversationCreate(BaseModel):
    user_id: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    user_id: Optional[str]
    status: str
    slots: Dict[str, Any]
    created_at: str


class MessageCreate(BaseModel):
    content: str
    role: str = "user"


class ChatRequest(BaseModel):
    conversation_id: str
    message: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    order_index: int
    created_at: str


class ToolLogResponse(BaseModel):
    id: int
    message_id: Optional[int]
    tool_name: str
    input_params: Dict[str, Any]
    output: Dict[str, Any]
    execution_time_ms: int
    status: str
    error_msg: Optional[str]
    created_at: str


class AgentTurnResponse(BaseModel):
    response: str
    tool_calls: List[Dict[str, Any]]
    conversation_status: str
    latency_ms: int
    confidence: Optional[float]
    slots: Dict[str, Any]


class HandoffRequest(BaseModel):
    reason: str = "Manual emergency takeover from console"


class HandoffResponse(BaseModel):
    conversation_id: str
    status: str
    reason: str


def _next_message_order(db: Session, conversation_id: str) -> int:
    current_max = db.query(func.max(DBMessage.order_index)).filter(
        DBMessage.conversation_id == conversation_id
    ).scalar()
    return int(current_max or 0) + 1


@app.post("/conversation", response_model=ConversationResponse)
def create_conversation(conv: ConversationCreate, db: Session = Depends(get_db)):
    new_id = str(uuid.uuid4())
    db_conv = DBConversation(
        id=new_id,
        user_id=conv.user_id,
        status="active",
        slots={},
    )
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)
    return ConversationResponse(
        id=db_conv.id,
        user_id=db_conv.user_id,
        status=db_conv.status,
        slots=db_conv.slots or {},
        created_at=db_conv.created_at.isoformat(),
    )


@app.get("/conversation/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    conv = db.query(DBConversation).filter(DBConversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationResponse(
        id=conv.id,
        user_id=conv.user_id,
        status=conv.status,
        slots=conv.slots or {},
        created_at=conv.created_at.isoformat(),
    )


@app.post("/conversation/{conversation_id}/message", response_model=AgentTurnResponse)
async def send_message(conversation_id: str, msg: MessageCreate, db: Session = Depends(get_db)):
    db_conv = db.query(DBConversation).filter(DBConversation.id == conversation_id).first()
    if not db_conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if db_conv.status == "handoff":
        return AgentTurnResponse(
            response="A human operator is currently handling this conversation.",
            tool_calls=[],
            conversation_status="handoff",
            latency_ms=0,
            confidence=None,
            slots=db_conv.slots or {},
        )

    turn_start = time.monotonic()
    result = await run_agent_loop(conversation_id, msg.content, db)
    result["latency_ms"] = int((time.monotonic() - turn_start) * 1000)
    return result


@app.post("/chat", response_model=AgentTurnResponse)
async def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    return await send_message(
        conversation_id=payload.conversation_id,
        msg=MessageCreate(content=payload.message, role="user"),
        db=db,
    )


@app.post("/conversation/{conversation_id}/handoff", response_model=HandoffResponse)
def emergency_handoff(
    conversation_id: str,
    request: HandoffRequest,
    db: Session = Depends(get_db),
):
    conversation = db.query(DBConversation).filter(DBConversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.status = "handoff"
    assistant_message = DBMessage(
        conversation_id=conversation_id,
        role="assistant",
        content="Emergency takeover enabled. A human operator has been notified.",
        order_index=_next_message_order(db, conversation_id),
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    log = ToolLog(
        conversation_id=conversation_id,
        message_id=assistant_message.id,
        tool_name="handoff_to_human",
        input_params={"reason": request.reason},
        output={"status": "handoff_initiated", "reason": request.reason},
        execution_time_ms=0,
        status="success",
        error_msg=None,
    )
    db.add(log)
    db.commit()
    db.refresh(conversation)

    return HandoffResponse(
        conversation_id=conversation_id,
        status=conversation.status,
        reason=request.reason,
    )


@app.get("/conversation/{conversation_id}/history", response_model=List[MessageResponse])
def get_history(conversation_id: str, db: Session = Depends(get_db)):
    msgs = (
        db.query(DBMessage)
        .filter(DBMessage.conversation_id == conversation_id)
        .order_by(DBMessage.order_index, DBMessage.id)
        .all()
    )
    return [
        MessageResponse(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            order_index=msg.order_index,
            created_at=msg.created_at.isoformat(),
        )
        for msg in msgs
    ]


@app.get("/conversation/{conversation_id}/logs", response_model=List[ToolLogResponse])
def get_logs(conversation_id: str, db: Session = Depends(get_db)):
    logs = (
        db.query(ToolLog)
        .filter(ToolLog.conversation_id == conversation_id)
        .order_by(ToolLog.created_at, ToolLog.id)
        .all()
    )
    return [
        ToolLogResponse(
            id=log.id,
            message_id=log.message_id,
            tool_name=log.tool_name,
            input_params=log.input_params or {},
            output=log.output or {},
            execution_time_ms=log.execution_time_ms,
            status=log.status,
            error_msg=log.error_msg,
            created_at=log.created_at.isoformat(),
        )
        for log in logs
    ]


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "MVA Platform"}
