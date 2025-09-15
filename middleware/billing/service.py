from __future__ import annotations

import datetime as dt
import json
import logging
from typing import Optional, Tuple, Iterator

from sqlalchemy.orm import Session
from sqlalchemy import func

from ..db import SessionLocal
from ..models import Customer, Subscription, Invoice, InvoiceItem, Usage, EventOutbox, ProviderEvent, StripePriceMapping
from ..plans.service import utc8_day_start
from ..config import settings

logger = logging.getLogger(__name__)


def _session() -> Session:
    return SessionLocal()

from contextlib import contextmanager

@contextmanager
def session_scope() -> Iterator[Session]:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def create_customer(*, entity_type: str, entity_id: int, stripe_customer_id: Optional[str] = None) -> Customer:
    with session_scope() as s:
        c = Customer(entity_type=entity_type, entity_id=entity_id, stripe_customer_id=stripe_customer_id)
        s.add(c)
        s.flush()
        return c


def list_customers(*, entity_type: Optional[str] = None, entity_id: Optional[int] = None, limit: int = 50, offset: int = 0) -> tuple[list[Customer], int]:
    with _session() as s:
        q = s.query(Customer)
        if entity_type in ("user", "team"):
            q = q.filter(Customer.entity_type == entity_type)
        if entity_id is not None:
            q = q.filter(Customer.entity_id == entity_id)
        total = q.count()
        rows = q.order_by(Customer.id.desc()).offset(offset).limit(limit).all()
        return list(rows), int(total)


def create_subscription(*, customer_id: int, plan_id: int, stripe_subscription_id: Optional[str] = None) -> Subscription:
    with session_scope() as s:
        sub = Subscription(customer_id=customer_id, plan_id=plan_id, stripe_subscription_id=stripe_subscription_id)
        s.add(sub)
        s.flush()
        return sub


def generate_invoice(*, customer_id: int, date_from: str, date_to: str) -> Invoice:
    # parse period in UTC+8 day windows
    y1, m1, d1 = map(int, date_from.split("-"))
    y2, m2, d2 = map(int, date_to.split("-"))
    base_from = dt.datetime(y1, m1, d1)
    base_to = dt.datetime(y2, m2, d2)
    start = utc8_day_start(base_from, hhmm="00:00")
    end = utc8_day_start(base_to, hhmm="00:00") + dt.timedelta(days=1)

    with session_scope() as s:
        inv = Invoice(customer_id=customer_id, period_start=start, period_end=end, currency="USD", status="draft")
        s.add(inv)
        s.flush()
        # usage aggregation for this customer's entity
        cust = s.get(Customer, customer_id)
        if not cust:
            raise ValueError("customer not found")
        # for demo: entity_type=user only
        if cust.entity_type != "user":
            logger.info("generate_invoice: entity_type %s not fully supported, proceeding best-effort", cust.entity_type)
        user_id = cust.entity_id
        amount_cents, total_tokens = s.query(
            func.coalesce(func.sum(Usage.computed_amount_cents), 0),
            func.coalesce(func.sum(Usage.total_tokens), 0),
        ).filter(Usage.user_id == user_id, Usage.created_at >= start, Usage.created_at < end).one()
        total_cents = int(amount_cents)
        item = InvoiceItem(invoice_id=inv.id, description=f"Usage {date_from}..{date_to}", amount_cents=total_cents)
        s.add(item)
        inv.total_amount_cents = total_cents
        s.flush()
        return inv


def _stripe_available() -> bool:
    return bool(settings.STRIPE_SECRET_KEY)


def ensure_stripe_customer(customer_id: int) -> str:
    if not _stripe_available():
        raise RuntimeError("stripe not configured")
    try:
        import stripe  # type: ignore
    except Exception as e:
        raise RuntimeError("stripe library not installed") from e
    stripe.api_key = settings.STRIPE_SECRET_KEY
    with session_scope() as s:
        cust = s.get(Customer, customer_id)
        if not cust:
            raise ValueError("customer not found")
        if cust.stripe_customer_id:
            return cust.stripe_customer_id
        sc = stripe.Customer.create(description=f"Customer {cust.entity_type}:{cust.entity_id}")
        cust.stripe_customer_id = sc.id
        return sc.id


