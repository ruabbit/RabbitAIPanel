from __future__ import annotations

import datetime as dt
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from .deps import request_context, admin_auth
from middleware.db import SessionLocal
from middleware.models import Usage, OverdraftAlert, Wallet, ApiKey
from middleware.lago.service import LagoPayment
from middleware.plans.service import utc8_day_start, get_daily_limit_status
from middleware.config import settings
from middleware.runtime_config import get as rc_get


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


@router.get("/budget")
def budget_report(
    user_id: int,
    format: str = Query("json", pattern=r"^(json|csv)$"),
    ctx: dict = Depends(request_context),
):
    # Wallet balances per currency
    wallets = []
    with _session() as s:
        wrows = s.query(Wallet).filter(Wallet.user_id == user_id).all()
        for w in wrows:
            wallets.append(
                {
                    "currency": w.currency,
                    "balance_cents": int(w.balance_cents or 0),
                    "low_threshold_cents": int(w.low_threshold_cents or 0) if w.low_threshold_cents is not None else None,
                }
            )

        # API keys with budget fields
        krows = s.query(ApiKey).filter(ApiKey.user_id == user_id, ApiKey.active == True).all()  # noqa: E712
        api_keys = [
            {
                "id": k.id,
                "key_last4": k.key_last4,
                "active": bool(k.active),
                "max_budget_cents": int(k.max_budget_cents or 0) if k.max_budget_cents is not None else None,
                "budget_duration": k.budget_duration,
                "model_allowlist": k.model_allowlist,
            }
            for k in krows
        ]

    # Daily limit plan status (UTC+8 day window)
    dlp, spent_today, remaining = get_daily_limit_status(user_id)
    daily_limit = None
    if dlp is not None:
        # Compute current window boundaries for reference
        now = dt.datetime.utcnow()
        window_start = utc8_day_start(now, hhmm=str(dlp.reset_time))
        window_end = window_start + dt.timedelta(days=1)
        daily_limit = {
            "plan_id": dlp.id,
            "daily_limit_cents": int(dlp.daily_limit_cents),
            "overflow_policy": dlp.overflow_policy,
            "reset_time": dlp.reset_time,
            "spent_today_cents": int(spent_today),
            "remaining_cents": int(remaining),
            "window_start": window_start.isoformat(),
            "window_end": window_end.isoformat(),
        }

    # System policy snapshot
    gating = {
        "enabled": bool(rc_get("OVERDRAFT_GATING_ENABLED", bool, settings.OVERDRAFT_GATING_ENABLED)),
        "mode": rc_get("OVERDRAFT_GATING_MODE", str, settings.OVERDRAFT_GATING_MODE),
    }
    litellm = {
        "configured": bool(rc_get("LITELLM_BASE_URL", str, settings.LITELLM_BASE_URL) and rc_get("LITELLM_MASTER_KEY", str, settings.LITELLM_MASTER_KEY)),
        "sync_enabled": bool(rc_get("LITELLM_SYNC_ENABLED", bool, settings.LITELLM_SYNC_ENABLED)),
        "currency": rc_get("LITELLM_SYNC_CURRENCY", str, settings.LITELLM_SYNC_CURRENCY),
    }

    data = {
        "request_id": ctx.get("request_id"),
        "user_id": user_id,
        "wallets": wallets,
        "daily_limit": daily_limit,
        "api_keys": api_keys,
        "gating": gating,
        "litellm": litellm,
    }

    if format == "csv":
        # Flatten key metrics for CSV
        wallets_summary = ";".join([f"{w['currency']}:{w['balance_cents']}" for w in wallets]) if wallets else ""
        api_keys_count = len(data["api_keys"]) if data.get("api_keys") else 0
        api_keys_budget_total = 0
        for k in data.get("api_keys", []):
            if k.get("max_budget_cents") is not None:
                api_keys_budget_total += int(k.get("max_budget_cents") or 0)
        dl = data.get("daily_limit") or {}
        headers = [
            "request_id",
            "user_id",
            "wallets_summary",
            "daily_limit_cents",
            "spent_today_cents",
            "remaining_cents",
            "gating_enabled",
            "gating_mode",
            "litellm_configured",
            "litellm_sync_enabled",
            "api_keys_count",
            "api_keys_budget_total_cents",
        ]
        row = [
            str(data.get("request_id")),
            str(user_id),
            wallets_summary,
            str(dl.get("daily_limit_cents") or ""),
            str(dl.get("spent_today_cents") or ""),
            str(dl.get("remaining_cents") or ""),
            str(1 if data.get("gating", {}).get("enabled") else 0),
            str(data.get("gating", {}).get("mode") or ""),
            str(1 if data.get("litellm", {}).get("configured") else 0),
            str(1 if data.get("litellm", {}).get("sync_enabled") else 0),
            str(api_keys_count),
            str(api_keys_budget_total),
        ]
        csv_text = ",".join(headers) + "\n" + ",".join(row) + "\n"
        return PlainTextResponse(content=csv_text, media_type="text/csv")

    return data


