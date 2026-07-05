from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.tools import execute_tool
from app.models.database import Approval, AuditLogEntry, get_session, utcnow
from app.models.schemas import ApprovalOut

router = APIRouter()


@router.get("/tasks", response_model=list[ApprovalOut])
def list_tasks(session: Session = Depends(get_session)):
    return session.query(Approval).order_by(Approval.created_at.desc()).all()


@router.post("/tasks/{task_id}/approve", response_model=ApprovalOut)
async def approve_task(task_id: int, session: Session = Depends(get_session)):
    approval = session.get(Approval, task_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Task not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Task is already {approval.status}")

    result = await execute_tool(approval.action_type, {"title": approval.title, "description": approval.description})

    approval.status = "executed"
    approval.result = result
    approval.resolved_at = utcnow()
    session.add(
        AuditLogEntry(
            actor="Founder",
            action="approve",
            detail=f"Approved '{approval.title}' ({approval.agent_name}) — {result}",
            timestamp=utcnow(),
        )
    )
    session.commit()
    session.refresh(approval)
    return approval


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
            actor="Founder",
            action="reject",
            detail=f"Rejected '{approval.title}' ({approval.agent_name})",
            timestamp=utcnow(),
        )
    )
    session.commit()
    session.refresh(approval)
    return approval