def ensure_stripe_subscription(customer_id: int, plan_id: int, *, stripe_price_id: str) -> str:
    if not _stripe_available():
        raise RuntimeError("stripe not configured")
    try:
        import stripe  # type: ignore
    except Exception as e:
        raise RuntimeError("stripe library not installed") from e
    stripe.api_key = settings.STRIPE_SECRET_KEY
    sc_id = ensure_stripe_customer(customer_id)
    with session_scope() as s:
        sub = s.query(Subscription).filter_by(customer_id=customer_id, plan_id=plan_id, status="active").first()
        if sub and sub.stripe_subscription_id:
            return sub.stripe_subscription_id
        # create subscription
        ss = stripe.Subscription.create(
            customer=sc_id,
            items=[{"price": stripe_price_id}],
            payment_behavior="default_incomplete",
            expand=["latest_invoice.payment_intent"],
            idempotency_key=f"sub_{customer_id}_{plan_id}",
        )
        if sub is None:
            sub = Subscription(customer_id=customer_id, plan_id=plan_id, stripe_subscription_id=ss.id)
            s.add(sub)
        else:
            sub.stripe_subscription_id = ss.id
        return ss.id


def push_invoice_to_stripe(invoice_id: int) -> str:
    if not _stripe_available():
        raise RuntimeError("stripe not configured")
    try:
        import stripe  # type: ignore
    except Exception as e:
        raise RuntimeError("stripe library not installed") from e
    stripe.api_key = settings.STRIPE_SECRET_KEY
    with session_scope() as s:
        inv = s.get(Invoice, invoice_id)
        if not inv:
            raise ValueError("invoice not found")
        cust = s.get(Customer, inv.customer_id)
        if not cust or not cust.stripe_customer_id:
            raise ValueError("customer or stripe_customer_id missing")
        if inv.stripe_invoice_id:
            return inv.stripe_invoice_id
        # Create invoice item with exact amount
        stripe.InvoiceItem.create(
            customer=cust.stripe_customer_id,
            amount=inv.total_amount_cents,
            currency=inv.currency.lower(),
            description=f"Invoice {invoice_id} {inv.period_start.date()}..{inv.period_end.date()}",
            idempotency_key=f"ii_{invoice_id}",
        )
        si = stripe.Invoice.create(customer=cust.stripe_customer_id, idempotency_key=f"inv_{invoice_id}")
        si = stripe.Invoice.finalize_invoice(si.id)
        # optionally attempt pay (if auto-collection configured)
        try:
            stripe.Invoice.pay(si.id)
        except Exception:
            pass
        inv.stripe_invoice_id = si.id
        return si.id


