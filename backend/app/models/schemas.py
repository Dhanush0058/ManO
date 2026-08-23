from datetime import datetime, date
from typing import List, Optional
from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    query: str


class AgentResponseOut(BaseModel):
    agent_name: str
    message: str


class ApprovalOut(BaseModel):
    id: int = Field(..., serialization_alias="id")
    agent_name: str = Field(..., serialization_alias="agent_name")
    action_type: str = Field(..., serialization_alias="action_type")
    title: str = Field(..., serialization_alias="title")
    description: str
    status: str
    result: Optional[str] = None
    created_at: datetime = Field(..., serialization_alias="created_at")
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Handle conversion from SQLAlchemy model custom fields to legacy API field names
        if hasattr(obj, "approval_id"):
            legacy_obj = {
                "id": obj.approval_id,
                "agent_name": obj.agent,
                "action_type": obj.action,
                "title": obj.action,
                "description": obj.description or "",
                "status": obj.status,
                "result": obj.result,
                "created_at": obj.timestamp,
                "resolved_at": obj.resolved_at
            }
            return super().model_validate(legacy_obj, *args, **kwargs)
        return super().model_validate(obj, *args, **kwargs)


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
    permissions: List[str] = []


# --- New schemas for FounderOS Tables ---

class CompanyOut(BaseModel):
    company_id: int
    name: str
    industry: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    cash_balance: float
    monthly_burn: float
    created_at: datetime

    class Config:
        from_attributes = True


class EmployeeOut(BaseModel):
    employee_id: int
    company_id: int
    name: str
    role: str
    department: Optional[str] = None
    salary: float
    joining_date: date
    status: str

    class Config:
        from_attributes = True


class CandidateOut(BaseModel):
    candidate_id: int
    name: str
    email: str
    phone: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[float] = None
    expected_salary: Optional[float] = None
    location: Optional[str] = None
    resume: Optional[str] = None
    status: str
    match_score: int

    class Config:
        from_attributes = True


class JobOut(BaseModel):
    job_id: int
    title: str
    skills: Optional[str] = None
    experience: Optional[str] = None
    salary_budget: Optional[float] = None
    location: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class LeadOut(BaseModel):
    lead_id: int
    company_name: str
    industry: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    lead_score: int
    status: str
    pain_point: Optional[str] = None
    last_contacted: Optional[datetime] = None

    class Config:
        from_attributes = True


class CustomerOut(BaseModel):
    customer_id: int
    company_name: str
    plan: Optional[str] = None
    revenue: float
    status: str

    class Config:
        from_attributes = True


class FinancialTransactionOut(BaseModel):
    transaction_id: int
    type: str
    category: Optional[str] = None
    amount: float
    description: Optional[str] = None
    date: datetime

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    document_id: int
    type: str
    title: str
    content: Optional[str] = None
    status: str
    created_by: Optional[str] = None
    approval_status: str

    class Config:
        from_attributes = True


class TaskOut(BaseModel):
    task_id: int
    agent: str
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuditLogEntryOut(BaseModel):
    log_id: int
    timestamp: datetime
    agent: str
    action: str
    input: Optional[str] = None
    output: Optional[str] = None
    status: str

    class Config:
        from_attributes = True


class DashboardStatsOut(BaseModel):
    cash_balance: float
    monthly_burn: float
    runway_months: float
    employees_count: int
    open_positions: int
    active_leads: int
    customers_count: int
    pending_approvals: int
    active_tasks: int


class SettingsModeRequest(BaseModel):
    mode: str  # "live" | "demo"


class SettingsModeOut(BaseModel):
    mode: str
