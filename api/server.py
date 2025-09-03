from __future__ import annotations

import os
import time
import secrets
from typing import Optional

from fastapi import FastAPI, Header, Request, HTTPException, Query, Depends, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import uuid
from pydantic import BaseModel, Field
import asyncio

from middleware.db import init_db
from middleware.payments.service import create_checkout, process_webhook, refund_payment, get_payment_status
from middleware.config import settings
from .wallets import router as wallets_router
from .plans import router as plans_router
from .proxy import router as proxy_router
from .lago import router as lago_router
from middleware.integrations.litellm_sync import sync_wallets_to_litellm


app = FastAPI(title="RabbitAIPanel Middleware API", version="0.1.0")
logger = logging.getLogger(__name__)


@app.on_event("startup")
def on_startup() -> None:
    # Ensure DB tables exist
    init_db()
    # Setup logging baseline
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    # Periodic LiteLLM budget sync
    if settings.LITELLM_SYNC_ENABLED:
        interval = max(60, int(settings.LITELLM_SYNC_INTERVAL_SEC))
        currency = settings.LITELLM_SYNC_CURRENCY

        async def _runner():
            await asyncio.sleep(2)
            try:
                await asyncio.to_thread(sync_wallets_to_litellm, currency)
            except Exception:
                pass
            while True:
                await asyncio.sleep(interval)
                try:
                    await asyncio.to_thread(sync_wallets_to_litellm, currency)
                except Exception:
                    pass

        asyncio.create_task(_runner())

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
    response: Response,
    x_api_key: str | None = Header(default=None, alias="x-api-key"),
    x_dev_user_id: str | None = Header(default=None, alias="x-dev-user-id"),
    x_request_id: str | None = Header(default=None, alias="x-request-id"),
):
    """Dev auth behavior:
    - If DEV_API_KEY not set: no auth (open dev mode).
    - If DEV_API_KEY set and header matches: bypass auth and simulate user via x-dev-user-id if provided.
    - If DEV_API_KEY set and header missing/mismatch: 401.
    Returns a context dict for downstream to pick dev_user_id.
    """
    ctx: dict = {}
    # request id propagation
    request_id = (x_request_id or str(uuid.uuid4()))
    ctx["request_id"] = request_id
    response.headers["x-request-id"] = request_id
    if settings.DEV_API_KEY:
        if not x_api_key or x_api_key != settings.DEV_API_KEY:
            raise HTTPException(status_code=401, detail="unauthorized")
        if x_dev_user_id:
            ctx["dev_user_id"] = x_dev_user_id
    return ctx


def request_context(
    response: Response,
    x_request_id: str | None = Header(default=None, alias="x-request-id"),
):
    request_id = (x_request_id or str(uuid.uuid4()))
    response.headers["x-request-id"] = request_id
    return {"request_id": request_id}


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
        logger.info(
            "checkout.created request_id=%s provider=%s order_id=%s user_id=%s amount_cents=%s currency=%s",
            ctx.get("request_id"),
            body.provider,
            order_id,
            user_id,
            body.amount_cents,
            body.currency.upper(),
        )
        return {
            "request_id": ctx.get("request_id"),
            "order_id": order_id,
            "type": init.type,
            "payload": init.payload,
            "provider_txn_id": init.provider_txn_id,
        }
    except Exception as e:
        logger.warning("checkout.error request_id=%s order_id=%s err=%s", ctx.get("request_id"), order_id, e)
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/v1/webhooks/stripe")
async def stripe_webhook(request: Request, response: Response):
    body = await request.body()
    headers = {k: v for k, v in request.headers.items()}
    # request id propagation for webhooks
    request_id = headers.get("x-request-id") or str(uuid.uuid4())
    response.headers["x-request-id"] = request_id
    try:
        event = process_webhook(provider_name="stripe", headers=headers, body=body, request_id=request_id)
    except Exception as e:
        logger.warning("webhook.error request_id=%s provider=stripe err=%s", request_id, e)
        raise HTTPException(status_code=400, detail=str(e))
    logger.info("webhook.handled request_id=%s provider=stripe event_type=%s order_id=%s", request_id, event.event_type, event.order_id)
    return {"ok": True, "request_id": request_id, "event_type": event.event_type, "order_id": event.order_id}


class RefundBody(BaseModel):
    provider: str = "stripe"
    provider_txn_id: Optional[str] = None
    order_id: Optional[str] = None
    amount_cents: Optional[int] = Field(default=None, gt=0)
    reason: Optional[str] = None


@app.post("/v1/payments/refund")
def api_refund(body: RefundBody, ctx: dict = Depends(dev_auth)):
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
        logger.info(
            "refund.ok request_id=%s provider=%s order_id=%s provider_txn_id=%s amount_cents=%s",
            ctx.get("request_id"),
            body.provider,
            body.order_id,
            body.provider_txn_id,
            body.amount_cents,
        )
        return {"ok": True, "request_id": ctx.get("request_id"), "provider_refund_id": res.provider_refund_id}
    except Exception as e:
        logger.warning(
            "refund.error request_id=%s provider=%s order_id=%s provider_txn_id=%s err=%s",
            ctx.get("request_id"),
            body.provider,
            body.order_id,
            body.provider_txn_id,
            e,
        )
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/v1/payments/status")
def api_status(
    provider: str = Query("stripe"),
    provider_txn_id: Optional[str] = None,
    order_id: Optional[str] = None,
    ctx: dict = Depends(dev_auth),
):
    try:
        data = get_payment_status(provider_name=provider, provider_txn_id=provider_txn_id, order_id=order_id)
        logger.info(
            "status.query request_id=%s provider=%s order_id=%s provider_txn_id=%s local_status=%s provider_status=%s",
            ctx.get("request_id"),
            provider,
            order_id,
            provider_txn_id,
            (data.get("local") or {}).get("payment_status"),
            (data.get("provider") or {}).get("status"),
        )
        return {**data, "request_id": ctx.get("request_id")}
    except Exception as e:
        logger.warning(
            "status.error request_id=%s provider=%s order_id=%s provider_txn_id=%s err=%s",
            ctx.get("request_id"),
            provider,
            order_id,
            provider_txn_id,
            e,
        )
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/healthz")
def healthz(ctx: dict = Depends(request_context)):
    return {"ok": True, "request_id": ctx.get("request_id")}


@app.get("/")
def root(ctx: dict = Depends(request_context)):
    return {"ok": True, "service": "RabbitAIPanel Middleware API", "request_id": ctx.get("request_id")}


@app.get("/demo/payment_element")
def demo_payment_element():
    # Serve static demo page. Use query: pk=pk_test..., api=http://localhost:8000, key=DEV_API_KEY
    path = os.path.join(os.path.dirname(__file__), "static", "payment_element.html")
    return FileResponse(path)


# Mount wallets API
app.include_router(wallets_router)
app.include_router(plans_router)
app.include_router(proxy_router)
app.include_router(lago_router)


# Simple config endpoint to retrieve Stripe publishable key for frontend
@app.get("/v1/config/stripe")
def get_stripe_config(ctx: dict = Depends(request_context)):
    if not settings.STRIPE_PUBLISHABLE_KEY:
        raise HTTPException(status_code=404, detail="stripe publishable key not configured")
    return {"publishable_key": settings.STRIPE_PUBLISHABLE_KEY, "request_id": ctx.get("request_id")}
