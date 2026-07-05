from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class QueryRequest(BaseModel):
    query: str


class AgentResponseOut(BaseModel):
    agent_name: str
    message: str


class ApprovalOut(BaseModel):
    id: int
    agent_name: str
    action_type: str
    title: str
    description: str
    status: str
    result: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrchestratorResponse(BaseModel):
    agent_responses: List[AgentResponseOut]
    pending_approvals: List[ApprovalOut] = []


class FinanceSnapshotOut(BaseModel):
    runway_months: int
    burn_rate_usd: int
    updated_at: datetime

    class Config:
        from_attributes = True


class AgentMeta(BaseModel):
    name: str
    display_name: str
    status: str
    description: str
