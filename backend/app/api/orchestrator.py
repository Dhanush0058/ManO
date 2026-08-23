from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.llm import LLMNotConfigured
from app.agents.orchestrator import run_orchestration
from app.models.database import Approval, AuditLogEntry, get_session, utcnow
from app.models.schemas import OrchestratorResponse, QueryRequest, ApprovalOut

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
                agent=resp["agent_name"],
                action="response",
                input=payload.query[:1000],
                output=resp["message"][:1000],
                status="success",
                timestamp=utcnow(),
            )
        )
        if action.get("requires_approval"):
            # Determine risk level based on action details
            risk = "High"
            act_type = action.get("type", "generic").lower()
            if "outreach" in act_type or "campaign" in act_type:
                risk = "Medium"
            elif "NDA" in action.get("summary", ""):
                risk = "Medium"
                
            approval = Approval(
                agent=resp["agent_name"],
                action=action.get("summary") or f"{resp['agent_name']} needs approval",
                risk_level=risk,
                description=resp["message"],
                status="pending",
                timestamp=utcnow(),
            )
            session.add(approval)
            pending.append(approval)
            
    session.commit()
    for approval in pending:
        session.refresh(approval)

    return OrchestratorResponse(
        agent_responses=[{"agent_name": r["agent_name"], "message": r["message"]} for r in state["agent_responses"]],
        pending_approvals=[ApprovalOut.model_validate(p) for p in pending],
    )
