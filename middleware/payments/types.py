from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, Optional


InitType = Literal["client_secret", "redirect_url", "html_form"]


@dataclass
class InitResult:
    type: InitType
    payload: dict[str, Any]
    provider_txn_id: Optional[str] = None
    extra: Optional[dict[str, Any]] = None


@dataclass
class PaymentEvent:
    event_type: Literal[
        "payment_succeeded",
        "payment_failed",
        "refunded",
        "requires_action",
    ]
    order_id: str
    amount_cents: int
    currency: str
    provider_txn_id: str
    event_id: str | None = None
    raw: dict[str, Any]


@dataclass
class RefundResult:
    ok: bool
    provider_refund_id: Optional[str] = None
    error: Optional[str] = None


@dataclass
class PaymentStatus:
    status: Literal["created", "processing", "succeeded", "failed", "refunded"]
    amount_cents: int
    currency: str
    provider_txn_id: Optional[str]
    raw: Optional[dict[str, Any]] = None
