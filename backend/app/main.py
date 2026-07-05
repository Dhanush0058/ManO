from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import agents, finance, health, orchestrator, tasks
from app.config import settings
from app.models.database import init_db

app = FastAPI(title="ManO API", version="0.1.0")

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


app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(orchestrator.router, prefix="/api", tags=["orchestrator"])
app.include_router(tasks.router, prefix="/api", tags=["tasks"])
app.include_router(agents.router, prefix="/api", tags=["agents"])
app.include_router(finance.router, prefix="/api", tags=["finance"])
