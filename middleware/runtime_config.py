from __future__ import annotations

import os
import time
from typing import Any, Callable
from sqlalchemy import text

from .db import SessionLocal


# Keys that must only come from environment variables
PROTECTED_ENV_KEYS = {"DATABASE_URL", "DEV_API_KEY"}

# Keys that should be treated as secrets when displaying via APIs
SENSITIVE_KEYS = {
    # payments
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "ALIPAY_APP_PRIVATE_KEY",
    # lago
    "LAGO_API_KEY",
    # litellm
    "LITELLM_MASTER_KEY",
    # auth/logto
    "LOGTO_CLIENT_SECRET",
    "LOGTO_MGMT_CLIENT_SECRET",
}


_cache: dict[str, str] = {}
_cache_loaded_at: float = 0.0
_cache_ttl_sec: int = int(os.getenv("RUNTIME_CONFIG_TTL_SEC", "60") or "60")


def _load_all_from_db() -> dict[str, str]:
    global _cache_loaded_at
    with SessionLocal() as s:
        rows = s.execute(text("SELECT key, value FROM settings")).fetchall()
        data: dict[str, str] = {}
        for k, v in rows:
            # normalize to string, None -> empty
            data[str(k)] = "" if v is None else str(v)
    _cache_loaded_at = time.time()
    return data


def _ensure_cache() -> None:
    now = time.time()
    if not _cache or (now - _cache_loaded_at) > _cache_ttl_sec:
        _cache.clear()
        _cache.update(_load_all_from_db())


def clear_cache() -> None:
    """Clear in-memory cache to force reload on next access."""
    global _cache_loaded_at
    _cache.clear()
    _cache_loaded_at = 0.0


def is_sensitive(key: str) -> bool:
    return key in SENSITIVE_KEYS


def is_protected_env_key(key: str) -> bool:
    return key in PROTECTED_ENV_KEYS


def _coerce(value: str | None, type_: type) -> Any:
    if value is None:
        return None
    v = value
    if type_ is bool:
        return str(v).strip() in ("1", "true", "True", "yes", "on")
    if type_ is int:
        try:
            return int(str(v).strip())
        except Exception:
            return None
    if type_ is float:
        try:
            return float(str(v).strip())
        except Exception:
            return None
    # default str
    return str(v)


def get(key: str, type_: type = str, default: Any | None = None) -> Any:
    """Get configuration value.

    Rules:
    - If key is protected (DATABASE_URL, DEV_API_KEY): return env only.
    - Else: try DB first, fallback to env if DB empty; when STRICT_DB_MODE=1, env fallback disabled.
    - Return converted type if possible, otherwise default.
    """
    strict = os.getenv("STRICT_DB_MODE", "0") in ("1", "true", "True")

    if is_protected_env_key(key):
        env_val = os.getenv(key)
        if env_val is None and key == "DATABASE_URL":
            env_val = "sqlite:///./dev.db"
        return _coerce(env_val, type_) if env_val is not None else default

    # DB-first
    _ensure_cache()
    db_val = _cache.get(key)
    if db_val is not None and db_val != "":
        v = _coerce(db_val, type_)
        return v if v is not None else default

    if strict:
        return default

    # Fallback env
    env_val = os.getenv(key)
    if env_val is not None:
        v = _coerce(env_val, type_)
        return v if v is not None else default

    return default

