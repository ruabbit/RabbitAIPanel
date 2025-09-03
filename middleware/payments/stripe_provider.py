from __future__ import annotations

import json
from typing import Optional

from .provider import PaymentProvider
from .types import InitResult, PaymentEvent, RefundResult, PaymentStatus
from ..config import settings


class StripeProvider:
    name = "stripe"

    def __init__(self) -> None:
        self.secret_key: Optional[str] = settings.STRIPE_SECRET_KEY
        self.webhook_secret: Optional[str] = settings.STRIPE_WEBHOOK_SECRET

    def create_payment(self, order: "Order") -> InitResult:  # type: ignore[name-defined]
        # Create a PaymentIntent and return client_secret for Payment Element
        try:
            import stripe  # type: ignore
        except Exception as e:  # pragma: no cover - runtime import
            raise RuntimeError("stripe library not installed") from e

        if not self.secret_key:
            raise RuntimeError("STRIPE_SECRET_KEY not configured")
        stripe.api_key = self.secret_key

        params = {
            "amount": int(order.amount_cents),
            "currency": order.currency.lower(),
            "automatic_payment_methods": {"enabled": True},
            "metadata": {"order_id": order.order_id},
        }
        # Use idempotency to avoid duplicate charges on retries.
        pi = stripe.PaymentIntent.create(**params, idempotency_key=order.order_id)

        payload = {
            "client_secret": pi.client_secret,
            "order_id": order.order_id,
            "amount_cents": order.amount_cents,
            "currency": order.currency,
        }
        return InitResult(type="client_secret", payload=payload, provider_txn_id=pi.id)

    def handle_webhook(self, headers: dict, body: bytes) -> PaymentEvent:
        # Verify and parse Stripe webhook
        try:
            import stripe  # type: ignore
        except Exception as e:  # pragma: no cover
            raise RuntimeError("stripe library not installed") from e

        data: dict
        if self.webhook_secret:
            sig = headers.get("stripe-signature") or headers.get("Stripe-Signature")
            if not sig:
                raise RuntimeError("Missing Stripe-Signature header")
            event = stripe.Webhook.construct_event(
                payload=body.decode("utf-8"), sig_header=sig, secret=self.webhook_secret
            )
            data = event
            obj = event["data"]["object"]
            event_type = event["type"]
            event_id = event.get("id")
        else:
            data = json.loads(body.decode("utf-8"))
            obj = data.get("data", {}).get("object", {})
            event_type = data.get("type")
            event_id = data.get("id")

        if event_type == "payment_intent.succeeded":
            status = "payment_succeeded"
        elif event_type == "payment_intent.payment_failed":
            status = "payment_failed"
        elif event_type == "charge.refunded" or event_type == "payment_intent.canceled":
            status = "refunded"
        else:
            status = "requires_action"

        return PaymentEvent(
            event_type=status,  # type: ignore[arg-type]
            order_id=(obj.get("metadata", {}) or {}).get("order_id", ""),
            amount_cents=int(obj.get("amount", 0)),
            currency=(obj.get("currency") or "usd").upper(),
            provider_txn_id=obj.get("id", ""),
            event_id=event_id,
            raw=data if isinstance(data, dict) else json.loads(str(data)),
        )

    def refund(self, provider_txn_id: str, amount_cents: int | None, reason: str | None) -> RefundResult:
        try:
            import stripe  # type: ignore
        except Exception as e:  # pragma: no cover
            return RefundResult(ok=False, error="stripe library not installed")
        if not self.secret_key:
            return RefundResult(ok=False, error="STRIPE_SECRET_KEY not configured")
        stripe.api_key = self.secret_key
        try:
            kwargs = {"payment_intent": provider_txn_id}
            if amount_cents:
                kwargs["amount"] = int(amount_cents)
            if reason:
                kwargs["reason"] = reason
            r = stripe.Refund.create(**kwargs)
            return RefundResult(ok=True, provider_refund_id=r.id)
        except Exception as e:  # pragma: no cover
            return RefundResult(ok=False, error=str(e))

    def query(self, provider_txn_id: str) -> PaymentStatus:
        try:
            import stripe  # type: ignore
        except Exception as e:  # pragma: no cover
            return PaymentStatus(status="created", amount_cents=0, currency="USD", provider_txn_id=provider_txn_id)
        if not self.secret_key:
            return PaymentStatus(status="created", amount_cents=0, currency="USD", provider_txn_id=provider_txn_id)
        stripe.api_key = self.secret_key
        pi = stripe.PaymentIntent.retrieve(provider_txn_id)
        status_map = {
            "succeeded": "succeeded",
            "processing": "processing",
            "requires_payment_method": "created",
            "requires_confirmation": "processing",
            "requires_action": "processing",
            "canceled": "failed",
        }
        status = status_map.get(getattr(pi, "status", "requires_payment_method"), "processing")
        return PaymentStatus(
            status=status,  # type: ignore[arg-type]
            amount_cents=int(getattr(pi, "amount", 0) or 0),
            currency=str(getattr(pi, "currency", "usd")).upper(),
            provider_txn_id=pi.id,
            raw=dict(pi),
        )


stripe_provider = StripeProvider()
