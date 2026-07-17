import { createId, json, logAdminEvent, readJson, requireAdmin, requireDb } from '../../_shared/auth.js'

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env)
  if (admin.error) return admin.error

  const db = requireDb(env)
  const body = await readJson(request)
  const action = String(body.action || '').trim()
  const userId = String(body.userId || '').trim()
  const featureKey = String(body.featureKey || 'full_access').trim()
  const subjectId = String(body.subjectId || '*').trim()
  const note = String(body.note || '').trim().slice(0, 200) || null
  const days = Number(body.days || 0)
  const expiresAt = normalizeDateTime(body.expiresAt)

  const target = await db.prepare('SELECT id, email FROM users WHERE id = ? LIMIT 1').bind(userId).first()
  if (!target) return json({ error: '找不到该用户。' }, 404)

  if (action === 'grant') {
    const entitlement = await grantEntitlement(db, {
      userId,
      featureKey,
      subjectId,
      expiresAt: expiresAt || (days > 0 ? sqlDateModifier(days) : null),
      expiresAtIsModifier: !expiresAt && days > 0,
      source: `admin:${admin.user.id}`,
      note,
    })
    await logAdminEvent(env, admin.user.id, userId, 'grant_entitlement', { featureKey, subjectId, days, expiresAt, entitlementId: entitlement.id, note })
    return json({ ok: true, entitlement })
  }

  if (action === 'extend') {
    if (!(days > 0)) return json({ error: '续期天数必须大于 0。' }, 400)
    const entitlement = await extendEntitlement(db, { userId, featureKey, subjectId, days, adminUserId: admin.user.id, note })
    await logAdminEvent(env, admin.user.id, userId, 'extend_entitlement', { featureKey, subjectId, days, entitlementId: entitlement.id, note })
    return json({ ok: true, entitlement })
  }

  if (action === 'revoke') {
    const result = await db.prepare(`
      UPDATE entitlements
      SET status = 'revoked', revoked_at = datetime('now'), revoked_by = ?, note = COALESCE(?, note)
      WHERE user_id = ? AND feature_key = ? AND subject_id = ?
        AND COALESCE(status, 'active') = 'active'
    `).bind(admin.user.id, note, userId, featureKey, subjectId).run()
    await logAdminEvent(env, admin.user.id, userId, 'revoke_entitlement', { featureKey, subjectId, changed: result.meta?.changes || 0, note })
    return json({ ok: true, changed: result.meta?.changes || 0 })
  }

  return json({ error: '不支持的操作。' }, 400)
}

async function grantEntitlement(db, { userId, featureKey, subjectId, expiresAt, expiresAtIsModifier, source, note }) {
  const id = createId('ent')
  if (expiresAtIsModifier) {
    await db.prepare(`
      INSERT INTO entitlements (id, user_id, subject_id, feature_key, starts_at, expires_at, source, status, note, created_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now', ?), ?, 'active', ?, datetime('now'))
    `).bind(id, userId, subjectId, featureKey, expiresAt, source, note).run()
  } else {
    await db.prepare(`
      INSERT INTO entitlements (id, user_id, subject_id, feature_key, starts_at, expires_at, source, status, note, created_at)
      VALUES (?, ?, ?, ?, datetime('now'), ?, ?, 'active', ?, datetime('now'))
    `).bind(id, userId, subjectId, featureKey, expiresAt, source, note).run()
  }
  return db.prepare('SELECT * FROM entitlements WHERE id = ? LIMIT 1').bind(id).first()
}

async function extendEntitlement(db, { userId, featureKey, subjectId, days, adminUserId, note }) {
  const current = await db.prepare(`
    SELECT *
    FROM entitlements
    WHERE user_id = ? AND feature_key = ? AND subject_id = ?
      AND COALESCE(status, 'active') = 'active'
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    ORDER BY CASE WHEN expires_at IS NULL THEN 1 ELSE 0 END DESC, expires_at DESC
    LIMIT 1
  `).bind(userId, featureKey, subjectId).first()

  if (current?.expires_at === null) return current

  if (!current) {
    return grantEntitlement(db, {
      userId,
      featureKey,
      subjectId,
      expiresAt: sqlDateModifier(days),
      expiresAtIsModifier: true,
      source: `admin:${adminUserId}`,
      note,
    })
  }

  await db.prepare(`
    UPDATE entitlements
    SET expires_at = datetime(CASE WHEN expires_at > datetime('now') THEN expires_at ELSE datetime('now') END, ?),
        note = COALESCE(?, note)
    WHERE id = ?
  `).bind(sqlDateModifier(days), note, current.id).run()
  return db.prepare('SELECT * FROM entitlements WHERE id = ? LIMIT 1').bind(current.id).first()
}

function sqlDateModifier(days) {
  return `+${Math.floor(Number(days))} days`
}

function normalizeDateTime(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  return `${raw} 23:59:59`
}
