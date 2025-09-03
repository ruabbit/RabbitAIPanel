# RabbitAIPanel Middleware Gateway

Middleware gateway between clients and LiteLLM Proxy that provides:
- Unified API keys and policy enforcement
- Budget/limits and graceful degradation
- Usage tracking with Lago wallet/invoicing integration
- Pluggable Payments system (Stripe, Alipay, extensible)

This milestone (M1) delivers the plugin framework and data layer.

## Structure
- `middleware/`
  - `payments/` provider interfaces, registry, provider skeletons
  - `db.py` SQLAlchemy engine/session
  - `models.py` ORM models (orgs/users/wallets/orders/payments/events)
  - `config.py` runtime configuration
  - `wallets.py` wallet crediting helpers
  - `integrations/` Lago and LiteLLM stubs
- `api/` FastAPI server with checkout + webhook endpoints
  - `static/payment_element.html` demo page for Stripe Payment Element (dev only)

## Dev Quickstart
- Python 3.10+
- Install minimal deps: `pip install sqlalchemy pydantic stripe`
  - For API server: `pip install fastapi uvicorn`
- Initialize DB (SQLite by default): open a Python REPL and run:
  ```py
  from middleware.db import init_db
  init_db()
  ```
- Load default providers and create a sample order via code:
  ```py
  # Env required for Stripe (PaymentIntent creation):
  #   export STRIPE_SECRET_KEY=sk_test_...
  #   export STRIPE_WEBHOOK_SECRET=whsec_...  # for webhook verification
  #   export STRIPE_PUBLISHABLE_KEY=pk_test_... # for Payment Element demo
  #   export DEV_API_KEY=dev-secret             # simple dev auth
  from middleware.payments.service import create_checkout
  init = create_checkout(user_id=1, provider_name="stripe", order_id="ORD-1", amount_cents=1000, currency="USD")
  print(init)
  ```

- Start API: `uvicorn api.server:app --reload`
- Open demo page:
  - Recommended: `http://localhost:8000/demo/payment_element?api=http://localhost:8000&key=$DEV_API_KEY`
    - The demo fetches Stripe publishable key from `/v1/config/stripe` automatically.
    - Fallback (override): you can still pass `pk=$STRIPE_PUBLISHABLE_KEY` in query.

## Dev Auth
- Header: set `x-api-key: $DEV_API_KEY` for all non-webhook endpoints (checkout, refund, status).
- Webhooks: `/v1/webhooks/stripe` does not require auth (Stripe signs requests via webhook secret).
- Example curl:
  - `curl -H "x-api-key: $DEV_API_KEY" -H "Content-Type: application/json" -d '{"user_id":1,"amount_cents":1000,"currency":"USD"}' http://localhost:8000/v1/payments/checkout`

## Request ID
- Incoming request may include `X-Request-ID`; if absent, the server generates one.
- The server echoes `X-Request-ID` on every response and includes it in logs.
- Selected endpoints also include `request_id` in the JSON response (checkout, refund, status, wallets, ledger, config, healthz, webhook, root) for easier correlation.

## Environment (optional integrations)
- Lago: `LAGO_API_URL`, `LAGO_API_KEY`
- LiteLLM: `LITELLM_BASE_URL`, `LITELLM_MASTER_KEY`, `LITELLM_BUDGET_DURATION` (e.g. `30d`)
  - Periodic budget sync (optional):
    - `LITELLM_SYNC_ENABLED=1` to enable wallet→LiteLLM budget periodic sync.
    - `LITELLM_SYNC_INTERVAL_SEC` sync frequency (default 900).
    - `LITELLM_SYNC_CURRENCY` target currency code (default `USD`).

## Logging
- INFO-level logs around checkout, webhooks, refunds, status queries, and wallet operations.
- Log keys include: `request_id`, `order_id`, `provider`, `amount_cents`, `currency`.

## Roadmap
- M1: Plugin framework + models + provider skeletons
- M2 (Stripe-first): Recharge flow using Stripe (Payment Element/Checkout). Alipay supported via Stripe payment methods. Webhooks, wallet crediting, Lago sync, LiteLLM budget linkage.
- M3: Key management UI + model whitelists + budgets
- M4: Risk/limits + alerts + retries
