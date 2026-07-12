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

export function verifyLoginCode(email, code) {
  return apiRequest('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
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
