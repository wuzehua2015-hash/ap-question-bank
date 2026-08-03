ALTER TABLE attempt_mark_point_results
  ADD COLUMN knowledge_point_codes_json TEXT NOT NULL DEFAULT '[]'
  CHECK (json_valid(knowledge_point_codes_json));
