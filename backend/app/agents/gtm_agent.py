from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import CRMAdapter, EntityLookupAdapter

AGENT_NAME = "GTM Agent"

SYSTEM_PROMPT = """You are the Go-To-Market (GTM) Agent inside ManO, an AI staff platform for startup founders.
You handle sales strategies, lead generation, customer outreach, and email delivery.

You have access to MCP tools:
1. 'save_lead': Save lead to CRM (payload: {"name": "<string>", "email": "<string>", "company": "<string>"})
2. 'send_email': Deliver an email via MCP Email protocol (payload: {"to_email": "<string>", "subject": "<string>", "body": "<string>"})

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly. If an email address/recipient was recognized in the database, explicitly mention who they are and their lead score/details.>",
 "action": {"type": "none" | "save_lead" | "send_email", "payload": {"to_email": "<string>", "subject": "<string>", "body": "<string>", "name": "<string>", "company": "<string>"}, "requires_approval": <bool>, "summary": "<one line describing recipient and action, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves actually sending an external email or launching a campaign. Analyzing or searching leads inside the database does NOT require approval.
"""

async def run_gtm_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        # Check if query mentions an email or contact
        entity_info = None
        words = query.split()
        for w in words:
            if "@" in w or len(w) >= 2:
                cand_entity = EntityLookupAdapter.identify_entity_by_email_or_name(session, w.strip(",.!?\"'"))
                if cand_entity.get("found"):
                    entity_info = cand_entity
                    break

        leads = CRMAdapter.get_leads(session)
        loc = None
        if "hyderabad" in query.lower():
            leads = [l for l in leads if l.location and "hyderabad" in l.location.lower()]
            loc = "Hyderabad"
            
        leads_str = "\n".join([
            f"- {l.company_name} ({l.industry} in {l.location}): Score: {l.lead_score}, Email: {l.email}, Pain: {l.pain_point}, Status: {l.status}"
            for l in leads[:5]
        ])
        
        entity_context = f"\n[DATABASE RECIPIENT MATCH: {entity_info['summary']} | {entity_info['details']}]" if entity_info else ""
        context = (
            f"\n\n[CONTEXT: Top Leads in '{loc or 'all'}':\n{leads_str}{entity_context}]"
        )
    except Exception:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)

