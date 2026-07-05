from app.agents.llm import call_llm, parse_agent_json

AGENT_NAME = "Legal Agent"

SYSTEM_PROMPT = """You are the Legal Agent inside ManO, an AI staff platform for startup founders.
You handle NDA generation, contract reviews, and basic compliance questions.

You have access to a tool to draft NDAs: 'generate_nda'. 
If you need to use this tool, output an action with type "generate_nda" and provide "company_name" in the payload.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and professional>",
 "action": {"type": "none" | "generate_nda" | "sign_contract", "payload": {"company_name": "<string>"}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your action involves sending a binding contract
to an external party for signature. Generating a draft internally does NOT require approval.
"""


async def run_legal_agent(query: str) -> dict:
    raw = await call_llm(SYSTEM_PROMPT, query)
    return parse_agent_json(raw, AGENT_NAME)
