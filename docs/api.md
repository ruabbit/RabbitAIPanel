# API (Draft)

## Conventions
- Request ID: The API accepts optional `X-Request-ID` header. If missing, a new ID is generated. All responses include `X-Request-ID` and server logs carry this value for correlation. In addition, selected endpoints include `request_id` in the JSON body: checkout, refund, status, wallets, ledger, Stripe config, healthz, webhook, and root.
- Dev Auth: For non-webhook endpoints, include `x-api-key: $DEV_API_KEY`.

## GET /v1/config/stripe
- Returns Stripe publishable key for frontend initialization.

Response JSON:
```
{ "publishable_key": "pk_test_...", "request_id": "..." }
```

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
  "request_id": "...",
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
{ "ok": true, "request_id": "...", "event_type": "payment_succeeded", "order_id": "ORD-..." }
```

## GET /healthz
- Liveness check

---

Notes:
- Frontend should use Stripe Payment Element with the returned client_secret.
- Enable Alipay in Stripe Dashboard to expose Alipay via the same UI (Stripe-only Alipay in M2).
- Wallet is credited only on `payment_intent.succeeded`.
- Refunds and query exist on provider; endpoints to be added later.

## Demo
- Payment Element demo page: `/demo/payment_element?api=http://localhost:8000&key=$DEV_API_KEY`
- It fetches publishable key from `/v1/config/stripe` automatically; `pk` query param can override for testing.

## Plans (Management)
- `POST /v1/plans` create a plan: `{ name, type: daily_limit|usage, currency }`
- `POST /v1/plans/daily_limit` upsert daily-limit details: `{ plan_id, daily_limit_cents, overflow_policy(block|grace|degrade), reset_time(HH:MM), timezone }`
- `POST /v1/plans/usage` upsert usage-plan details: `{ plan_id, billing_cycle(monthly|weekly), min_commit_cents?, credit_grant_cents? }`
- `POST /v1/plans/pricing` add price rule: `{ plan_id, model_pattern, unit(token|request|minute|image), unit_base_price_cents, input_multiplier?, output_multiplier?, price_multiplier?, min_charge_cents? }`
- `POST /v1/plans/assign` assign plan to user/team: `{ entity_type(user|team), entity_id, plan_id, timezone }`
- `GET /v1/plans/{plan_id}` get plan metadata
- `GET /v1/plans/assignment/{entity_type}/{entity_id}` get current assignment

Notes:
- Daily limit reset timezone is UTC+8; overflow default is `block` (grace/degrade supported).
- Pricing uses per-model base prices with optional input/output multipliers; USD only.

## Proxy (LiteLLM)
- `POST /v1/proxy/chat/completions`
  - Headers:
    - `x-api-key: $DEV_API_KEY` (dev auth)
    - `x-litellm-api-key: sk-...` (LiteLLM virtual key to forward with)
  - Body:
  ```
  { "model": "gpt-4o", "messages": [{"role":"user","content":"hi"}], "input_tokens": 100, "output_tokens": 50 }
  ```
  - Behavior:
    - If `input_tokens/output_tokens` provided, estimate cost via PriceRule for daily limit gating；若超限且策略为 `block`，返回 403；`grace/degrade` 通过。
    - 请求转发到 `{LITELLM_BASE_URL}/chat/completions`，返回体追加 `request_id`。
    - 若 upstream 返回 usage（OpenAI 格式），按 PriceRule 计算最终费用，记录本地 Usage，并推送到 Lago `/events/usage`（若启用）。
  - Responses:
    - 200 upstream JSON + `request_id`
    - 403 超出日限额（`block`）

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
{ "ok": true, "request_id": "...", "provider_refund_id": "re_..." }
```

## GET /v1/payments/status
- Query params: `provider`, `provider_txn_id`, `order_id`
- Response:
```
{
  "request_id": "...",
  "local": { "order_status": "succeeded", "payment_status": "succeeded", "order_id": "ORD-...", "provider_txn_id": "pi_..." },
  "provider": { "status": "succeeded", "amount_cents": 1000, "currency": "USD", "provider_txn_id": "pi_..." }
}
```

## GET /v1/wallets/{user_id}
- Returns per-currency balances for a user
```
{
  "request_id": "...",
  "user_id": 1,
  "wallets": [ { "currency": "USD", "balance_cents": 1000 } ]
}
```

## GET /v1/wallets/{user_id}/ledger?limit=20
- Returns recent ledger entries (credits/debits)
```
{
  "request_id": "...",
  "user_id": 1,
  "entries": [ { "amount_cents": 1000, "currency": "USD", "reason": "recharge", "created_at": "...", "meta": {"provider": "stripe"}} ]
}
```
