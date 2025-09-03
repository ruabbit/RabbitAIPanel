from __future__ import annotations

import datetime as dt
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from .server import request_context
from middleware.db import SessionLocal
from middleware.models import Usage
from middleware.plans.service import utc8_day_start


router = APIRouter(prefix="/v1/reports", tags=["reports"])


def _session() -> Session:
    return SessionLocal()


@router.get("/daily")
def daily_report(user_id: int, date: str = Query(..., description="YYYY-MM-DD"), ctx: dict = Depends(request_context)):
    try:
        y, m, d = map(int, date.split("-"))
        base = dt.datetime(y, m, d)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid date format")
    start = utc8_day_start(base, hhmm="00:00")
    end = start + dt.timedelta(days=1)
    with _session() as s:
        q = s.query(
            func.coalesce(func.sum(Usage.computed_amount_cents), 0),
            func.coalesce(func.sum(Usage.total_tokens), 0),
        ).filter(Usage.user_id == user_id, Usage.created_at >= start, Usage.created_at < end)
        amount_cents, total_tokens = q.one()
    return {"request_id": ctx.get("request_id"), "user_id": user_id, "date": date, "amount_cents": int(amount_cents), "total_tokens": int(total_tokens)}


@router.get("/summary")
def summary_report(user_id: int, days: int = 7, ctx: dict = Depends(request_context)):
    days = max(1, min(days, 90))
    today_utc = dt.datetime.utcnow()
    results = []
    with _session() as s:
        for i in range(days):
            start = utc8_day_start(today_utc - dt.timedelta(days=i), hhmm="00:00")
            end = start + dt.timedelta(days=1)
            amount_cents, total_tokens = s.query(
                func.coalesce(func.sum(Usage.computed_amount_cents), 0),
                func.coalesce(func.sum(Usage.total_tokens), 0),
            ).filter(Usage.user_id == user_id, Usage.created_at >= start, Usage.created_at < end).one()
            results.append({
                "date": (start + dt.timedelta(hours=8)).strftime("%Y-%m-%d"),
                "amount_cents": int(amount_cents),
                "total_tokens": int(total_tokens),
            })
    results.sort(key=lambda x: x["date"])  # ascending
    return {"request_id": ctx.get("request_id"), "user_id": user_id, "days": days, "daily": results}

