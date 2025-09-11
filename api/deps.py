from __future__ import annotations

import uuid
from fastapi import Header, HTTPException, Response
from middleware.config import settings


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

