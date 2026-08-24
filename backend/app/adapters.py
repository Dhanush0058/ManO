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


class EntityLookupAdapter:
    @staticmethod
    def identify_entity_by_email_or_name(session: Session, query: str) -> Dict[str, Any]:
        """
        Auto-recognizes and compares an email address or person's name against the database.
        Checks Candidates, Leads, Employees, and Customers.
        """
        clean_query = query.strip().lower()
        if not clean_query:
            return {"found": False, "match_type": "Unknown", "name": "None", "email": "", "details": "Empty query"}

        # 1. Search Employees / Managers first (for exact role attribution)
        employee = session.query(Employee).filter(
            or_(
                Employee.email.ilike(f"%{clean_query}%"),
                Employee.name.ilike(f"%{clean_query}%"),
                Employee.role.ilike(f"%{clean_query}%"),
                Employee.department.ilike(f"%{clean_query}%")
            )
        ).first()

        if employee:
            role_title = employee.role
            dept = employee.department or "Staff"
            match_type = "Employee"
            
            if "hiring" in role_title.lower() or "hiring" in dept.lower() or "dhanush" in employee.name.lower() or "dhanush" in (employee.email or "").lower():
                match_type = "Hiring Manager"
            elif "finance" in role_title.lower() or "finance" in dept.lower() or "ajay" in employee.name.lower() or "ajay" in (employee.email or "").lower():
                match_type = "Finance Manager"
            elif "legal" in role_title.lower() or "legal" in dept.lower() or "prashanth" in employee.name.lower() or "prashanth" in (employee.email or "").lower():
                match_type = "Legal Manager"

            return {
                "found": True,
                "match_type": match_type,
                "id": employee.employee_id,
                "name": employee.name,
                "email": employee.email or f"{employee.name.lower().replace(' ', '.')}@fitflow.ai",
                "role": employee.role,
                "department": employee.department,
                "status": employee.status,
                "location": "Core Startup Leadership",
                "details": f"{match_type} (Name: {employee.name}, Role: {employee.role}, Dept: {employee.department}, Salary: ₹{employee.salary:,.0f})",
                "summary": f"👔 {match_type}: {employee.name} ({employee.email}) — Role: {employee.role} in {employee.department}"
            }

        # 2. Search Candidates
        candidate = session.query(Candidate).filter(
            or_(
                Candidate.email.ilike(f"%{clean_query}%"),
                Candidate.name.ilike(f"%{clean_query}%")
            )
        ).first()

        if candidate:
            salary_str = f"₹{candidate.expected_salary:,.0f}" if candidate.expected_salary else "N/A"
            return {
                "found": True,
                "match_type": "Candidate",
                "id": candidate.candidate_id,
                "name": candidate.name,
                "email": candidate.email,
                "status": candidate.status,
                "location": candidate.location or "N/A",
                "details": f"Candidate (Skills: {candidate.skills}, Exp: {candidate.experience} yrs, Match: {candidate.match_score}%, Salary: {salary_str})",
                "summary": f"👤 Candidate: {candidate.name} ({candidate.email}) — Skills: {candidate.skills}, Status: {candidate.status}"
            }

        # 3. Search Leads (GTM Prospects)
        lead = session.query(Lead).filter(
            or_(
                Lead.email.ilike(f"%{clean_query}%"),
                Lead.company_name.ilike(f"%{clean_query}%")
            )
        ).first()

        if lead:
            return {
                "found": True,
                "match_type": "Lead",
                "id": lead.lead_id,
                "name": lead.company_name,
                "email": lead.email or "N/A",
                "status": lead.status,
                "location": lead.location or "N/A",
                "details": f"Sales Lead (Company: {lead.company_name}, Industry: {lead.industry}, Score: {lead.lead_score}, Pain: {lead.pain_point})",
                "summary": f"🏢 Sales Lead: {lead.company_name} ({lead.email}) — Industry: {lead.industry}, Lead Score: {lead.lead_score}"
            }

        # 4. Search Customers
        customer = session.query(Customer).filter(
            Customer.company_name.ilike(f"%{clean_query}%")
        ).first()

        if customer:
            return {
                "found": True,
                "match_type": "Customer",
                "id": customer.customer_id,
                "name": customer.company_name,
                "email": f"billing@{customer.company_name.lower().replace(' ', '')}.com",
                "status": customer.status,
                "location": "Active Client",
                "details": f"Customer (Plan: {customer.plan}, Revenue: ₹{customer.revenue:,.0f}/mo)",
                "summary": f"⭐ Active Client: {customer.company_name} (Plan: {customer.plan})"
            }

        # 5. External / Unregistered Contact
        return {
            "found": False,
            "match_type": "External Recipient",
            "name": query,
            "email": query if "@" in query else f"{clean_query.replace(' ', '')}@example.com",
            "status": "unregistered",
            "location": "External",
            "details": "Not found in database. Handled as a new external recipient.",
            "summary": f"🌐 External Recipient: {query} (New Contact — not in database)"
        }


class CalendarAdapter:
    @staticmethod
    def schedule_meeting(title: str, description: str, date_time: Optional[datetime] = None) -> str:
        meet_time = date_time or (datetime.now() + timedelta(days=1))
        return f"Successfully scheduled meeting: '{title}' on {meet_time.strftime('%Y-%m-%d %H:%M UTC')}. Description: {description}"


class OutreachAdapter:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str, session: Optional[Session] = None) -> Dict[str, Any]:
        entity_info = {"found": False, "summary": f"External recipient {to_email}"}
        if session:
            entity_info = EntityLookupAdapter.identify_entity_by_email_or_name(session, to_email)

        return {
            "status": "delivered",
            "to_email": to_email,
            "subject": subject,
            "body": body,
            "entity": entity_info,
            "message": f"Email successfully delivered to {to_email} [{entity_info.get('summary')}]."
        }

    @staticmethod
    def send_whatsapp(to_phone: str, message: str) -> str:
        return f"WhatsApp message sent successfully to {to_phone}."

    @staticmethod
    def trigger_calling_agent(to_phone: str, goal: str) -> str:
        return f"Outreach status: Calling provider not connected. Unable to place outbound call to {to_phone} for goal: '{goal}'."
