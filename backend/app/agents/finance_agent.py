from app.agents.llm import call_llm, parse_agent_json
from app.models.database import SessionLocal
from app.adapters import FinanceAdapter, EntityLookupAdapter

AGENT_NAME = "Telemetry & Power Agent"

SYSTEM_PROMPT = """You are the Telemetry & Power Agent inside SpaceXOS, an aerospace intelligence platform for satellite operations and flight directors.
You handle spacecraft power subsystem telemetry (solar array generation, bus voltages, battery depth-of-discharge), delta-V propellant budgets, and ground station tracking pass budgets for Cartosat-3, RISAT-2BR1, and GSAT-7A.

When responding to flight directors, communicate with high aerospace rigor:
- Nominal solar bus output: 1,850 - 2,000 W
- Nominal battery charge: > 95%
- Thruster propellant budget and delta-V margins

You have access to tools:
1. 'calculate_burn_rate': Calculate power/telemetry budget (payload: {"cash": <float>, "monthly_expenses": <float>})
2. 'send_email': Deliver mission telemetry summary via MCP Email protocol (payload: {"to_email": "<string>", "subject": "<string>", "body": "<string>"})

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON:
{"message": "<your answer, 2-5 sentences, concrete and flight-director friendly.>",
 "action": {"type": "none" | "calculate_burn_rate" | "send_email", "payload": {"to_email": "<string>", "subject": "<string>", "body": "<string>", "cash": <float>, "monthly_expenses": <float>}, "requires_approval": <bool>, "summary": "<one line, only if requires_approval is true>"}}

Set requires_approval to true ONLY if your answer involves dispatching external mission communications or commanding changes to spacecraft power state.
"""

async def run_finance_agent(query: str) -> dict:
    session = SessionLocal()
    try:
        # Check if query mentions an email or person
        found_entities = []
        for w in query.split():
            clean_w = w.strip(",.!?\"'")
            if "@" in clean_w or len(clean_w) >= 2:
                cand_entity = EntityLookupAdapter.identify_entity_by_email_or_name(session, clean_w)
                if cand_entity.get("found") and cand_entity["email"] not in [e["email"] for e in found_entities]:
                    found_entities.append(cand_entity)

        summary = FinanceAdapter.get_financial_summary(session)
        
        entity_context = ""
        if found_entities:
            entity_context = "\n[DATABASE RECIPIENT MATCHES:\n" + "\n".join([f"- {e['summary']} | {e['details']}" for e in found_entities]) + "\nIf sending an email to multiple recipients, you can separate their emails with commas in the to_email field.]"
            
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

