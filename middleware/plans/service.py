from __future__ import annotations

import datetime as dt
from contextlib import contextmanager
from typing import Iterator, Optional, Tuple

from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Plan, DailyLimitPlan, UsagePlan, PriceRule, PlanAssignment, Usage
from sqlalchemy import func


@contextmanager
def session_scope() -> Iterator[Session]:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def create_plan(*, name: str, type: str, currency: str = "USD") -> Plan:
    with session_scope() as s:
        p = Plan(name=name, type=type, currency=currency)
        s.add(p)
        s.flush()
        return p


def upsert_daily_limit(plan_id: int, *, daily_limit_cents: int, overflow_policy: str = "block", reset_time: str = "00:00", timezone: str = "UTC+8") -> DailyLimitPlan:
    with session_scope() as s:
        dlp = s.get(DailyLimitPlan, plan_id)
        if dlp is None:
            dlp = DailyLimitPlan(plan_id=plan_id, daily_limit_cents=daily_limit_cents, overflow_policy=overflow_policy, reset_time=reset_time, timezone=timezone)
            s.add(dlp)
        else:
            dlp.daily_limit_cents = daily_limit_cents
            dlp.overflow_policy = overflow_policy
            dlp.reset_time = reset_time
            dlp.timezone = timezone
        return dlp


def upsert_usage_plan(plan_id: int, *, billing_cycle: str = "monthly", min_commit_cents: Optional[int] = None, credit_grant_cents: Optional[int] = None) -> UsagePlan:
    with session_scope() as s:
        up = s.get(UsagePlan, plan_id)
        if up is None:
            up = UsagePlan(plan_id=plan_id, billing_cycle=billing_cycle, min_commit_cents=min_commit_cents, credit_grant_cents=credit_grant_cents)
            s.add(up)
        else:
            up.billing_cycle = billing_cycle
            up.min_commit_cents = min_commit_cents
            up.credit_grant_cents = credit_grant_cents
        return up


def add_price_rule(plan_id: int, *, model_pattern: str, unit: str, unit_base_price_cents: int, input_multiplier: float | None = None, output_multiplier: float | None = None, price_multiplier: float | None = None, min_charge_cents: int | None = None) -> PriceRule:
    with session_scope() as s:
        pr = PriceRule(plan_id=plan_id, model_pattern=model_pattern, unit=unit, unit_base_price_cents=unit_base_price_cents, input_multiplier=input_multiplier, output_multiplier=output_multiplier, price_multiplier=price_multiplier, min_charge_cents=min_charge_cents)
        s.add(pr)
        s.flush()
        return pr


def assign_plan(entity_type: str, entity_id: int, plan_id: int, *, timezone: str = "UTC+8", status: str = "active", effective_from: Optional[dt.datetime] = None, effective_to: Optional[dt.datetime] = None) -> PlanAssignment:
    with session_scope() as s:
        pa = PlanAssignment(entity_type=entity_type, entity_id=entity_id, plan_id=plan_id, status=status, effective_from=effective_from, effective_to=effective_to, timezone=timezone)
        s.add(pa)
        s.flush()
        return pa


def get_plan(plan_id: int) -> Optional[Plan]:
    with session_scope() as s:
        return s.get(Plan, plan_id)


def get_assignment(entity_type: str, entity_id: int) -> Optional[PlanAssignment]:
    with session_scope() as s:
        return (
            s.query(PlanAssignment)
            .filter_by(entity_type=entity_type, entity_id=entity_id, status="active")
            .order_by(PlanAssignment.id.desc())
            .first()
        )


def utc8_day_start(now: Optional[dt.datetime] = None, hhmm: str = "00:00") -> dt.datetime:
    now = now or dt.datetime.utcnow()
    # Convert UTC -> UTC+8 window by adding 8 hours, then normalize
    shifted = now + dt.timedelta(hours=8)
    y, m, d = shifted.year, shifted.month, shifted.day
    hh, mm = hhmm.split(":")
    start_local = dt.datetime(y, m, d, int(hh), int(mm))
    # Convert back to UTC
    return start_local - dt.timedelta(hours=8)


def _match_pattern(model: str, pattern: str) -> bool:
    if pattern == "*":
        return True
    if pattern.endswith("*"):
        return model.startswith(pattern[:-1])
    if pattern.startswith("*"):
        return model.endswith(pattern[1:])
    return model == pattern