@router.get("/period_team")
def period_team_report(
    team_id: int,
    date_from: str = Query(..., description="YYYY-MM-DD (inclusive, UTC+8 window)"),
    date_to: str = Query(..., description="YYYY-MM-DD (inclusive, UTC+8 window)"),
    model: Optional[str] = Query(None, description="filter by model"),
    success: Optional[bool] = Query(None, description="filter by success flag"),
    group_by: str = Query("total", pattern=r"^(total|model|day|model_day)$"),
    format: str = Query("json", pattern=r"^(json|csv)$"),
    ctx: dict = Depends(admin_auth),
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
        if group_by == "total":
            uq = s.query(
                func.coalesce(func.sum(Usage.computed_amount_cents), 0),
                func.coalesce(func.sum(Usage.total_tokens), 0),
            ).filter(Usage.team_id == team_id, Usage.created_at >= start, Usage.created_at < end)
            if model:
                uq = uq.filter(Usage.model == model)
            if success is not None:
                uq = uq.filter(Usage.success == bool(success))
            usage_amount_cents, usage_tokens = uq.one()
        else:
            groups: list[dict] = []
            def _sum_usage(filters) -> tuple[int, int]:
                q = s.query(
                    func.coalesce(func.sum(Usage.computed_amount_cents), 0),
                    func.coalesce(func.sum(Usage.total_tokens), 0),
                ).filter(*filters)
                a, t = q.one()
                return int(a or 0), int(t or 0)

            models: list[str] = []
            if group_by in ("model", "model_day"):
                if model:
                    models = [model]
                else:
                    mrows = (
                        s.query(Usage.model)
                        .filter(Usage.team_id == team_id, Usage.created_at >= start, Usage.created_at < end)
                        .distinct()
                        .all()
                    )
                    models = [r[0] for r in mrows]

            if group_by == "model":
                for m in models:
                    filters = [Usage.team_id == team_id, Usage.created_at >= start, Usage.created_at < end, Usage.model == m]
                    if success is not None:
                        filters.append(Usage.success == bool(success))
                    a, t = _sum_usage(filters)
                    if a or t:
                        groups.append({"model": m, "usage_amount_cents": a, "usage_tokens": t})
            elif group_by == "day":
                cur = start
                while cur < end:
                    day_end = cur + dt.timedelta(days=1)
                    filters = [Usage.team_id == team_id, Usage.created_at >= cur, Usage.created_at < day_end]
                    if model:
                        filters.append(Usage.model == model)
                    if success is not None:
                        filters.append(Usage.success == bool(success))
                    a, t = _sum_usage(filters)
                    if a or t:
                        groups.append({"date": (cur + dt.timedelta(hours=8)).strftime("%Y-%m-%d"), "usage_amount_cents": a, "usage_tokens": t})
                    cur = day_end
            elif group_by == "model_day":
                cur = start
                while cur < end:
                    day_end = cur + dt.timedelta(days=1)
                    for m in models:
                        filters = [
                            Usage.team_id == team_id,
                            Usage.created_at >= cur,
                            Usage.created_at < day_end,
                            Usage.model == m,
                        ]
                        if success is not None:
                            filters.append(Usage.success == bool(success))
                        a, t = _sum_usage(filters)
                        if a or t:
                            groups.append({
                                "date": (cur + dt.timedelta(hours=8)).strftime("%Y-%m-%d"),
                                "model": m,
                                "usage_amount_cents": a,
                                "usage_tokens": t,
                            })
                    cur = day_end

            usage_amount_cents = sum(g.get("usage_amount_cents", 0) for g in groups)
            usage_tokens = sum(g.get("usage_tokens", 0) for g in groups)

        topup = s.query(func.coalesce(func.sum(LagoPayment.amount_cents), 0)).filter(
            LagoPayment.team_id == team_id,
            LagoPayment.created_at >= start,
            LagoPayment.created_at < end,
            LagoPayment.event_type == "wallet_topup",
            LagoPayment.status == "succeeded",
        ).scalar() or 0

        refunds = s.query(func.coalesce(func.sum(LagoPayment.amount_cents), 0)).filter(
            LagoPayment.team_id == team_id,
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
        "team_id": team_id,
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
        if group_by == "total":
            headers = [
                "request_id",
                "team_id",
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
        else:
            if group_by == "model":
                headers = ["request_id", "team_id", "from", "to", "model", "usage_amount_cents", "usage_tokens"]
                lines = [headers]
                for g in groups:
                    lines.append([
                        str(ctx.get("request_id")),
                        str(team_id),
                        date_from,
                        date_to,
                        g["model"],
                        str(g["usage_amount_cents"]),
                        str(g["usage_tokens"]),
                    ])
            elif group_by == "day":
                headers = ["request_id", "team_id", "from", "to", "date", "usage_amount_cents", "usage_tokens"]
                lines = [headers]
                for g in groups:
                    lines.append([
                        str(ctx.get("request_id")),
                        str(team_id),
                        date_from,
                        date_to,
                        g["date"],
                        str(g["usage_amount_cents"]),
                        str(g["usage_tokens"]),
                    ])
            else:  # model_day
                headers = ["request_id", "team_id", "from", "to", "date", "model", "usage_amount_cents", "usage_tokens"]
                lines = [headers]
                for g in groups:
                    lines.append([
                        str(ctx.get("request_id")),
                        str(team_id),
                        date_from,
                        date_to,
                        g["date"],
                        g["model"],
                        str(g["usage_amount_cents"]),
                        str(g["usage_tokens"]),
                    ])
            csv_text = "\n".join([",".join(row) for row in lines]) + "\n"
            return PlainTextResponse(content=csv_text, media_type="text/csv")

    if group_by == "total":
        return data
    else:
        data["groups"] = groups
        data["group_by"] = group_by
        return data


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
    model: Optional[str] = Query(None, description="filter by model"),
    success: Optional[bool] = Query(None, description="filter by success flag"),
    group_by: str = Query("total", pattern=r"^(total|model|day|model_day)$"),
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
        if group_by == "total":
            uq = s.query(
                func.coalesce(func.sum(Usage.computed_amount_cents), 0),
                func.coalesce(func.sum(Usage.total_tokens), 0),
            ).filter(Usage.user_id == user_id, Usage.created_at >= start, Usage.created_at < end)
            if model:
                uq = uq.filter(Usage.model == model)
            if success is not None:
                uq = uq.filter(Usage.success == bool(success))
            usage_amount_cents, usage_tokens = uq.one()
        else:
            # grouped detail (usage-only)
            groups: list[dict] = []
            def _sum_usage(filters) -> tuple[int, int]:
                q = s.query(
                    func.coalesce(func.sum(Usage.computed_amount_cents), 0),
                    func.coalesce(func.sum(Usage.total_tokens), 0),
                ).filter(*filters)
                a, t = q.one()
                return int(a or 0), int(t or 0)

            # model candidates
            models: list[str] = []
            if group_by in ("model", "model_day"):
                if model:
                    models = [model]
                else:
                    mrows = (
                        s.query(Usage.model)
                        .filter(Usage.user_id == user_id, Usage.created_at >= start, Usage.created_at < end)
                        .distinct()
                        .all()
                    )
                    models = [r[0] for r in mrows]

            if group_by == "model":
                for m in models:
                    filters = [Usage.user_id == user_id, Usage.created_at >= start, Usage.created_at < end, Usage.model == m]
                    if success is not None:
                        filters.append(Usage.success == bool(success))
                    a, t = _sum_usage(filters)
                    if a or t:
                        groups.append({"model": m, "usage_amount_cents": a, "usage_tokens": t})
            elif group_by == "day":
                cur = start
                while cur < end:
                    day_end = cur + dt.timedelta(days=1)
                    filters = [Usage.user_id == user_id, Usage.created_at >= cur, Usage.created_at < day_end]
                    if model:
                        filters.append(Usage.model == model)
                    if success is not None:
                        filters.append(Usage.success == bool(success))
                    a, t = _sum_usage(filters)
                    if a or t:
                        groups.append({"date": (cur + dt.timedelta(hours=8)).strftime("%Y-%m-%d"), "usage_amount_cents": a, "usage_tokens": t})
                    cur = day_end
            elif group_by == "model_day":
                cur = start
                while cur < end:
                    day_end = cur + dt.timedelta(days=1)
                    for m in models:
                        filters = [
                            Usage.user_id == user_id,
                            Usage.created_at >= cur,
                            Usage.created_at < day_end,
                            Usage.model == m,
                        ]
                        if success is not None:
                            filters.append(Usage.success == bool(success))
                        a, t = _sum_usage(filters)
                        if a or t:
                            groups.append({
                                "date": (cur + dt.timedelta(hours=8)).strftime("%Y-%m-%d"),
                                "model": m,
                                "usage_amount_cents": a,
                                "usage_tokens": t,
                            })
                    cur = day_end

            # aggregate totals from groups
            usage_amount_cents = sum(g.get("usage_amount_cents", 0) for g in groups)
            usage_tokens = sum(g.get("usage_tokens", 0) for g in groups)

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
        if group_by == "total":
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
        else:
            # grouped detail (usage-only)
            if group_by == "model":
                headers = ["request_id", "user_id", "from", "to", "model", "usage_amount_cents", "usage_tokens"]
                lines = [headers]
                for g in groups:
                    lines.append([
                        str(ctx.get("request_id")),
                        str(user_id),
                        date_from,
                        date_to,
                        g["model"],
                        str(g["usage_amount_cents"]),
                        str(g["usage_tokens"]),
                    ])
            elif group_by == "day":
                headers = ["request_id", "user_id", "from", "to", "date", "usage_amount_cents", "usage_tokens"]
                lines = [headers]
                for g in groups:
                    lines.append([
                        str(ctx.get("request_id")),
                        str(user_id),
                        date_from,
                        date_to,
                        g["date"],
                        str(g["usage_amount_cents"]),
                        str(g["usage_tokens"]),
                    ])
            else:  # model_day
                headers = ["request_id", "user_id", "from", "to", "date", "model", "usage_amount_cents", "usage_tokens"]
                lines = [headers]
                for g in groups:
                    lines.append([
                        str(ctx.get("request_id")),
                        str(user_id),
                        date_from,
                        date_to,
                        g["date"],
                        g["model"],
                        str(g["usage_amount_cents"]),
                        str(g["usage_tokens"]),
                    ])
            csv_text = "\n".join([",".join(row) for row in lines]) + "\n"
            return PlainTextResponse(content=csv_text, media_type="text/csv")

    if group_by == "total":
        return data
    else:
        data["groups"] = groups
        data["group_by"] = group_by
        return data
