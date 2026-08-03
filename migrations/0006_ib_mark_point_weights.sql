ALTER TABLE attempt_mark_point_results
  ADD COLUMN mark_value REAL NOT NULL DEFAULT 1 CHECK (mark_value >= 0);
