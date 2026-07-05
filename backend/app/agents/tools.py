"""Mock tool-execution layer.

These functions stand in for the real integrations shown in the architecture
diagram (Gmail API, e-signature, Plaid, etc.), none of which are wired up in
this build. Each one just returns a string describing what *would* happen.

To wire a real integration: replace the body of the matching function with
a real API call, keep the same signature (payload: dict) -> str, and nothing
else in the app needs to change.
"""

import asyncio
from typing import Dict


async def mock_send_email(payload: Dict) -> str:
    await asyncio.sleep(0.2)
    return "Mock tool: email marked as sent. (No real email provider wired up — this is where the Gmail API would go.)"


async def mock_sign_contract(payload: Dict) -> str:
    await asyncio.sleep(0.2)
    return "Mock tool: document marked as sent for signature. (No real e-signature provider wired up yet.)"


async def mock_process_payment(payload: Dict) -> str:
    await asyncio.sleep(0.2)
    return "Mock tool: payment marked as scheduled. (No real payment rail wired up — this is where Plaid/Stripe would go.)"


async def mock_generic(payload: Dict) -> str:
    await asyncio.sleep(0.1)
    return "Mock tool: action marked complete. (No specific integration wired up for this action type yet.)"


TOOLS = {
    "send_offer": mock_send_email,
    "send_outreach": mock_send_email,
    "sign_contract": mock_sign_contract,
    "payment": mock_process_payment,
}


async def execute_tool(action_type: str, payload: Dict) -> str:
    tool = TOOLS.get(action_type, mock_generic)
    return await tool(payload)
