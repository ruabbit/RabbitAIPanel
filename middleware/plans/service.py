from __future__ import annotations

import datetime as dt
from contextlib import contextmanager
from typing import Iterator, Optional

from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Plan, DailyLimitPlan, UsagePlan, PriceRule, PlanAssignment


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


def check_daily_limit_placeholder(user_id: int, *, currency: str = "USD") -> tuple[bool, str]:
    """Placeholder for daily limit enforcement.
    Returns (allowed, reason). Will be wired into proxy path in future steps.
    """
    # TODO: compute today's spend since utc8_day_start and compare with DailyLimitPlan
    return True, "ok"

