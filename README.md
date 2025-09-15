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

## Configuration Model
- Source of truth:
  - Env-only: `DATABASE_URL` (default `sqlite:///./dev.db`), `DEV_API_KEY` (dev auth).
  - DB-first: other configs read from DB table `settings`, fallback to env when missing; set `STRICT_DB_MODE=1` (env) to disable fallback in production.
- Runtime reload:
  - Editing via `PATCH /v1/settings` takes effect immediately (in-process cache is cleared automatically).
- Admin API:
  - `GET /v1/settings`: current values (sensitive keys masked/configured only, no plaintext).
  - `PATCH /v1/settings`: batch update (cannot modify `db_layer` or `DEV_API_KEY`).
  - `GET /v1/settings/keys`: keys metadata (group, type, sensitive) for grouped admin UI.
- Frontend:
  - Admin Settings page groups keys by Payments/Lago/LiteLLM/Auth/RateLimit/Overdraft/Other; sensitive fields are marked and not echoed after save.
  - Typical keys (non-exhaustive):
    - Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `ALIPAY_*`
    - Lago: `LAGO_API_URL`, `LAGO_API_KEY`, `LAGO_EVENTS_ENABLED`, `LAGO_*_ENDPOINT`
    - LiteLLM: `LITELLM_BASE_URL`, `LITELLM_MASTER_KEY`, `LITELLM_BUDGET_DURATION`, `LITELLM_SYNC_*`
    - Auth/Logto: `LOGTO_*`, `CONNECTOR_GOOGLE_ID`, `CONNECTOR_GITHUB_ID`
    - Rate limit: `RATE_LIMIT_ENABLED`, `RATE_LIMIT_WINDOW_SEC`, `RATE_LIMIT_MAX_REQUESTS`
    - Overdraft/Degrade: `OVERDRAFT_GATING_*`, `DEGRADE_*`

## Logging
- INFO-level logs around checkout, webhooks, refunds, status queries, and wallet operations.
- Log keys include: `request_id`, `order_id`, `provider`, `amount_cents`, `currency`.

## Docs
- API draft: `docs/api.md`
- Implementation plan: `docs/implementation_plan.md`
- Billing & Lago integration: `docs/billing_and_lago.md`
- Frontend header controls & debug gating: `docs/header_controls.md`
- Deploy guide (includes frontend scripts): `docs/deploy.md`

## Docker
Build and run with Docker Compose (backend + frontend):

```
docker compose build
docker compose up -d
```

- API: http://localhost:8000
- Frontend: http://localhost:5173

Notes
- Default DB is SQLite at `/data/dev.db` mounted via a named volume; override with `DATABASE_URL` if you use an external DB.
- Dev auth: set `DEV_API_KEY` (compose already sets `dev-secret` for local testing). Frontend is built with `VITE_API_BASE=http://localhost:8000`.
- To change frontend API base for deployment, rebuild with: `docker compose build --build-arg VITE_API_BASE=https://your.api`.

## Frontend Dev Tips
- Frontend env lives in `frontend/.env` and uses `VITE_` prefix (e.g. `VITE_API_BASE`).
- Dev-only overrides (API base, dev headers) are gated by `VITE_DEBUG` and are ignored in production.
- Use npm scripts to enable debug without editing `.env`:
  - `npm run dev:debug:host` — enable debug with host bind

## Roadmap
- M1: Plugin framework + models + provider skeletons
- M2 (Stripe-first): Recharge flow using Stripe (Payment Element/Checkout). Alipay supported via Stripe payment methods. Webhooks, wallet crediting, Lago sync, LiteLLM budget linkage.
- M3: Key management UI + model whitelists + budgets
- M4: Risk/limits + alerts + retries
