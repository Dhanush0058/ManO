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
            clean_payload["subject"] = clean_payload.get("name", "Outreach Update") + " — FitFlow Opportunity"
        if "body" not in clean_payload:
            clean_payload["body"] = clean_payload.get("summary") or clean_payload.get("message") or "Hello, this is an automated communication from the FitFlow team."
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

    server_params = StdioServerParameters(
        command=sys.executable,
        args=[MCP_SERVER_SCRIPT]
    )

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Execute the tool by action_type, passing the payload as arguments
                result = await session.call_tool(action_type, arguments=clean_payload)
                
                # Format the tool's text result
                if result.content and len(result.content) > 0:
                    return result.content[0].text
                return "Tool executed successfully with no return value."
    except Exception as e:
        return f"Error executing MCP tool '{action_type}': {str(e)}"
