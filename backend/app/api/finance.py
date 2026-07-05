from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.database import FinanceSnapshot, get_session
from app.models.schemas import FinanceSnapshotOut

router = APIRouter()


@router.get("/finance/snapshot", response_model=FinanceSnapshotOut)
def finance_snapshot(session: Session = Depends(get_session)):
    row = session.query(FinanceSnapshot).order_by(FinanceSnapshot.updated_at.desc()).first()
    if not row:
        raise HTTPException(status_code=404, detail="No finance snapshot yet")
    return row
