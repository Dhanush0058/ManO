import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.tools import execute_tool
from app.models.database import Approval, AuditLogEntry, get_session, utcnow
from app.models.schemas import ApprovalOut

router = APIRouter()


@router.get("/tasks", response_model=list[ApprovalOut])
def list_tasks(session: Session = Depends(get_session)):
    approvals_list = session.query(Approval).filter(Approval.status == "pending").order_by(Approval.timestamp.desc()).all()
    return [ApprovalOut.model_validate(p) for p in approvals_list]


@router.post("/tasks/{task_id}/approve", response_model=ApprovalOut)
async def approve_task(task_id: int, session: Session = Depends(get_session)):
    approval = session.get(Approval, task_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Task not found")
    if approval.status != "pending":
        raise HTTPException(status_code=409, detail=f"Task is already {approval.status}")

    # Map the action string to the corresponding MCP tool execution
    action_lower = (approval.action or "").lower()
    desc_lower = (approval.description or "").lower()
    
    if "email" in action_lower or "outreach" in action_lower or "send" in action_lower:
        tool_name = "send_email"
        
        # Dynamically extract recipient email address from approval details
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', approval.action or "")
        if not email_match:
            email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', approval.description or "")
            
        target_email = email_match.group(0) if email_match else "dhanushreddy52006@gmail.com"
        
        payload = {
            "to_email": target_email,
            "subject": approval.action or "Notification from ManO",
            "body": approval.description or "Automated message approved by founder.",
            "sender": f"ManO ({approval.agent})"
        }
    elif "contract" in action_lower or "nda" in action_lower or "agreement" in action_lower:
        tool_name = "generate_nda"
        payload = {"company_name": approval.description or "Partner"}
    else:
        tool_name = "none"
        payload = {"action": approval.action, "description": approval.description}

    result = await execute_tool(tool_name, payload)

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
