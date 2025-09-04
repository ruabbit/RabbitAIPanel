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
- Stripe webhook endpoint. Verifies signature (if `STRIPE_WEBHOOK_SECRET` is set).
  - Payments: handles `payment_intent.succeeded|payment_intent.payment_failed|charge.refunded` → updates order/payment, credits wallet, and emits Lago events.
  - Billing: handles `invoice.*` (e.g., `invoice.finalized|invoice.payment_succeeded|invoice.payment_failed|invoice.voided|invoice.marked_uncollectible`) → updates local `Invoice.status` (`draft|finalized|paid|failed`).
  - Subscriptions: handles `customer.subscription.*` (created/updated/deleted). Maps Stripe status to local `Subscription.status`:
    - Stripe `active|trialing` → `active`; `canceled|incomplete_expired` → `canceled`; `past_due|unpaid|incomplete` 或存在 `pause_collection` → `paused`。

## Stability & Security (Demo)
- 请求标识：请求支持 `X-Request-ID` 透传，若缺省则服务生成；所有响应写回该头，日志包含该值。
- 速率限制：内存级限流（单进程/节点），默认开启；通过环境变量配置：
  - `RATE_LIMIT_ENABLED=1`、`RATE_LIMIT_WINDOW_SEC=60`、`RATE_LIMIT_MAX_REQUESTS=120`
  - 超限返回 `429`，包含 `Retry-After`、`X-RateLimit-*` 头。生产应替换为集中式限流（Redis/网关）。
- Webhook 验签：Stripe Webhook 若设置 `STRIPE_WEBHOOK_SECRET` 则强制校验签名。
- Outbox 重试：`event_outbox` 指数退避，失败累计达到 `OUTBOX_MAX_ATTEMPTS`（默认 10）后标记为 dead。
- 访问日志：记录 `rid`、源 IP、方法、路径、状态码、耗时（ms）。
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
    - 若提供 `input_tokens/output_tokens`，先行按 PriceRule 预估费用做当日限额门禁：
      - `block`：超限返回 403；
      - `grace`：允许通过；
      - `degrade`：若预估超限，降级模型（本阶段硬编码 `gpt-4o-mini`）。
    - 请求转发至 `{LITELLM_BASE_URL}/chat/completions`；响应追加 `request_id`，若发生降级追加 `degraded_model`。
    - 若 upstream 返回 usage（OpenAI 格式），按 PriceRule 计算最终费用并记录 Usage；
      - `grace` 策略：仅对“未超限剩余额度”部分计费，溢出部分不计费（本阶段约定）。
      - 推送 Lago `/lago/events/usage`（如启用）。
    - Overdraft gating（已实现）：当日（UTC+8）若发生过 block 策略的无 hints 透支，且 `OVERDRAFT_GATING_ENABLED=1`，后续请求按 `OVERDRAFT_GATING_MODE` 执行（`block` 直接拒绝；`degrade` 强制降级至配置的 fallback 模型）。
  - Responses:
    - 200 upstream JSON + `request_id`
    - 403 超出日限额（`block`）

## Billing
- `POST /v1/billing/customers` → 创建 Customer：`{ entity_type(user|team), entity_id, stripe_customer_id? }`
- `POST /v1/billing/subscriptions` → 创建 Subscription：`{ customer_id, plan_id, stripe_subscription_id? }`
- `POST /v1/billing/invoices/generate?customer_id=1&date_from=2025-09-01&date_to=2025-09-03` → 生成本地发票（聚合 Usage 为行项目），返回 `request_id` 与发票概要。
- `GET /v1/billing/invoices/{invoice_id}` → 查询单个发票及其行项目。
- `GET /v1/billing/invoices?customer_id=1&limit=50&offset=0` → 列出发票（可按 `customer_id` 过滤），包含总数 `total`。
- `GET /v1/billing/subscriptions/{subscription_id}` → 查询单个订阅。
- `GET /v1/billing/subscriptions/by_stripe/{stripe_subscription_id}` → 通过 Stripe ID 查询订阅。
- `GET /v1/billing/subscriptions?customer_id=1&plan_id=2&limit=50&offset=0` → 列出订阅（可按 `customer_id` 与 `plan_id` 过滤），包含总数 `total`。
- `GET /v1/billing/invoices/{invoice_id}` → 查询单个发票及其行项目。
- `GET /v1/billing/invoices?customer_id=1&limit=50&offset=0` → 列出发票（可按 `customer_id` 过滤），包含总数 `total`。
- 价格映射管理：
  - `POST /v1/billing/stripe/price_mappings` Body: `{ plan_id, stripe_price_id, currency?, active? }`
  - `PATCH /v1/billing/stripe/price_mappings/{mapping_id}` Body: `{ stripe_price_id?, currency?, active? }`
  - `DELETE /v1/billing/stripe/price_mappings/{mapping_id}`
  - `GET /v1/billing/stripe/price_mappings?plan_id=2`
