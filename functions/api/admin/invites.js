import { createId, json, logAdminEvent, readJson, requireAdmin, requireDb, sha256 } from '../../_shared/auth.js'

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env)
  if (admin.error) return admin.error

  const db = requireDb(env)
  const invites = await db.prepare(`
    SELECT id, label, feature_key, max_uses, used_count, expires_at, active, redemption_days, created_by, note, created_at
    FROM membership_invites
    ORDER BY created_at DESC
    LIMIT 100
  `).all()

  const rows = []
  for (const invite of invites.results || []) {
    const redemptions = await db.prepare(`
      SELECT r.id, r.redeemed_at, u.email, u.display_name
      FROM invite_redemptions r
      JOIN users u ON u.id = r.user_id
      WHERE r.invite_id = ?
      ORDER BY r.redeemed_at DESC
      LIMIT 20
    `).bind(invite.id).all()
    rows.push({ ...invite, redemptions: redemptions.results || [] })
  }

  return json({ invites: rows })
}

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env)
  if (admin.error) return admin.error

  const db = requireDb(env)
  const body = await readJson(request)
  const action = String(body.action || 'create').trim()

  if (action === 'deactivate') {
    const id = String(body.id || '').trim()
    const result = await db.prepare('UPDATE membership_invites SET active = 0 WHERE id = ?').bind(id).run()
    await logAdminEvent(env, admin.user.id, null, 'deactivate_invite', { inviteId: id, changed: result.meta?.changes || 0 })
    return json({ ok: true, changed: result.meta?.changes || 0 })
  }

  if (action !== 'create') return json({ error: '不支持的操作。' }, 400)

  const rawCode = normalizeCode(body.code || generateInviteCode())
  const label = String(body.label || '').trim().slice(0, 80) || null
  const maxUses = positiveIntegerOrNull(body.maxUses)
  const redemptionDays = positiveIntegerOrNull(body.redemptionDays) || 365
  const expiresAt = normalizeDateTime(body.expiresAt)
  const note = String(body.note || '').trim().slice(0, 200) || null
  const id = createId('inv')

  await db.prepare(`
    INSERT INTO membership_invites (
      id, code_hash, label, account_level, feature_key, max_uses, used_count,
      expires_at, active, redemption_days, created_by, note, created_at
    )
    VALUES (?, ?, ?, 'free', 'full_access', ?, 0, ?, 1, ?, ?, ?, datetime('now'))
  `).bind(
    id,
    await sha256(rawCode),
    label,
    maxUses,
    expiresAt,
    redemptionDays,
    admin.user.id,
    note,
  ).run()

  await logAdminEvent(env, admin.user.id, null, 'create_invite', { inviteId: id, label, maxUses, redemptionDays, expiresAt })
  const invite = await db.prepare(`
    SELECT id, label, feature_key, max_uses, used_count, expires_at, active, redemption_days, created_by, note, created_at
    FROM membership_invites
    WHERE id = ?
    LIMIT 1
  `).bind(id).first()
  return json({ ok: true, invite, code: rawCode })
}

function generateInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(10))
  let value = 'LYNK'
  for (let index = 0; index < bytes.length; index += 1) {
    if (index === 2 || index === 6) value += '-'
    value += alphabet[bytes[index] % alphabet.length]
  }
  return value
}

function normalizeCode(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '')
}

function positiveIntegerOrNull(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number <= 0) return null
  return Math.floor(number)
}

function normalizeDateTime(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  return `${raw} 23:59:59`
}
