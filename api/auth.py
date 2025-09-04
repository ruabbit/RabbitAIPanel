from __future__ import annotations

import time
import uuid
import urllib.parse
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse

from .server import dev_auth, request_context
from middleware.config import settings
from middleware.integrations.logto_mgmt import (
    create_temp_user,
    bind_social_identity,
    exchange_code_for_tokens,
    get_userinfo,
    get_user,
    set_primary_email,
    update_profile,
    update_user_username,
)


router = APIRouter(prefix="/v1/auth", tags=["auth"])


_social_states: dict[str, dict] = {}


def _resolve_connector(provider: str) -> Optional[str]:
    p = provider.lower()
    mapping = {
        "google": settings.CONNECTOR_GOOGLE_ID,
        "github": settings.CONNECTOR_GITHUB_ID,
    }
    return mapping.get(p)


@router.post("/social/start")
def social_start(provider: str = Query(..., description="google|github"), ctx: dict = Depends(dev_auth)):
    if not settings.LOGTO_ENDPOINT or not settings.LOGTO_CLIENT_ID or not settings.LOGTO_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="logto not configured")

    # 1) create temp_ user via management api
    try:
        temp_user = create_temp_user()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"create temp user failed: {e}")
    temp_user_id = str(temp_user.get("id") or temp_user.get("userId") or "")
    if not temp_user_id:
        raise HTTPException(status_code=500, detail="temp user id missing")

    # 2) state/nonce
    state = uuid.uuid4().hex
    now = int(time.time())
    _social_states[state] = {
        "tmp_user_id": temp_user_id,
        "provider": provider,
        "created_at": now,
    }

    # 3) redirect to Logto OIDC authorize (generic). In real use, you can refine to open provider directly.
    endpoint = settings.LOGTO_ENDPOINT.rstrip("/")
    client_id = settings.LOGTO_CLIENT_ID
    redirect_uri = settings.LOGTO_REDIRECT_URI
    scope = urllib.parse.quote("openid profile email offline_access")
    auth_url = f"{endpoint}/oidc/auth?client_id={urllib.parse.quote(client_id)}&response_type=code&redirect_uri={urllib.parse.quote(redirect_uri)}&scope={scope}&state={state}"

    # optional hints: show sign-up first and pre-select identifier panel; provider selection left to Logto UI
    # Developers can customize UI via Logto Console. For demo we keep it generic.

    return {"request_id": ctx.get("request_id"), "redirect_to": auth_url, "state": state, "temp_user_id": temp_user_id}


# public callback (no dev auth)
@router.get("/social/callback", include_in_schema=False)
def social_callback(
    state: str = Query(...),
    code: Optional[str] = Query(None),
    ver: Optional[str] = Query(None, description="verification_record_id"),
    provider: Optional[str] = Query(None),
    connector: Optional[str] = Query(None, description="connector_target_id (optional)"),
):
    """Callback entry after Logto authorization.

    Note: In a full implementation, this endpoint should:
    - Exchange `code` for tokens if needed; OR
    - Use `ver` (verification_record_id) and connector_target_id to bind identity to the temp user;
    - Update user's email/name/avatar via Management API; rename username to email;
    - Then redirect to standard OIDC login to establish session.

    For demo, we validate state and bounce to a generic sign-in with the same state.
    """
    st = _social_states.get(state)
    if not st:
        raise HTTPException(status_code=400, detail="invalid state")
    # lifetimes: 15 minutes
    if st["created_at"] + 900 < int(time.time()):
        del _social_states[state]
        raise HTTPException(status_code=400, detail="state expired")

    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    client_id = settings.LOGTO_CLIENT_ID
    if not endpoint or not client_id:
        raise HTTPException(status_code=500, detail="logto not configured")

    tmp_user_id = st.get("tmp_user_id")

    # 1) Bind social identity to temp_ user if verification info is present
    # connector target may come from query or env mapping
    if ver:
        connector_target_id = connector or _resolve_connector(provider or "") or ""
        if not connector_target_id:
            # proceed without binding; will still attempt profile sync via tokens
            pass
        else:
            try:
                bind_social_identity(tmp_user_id, verification_record_id=ver, connector_target_id=connector_target_id)
            except Exception:
                # swallow for demo; binding can be retried later
                pass

    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None

    # 2) If we have `code`, exchange for tokens and query userinfo to backfill
    if code:
        try:
            tokens = exchange_code_for_tokens(code=code)
            access_token = tokens.get("access_token")
            if access_token:
                info = get_userinfo(access_token=access_token)
                email = info.get("email") or info.get("primaryEmail") or None
                name = info.get("name") or info.get("username") or None
                avatar = info.get("picture") or info.get("avatar") or None
        except Exception:
            pass

    # 3) Backfill profile to Logto user
    if tmp_user_id:
        try:
            if email:
                try:
                    set_primary_email(tmp_user_id, email=email)
                except Exception:
                    pass
            if name or avatar:
                try:
                    update_profile(tmp_user_id, name=name, avatar=avatar)
                except Exception:
                    pass
            # rename temp_ username to email (if present)
            try:
                u = get_user(tmp_user_id)
                uname = str(u.get("username") or "")
                if email and uname.startswith("temp_"):
                    update_user_username(tmp_user_id, username=email)
            except Exception:
                pass
        except Exception:
            pass

    # Cleanup used state
    try:
        del _social_states[state]
    except Exception:
        pass

    # 4) Redirect to root or a front-end page (customize later)
    return RedirectResponse(url="/")
