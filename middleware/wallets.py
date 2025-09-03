from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy.orm import Session

from .db import SessionLocal
from .models import Wallet, LedgerEntry, User


@contextmanager
def session_scope() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def credit_wallet(user_id: int, currency: str, amount_cents: int, reason: str, meta: dict | None = None) -> None:
    currency = currency.upper()
    with session_scope() as s:
        # ensure user exists
        s.query(User).filter_by(id=user_id).one()
        wallet = s.query(Wallet).filter_by(user_id=user_id, currency=currency).first()
        if wallet is None:
            wallet = Wallet(user_id=user_id, currency=currency, balance_cents=0)
            s.add(wallet)
            s.flush()
        wallet.balance_cents += amount_cents
        entry = LedgerEntry(wallet_id=wallet.id, amount_cents=amount_cents, currency=currency, reason=reason, meta=meta or {})
        s.add(entry)


def debit_wallet(user_id: int, currency: str, amount_cents: int, reason: str, meta: dict | None = None) -> None:
    """Debit wallet by amount_cents (can go negative for refund completeness)."""
    currency = currency.upper()
    with session_scope() as s:
        # ensure user exists
        s.query(User).filter_by(id=user_id).one()
        wallet = s.query(Wallet).filter_by(user_id=user_id, currency=currency).first()
        if wallet is None:
            wallet = Wallet(user_id=user_id, currency=currency, balance_cents=0)
            s.add(wallet)
            s.flush()
        wallet.balance_cents -= amount_cents
        entry = LedgerEntry(wallet_id=wallet.id, amount_cents=-abs(amount_cents), currency=currency, reason=reason, meta=meta or {})
        s.add(entry)
