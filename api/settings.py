from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any

from .deps import admin_auth
from middleware.db import SessionLocal
from middleware.config import settings
from middleware.runtime_config import is_sensitive, clear_cache, get as rc_get
from middleware.settings_meta import KEYS as SETTINGS_KEYS
import re
from sqlalchemy import text
import urllib.request
import urllib.error


router = APIRouter(prefix="/v1/settings", tags=["settings"])


def _fetch_all_settings() -> list[dict[str, Any]]:
    with SessionLocal() as s:
        rows = s.execute(text("SELECT key, value, updated_at FROM settings")).fetchall()
        out = []
        for r in rows:
            k = r[0]
            v = r[1]
            item: dict[str, Any] = {"key": k, "updated_at": str(r[2]) if r[2] is not None else None}
            if is_sensitive(str(k)):
                # Mask secrets, do not return actual value
                item["masked"] = True
                item["configured"] = (v is not None) and (str(v) != "")
            else:
                item["masked"] = False
                item["value"] = v
            out.append(item)
        return out


def _get_db_layer() -> int:
    with SessionLocal() as s:
        r = s.execute(text("SELECT value FROM settings WHERE key='db_layer'"))
        row = r.first()
        try:
            return int(row[0]) if row else 0
        except Exception:
            return 0


@router.get("")
def get_settings(ctx: dict = Depends(admin_auth)):
    all_settings = _fetch_all_settings()
    # Do not expose raw DEV_API_KEY; just indicate if configured
    dev_key_configured = bool(settings.DEV_API_KEY)
    return {
        "request_id": ctx.get("request_id"),
        "settings": all_settings,
        "db_layer": _get_db_layer(),
        "dev_api_key_configured": dev_key_configured,
    }


@router.get("/keys")
def get_settings_keys(ctx: dict = Depends(admin_auth)):
    groups: dict[str, list[dict[str, Any]]] = {}
    for item in SETTINGS_KEYS:
        g = item.get("group") or "other"
        groups.setdefault(g, []).append(item)
    return {
        "request_id": ctx.get("request_id"),
        "keys": SETTINGS_KEYS,
        "groups": groups,
    }


class UpdateSettingsBody(BaseModel):
    values: dict[str, Any]


@router.patch("")
def update_settings(body: UpdateSettingsBody, ctx: dict = Depends(admin_auth)):
    # Disallow updating protected keys
    protected = {"db_layer", "DEV_API_KEY", "dev_api_key", "DevApiKey", "Dev_Api_Key"}
    raw_updates = {k: v for k, v in (body.values or {}).items() if k not in protected}
    # Validate and normalize according to metadata
    meta_map = {m.get("key"): m for m in SETTINGS_KEYS}
    updates: dict[str, str] = {}
    for k, v in raw_updates.items():
        m = meta_map.get(k)
        if not m:
            # accept unknown keys as plain strings
            updates[k] = "" if v is None else str(v)
            continue
        t = m.get("type") or "string"
        # restrict admin token changes to debug mode only
        if k == "ADMIN_AUTH_TOKEN" and not ctx.get("is_debug"):
            raise HTTPException(status_code=403, detail="forbidden")
        if t == "bool":
            sval = str(v).strip().lower()
            b = sval in ("1", "true", "yes", "on") if not isinstance(v, bool) else bool(v)
            updates[k] = "true" if b else "false"
        elif t == "int":
            try:
                iv = int(str(v).strip())
            except Exception:
                raise HTTPException(status_code=400, detail=f"invalid_int:{k}")
            if isinstance(m.get("min"), int) and iv < int(m["min"]):
                raise HTTPException(status_code=400, detail=f"min_violation:{k}:{m['min']}")
            updates[k] = str(iv)
        elif t == "enum":
            opts = m.get("enum") or []
            sv = str(v)
            if sv not in opts:
                raise HTTPException(status_code=400, detail=f"invalid_enum:{k}:{','.join(opts)}")
            updates[k] = sv
        else:
            # string/multiline
            sv = "" if v is None else str(v)
            fmt = m.get("format")
            if fmt == "url" and sv:
                if not re.match(r"^https?://", sv):
                    raise HTTPException(status_code=400, detail=f"invalid_url:{k}")
            updates[k] = sv
    if not updates:
        raise HTTPException(status_code=400, detail="no_updatable_keys")

    with SessionLocal() as s:
        try:
            for k, v in updates.items():
                # store all values as strings; null becomes empty string
                if v is None:
                    v_str = ""
                else:
                    v_str = str(v)
                s.execute(text("INSERT OR REPLACE INTO settings(key, value) VALUES(:k, :v)"), {"k": k, "v": v_str})
            s.commit()
        except Exception as e:
            s.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    # Clear runtime config cache so changes take effect immediately
    try:
        clear_cache()
    except Exception:
        pass

    return {
        "request_id": ctx.get("request_id"),
        "ok": True,
        "updated": sorted(list(updates.keys())),
        "db_layer": _get_db_layer(),
    }


