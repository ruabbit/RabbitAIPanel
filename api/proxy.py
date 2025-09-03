from __future__ import annotations

import json
import urllib.request
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel

from .server import dev_auth
from middleware.config import settings
from middleware.plans.service import estimate_cost_for_tokens, check_daily_limit, record_usage_row
from middleware.integrations.lago_stub import record_usage


router = APIRouter(prefix="/v1/proxy", tags=["proxy"])


class ChatBody(BaseModel):
    model: str
    messages: list[dict]
    # optional usage hints
    input_tokens: Optional[int] = None
    output_tokens: Optional[int] = None


@router.post("/chat/completions")
def proxy_chat(body: ChatBody, ctx: dict = Depends(dev_auth), x_litellm_api_key: Optional[str] = Header(default=None, alias="x-litellm-api-key")):
    # Validate config
    if not settings.LITELLM_BASE_URL:
        raise HTTPException(status_code=503, detail="LiteLLM base URL not configured")
    if not x_litellm_api_key:
        raise HTTPException(status_code=400, detail="x-litellm-api-key header required")
    # Determine user_id (dev mode allows x-dev-user-id)
    try:
        user_id = int(ctx.get("dev_user_id") or 0)
    except Exception:
        user_id = 0
    if user_id <= 0:
        raise HTTPException(status_code=400, detail="user_id required (provide x-dev-user-id in dev mode)")

    # Estimate cost for gating (tokens unknown -> skip or use hints)
    est_cents = 0
    if body.input_tokens is not None or body.output_tokens is not None:
        est_cents, _tz = estimate_cost_for_tokens(
            user_id,
            model=body.model,
            input_tokens=body.input_tokens or 0,
            output_tokens=body.output_tokens or 0,
            total_tokens=None,
        )
        allowed, policy, reason = check_daily_limit(user_id, add_amount_cents=est_cents)
        if not allowed:
            raise HTTPException(status_code=403, detail=f"daily limit exceeded: {reason}")

    # Forward request to LiteLLM
    url = settings.LITELLM_BASE_URL.rstrip("/") + "/chat/completions"
    data = json.dumps({"model": body.model, "messages": body.messages}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {x_litellm_api_key}",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:  # nosec - trusted URL from config
            raw = resp.read()
            status = resp.getcode()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"upstream error: {e}")
    if status // 100 != 2:
        raise HTTPException(status_code=502, detail=f"upstream status {status}")

    # Parse response and usage
    try:
        j = json.loads(raw.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"invalid upstream payload: {e}")

    usage = j.get("usage") or {}
    prompt_t = int(usage.get("prompt_tokens") or 0)
    completion_t = int(usage.get("completion_tokens") or 0)
    total_t = int(usage.get("total_tokens") or (prompt_t + completion_t))

    # Compute final cost if we have rules
    final_cents, _tz = estimate_cost_for_tokens(
        user_id,
        model=body.model,
        input_tokens=prompt_t,
        output_tokens=completion_t,
        total_tokens=total_t,
    )
    if final_cents > 0:
        # Record locally for day-limit aggregation
        record_usage_row(user_id, model=body.model, input_tokens=prompt_t, output_tokens=completion_t, total_tokens=total_t, computed_amount_cents=final_cents, request_id=ctx.get("request_id"))
        # Push to Lago
        try:
            record_usage(
                usage_id=f"u-{ctx.get('request_id')}",
                user_id=user_id,
                team_id=None,
                model=body.model,
                unit="token",
                total_tokens=total_t,
                input_tokens=prompt_t,
                output_tokens=completion_t,
                unit_base_price_cents=None,
                price_multiplier=None,
                computed_amount_cents=final_cents,
                currency="USD",
                timestamp=None,
                request_id=ctx.get("request_id"),
                success=True,
                meta={}
            )
        except Exception:
            pass

    # Return upstream payload with request_id
    j["request_id"] = ctx.get("request_id")
    return j

