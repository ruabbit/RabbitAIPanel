# Implementation Plan

## Goal
Middleware in front of LiteLLM with a pluggable Payments system and Lago integration. No changes to LiteLLM. First providers: Stripe and Alipay.

## Architecture
- Middleware gateway: auth, key mapping, budgets, risk, payments, wallet
- LiteLLM: upstream model gateway; enforce `user`, manage keys/users/teams
- Lago: wallet/credits/invoices; webhook -> wallet credit -> budget linkage
- Payment plugins: create, webhook verify, refund, query

## Provider Plugin Contract
```
class PaymentProvider(Protocol):
    name: ClassVar[str]
    def create_payment(self, order: Order) -> InitResult: ...
    def handle_webhook(self, headers: dict, body: bytes) -> PaymentEvent: ...
    def refund(self, provider_txn_id: str, amount: int | None, reason: str | None) -> RefundResult: ...
    def query(self, provider_txn_id: str) -> PaymentStatus: ...
```

## Data Model (minimum)
- organizations / teams / users (map to LiteLLM + Lago customer)
- api_keys (our key ↔ LiteLLM key hash/mapping, scopes, budgets)
- wallets (by currency) + ledger_entries
- orders / payments / refunds
- provider_events (webhook raw + idempotency)

## Milestones
1) M1: plugin framework + models + provider skeletons
2) M2 (Stripe-first):
   - Use Stripe as the only payment provider initially.
   - Unify user-side UI via Stripe Payment Element/Checkout and enable Stripe Alipay payment method to support Alipay through Stripe (no direct Alipay SDK for now).
   - Implement PaymentIntent creation (metadata.order_id, automatic_payment_methods enabled).
   - Implement webhook verification (Stripe Webhook secret) handling `payment_intent.succeeded` / `payment_intent.payment_failed` and optional refunds.
   - On success: credit wallet (by currency) and create Lago credit/invoice, then link LiteLLM budgets.
   - Implement Request ID propagation: accept `X-Request-ID`, echo in responses, include in logs for correlation.
3) M3: key CRUD + budgets + model allowlist; proxy pass to LiteLLM
4) M4: risk/limits + notifications + retries

## Stripe-only approach for Alipay
- Enable Alipay as a Stripe payment method in the Stripe Dashboard (Payment Element/Checkout supported locales/currencies only).
- Present UI via Stripe Payment Element or Checkout so users see a single coherent checkout with both Card and Alipay (where supported by currency/region).
- Notes:
  - Alipay is a redirect method; off-session reuse is not supported like cards.
  - Currency and regional availability constraints apply (Stripe docs).
  - Refunds are initiated via Stripe, uniformly tracked in our `refunds` table.
