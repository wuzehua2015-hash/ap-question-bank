from __future__ import annotations

import hashlib
import json
import re
from collections import defaultdict
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT.parents[1] / "subjects" / "IB" / "Group-5-Mathematics" / "01-exams" / "Maths AA"
OUT_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "canonical_source_inventory.json"


def parse_file(path: Path) -> dict:
    rel = path.relative_to(SOURCE_ROOT).as_posix()
    parts = rel.split("/")
    name = path.name
    level = "HL" if parts[0] == "Higher" else "SL" if parts[0] == "Standard" else parts[0]
    session = parts[1] if len(parts) > 1 else ""
    kind_dir = parts[2] if len(parts) > 2 else ""
    kind = "markscheme" if kind_dir == "Markscheme" or "_MS" in name else "paper" if "Paper" in kind_dir else "other"
    paper_match = re.search(r"_P([123])_", name)
    paper = f"P{paper_match.group(1)}" if paper_match else ""
    timezone_match = re.search(r"_TZ([12])", name)
    timezone = f"TZ{timezone_match.group(1)}" if timezone_match else "TZ0"
    base = re.sub(r"_MS(?=(_\d+)*\.pdf$)", "", name)
    base = re.sub(r"(_\d+)+(?=\.pdf$)", "", base)
    base = base.removesuffix(".pdf")
    sha = hashlib.sha256(path.read_bytes()).hexdigest()
    try:
        pages = len(PdfReader(str(path), strict=False).pages)
    except Exception:
        pages = None
    return {
        "base_id": base,
        "relative_path": rel,
        "level": level,
        "session": session,
        "paper": paper,
        "timezone": timezone,
        "kind": kind,
        "size_bytes": path.stat().st_size,
        "sha256": sha,
        "page_count": pages,
    }


def choose_canonical(records: list[dict]) -> tuple[dict | None, list[dict]]:
    if not records:
        return None, []
    # Prefer the larger file when duplicate naming exists; the smaller _2 copies in this source set
    # are often compressed alternates and must remain recorded as deferred duplicates.
    ordered = sorted(records, key=lambda item: (item["size_bytes"], item["relative_path"]), reverse=True)
    return ordered[0], ordered[1:]


def main() -> None:
    files = [parse_file(path) for path in SOURCE_ROOT.rglob("*.pdf")]
    by_base: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    for item in files:
        by_base[item["base_id"]][item["kind"]].append(item)

    canonical_pairs = []
    deferred = []
    for base_id, grouped in sorted(by_base.items()):
        paper, paper_dupes = choose_canonical(grouped.get("paper", []))
        markscheme, ms_dupes = choose_canonical(grouped.get("markscheme", []))
        for dupe in [*paper_dupes, *ms_dupes]:
            deferred.append({
                "base_id": base_id,
                "relative_path": dupe["relative_path"],
                "reason": "duplicate_noncanonical_copy",
            })
        if paper and markscheme:
            canonical_pairs.append({
                "base_id": base_id,
                "level": paper["level"],
                "session": paper["session"],
                "paper": paper["paper"],
                "timezone": paper["timezone"],
                "calculator_allowed": False if paper["paper"] == "P1" else True if paper["paper"] == "P2" else None,
                "syllabus_version": "first-assessment-2021",
                "paper_path": paper["relative_path"],
                "markscheme_path": markscheme["relative_path"],
                "paper_page_count": paper["page_count"],
                "markscheme_page_count": markscheme["page_count"],
                "source_status": "source_approved_for_structured_extraction",
            })
        elif paper:
            deferred.append({
                "base_id": base_id,
                "relative_path": paper["relative_path"],
                "reason": "missing_matched_markscheme",
            })
        elif markscheme:
            deferred.append({
                "base_id": base_id,
                "relative_path": markscheme["relative_path"],
                "reason": "missing_matched_paper",
            })

    payload = {
        "curriculum": "ib",
        "course": "math-aa",
        "generated_at": "2026-07-24",
        "source_root": SOURCE_ROOT.as_posix(),
        "canonical_pairs": canonical_pairs,
        "deferred": deferred,
        "summary": {
            "pdf_files": len(files),
            "canonical_pairs": len(canonical_pairs),
            "deferred_records": len(deferred),
            "sl_pairs": sum(1 for item in canonical_pairs if item["level"] == "SL"),
            "hl_pairs": sum(1 for item in canonical_pairs if item["level"] == "HL"),
        },
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(payload["summary"], indent=2))


if __name__ == "__main__":
    main()
