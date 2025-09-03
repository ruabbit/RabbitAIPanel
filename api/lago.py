from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from .server import request_context
from middleware.lago.service import ingest_payment_event, ingest_usage_event


router = APIRouter(prefix="/lago/events", tags=["lago-events"])


class PaymentEventBody(BaseModel):
    event_type: str
    provider: str
    provider_txn_id: str
    order_id: str
    amount_cents: int
    currency: str = "USD"
    status: str | None = None
    request_id: str | None = None
    subject: dict | None = None
    meta: dict | None = None


@router.post("/payment")
def post_payment_event(body: PaymentEventBody, ctx: dict = Depends(request_context)):
    payload = body.model_dump()
    if not payload.get("request_id"):
        payload["request_id"] = ctx.get("request_id")
    ingest_payment_event(payload)
    return {"ok": True, "request_id": payload["request_id"]}


class UsageEventBody(BaseModel):
    usage_id: str
    subject: dict | None = None
    model: str
    unit: str = "token"
    tokens: dict | None = None
    pricing: dict | None = None
    timestamp: str | None = None
    request_id: str | None = None
    success: bool | None = None
    meta: dict | None = None


@router.post("/usage")
def post_usage_event(body: UsageEventBody, ctx: dict = Depends(request_context)):
    payload = body.model_dump()
    if not payload.get("request_id"):
        payload["request_id"] = ctx.get("request_id")
    ingest_usage_event(payload)
    return {"ok": True, "request_id": payload["request_id"]}

