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


from fastapi import UploadFile, File
from fastapi.responses import StreamingResponse
import json
import asyncio
import httpx
from datetime import datetime
from app.config import settings

@router.get("/live-events")
async def live_events_stream():
    async def event_generator():
        events = [
            ("TelemetryIngested", "Flight Intelligence received orbital telemetry stream from ISTRAC Ground Station"),
            ("OrchestratorActive", "SpaceXOS Flight Intelligence initialized multi-agent decision graph"),
            ("AgentStarted", "Telemetry Detection Agent evaluating sensor streams against nominal envelopes"),
            ("AnomalyCorroborated", "Incident Diagnostics Agent cross-referencing orbital ephemeris and space weather"),
            ("RiskEvaluated", "Risk Assessment Agent computing collision probability and flight safety envelope"),
            ("CatalogChecked", "ISRO Satellite Registry verified for active constellation orbit parameters"),
            ("DirectiveDrafted", "Flight Director Agent generated maneuver sequence & voice briefing"),
            ("ApprovalRequired", "Flight Operations Approval required before commanding spacecraft bus")
        ]
        for event, msg in events:
            data = {"event": event, "message": msg, "timestamp": datetime.now().strftime("%H:%M:%S")}
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(1.2)
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Transcribe uploaded audio recordings using Groq's high-speed Whisper AI."""
    if not settings.groq_api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY is not configured")

    contents = await file.read()
    filename = file.filename or "recording.webm"

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.groq_api_key}"},
            files={"file": (filename, contents, file.content_type or "audio/webm")},
            data={"model": "whisper-large-v3-turbo"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Whisper transcription failed: {response.text}")
        data = response.json()
        return {"text": data.get("text", "").strip()}


from pydantic import BaseModel
from app.adapters import EntityLookupAdapter

class EmailSendRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    sender: str = "FounderOS Orchestrator"


@router.get("/email/lookup")
def lookup_email_entity(query: str, session: Session = Depends(get_session)):
    """Auto-recognize and compare an email or contact against the database."""
    return EntityLookupAdapter.identify_entity_by_email_or_name(session, query)


@router.post("/email/send")
async def send_email_mcp_endpoint(payload: EmailSendRequest, session: Session = Depends(get_session)):
    """Deliver an email via MCP Email Protocol with automatic database entity recognition."""
    entity_info = EntityLookupAdapter.identify_entity_by_email_or_name(session, payload.to_email)
    
    # Execute MCP tool
    from app.agents.tools import execute_tool
    tool_result = await execute_tool("send_email", payload.model_dump())
    
    # Append to audit logs
    session.add(
        AuditLogEntry(
            agent="MCP Email Server",
            action="send_email",
            input=f"To: {payload.to_email} | Subject: {payload.subject}",
            output=f"Recipient: {entity_info.get('summary', 'Unknown')} — {tool_result}",
            status="success",
            timestamp=datetime.now(timezone.utc),
        )
    )
    session.commit()
    
    return {
        "status": "delivered",
        "entity": entity_info,
        "mcp_result": tool_result
    }


