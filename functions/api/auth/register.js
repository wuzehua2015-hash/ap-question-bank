import {
  createId,
  createSession,
  getEntitlements,
  hashPassword,
  isStrongEnoughPassword,
  isValidEmail,
  json,
  logAccountEvent,
  normalizeEmail,
  publicUser,
  readJson,
  requireDb,
  sha256,
} from '../../_shared/auth.js'
import { sendAccountEmail } from '../../_shared/email.js'

export async function onRequestPost({ request, env }) {
  try {
    const db = requireDb(env)
    const body = await readJson(request)
    const email = normalizeEmail(body.email)
    const password = String(body.password || '')
    const displayName = String(body.displayName || '').trim().slice(0, 40)
    const inviteCode = String(body.inviteCode || '').trim()

    if (!isValidEmail(email)) return json({ error: '请输入有效邮箱。' }, 400)
    if (!isStrongEnoughPassword(password)) return json({ error: '密码至少 8 位，并包含字母和数字。' }, 400)

    const existing = await db.prepare('SELECT id FROM users WHERE email = ? LIMIT 1').bind(email).first()
    if (existing) return json({ error: '该邮箱已经注册，请直接登录。' }, 409)

    const userId = createId('usr')
    await db.prepare(`
      INSERT INTO users (id, email, display_name, account_level, created_at, updated_at, last_login_at)
      VALUES (?, ?, ?, 'free', datetime('now'), datetime('now'), datetime('now'))
    `).bind(userId, email, displayName || null).run()
    await db.prepare(`
      INSERT INTO auth_identities (id, user_id, provider, provider_user_id, verified_at, created_at)
      VALUES (?, ?, 'email', ?, NULL, datetime('now'))
    `).bind(createId('ident'), userId, email).run()
    await db.prepare(`
      INSERT INTO password_credentials (user_id, password_hash, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
    `).bind(userId, await hashPassword(password)).run()

    const inviteApplied = inviteCode ? await applyInvite(db, userId, inviteCode) : false
    const verification = await createEmailVerification(db, env, userId, email)
    const user = await db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1').bind(userId).first()
    const sessionToken = await createSession(env, userId)
    const entitlements = await getEntitlements(env, userId)
    await logAccountEvent(env, userId, 'register', { inviteApplied })

    return json({
      sessionToken,
      user: publicUser(user),
      entitlements,
      emailVerification: verification,
      inviteApplied,
    })
  } catch (error) {
    return json({ error: error.message || '注册失败。' }, 500)
  }
}

async function createEmailVerification(db, env, userId, email) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const codeHash = await sha256(`${email}:${code}:${env.AUTH_CODE_SECRET || 'local-secret'}:verify-email`)
  await db.prepare(`
    INSERT INTO email_verifications (id, user_id, email, code_hash, expires_at, created_at)
    VALUES (?, ?, ?, ?, datetime('now', '+20 minutes'), datetime('now'))
  `).bind(createId('emailv'), userId, email, codeHash).run()

  const delivery = await sendAccountEmail(env, {
    to: email,
    subject: '验证你的翎英教育账号',
    text: `你的邮箱验证码是 ${code}，20 分钟内有效。`,
  })
  if (delivery.sent) return { delivery: 'email' }
  if (env.DEV_LOGIN_CODE_ENABLED === 'true') return { delivery: 'debug', debugCode: code }
  return { delivery: 'pending' }
}

async function applyInvite(db, userId, rawCode) {
  const codeHash = await sha256(rawCode.trim().toUpperCase())
  const invite = await db.prepare(`
    SELECT * FROM membership_invites
    WHERE code_hash = ? AND active = 1
      AND (expires_at IS NULL OR expires_at > datetime('now'))
      AND (max_uses IS NULL OR used_count < max_uses)
    LIMIT 1
  `).bind(codeHash).first()
  if (!invite) return false

  await db.prepare(`
    INSERT INTO entitlements (id, user_id, subject_id, feature_key, source, created_at)
    VALUES (?, ?, '*', ?, ?, datetime('now'))
  `).bind(createId('ent'), userId, invite.feature_key || 'full_access', `invite:${invite.id}`).run()
  await db.prepare('UPDATE membership_invites SET used_count = used_count + 1 WHERE id = ?').bind(invite.id).run()
  return true
}
