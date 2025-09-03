from __future__ import annotations

from .registry import register_provider
from .stripe_provider import stripe_provider
from .alipay_provider import alipay_provider


def load_default_providers() -> None:
    register_provider(stripe_provider)
    register_provider(alipay_provider)

