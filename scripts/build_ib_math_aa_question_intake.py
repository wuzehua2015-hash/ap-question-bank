from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from datetime import date
from pathlib import Path

import fitz
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "canonical_source_inventory.json"
SUMMARY_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "question_intake_summary.json"
QUESTION_HEADER = re.compile(r"(?m)^\s*(\d{1,2})\.\s*\[Maximum marks?:\s*(\d{1,3})\]", re.IGNORECASE)
SPLIT_QUESTION_HEADER = re.compile(r"(?m)^\s*(\d)\s*\n\s*(\d)\.\s*\[Maximum marks?:\s*(\d{1,3})\]", re.IGNORECASE)
MAXIMUM_MARK = re.compile(r"\[Maximum marks?:\s*(\d{1,3})\]", re.IGNORECASE)


def page_texts(path: Path) -> list[str]:
    return [(page.extract_text() or "").replace("\u00a0", " ") for page in PdfReader(str(path), strict=False).pages]


def visual_lines(page: fitz.Page) -> list[tuple[float, float, str]]:
    rows = []
    for block in page.get_text("dict", sort=True).get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            text = "".join(span.get("text", "") for span in spans).replace("\u00a0", " ")
            x0, y0, _, _ = line.get("bbox", (0, 0, 0, 0))
            rows.append((x0, y0, re.sub(r"\s+", " ", text).strip()))
    return rows


def explicit_continuation_pages(path: Path, content_start: int = 1) -> dict[int, list[int]]:
    continuation_pages: dict[int, list[int]] = {}
    with fitz.open(path) as document:
        for page_index in range(content_start, len(document) + 1):
            for _, _, compact in visual_lines(document[page_index - 1]):
                match = re.search(r"\bQuestion\s+(\d{1,2})\s+continued\b", compact, re.IGNORECASE)
                if match:
                    continuation_pages.setdefault(int(match.group(1)), []).append(page_index)
    return continuation_pages


def question_starts(texts: list[str]) -> dict[int, dict]:
    starts: dict[int, dict] = {}
    for page_index, text in enumerate(texts, start=1):
        split_matches = list(SPLIT_QUESTION_HEADER.finditer(text))
        split_spans = [match.span() for match in split_matches]
        for match in split_matches:
            number = int(f"{match.group(1)}{match.group(2)}")
            if number not in starts:
                starts[number] = {"page": page_index, "marks": int(match.group(3))}
        page_matches = list(QUESTION_HEADER.finditer(text))
        for match in page_matches:
            if any(start <= match.start() < end for start, end in split_spans):
                continue
            number = int(match.group(1))
            marks = int(match.group(2))
            if number not in starts:
                starts[number] = {"page": page_index, "marks": marks}
        if not page_matches:
            mark_matches = list(MAXIMUM_MARK.finditer(text))
            if len(mark_matches) == 1:
                inferred_number = max(starts, default=0) + 1
                starts[inferred_number] = {"page": page_index, "marks": int(mark_matches[0].group(1))}
    return starts


