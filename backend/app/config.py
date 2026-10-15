import os
from dotenv import load_dotenv

load_dotenv(override=True)


class Settings:

    # ---------- Ollama (Local) ----------
    ollama_url: str = os.getenv("OLLAMA_URL", "http://localhost:11434").strip()
    ollama_model: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b").strip()
    # ---------- LLM Provider ----------
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini").lower()

    # ---------- Gemini ----------
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # ---------- OpenAI ----------
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # ---------- OpenRouter ----------
    openrouter_api_key: str = os.getenv("OPENROUTER_API_KEY", "")
    openrouter_model: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    # ---------- Groq ----------
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")

    # ---------- NVIDIA NIM ----------
    nvidia_api_key: str = os.getenv("NVIDIA_API_KEY", "")
    nvidia_model: str = os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-70b-instruct")

    # ---------- Database ----------
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./manO.db",
    )

    # ---------- CORS ----------
    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173",
        ).split(",")
    ]

    # ---------- Twilio Voice Call Service ----------
    twilio_account_sid: str = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    twilio_auth_token: str = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    twilio_phone_number: str = os.getenv("TWILIO_PHONE_NUMBER", "").strip()
    twilio_webhook_base_url: str = os.getenv("TWILIO_WEBHOOK_BASE_URL", "http://localhost:8000").strip()
    twilio_twiml_url: str = os.getenv("TWILIO_TWIML_URL", "https://handler.twilio.com/twiml/EHc96398090a3969120e038fab22b4e16e").strip()


settings = Settings()
# Reload trigger comment v4