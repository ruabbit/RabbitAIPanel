# API (Draft)

## POST /v1/payments/checkout
- Create a top-up order and initialize a Stripe PaymentIntent.

Request JSON:
```
{
  "user_id": 1,
  "amount_cents": 1000,
  "currency": "USD",
  "provider": "stripe",            // optional, defaults to stripe
  "order_id": "ORD-optional"       // optional
}
```

Response JSON:
```
{
  "order_id": "ORD-...",
  "type": "client_secret",
  "payload": { "client_secret": "...", "order_id": "...", "amount_cents": 1000, "currency": "USD" },
  "provider_txn_id": "pi_..."
}
```

## POST /v1/webhooks/stripe
- Stripe webhook endpoint. Verifies signature (if STRIPE_WEBHOOK_SECRET is set), normalizes events, updates order/payment, credits wallet, and triggers Lago / LiteLLM stubs.

Response JSON:
```
{ "ok": true, "event_type": "payment_succeeded", "order_id": "ORD-..." }
```

## GET /healthz
- Liveness check

---

Notes:
- Frontend should use Stripe Payment Element with the returned client_secret.
- Enable Alipay in Stripe Dashboard to expose Alipay via the same UI (Stripe-only Alipay in M2).
- Wallet is credited only on `payment_intent.succeeded`.
- Refunds and query exist on provider; endpoints to be added later.

## POST /v1/payments/refund
- Request body:
```
{
  "provider": "stripe",            // optional
  "provider_txn_id": "pi_...",     // optional if order_id is provided
  "order_id": "ORD-...",           // optional if provider_txn_id provided
  "amount_cents": 500,              // optional, defaults to full amount
  "reason": "requested_by_customer" // optional
}
```
Response:
```
{ "ok": true, "provider_refund_id": "re_..." }
```

## GET /v1/payments/status
- Query params: `provider`, `provider_txn_id`, `order_id`
- Response:
```
{
  "local": { "order_status": "succeeded", "payment_status": "succeeded", "order_id": "ORD-...", "provider_txn_id": "pi_..." },
  "provider": { "status": "succeeded", "amount_cents": 1000, "currency": "USD", "provider_txn_id": "pi_..." }
}
```

## GET /v1/wallets/{user_id}
- Returns per-currency balances for a user
```
{
  "user_id": 1,
  "wallets": [ { "currency": "USD", "balance_cents": 1000 } ]
}
```

## GET /v1/wallets/{user_id}/ledger?limit=20
- Returns recent ledger entries (credits/debits)
```
{
  "user_id": 1,
  "entries": [ { "amount_cents": 1000, "currency": "USD", "reason": "recharge", "created_at": "...", "meta": {"provider": "stripe"}} ]
}
```
