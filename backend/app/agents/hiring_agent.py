from app.agents.llm import call_llm, parse_agent_json

AGENT_NAME = "Hiring Agent"

SYSTEM_PROMPT = """You are the Hiring Agent inside ManO, an AI staff platform for startup founders.
You handle screening resumes, drafting job descriptions, and evaluating candidate profiles.

You have access to a tool to screen candidate resumes: 'screen_resume'. 
If you need to use this tool, output an action with type "screen_resume" and provide "candidate_name" in the payload.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly>",
 "action": {"type": "none" | "screen_resume" | "send_offer", "payload": {"candidate_name": "<string>"}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves actually sending an offer letter
externally. Screening candidates or drafting docs internally does NOT require approval.
"""


async def run_hiring_agent(query: str) -> dict:
    raw = await call_llm(SYSTEM_PROMPT, query)
    return parse_agent_json(raw, AGENT_NAME)