def process_stripe_invoice_webhook(headers: dict, body: bytes, request_id: str | None = None) -> dict:
    """Process Stripe Billing invoice.* webhooks and update local Invoice status.

    - Verifies signature when STRIPE_WEBHOOK_SECRET is configured
    - Idempotency via ProviderEvent(provider='stripe', event_id)
    - Maps Stripe invoice events/status to local Invoice.status: draft|finalized|paid|failed
    Returns a compact dict describing the handled event.
    """
    try:
        import stripe  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError("stripe library not installed") from e

    # Verify and parse event
    if settings.STRIPE_WEBHOOK_SECRET:
        sig = headers.get("stripe-signature") or headers.get("Stripe-Signature")
        if not sig:
            raise RuntimeError("Missing Stripe-Signature header")
        event = stripe.Webhook.construct_event(
            payload=body.decode("utf-8"), sig_header=sig, secret=settings.STRIPE_WEBHOOK_SECRET
        )
        data = event
        obj = event["data"]["object"]
        event_type = event["type"]
        event_id = event.get("id")
    else:
        data = json.loads(body.decode("utf-8"))
        obj = data.get("data", {}).get("object", {})
        event_type = data.get("type")
        event_id = data.get("id")

    if not isinstance(event_type, str) or not event_type.startswith("invoice."):
        raise ValueError("not_an_invoice_event")

    stripe_invoice_id = obj.get("id") or ""
    stripe_status = (obj.get("status") or "").lower()

    # Primary mapping based on event type
    event_map = {
        "invoice.finalized": "finalized",
        "invoice.payment_succeeded": "paid",
        "invoice.payment_failed": "failed",
        "invoice.voided": "failed",
        "invoice.marked_uncollectible": "failed",
    }
    local_status = event_map.get(event_type)

    # Fallback to Stripe status field if needed
    if local_status is None:
        status_map = {
            "draft": "draft",
            "open": "finalized",  # finalized and awaiting payment
            "paid": "paid",
            "void": "failed",
            "uncollectible": "failed",
        }
        local_status = status_map.get(stripe_status, "finalized")

    with SessionLocal() as s:
        # Idempotency guard
        if event_id:
            pe = ProviderEvent(provider="stripe", event_id=event_id, raw=data if isinstance(data, dict) else None)
            s.add(pe)
            try:
                s.flush()
            except Exception:
                logger.info("billing.webhook.duplicate provider=stripe event_id=%s", event_id)
                return {
                    "provider": "stripe",
                    "event_type": event_type,
                    "stripe_invoice_id": stripe_invoice_id,
                    "status": local_status,
                    "duplicate": True,
                }

        inv = None
        if stripe_invoice_id:
            inv = s.query(Invoice).filter_by(stripe_invoice_id=stripe_invoice_id).first()

        if inv is None:
            logger.warning(
                "billing.webhook.no_invoice provider=stripe stripe_invoice_id=%s event_type=%s",
                stripe_invoice_id,
                event_type,
            )
            # No local invoice yet; still record ProviderEvent for idempotency
            s.commit()
            return {
                "provider": "stripe",
                "event_type": event_type,
                "stripe_invoice_id": stripe_invoice_id,
                "status": local_status,
                "handled": False,
            }

        prev_status = inv.status
        inv.status = local_status
        s.commit()

        logger.info(
            "billing.webhook.handled provider=stripe event_type=%s stripe_invoice_id=%s status=%s prev_status=%s",
            event_type,
            stripe_invoice_id,
            local_status,
            prev_status,
        )

        return {
            "provider": "stripe",
            "event_type": event_type,
            "stripe_invoice_id": stripe_invoice_id,
            "status": local_status,
            "handled": True,
        }


# --- Stripe Price Mapping services ---

def create_price_mapping(*, plan_id: int, stripe_price_id: str, currency: str = "USD", active: bool = True) -> StripePriceMapping:
    with session_scope() as s:
        m = StripePriceMapping(plan_id=plan_id, stripe_price_id=stripe_price_id, currency=currency.upper(), active=active)
        s.add(m)
        s.flush()
        return m


def update_price_mapping(mapping_id: int, *, stripe_price_id: str | None = None, currency: str | None = None, active: bool | None = None) -> StripePriceMapping:
    with session_scope() as s:
        m = s.get(StripePriceMapping, mapping_id)
        if not m:
            raise ValueError("price_mapping not found")
        if stripe_price_id is not None:
            m.stripe_price_id = stripe_price_id
        if currency is not None:
            m.currency = currency.upper()
        if active is not None:
            m.active = active
        s.flush()
        return m


def delete_price_mapping(mapping_id: int) -> None:
    with session_scope() as s:
        m = s.get(StripePriceMapping, mapping_id)
        if not m:
            return
        s.delete(m)
        s.flush()


def list_price_mappings(*, plan_id: int | None = None) -> list[StripePriceMapping]:
    with _session() as s:
        q = s.query(StripePriceMapping)
        if plan_id is not None:
            q = q.filter_by(plan_id=plan_id)
        return list(q.order_by(StripePriceMapping.id.desc()).all())


def get_active_price_for_plan(plan_id: int, *, currency: str | None = None) -> str | None:
    with _session() as s:
        q = s.query(StripePriceMapping).filter_by(plan_id=plan_id, active=True)
        if currency:
            q = q.filter(StripePriceMapping.currency == currency.upper())
        m = q.order_by(StripePriceMapping.id.desc()).first()
        return m.stripe_price_id if m else None


