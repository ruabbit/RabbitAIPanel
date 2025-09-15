from __future__ import annotations

import json
import urllib.parse
import urllib.request

from ..config import settings
from ..runtime_config import get as rc_get


def update_budget_for_user(*, litellm_user_id: str | None, max_budget_cents: int | None, budget_duration: str | None) -> None:
    """Best-effort call to LiteLLM to update user's budget; non-fatal if not configured.

    Uses /user/new with fields to upsert budget according to LiteLLM docs.
    """
    if not rc_get("LITELLM_BASE_URL", str, settings.LITELLM_BASE_URL) or not rc_get("LITELLM_MASTER_KEY", str, settings.LITELLM_MASTER_KEY) or not litellm_user_id:
        return None

    url = rc_get("LITELLM_BASE_URL", str, settings.LITELLM_BASE_URL).rstrip("/") + "/user/new"
    body = {"user_id": litellm_user_id}
    if max_budget_cents is not None:
        # LiteLLM expects currency units, but we keep cents. Caller should convert if needed.
        body["max_budget"] = max_budget_cents / 100.0
    bd = budget_duration or rc_get("LITELLM_BUDGET_DURATION", str, settings.LITELLM_BUDGET_DURATION)
    if bd:
        body["budget_duration"] = bd

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {rc_get('LITELLM_MASTER_KEY', str, settings.LITELLM_MASTER_KEY)}",
    })
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # nosec - trusted URL from config
            _ = resp.read()
    except Exception:
        return None
