from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.tools import execute_tool
from app.models.database import Approval, AuditLogEntry, get_session, utcnow
from app.models.schemas import ApprovalOut

router = APIRouter()


@router.get("/tasks", response_model=list[ApprovalOut])
def list_tasks(session: Session = Depends(get_session)):
    approvals_list = session.query(Approval).order_by(Approval.timestamp.desc()).all()
    # Map them using model_validate for backwards compatibility
    return [ApprovalOut.model_validate(p) for p in approvals_list]


@router.post("/tasks/{task_id}/approve", response_model=ApprovalOut)
async def approve_task(task_id: int, session: Session = Depends(get_session)):
    approval = session.get(Approval, task_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Task not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Task is already {approval.status}")

    # Map the action string to a mock tool execution
    result = await execute_tool("none", {"action": approval.action, "description": approval.description})

    approval.status = "executed"
    approval.result = result
    approval.resolved_at = utcnow()
    session.add(
        AuditLogEntry(
            agent="Orchestrator",
            action="approve",
            input=f"Approve task ID {task_id}",
            output=f"Approved '{approval.action}' ({approval.agent}) — {result}",
            status="success",
            timestamp=utcnow(),
        )
    )
    session.commit()
    session.refresh(approval)
    return ApprovalOut.model_validate(approval)


@router.post("/tasks/{task_id}/reject", response_model=ApprovalOut)
def reject_task(task_id: int, session: Session = Depends(get_session)):
    approval = session.get(Approval, task_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Task not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Task is already {approval.status}")

    approval.status = "rejected"
    approval.resolved_at = utcnow()
    session.add(
        AuditLogEntry(
            agent="Orchestrator",
            action="reject",
            input=f"Reject task ID {task_id}",
            output=f"Rejected '{approval.action}' ({approval.agent})",
            status="success",
            timestamp=utcnow(),
        )
    )
    session.commit()
    session.refresh(approval)
    return ApprovalOut.model_validate(approval)
