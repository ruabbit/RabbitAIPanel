from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.sqlite import JSON as SQLITE_JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


class Organization(Base):
    __tablename__ = "organizations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    lago_customer_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    teams: Mapped[list[Team]] = relationship("Team", back_populates="organization")


class Team(Base):
    __tablename__ = "teams"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    litellm_team_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    organization: Mapped[Organization] = relationship("Organization", back_populates="teams")
    users: Mapped[list[User]] = relationship("User", back_populates="team")


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    litellm_user_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

    team: Mapped[Team] = relationship("Team", back_populates="users")


class ApiKey(Base):
    __tablename__ = "api_keys"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    key_last4: Mapped[str] = mapped_column(String(4), nullable=False)
    litellm_key_hash: Mapped[Optional[str]] = mapped_column(String(128), unique=True)
    model_allowlist: Mapped[Optional[str]] = mapped_column(Text)  # csv list
    max_budget_cents: Mapped[Optional[int]] = mapped_column(Integer)
    budget_duration: Mapped[Optional[str]] = mapped_column(String(16))  # e.g. 30d, 24h
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class IdentityLink(Base):
    __tablename__ = "identity_links"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider: Mapped[str] = mapped_column(String(64))  # e.g., logto
    external_user_id: Mapped[str] = mapped_column(String(256))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)

class Wallet(Base):
    __tablename__ = "wallets"
    __table_args__ = (UniqueConstraint("user_id", "currency", name="uq_wallet_user_currency"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)  # e.g., USD, CNY
    balance_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    low_threshold_cents: Mapped[Optional[int]] = mapped_column(BigInteger)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    wallet_id: Mapped[int] = mapped_column(ForeignKey("wallets.id"), nullable=False)
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)
    reason: Mapped[str] = mapped_column(String(64))  # recharge, spend, refund
    meta: Mapped[Optional[dict]] = mapped_column(SQLITE_JSON)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("order_id", name="uq_order_id"),)
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    order_id: Mapped[str] = mapped_column(String(64), nullable=False)
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="created")  # created|succeeded|failed|refunded
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_txn_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True)
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="processing")
    raw: Mapped[Optional[dict]] = mapped_column(SQLITE_JSON)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class Refund(Base):
    __tablename__ = "refunds"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payments.id"), nullable=False)
    provider_refund_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True)
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="processing")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class ProviderEvent(Base):
    __tablename__ = "provider_events"
    __table_args__ = (
        UniqueConstraint("provider", "event_id", name="uq_provider_event"),
    )
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    event_id: Mapped[str] = mapped_column(String(128), nullable=False)
    raw: Mapped[Optional[dict]] = mapped_column(SQLITE_JSON)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


# -----------------------------
# Billing Plans & Pricing
# -----------------------------

class Plan(Base):
    __tablename__ = "plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)  # daily_limit | usage
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    status: Mapped[str] = mapped_column(String(32), default="active")  # active | archived
    meta: Mapped[Optional[dict]] = mapped_column(SQLITE_JSON)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class DailyLimitPlan(Base):
    __tablename__ = "daily_limit_plans"
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), primary_key=True)
    daily_limit_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    overflow_policy: Mapped[str] = mapped_column(String(16), default="block")  # block|grace|degrade
    reset_time: Mapped[str] = mapped_column(String(8), default="00:00")  # HH:MM
    timezone: Mapped[str] = mapped_column(String(32), default="UTC+8")


class UsagePlan(Base):
    __tablename__ = "usage_plans"
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), primary_key=True)
    billing_cycle: Mapped[str] = mapped_column(String(16), default="monthly")  # monthly|weekly
    min_commit_cents: Mapped[Optional[int]] = mapped_column(BigInteger)
    credit_grant_cents: Mapped[Optional[int]] = mapped_column(BigInteger)


class PriceRule(Base):
    __tablename__ = "price_rules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), nullable=False)
    model_pattern: Mapped[str] = mapped_column(String(128), nullable=False)
    unit: Mapped[str] = mapped_column(String(16), default="token")  # token|request|minute|image
    unit_base_price_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    input_multiplier: Mapped[Optional[float]] = mapped_column()
    output_multiplier: Mapped[Optional[float]] = mapped_column()
    price_multiplier: Mapped[Optional[float]] = mapped_column()
    min_charge_cents: Mapped[Optional[int]] = mapped_column(BigInteger)
    effective_from: Mapped[Optional[dt.datetime]] = mapped_column(DateTime)
    effective_to: Mapped[Optional[dt.datetime]] = mapped_column(DateTime)


class PlanAssignment(Base):
    __tablename__ = "plan_assignments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(16), nullable=False)  # user|team
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(16), default="active")  # active|paused|canceled
    effective_from: Mapped[Optional[dt.datetime]] = mapped_column(DateTime)
    effective_to: Mapped[Optional[dt.datetime]] = mapped_column(DateTime)
    timezone: Mapped[str] = mapped_column(String(32), default="UTC+8")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class Usage(Base):
    __tablename__ = "usage"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer)
    team_id: Mapped[Optional[int]] = mapped_column(Integer)
    model: Mapped[str] = mapped_column(String(128))
    unit: Mapped[str] = mapped_column(String(16), default="token")
    input_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    output_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer)
    computed_amount_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(64))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class OverdraftAlert(Base):
    __tablename__ = "overdraft_alerts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    model: Mapped[str] = mapped_column(String(128))
    request_id: Mapped[Optional[str]] = mapped_column(String(64))
    overflow_policy: Mapped[str] = mapped_column(String(16))
    final_amount_cents: Mapped[int] = mapped_column(BigInteger)
    charged_amount_cents: Mapped[int] = mapped_column(BigInteger)
    remaining_before_cents: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


# -----------------------------
# Billing: Customer/Subscription/Invoice
# -----------------------------

class Customer(Base):
    __tablename__ = "customers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(16))  # user|team
    entity_id: Mapped[int] = mapped_column(Integer)
    name: Mapped[Optional[str]] = mapped_column(String(200))
    email: Mapped[Optional[str]] = mapped_column(String(320))
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(128))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"))
    status: Mapped[str] = mapped_column(String(16), default="active")  # active|canceled|paused
    stripe_subscription_id: Mapped[Optional[str]] = mapped_column(String(128))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    period_start: Mapped[dt.datetime] = mapped_column(DateTime)
    period_end: Mapped[dt.datetime] = mapped_column(DateTime)
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    total_amount_cents: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(String(16), default="draft")  # draft|finalized|paid|failed
    stripe_invoice_id: Mapped[Optional[str]] = mapped_column(String(128))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    invoice_id: Mapped[int] = mapped_column(ForeignKey("invoices.id"))
    description: Mapped[str] = mapped_column(String(256))
    amount_cents: Mapped[int] = mapped_column(BigInteger)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


# -----------------------------
# Outbox for retries
# -----------------------------

class EventOutbox(Base):
    __tablename__ = "event_outbox"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_type: Mapped[str] = mapped_column(String(64))
    payload: Mapped[Optional[dict]] = mapped_column(SQLITE_JSON)
    endpoint: Mapped[Optional[str]] = mapped_column(String(256))
    status: Mapped[str] = mapped_column(String(16), default="pending")  # pending|sent|failed
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    next_attempt_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime)
    last_error: Mapped[Optional[str]] = mapped_column(String(512))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)


class StripePriceMapping(Base):
    __tablename__ = "stripe_price_mappings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey("plans.id"))
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    stripe_price_id: Mapped[str] = mapped_column(String(128), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=dt.datetime.utcnow)