def markscheme_ranges(path: Path, question_marks: dict[int, int]) -> tuple[dict[int, dict], list[int]]:
    texts = page_texts(path)
    texts = [
        re.sub(
            r"(?i)Se\s*\n\s*ction",
            "Section",
            re.sub(
                r"(?i)Q(?:ues)?\s*\n\s*(?:uestion|tion)",
                "Question",
                re.sub(r"(?m)^(\d{1,2})\s*\n\s*\.\s*", r"\1. ", text),
            ),
        )
        for text in texts
    ]
    ranges: dict[int, dict] = {}
    instruction_markers = (
        "More than one solution",
        "Presentation of candidate work",
        "Candidates will sometimes use methods other than those in the markscheme",
    )
    content_start = 1
    section_pages = [
        page_index
        for page_index, text in enumerate(texts, start=1)
        if "Section A" in text or "Section B" in text
    ]
    if section_pages:
        content_start = min(section_pages)
    else:
        instruction_pages = [
            page_index
            for page_index, text in enumerate(texts, start=1)
            if any(marker in text for marker in instruction_markers)
        ]
        if instruction_pages:
            content_start = max(instruction_pages) + 1

    starts: dict[int, int] = {}
    continuation_pages = explicit_continuation_pages(path, content_start)
    search_page = content_start
    with fitz.open(path) as document:
        for number in sorted(question_marks):
            header_pattern = re.compile(
                rf"(?:^|Section\s+[AB]\s+|Total\s+\[\d+\s+marks?\]\s+)"
                rf"{number}(?:\s*\.(?:\s+|$)|\s+METHOD\s+|\s+(?=\())",
                re.IGNORECASE,
            )
            named_pattern = re.compile(rf"^\s*Question\s+{number}\b(?!\s+continued)", re.IGNORECASE)
            for page_index in range(search_page, len(document) + 1):
                page = document[page_index - 1]
                found = False
                lines = visual_lines(page)
                for x0, y0, compact in lines:
                    if x0 > 90:
                        continue
                    split_header = (
                        x0 < 60
                        and compact == str(number)
                        and any(abs(other_y - y0) < 2 and re.match(r"^(?:METHOD\b|\(a\))", other_text, re.IGNORECASE) for _, other_y, other_text in lines)
                    )
                    if header_pattern.search(compact) or named_pattern.search(compact) or split_header:
                        found = True
                        break
                if found:
                    starts[number] = page_index
                    search_page = page_index
                    break

    numbers = sorted(starts)
    for number in numbers:
        detected_end = end_page(numbers, starts, number, len(texts))
        explicit_continuations = continuation_pages.get(number, [])
        if explicit_continuations:
            detected_end = max(detected_end, max(explicit_continuations))
        ranges[number] = {
            "start": starts[number],
            "end": detected_end,
            "confidence": "question_header_and_continuations_confirmed" if explicit_continuations else "question_header_confirmed",
        }
    return ranges, sorted(set(question_marks) - set(starts))


def end_page(numbers: list[int], starts: dict[int, int], number: int, last_page: int) -> int:
    position = numbers.index(number)
    if position == len(numbers) - 1:
        return last_page
    next_start = starts[numbers[position + 1]]
    return max(starts[number], next_start - 1)


def build() -> tuple[dict, dict]:
    inventory_bytes = INVENTORY_PATH.read_bytes()
    inventory_sha256 = hashlib.sha256(inventory_bytes).hexdigest()
    inventory = json.loads(inventory_bytes)
    source_root = Path(inventory["source_root"])
    questions: list[dict] = []
    issues: list[str] = []

    for pair in inventory.get("canonical_pairs", []):
        paper_file = source_root / pair["paper_path"]
        markscheme_file = source_root / pair["markscheme_path"]
        paper_text = page_texts(paper_file)
        markscheme_text = page_texts(markscheme_file)
        paper_continuations = explicit_continuation_pages(paper_file)
        starts = question_starts(paper_text)
        numbers = sorted(starts)
        if not numbers:
            issues.append(f"{pair['base_id']}: no question headers detected in the paper")
            continue
        expected_numbers = list(range(1, max(numbers) + 1))
        if numbers != expected_numbers:
            issues.append(f"{pair['base_id']}: non-contiguous question numbers {numbers}")
        paper_pages = {number: starts[number]["page"] for number in numbers}
        ms_ranges, missing_ms = markscheme_ranges(markscheme_file, {number: starts[number]["marks"] for number in numbers})
        if missing_ms:
            issues.append(f"{pair['base_id']}: markscheme start pages missing for questions {missing_ms}")

        for number in numbers:
            marks = starts[number]["marks"]
            if pair["paper"] == "P3":
                structural_role = "continuous_investigation"
            elif marks >= 13:
                structural_role = "extended_response"
            else:
                structural_role = "short_response"
            ms_range = ms_ranges.get(number)
            questions.append(
                {
                    "source_question_id": f"{pair['base_id']}:Q{number}",
                    "base_id": pair["base_id"],
                    "level": pair["level"],
                    "session": pair["session"],
                    "paper": pair["paper"],
                    "timezone": pair["timezone"],
                    "question_number": number,
                    "marks": marks,
                    "calculator_allowed": pair["calculator_allowed"],
                    "structural_role": structural_role,
                    "paper_page_start": paper_pages[number],
                    "paper_page_end": max(
                        end_page(numbers, paper_pages, number, len(paper_text)),
                        max(paper_continuations.get(number, [paper_pages[number]])),
                    ),
                    "markscheme_page_start": ms_range["start"] if ms_range else None,
                    "markscheme_page_end": ms_range["end"] if ms_range else None,
                    "markscheme_range_confidence": ms_range["confidence"] if ms_range else "missing",
                    "paper_sha256": pair["paper_sha256"],
                    "markscheme_sha256": pair["markscheme_sha256"],
                    "authenticity_status": "verified_real_source",
                    "rights_status": pair["rights_status"],
                    "student_use_status": pair["student_use_status"],
                    "permission_basis": pair["permission_basis"],
                    "approved_by": pair["approved_by"],
                    "approved_at": pair["approved_at"],
                    "extraction_status": "pending_visual_transcription",
                    "classification_status": "pending_prompt_and_markscheme_review",
                    "scoring_status": "pending_mark_point_transcription",
                }
            )

    counts = Counter((row["level"], row["paper"], row["structural_role"]) for row in questions)
    full_manifest = {
        "schema_version": 1,
        "generated_at": date.today().isoformat(),
        "source_inventory": str(INVENTORY_PATH),
        "source_inventory_sha256": inventory_sha256,
        "question_count": len(questions),
        "issues": issues,
        "questions": questions,
    }
    summary = {
        "schema_version": 1,
        "generated_at": date.today().isoformat(),
        "source_inventory_sha256": inventory_sha256,
        "source_pair_count": len(inventory.get("canonical_pairs", [])),
        "detected_question_count": len(questions),
        "detection_issue_count": len(issues),
        "counts": [
            {"level": key[0], "paper": key[1], "structural_role": key[2], "count": count}
            for key, count in sorted(counts.items())
        ],
        "student_visible_question_count": 0,
        "status": "approved_source_intake_pending_visual_transcription",
    }
    return full_manifest, summary


