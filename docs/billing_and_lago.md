# Billing Plans & Lago Integration

## Timezone & Limits
- Daily limit reset timezone: UTC+8.
- Overflow policy (default): `block` (reject requests when daily limit exceeded). Supported policies: `grace`, `degrade`.
- `grace` policy: Overflow portion is not charged（溢出部分不计费），仅对未超限剩余额度部分计费（本阶段约定）。
- `degrade` policy: 当前阶段简单实现为降级至 `gpt-4o-mini`，未来版本将支持完整可配置的降级映射与策略。

## Usage Accounting
- Failed requests: not counted in Usage (for now). This is intentional; keep in mind that error retries might shift cost to later successful calls.
- Multi-modal: reserved fields present in payload (e.g., `unit=image/minute/request`, `meta.input_images`), but initial billing focuses on tokens (text) only.

## Plans
- `Plan`:
  - `id`, `name`, `type`: `daily_limit` | `usage`
  - `currency`: `USD`
  - `status`: `active` | `archived`
  - `metadata`
- `DailyLimitPlan` (for `daily_limit`):
  - `daily_limit_cents`, `overflow_policy`, `reset_time` (HH:MM), `timezone` (UTC+8)
- `UsagePlan` (for `usage`):
  - `billing_cycle` (`monthly`|`weekly`), optional `min_commit_cents`, optional `credit_grant_cents`
- `PriceRule`:
  - `plan_id`, `model_pattern` (e.g., `gpt-4*`), `unit` (`token`|`request`|`minute`|`image`)
  - `unit_base_price_cents`, optional `input_multiplier`, `output_multiplier` or `price_multiplier`
  - optional `min_charge_cents`, `effective_from`, `effective_to`
- `PlanAssignment`:
  - `entity_type` (`user`|`team`), `entity_id`, `plan_id`, `effective_from`, `effective_to`, `status`, `timezone`

## Lago Event Endpoints (built into this API)
- Distinct endpoints with consistent payloads, hosted by this service.

### POST /lago/events/payment
- Auth: `Authorization: Bearer {LAGO_API_KEY}`
- Body:
```
{
  "event_type": "wallet_topup" | "refund",
  "provider": "stripe",
  "provider_txn_id": "pi_...",
  "order_id": "ORD-...",
  "amount_cents": 1000,
  "currency": "USD",
  "status": "succeeded" | "refunded",
  "request_id": "...",
  "subject": { "user_id": 1, "team_id": null },
  "meta": { "payment_method": "..." }
}
```

### POST /lago/events/usage
- Auth: `Authorization: Bearer {LAGO_API_KEY}`
- Body:
```
{
  "usage_id": "...",
  "subject": { "user_id": 1, "team_id": null },
  "model": "gpt-4o",
  "unit": "token", // reserved: request|minute|image
  "tokens": {"total": 1234, "input": 1000, "output": 234},
  "pricing": {
    "unit_base_price_cents": 15,
    "price_multiplier": 1.0,
    "computed_amount_cents": 19,
    "currency": "USD"
  },
  "timestamp": "2025-09-03T12:34:56Z",
  "request_id": "...",
  "success": true,
  "meta": { "provider_model": "gpt-4o", "latency_ms": 351 }
}
```

## Middleware Environment Variables
- `LAGO_EVENTS_ENABLED` (0/1): enable posting to the events endpoints.
- `LAGO_PAYMENTS_ENDPOINT` (default `/events/payment`)
- `LAGO_USAGE_ENDPOINT` (default `/events/usage`)

## Notes
- All currency fields use cents; currency is `USD` initially.
- `request_id` is propagated for end-to-end traceability.
- Prices are computed using local `PriceRule` and included in Usage events; Lago can recompute or override if needed.

## Implemented Controls & Config
- Next-request strong gating after overdraft（已实现）
  - 当出现 `block` 策略且无 token hints 导致的透支（overdraft）后，对同日 UTC+8 窗口中的后续请求启用强门禁：
    - `OVERDRAFT_GATING_ENABLED=1` 开启；
    - `OVERDRAFT_GATING_MODE=block|degrade` 控制后续请求的处理策略；
    - `block`：直接 403；`degrade`：强制降级到 fallback 模型（见下）。
- Configurable degrade mapping（已实现基础）
  - 通过环境变量配置映射与默认回退：
    - `DEGRADE_DEFAULT_MODEL`（默认 `gpt-4o-mini`）
    - `DEGRADE_MAPPING`（例如：`gpt-4o->gpt-4o-mini,gpt-4*->gpt-4o-mini`）

## Future Iterations (Roadmap)
- Configurable degrade mapping via API/DB（可配置降级映射）
  - 需求：在 Plans 管理下新增映射资源（`model_pattern -> fallback_model`），支持 CRUD；代理层读取并缓存。
  - 目的：替代或覆盖 `DEGRADE_MAPPING` 环境变量，支持多环境快速配置。
- Team 维度与报表
  - 聚合 usage/payment 到 team 层，提供日度/账期报表与导出（JSON/CSV），支持 user/team 组合视图。
- Multi-modal 定价扩展
  - 按 unit=request/minute/image 定义 PriceRule 计算；对图像/音频等类型扩展计价字段（如张数/分钟数）。
- Invoices & Subscriptions（发票/订阅扣费）
  - 模型：Customer（与 user/team 绑定）、Subscription（关联 Plan/PriceRules）、Product/Price（Plan 映射）、Invoice（账期聚合行项目）
  - 流程：账期结束 → 生成发票 → Stripe Billing 自动扣费（保存 PaymentMethod、Customer、Subscription/Invoice/PaymentIntent）；成功/失败 webhook（`/v1/webhooks/stripe` 处理 `invoice.*`）→ 回写发票状态（draft|finalized|paid|failed）、Credit Note（退款）
  - Outbox：事件发送（Lago/外部）进入 `event_outbox`，指数退避重试；超过 `OUTBOX_MAX_ATTEMPTS` 标记 dead（demo 期内不阻断主流程）。
  - 对齐：保留 `/lago/events/*` 供事件驱动的账单与对账；本服务暴露发票/订阅 API 并与 Stripe/LiteLLM 联动
- 安全与弹性
  - 事件重试/退避（指数退避）、死信队列；请求幂等；
  - 限流/并发/DoS 保护；机密管理（key 加密、轮换）；
  - 观测：结构化日志、请求耗时、trace（request_id/trace_id）；审计日志；
