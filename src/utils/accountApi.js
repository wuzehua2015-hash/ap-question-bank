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

async function apiFormRequest(path, formData) {
  const token = getSessionToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const response = await fetch(path, { method: 'POST', headers, body: formData })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `请求失败：${response.status}`)
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

export function fetchIbMockEligibility(subjectId) {
  return apiRequest(`/api/ib/mock-exams/eligibility?subjectId=${encodeURIComponent(subjectId)}`)
}

export function fetchIbMocks({ subjectId, includeArchived = false } = {}) {
  const params = new URLSearchParams()
  if (subjectId) params.set('subjectId', subjectId)
  if (includeArchived) params.set('includeArchived', 'true')
  return apiRequest(`/api/ib/mock-exams?${params}`)
}

export function createIbMock(subjectId) {
  return apiRequest('/api/ib/mock-exams', { method: 'POST', body: JSON.stringify({ subjectId }) })
}

export function fetchIbMock(mockId) {
  return apiRequest(`/api/ib/mock-exams/${encodeURIComponent(mockId)}`)
}

export function updateIbMock(mockId, changes) {
  return apiRequest(`/api/ib/mock-exams/${encodeURIComponent(mockId)}`, { method: 'PATCH', body: JSON.stringify(changes) })
}

export function updateIbMockTimer(mockId, payload, { keepalive = false } = {}) {
  return apiRequest(`/api/ib/mock-exams/${encodeURIComponent(mockId)}/timer`, {
    method: 'POST',
    body: JSON.stringify(payload),
    keepalive,
  })
}

export function fetchQuestionAttempts({ subjectId, questionId, limit = 50 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (subjectId) params.set('subjectId', subjectId)
  if (questionId) params.set('questionId', questionId)
  return apiRequest(`/api/learning/attempts?${params}`)
}

export function createQuestionAttempt(payload) {
  return apiRequest('/api/learning/attempts', { method: 'POST', body: JSON.stringify(payload) })
}

export function createAnswerUploadBatch(payload) {
  return apiRequest('/api/learning/upload-batches', { method: 'POST', body: JSON.stringify(payload) })
}

export function fetchAnswerUploadBatch({ id, code } = {}) {
  const params = new URLSearchParams()
  if (id) params.set('id', id)
  if (code) params.set('code', code)
  return apiRequest(`/api/learning/upload-batches?${params}`)
}

export function uploadAnswerAsset(batchId, file, pageOrder) {
  const form = new FormData()
  form.append('file', file)
  form.append('pageOrder', String(pageOrder))
  return apiFormRequest(`/api/learning/upload-batches/${encodeURIComponent(batchId)}/assets`, form)
}

export function completeAnswerUploadBatch(batchId, mappings) {
  return apiRequest(`/api/learning/upload-batches/${encodeURIComponent(batchId)}/complete`, {
    method: 'POST',
    body: JSON.stringify({ mappings }),
  })
}

export function fetchAttemptDetail(attemptId) {
  return apiRequest(`/api/learning/attempts/${encodeURIComponent(attemptId)}`)
}

export function confirmAttemptReview(attemptId, payload) {
  return apiRequest(`/api/learning/attempts/${encodeURIComponent(attemptId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}
