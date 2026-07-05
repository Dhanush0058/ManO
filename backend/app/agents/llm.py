import json
import re
from typing import Any, Dict

import httpx

from app.config import settings

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"


class LLMNotConfigured(RuntimeError):
    pass


async def call_llm(system: str, user: str, max_tokens: int = 1024) -> str:
    """
    Calls either Gemini or Anthropic depending on LLM_PROVIDER.
    """

    # ---------------- GEMINI ----------------
    if settings.llm_provider == "gemini":
        if not settings.gemini_api_key:
            raise LLMNotConfigured(
                "GEMINI_API_KEY is not set. Add it to backend/.env."
            )

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent"
            f"?key={settings.gemini_api_key}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": f"{system}\n\n{user}"
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except Exception:
                raise RuntimeError(f"Unexpected Gemini response:\n{data}")

    # ---------------- ANTHROPIC ----------------
    if not settings.anthropic_api_key:
        raise LLMNotConfigured(
            "ANTHROPIC_API_KEY is not set. Add it to backend/.env (see .env.example)."
        )

    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    payload = {
        "model": settings.anthropic_model,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [
            {
                "role": "user",
                "content": user,
            }
        ],
    }

    async with httpx.AsyncClient(timeout=45) as client:
        resp = await client.post(
            ANTHROPIC_URL,
            headers=headers,
            json=payload,
        )

        resp.raise_for_status()
        data = resp.json()

        return "".join(
            block["text"]
            for block in data["content"]
            if block.get("type") == "text"
        )


def _strip_code_fences(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned


def parse_json_response(raw: str) -> Dict[str, Any]:
    """
    Best-effort JSON parse of an LLM response.
    """
    cleaned = _strip_code_fences(raw)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    return {}


def parse_agent_json(raw: str, agent_name: str) -> Dict[str, Any]:
    data = parse_json_response(raw)

    return {
        "agent_name": agent_name,
        "message": data.get("message") or raw.strip() or "(no response)",
        "action": data.get("action") or {
            "type": "none",
            "requires_approval": False,
        },
    }