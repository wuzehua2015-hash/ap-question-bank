PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS mock_exams (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  business_date TEXT NOT NULL,
  user_title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE (user_id, subject_id, business_date)
);

CREATE INDEX IF NOT EXISTS idx_mock_exams_user_updated
  ON mock_exams(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_mock_exams_user_subject_date
  ON mock_exams(user_id, subject_id, business_date DESC);

CREATE TABLE IF NOT EXISTS mock_exam_papers (
  id TEXT PRIMARY KEY,
  mock_exam_id TEXT NOT NULL,
  paper TEXT NOT NULL CHECK (paper IN ('P1', 'P2', 'P3')),
  time_limit_seconds INTEGER NOT NULL CHECK (time_limit_seconds > 0),
  remaining_seconds INTEGER NOT NULL CHECK (remaining_seconds >= 0),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'active', 'paused', 'submitted', 'expired')),
  timer_lease_token TEXT,
  timer_lease_expires_at TEXT,
  last_started_at TEXT,
  last_saved_at TEXT,
  submitted_at TEXT,
  FOREIGN KEY (mock_exam_id) REFERENCES mock_exams(id),
  UNIQUE (mock_exam_id, paper)
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_papers_mock
  ON mock_exam_papers(mock_exam_id, paper);

CREATE TABLE IF NOT EXISTS mock_exam_questions (
  id TEXT PRIMARY KEY,
  mock_exam_id TEXT NOT NULL,
  paper TEXT NOT NULL CHECK (paper IN ('P1', 'P2', 'P3')),
  section TEXT,
  subject_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  order_index INTEGER NOT NULL CHECK (order_index >= 0),
  marks INTEGER NOT NULL CHECK (marks > 0),
  FOREIGN KEY (mock_exam_id) REFERENCES mock_exams(id),
  UNIQUE (mock_exam_id, paper, order_index),
  UNIQUE (mock_exam_id, subject_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_mock_exam_questions_mock_paper
  ON mock_exam_questions(mock_exam_id, paper, order_index);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('quiz', 'mock', 'review')),
  source_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_sessions_source
  ON learning_sessions(user_id, session_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_created
  ON learning_sessions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS question_attempts (
  id TEXT PRIMARY KEY,
  learning_session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  part_label TEXT,
  answer_type TEXT NOT NULL CHECK (answer_type IN ('mcq', 'typed', 'image', 'pdf', 'manual_score')),
  answer_json TEXT,
  score REAL,
  max_score REAL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'processing', 'needs_confirmation', 'confirmed', 'failed')),
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  FOREIGN KEY (learning_session_id) REFERENCES learning_sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  CHECK (score IS NULL OR score >= 0),
  CHECK (max_score IS NULL OR max_score >= 0),
  CHECK (score IS NULL OR max_score IS NULL OR score <= max_score)
);

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_submitted
  ON question_attempts(user_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_attempts_question
  ON question_attempts(user_id, subject_id, question_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_attempts_session
  ON question_attempts(learning_session_id, submitted_at);

CREATE TABLE IF NOT EXISTS attempt_assets (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  page_order INTEGER NOT NULL DEFAULT 0 CHECK (page_order >= 0),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('pending', 'uploaded', 'processing', 'ready', 'failed', 'deleted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (attempt_id) REFERENCES question_attempts(id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_assets_attempt_order
  ON attempt_assets(attempt_id, page_order);
