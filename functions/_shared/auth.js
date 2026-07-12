export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

export function requireDb(env) {
  if (!env.DB) {
    throw new Error('D1 binding DB is not configured')
  }
  return env.DB
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function createNumericCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function createId(prefix) {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}

export async function getSessionUser(request, env) {
  const auth = request.headers.get('Authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!token) return null

  const db = requireDb(env)
  const tokenHash = await sha256(token)
  const row = await db.prepare(`
    SELECT
      u.id,
      u.email,
      u.display_name,
      u.account_level,
      u.created_at,
      s.id AS session_id
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
    LIMIT 1
  `).bind(tokenHash).first()

  if (!row) return null
  return row
}

export async function getEntitlements(env, userId) {
  const db = requireDb(env)
  const result = await db.prepare(`
    SELECT id, subject_id, feature_key, starts_at, expires_at, source
    FROM entitlements
    WHERE user_id = ?
      AND (starts_at IS NULL OR starts_at <= datetime('now'))
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY subject_id, feature_key
  `).bind(userId).all()
  return result.results || []
}
