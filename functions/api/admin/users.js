import { json, requireAdmin, requireDb } from '../../_shared/auth.js'

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env)
  if (admin.error) return admin.error

  const db = requireDb(env)
  const url = new URL(request.url)
  const query = String(url.searchParams.get('q') || '').trim().toLowerCase()
  const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50)
  const users = query
    ? await db.prepare(`
        SELECT id, email, display_name, account_level, email_verified_at, created_at, last_login_at
        FROM users
        WHERE lower(email) LIKE ? OR lower(COALESCE(display_name, '')) LIKE ?
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(`%${query}%`, `%${query}%`, limit).all()
    : await db.prepare(`
        SELECT id, email, display_name, account_level, email_verified_at, created_at, last_login_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(limit).all()

  const rows = users.results || []
  const enriched = []
  for (const user of rows) {
    const entitlements = await db.prepare(`
      SELECT id, subject_id, feature_key, starts_at, expires_at, source, status, revoked_at, note, created_at
      FROM entitlements
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).bind(user.id).all()
    enriched.push({ ...user, entitlements: entitlements.results || [] })
  }

  return json({ users: enriched })
}
