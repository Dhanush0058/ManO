from datetime import datetime, timezone, date
from sqlalchemy import Column, DateTime, Integer, String, Text, Float, Date as SqlDate, ForeignKey, Numeric, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(100))
    location = Column(String(255))
    description = Column(Text)
    cash_balance = Column(Float, default=0.0)
    monthly_burn = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    employees = relationship("Employee", back_populates="company", cascade="all, delete-orphan")


class Employee(Base):
    __tablename__ = "employees"

    employee_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    role = Column(String(100), nullable=False)
    department = Column(String(100))
    salary = Column(Float, nullable=False)
    joining_date = Column(SqlDate, nullable=False)
    status = Column(String(50), default="active")  # active | on_leave | terminated

    company = relationship("Company", back_populates="employees")


class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    skills = Column(Text)
    experience = Column(Float)
    expected_salary = Column(Float)
    location = Column(String(255))
    resume = Column(Text)
    status = Column(String(50), default="applied")  # applied | screened | interviewed | offered | rejected
    match_score = Column(Integer, default=0)


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    skills = Column(Text)
    experience = Column(String(100))
    salary_budget = Column(Float)
    location = Column(String(255))
    status = Column(String(50), default="open")  # open | closed | filled


class Lead(Base):
    __tablename__ = "leads"

    lead_id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    industry = Column(String(100))
    location = Column(String(255))
    phone = Column(String(50))
    email = Column(String(255))
    lead_score = Column(Integer, default=0)
    status = Column(String(50), default="new")  # new | contacted | qualified | converted | lost
    pain_point = Column(Text)
    last_contacted = Column(DateTime(timezone=True))


class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    plan = Column(String(100))  # Starter | Growth | Enterprise
    revenue = Column(Float, default=0.0)
    status = Column(String(50), default="active")  # active | churned


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False)  # revenue | expense
    category = Column(String(100))  # marketing | payroll | subscription | software | office
    amount = Column(Float, nullable=False)
    description = Column(Text)
    date = Column(DateTime(timezone=True), default=utcnow)


class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, index=True)
    type = Column(String(100), nullable=False)  # NDA | Employment Agreement | IP Assignment
    title = Column(String(255), nullable=False)
    content = Column(Text)
    status = Column(String(50), default="draft")  # draft | pending_review | approved
    created_by = Column(String(100))  # Legal Agent
    approval_status = Column(String(50), default="pending")  # pending | signed | rejected


class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    agent = Column(String(100), nullable=False)  # Finance | Hiring | Legal | GTM
    title = Column(String(255), nullable=False)
    description = Column(Text)
    priority = Column(String(50), default="medium")  # low | medium | high
    status = Column(String(50), default="pending")  # pending | running | completed | failed | awaiting_approval
    created_at = Column(DateTime(timezone=True), default=utcnow)
    completed_at = Column(DateTime(timezone=True))


class Approval(Base):
    __tablename__ = "approvals"

    approval_id = Column(Integer, primary_key=True, index=True)
    action = Column(String(255), nullable=False)  # e.g., 'Execute Payment'
    agent = Column(String(100), nullable=False)  # Finance | Hiring | Legal | GTM
    risk_level = Column(String(50), nullable=False)  # Low | Medium | High
    description = Column(Text)
    status = Column(String(50), default="pending")  # pending | approved | rejected | executed
    approved_by = Column(String(100))  # Founder
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    
    # Extra columns to support mock tool execution response
    result = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class AuditLogEntry(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow)
    agent = Column(String(100), nullable=False)  # Orchestrator | System | GTM | Hiring | Finance | Legal
    action = Column(String(255), nullable=False)
    input = Column(Text)
    output = Column(Text)
    status = Column(String(50), default="success")


from app.models.space_models import SpaceEvent, SpaceIncident

def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        if session.query(Company).count() == 0:
            from app.models.seed import seed_demo_company
            seed_demo_company(session)
    except Exception as e:
        print(f"Database seed check skipped/failed: {e}")
    finally:
        session.close()


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
