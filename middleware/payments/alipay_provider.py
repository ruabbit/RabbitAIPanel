from __future__ import annotations

import urllib.parse
from typing import Optional

from .provider import PaymentProvider
from .types import InitResult, PaymentEvent, RefundResult, PaymentStatus
from ..config import settings
from ..runtime_config import get as rc_get


class AlipayProvider:
    name = "alipay"

    def __init__(self) -> None:
        pass

    def create_payment(self, order: "Order") -> InitResult:  # type: ignore[name-defined]
        # Placeholder implementation returning a redirect URL form (page.pay)
        # In real integration, use app_id/keys; here we only construct a stub URL
        _app_id = rc_get("ALIPAY_APP_ID", str, settings.ALIPAY_APP_ID)
        params = {"out_trade_no": order.order_id, "total_amount": order.amount_cents / 100.0, "app_id": _app_id or ""}
        url = "https://openapi.alipay.com/gateway.do?" + urllib.parse.urlencode(params)
        return InitResult(type="redirect_url", payload={"url": url})

    def handle_webhook(self, headers: dict, body: bytes) -> PaymentEvent:
        # Alipay notify_url posts form-encoded; here we stub parse
        # Real implementation must verify signature with Alipay public key.
        qs = body.decode("utf-8")
        parsed = urllib.parse.parse_qs(qs)
        return PaymentEvent(
            event_type="payment_succeeded",
            order_id=parsed.get("out_trade_no", [""])[0],
            amount_cents=int(float(parsed.get("total_amount", ["0"])[0]) * 100),
            currency="CNY",
            provider_txn_id=parsed.get("trade_no", [""])[0],
            raw={k: v[0] for k, v in parsed.items()},
        )

    def refund(self, provider_txn_id: str, amount_cents: int | None, reason: str | None) -> RefundResult:
        return RefundResult(ok=False, error="not_implemented")

    def query(self, provider_txn_id: str) -> PaymentStatus:
        return PaymentStatus(status="created", amount_cents=0, currency="CNY", provider_txn_id=provider_txn_id)


alipay_provider = AlipayProvider()
