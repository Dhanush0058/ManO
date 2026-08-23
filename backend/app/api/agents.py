from fastapi import APIRouter
from app.models.schemas import AgentMeta

router = APIRouter()

AGENTS_META = [
    AgentMeta(
        name="finance", 
        display_name="Finance Agent", 
        status="active", 
        description="Runway, margins, budgets, burn rate.",
        permissions=["read_financial_data", "calculate_runway", "generate_forecast"]
    ),
    AgentMeta(
        name="hiring", 
        display_name="Hiring Agent", 
        status="active", 
        description="Job descriptions, screening, offers.",
        permissions=["search_candidates", "parse_resume", "shortlist_candidate", "generate_offer"]
    ),
    AgentMeta(
        name="legal", 
        display_name="Legal Agent", 
        status="active", 
        description="Contracts, compliance, risk review.",
        permissions=["read_documents", "draft_document", "identify_risk"]
    ),
    AgentMeta(
        name="gtm", 
        display_name="GTM Agent", 
        status="active", 
        description="Launch plans, pricing, positioning.",
        permissions=["read_leads", "score_leads", "create_campaign", "create_outreach_plan"]
    ),
    AgentMeta(
        name="research", 
        display_name="Research Agent", 
        status="active", 
        description="Market research, competitor intel.",
        permissions=["read_public_info", "general_qa"]
    ),
]


@router.get("/agents", response_model=list[AgentMeta])
def list_agents():
    return AGENTS_META
