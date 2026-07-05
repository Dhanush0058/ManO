from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Approval(Base):
    """A high-stakes action proposed by an agent, held for founder sign-off.

    This is the 'human-in-the-loop safety gate' from the architecture: agents
    never send emails, sign documents, or move money on their own — they
    create one of these rows instead, and nothing happens until the founder
    approves it via POST /api/tasks/{id}/approve.
    """

    __tablename__ = "approvals"

    id = Column(Integer, primary_key=True)
    agent_name = Column(String, nullable=False)
    action_type = Column(String, nullable=False, default="generic")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="pending")  # pending | executed | rejected
    result = Column(Text, nullable=True)  # what the mock tool returned once executed
    created_at = Column(DateTime, default=utcnow)
    resolved_at = Column(DateTime, nullable=True)


class AuditLogEntry(Base):
    """Immutable log of every agent decision and founder action. Nothing is
    ever updated or deleted from this table — only appended to."""

    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    actor = Column(String, nullable=False)
    action = Column(String, nullable=False)
    detail = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=utcnow)


class FinanceSnapshot(Base):
    """Latest known runway/burn figures. Seeded with placeholder numbers —
    real values would come from a Plaid (or similar) integration, which
    isn't wired up yet. See app/agents/tools.py for where that would plug in.
    """

    __tablename__ = "finance_snapshot"

    id = Column(Integer, primary_key=True)
    runway_months = Column(Integer, nullable=False)
    burn_rate_usd = Column(Integer, nullable=False)
    updated_at = Column(DateTime, default=utcnow)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    try:
        if session.query(FinanceSnapshot).count() == 0:
            session.add(FinanceSnapshot(runway_months=8, burn_rate_usd=45000, updated_at=utcnow()))
            session.commit()
    finally:
        session.close()


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
