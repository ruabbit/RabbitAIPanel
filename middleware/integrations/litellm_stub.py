from __future__ import annotations

import json
import urllib.parse
import urllib.request

from ..config import settings


def update_budget_for_user(*, litellm_user_id: str | None, max_budget_cents: int | None, budget_duration: str | None) -> None:
    """Best-effort call to LiteLLM to update user's budget; non-fatal if not configured.

    Uses /user/new with fields to upsert budget according to LiteLLM docs.
    """
    if not settings.LITELLM_BASE_URL or not settings.LITELLM_MASTER_KEY or not litellm_user_id:
        return None

    url = settings.LITELLM_BASE_URL.rstrip("/") + "/user/new"
    body = {"user_id": litellm_user_id}
    if max_budget_cents is not None:
        # LiteLLM expects currency units, but we keep cents. Caller should convert if needed.
        body["max_budget"] = max_budget_cents / 100.0
    if (budget_duration or settings.LITELLM_BUDGET_DURATION):
        body["budget_duration"] = budget_duration or settings.LITELLM_BUDGET_DURATION

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.LITELLM_MASTER_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # nosec - trusted URL from config
            _ = resp.read()
    except Exception:
        return None
