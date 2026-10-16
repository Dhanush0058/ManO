from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agents, finance, health, orchestrator, tasks, endpoints, twilio_voice, space
from app.config import settings
from app.models.database import init_db

app = FastAPI(title="ManO API & SpaceOS", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    print("[Startup config] twiml_url:", settings.twilio_twiml_url)
    print("[Startup config] webhook_base:", settings.twilio_webhook_base_url)


@app.get("/")
def root() -> dict[str, str]:
    return {"status": "ok", "message": "ManO API with SpaceOS Intelligence is running"}


app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(orchestrator.router, prefix="/api", tags=["orchestrator"])
app.include_router(tasks.router, prefix="/api", tags=["tasks"])
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(finance.router, prefix="/api", tags=["finance"])
app.include_router(endpoints.router, prefix="/api")
app.include_router(twilio_voice.router, prefix="/api")
app.include_router(space.router, prefix="/api")
