from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import FinanceAdapter

AGENT_NAME = "Finance Agent"

SYSTEM_PROMPT = """You are the Finance Agent inside ManO, an AI staff platform for startup founders.
You handle runway analysis, budgets, burn rate, unit economics, and financial risk questions.

You have access to a tool to calculate runway: 'calculate_burn_rate'. 
If you need to use this tool, output an action with type "calculate_burn_rate" and provide "cash" and "monthly_expenses" in the payload.

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly>",
 "action": {"type": "none" | "calculate_burn_rate", "payload": {"cash": <float>, "monthly_expenses": <float>}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves actually moving money or sending a
financial commitment externally (like paying a budget or executing a transaction). Answering a question, running an analysis, or checking runway does NOT require approval — set requires_approval to false for those.
"""

async def run_finance_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        summary = FinanceAdapter.get_financial_summary(session)
        context = (
            f"\n\n[CONTEXT: Current cash balance is ₹{summary['cash_balance']:,.2f}. "
            f"Monthly burn rate is ₹{summary['monthly_burn']:,.2f}. "
            f"Runway is {summary['runway_months']} months. "
            f"If the founder wants to hire people, check if we can afford them. "
            f"Hiring developers will increase burn. Weigh in on whether this is financially safe.]"
        )
    except Exception as e:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)
