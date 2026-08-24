from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import HRAdapter, EntityLookupAdapter

AGENT_NAME = "Hiring Agent"

SYSTEM_PROMPT = """You are the Hiring Agent inside ManO, an AI staff platform for startup founders.
You handle screening resumes, candidate evaluation, interview scheduling, and email communications.

You have access to MCP tools:
1. 'screen_resume': Screen candidate resume (payload: {"candidate_name": "<string>"})
2. 'send_email': Deliver an email via MCP Email protocol (payload: {"to_email": "<string>", "subject": "<string>", "body": "<string>"})

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly. If a candidate email/name was identified in the database, explicitly compare and show their skills, match score, and current status.>",
 "action": {"type": "none" | "screen_resume" | "send_email" | "send_offer", "payload": {"to_email": "<string>", "subject": "<string>", "body": "<string>", "candidate_name": "<string>"}, "requires_approval": <bool>, "summary": "<one line describing recipient and action, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves actually sending an offer letter or sending an external email to a candidate. Screening candidates or drafting descriptions internally does NOT require approval.
"""

async def run_hiring_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        # Check if query mentions an email or candidate name
        entity_info = None
        words = query.split()
        for w in words:
            if "@" in w or len(w) >= 2:
                cand_entity = EntityLookupAdapter.identify_entity_by_email_or_name(session, w.strip(",.!?\"'"))
                if cand_entity.get("found"):
                    entity_info = cand_entity
                    break

        jobs = HRAdapter.get_open_jobs(session)
        jobs_str = ", ".join([f"'{j.title}' (Budget: ₹{j.salary_budget})" for j in jobs])
        
        # Determine candidate search criteria
        skill = None
        if "react" in query.lower():
            skill = "React"
        elif "python" in query.lower() or "backend" in query.lower():
            skill = "Python"
            
        candidates = HRAdapter.search_candidates(session, skills_query=skill)
        candidates_str = "\n".join([
            f"- {c.name} ({c.email}): {c.skills}, Exp: {c.experience} yrs, Expected: ₹{c.expected_salary}, Match: {c.match_score}%, Status: {c.status}"
            for c in candidates[:5]
        ])
        
        entity_context = f"\n[DATABASE RECIPIENT MATCH: {entity_info['summary']} | {entity_info['details']}]" if entity_info else ""
        context = (
            f"\n\n[CONTEXT: Open Jobs: [{jobs_str}]. "
            f"Top Candidates matching '{skill or 'any'}':\n{candidates_str}{entity_context}]"
        )
    except Exception:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)

