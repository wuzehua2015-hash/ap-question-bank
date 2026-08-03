#!/usr/bin/env python3
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / "migrations"


def expect_integrity_error(action, label):
    try:
        action()
    except sqlite3.IntegrityError:
        return
    raise AssertionError(f"Expected database constraint: {label}")


db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys = ON")
for migration in sorted(MIGRATIONS.glob("*.sql")):
    db.executescript(migration.read_text(encoding="utf-8"))

db.execute("INSERT INTO users (id, email, account_level, created_at, updated_at) VALUES ('u1', 'student@example.com', 'free', datetime('now'), datetime('now'))")
db.execute("INSERT INTO mock_exams (id, user_id, subject_id, business_date) VALUES ('m1', 'u1', 'ib-math-aa-sl', '2026-07-29')")
expect_integrity_error(
    lambda: db.execute("INSERT INTO mock_exams (id, user_id, subject_id, business_date) VALUES ('m2', 'u1', 'ib-math-aa-sl', '2026-07-29')"),
    "one Mock per user, subject and business date",
)

db.execute("INSERT INTO mock_exam_papers (id, mock_exam_id, paper, time_limit_seconds, remaining_seconds) VALUES ('mp1', 'm1', 'P1', 5400, 5400)")
db.execute("INSERT INTO mock_exam_questions (id, mock_exam_id, paper, section, subject_id, question_id, order_index, marks) VALUES ('mq1', 'm1', 'P1', 'A', 'ib-math-aa-sl', 'q1', 0, 5)")
expect_integrity_error(
    lambda: db.execute("INSERT INTO mock_exam_questions (id, mock_exam_id, paper, section, subject_id, question_id, order_index, marks) VALUES ('mq2', 'm1', 'P1', 'A', 'ib-math-aa-sl', 'q2', 0, 5)"),
    "fixed unique order within a Paper",
)

db.execute("INSERT INTO learning_sessions (id, user_id, subject_id, session_type, source_id) VALUES ('ls1', 'u1', 'ib-math-aa-sl', 'quiz', 'quiz-client-1')")
db.execute("INSERT INTO question_attempts (id, learning_session_id, user_id, subject_id, question_id, answer_type, answer_json, score, max_score) VALUES ('a1', 'ls1', 'u1', 'ib-math-aa-sl', 'q1', 'typed', '{}', 2, 5)")
db.execute("INSERT INTO question_attempts (id, learning_session_id, user_id, subject_id, question_id, answer_type, answer_json, score, max_score) VALUES ('a2', 'ls1', 'u1', 'ib-math-aa-sl', 'q1', 'typed', '{}', 4, 5)")
attempt_count = db.execute("SELECT COUNT(*) FROM question_attempts WHERE user_id = 'u1' AND question_id = 'q1'").fetchone()[0]
assert attempt_count == 2, "Repeated answers must append instead of replacing earlier attempts"
expect_integrity_error(
    lambda: db.execute("INSERT INTO question_attempts (id, learning_session_id, user_id, subject_id, question_id, answer_type, score, max_score) VALUES ('a3', 'ls1', 'u1', 'ib-math-aa-sl', 'q1', 'manual_score', 6, 5)"),
    "score cannot exceed maximum score",
)

db.execute("INSERT INTO answer_upload_batches (id, user_id, subject_id, session_type, source_id, upload_code, expires_at) VALUES ('ub1', 'u1', 'ib-math-aa-sl', 'quiz', 'quiz-client-1', 'ABCDEFGH', datetime('now', '+30 minutes'))")
db.execute("INSERT INTO answer_upload_assets (id, batch_id, r2_key, mime_type, size_bytes, sha256) VALUES ('ua1', 'ub1', 'answers/u1/ub1/ua1', 'image/jpeg', 100, 'abc')")
expect_integrity_error(
    lambda: db.execute("INSERT INTO answer_upload_assets (id, batch_id, r2_key, mime_type, size_bytes, sha256) VALUES ('ua2', 'ub1', 'answers/u1/ub1/ua1', 'image/jpeg', 100, 'def')"),
    "R2 object keys must be unique",
)

db.execute("INSERT INTO attempt_mark_point_results (id, attempt_id, mark_point_id, knowledge_point_code, knowledge_point_codes_json, mark_value) VALUES ('mr1', 'a1', 'MP1', 'AA-1.1', '[\"AA-1.1\",\"AA-3.1\"]', 2)")
stored_codes = db.execute("SELECT knowledge_point_codes_json, mark_value FROM attempt_mark_point_results WHERE id = 'mr1'").fetchone()
assert stored_codes == ('[\"AA-1.1\",\"AA-3.1\"]', 2), "Mark-point knowledge-point mappings and weights must persist"

print("IB learning schema validation passed: Mock, append-only attempts, upload batches, R2 asset metadata, and scoring-result constraints.")
