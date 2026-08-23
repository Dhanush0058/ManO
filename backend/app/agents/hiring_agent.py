from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import HRAdapter

AGENT_NAME = "Hiring Agent"

SYSTEM_PROMPT = """You are the Hiring Agent inside ManO, an AI staff platform for startup founders.
You handle screening resumes, drafting job descriptions, and evaluating candidate profiles.

You have access to a tool to screen candidate resumes: 'screen_resume'. 
If you need to use this tool, output an action with type "screen_resume" and provide "candidate_name" in the payload.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly>",
 "action": {"type": "none" | "screen_resume" | "send_offer", "payload": {"candidate_name": "<string>"}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves actually sending an offer letter
externally or finalizing a hire. Screening candidates or drafting descriptions internally does NOT require approval.
"""

async def run_hiring_agent(query: str) -> dict:
    session = SessionLocal()
    try:
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
            f"- {c.name}: {c.skills}, Exp: {c.experience} yrs, Expected: ₹{c.expected_salary}, Match: {c.match_score}%, Status: {c.status}"
            for c in candidates[:5]
        ])
        
        context = (
            f"\n\n[CONTEXT: Open Jobs: [{jobs_str}]. "
            f"Top Candidates matching '{skill or 'any'}':\n{candidates_str}]"
        )
    except Exception as e:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)
