ALTER TABLE entitlements ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE entitlements ADD COLUMN revoked_at TEXT;
ALTER TABLE entitlements ADD COLUMN revoked_by TEXT;
ALTER TABLE entitlements ADD COLUMN note TEXT;

ALTER TABLE membership_invites ADD COLUMN redemption_days INTEGER;
ALTER TABLE membership_invites ADD COLUMN created_by TEXT;
ALTER TABLE membership_invites ADD COLUMN note TEXT;

CREATE TABLE IF NOT EXISTS invite_redemptions (
  id TEXT PRIMARY KEY,
  invite_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  entitlement_id TEXT,
  redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (invite_id) REFERENCES membership_invites(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (entitlement_id) REFERENCES entitlements(id)
);

CREATE INDEX IF NOT EXISTS idx_invite_redemptions_invite_id
  ON invite_redemptions(invite_id);

CREATE INDEX IF NOT EXISTS idx_invite_redemptions_user_id
  ON invite_redemptions(user_id);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL,
  target_user_id TEXT,
  event_type TEXT NOT NULL,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_user_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created
  ON admin_audit_logs(admin_user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_created
  ON admin_audit_logs(target_user_id, created_at);
