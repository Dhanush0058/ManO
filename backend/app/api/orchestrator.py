from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.adapters import EntityLookupAdapter
from app.agents.llm import LLMNotConfigured
from app.agents.orchestrator import run_orchestration
from app.models.database import Approval, AuditLogEntry, get_session, utcnow
from app.models.schemas import OrchestratorResponse, QueryRequest, ApprovalOut

router = APIRouter()


from app.agents.tools import execute_tool


def _resolve_email_targets(session: Session, query: str) -> list[str]:
    seen_emails: set[str] = set()
    resolved: list[str] = []

    for raw_token in query.split():
        cleaned = raw_token.strip(",.!?\"'")
        if "@" in cleaned:
            cleaned = cleaned.lower()
            if cleaned not in seen_emails:
                seen_emails.add(cleaned)
                resolved.append(cleaned)

    if resolved:
        return resolved

    tokens = [t.strip(",.!?\"'") for t in query.split() if len(t) > 2]
    for token in tokens:
        token_lower = token.lower()
        if token_lower in {
            "send", "email", "mail", "to", "and", "the", "hello", "founder", "what", "do", "you", "need",
            "finance", "hiring", "legal", "gtm", "research", "agent", "agents", "manager", "new", "coming", "as", "are",
        }:
            continue
        entity = EntityLookupAdapter.identify_entity_by_email_or_name(session, token)
        if entity.get("found") and entity.get("email"):
            email_val = entity["email"].lower()
            if email_val not in seen_emails:
                seen_emails.add(email_val)
                resolved.append(email_val)

    return resolved

@router.post("/orchestrator/query", response_model=OrchestratorResponse)
async def query_orchestrator(payload: QueryRequest, session: Session = Depends(get_session)):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="query must not be empty")

    try:
        state = await run_orchestration(payload.query)
    except LLMNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Orchestrator failed: {exc}") from exc

    pending: list[Approval] = []
    for resp in state["agent_responses"]:
        action = resp.get("action") or {}
        act_type = action.get("type", "none")
        
        # Execute MCP Email tool if action is send_email or if prompt commands sending an email
        was_executed_directly = False
        if act_type == "send_email" or (any(w in payload.query.lower() for w in ["email", "mail"]) and "send" in payload.query.lower()):
            email_payload = dict(action.get("payload", {}))
            if not email_payload.get("to_email"):
                resolved = _resolve_email_targets(session, payload.query)

                if resolved:
                    email_payload["to_email"] = ", ".join(resolved)
                else:
                    email_payload["to_email"] = "recipient@example.com"
            if not email_payload.get("subject") or not email_payload.get("body"):
                email_prompt = (
                    f"You are the FounderOS executive assistant writing an email on behalf of the startup founder.\n"
                    f"Founder's command: '{payload.query}'\n"
                    f"Recipient: {email_payload.get('to_email')}\n\n"
                    f"Compose a clear, professional, personalized email body and subject line directly addressing this request.\n"
                    f"Output strictly valid JSON with 'subject' and 'body' keys only.\n"
                    '{"subject": "...", "body": "..."}'
                )
                try:
                    from app.agents.llm import call_llm, parse_json_response
                    raw_email = await call_llm(
                        "You are an executive email drafting specialist. Reply with ONLY a JSON object containing 'subject' and 'body'.",
                        email_prompt,
                        max_tokens=600
                    )
                    parsed = parse_json_response(raw_email)
                    if parsed.get("subject"):
                        email_payload["subject"] = parsed["subject"]
                    if parsed.get("body"):
                        email_payload["body"] = parsed["body"]
                except Exception as ex:
                    print(f"[Orchestrator] Dynamic email generation fallback error: {ex}")
                    if not email_payload.get("subject"):
                        email_payload["subject"] = f"Update regarding {payload.query[:40]}"
                    if not email_payload.get("body"):
                        email_payload["body"] = f"Hello,\n\nHere is an update regarding your recent note: '{payload.query}'.\n\nBest regards,\nFounderOS"

            mcp_res = await execute_tool("send_email", email_payload)
            
            if "failed" in mcp_res.lower() or "error" in mcp_res.lower():
                resp["message"] = f"❌ Email delivery failed: {mcp_res}"
            else:
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
