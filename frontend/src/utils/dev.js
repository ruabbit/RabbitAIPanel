export function isDebug() {
  try {
    const v = import.meta?.env?.VITE_DEBUG
    return v === true || v === 'true' || v === '1'
  } catch {
    return false
  }
}

export function isLogged() {
  try {
    // Best-effort: check common cookie names; real session cookies may be HttpOnly and not visible.
    const c = document.cookie || ''
    return /session|auth|token/i.test(c)
  } catch {
    return false
  }
}

export function currentUserId(defaultValue = '1') {
  try {
    if (!isDebug()) return defaultValue
    return localStorage.getItem('dev_user_id') || defaultValue
  } catch {
    return defaultValue
  }
}

export function currentApiKey() {
  try {
    if (!isDebug()) return ''
    return localStorage.getItem('dev_api_key') || ''
  } catch {
    return ''
  }
}

export function currentProvider() {
  try {
    if (!isDebug()) return 'google'
    return localStorage.getItem('social_provider') || 'google'
  } catch {
    return 'google'
  }
}
