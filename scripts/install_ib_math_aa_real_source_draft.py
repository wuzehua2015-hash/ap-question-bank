from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DRAFT_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "real_source_draft_bank.json"
SL_PATH = ROOT / "public" / "data" / "ib" / "math-aa-sl" / "paper_bank.json"
HL_PATH = ROOT / "public" / "data" / "ib" / "math-aa-hl" / "paper_bank.json"
LEDGER_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "item_classification_ledger.json"


def main() -> None:
    items = json.loads(DRAFT_PATH.read_text(encoding="utf-8"))
    if len(items) != 433:
        raise SystemExit(f"Expected 433 real-source draft items, found {len(items)}")
    if any(item.get("student_visible") is not False or item.get("publish_status") != "blocked" for item in items):
        raise SystemExit("Every installed draft item must remain blocked and non-visible")
    if any(item.get("source", {}).get("rights_status") != "licensed_permission" for item in items):
        raise SystemExit("Every installed draft item must carry the approved source status")
    sl = [item for item in items if item["level"] == "SL"]
    hl = [item for item in items if item["level"] == "HL"]
    if len(sl) != 162 or len(hl) != 271:
        raise SystemExit(f"Unexpected level split: SL={len(sl)}, HL={len(hl)}")
    SL_PATH.write_text(json.dumps(sl, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    HL_PATH.write_text(json.dumps(hl, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    LEDGER_PATH.write_text(json.dumps({
        "schema_version": 4,
        "review_standard": "Real-source questions enter this ledger only after prompt, all subparts, markscheme path and knowledge points are visually reviewed.",
        "item_count": 0,
        "items": [],
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"sl_real_source_drafts": len(sl), "hl_real_source_drafts": len(hl), "generated_items_remaining": 0}, indent=2))


if __name__ == "__main__":
    main()
