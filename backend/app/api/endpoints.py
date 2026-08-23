from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.models.database import (
    get_session, Company, Employee, Candidate, Job, Lead,
    Customer, Document, Task, Approval, AuditLogEntry
)
from app.models.schemas import (
    DashboardStatsOut, LeadOut, CandidateOut, DocumentOut,
    AuditLogEntryOut, SettingsModeOut, SettingsModeRequest,
    CompanyOut, EmployeeOut, JobOut, CustomerOut, TaskOut
)
from app.models.seed import seed_demo_company
import app.agents.orchestrator

router = APIRouter()


@router.get("/dashboard/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(session: Session = Depends(get_session)):
    company = session.query(Company).first()
    if not company:
        # Default fallback if not seeded
        return DashboardStatsOut(
            cash_balance=0.0,
            monthly_burn=0.0,
            runway_months=0.0,
            employees_count=0,
            open_positions=0,
            active_leads=0,
            customers_count=0,
            pending_approvals=0,
            active_tasks=0
        )
        
    employees_count = session.query(Employee).count()
    open_positions = session.query(Job).filter(Job.status == "open").count()
    # Active leads: new, contacted, qualified
    active_leads = session.query(Lead).filter(Lead.status.in_(["new", "contacted", "qualified"])).count()
    customers_count = session.query(Customer).filter(Customer.status == "active").count()
    pending_approvals = session.query(Approval).filter(Approval.status == "pending").count()
    # Active tasks: pending or running
    active_tasks = session.query(Task).filter(Task.status.in_(["pending", "running"])).count()
    
    runway = 0.0
    if company.monthly_burn > 0:
        runway = company.cash_balance / company.monthly_burn

    return DashboardStatsOut(
        cash_balance=company.cash_balance,
        monthly_burn=company.monthly_burn,
        runway_months=round(runway, 1),
        employees_count=employees_count,
        open_positions=open_positions,
        active_leads=active_leads,
        customers_count=customers_count,
        pending_approvals=pending_approvals,
        active_tasks=active_tasks
    )


@router.get("/leads", response_model=List[LeadOut])
def get_leads(session: Session = Depends(get_session)):
    return session.query(Lead).order_by(Lead.lead_score.desc()).all()


@router.get("/candidates", response_model=List[CandidateOut])
def get_candidates(session: Session = Depends(get_session)):
    return session.query(Candidate).order_by(Candidate.match_score.desc()).all()


@router.get("/documents", response_model=List[DocumentOut])
def get_documents(session: Session = Depends(get_session)):
    return session.query(Document).order_by(Document.document_id.desc()).all()


@router.get("/audit-logs", response_model=List[AuditLogEntryOut])
def get_audit_logs(session: Session = Depends(get_session)):
    return session.query(AuditLogEntry).order_by(AuditLogEntry.timestamp.desc()).all()


@router.get("/settings/mode", response_model=SettingsModeOut)
def get_settings_mode():
    return SettingsModeOut(mode=app.agents.orchestrator.AI_MODE)


@router.post("/settings/mode", response_model=SettingsModeOut)
def update_settings_mode(payload: SettingsModeRequest):
    mode = payload.mode.lower()
    if mode not in ["live", "demo"]:
        raise HTTPException(status_code=400, detail="Mode must be 'live' or 'demo'")
    app.agents.orchestrator.AI_MODE = mode
    return SettingsModeOut(mode=app.agents.orchestrator.AI_MODE)


@router.get("/integrations")
def get_integrations_status():
    return [
        {"name": "CRM", "status": "Connected", "last_sync": "30 seconds ago"},
        {"name": "HR / ATS", "status": "Connected", "last_sync": "30 seconds ago"},
        {"name": "Finance", "status": "Connected", "last_sync": "30 seconds ago"},
        {"name": "Documents", "status": "Connected", "last_sync": "30 seconds ago"},
        {"name": "Calendar", "status": "Connected", "last_sync": "30 seconds ago"},
        {"name": "AI Calling Agent", "status": "Not Connected", "last_sync": "Never"}
    ]


@router.post("/database/seed")
def force_db_seed(session: Session = Depends(get_session)):
    try:
        seed_demo_company(session)
        return {"status": "success", "message": "Database seeded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed database: {str(e)}")


# Extra endpoints for specific tables if needed by sub-desks

@router.get("/jobs", response_model=List[JobOut])
def get_jobs(session: Session = Depends(get_session)):
    return session.query(Job).all()


@router.get("/employees", response_model=List[EmployeeOut])
def get_employees(session: Session = Depends(get_session)):
    return session.query(Employee).all()


@router.get("/customers-list", response_model=List[CustomerOut])
def get_customers_list(session: Session = Depends(get_session)):
    return session.query(Customer).all()


@router.get("/tasks-list", response_model=List[TaskOut])
def get_tasks_list(session: Session = Depends(get_session)):
    return session.query(Task).order_by(Task.created_at.desc()).all()


from fastapi.responses import StreamingResponse
import json
import asyncio
from datetime import datetime

@router.get("/live-events")
async def live_events_stream():
    async def event_generator():
        events = [
            ("TaskCreated", "Goal received from founder"),
            ("AgentStarted", "Orchestrator created execution plan"),
            ("AgentStarted", "GTM Agent activated"),
            ("AgentStarted", "Hiring Agent activated"),
            ("AgentStarted", "Finance Agent activated"),
            ("LeadQualified", "GTM Agent retrieved and scored 250 leads in Hyderabad"),
            ("CandidateShortlisted", "Hiring Agent retrieved 50 candidates and shortlisted 8"),
            ("DataUpdated", "Finance Agent checked budget and calculated runway (6.7 months)"),
            ("DocumentGenerated", "Legal Agent generated Employment Agreement and NDA drafts"),
            ("ApprovalRequired", "System marked high-risk legal and outreach tasks as Awaiting Approval")
        ]
        for event, msg in events:
            data = {"event": event, "message": msg, "timestamp": datetime.now().strftime("%H:%M:%S")}
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(1.2)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")
