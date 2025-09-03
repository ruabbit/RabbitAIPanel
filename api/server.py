from __future__ import annotations

import os
import time
import secrets
from typing import Optional

from fastapi import FastAPI, Header, Request, HTTPException, Query, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
from pydantic import BaseModel, Field

from middleware.db import init_db
from middleware.payments.service import create_checkout, process_webhook, refund_payment, get_payment_status
from middleware.config import settings
from .wallets import router as wallets_router


app = FastAPI(title="RabbitAIPanel Middleware API", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    # Ensure DB tables exist
    init_db()
    # Setup logging baseline
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# CORS (dev)
origins = [o.strip() for o in (os.getenv("DEV_CORS_ORIGINS", "*").split(","))]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def dev_auth(
    x_api_key: str | None = Header(default=None, alias="x-api-key"),
    x_dev_user_id: str | None = Header(default=None, alias="x-dev-user-id"),
):
    """Dev auth behavior:
    - If DEV_API_KEY not set: no auth (open dev mode).
    - If DEV_API_KEY set and header matches: bypass auth and simulate user via x-dev-user-id if provided.
    - If DEV_API_KEY set and header missing/mismatch: 401.
    Returns a context dict for downstream to pick dev_user_id.
    """
    ctx: dict = {}
    if settings.DEV_API_KEY:
        if not x_api_key or x_api_key != settings.DEV_API_KEY:
            raise HTTPException(status_code=401, detail="unauthorized")
        if x_dev_user_id:
            ctx["dev_user_id"] = x_dev_user_id
    return ctx


class CheckoutBody(BaseModel):
    user_id: Optional[int] = None
    amount_cents: int = Field(gt=0)
    currency: str = Field(min_length=3, max_length=8)
    provider: str = "stripe"
    order_id: Optional[str] = None


@app.post("/v1/payments/checkout")
def api_checkout(body: CheckoutBody, ctx: dict = Depends(dev_auth)):
    order_id = body.order_id or f"ORD-{int(time.time())}-{secrets.token_hex(4)}"
    user_id = body.user_id or ctx.get("dev_user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required (or provide x-dev-user-id header in dev mode)")
    try:
        init = create_checkout(
            user_id=int(user_id),
            provider_name=body.provider,
            order_id=order_id,
            amount_cents=body.amount_cents,
            currency=body.currency.upper(),
        )
        return {
            "order_id": order_id,
            "type": init.type,
            "payload": init.payload,
            "provider_txn_id": init.provider_txn_id,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/v1/webhooks/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    headers = {k: v for k, v in request.headers.items()}
    try:
        event = process_webhook(provider_name="stripe", headers=headers, body=body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "event_type": event.event_type, "order_id": event.order_id}


class RefundBody(BaseModel):
    provider: str = "stripe"
    provider_txn_id: Optional[str] = None
    order_id: Optional[str] = None
    amount_cents: Optional[int] = Field(default=None, gt=0)
    reason: Optional[str] = None


@app.post("/v1/payments/refund")
def api_refund(body: RefundBody, _: bool = Depends(dev_auth)):
    try:
        res = refund_payment(
            provider_name=body.provider,
            provider_txn_id=body.provider_txn_id,
            order_id=body.order_id,
            amount_cents=body.amount_cents,
            reason=body.reason,
        )
        if not res.ok:
            raise HTTPException(status_code=400, detail=res.error or "refund failed")
        return {"ok": True, "provider_refund_id": res.provider_refund_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/v1/payments/status")
def api_status(
    provider: str = Query("stripe"),
    provider_txn_id: Optional[str] = None,
    order_id: Optional[str] = None,
    _: bool = Depends(dev_auth),
):
    try:
        data = get_payment_status(provider_name=provider, provider_txn_id=provider_txn_id, order_id=order_id)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.get("/")
def root():
    return {"ok": True, "service": "RabbitAIPanel Middleware API"}


@app.get("/demo/payment_element")
def demo_payment_element():
    # Serve static demo page. Use query: pk=pk_test..., api=http://localhost:8000, key=DEV_API_KEY
    path = os.path.join(os.path.dirname(__file__), "static", "payment_element.html")
    return FileResponse(path)


# Mount wallets API
app.include_router(wallets_router)


# Simple config endpoint to retrieve Stripe publishable key for frontend
@app.get("/v1/config/stripe")
def get_stripe_config():
    if not settings.STRIPE_PUBLISHABLE_KEY:
        raise HTTPException(status_code=404, detail="stripe publishable key not configured")
    return {"publishable_key": settings.STRIPE_PUBLISHABLE_KEY}
