const TOKEN_KEY = 'lynkeduAdminSessionToken'

export function getAdminToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setAdminToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(path, options = {}) {
  const token = getAdminToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(path, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `请求失败：${response.status}`)
  return data
}

export async function loginAdmin(email, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (data.user?.account_level !== 'admin') {
    throw new Error('该账号不是管理员。')
  }
  setAdminToken(data.sessionToken)
  return data
}

export function fetchAdminMe() {
  return apiRequest('/api/me')
}

export function fetchUsers(query) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  return apiRequest(`/api/admin/users?${params.toString()}`)
}

export function updateEntitlement(payload) {
  return apiRequest('/api/admin/entitlements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchInvites() {
  return apiRequest('/api/admin/invites')
}

export function createInvite(payload) {
  return apiRequest('/api/admin/invites', {
    method: 'POST',
    body: JSON.stringify({ action: 'create', ...payload }),
  })
}

export function deactivateInvite(id) {
  return apiRequest('/api/admin/invites', {
    method: 'POST',
    body: JSON.stringify({ action: 'deactivate', id }),
  })
}

export function fetchLogs() {
  return apiRequest('/api/admin/logs')
}
