from __future__ import annotations

import uuid
from fastapi import Header, HTTPException, Response
from middleware.config import settings
from middleware.runtime_config import get as rc_get


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


def admin_auth(
    response: Response,
    x_admin_auth: str | None = Header(default=None, alias="x-admin-auth"),
    x_api_key: str | None = Header(default=None, alias="x-api-key"),
    x_request_id: str | None = Header(default=None, alias="x-request-id"),
):
    """Admin auth behavior (production temporary scheme):
    - Reads ADMIN_AUTH_TOKEN from DB settings.
    - If present, require header x-admin-auth to match.
    - In debug mode (DEV_API_KEY with matching x-api-key), allow access even without x-admin-auth.
    - If not present and not in debug mode, deny with 401.
    Returns context with request_id and is_debug flag.
    """
    ctx: dict = {}
    request_id = (x_request_id or str(uuid.uuid4()))
    ctx["request_id"] = request_id
    response.headers["x-request-id"] = request_id

    admin_token = rc_get("ADMIN_AUTH_TOKEN", str, None)

    # detect debug (header matches DEV_API_KEY when set)
    is_debug = False
    if settings.DEV_API_KEY and x_api_key and x_api_key == settings.DEV_API_KEY:
        is_debug = True
    # also consider open dev when DEV_API_KEY unset
    if not settings.DEV_API_KEY:
        is_debug = True
    ctx["is_debug"] = is_debug

    if admin_token:
        if x_admin_auth and x_admin_auth == admin_token:
            return ctx
        # allow debug override
        if is_debug:
            return ctx
        raise HTTPException(status_code=401, detail="unauthorized")
    else:
        # No admin token configured: debug only
        if is_debug:
            return ctx
        raise HTTPException(status_code=401, detail="unauthorized")
