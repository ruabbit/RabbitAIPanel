from __future__ import annotations

import json
import time
import uuid
from typing import Any, Optional

import urllib.parse
import urllib.request

from middleware.config import settings


_mgmt_token_cache: dict[str, tuple[str, float]] = {}


def _post_form(url: str, data: dict[str, str]) -> dict[str, Any]:
    payload = urllib.parse.urlencode(data).encode("utf-8")
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=10) as resp:  # nosec - trusted endpoint from config
        raw = resp.read().decode("utf-8")
        return json.loads(raw)


def _req_json(method: str, url: str, *, token: str, body: Optional[dict[str, Any]] = None, extra_headers: Optional[dict[str, str]] = None) -> dict[str, Any]:
    data = None
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    if extra_headers:
        headers.update(extra_headers)
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=10) as resp:  # nosec
        raw = resp.read().decode("utf-8")
        if not raw:
            return {}
        return json.loads(raw)


def get_mgmt_access_token() -> str:
    """Fetch a management API access token via client_credentials.

    Caches token in-memory until ~55 minutes to reduce calls.
    LOGTO_MGMT_RESOURCE is recommended (e.g. https://api.logto.app or {LOGTO_ENDPOINT}/api).
    """
    client_id = settings.LOGTO_MGMT_CLIENT_ID or settings.LOGTO_CLIENT_ID
    client_secret = settings.LOGTO_MGMT_CLIENT_SECRET or settings.LOGTO_CLIENT_SECRET
    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    token_endpoint = f"{endpoint}/oidc/token"
    resource = settings.LOGTO_MGMT_RESOURCE or (f"{endpoint}/api" if endpoint else None)
    if not client_id or not client_secret or not endpoint or not resource:
        raise RuntimeError("logto management credentials not configured")

    cache_key = f"{client_id}:{resource}"
    token, exp = _mgmt_token_cache.get(cache_key, ("", 0.0))
    now = time.time()
    if token and now < exp - 60:
        return token

    data = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
        "resource": resource,
    }
    resp = _post_form(token_endpoint, data)
    access_token = resp.get("access_token")
    expires_in = int(resp.get("expires_in") or 3600)
    if not access_token:
        raise RuntimeError(f"failed to get mgmt token: {resp}")
    _mgmt_token_cache[cache_key] = (access_token, now + expires_in)
    return access_token


def create_temp_user(*, username_prefix: str = "temp_") -> dict[str, Any]:
    token = get_mgmt_access_token()
    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    url = f"{endpoint}/api/users"
    uname = f"{username_prefix}{uuid.uuid4().hex[:12]}"
    body = {"username": uname}
    return _req_json("POST", url, token=token, body=body)


def get_user(user_id: str) -> dict[str, Any]:
    token = get_mgmt_access_token()
    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    url = f"{endpoint}/api/users/{urllib.parse.quote(user_id)}"
    return _req_json("GET", url, token=token)


def update_user_username(user_id: str, *, username: str) -> dict[str, Any]:
    token = get_mgmt_access_token()
    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    url = f"{endpoint}/api/users/{urllib.parse.quote(user_id)}"
    return _req_json("PATCH", url, token=token, body={"username": username})


def set_primary_email(user_id: str, *, email: str) -> dict[str, Any]:
    token = get_mgmt_access_token()
    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    url = f"{endpoint}/api/users/{urllib.parse.quote(user_id)}"
    return _req_json("PATCH", url, token=token, body={"primaryEmail": email})


def update_profile(user_id: str, *, name: Optional[str] = None, avatar: Optional[str] = None) -> dict[str, Any]:
    token = get_mgmt_access_token()
    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    url = f"{endpoint}/api/users/{urllib.parse.quote(user_id)}/profile"
    body: dict[str, Any] = {}
    if name is not None:
        body["name"] = name
    if avatar is not None:
        body["avatar"] = avatar
    return _req_json("PATCH", url, token=token, body=body)


def bind_social_identity(user_id: str, *, verification_record_id: str, connector_target_id: str) -> dict[str, Any]:
    """Bind a verified social identity to the given user.

    Note: The exact header/parameters depend on Logto's verification flow for connectors.
    This function assumes passing verification id via header 'logto-verification-id'.
    """
    token = get_mgmt_access_token()
    endpoint = (settings.LOGTO_ENDPOINT or "").rstrip("/")
    url = f"{endpoint}/api/users/{urllib.parse.quote(user_id)}/identities"
    body = {"connectorTarget": connector_target_id}
    headers = {"logto-verification-id": verification_record_id}
    return _req_json("POST", url, token=token, body=body, extra_headers=headers)