def _http_get(url: str, headers: dict[str, str] | None = None, timeout: int = 5) -> tuple[int, str]:
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:  # nosec - target is configured by admin
        code = resp.getcode()
        raw = resp.read().decode("utf-8", errors="ignore")
        return int(code or 0), raw[:500]


@router.post("/test/stripe")
def test_stripe(ctx: dict = Depends(dev_auth)):
    try:
        import stripe  # type: ignore
    except Exception as e:
        return {"ok": False, "type": "stripe", "error": f"stripe lib missing: {e}", "request_id": ctx.get("request_id")}
    secret = rc_get("STRIPE_SECRET_KEY", str, None)
    if not secret:
        return {"ok": False, "type": "stripe", "error": "not_configured", "request_id": ctx.get("request_id")}
    try:
        stripe.api_key = secret
        acct = stripe.Account.retrieve()
        name = None
        try:
            name = (acct.get("settings", {}) or {}).get("dashboard", {}).get("display_name")  # type: ignore[attr-defined]
        except Exception:
            pass
        return {"ok": True, "type": "stripe", "account": {"id": acct.get("id"), "name": name}, "request_id": ctx.get("request_id")}
    except Exception as e:
        return {"ok": False, "type": "stripe", "error": str(e), "request_id": ctx.get("request_id")}


@router.post("/test/lago")
def test_lago(ctx: dict = Depends(dev_auth)):
    base = rc_get("LAGO_API_URL", str, None)
    key = rc_get("LAGO_API_KEY", str, None)
    if not base:
        return {"ok": False, "type": "lago", "error": "not_configured", "request_id": ctx.get("request_id")}
    base = base.rstrip("/")
    targets = ["/health", "/", "/events/usage"]
    for path in targets:
        try:
            headers = {"Authorization": f"Bearer {key}"} if key else {}
            code, body = _http_get(base + path, headers=headers)
            if code in (200, 401, 403, 404):
                return {"ok": True, "type": "lago", "status": code, "endpoint": path, "snippet": body, "request_id": ctx.get("request_id")}
        except urllib.error.HTTPError as he:  # pragma: no cover
            return {"ok": True, "type": "lago", "status": int(he.code), "endpoint": path, "snippet": (he.read().decode("utf-8", errors="ignore")[:300] if hasattr(he, 'read') else ''), "request_id": ctx.get("request_id")}
        except Exception:
            continue
    return {"ok": False, "type": "lago", "error": "unreachable", "request_id": ctx.get("request_id")}


@router.post("/test/litellm")
def test_litellm(ctx: dict = Depends(dev_auth)):
    base = rc_get("LITELLM_BASE_URL", str, None)
    if not base:
        return {"ok": False, "type": "litellm", "error": "not_configured", "request_id": ctx.get("request_id")}
    base = base.rstrip("/")
    targets = ["/health", "/v1/health", "/healthz", "/models", "/v1/models"]
    key = rc_get("LITELLM_MASTER_KEY", str, None)
    for path in targets:
        try:
            headers = {}
            if "models" in path and key:
                headers["Authorization"] = f"Bearer {key}"
            code, body = _http_get(base + path, headers=headers)
            if code in (200, 401, 403):
                return {"ok": True, "type": "litellm", "status": code, "endpoint": path, "snippet": body, "request_id": ctx.get("request_id")}
        except urllib.error.HTTPError as he:  # pragma: no cover
            return {"ok": True, "type": "litellm", "status": int(he.code), "endpoint": path, "snippet": (he.read().decode("utf-8", errors="ignore")[:300] if hasattr(he, 'read') else ''), "request_id": ctx.get("request_id")}
        except Exception:
            continue
    return {"ok": False, "type": "litellm", "error": "unreachable", "request_id": ctx.get("request_id")}
