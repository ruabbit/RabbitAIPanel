from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .deps import dev_auth
from middleware.config import settings
from middleware.billing.service import (
    get_customer,
    update_customer,
    create_customer,
)
from middleware.db import SessionLocal
from middleware.models import Customer


router = APIRouter(prefix="/v1", tags=["users"])


@router.get("/me")
def api_get_me(ctx: dict = Depends(dev_auth)):
    """Best-effort current user profile in dev mode.

    Priority:
    1) If x-dev-user-id is provided, return Customer for entity_type=user & entity_id
    2) If not found or not provided, fallback to the most recent Customer of type 'user' (if any)
    """
    # If debug mode not enabled (DEV_API_KEY unset), do not allow dev headers and return not_logged_in
    if not settings.DEV_API_KEY:
        raise HTTPException(status_code=401, detail="not_logged_in")
    dev_user_id = ctx.get("dev_user_id")
    with SessionLocal() as s:
        c = None
        uid_val = None
        if dev_user_id is not None:
            try:
                uid_val = int(dev_user_id)
            except Exception:
                uid_val = None
        if uid_val is not None:
            c = s.query(Customer).filter_by(entity_type="user", entity_id=uid_val).first()
        if not c:
            # fallback: latest user customer
            c = s.query(Customer).filter_by(entity_type="user").order_by(Customer.created_at.desc()).first()
            if c:
                uid_val = c.entity_id
        if not c:
            return {"request_id": ctx.get("request_id"), "me": {"user_id": uid_val, "name": None, "email": None}}
        return {
            "request_id": ctx.get("request_id"),
            "me": {
                "user_id": uid_val,
                "name": c.name,
                "email": c.email,
            },
        }


class UpdateMeBody(BaseModel):
    name: str | None = None
    email: str | None = None


@router.patch("/me")
def api_update_me(body: UpdateMeBody, ctx: dict = Depends(dev_auth)):
    dev_user_id = ctx.get("dev_user_id")
    if not dev_user_id:
        raise HTTPException(status_code=401, detail="unauthorized")
    with SessionLocal() as s:
        c = s.query(Customer).filter_by(entity_type="user", entity_id=int(dev_user_id)).first()
        if not c:
            # create new customer for this user entity
            c = create_customer(entity_type="user", entity_id=int(dev_user_id), name=body.name, email=body.email)
            return {
                "request_id": ctx.get("request_id"),
                "me": {"user_id": int(dev_user_id), "name": c.name, "email": c.email},
            }
    # Update via service (separate session)
    c2 = update_customer(c.id, name=body.name, email=body.email)
    return {"request_id": ctx.get("request_id"), "me": {"user_id": int(dev_user_id), "name": c2.name, "email": c2.email}}
