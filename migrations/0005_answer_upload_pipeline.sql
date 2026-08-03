PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS answer_upload_batches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('quiz', 'mock', 'review')),
  source_id TEXT NOT NULL,
  upload_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'uploading', 'ready', 'submitted', 'cancelled', 'expired')),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  submitted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE (user_id, upload_code)
);

CREATE INDEX IF NOT EXISTS idx_answer_upload_batches_user_updated
  ON answer_upload_batches(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS answer_upload_assets (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  attempt_id TEXT,
  r2_key TEXT NOT NULL UNIQUE,
  original_name TEXT,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256 TEXT NOT NULL,
  page_order INTEGER NOT NULL DEFAULT 0 CHECK (page_order >= 0),
  question_id TEXT,
  part_label TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'mapped', 'submitted', 'processing', 'ready', 'failed', 'deleted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (batch_id) REFERENCES answer_upload_batches(id),
  FOREIGN KEY (attempt_id) REFERENCES question_attempts(id)
);

CREATE INDEX IF NOT EXISTS idx_answer_upload_assets_batch_order
  ON answer_upload_assets(batch_id, page_order, created_at);

CREATE TABLE IF NOT EXISTS recognition_runs (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'processing', 'needs_confirmation', 'confirmed', 'failed')),
  transcription_json TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (attempt_id) REFERENCES question_attempts(id)
);

CREATE INDEX IF NOT EXISTS idx_recognition_runs_attempt_created
  ON recognition_runs(attempt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS attempt_mark_point_results (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  mark_point_id TEXT NOT NULL,
  knowledge_point_code TEXT,
  suggested_awarded INTEGER CHECK (suggested_awarded IN (0, 1)),
  confirmed_awarded INTEGER CHECK (confirmed_awarded IN (0, 1)),
  confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  evidence_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  FOREIGN KEY (attempt_id) REFERENCES question_attempts(id),
  UNIQUE (attempt_id, mark_point_id)
);

