from __future__ import annotations

from typing import Protocol

from .types import InitResult, PaymentEvent, RefundResult, PaymentStatus


class PaymentProvider(Protocol):
    name: str

    def create_payment(self, order: "Order") -> InitResult:  # type: ignore[name-defined]
        ...

    def handle_webhook(self, headers: dict, body: bytes) -> PaymentEvent:
        ...

    def refund(self, provider_txn_id: str, amount_cents: int | None, reason: str | None) -> RefundResult:
        ...

    def query(self, provider_txn_id: str) -> PaymentStatus:
        ...

