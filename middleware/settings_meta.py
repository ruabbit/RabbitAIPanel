from __future__ import annotations

from typing import Any

# Registry of supported settings keys with metadata used by /v1/settings/keys and admin UI grouping.
# DATABASE_URL and DEV_API_KEY are intentionally excluded (env-only).

KEYS: list[dict[str, Any]] = [
    # Payments: Stripe
    {"key": "STRIPE_SECRET_KEY", "group": "payments", "label": "Stripe Secret Key", "type": "string", "sensitive": True, "desc": "Server-side secret for Stripe API"},
    {"key": "STRIPE_WEBHOOK_SECRET", "group": "payments", "label": "Stripe Webhook Secret", "type": "string", "sensitive": True, "desc": "Verify Stripe webhook signatures"},
    {"key": "STRIPE_PUBLISHABLE_KEY", "group": "payments", "label": "Stripe Publishable Key", "type": "string", "sensitive": False, "desc": "Frontend publishable key"},

    # Payments: Alipay (stub)
    {"key": "ALIPAY_APP_ID", "group": "payments", "label": "Alipay App ID", "type": "string", "sensitive": False},
    {"key": "ALIPAY_APP_PRIVATE_KEY", "group": "payments", "label": "Alipay App Private Key", "type": "multiline", "sensitive": True},
    {"key": "ALIPAY_PUBLIC_KEY", "group": "payments", "label": "Alipay Public Key", "type": "multiline", "sensitive": True},

    # Lago
    {"key": "LAGO_API_URL", "group": "lago", "label": "Lago API URL", "type": "string", "format": "url", "sensitive": False, "desc": "Base URL, e.g. https://lago.example.com"},
    {"key": "LAGO_API_KEY", "group": "lago", "label": "Lago API Key", "type": "string", "sensitive": True},
    {"key": "LAGO_EVENTS_ENABLED", "group": "lago", "label": "Lago Events Enabled", "type": "bool", "sensitive": False},
    {"key": "LAGO_PAYMENTS_ENDPOINT", "group": "lago", "label": "Payments Endpoint", "type": "string", "sensitive": False},
    {"key": "LAGO_USAGE_ENDPOINT", "group": "lago", "label": "Usage Endpoint", "type": "string", "sensitive": False},
    {"key": "LAGO_CREDIT_ENDPOINT", "group": "lago", "label": "Credit Endpoint", "type": "string", "sensitive": False},

    # LiteLLM
    {"key": "LITELLM_BASE_URL", "group": "litellm", "label": "LiteLLM Base URL", "type": "string", "format": "url", "sensitive": False, "desc": "Base URL of LiteLLM Proxy, e.g. https://llm.example.com"},
    {"key": "LITELLM_MASTER_KEY", "group": "litellm", "label": "LiteLLM Master Key", "type": "string", "sensitive": True},
    {"key": "LITELLM_BUDGET_DURATION", "group": "litellm", "label": "Budget Duration", "type": "string", "sensitive": False},
    {"key": "LITELLM_SYNC_ENABLED", "group": "litellm", "label": "Wallet→LiteLLM Sync Enabled", "type": "bool", "sensitive": False},
    {"key": "LITELLM_SYNC_INTERVAL_SEC", "group": "litellm", "label": "Sync Interval (sec)", "type": "int", "min": 60, "sensitive": False, "desc": "Minimum 60s"},
    {"key": "LITELLM_SYNC_CURRENCY", "group": "litellm", "label": "Sync Currency", "type": "string", "sensitive": False},

    # Auth/Logto
    {"key": "LOGTO_ENDPOINT", "group": "auth", "label": "Logto Endpoint", "type": "string", "format": "url", "sensitive": False, "desc": "e.g. https://tenant.logto.app"},
    {"key": "LOGTO_CLIENT_ID", "group": "auth", "label": "Logto Client ID", "type": "string", "sensitive": False},
    {"key": "LOGTO_CLIENT_SECRET", "group": "auth", "label": "Logto Client Secret", "type": "string", "sensitive": True},
    {"key": "LOGTO_REDIRECT_URI", "group": "auth", "label": "Redirect URI", "type": "string", "sensitive": False},
    {"key": "LOGTO_MGMT_CLIENT_ID", "group": "auth", "label": "Mgmt Client ID", "type": "string", "sensitive": False},
    {"key": "LOGTO_MGMT_CLIENT_SECRET", "group": "auth", "label": "Mgmt Client Secret", "type": "string", "sensitive": True},
    {"key": "LOGTO_MGMT_RESOURCE", "group": "auth", "label": "Mgmt Resource", "type": "string", "sensitive": False},
    {"key": "CONNECTOR_GOOGLE_ID", "group": "auth", "label": "Connector Google ID", "type": "string", "sensitive": False},
    {"key": "CONNECTOR_GITHUB_ID", "group": "auth", "label": "Connector GitHub ID", "type": "string", "sensitive": False},

    # Admin auth (production temporary scheme)
    {"key": "ADMIN_AUTH_TOKEN", "group": "auth", "label": "Admin Auth Token", "type": "string", "sensitive": True, "desc": "Admin header token for management APIs (x-admin-auth)"},

    # Rate limiting
    {"key": "RATE_LIMIT_ENABLED", "group": "rate_limit", "label": "Rate Limit Enabled", "type": "bool", "sensitive": False},
    {"key": "RATE_LIMIT_WINDOW_SEC", "group": "rate_limit", "label": "Window (sec)", "type": "int", "min": 1, "sensitive": False},
    {"key": "RATE_LIMIT_MAX_REQUESTS", "group": "rate_limit", "label": "Max Requests", "type": "int", "min": 1, "sensitive": False},

    # Overdraft gating / degrade
    {"key": "OVERDRAFT_GATING_ENABLED", "group": "overdraft", "label": "Overdraft Gating Enabled", "type": "bool", "sensitive": False},
    {"key": "OVERDRAFT_GATING_MODE", "group": "overdraft", "label": "Gating Mode", "type": "enum", "enum": ["block", "degrade"], "sensitive": False, "desc": "block: reject; degrade: force fallback model"},
    {"key": "DEGRADE_DEFAULT_MODEL", "group": "overdraft", "label": "Default Fallback Model", "type": "string", "sensitive": False},
    {"key": "DEGRADE_MAPPING", "group": "overdraft", "label": "Degrade Mapping", "type": "string", "sensitive": False},

    # Outbox / retries
    {"key": "OUTBOX_MAX_ATTEMPTS", "group": "other", "label": "Outbox Max Attempts", "type": "int", "sensitive": False},
]