def validate_existing(intake_path: Path) -> None:
    errors: list[str] = []
    if not intake_path.exists():
        errors.append(f"Internal intake manifest is missing: {intake_path}")
    if not SUMMARY_PATH.exists():
        errors.append(f"Question-intake summary is missing: {SUMMARY_PATH}")
    if errors:
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    inventory_bytes = INVENTORY_PATH.read_bytes()
    inventory_hash = hashlib.sha256(inventory_bytes).hexdigest()
    inventory = json.loads(inventory_bytes)
    source_root = Path(inventory["source_root"])
    manifest = json.loads(intake_path.read_text(encoding="utf-8"))
    summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))
    pairs = {pair["base_id"]: pair for pair in inventory.get("canonical_pairs", [])}
    questions = manifest.get("questions", [])

    if manifest.get("source_inventory_sha256") != inventory_hash:
        errors.append("Internal intake manifest is stale relative to the canonical source inventory")
    if summary.get("source_inventory_sha256") != inventory_hash:
        errors.append("Question-intake summary is stale relative to the canonical source inventory")
    if manifest.get("issues"):
        errors.extend(manifest["issues"])
    if manifest.get("question_count") != len(questions):
        errors.append("Manifest question_count does not match its question rows")
    if summary.get("detected_question_count") != len(questions):
        errors.append("Summary detected_question_count does not match the intake manifest")
    if summary.get("detection_issue_count") != 0:
        errors.append("Question-intake summary still reports detection issues")
    if summary.get("student_visible_question_count") != 0:
        errors.append("Internal intake metadata must not claim student-visible questions")
    if summary.get("source_pair_count") != len(pairs):
        errors.append("Summary source-pair count does not match the canonical inventory")

    ids: set[str] = set()
    represented_pairs: set[str] = set()
    questions_by_pair: dict[str, list[dict]] = {}
    for row in questions:
        locator = row.get("source_question_id")
        if not locator or locator in ids:
            errors.append(f"Missing or duplicate source question locator: {locator}")
        ids.add(locator)
        base_id = row.get("base_id")
        pair = pairs.get(base_id)
        if not pair:
            errors.append(f"{locator}: unknown source pair {base_id}")
            continue
        represented_pairs.add(base_id)
        questions_by_pair.setdefault(base_id, []).append(row)
        if row.get("paper_sha256") != pair.get("paper_sha256"):
            errors.append(f"{locator}: paper fingerprint mismatch")
        if row.get("markscheme_sha256") != pair.get("markscheme_sha256"):
            errors.append(f"{locator}: markscheme fingerprint mismatch")
        for field in ["question_number", "marks", "paper_page_start", "paper_page_end", "markscheme_page_start", "markscheme_page_end"]:
            if row.get(field) in (None, ""):
                errors.append(f"{locator}: missing {field}")
        if row.get("authenticity_status") != "verified_real_source":
            errors.append(f"{locator}: invalid authenticity status")
        if row.get("rights_status") != "licensed_permission":
            errors.append(f"{locator}: unexpected rights status")
        if row.get("student_use_status") != "approved_for_structured_student_use":
            errors.append(f"{locator}: unexpected student-use status")
        if row.get("permission_basis") != "user_confirmed_organization_authorization":
            errors.append(f"{locator}: unexpected permission basis")
        for start_field, end_field in [
            ("paper_page_start", "paper_page_end"),
            ("markscheme_page_start", "markscheme_page_end"),
        ]:
            if isinstance(row.get(start_field), int) and isinstance(row.get(end_field), int) and row[start_field] > row[end_field]:
                errors.append(f"{locator}: {start_field} is after {end_field}")
    if represented_pairs != set(pairs):
        missing_pairs = sorted(set(pairs) - represented_pairs)
        errors.append(f"Canonical source pairs without question locators: {missing_pairs}")

    for base_id, rows in questions_by_pair.items():
        pair = pairs[base_id]
        ordered = sorted(rows, key=lambda row: row["question_number"])
        numbers = [row["question_number"] for row in ordered]
        if numbers != list(range(1, len(numbers) + 1)):
            errors.append(f"{base_id}: question numbers are not contiguous from 1")
        target_marks = 55 if pair["paper"] == "P3" else 110 if pair["level"] == "HL" else 80
        total_marks = sum(int(row["marks"]) for row in ordered)
        if total_marks != target_marks:
            errors.append(f"{base_id}: detected question marks total {total_marks}, expected {target_marks}")
        for row in ordered:
            expected_role = "continuous_investigation" if pair["paper"] == "P3" else "extended_response" if row["marks"] >= 13 else "short_response"
            if row.get("structural_role") != expected_role:
                errors.append(f"{row['source_question_id']}: structural role does not match Paper and marks")
        continuation_pages = explicit_continuation_pages(source_root / pair["markscheme_path"])
        paper_continuation_pages = explicit_continuation_pages(source_root / pair["paper_path"])
        for row in ordered:
            explicit_pages = continuation_pages.get(int(row["question_number"]), [])
            if explicit_pages and int(row["markscheme_page_end"]) < max(explicit_pages):
                errors.append(
                    f"{row['source_question_id']}: markscheme range ends on page {row['markscheme_page_end']} "
                    f"before explicit continuation page {max(explicit_pages)}"
                )
            explicit_paper_pages = paper_continuation_pages.get(int(row["question_number"]), [])
            if explicit_paper_pages and int(row["paper_page_end"]) < max(explicit_paper_pages):
                errors.append(
                    f"{row['source_question_id']}: paper range ends on page {row['paper_page_end']} "
                    f"before explicit continuation page {max(explicit_paper_pages)}"
                )

    expected_counts = Counter((row["level"], row["paper"], row["structural_role"]) for row in questions)
    summary_counts = {
        (row.get("level"), row.get("paper"), row.get("structural_role")): row.get("count")
        for row in summary.get("counts", [])
    }
    if dict(expected_counts) != summary_counts:
        errors.append("Question-intake summary counts do not match the manifest")

    if errors:
        print(f"IB Math AA question-intake check failed: {len(errors)} error(s)")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print(f"IB Math AA question-intake check passed: {len(questions)} real-source question locators across {len(pairs)} pairs.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    source_root = Path(json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))["source_root"])
    intake_path = source_root.parent.parent / "02-data" / "real_exam_intake" / "question_intake_manifest.json"
    if args.check:
        validate_existing(intake_path)
        return

    manifest, summary = build()
    manifest_text = json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    summary_text = json.dumps(summary, ensure_ascii=False, indent=2) + "\n"

    intake_path.parent.mkdir(parents=True, exist_ok=True)
    intake_path.write_text(manifest_text, encoding="utf-8")
    SUMMARY_PATH.write_text(summary_text, encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if manifest["issues"]:
        print("Detection issues:")
        for issue in manifest["issues"]:
            print(f"- {issue}")


if __name__ == "__main__":
    main()
