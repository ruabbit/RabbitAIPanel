from __future__ import annotations

import json
import urllib.request

from ..config import settings
from ..runtime_config import get as rc_get


def record_credit(*, user_id: int, currency: str, amount_cents: int, order_id: str) -> None:
    """Create a credit/invoice in Lago (best-effort, non-fatal if misconfigured)."""
    if not rc_get("LAGO_API_URL", str, settings.LAGO_API_URL) or not rc_get("LAGO_API_KEY", str, settings.LAGO_API_KEY):
        return None


def _post_json(endpoint: str, payload: dict) -> None:
    if not rc_get("LAGO_API_URL", str, settings.LAGO_API_URL) or not rc_get("LAGO_API_KEY", str, settings.LAGO_API_KEY):
        return None
    url = rc_get("LAGO_API_URL", str, settings.LAGO_API_URL).rstrip("/") + endpoint
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {rc_get('LAGO_API_KEY', str, settings.LAGO_API_KEY)}",
    })
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # nosec - trusted URL from config
            _ = resp.read()
    except Exception:
        # enqueue outbox for retry
        try:
            from ..billing.service import enqueue_http_post  # type: ignore
            enqueue_http_post(endpoint=url, payload=payload)
        except Exception:
            pass
        return None


def record_payment(*, event_type: str, provider: str, provider_txn_id: str, order_id: str, amount_cents: int, currency: str, user_id: int | None = None, team_id: int | None = None, status: str | None = None, request_id: str | None = None, meta: dict | None = None) -> None:
    """Best-effort post of payment event to Lago (optional)."""
    if not rc_get("LAGO_EVENTS_ENABLED", bool, settings.LAGO_EVENTS_ENABLED):
        return None
    payload = {
        "event_type": event_type,
        "provider": provider,
        "provider_txn_id": provider_txn_id,
        "order_id": order_id,
        "amount_cents": amount_cents,
        "currency": currency.upper(),
        "status": status,
        "request_id": request_id,
        "subject": {"user_id": user_id, "team_id": team_id},
        "meta": meta or {},
    }
    # Prefer internal ingestion when available
    try:
        from ..lago.service import ingest_payment_event  # type: ignore
        ingest_payment_event(payload)
        return None
    except Exception:
        pass
    _post_json(rc_get("LAGO_PAYMENTS_ENDPOINT", str, settings.LAGO_PAYMENTS_ENDPOINT), payload)


def record_usage(*, usage_id: str, user_id: int | None, team_id: int | None, model: str, unit: str, total_tokens: int | None = None, input_tokens: int | None = None, output_tokens: int | None = None, unit_base_price_cents: int | None = None, price_multiplier: float | None = None, computed_amount_cents: int | None = None, currency: str = "USD", timestamp: str | None = None, request_id: str | None = None, success: bool | None = None, meta: dict | None = None) -> None:
    """Best-effort post of usage event to Lago (optional)."""
    if not rc_get("LAGO_EVENTS_ENABLED", bool, settings.LAGO_EVENTS_ENABLED):
        return None
    payload = {
        "usage_id": usage_id,
        "subject": {"user_id": user_id, "team_id": team_id},
        "model": model,
        "unit": unit,
        "tokens": {"total": total_tokens, "input": input_tokens, "output": output_tokens},
        "pricing": {"unit_base_price_cents": unit_base_price_cents, "price_multiplier": price_multiplier, "computed_amount_cents": computed_amount_cents, "currency": currency.upper()},
        "timestamp": timestamp,
        "request_id": request_id,
        "success": success,
        "meta": meta or {},
    }
    try:
        from ..lago.service import ingest_usage_event  # type: ignore
        ingest_usage_event(payload)
        return None
    except Exception:
        pass
    _post_json(rc_get("LAGO_USAGE_ENDPOINT", str, settings.LAGO_USAGE_ENDPOINT), payload)
    url = rc_get("LAGO_API_URL", str, settings.LAGO_API_URL).rstrip("/") + rc_get("LAGO_CREDIT_ENDPOINT", str, settings.LAGO_CREDIT_ENDPOINT)
    payload = {
        "user_id": user_id,
        "currency": currency.upper(),
        "amount_cents": amount_cents,
        "reference": order_id,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {rc_get('LAGO_API_KEY', str, settings.LAGO_API_KEY)}",
    })
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:  # nosec - trusted URL from config
            _ = resp.read()
    except Exception:
        # best-effort; log in real impl
        return None
