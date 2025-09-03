from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from .server import dev_auth
from middleware.billing.service import create_customer, create_subscription, generate_invoice
from middleware.billing.service import ensure_stripe_customer, ensure_stripe_subscription, push_invoice_to_stripe
from middleware.billing.service import get_invoice, list_invoices
from middleware.billing.service import (
    get_subscription,
    get_subscription_by_stripe_id,
    list_subscriptions,
)
from middleware.plans.service import get_plan


router = APIRouter(prefix="/v1/billing", tags=["billing"])


class CreateCustomerBody(BaseModel):
    entity_type: str  # user|team
    entity_id: int
    stripe_customer_id: str | None = None


@router.post("/customers")
def api_create_customer(body: CreateCustomerBody, ctx: dict = Depends(dev_auth)):
    c = create_customer(entity_type=body.entity_type, entity_id=body.entity_id, stripe_customer_id=body.stripe_customer_id)
    return {"request_id": ctx.get("request_id"), "customer_id": c.id}


class CreateSubscriptionBody(BaseModel):
    customer_id: int
    plan_id: int
    stripe_subscription_id: str | None = None


@router.post("/subscriptions")
def api_create_subscription(body: CreateSubscriptionBody, ctx: dict = Depends(dev_auth)):
    s = create_subscription(customer_id=body.customer_id, plan_id=body.plan_id, stripe_subscription_id=body.stripe_subscription_id)
    return {"request_id": ctx.get("request_id"), "subscription_id": s.id}


@router.post("/invoices/generate")
def api_generate_invoice(customer_id: int, date_from: str = Query(...), date_to: str = Query(...), ctx: dict = Depends(dev_auth)):
    try:
        inv = generate_invoice(customer_id=customer_id, date_from=date_from, date_to=date_to)
        return {
            "request_id": ctx.get("request_id"),
            "invoice": {
                "id": inv.id,
                "customer_id": inv.customer_id,
                "period_start": inv.period_start.isoformat(),
                "period_end": inv.period_end.isoformat(),
                "total_amount_cents": inv.total_amount_cents,
                "currency": inv.currency,
                "status": inv.status,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/invoices/{invoice_id}")
def api_get_invoice(invoice_id: int, ctx: dict = Depends(dev_auth)):
    try:
        inv, items = get_invoice(invoice_id)
        return {
            "request_id": ctx.get("request_id"),
            "invoice": {
                "id": inv.id,
                "customer_id": inv.customer_id,
                "period_start": inv.period_start.isoformat(),
                "period_end": inv.period_end.isoformat(),
                "total_amount_cents": inv.total_amount_cents,
                "currency": inv.currency,
                "status": inv.status,
                "stripe_invoice_id": inv.stripe_invoice_id,
                "items": [
                    {
                        "id": it.id,
                        "description": it.description,
                        "amount_cents": it.amount_cents,
                        "created_at": it.created_at.isoformat(),
                    }
                    for it in items
                ],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/invoices")
def api_list_invoices(
    customer_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    ctx: dict = Depends(dev_auth),
):
    try:
        rows, total = list_invoices(customer_id=customer_id, limit=limit, offset=offset)
        return {
            "request_id": ctx.get("request_id"),
            "total": total,
            "invoices": [
                {
                    "id": inv.id,
                    "customer_id": inv.customer_id,
                    "period_start": inv.period_start.isoformat(),
                    "period_end": inv.period_end.isoformat(),
                    "total_amount_cents": inv.total_amount_cents,
                    "currency": inv.currency,
                    "status": inv.status,
                    "stripe_invoice_id": inv.stripe_invoice_id,
                }
                for inv in rows
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscriptions/{subscription_id}")
def api_get_subscription(subscription_id: int, ctx: dict = Depends(dev_auth)):
    try:
        sub = get_subscription(subscription_id)
        return {
            "request_id": ctx.get("request_id"),
            "subscription": {
                "id": sub.id,
                "customer_id": sub.customer_id,
                "plan_id": sub.plan_id,
                "status": sub.status,
                "stripe_subscription_id": sub.stripe_subscription_id,
                "created_at": sub.created_at.isoformat(),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscriptions/by_stripe/{stripe_subscription_id}")
def api_get_subscription_by_stripe(stripe_subscription_id: str, ctx: dict = Depends(dev_auth)):
    try:
        sub = get_subscription_by_stripe_id(stripe_subscription_id)
        return {
            "request_id": ctx.get("request_id"),
            "subscription": {
                "id": sub.id,
                "customer_id": sub.customer_id,
                "plan_id": sub.plan_id,
                "status": sub.status,
                "stripe_subscription_id": sub.stripe_subscription_id,
                "created_at": sub.created_at.isoformat(),
            },
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/subscriptions")
def api_list_subscriptions(
    customer_id: int | None = Query(None),
    plan_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    ctx: dict = Depends(dev_auth),
):
    try:
        rows, total = list_subscriptions(customer_id=customer_id, plan_id=plan_id, limit=limit, offset=offset)
        return {
            "request_id": ctx.get("request_id"),
            "total": total,
            "subscriptions": [
                {
                    "id": sub.id,
                    "customer_id": sub.customer_id,
                    "plan_id": sub.plan_id,
                    "status": sub.status,
                    "stripe_subscription_id": sub.stripe_subscription_id,
                    "created_at": sub.created_at.isoformat(),
                }
                for sub in rows
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stripe/customers/ensure")
def api_ensure_stripe_customer(customer_id: int, ctx: dict = Depends(dev_auth)):
    try:
        sc = ensure_stripe_customer(customer_id)
        return {"request_id": ctx.get("request_id"), "stripe_customer_id": sc}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


class EnsureSubBody(BaseModel):
    customer_id: int
    plan_id: int
    stripe_price_id: str


@router.post("/stripe/subscriptions/ensure")
def api_ensure_stripe_subscription(body: EnsureSubBody, ctx: dict = Depends(dev_auth)):
    try:
        sid = ensure_stripe_subscription(customer_id=body.customer_id, plan_id=body.plan_id, stripe_price_id=body.stripe_price_id)
        return {"request_id": ctx.get("request_id"), "stripe_subscription_id": sid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stripe/invoices/push")
def api_push_invoice(invoice_id: int, ctx: dict = Depends(dev_auth)):
    try:
        si = push_invoice_to_stripe(invoice_id)
        return {"request_id": ctx.get("request_id"), "stripe_invoice_id": si}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/stripe/subscriptions/ensure_by_plan")
def api_ensure_stripe_subscription_by_plan(customer_id: int, plan_id: int, ctx: dict = Depends(dev_auth)):
    plan = get_plan(plan_id)
    if not plan or not plan.meta or not plan.meta.get("stripe_price_id"):
        raise HTTPException(status_code=400, detail="plan.meta.stripe_price_id missing")
    try:
        sid = ensure_stripe_subscription(customer_id=customer_id, plan_id=plan_id, stripe_price_id=plan.meta["stripe_price_id"])
        return {"request_id": ctx.get("request_id"), "stripe_subscription_id": sid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
