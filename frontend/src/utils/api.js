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

