from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import CRMAdapter

AGENT_NAME = "GTM Agent"

SYSTEM_PROMPT = """You are the Go-To-Market (GTM) Agent inside ManO, an AI staff platform for startup founders.
You handle sales strategies, lead generation, and CRM management.

You have access to a tool to save leads to the CRM: 'save_lead'. 
If you need to use this tool, output an action with type "save_lead" and provide "name", "email", and "company" in the payload.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly>",
 "action": {"type": "none" | "save_lead" | "send_outreach", "payload": {"name": "<string>", "email": "<string>", "company": "<string>"}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves actually initiating external campaigns or outreach (like sending emails or triggering calls). Analyzing or saving leads inside the database does NOT require approval.
"""

async def run_gtm_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        leads = CRMAdapter.get_leads(session)
        loc = None
        if "hyderabad" in query.lower():
            leads = [l for l in leads if l.location and "hyderabad" in l.location.lower()]
            loc = "Hyderabad"
            
        leads_str = "\n".join([
            f"- {l.company_name} ({l.industry} in {l.location}): Score: {l.lead_score}, Pain: {l.pain_point}, Status: {l.status}"
            for l in leads[:5]
        ])
        
        context = (
            f"\n\n[CONTEXT: Top Leads in '{loc or 'all'}':\n{leads_str}]"
        )
    except Exception as e:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)
