import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # ---------- LLM Provider ----------
    llm_provider: str = os.getenv("LLM_PROVIDER", "gemini").lower()

    # ---------- Gemini ----------
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    # ---------- Anthropic ----------
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    anthropic_model: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5")

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