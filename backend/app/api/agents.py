from fastapi import APIRouter

from app.models.schemas import AgentMeta

router = APIRouter()

AGENTS_META = [
    AgentMeta(name="finance", display_name="Finance Agent", status="active", description="Runway, margins, budgets, burn rate."),
    AgentMeta(name="hiring", display_name="Hiring Agent", status="active", description="Job descriptions, screening, offers."),
    AgentMeta(name="legal", display_name="Legal Agent", status="active", description="Contracts, compliance, risk review."),
    AgentMeta(name="gtm", display_name="GTM Agent", status="active", description="Launch plans, pricing, positioning."),
    AgentMeta(name="research", display_name="Research Agent", status="active", description="Market research, competitor intel."),
]


@router.get("/agents", response_model=list[AgentMeta])
def list_agents():
    return AGENTS_META
