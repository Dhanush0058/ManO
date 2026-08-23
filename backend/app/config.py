import os
from dotenv import load_dotenv

load_dotenv(override=True)


class Settings:
    # ---------- LLM Provider ----------
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini").lower()

    # ---------- Gemini ----------
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # ---------- OpenAI ----------
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # ---------- Groq ----------
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

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


settings = Settings()