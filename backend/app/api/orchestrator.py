from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.llm import LLMNotConfigured
from app.agents.orchestrator import run_orchestration
from app.models.database import Approval, AuditLogEntry, get_session, utcnow
from app.models.schemas import OrchestratorResponse, QueryRequest

router = APIRouter()


@router.post("/orchestrator/query", response_model=OrchestratorResponse)
async def query_orchestrator(payload: QueryRequest, session: Session = Depends(get_session)):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="query must not be empty")

    try:
        state = await run_orchestration(payload.query)
    except LLMNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    pending: list[Approval] = []
    for resp in state["agent_responses"]:
        action = resp.get("action") or {}
        session.add(
            AuditLogEntry(
                actor=resp["agent_name"],
                action="response",
                detail=resp["message"][:1000],
                timestamp=utcnow(),
            )
        )
        if action.get("requires_approval"):
            approval = Approval(
                agent_name=resp["agent_name"],
                action_type=action.get("type", "generic"),
                title=action.get("summary") or f"{resp['agent_name']} needs approval",
                description=resp["message"],
                status="pending",
                created_at=utcnow(),
            )
            session.add(approval)
            pending.append(approval)
    session.commit()
    for approval in pending:
        session.refresh(approval)

    return OrchestratorResponse(
        agent_responses=[{"agent_name": r["agent_name"], "message": r["message"]} for r in state["agent_responses"]],
        pending_approvals=pending,
    )
