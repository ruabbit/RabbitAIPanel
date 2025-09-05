const API_BASE = import.meta?.env?.VITE_API_BASE || ''

function headers() {
  const h = { 'Content-Type': 'application/json' }
  const apiKey = localStorage.getItem('dev_api_key')
  const devUserId = localStorage.getItem('dev_user_id')
  if (apiKey) h['x-api-key'] = apiKey
  if (devUserId) h['x-dev-user-id'] = devUserId
  return h
}

export async function startSocialLogin(provider = 'google') {
  const res = await fetch(`${API_BASE}/v1/auth/social/start?provider=${encodeURIComponent(provider)}`, {
    method: 'POST',
    headers: headers(),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function syncProfile(accessToken, overrides = {}) {
  const res = await fetch(`${API_BASE}/v1/auth/sync_profile`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ access_token: accessToken, ...overrides }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ===== Reports (User dashboard)
export async function getBudget(userId, format = 'json') {
  const url = `${API_BASE}/v1/reports/budget?user_id=${encodeURIComponent(userId)}&format=${encodeURIComponent(format)}`
  const res = await fetch(url, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return format === 'csv' ? res.text() : res.json()
}

export async function getPeriod({ userId, dateFrom, dateTo, model, success, groupBy = 'total', format = 'json' }) {
  const params = new URLSearchParams()
  params.set('user_id', userId)
  params.set('date_from', dateFrom)
  params.set('date_to', dateTo)
  params.set('group_by', groupBy)
  params.set('format', format)
  if (model) params.set('model', model)
  if (typeof success === 'boolean') params.set('success', success ? 'true' : 'false')
  const res = await fetch(`${API_BASE}/v1/reports/period?${params.toString()}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return format === 'csv' ? res.text() : res.json()
}

// ===== Admin (Billing)
export async function listInvoices({ customerId, limit = 50, offset = 0 }) {
  const params = new URLSearchParams()
  if (customerId) params.set('customer_id', customerId)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  const res = await fetch(`${API_BASE}/v1/billing/invoices?${params.toString()}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function listSubscriptions({ customerId, planId, limit = 50, offset = 0 }) {
  const params = new URLSearchParams()
  if (customerId) params.set('customer_id', customerId)
  if (planId) params.set('plan_id', planId)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  const res = await fetch(`${API_BASE}/v1/billing/subscriptions?${params.toString()}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function listPriceMappings({ planId } = {}) {
  const params = new URLSearchParams()
  if (planId) params.set('plan_id', planId)
  const res = await fetch(`${API_BASE}/v1/billing/stripe/price_mappings?${params.toString()}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function generateInvoice({ customerId, dateFrom, dateTo }) {
  const params = new URLSearchParams()
  params.set('customer_id', customerId)
  params.set('date_from', dateFrom)
  params.set('date_to', dateTo)
  const res = await fetch(`${API_BASE}/v1/billing/invoices/generate?${params.toString()}`, {
    method: 'POST',
    headers: headers(),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function pushInvoiceToStripe({ invoiceId }) {
  const params = new URLSearchParams()
  params.set('invoice_id', invoiceId)
  const res = await fetch(`${API_BASE}/v1/billing/stripe/invoices/push?${params.toString()}`, {
    method: 'POST',
    headers: headers(),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ===== Wallets
export async function getWallets(userId) {
  const res = await fetch(`${API_BASE}/v1/wallets/${encodeURIComponent(userId)}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getLedger(userId, limit = 20) {
  const params = new URLSearchParams(); params.set('limit', String(limit))
  const res = await fetch(`${API_BASE}/v1/wallets/${encodeURIComponent(userId)}/ledger?${params.toString()}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ===== Proxy (LiteLLM)
export async function chatCompletions({ model, messages, xLitellmApiKey }) {
  const h = headers(); if (xLitellmApiKey) h['x-litellm-api-key'] = xLitellmApiKey
  const res = await fetch(`${API_BASE}/v1/proxy/chat/completions`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ model, messages }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ===== Plans
export async function createPlan({ name, type, currency = 'USD', meta }) {
  const res = await fetch(`${API_BASE}/v1/plans`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ name, type, currency, meta })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function upsertDailyLimit({ planId, dailyLimitCents, overflowPolicy = 'block', resetTime = '00:00', timezone = 'UTC+8' }) {
  const res = await fetch(`${API_BASE}/v1/plans/daily_limit`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ plan_id: planId, daily_limit_cents: dailyLimitCents, overflow_policy: overflowPolicy, reset_time: resetTime, timezone })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function upsertUsagePlan({ planId, billingCycle = 'monthly', minCommitCents, creditGrantCents }) {
  const res = await fetch(`${API_BASE}/v1/plans/usage`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ plan_id: planId, billing_cycle: billingCycle, min_commit_cents: minCommitCents, credit_grant_cents: creditGrantCents })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function addPriceRuleToPlan({ planId, modelPattern, unit = 'token', unitBasePriceCents, inputMultiplier, outputMultiplier, priceMultiplier, minChargeCents }) {
  const res = await fetch(`${API_BASE}/v1/plans/pricing`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ plan_id: planId, model_pattern: modelPattern, unit, unit_base_price_cents: unitBasePriceCents, input_multiplier: inputMultiplier, output_multiplier: outputMultiplier, price_multiplier: priceMultiplier, min_charge_cents: minChargeCents })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function assignPlan({ entityType = 'user', entityId, planId, timezone = 'UTC+8' }) {
  const res = await fetch(`${API_BASE}/v1/plans/assign`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ entity_type: entityType, entity_id: entityId, plan_id: planId, timezone })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getPlan(planId) {
  const res = await fetch(`${API_BASE}/v1/plans/${encodeURIComponent(planId)}`, { headers: headers() })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updatePlanMeta({ planId, meta }) {
  const res = await fetch(`${API_BASE}/v1/plans/meta`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ plan_id: planId, meta })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ===== Billing ensures
export async function ensureStripeCustomer({ customerId }) {
  const res = await fetch(`${API_BASE}/v1/billing/stripe/customers/ensure?customer_id=${encodeURIComponent(customerId)}`, {
    method: 'POST', headers: headers(),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function ensureStripeSubscription({ customerId, planId, stripePriceId }) {
  const res = await fetch(`${API_BASE}/v1/billing/stripe/subscriptions/ensure`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ customer_id: customerId, plan_id: planId, stripe_price_id: stripePriceId })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function ensureStripeSubscriptionByPlan({ customerId, planId }) {
  const params = new URLSearchParams(); params.set('customer_id', customerId); params.set('plan_id', planId)
  const res = await fetch(`${API_BASE}/v1/billing/stripe/subscriptions/ensure_by_plan?${params.toString()}`, {
    method: 'POST', headers: headers(),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ===== Price mappings CRUD
export async function createPriceMapping({ planId, stripePriceId, currency = 'USD', active = true }) {
  const res = await fetch(`${API_BASE}/v1/billing/stripe/price_mappings`, {
    method: 'POST', headers: headers(), body: JSON.stringify({ plan_id: planId, stripe_price_id: stripePriceId, currency, active })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updatePriceMapping({ mappingId, stripePriceId, currency, active }) {
  const res = await fetch(`${API_BASE}/v1/billing/stripe/price_mappings/${encodeURIComponent(mappingId)}`, {
    method: 'PATCH', headers: headers(), body: JSON.stringify({ stripe_price_id: stripePriceId, currency, active })
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deletePriceMapping({ mappingId }) {
  const res = await fetch(`${API_BASE}/v1/billing/stripe/price_mappings/${encodeURIComponent(mappingId)}`, {
    method: 'DELETE', headers: headers()
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

