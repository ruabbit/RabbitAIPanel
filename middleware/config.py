from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Settings:
    # database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

    # payment providers
    STRIPE_SECRET_KEY: str | None = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: str | None = os.getenv("STRIPE_WEBHOOK_SECRET")

    ALIPAY_APP_ID: str | None = os.getenv("ALIPAY_APP_ID")
    ALIPAY_APP_PRIVATE_KEY: str | None = os.getenv("ALIPAY_APP_PRIVATE_KEY")
    ALIPAY_PUBLIC_KEY: str | None = os.getenv("ALIPAY_PUBLIC_KEY")

    # lago
    LAGO_API_URL: str | None = os.getenv("LAGO_API_URL")
    LAGO_API_KEY: str | None = os.getenv("LAGO_API_KEY")
    LAGO_CREDIT_ENDPOINT: str = os.getenv("LAGO_CREDIT_ENDPOINT", "/credits")
    LAGO_EVENTS_ENABLED: bool = os.getenv("LAGO_EVENTS_ENABLED", "0") in ("1", "true", "True")
    LAGO_PAYMENTS_ENDPOINT: str = os.getenv("LAGO_PAYMENTS_ENDPOINT", "/events/payment")
    LAGO_USAGE_ENDPOINT: str = os.getenv("LAGO_USAGE_ENDPOINT", "/events/usage")

    # litellm
    LITELLM_BASE_URL: str | None = os.getenv("LITELLM_BASE_URL")
    LITELLM_MASTER_KEY: str | None = os.getenv("LITELLM_MASTER_KEY")
    LITELLM_BUDGET_LINKAGE: bool = os.getenv("LITELLM_BUDGET_LINKAGE", "0") in ("1", "true", "True")
    LITELLM_BUDGET_DURATION: str | None = os.getenv("LITELLM_BUDGET_DURATION")
    # optional periodic sync from wallet -> LiteLLM budget
    LITELLM_SYNC_ENABLED: bool = os.getenv("LITELLM_SYNC_ENABLED", "0") in ("1", "true", "True")
    LITELLM_SYNC_INTERVAL_SEC: int = int(os.getenv("LITELLM_SYNC_INTERVAL_SEC", "900"))
    LITELLM_SYNC_CURRENCY: str = os.getenv("LITELLM_SYNC_CURRENCY", "USD")
    # degrade default (demo): fallback model when policy=degrade and overflow
    DEGRADE_DEFAULT_MODEL: str = os.getenv("DEGRADE_DEFAULT_MODEL", "gpt-4o-mini")
    # overdraft next-request strong gating
    OVERDRAFT_GATING_ENABLED: bool = os.getenv("OVERDRAFT_GATING_ENABLED", "0") in ("1", "true", "True")
    OVERDRAFT_GATING_MODE: str = os.getenv("OVERDRAFT_GATING_MODE", "block")  # block|degrade
    # configurable degrade mapping: "pattern->fallback,pattern2->fallback2"
    DEGRADE_MAPPING: str = os.getenv("DEGRADE_MAPPING", "")

    # dev api auth
    DEV_API_KEY: str | None = os.getenv("DEV_API_KEY")

    # stripe publishable key for Payment Element
    STRIPE_PUBLISHABLE_KEY: str | None = os.getenv("STRIPE_PUBLISHABLE_KEY")


settings = Settings()
