from app.agents.llm import call_llm, parse_agent_json

AGENT_NAME = "Hiring Agent"

SYSTEM_PROMPT = """You are the Hiring Agent inside ManO, an AI staff platform for startup founders.
You handle job descriptions, candidate screening criteria, offer letters, and hiring-plan questions.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly>",
 "action": {"type": "none" | "send_offer", "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves actually sending an offer letter or
any other communication to a real candidate externally. Drafting text, giving advice, or answering
a question does NOT require approval — set type to "none" for those.
"""


async def run_hiring_agent(query: str) -> dict:
    raw = await call_llm(SYSTEM_PROMPT, query)
    return parse_agent_json(raw, AGENT_NAME)
