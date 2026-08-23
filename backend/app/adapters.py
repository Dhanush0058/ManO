from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.database import (
    Company, Employee, Candidate, Job, Lead,
    Customer, FinancialTransaction, Document, Task,
    Approval, AuditLogEntry, utcnow
)

class CRMAdapter:
    @staticmethod
    def get_leads(session: Session, status: Optional[str] = None, min_score: Optional[int] = None) -> List[Lead]:
        query = session.query(Lead)
        if status:
            query = query.filter(Lead.status == status)
        if min_score is not None:
            query = query.filter(Lead.lead_score >= min_score)
        return query.order_by(Lead.lead_score.desc()).all()

    @staticmethod
    def update_lead_status(session: Session, lead_id: int, status: str) -> Optional[Lead]:
        lead = session.get(Lead, lead_id)
        if lead:
            lead.status = status
            lead.last_contacted = utcnow()
            session.commit()
            session.refresh(lead)
        return lead

    @staticmethod
    def get_customers(session: Session, status: str = "active") -> List[Customer]:
        return session.query(Customer).filter(Customer.status == status).all()


class HRAdapter:
    @staticmethod
    def search_candidates(
        session: Session, 
        skills_query: Optional[str] = None, 
        max_salary: Optional[float] = None,
        location: Optional[str] = None
    ) -> List[Candidate]:
        query = session.query(Candidate)
        if skills_query:
            # Simple case-insensitive contains match
            query = query.filter(Candidate.skills.ilike(f"%{skills_query}%"))
        if max_salary is not None:
            query = query.filter(Candidate.expected_salary <= max_salary)
        if location:
            query = query.filter(Candidate.location.ilike(f"%{location}%"))
        return query.order_by(Candidate.match_score.desc()).all()

    @staticmethod
    def update_candidate_status(session: Session, candidate_id: int, status: str) -> Optional[Candidate]:
        candidate = session.get(Candidate, candidate_id)
        if candidate:
            candidate.status = status
            session.commit()
            session.refresh(candidate)
        return candidate

    @staticmethod
    def get_open_jobs(session: Session) -> List[Job]:
        return session.query(Job).filter(Job.status == "open").all()


class FinanceAdapter:
    @staticmethod
    def get_financial_summary(session: Session) -> Dict[str, Any]:
        company = session.query(Company).first()
        if not company:
            return {"cash_balance": 0.0, "monthly_burn": 0.0, "runway_months": 0.0}
        
        # Calculate runway
        runway = 0.0
        if company.monthly_burn > 0:
            runway = company.cash_balance / company.monthly_burn
            
        return {
            "cash_balance": company.cash_balance,
            "monthly_burn": company.monthly_burn,
            "runway_months": round(runway, 1)
        }

    @staticmethod
    def verify_budget(session: Session, amount: float) -> bool:
        company = session.query(Company).first()
        if not company:
            return False
        return company.cash_balance >= amount

    @staticmethod
    def add_transaction(
        session: Session, 
        tx_type: str, 
        category: str, 
        amount: float, 
        description: str
    ) -> FinancialTransaction:
        tx = FinancialTransaction(
            type=tx_type,
            category=category,
            amount=amount,
            description=description,
            date=utcnow()
        )
        session.add(tx)
        
        # Update company balance
        company = session.query(Company).first()
        if company:
            if tx_type == "revenue":
                company.cash_balance += amount
            else:
                company.cash_balance -= amount
                
        session.commit()
        session.refresh(tx)
        return tx


class DocumentAdapter:
    @staticmethod
    def draft_document(
        session: Session, 
        doc_type: str, 
        title: str, 
        content: str, 
        created_by: str = "Legal Agent"
    ) -> Document:
        doc = Document(
            type=doc_type,
            title=title,
            content=content,
            status="draft",
            created_by=created_by,
            approval_status="pending"
        )
        session.add(doc)
        session.commit()
        session.refresh(doc)
        return doc

    @staticmethod
    def get_documents(session: Session) -> List[Document]:
        return session.query(Document).order_by(Document.document_id.desc()).all()

    @staticmethod
    def update_approval_status(session: Session, doc_id: int, status: str) -> Optional[Document]:
        doc = session.get(Document, doc_id)
        if doc:
            doc.approval_status = status
            if status == "signed":
                doc.status = "approved"
            session.commit()
            session.refresh(doc)
        return doc


class CalendarAdapter:
    @staticmethod
    def schedule_meeting(title: str, description: str, date_time: Optional[datetime] = None) -> str:
        meet_time = date_time or (datetime.now() + timedelta(days=1))
        return f"Successfully scheduled meeting: '{title}' on {meet_time.strftime('%Y-%m-%d %H:%M UTC')}. Description: {description}"


class OutreachAdapter:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str) -> str:
        return f"Email sent successfully to {to_email} with subject '{subject}'."

    @staticmethod
    def send_whatsapp(to_phone: str, message: str) -> str:
        return f"WhatsApp message sent successfully to {to_phone}."

    @staticmethod
    def trigger_calling_agent(to_phone: str, goal: str) -> str:
        # Calling Agent is disconnected as requested by user
        return f"Outreach status: Calling provider not connected. Unable to place outbound call to {to_phone} for goal: '{goal}'."
