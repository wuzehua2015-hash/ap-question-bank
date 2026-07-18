const TOKEN_KEY = 'lynkeduSessionToken'

export function getSessionToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setSessionToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const token = getSessionToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(path, {
    ...options,
    headers,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `请求失败：${response.status}`)
  }
  return data
}

export function requestLoginCode(email) {
  return apiRequest('/api/auth/request-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function registerAccount({ email, password, displayName, inviteCode }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName, inviteCode }),
  })
}

export function loginWithPassword(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function verifyLoginCode(email, code) {
  return apiRequest('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
}

export function verifyEmail(code) {
  return apiRequest('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

export function requestEmailVerification() {
  return apiRequest('/api/auth/request-email-verification', {
    method: 'POST',
  })
}

export function requestPasswordReset(email) {
  return apiRequest('/api/auth/request-password-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPassword({ email, code, password }) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, password }),
  })
}

export function fetchMe() {
  return apiRequest('/api/me')
}

export function fetchProgress() {
  return apiRequest('/api/progress')
}

export function saveProgress(snapshot) {
  return apiRequest('/api/progress', {
    method: 'POST',
    body: JSON.stringify({ snapshot }),
  })
}

export function updateProfile(displayName) {
  return apiRequest('/api/account/profile', {
    method: 'POST',
    body: JSON.stringify({ displayName }),
  })
}

export function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/api/account/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function logoutOtherSessions() {
  return apiRequest('/api/account/sessions', {
    method: 'DELETE',
  })
}
