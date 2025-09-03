from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from middleware.db import SessionLocal
from middleware.models import Wallet, LedgerEntry
from .server import dev_auth


router = APIRouter(prefix="/v1/wallets", tags=["wallets"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{user_id}")
def get_wallets(user_id: int, _: bool = Depends(dev_auth), db: Session = Depends(get_db)):
    rows = db.query(Wallet).filter_by(user_id=user_id).all()
    return {
        "user_id": user_id,
        "wallets": [
            {"currency": r.currency, "balance_cents": r.balance_cents, "low_threshold_cents": r.low_threshold_cents}
            for r in rows
        ],
    }


@router.get("/{user_id}/ledger")
def get_ledger(user_id: int, limit: int = Query(20, gt=0, le=200), _: bool = Depends(dev_auth), db: Session = Depends(get_db)):
    rows = (
        db.query(LedgerEntry)
        .join(Wallet, Wallet.id == LedgerEntry.wallet_id)
        .filter(Wallet.user_id == user_id)
        .order_by(LedgerEntry.id.desc())
        .limit(limit)
        .all()
    )
    return {
        "user_id": user_id,
        "entries": [
            {
                "amount_cents": r.amount_cents,
                "currency": r.currency,
                "reason": r.reason,
                "created_at": r.created_at.isoformat(),
                "meta": r.meta,
            }
            for r in rows
        ],
    }

