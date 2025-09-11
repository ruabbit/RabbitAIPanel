from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .deps import dev_auth
from middleware.plans.service import (
    create_plan,
    upsert_daily_limit,
    upsert_usage_plan,
    add_price_rule,
    assign_plan,
    get_plan,
    get_assignment,
)


router = APIRouter(prefix="/v1/plans", tags=["plans"])


class CreatePlanBody(BaseModel):
    name: str
    type: str = Field(pattern=r"^(daily_limit|usage)$")
    currency: str = "USD"
    meta: dict | None = None


@router.post("")
def api_create_plan(body: CreatePlanBody, ctx: dict = Depends(dev_auth)):
    p = create_plan(name=body.name, type=body.type, currency=body.currency)
    # optional meta save
    if body.meta is not None:
        from middleware.plans.service import update_plan_meta  # lazy import to avoid cycle
        update_plan_meta(p.id, body.meta)
    return {"request_id": ctx.get("request_id"), "plan_id": p.id}


class UpsertDailyLimitBody(BaseModel):
    plan_id: int
    daily_limit_cents: int
    overflow_policy: str = Field(default="block", pattern=r"^(block|grace|degrade)$")
    reset_time: str = Field(default="00:00", pattern=r"^\d{2}:\d{2}$")
    timezone: str = "UTC+8"


@router.post("/daily_limit")
def api_upsert_daily_limit(body: UpsertDailyLimitBody, ctx: dict = Depends(dev_auth)):
    dlp = upsert_daily_limit(
        body.plan_id,
        daily_limit_cents=body.daily_limit_cents,
        overflow_policy=body.overflow_policy,
        reset_time=body.reset_time,
        timezone=body.timezone,
    )
    return {"request_id": ctx.get("request_id"), "plan_id": dlp.plan_id}


class UpsertUsagePlanBody(BaseModel):
    plan_id: int
    billing_cycle: str = Field(default="monthly", pattern=r"^(monthly|weekly)$")
    min_commit_cents: Optional[int] = None
    credit_grant_cents: Optional[int] = None


@router.post("/usage")
def api_upsert_usage(body: UpsertUsagePlanBody, ctx: dict = Depends(dev_auth)):
    up = upsert_usage_plan(
        body.plan_id,
        billing_cycle=body.billing_cycle,
        min_commit_cents=body.min_commit_cents,
        credit_grant_cents=body.credit_grant_cents,
    )
    return {"request_id": ctx.get("request_id"), "plan_id": up.plan_id}


class AddPriceRuleBody(BaseModel):
    plan_id: int
    model_pattern: str
    unit: str = Field(default="token", pattern=r"^(token|request|minute|image)$")
    unit_base_price_cents: int
    input_multiplier: Optional[float] = None
    output_multiplier: Optional[float] = None
    price_multiplier: Optional[float] = None
    min_charge_cents: Optional[int] = None


@router.post("/pricing")
def api_add_price_rule(body: AddPriceRuleBody, ctx: dict = Depends(dev_auth)):
    pr = add_price_rule(
        body.plan_id,
        model_pattern=body.model_pattern,
        unit=body.unit,
        unit_base_price_cents=body.unit_base_price_cents,
        input_multiplier=body.input_multiplier,
        output_multiplier=body.output_multiplier,
        price_multiplier=body.price_multiplier,
        min_charge_cents=body.min_charge_cents,
    )
    return {"request_id": ctx.get("request_id"), "price_rule_id": pr.id}


class AssignPlanBody(BaseModel):
    entity_type: str = Field(pattern=r"^(user|team)$")
    entity_id: int
    plan_id: int
    timezone: str = "UTC+8"


@router.post("/assign")
def api_assign_plan(body: AssignPlanBody, ctx: dict = Depends(dev_auth)):
    pa = assign_plan(body.entity_type, body.entity_id, body.plan_id, timezone=body.timezone)
    return {"request_id": ctx.get("request_id"), "assignment_id": pa.id}


class UpdatePlanMetaBody(BaseModel):
    plan_id: int
    meta: dict


@router.post("/meta")
def api_update_plan_meta(body: UpdatePlanMetaBody, ctx: dict = Depends(dev_auth)):
    from middleware.plans.service import update_plan_meta

    update_plan_meta(body.plan_id, body.meta)
    return {"request_id": ctx.get("request_id"), "plan_id": body.plan_id}


@router.get("/{plan_id}")
def api_get_plan(plan_id: int, ctx: dict = Depends(dev_auth)):
    p = get_plan(plan_id)
    if not p:
        raise HTTPException(status_code=404, detail="plan not found")
    return {"request_id": ctx.get("request_id"), "plan": {"id": p.id, "name": p.name, "type": p.type, "currency": p.currency, "status": p.status, "meta": p.meta}}


@router.get("/assignment/{entity_type}/{entity_id}")
def api_get_assignment(entity_type: str, entity_id: int, ctx: dict = Depends(dev_auth)):
    pa = get_assignment(entity_type, entity_id)
    if not pa:
        return {"request_id": ctx.get("request_id"), "assignment": None}
    return {"request_id": ctx.get("request_id"), "assignment": {"id": pa.id, "plan_id": pa.plan_id, "status": pa.status, "effective_from": pa.effective_from.isoformat() if pa.effective_from else None, "effective_to": pa.effective_to.isoformat() if pa.effective_to else None, "timezone": pa.timezone}}
