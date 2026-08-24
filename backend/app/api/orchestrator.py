from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.agents.llm import LLMNotConfigured
from app.agents.orchestrator import run_orchestration
from app.models.database import Approval, AuditLogEntry, get_session, utcnow
from app.models.schemas import OrchestratorResponse, QueryRequest, ApprovalOut

router = APIRouter()


from app.agents.tools import execute_tool

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
        act_type = action.get("type", "none")
        
        # Execute MCP Email tool if action is send_email or if prompt commands sending an email
        was_executed_directly = False
        if act_type == "send_email" or ("email" in payload.query.lower() and "send" in payload.query.lower()):
            email_payload = dict(action.get("payload", {}))
            if not email_payload.get("to_email"):
                for w in payload.query.split():
                    if "@" in w:
                        email_payload["to_email"] = w.strip(",.!?\"'")
                        break
            if not email_payload.get("to_email"):
                email_payload["to_email"] = "recipient@example.com"
            if not email_payload.get("subject"):
                email_payload["subject"] = f"Update from FounderOS ({resp['agent_name']})"
            if not email_payload.get("body"):
                email_payload["body"] = resp["message"]

            mcp_res = await execute_tool("send_email", email_payload)
            
            from app.adapters import EntityLookupAdapter
            entity = EntityLookupAdapter.identify_entity_by_email_or_name(session, email_payload["to_email"])
            recip_info = f"{entity.get('name', 'Contact')} [{entity.get('match_type', 'Recipient')}]" if entity.get("found") else email_payload["to_email"]
            
            resp["message"] = f"✅ Email has been sent to {recip_info} ({email_payload['to_email']})."
            was_executed_directly = True
        elif act_type in ["place_voice_call", "trigger_call", "call_phone"] or ("call" in payload.query.lower() and any(c.isdigit() for c in payload.query)):
            call_payload = dict(action.get("payload", {}))
            import re
            digits = re.findall(r'\+?\d{10,12}', payload.query)
            if digits:
                target_phone = digits[0]
                if not target_phone.startswith("+"):
                    target_phone = "+91" + target_phone if len(target_phone) == 10 else "+" + target_phone
                call_payload["to_phone"] = target_phone
            if not call_payload.get("to_phone"):
                call_payload["to_phone"] = "+918886544423"
            if not call_payload.get("topic"):
                call_payload["topic"] = "Startup Runway & Executive Briefing"

            mcp_call_res = await execute_tool("place_voice_call", call_payload)
            resp["message"] = f"📞 Outbound AI Voice Call initiated to {call_payload['to_phone']} (Topic: {call_payload['topic']})."
            was_executed_directly = True

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
        
        # Only add to pending approvals if it wasn't already executed directly
        if action.get("requires_approval") and not was_executed_directly:
            risk = "High"
            act_type_lower = action.get("type", "generic").lower()
            if "outreach" in act_type_lower or "campaign" in act_type_lower:
                risk = "Medium"
            elif "nda" in action.get("summary", "").lower():
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
