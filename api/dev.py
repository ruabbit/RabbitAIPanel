from __future__ import annotations

import random
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .deps import dev_auth
from middleware.plans.service import estimate_cost_for_tokens, record_usage_row


router = APIRouter(prefix="/v1/dev", tags=["dev"])


class SeedUsageBody(BaseModel):
    user_id: int
    count: int = Field(default=10, ge=1, le=1000)
    model: Optional[str] = Field(default=None)
    min_tokens: int = Field(default=100, ge=0)
    max_tokens: int = Field(default=2000, ge=0)


@router.post("/seed/usage")
def api_seed_usage(body: SeedUsageBody, ctx: dict = Depends(dev_auth)):
    if body.min_tokens > body.max_tokens:
        raise HTTPException(status_code=400, detail="min_tokens must be <= max_tokens")
    created = 0
    models = [
        body.model,
        "gpt-4o", "gpt-4o-mini", "gpt-4.1",
        "gpt-3.5-turbo", "claude-3-5-sonnet", "qwen2-72b",
    ]
    for _ in range(body.count):
        model = (body.model or random.choice([m for m in models if m]))
        it = random.randint(body.min_tokens, body.max_tokens)
        ot = random.randint(body.min_tokens // 2, body.max_tokens)
        cents, _tz = estimate_cost_for_tokens(body.user_id, model=model, input_tokens=it, output_tokens=ot, total_tokens=None)
        if cents <= 0:
            # fallback minimal random cents if no pricing rule/plan
            cents = random.randint(1, 25)
        record_usage_row(
            body.user_id,
            model=model,
            input_tokens=it,
            output_tokens=ot,
            total_tokens=None,
            computed_amount_cents=cents,
            request_id=None,
        )
        created += 1
    return {"request_id": ctx.get("request_id"), "created": created}

