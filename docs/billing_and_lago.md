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
