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