def get_invoice(invoice_id: int) -> tuple[Invoice, list[InvoiceItem]]:
    with SessionLocal() as s:
        inv = s.get(Invoice, invoice_id)
        if not inv:
            raise ValueError("invoice not found")
        items = (
            s.query(InvoiceItem)
            .filter(InvoiceItem.invoice_id == invoice_id)
            .order_by(InvoiceItem.id.asc())
            .all()
        )
        return inv, list(items)


def list_invoices(*, customer_id: Optional[int] = None, status: Optional[str] = None, limit: int = 50, offset: int = 0) -> tuple[list[Invoice], int]:
    with SessionLocal() as s:
        q = s.query(Invoice)
        if customer_id is not None:
            q = q.filter(Invoice.customer_id == customer_id)
        if status in ("draft", "finalized", "paid", "failed"):
            q = q.filter(Invoice.status == status)
        total = q.count()
        rows = q.order_by(Invoice.id.desc()).offset(offset).limit(limit).all()
        return list(rows), int(total)


def get_subscription(subscription_id: int) -> Subscription:
    with SessionLocal() as s:
        sub = s.get(Subscription, subscription_id)
        if not sub:
            raise ValueError("subscription not found")
        return sub


def get_subscription_by_stripe_id(stripe_subscription_id: str) -> Subscription:
    with SessionLocal() as s:
        sub = s.query(Subscription).filter_by(stripe_subscription_id=stripe_subscription_id).first()
        if not sub:
            raise ValueError("subscription not found")
        return sub


def list_subscriptions(
    *, customer_id: Optional[int] = None, plan_id: Optional[int] = None, status: Optional[str] = None, limit: int = 50, offset: int = 0
) -> tuple[list[Subscription], int]:
    with SessionLocal() as s:
        q = s.query(Subscription)
        if customer_id is not None:
            q = q.filter(Subscription.customer_id == customer_id)
        if plan_id is not None:
            q = q.filter(Subscription.plan_id == plan_id)
        if status in ("active", "canceled", "paused"):
            q = q.filter(Subscription.status == status)
        total = q.count()
        rows = q.order_by(Subscription.id.desc()).offset(offset).limit(limit).all()
        return list(rows), int(total)


def update_subscription_status(subscription_id: int, *, status: str) -> Subscription:
    if status not in ("active", "canceled", "paused"):
        raise ValueError("invalid_status")
    with session_scope() as s:
        sub = s.get(Subscription, subscription_id)
        if not sub:
            raise ValueError("subscription not found")
        sub.status = status
        s.flush()
        return sub


