from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import User, Wallet
from ..config import settings
from .litellm_stub import update_budget_for_user

logger = logging.getLogger(__name__)


def _sync_user_wallet_to_litellm(session: Session, user: User, currency: str = "USD") -> None:
    if not user.litellm_user_id:
        return
    w: Optional[Wallet] = (
        session.query(Wallet)
        .filter(Wallet.user_id == user.id, Wallet.currency == currency.upper())
        .first()
    )
    if not w:
        return
    # Use wallet balance (in cents) as LiteLLM max_budget (USD units expected by LiteLLM)
    max_budget_cents = int(w.balance_cents or 0)
    update_budget_for_user(
        litellm_user_id=user.litellm_user_id,
        max_budget_cents=max_budget_cents,
        budget_duration=settings.LITELLM_BUDGET_DURATION,
    )
    logger.info(
        "litellm.sync user_id=%s litellm_user_id=%s currency=%s balance_cents=%s",
        user.id,
        user.litellm_user_id,
        currency.upper(),
        max_budget_cents,
    )


def sync_wallets_to_litellm(currency: str = "USD") -> None:
    """Best-effort periodic sync of wallet balances to LiteLLM budgets."""
    if not settings.LITELLM_BASE_URL or not settings.LITELLM_MASTER_KEY:
        logger.info("litellm.sync.skip reason=not_configured")
        return
    with SessionLocal() as s:
        users = s.query(User).all()
        for u in users:
            try:
                _sync_user_wallet_to_litellm(s, u, currency=currency)
            except Exception as e:  # pragma: no cover
                logger.warning(
                    "litellm.sync.error user_id=%s currency=%s err=%s", u.id, currency.upper(), e
                )