- Stripe（可选，若配置了 `STRIPE_SECRET_KEY`）
  - `POST /v1/billing/stripe/customers/ensure?customer_id=1` → 创建/确保 Stripe Customer；返回 `stripe_customer_id`
  - `POST /v1/billing/stripe/subscriptions/ensure` Body: `{ customer_id, plan_id, stripe_price_id }` → 创建/确保订阅；返回 `stripe_subscription_id`
  - `POST /v1/billing/stripe/subscriptions/ensure_by_plan?customer_id=1&plan_id=1` → 读取 `plan.meta.stripe_price_id` 并确保订阅；返回 `stripe_subscription_id`
  - `POST /v1/billing/stripe/invoices/push?invoice_id=1` → 将本地发票推送到 Stripe（创建 InvoiceItem 与 Invoice，尝试支付）；返回 `stripe_invoice_id`

## Reports
- `GET /v1/reports/daily?user_id=1&date=2025-09-03` → 单日（UTC+8 窗口）聚合：`amount_cents`、`total_tokens`，返回 `request_id`。
- `GET /v1/reports/summary?user_id=1&days=7` → 近 N 日（UTC+8 窗口）按日聚合：`amount_cents`、`total_tokens`，返回 `request_id` 与每日数组。
- `GET /v1/reports/overdraft?user_id=1&days=7` → 近 N 日（UTC+8 窗口）溢出/透支事件列表（block 无 hints 情况会生成警报记录），返回 `request_id` 与事件详情。
- `GET /v1/reports/period?user_id=1&date_from=2025-09-01&date_to=2025-09-03&model=gpt-4o&success=true&group_by=total|model|day|model_day&format=json|csv` → 账期聚合（UTC+8 窗口，支持按 `model`、`success` 过滤；并支持 `group_by` 分组导出）：
  - 字段：`usage_amount_cents`、`usage_tokens`、`topup_cents`、`refunds_cents`、`net_topup_cents`、`balance_delta_cents`，返回 `request_id`。
  - `format=csv` 返回 CSV（首行表头+一行数据）。
  - 当 `group_by=model|day|model_day` 且 `format=csv` 时：
    - `group_by=model` → 多行：`request_id,user_id,from,to,model,usage_amount_cents,usage_tokens`
    - `group_by=day` → 多行：`request_id,user_id,from,to,date,usage_amount_cents,usage_tokens`
    - `group_by=model_day` → 多行：`request_id,user_id,from,to,date,model,usage_amount_cents,usage_tokens`
- `GET /v1/reports/period_team?team_id=1&date_from=2025-09-01&date_to=2025-09-03&model=gpt-4o&success=true&group_by=total|model|day|model_day&format=json|csv` → 团队账期聚合（UTC+8 窗口，支持按 `model`、`success` 过滤与 `group_by` 分组导出；CSV 表头同上，将 `user_id` 换为 `team_id`）。
- `GET /v1/reports/budget?user_id=1` → 预算与额度总览：
  - `wallets`：用户钱包（多币种）余额与低阈值。
  - `daily_limit`：日限额计划（`daily_limit_cents`、`overflow_policy`、`reset_time`、`spent_today_cents`、`remaining_cents`、当前窗口 `window_start|end`）。
  - `api_keys`：该用户的活跃 API Key 的预算（`max_budget_cents`、`budget_duration`）与 `key_last4`、白名单。
  - `gating`：透支强门禁配置；`litellm`：预算联动与同步开关。
  - 支持 `format=csv`：扁平化导出核心指标（含钱包汇总、日限额、门禁与 LiteLLM 配置、API Key 预算汇总）。

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
