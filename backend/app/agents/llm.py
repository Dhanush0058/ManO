import json
import re
from typing import Any, Dict
import httpx

from app.config import settings

OPENAI_URL = "https://api.openai.com/v1/chat/completions"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"


class LLMNotConfigured(RuntimeError):
    pass


async def call_llm_gemini(system: str, user: str, max_tokens: int = 1024) -> str:
    key = settings.gemini_api_key.strip()
    if not key:
        raise LLMNotConfigured("GEMINI_API_KEY is not set.")

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent"
        f"?key={key}"
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

    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()

        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            raise RuntimeError(f"Unexpected Gemini response:\n{data}")


async def call_llm_openai(system: str, user: str, max_tokens: int = 1024) -> str:
    key = settings.openai_api_key.strip()
    if not key:
        raise LLMNotConfigured("OPENAI_API_KEY is not set.")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.openai_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.post(OPENAI_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def call_llm_openrouter(system: str, user: str, max_tokens: int = 1024) -> str:
    key = settings.openrouter_api_key.strip()
    if not key or key == "your-openrouter-api-key-here":
        raise LLMNotConfigured("OPENROUTER_API_KEY is not set.")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "ManO",
    }

    payload = {
        "model": settings.openrouter_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def call_llm_groq(system: str, user: str, max_tokens: int = 1024) -> str:
    key = settings.groq_api_key.strip()
    if not key:
        raise LLMNotConfigured("GROQ_API_KEY is not set.")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=25.0) as client:
        resp = await client.post(GROQ_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def call_llm_nvidia(system: str, user: str, max_tokens: int = 1024) -> str:
    key = settings.nvidia_api_key.strip()
    if not key:
        raise LLMNotConfigured("NVIDIA_API_KEY is not set.")

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": settings.nvidia_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "max_tokens": max_tokens,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(NVIDIA_URL, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]



async def call_llm_ollama(system: str, user: str, max_tokens: int = 1024) -> str:
    url = f"{settings.ollama_url.rstrip('/')}/api/generate"
    prompt = f"{system}\n\nUser Request: {user}"
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": max_tokens,
            "temperature": 0.7,
        }
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "").strip()

async def call_llm(system: str, user: str, max_tokens: int = 1024) -> str:
    """
    Resilient Multi-Model LLMRouter failover system.
    Determines order of attempt starting with the primary provider:
    OpenRouter -> Gemini -> OpenAI -> Groq -> Nvidia
    and automatically falls back to alternative models on exceptions.
    """
    primary = settings.llm_provider
    
    # Establish priority list
    providers = ["gemini", "groq", "ollama", "openai", "openrouter", "nvidia"]
    if primary in providers:
        # Move primary to the front of the list
        providers.remove(primary)
        providers.insert(0, primary)

    last_error = None
    for provider in providers:
        # Check if the provider is actually configured (has a key)
        has_key = False
        if provider == "openrouter" and settings.openrouter_api_key.strip() not in {"", "your-openrouter-api-key-here"}:
            has_key = True
        elif provider == "gemini" and settings.gemini_api_key.strip():
            has_key = True
        elif provider == "openai" and settings.openai_api_key.strip():
            has_key = True
        elif provider == "ollama":
            has_key = True
        elif provider == "groq" and settings.groq_api_key.strip():
            has_key = True
        elif provider == "nvidia" and settings.nvidia_api_key.strip():
            has_key = True

        if not has_key:
            continue

        print(f"[LLMRouter] Routing query to: {provider.upper()}")
        try:
            if provider == "openrouter":
                return await call_llm_openrouter(system, user, max_tokens)
            elif provider == "gemini":
                return await call_llm_gemini(system, user, max_tokens)
            elif provider == "openai":
                return await call_llm_openai(system, user, max_tokens)
            elif provider == "ollama":
                return await call_llm_ollama(system, user, max_tokens)
            elif provider == "groq":
                return await call_llm_groq(system, user, max_tokens)
            elif provider == "nvidia":
                return await call_llm_nvidia(system, user, max_tokens)
        except Exception as e:
            print(f"[LLMRouter Warning] Provider {provider.upper()} failed: {e}")
            last_error = e

    # If we exited the loop, all configured providers failed
    print(f"[LLMRouter Fatal] All available providers failed. Last error: {last_error}")
    raise LLMNotConfigured("All configured LLM providers failed. Triggering Demo Simulation Mode.")


def _strip_code_fences(raw: str) -> str:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned).strip()
    return cleaned


def parse_json_response(raw: str) -> Dict[str, Any]:
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
            "payload": {}
        },
    }