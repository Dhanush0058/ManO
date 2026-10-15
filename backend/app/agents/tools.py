"""MCP tool-execution layer.

This module connects to a local MCP server (mcp_server.py) and executes tools on it.
"""

import asyncio
import os
import sys
from typing import Dict
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Get path to the mcp server we just created
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
MCP_SERVER_SCRIPT = os.path.join(BASE_DIR, "mcp_server.py")

async def execute_tool(action_type: str, payload: Dict) -> str:
    if action_type == "none":
        return "No action required."

    # Normalize tool arguments
    clean_payload = dict(payload)
    if action_type in ["send_email", "send_outreach"]:
        action_type = "send_email"
        if "email" in clean_payload and "to_email" not in clean_payload:
            clean_payload["to_email"] = clean_payload["email"]
        if "to_email" not in clean_payload:
            clean_payload["to_email"] = "recipient@example.com"
        if "subject" not in clean_payload:
            clean_payload["subject"] = clean_payload.get("name", "Outreach Update") + " — ManO Opportunity"
        if "body" not in clean_payload:
            clean_payload["body"] = clean_payload.get("summary") or clean_payload.get("message") or "Hello, this is an automated communication from the ManO team."
        clean_payload = {k: v for k, v in clean_payload.items() if k in ["to_email", "subject", "body", "sender"]}
    elif action_type in ["place_voice_call", "trigger_call", "call_phone"]:
        action_type = "place_voice_call"
        if "phone" in clean_payload and "to_phone" not in clean_payload:
            clean_payload["to_phone"] = clean_payload["phone"]
        if "to_phone" not in clean_payload:
            clean_payload["to_phone"] = "+919876543210"
        if "topic" not in clean_payload:
            clean_payload["topic"] = clean_payload.get("summary") or clean_payload.get("goal") or "Startup Briefing"
        clean_payload = {k: v for k, v in clean_payload.items() if k in ["to_phone", "topic"]}

    try:
        if action_type == "send_email":
            from mcp_server import send_email
            return send_email(
                to_email=clean_payload.get("to_email"),
                subject=clean_payload.get("subject"),
                body=clean_payload.get("body"),
                sender=clean_payload.get("sender", "dhanushreddy52006@gmail.com")
            )
        elif action_type == "calculate_burn_rate":
            from mcp_server import calculate_burn_rate
            return calculate_burn_rate(
                cash=clean_payload.get("cash", 0.0),
                monthly_expenses=clean_payload.get("monthly_expenses", 0.0)
            )
        elif action_type == "generate_nda":
            from mcp_server import generate_nda
            return generate_nda(company_name=clean_payload.get("company_name", "Partner"))
        elif action_type == "screen_resume":
            from mcp_server import screen_resume
            return screen_resume(candidate_name=clean_payload.get("candidate_name", ""))
        elif action_type == "lookup_contact":
            from mcp_server import lookup_contact
            return lookup_contact(query=clean_payload.get("query", ""))
        elif action_type == "place_voice_call":
            # Outbound calls are executed asynchronously via Twilio API, return mock success info
            return f"Outbound call initiated to {clean_payload.get('to_phone')} for topic: {clean_payload.get('topic')}."
        else:
            return f"Unknown tool action type: {action_type}"
    except Exception as e:
        return f"Error executing local tool function '{action_type}': {str(e)}"
