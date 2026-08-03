#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data" / "ib" / "math-aa"
CANDIDATES = DATA / "structured_transcription_candidates.json"
VISUAL = DATA / "visual_intake_manifest.json"
QUEUE = DATA / "manual_review_queue.json"
RECORDS = DATA / "manual_review_records.json"
BATCH_SIZE = 10


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def stable_hash(value) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def build_queue():
    candidate_doc = read_json(CANDIDATES)
    visual_doc = read_json(VISUAL)
    visual_by_key = {
        f"ib-math-aa-{row['level'].lower()}::{row['question_id']}": row
        for row in visual_doc["questions"]
    }
    rows = []
    for ordinal, candidate in enumerate(candidate_doc["questions"], start=1):
        review_key = f"{candidate['subject_id']}::{candidate['question_id']}"
        visual = visual_by_key.get(review_key)
        if not visual:
            raise ValueError(f"missing visual row for {review_key}")
        candidate_basis = {
            "question_text_candidate": candidate["question_text_candidate"],
            "markscheme_text_candidate": candidate["markscheme_text_candidate"],
            "part_label_observations": candidate["part_label_observations"],
            "question_mark_observations": candidate["question_mark_observations"],
            "mark_code_observations": candidate["mark_code_observations"],
            "paper_sha256": visual["paper_sha256"],
            "markscheme_sha256": visual["markscheme_sha256"],
            "assets": visual["assets"],
        }
        rows.append({
            "review_key": review_key,
            "ordinal": ordinal,
            "batch": ((ordinal - 1) // BATCH_SIZE) + 1,
            "subject_id": candidate["subject_id"],
            "question_id": candidate["question_id"],
            "source_question_id": candidate["source_question_id"],
            "level": visual["level"],
            "session": visual["session"],
            "timezone": visual["timezone"],
            "paper": visual["paper"],
            "question_number": visual["question_number"],
            "marks": visual["marks"],
            "structural_role": visual["structural_role"],
            "candidate_sha256": stable_hash(candidate_basis),
            "question_text_candidate": candidate["question_text_candidate"],
            "markscheme_text_candidate": candidate["markscheme_text_candidate"],
            "part_label_observations": candidate["part_label_observations"],
            "question_mark_observations": candidate["question_mark_observations"],
            "mark_code_observations": candidate["mark_code_observations"],
            "mark_code_counts": candidate["mark_code_counts"],
            "paper_sha256": visual["paper_sha256"],
            "markscheme_sha256": visual["markscheme_sha256"],
            "paper_assets": visual["assets"]["paper"],
            "markscheme_assets": visual["assets"]["markscheme"],
            "review_status": "pending_rendered_visual_review",
        })
    return {
        "schema_version": 1,
        "policy": "Queue rows are review inputs only. They cannot approve transcription, scoring or knowledge classification.",
        "batch_size": BATCH_SIZE,
        "question_count": len(rows),
        "batch_count": (len(rows) + BATCH_SIZE - 1) // BATCH_SIZE,
        "questions": rows,
    }


def validate_records(queue_doc, records_doc):
    queue_by_key = {row["review_key"]: row for row in queue_doc["questions"]}
    seen = set()
    allowed_codes = {
        point["code"]
        for topic in read_json(DATA / "knowledge_tree.json")["topic_areas"]
        for item in topic["syllabus_items"]
        for point in item["knowledge_points"]
    }
    for record in records_doc.get("records", []):
        key = record.get("review_key")
        if not key or key in seen or key not in queue_by_key:
            raise ValueError(f"invalid or duplicate manual review key: {key}")
        seen.add(key)
        queued = queue_by_key[key]
        if record.get("subject_id") != queued["subject_id"] or record.get("question_id") != queued["question_id"]:
            raise ValueError(f"composite locator mismatch: {key}")
        if record.get("candidate_sha256") != queued["candidate_sha256"]:
            raise ValueError(f"stale review candidate: {key}")
        disposition = record.get("approval_status")
        if disposition not in {"source_located", "excluded_exact_duplicate"}:
            raise ValueError(f"invalid manual review disposition: {key}")
        if record.get("review_method") != "rendered_question_and_markscheme_visual_review":
            raise ValueError(f"invalid review method: {key}")
        checks = record.get("visual_checks") or {}
        required_checks = [
            "question_crop_complete", "markscheme_crop_complete", "all_subparts_present",
            "all_marks_verified", "formulae_and_figures_verified", "mark_points_verified",
        ]
        if any(checks.get(name) is not True for name in required_checks):
            raise ValueError(f"incomplete visual checks: {key}")
        if disposition == "excluded_exact_duplicate":
            duplicate_of = record.get("duplicate_of")
            if not duplicate_of or duplicate_of == key or duplicate_of not in seen:
                raise ValueError(f"invalid exact-duplicate reference: {key}")
            continue
        parts = record.get("parts") or []
        mark_points = record.get("mark_points") or []
        if not parts or not mark_points:
            raise ValueError(f"missing parts or mark points: {key}")
        if sum(int(part.get("marks", 0)) for part in parts) != queued["marks"]:
            raise ValueError(f"part marks do not total question marks: {key}")
        if sum(int(point.get("marks", 0)) for point in mark_points) != queued["marks"]:
            raise ValueError(f"mark points do not total question marks: {key}")
        part_labels = {part.get("label") for part in parts}
        if None in part_labels or len(part_labels) != len(parts):
            raise ValueError(f"invalid part labels: {key}")
        mark_ids = {point.get("id") for point in mark_points}
        if None in mark_ids or len(mark_ids) != len(mark_points):
            raise ValueError(f"invalid mark point ids: {key}")
        if any(point.get("part_label") not in part_labels for point in mark_points):
            raise ValueError(f"mark point references unknown part: {key}")
        primary = record.get("primary_knowledge_point")
        required = record.get("required_knowledge_points") or []
        if primary not in allowed_codes or not required or primary not in required:
            raise ValueError(f"invalid primary/required knowledge points: {key}")
        if any(code not in allowed_codes for code in required):
            raise ValueError(f"unknown official knowledge point: {key}")
        if any(
            not point.get("knowledge_point_codes")
            or any(code not in allowed_codes for code in point["knowledge_point_codes"])
            for point in mark_points
        ):
            raise ValueError(f"mark point lacks valid knowledge mapping: {key}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    built = build_queue()
    if args.check:
        existing = read_json(QUEUE)
        if existing != built:
            raise SystemExit("manual review queue is stale; run the builder")
    else:
        QUEUE.write_text(json.dumps(built, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if not RECORDS.exists():
            RECORDS.write_text(json.dumps({
                "schema_version": 1,
                "policy": "Only completed rendered visual reviews belong here.",
                "records": [],
            }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    validate_records(built, read_json(RECORDS))
    records = read_json(RECORDS).get('records', [])
    source_located = sum(1 for record in records if record.get('approval_status') == 'source_located')
    excluded = sum(1 for record in records if record.get('approval_status') == 'excluded_exact_duplicate')
    print(f"IB Math AA manual review queue passed: {built['question_count']} questions / {built['batch_count']} batches; source located {source_located}; exact duplicates excluded {excluded}; adjudicated {len(records)}.")


if __name__ == "__main__":
    main()
