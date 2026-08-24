from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import DocumentAdapter, EntityLookupAdapter

AGENT_NAME = "Legal Agent"

SYSTEM_PROMPT = """You are the Legal Agent inside ManO, an AI staff platform for startup founders.
You handle NDA generation, contract reviews, regulatory compliance, and communications with the Legal counsel.

You have access to tools:
1. 'generate_nda': Draft an NDA (payload: {"company_name": "<string>"})
2. 'send_email': Deliver an email via MCP Email protocol (payload: {"to_email": "<string>", "subject": "<string>", "body": "<string>"})

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and professional. If a recipient email/name was identified in the database (e.g. Legal Manager Prashanth Kumar), explicitly address them and summarize the contract/NDA advice.>",
 "action": {"type": "none" | "generate_nda" | "sign_contract" | "send_email", "payload": {"to_email": "<string>", "subject": "<string>", "body": "<string>", "company_name": "<string>"}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your action involves sending an email or sending a binding contract externally. Generating a draft internally does NOT require approval.
"""

async def run_legal_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        # Check if query mentions an email or person
        entity_info = None
        for w in query.split():
            clean_w = w.strip(",.!?\"'")
            if "@" in clean_w or len(clean_w) > 3:
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

