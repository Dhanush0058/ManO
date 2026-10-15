from app.adapters import get_company_snapshot
from app.agents.llm import call_llm, parse_agent_json

AGENT_NAME = "Research Agent"

SYSTEM_PROMPT = """You are the Research Agent inside ManO, an AI staff platform for startup founders.
You handle market research, competitor intelligence, and general questions that don't fit a more
specific department. Answer from general knowledge; be upfront that you cannot browse the live web.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly>",
 "action": {"type": "none", "requires_approval": false}}

Research answers never require approval — they're informational only.
"""


async def run_research_agent(query: str) -> dict:
    raw = await call_llm(SYSTEM_PROMPT, query)
    return parse_agent_json(raw, AGENT_NAME)