def process_stripe_subscription_webhook(headers: dict, body: bytes, request_id: str | None = None) -> dict:
    """处理 Stripe `customer.subscription.*` 事件并同步本地 Subscription.status。

    - 验签（若配置了 `STRIPE_WEBHOOK_SECRET`）
    - 通过 ProviderEvent 进行幂等保护
    - 将 Stripe subscription 的状态映射到本地：active|canceled|paused
    """
    try:
        import stripe  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError("stripe library not installed") from e

    # 解析/验签
    if settings.STRIPE_WEBHOOK_SECRET:
        sig = headers.get("stripe-signature") or headers.get("Stripe-Signature")
        if not sig:
            raise RuntimeError("Missing Stripe-Signature header")
        event = stripe.Webhook.construct_event(
            payload=body.decode("utf-8"), sig_header=sig, secret=settings.STRIPE_WEBHOOK_SECRET
        )
        data = event
        obj = event["data"]["object"]
        event_type = event["type"]
        event_id = event.get("id")
    else:
        data = json.loads(body.decode("utf-8"))
        obj = data.get("data", {}).get("object", {})
        event_type = data.get("type")
        event_id = data.get("id")

    if not isinstance(event_type, str) or not event_type.startswith("customer.subscription"):
        raise ValueError("not_a_subscription_event")

    stripe_sub_id = obj.get("id") or ""
    stripe_status = str(obj.get("status") or "").lower()
    pause_info = obj.get("pause_collection") or {}
    is_paused = bool(pause_info)

    # 事件优先级映射
    event_map = {
        "customer.subscription.deleted": "canceled",
    }
    local_status = event_map.get(event_type)

    # 基于 Stripe 状态的兜底映射
    if local_status is None:
        status_map = {
            "active": "active",
            "trialing": "active",
            "past_due": "paused",
            "unpaid": "paused",
            "incomplete": "paused",
            "incomplete_expired": "canceled",
            "canceled": "canceled",
        }
        local_status = status_map.get(stripe_status, "active")
        if is_paused:
            local_status = "paused"

    with SessionLocal() as s:
        # 幂等
        if event_id:
            pe = ProviderEvent(provider="stripe", event_id=event_id, raw=data if isinstance(data, dict) else None)
            s.add(pe)
            try:
                s.flush()
            except Exception:
                logger.info("billing.webhook.duplicate provider=stripe event_id=%s", event_id)
                return {
                    "provider": "stripe",
                    "event_type": event_type,
                    "stripe_subscription_id": stripe_sub_id,
                    "status": local_status,
                    "duplicate": True,
                }

        sub = None
        if stripe_sub_id:
            sub = s.query(Subscription).filter_by(stripe_subscription_id=stripe_sub_id).first()

        if sub is None:
            logger.warning(
                "billing.webhook.no_subscription provider=stripe stripe_subscription_id=%s event_type=%s",
                stripe_sub_id,
                event_type,
            )
            s.commit()
            return {
                "provider": "stripe",
                "event_type": event_type,
                "stripe_subscription_id": stripe_sub_id,
                "status": local_status,
                "handled": False,
            }

        prev_status = sub.status
        sub.status = local_status
        s.commit()

        logger.info(
            "billing.webhook.handled provider=stripe event_type=%s stripe_subscription_id=%s status=%s prev_status=%s",
            event_type,
            stripe_sub_id,
            local_status,
            prev_status,
        )

        return {
            "provider": "stripe",
            "event_type": event_type,
            "stripe_subscription_id": stripe_sub_id,
            "status": local_status,
            "handled": True,
        }


def enqueue_http_post(*, endpoint: str, payload: dict) -> EventOutbox:
    with _session() as s:
        e = EventOutbox(event_type="http_post", endpoint=endpoint, payload=payload, status="pending", attempts=0, next_attempt_at=dt.datetime.utcnow())
        s.add(e)
        s.flush()
        return e


def process_outbox_once(max_batch: int = 10) -> int:
    import urllib.request

    now = dt.datetime.utcnow()
    sent = 0
    with _session() as s:
        q = (
            s.query(EventOutbox)
            .filter(EventOutbox.status == "pending", (EventOutbox.next_attempt_at == None) | (EventOutbox.next_attempt_at <= now))  # noqa: E711
            .order_by(EventOutbox.id.asc())
            .limit(max_batch)
        )
        rows = q.all()
        for row in rows:
            try:
                if row.event_type == "http_post" and row.endpoint and row.payload is not None:
                    data = json.dumps(row.payload).encode("utf-8")
                    req = urllib.request.Request(row.endpoint, data=data, headers={"Content-Type": "application/json"})
                    with urllib.request.urlopen(req, timeout=5) as resp:  # nosec
                        _ = resp.read()
                    row.status = "sent"
                    row.last_error = None
                    sent += 1
                else:
                    row.status = "failed"
                    row.last_error = "unsupported event_type/payload"
            except Exception as e:
                row.attempts += 1
                # mark as dead after configured attempts
                if row.attempts >= settings.OUTBOX_MAX_ATTEMPTS:
                    row.status = "failed"
                    row.next_attempt_at = None
                    row.last_error = f"dead after {row.attempts} attempts: {e}"
                else:
                    backoff = min(3600, 2 ** min(10, row.attempts))
                    row.next_attempt_at = dt.datetime.utcnow() + dt.timedelta(seconds=backoff)
                    row.last_error = str(e)
        s.commit()
    return sent
