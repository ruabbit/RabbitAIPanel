from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models import Order, Payment, ProviderEvent, User, Refund
from ..wallets import credit_wallet, debit_wallet
from ..integrations.lago_stub import record_credit
from ..integrations.litellm_stub import update_budget_for_user
from .registry import provider_registry
from .types import InitResult, PaymentEvent, RefundResult, PaymentStatus
from .load_providers import load_default_providers


@contextmanager
def session_scope() -> Iterator[Session]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ensure default providers are available
load_default_providers()


def create_checkout(
    *,
    user_id: int,
    provider_name: str,
    order_id: str,
    amount_cents: int,
    currency: str,
) -> InitResult:
    provider = provider_registry.get(provider_name)
    with session_scope() as s:
        order = Order(
            user_id=user_id,
            order_id=order_id,
            amount_cents=amount_cents,
            currency=currency.upper(),
            provider=provider.name,
            status="created",
        )
        s.add(order)
        s.flush()  # get order.id

        init = provider.create_payment(order)

        payment = Payment(
            order_id=order.id,
            provider=provider.name,
            provider_txn_id=init.provider_txn_id,
            amount_cents=amount_cents,
            currency=currency.upper(),
            status="processing",
            raw=init.extra,
        )
        s.add(payment)
        return init


def process_webhook(*, provider_name: str, headers: dict, body: bytes) -> PaymentEvent:
    provider = provider_registry.get(provider_name)
    event = provider.handle_webhook(headers, body)

    with session_scope() as s:
        # idempotency guard
        pe = ProviderEvent(provider=provider.name, event_id=(event.event_id or event.provider_txn_id), raw=event.raw)
        s.add(pe)
        try:
            s.flush()
        except Exception:
            # duplicate event id; safe to return existing event semantics
            return event

        # Find the Order by external order_id
        order = s.query(Order).filter_by(order_id=event.order_id).first()
        if order is None:
            return event

        payment = (
            s.query(Payment)
            .filter_by(order_id=order.id, provider=provider.name)
            .order_by(Payment.id.desc())
            .first()
        )
        if payment is None:
            payment = Payment(
                order_id=order.id,
                provider=provider.name,
                provider_txn_id=event.provider_txn_id,
                amount_cents=event.amount_cents,
                currency=event.currency,
                status="processing",
                raw=event.raw,
            )
            s.add(payment)

        # Update statuses
        if event.event_type == "payment_succeeded":
            payment.status = "succeeded"
            order.status = "succeeded"
            # Credit user's wallet (by currency). Amount is the top-up value.
            credit_wallet(user_id=order.user_id, currency=event.currency, amount_cents=event.amount_cents, reason="recharge", meta={"provider": provider.name, "order_id": order.order_id})
            # Record credit in Lago (stub)
            record_credit(user_id=order.user_id, currency=event.currency, amount_cents=event.amount_cents, order_id=order.order_id)
            # Update LiteLLM budgets for the user (stub – decide policy later)
            u = s.query(User).filter_by(id=order.user_id).first()
            litellm_user_id = u.litellm_user_id if u else None
            update_budget_for_user(litellm_user_id=litellm_user_id, max_budget_cents=None, budget_duration=None)
        elif event.event_type == "payment_failed":
            payment.status = "failed"
            order.status = "failed"
        elif event.event_type == "refunded":
            payment.status = "refunded"
            order.status = "refunded"

        return event


def _find_payment_record(session: Session, *, provider_name: str, provider_txn_id: str | None, order_id: str | None) -> tuple[Order, Payment] | None:
    if provider_txn_id:
        payment = session.query(Payment).filter_by(provider=provider_name, provider_txn_id=provider_txn_id).first()
        if payment:
            order = session.query(Order).filter_by(id=payment.order_id).first()
            if order:
                return order, payment
    if order_id:
        order = session.query(Order).filter_by(order_id=order_id, provider=provider_name).first()
        if order:
            payment = session.query(Payment).filter_by(order_id=order.id, provider=provider_name).order_by(Payment.id.desc()).first()
            if payment:
                return order, payment
    return None


def refund_payment(*, provider_name: str, provider_txn_id: str | None = None, order_id: str | None = None, amount_cents: int | None = None, reason: str | None = None) -> RefundResult:
    provider = provider_registry.get(provider_name)
    with session_scope() as s:
        found = _find_payment_record(s, provider_name=provider.name, provider_txn_id=provider_txn_id, order_id=order_id)
        if not found:
            raise ValueError("payment not found for refund")
        order, payment = found

        if payment.status == "refunded":
            return RefundResult(ok=True, provider_refund_id=None)

        res = provider.refund(provider_txn_id=payment.provider_txn_id or "", amount_cents=amount_cents, reason=reason)
        if not res.ok:
            return res

        # record refund in DB
        refunded_amount = amount_cents or payment.amount_cents
        r = Refund(payment_id=payment.id, provider_refund_id=res.provider_refund_id, amount_cents=refunded_amount, status="succeeded")
        s.add(r)
        payment.status = "refunded"
        order.status = "refunded"
        # debit wallet to keep ledger consistent
        debit_wallet(user_id=order.user_id, currency=payment.currency, amount_cents=refunded_amount, reason="refund", meta={"provider": provider.name, "order_id": order.order_id, "provider_refund_id": res.provider_refund_id})
        return res


def get_payment_status(*, provider_name: str, provider_txn_id: str | None = None, order_id: str | None = None) -> dict:
    provider = provider_registry.get(provider_name)
    with session_scope() as s:
        found = _find_payment_record(s, provider_name=provider.name, provider_txn_id=provider_txn_id, order_id=order_id)
        local = None
        if found:
            order, payment = found
            local = {"order_status": order.status, "payment_status": payment.status, "order_id": order.order_id, "provider_txn_id": payment.provider_txn_id}
            provider_txn_id = payment.provider_txn_id
        if not provider_txn_id:
            raise ValueError("provider_txn_id required when record not found")
        ps: PaymentStatus = provider.query(provider_txn_id)
        remote = {
            "status": ps.status,
            "amount_cents": ps.amount_cents,
            "currency": ps.currency,
            "provider_txn_id": ps.provider_txn_id,
        }
        return {"local": local, "provider": remote}
