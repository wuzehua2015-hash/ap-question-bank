from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "canonical_source_inventory.json"
VISUAL_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "visual_intake_manifest.json"
OUTPUT_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "structured_transcription_candidates.json"
MARK_CODE = re.compile(r"(?<![A-Z])(?:M|A|R|G)(\d)(?!\d)|(?<![A-Z])AG(?![A-Z])")
PART_PREFIX = re.compile(r"^\s*(?:\d+\.?\s*)?(\([a-hj-uw-z]\))?\s*(\((?:i|ii|iii|iv|v|vi|vii|viii|ix|x)\))?", re.IGNORECASE)
BRACKET_MARK = re.compile(r"\[(\d{1,2})(?:\s+marks?)?\]", re.IGNORECASE)


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalized_line(text: str) -> str:
    return re.sub(r"\s+", " ", text.replace("\u00a0", " ")).strip()


def clip_lines(document: fitz.Document, assets: list[dict]) -> list[dict]:
    rows = []
    for asset in assets:
        page_number = int(asset["source_page"])
        page = document[page_number - 1]
        clip = fitz.Rect(*asset["crop_points"])
        for block in page.get_text("dict", clip=clip, sort=True).get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                text = normalized_line("".join(span.get("text", "") for span in line.get("spans", [])))
                if not text:
                    continue
                x0, y0, x1, y1 = line.get("bbox", (0, 0, 0, 0))
                rows.append({
                    "page": page_number,
                    "bbox": [round(x0, 2), round(y0, 2), round(x1, 2), round(y1, 2)],
                    "text": text,
                })
    return rows


def part_observations(lines: list[dict]) -> list[dict]:
    observations = []
    current_letter = None
    for line in lines:
        match = PART_PREFIX.match(line["text"])
        if not match:
            continue
        letter = match.group(1)
        roman = match.group(2)
        if letter:
            current_letter = letter.strip("()").lower()
        label = None
        if roman and current_letter:
            label = f"{current_letter}.{roman.strip('()').lower()}"
        elif letter:
            label = current_letter
        if label:
            observations.append({"label": label, "page": line["page"], "text": line["text"]})
    unique = []
    seen = set()
    for row in observations:
        if row["label"] not in seen:
            unique.append(row)
            seen.add(row["label"])
    return unique


def mark_observations(lines: list[dict]) -> list[dict]:
    rows = []
    for line in lines:
        for match in BRACKET_MARK.finditer(line["text"]):
            rows.append({"marks": int(match.group(1)), "page": line["page"], "text": line["text"]})
    return rows


def mark_code_observations(lines: list[dict]) -> list[dict]:
    rows = []
    for line in lines:
        if re.match(r"^Note\s*:", line["text"], re.IGNORECASE):
            continue
        codes = [match.group(0) for match in MARK_CODE.finditer(line["text"])]
        if codes:
            rows.append({"codes": codes, "page": line["page"], "text": line["text"]})
    return rows


def build() -> dict:
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    visual_bytes = VISUAL_PATH.read_bytes()
    visual = json.loads(visual_bytes)
    source_root = Path(inventory["source_root"])
    pairs = {pair["base_id"]: pair for pair in inventory["canonical_pairs"]}
    by_pair: dict[str, list[dict]] = {}
    for row in visual["questions"]:
        by_pair.setdefault(row["base_id"], []).append(row)

    candidates = []
    for base_id, questions in by_pair.items():
        pair = pairs[base_id]
        with fitz.open(source_root / pair["paper_path"]) as paper_doc, fitz.open(source_root / pair["markscheme_path"]) as markscheme_doc:
            for row in questions:
                question_lines = clip_lines(paper_doc, row["assets"]["paper"])
                markscheme_lines = clip_lines(markscheme_doc, row["assets"]["markscheme"])
                parts = part_observations(question_lines)
                question_marks = mark_observations(question_lines)
                mark_codes = mark_code_observations(markscheme_lines)
                candidates.append({
                    "subject_id": "ib-math-aa-hl" if row["level"] == "HL" else "ib-math-aa-sl",
                    "question_id": row["question_id"],
                    "source_question_id": row["source_question_id"],
                    "base_id": base_id,
                    "paper": row["paper"],
                    "marks": row["marks"],
                    "question_text_candidate": "\n".join(line["text"] for line in question_lines),
                    "markscheme_text_candidate": "\n".join(line["text"] for line in markscheme_lines),
                    "question_lines": question_lines,
                    "markscheme_lines": markscheme_lines,
                    "part_label_observations": parts,
                    "question_mark_observations": question_marks,
                    "mark_code_observations": mark_codes,
                    "mark_code_counts": dict(sorted(Counter(code for item in mark_codes for code in item["codes"]).items())),
                    "transcription_status": "candidate_requires_visual_review",
                    "part_structure_status": "candidate_requires_visual_review",
                    "mark_point_status": "candidate_requires_visual_review",
                    "knowledge_classification_status": "pending_prompt_and_markscheme_review",
                })
    return {
        "schema_version": 1,
        "source_visual_manifest_sha256": hashlib.sha256(visual_bytes).hexdigest(),
        "question_count": len(candidates),
        "policy": "Extracted text and detected labels are review aids only. The rendered question and markscheme assets remain the source of truth.",
        "questions": sorted(candidates, key=lambda row: (row["subject_id"], row["paper"], row["question_id"])),
    }


def validate() -> None:
    errors = []
    if not OUTPUT_PATH.exists():
        raise SystemExit("Structured candidate output is missing")
    payload = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    visual_hash = file_sha256(VISUAL_PATH)
    if payload.get("source_visual_manifest_sha256") != visual_hash:
        errors.append("structured candidates are stale relative to the visual manifest")
    questions = payload.get("questions", [])
    if payload.get("question_count") != 433 or len(questions) != 433:
        errors.append(f"expected 433 structured candidates, found {len(questions)}")
    ids = set()
    for row in questions:
        key = (row.get("subject_id"), row.get("question_id"))
        if not all(key) or key in ids:
            errors.append(f"missing or duplicate candidate locator {key}")
        ids.add(key)
        if not row.get("question_text_candidate"):
            errors.append(f"{key}: empty question text candidate")
        if not row.get("markscheme_text_candidate"):
            errors.append(f"{key}: empty markscheme text candidate")
        if row.get("transcription_status") != "candidate_requires_visual_review":
            errors.append(f"{key}: extraction must not be marked as verified")
    if errors:
        print(f"Structured candidate validation failed with {len(errors)} error(s):")
        for error in errors[:100]:
            print(f"- {error}")
        raise SystemExit(1)
    print("IB Math AA structured candidate validation passed: 433 review-only candidates; none marked verified.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.check:
        validate()
        return
    payload = build()
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"question_count": payload["question_count"], "output": str(OUTPUT_PATH)}, indent=2))


if __name__ == "__main__":
    main()
