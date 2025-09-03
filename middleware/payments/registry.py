from __future__ import annotations

from typing import Dict

from .provider import PaymentProvider


class _Registry:
    def __init__(self) -> None:
        self._providers: Dict[str, PaymentProvider] = {}

    def register(self, provider: PaymentProvider) -> None:
        key = provider.name.lower()
        self._providers[key] = provider

    def get(self, name: str) -> PaymentProvider:
        p = self._providers.get(name.lower())
        if p is None:
            raise KeyError(f"Payment provider not found: {name}")
        return p

    def all(self) -> dict[str, PaymentProvider]:
        return dict(self._providers)


provider_registry = _Registry()


def register_provider(provider: PaymentProvider) -> None:
    provider_registry.register(provider)

