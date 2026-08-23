from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.database import Company, get_session
from app.models.schemas import FinanceSnapshotOut

router = APIRouter()


@router.get("/finance/snapshot", response_model=FinanceSnapshotOut)
def finance_snapshot(session: Session = Depends(get_session)):
    company = session.query(Company).first()
    if not company:
        raise HTTPException(status_code=404, detail="No company finance snapshot found")
        
    runway = 0
    if company.monthly_burn > 0:
        runway = int(company.cash_balance / company.monthly_burn)
        
    return FinanceSnapshotOut(
        runway_months=runway,
        burn_rate_usd=int(company.monthly_burn),
        updated_at=company.created_at or datetime.now(timezone.utc)
    )
