from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import FinanceAdapter, EntityLookupAdapter

AGENT_NAME = "Finance Agent"

SYSTEM_PROMPT = """You are the Finance Agent inside ManO, an AI staff platform for startup founders.
You handle runway analysis, budgets, burn rate, unit economics, financial reporting, and communications with the Finance team.

You have access to tools:
1. 'calculate_burn_rate': Calculate runway (payload: {"cash": <float>, "monthly_expenses": <float>})
2. 'send_email': Deliver an email via MCP Email protocol (payload: {"to_email": "<string>", "subject": "<string>", "body": "<string>"})

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and founder-friendly. If a recipient email/name was identified in the database (e.g. Finance Manager Ajay Kumar), explicitly address them and summarize the key runway/burn metrics.>",
 "action": {"type": "none" | "calculate_burn_rate" | "send_email", "payload": {"to_email": "<string>", "subject": "<string>", "body": "<string>", "cash": <float>, "monthly_expenses": <float>}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves sending an external email or moving funds. Answering questions or checking runway internally does NOT require approval.
"""

async def run_finance_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        # Check if query mentions an email or person
        entity_info = None
        for w in query.split():
            clean_w = w.strip(",.!?\"'")
            if "@" in clean_w or len(clean_w) >= 2:
                cand_entity = EntityLookupAdapter.identify_entity_by_email_or_name(session, clean_w)
                if cand_entity.get("found"):
                    entity_info = cand_entity
                    break

        summary = FinanceAdapter.get_financial_summary(session)
        entity_context = f"\n[DATABASE RECIPIENT MATCH: {entity_info['summary']} | {entity_info['details']}]" if entity_info else ""
        context = (
            f"\n\n[CONTEXT: Current cash balance is ₹{summary['cash_balance']:,.2f}. "
            f"Monthly burn rate is ₹{summary['monthly_burn']:,.2f}. "
            f"Runway is {summary['runway_months']} months.{entity_context}]"
        )
    except Exception:
        context = ""
    finally:
        session.close()

    raw = await call_llm(SYSTEM_PROMPT + context, query)
    return parse_agent_json(raw, AGENT_NAME)

