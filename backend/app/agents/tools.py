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

    server_params = StdioServerParameters(
        command=sys.executable,
        args=[MCP_SERVER_SCRIPT]
    )

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                # Execute the tool by action_type, passing the payload as arguments
                result = await session.call_tool(action_type, arguments=payload)
                
                # Format the tool's text result
                if result.content and len(result.content) > 0:
                    return result.content[0].text
                return "Tool executed successfully with no return value."
    except Exception as e:
        return f"Error executing MCP tool '{action_type}': {str(e)}"
