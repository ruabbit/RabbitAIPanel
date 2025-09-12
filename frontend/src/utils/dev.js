export function currentUserId(defaultValue = '1') {
  try {
    return localStorage.getItem('dev_user_id') || defaultValue
  } catch {
    return defaultValue
  }
}

export function currentApiKey() {
  try {
    return localStorage.getItem('dev_api_key') || ''
  } catch {
    return ''
  }
}

export function currentProvider() {
  try {
    return localStorage.getItem('social_provider') || 'google'
  } catch {
    return 'google'
  }
}

