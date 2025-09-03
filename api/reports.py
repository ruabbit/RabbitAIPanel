from __future__ import annotations

import datetime as dt
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from .server import request_context
from middleware.db import SessionLocal
from middleware.models import Usage, OverdraftAlert
from middleware.lago.service import LagoPayment
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


@router.get("/overdraft")
def overdraft_report(user_id: int, days: int = 7, ctx: dict = Depends(request_context)):
    days = max(1, min(days, 90))
    start = utc8_day_start(dt.datetime.utcnow() - dt.timedelta(days=days - 1), hhmm="00:00")
    with _session() as s:
        rows = (
            s.query(OverdraftAlert)
            .filter(OverdraftAlert.user_id == user_id, OverdraftAlert.created_at >= start)
            .order_by(OverdraftAlert.id.desc())
            .all()
        )
        data = [
            {
                "created_at": r.created_at.isoformat(),
                "model": r.model,
                "request_id": r.request_id,
                "overflow_policy": r.overflow_policy,
                "final_amount_cents": r.final_amount_cents,
                "charged_amount_cents": r.charged_amount_cents,
                "remaining_before_cents": r.remaining_before_cents,
            }
            for r in rows
        ]
    return {"request_id": ctx.get("request_id"), "user_id": user_id, "days": days, "overdrafts": data}


@router.get("/period")
def period_report(
    user_id: int,
    date_from: str = Query(..., description="YYYY-MM-DD (inclusive, UTC+8 window)"),
    date_to: str = Query(..., description="YYYY-MM-DD (inclusive, UTC+8 window)"),
    format: str = Query("json", pattern=r"^(json|csv)$"),
    ctx: dict = Depends(request_context),
):
    # parse dates
    try:
        y1, m1, d1 = map(int, date_from.split("-"))
        y2, m2, d2 = map(int, date_to.split("-"))
        base_from = dt.datetime(y1, m1, d1)
        base_to = dt.datetime(y2, m2, d2)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid date format")
    if base_to < base_from:
        raise HTTPException(status_code=400, detail="date_to must be >= date_from")
    start = utc8_day_start(base_from, hhmm="00:00")
    end = utc8_day_start(base_to, hhmm="00:00") + dt.timedelta(days=1)

    with _session() as s:
        usage_amount_cents, usage_tokens = s.query(
            func.coalesce(func.sum(Usage.computed_amount_cents), 0),
            func.coalesce(func.sum(Usage.total_tokens), 0),
        ).filter(Usage.user_id == user_id, Usage.created_at >= start, Usage.created_at < end).one()

        topup = s.query(func.coalesce(func.sum(LagoPayment.amount_cents), 0)).filter(
            LagoPayment.user_id == user_id,
            LagoPayment.created_at >= start,
            LagoPayment.created_at < end,
            LagoPayment.event_type == "wallet_topup",
            LagoPayment.status == "succeeded",
        ).scalar() or 0

        refunds = s.query(func.coalesce(func.sum(LagoPayment.amount_cents), 0)).filter(
            LagoPayment.user_id == user_id,
            LagoPayment.created_at >= start,
            LagoPayment.created_at < end,
            LagoPayment.event_type == "refund",
        ).scalar() or 0

    net_topup_cents = int(topup) - int(refunds)
    usage_amount_cents = int(usage_amount_cents)
    usage_tokens = int(usage_tokens)
    balance_delta_cents = net_topup_cents - usage_amount_cents

    data = {
        "request_id": ctx.get("request_id"),
        "user_id": user_id,
        "from": date_from,
        "to": date_to,
        "usage_amount_cents": usage_amount_cents,
        "usage_tokens": usage_tokens,
        "topup_cents": int(topup),
        "refunds_cents": int(refunds),
        "net_topup_cents": net_topup_cents,
        "balance_delta_cents": balance_delta_cents,
    }

    if format == "csv":
        # simple CSV header + one row
        headers = [
            "request_id",
            "user_id",
            "from",
            "to",
            "usage_amount_cents",
            "usage_tokens",
            "topup_cents",
            "refunds_cents",
            "net_topup_cents",
            "balance_delta_cents",
        ]
        row = [str(data[k]) for k in headers]
        csv_text = ",".join(headers) + "\n" + ",".join(row) + "\n"
        return PlainTextResponse(content=csv_text, media_type="text/csv")

    return data
