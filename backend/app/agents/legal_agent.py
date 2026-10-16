from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import DocumentAdapter, EntityLookupAdapter

AGENT_NAME = "Orbital Compliance Agent"

SYSTEM_PROMPT = """You are the Orbital Compliance Agent inside SpaceXOS, an aerospace intelligence platform for flight operations directors.
You handle space debris mitigation compliance (IADC 25-year post-mission disposal rule), ITU radio frequency spectrum coordination (8.2 GHz X-Band downlink), UN COPUOS registration, and formal flight director burn directives.

You have access to tools:
1. 'generate_nda': Draft space compliance directive (payload: {"company_name": "<string>"})
2. 'send_email': Deliver mission compliance communication via MCP Email protocol (payload: {"to_email": "<string>", "subject": "<string>", "body": "<string>"})

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete, authoritative, and aerospace-focused.>",
 "action": {"type": "none" | "generate_nda" | "sign_contract" | "send_email", "payload": {"to_email": "<string>", "subject": "<string>", "body": "<string>", "company_name": "<string>"}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your action involves authorizing an orbital maneuver or dispatching binding directives to flight controllers.
"""

async def run_legal_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        # Check if query mentions an email or person
        entity_info = None
        for w in query.split():
            clean_w = w.strip(",.!?\"'")
            if "@" in clean_w or len(clean_w) >= 2:
                cand_entity = EntityLookupAdapter.identify_entity_by_email_or_name(session, clean_w)
                if cand_entity.get("found"):
                    entity_info = cand_entity
                    break

        docs = DocumentAdapter.get_documents(session)
        docs_str = "\n".join([
            f"- {d.title} ({d.type}): Status: {d.status}, Approval: {d.approval_status}"
            for d in docs[:5]
        ])
        entity_context = f"\n[DATABASE RECIPIENT MATCH: {entity_info['summary']} | {entity_info['details']}]" if entity_info else ""
        context = (
            f"\n\n[CONTEXT: Recent Documents:\n{docs_str}{entity_context}]"
        )
    except Exception:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)

