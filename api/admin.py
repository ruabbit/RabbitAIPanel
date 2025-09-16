from __future__ import annotations

from fastapi import APIRouter, Depends

from .deps import admin_auth


router = APIRouter(prefix="/v1/admin", tags=["admin"])


@router.get("/ping")
def admin_ping(ctx: dict = Depends(admin_auth)):
    return {"ok": True, "request_id": ctx.get("request_id")}

