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

export function isStrongEnoughPassword(password) {
  const value = String(password || '')
  return value.length >= 8 && value.length <= 128 && /[A-Za-z]/.test(value) && /\d/.test(value)
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    account_level: user.account_level,
    email_verified_at: user.email_verified_at || null,
    created_at: user.created_at,
  }
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function base64Url(bytes) {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(value) {
  const padded = String(value).replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(String(value).length / 4) * 4, '=')
  return Uint8Array.from(atob(padded), char => char.charCodeAt(0))
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256,
  )
  return new Uint8Array(bits)
}

const PASSWORD_HASH_ITERATIONS = 100000
const MAX_WORKERS_PBKDF2_ITERATIONS = 100000

export async function hashPassword(password) {
  const iterations = PASSWORD_HASH_ITERATIONS
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await pbkdf2(password, salt, iterations)
  return `pbkdf2_sha256$${iterations}$${base64Url(salt)}$${base64Url(hash)}`
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, iterationText, saltText, hashText] = String(storedHash || '').split('$')
  if (algorithm !== 'pbkdf2_sha256' || !iterationText || !saltText || !hashText) return false
  const iterations = Number(iterationText)
  if (!Number.isFinite(iterations) || iterations < 100000) return false
  if (iterations > MAX_WORKERS_PBKDF2_ITERATIONS) return false
  const expected = fromBase64Url(hashText)
  const actual = await pbkdf2(password, fromBase64Url(saltText), iterations)
  if (expected.length !== actual.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i += 1) diff |= expected[i] ^ actual[i]
  return diff === 0
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
      u.email_verified_at,
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

export async function createSession(env, userId) {
  const db = requireDb(env)
  const sessionToken = createId('sess')
  const tokenHash = await sha256(sessionToken)
  await db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now', '+30 days'))
  `).bind(createId('session'), userId, tokenHash).run()
  return sessionToken
}

export async function logAccountEvent(env, userId, eventType, metadata = {}) {
  try {
    await requireDb(env).prepare(`
      INSERT INTO account_audit_logs (id, user_id, event_type, metadata, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(createId('audit'), userId || null, eventType, JSON.stringify(metadata || {})).run()
  } catch {
    // Audit logging must never block login or account recovery.
  }
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
