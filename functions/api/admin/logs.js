import { json, requireAdmin, requireDb } from '../../_shared/auth.js'

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env)
  if (admin.error) return admin.error

  const db = requireDb(env)
  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit') || 80), 200)
  const logs = await db.prepare(`
    SELECT
      l.id,
      l.event_type,
      l.metadata,
      l.created_at,
      admin.email AS admin_email,
      target.email AS target_email,
      target.display_name AS target_name
    FROM admin_audit_logs l
    JOIN users admin ON admin.id = l.admin_user_id
    LEFT JOIN users target ON target.id = l.target_user_id
    ORDER BY l.created_at DESC
    LIMIT ?
  `).bind(limit).all()

  return json({
    logs: (logs.results || []).map(row => ({
      ...row,
      metadata: safeParseJson(row.metadata),
    })),
  })
}

function safeParseJson(value) {
  try {
    return JSON.parse(value || '{}')
  } catch {
    return {}
  }
}
