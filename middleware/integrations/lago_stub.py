from __future__ import annotations

import json
import urllib.request

from ..config import settings


def record_credit(*, user_id: int, currency: str, amount_cents: int, order_id: str) -> None:
    """Create a credit/invoice in Lago (best-effort, non-fatal if misconfigured)."""
    if not settings.LAGO_API_URL or not settings.LAGO_API_KEY:
        return None
    url = settings.LAGO_API_URL.rstrip("/") + settings.LAGO_CREDIT_ENDPOINT
    payload = {
        "user_id": user_id,
        "currency": currency.upper(),
        "amount_cents": amount_cents,
        "reference": order_id,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.LAGO_API_KEY}",
    })
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # nosec - trusted URL from config
            _ = resp.read()
    except Exception:
        # best-effort; log in real impl
        return None