def find_price_rule(session: Session, plan_id: int, model: str, unit: str = "token") -> Optional[PriceRule]:
    rules = session.query(PriceRule).filter_by(plan_id=plan_id, unit=unit).all()
    # Prefer exact > prefix/suffix wildcard; keep first match
    exact = [r for r in rules if _match_pattern(model, r.model_pattern) and r.model_pattern == model]
    if exact:
        return exact[0]
    wildcard = [r for r in rules if _match_pattern(model, r.model_pattern)]
    return wildcard[0] if wildcard else None


def estimate_token_cost_cents(pr: PriceRule, *, input_tokens: int = 0, output_tokens: int = 0, total_tokens: Optional[int] = None) -> int:
    total_tokens = total_tokens if total_tokens is not None else (input_tokens + output_tokens)
    base = pr.unit_base_price_cents
    amount = 0.0
    if pr.input_multiplier or pr.output_multiplier:
        im = pr.input_multiplier or 1.0
        om = pr.output_multiplier or 1.0
        amount = base * ((input_tokens / 1000.0) * im + (output_tokens / 1000.0) * om)
    else:
        pm = pr.price_multiplier or 1.0
        amount = base * (total_tokens / 1000.0) * pm
    if pr.min_charge_cents and amount < pr.min_charge_cents:
        amount = float(pr.min_charge_cents)
    return int(round(amount))


def estimate_cost_for_tokens(user_id: int, *, model: str, input_tokens: int, output_tokens: int, total_tokens: Optional[int] = None) -> Tuple[int, Optional[str]]:
    with session_scope() as s:
        pa = get_assignment("user", user_id)
        if not pa:
            return 0, None
        pr = find_price_rule(s, pa.plan_id, model, unit="token")
        if not pr:
            return 0, None
        cents = estimate_token_cost_cents(pr, input_tokens=input_tokens, output_tokens=output_tokens, total_tokens=total_tokens)
        return cents, pa.timezone


def _today_spend_cents(session: Session, user_id: int, *, reset_time: str = "00:00") -> int:
    start = utc8_day_start(hhmm=reset_time)
    total = session.query(func.coalesce(func.sum(Usage.computed_amount_cents), 0)).filter(Usage.user_id == user_id, Usage.created_at >= start, Usage.currency == "USD").scalar() or 0
    return int(total)


def get_daily_limit_status(user_id: int) -> Tuple[Optional[DailyLimitPlan], int, int]:
    """Return (dlp, spent_today_cents, remaining_cents). If no plan/dlp, dlp is None and remaining is a large number."""
    with session_scope() as s:
        pa = get_assignment("user", user_id)
        if not pa:
            return None, 0, 10**12
        dlp = s.get(DailyLimitPlan, pa.plan_id)
        if not dlp:
            return None, 0, 10**12
        spent = _today_spend_cents(s, user_id, reset_time=dlp.reset_time)
        remaining = max(0, int(dlp.daily_limit_cents) - spent)
        return dlp, spent, remaining


def check_daily_limit(user_id: int, *, add_amount_cents: int, timezone: str = "UTC+8") -> Tuple[bool, str, Optional[str], int]:
    """Check if adding amount would exceed today's daily limit.
    Returns (allowed, policy, reason, remaining_cents_before).
    """
    with session_scope() as s:
        pa = get_assignment("user", user_id)
        if not pa:
            return True, "none", "no plan", 10**12
        dlp = s.get(DailyLimitPlan, pa.plan_id)
        if not dlp:
            return True, "none", "no daily limit", 10**12
        spent = _today_spend_cents(s, user_id, reset_time=dlp.reset_time)
        remaining = max(0, int(dlp.daily_limit_cents) - spent)
        if spent + add_amount_cents <= dlp.daily_limit_cents:
            return True, dlp.overflow_policy, "within limit", remaining
        # overflow
        if dlp.overflow_policy == "block":
            return False, dlp.overflow_policy, "daily limit exceeded", remaining
        elif dlp.overflow_policy in ("grace", "degrade"):
            return True, dlp.overflow_policy, "overflow grace/degrade", remaining
        return False, dlp.overflow_policy, "exceeded", remaining


def record_usage_row(user_id: int, *, model: str, input_tokens: int, output_tokens: int, total_tokens: Optional[int], computed_amount_cents: int, request_id: Optional[str]) -> None:
    with session_scope() as s:
        u = Usage(
            user_id=user_id,
            team_id=None,
            model=model,
            unit="token",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=total_tokens or (input_tokens + output_tokens),
            computed_amount_cents=computed_amount_cents,
            currency="USD",
            success=True,
            request_id=request_id,
        )
        s.add(u)
