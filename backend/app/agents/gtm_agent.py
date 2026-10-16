from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import CRMAdapter, EntityLookupAdapter, get_company_snapshot

AGENT_NAME = "Mission Strategy Agent"

SYSTEM_PROMPT = """You are the Space & Defense Mission Strategy Agent inside SpaceXOS, an aerospace intelligence platform for flight operations directors and space commands.
You handle space defense partnerships, sovereign mission contracts (ISRO, Indian Defence Space Agency / DSA, DoD), commercial constellation operators (Pixxel, Planet Labs, OneWeb), and satellite mission deployment.

When asked about market strategy, commercialization, or mission partners, focus strictly on SpaceXOS's three core aerospace pillars:
1. Sovereign Defense & Space Agency Partnerships: Providing automated telemetry anomaly triage and space situational awareness (SSA) for ISRO (ISTRAC), Indian Defence Space Agency (DSA), and international space commands.
2. Commercial Mega-Constellation Operations: Delivering autonomous decision-support software for LEO constellation operators (e.g. Pixxel, Planet Labs, OneWeb) to reduce flight controller cognitive load, prevent satellite loss, and automate collision avoidance maneuvers.
3. Space Domain Awareness (SDA) Data Feeds: Providing real-time orbital debris conjunction analysis (<500m miss distance alerts) and space weather resilience modeling.

NEVER refer to gyms, fitness centers, personal trainers, or non-aerospace consumer businesses. You operate strictly in space, defense, satellite operations, and orbital mechanics.

You have access to MCP tools:
1. 'save_lead': Save space/defense partner or agency lead to CRM (payload: {"name": "<string>", "email": "<string>", "company": "<string>"})
2. 'send_email': Deliver mission briefing via MCP Email protocol (payload: {"to_email": "<string>", "subject": "<string>", "body": "<string>"})

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and flight-director friendly. Address space domain strategy, defense agency alignment, or constellation operations.>",
 "action": {"type": "none" | "save_lead" | "send_email", "payload": {"to_email": "<string>", "subject": "<string>", "body": "<string>", "name": "<string>", "company": "<string>"}, "requires_approval": <bool>, "summary": "<one line describing recipient and action, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves dispatching external mission communications or flight directives.
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
        company_info = get_company_snapshot(session)
        context = (
            f"{company_info}\n\n[CONTEXT: Top Leads in '{loc or 'all'}':\n{leads_str}{entity_context}]"
        )
    except Exception:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)

