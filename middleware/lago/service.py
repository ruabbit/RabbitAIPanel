from __future__ import annotations

import json
import logging
from typing import Optional

from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Usage
from ..models import Base
from ..models import BigInteger, Integer, String, DateTime, Boolean, mapped_column  # type: ignore
import datetime as dt

logger = logging.getLogger(__name__)


class LagoPayment(Base):
    __tablename__ = "lago_payments"
    id = mapped_column(Integer, primary_key=True)
    event_type = mapped_column(String(32))
    provider = mapped_column(String(32))
    provider_txn_id = mapped_column(String(128))
    order_id = mapped_column(String(64))
    amount_cents = mapped_column(BigInteger)
    currency = mapped_column(String(8), default="USD")
    status = mapped_column(String(32))
    user_id = mapped_column(Integer, nullable=True)
    team_id = mapped_column(Integer, nullable=True)
    request_id = mapped_column(String(64), nullable=True)
    meta = mapped_column(String, nullable=True)  # store as JSON string
    created_at = mapped_column(DateTime, default=dt.datetime.utcnow)


def _session() -> Session:
    return SessionLocal()


def ingest_payment_event(payload: dict) -> None:
    with _session() as s:
        meta_str = None
        try:
            meta_str = json.dumps(payload.get("meta") or {})
        except Exception:
            meta_str = None
        p = LagoPayment(
            event_type=payload.get("event_type"),
            provider=payload.get("provider"),
            provider_txn_id=payload.get("provider_txn_id"),
            order_id=payload.get("order_id"),
            amount_cents=int(payload.get("amount_cents") or 0),
            currency=str(payload.get("currency") or "USD").upper(),
            status=payload.get("status"),
            user_id=(payload.get("subject") or {}).get("user_id"),
            team_id=(payload.get("subject") or {}).get("team_id"),
            request_id=payload.get("request_id"),
            meta=meta_str,
        )
        s.add(p)
        s.commit()
        logger.info("lago.ingest.payment order_id=%s amount_cents=%s", p.order_id, p.amount_cents)


def ingest_usage_event(payload: dict) -> None:
    # Map to existing Usage table for aggregation/day-limit
    subject = payload.get("subject") or {}
    tokens = payload.get("tokens") or {}
    pricing = payload.get("pricing") or {}
    with _session() as s:
        u = Usage(
            user_id=subject.get("user_id"),
            team_id=subject.get("team_id"),
            model=payload.get("model"),
            unit=payload.get("unit") or "token",
            input_tokens=int(tokens.get("input") or 0),
            output_tokens=int(tokens.get("output") or 0),
            total_tokens=int(tokens.get("total") or 0),
            computed_amount_cents=int(pricing.get("computed_amount_cents") or 0),
            currency=str(pricing.get("currency") or "USD").upper(),
            success=bool(payload.get("success") if payload.get("success") is not None else True),
            request_id=payload.get("request_id"),
        )
        s.add(u)
        s.commit()
        logger.info("lago.ingest.usage user_id=%s model=%s amount_cents=%s", u.user_id, u.model, u.computed_amount_cents)

