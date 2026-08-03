from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "canonical_source_inventory.json"
VISUAL_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "visual_intake_manifest.json"
REGISTRY_PATH = ROOT / "public" / "data" / "question_source_registry.json"
PREFIX = "IB-MATH-AA-MathsAA_"


def main() -> None:
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    visual = json.loads(VISUAL_PATH.read_text(encoding="utf-8"))
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    question_keys: dict[str, list[str]] = defaultdict(list)
    for row in visual.get("questions", []):
        subject_id = "ib-math-aa-hl" if row["level"] == "HL" else "ib-math-aa-sl"
        question_keys[row["base_id"]].append(f"{subject_id}::{row['question_id']}")

    retained = [source for source in registry.get("sources", []) if not source.get("registry_id", "").startswith(PREFIX)]
    generated = []
    for pair in inventory.get("canonical_pairs", []):
        base_id = pair["base_id"]
        generated.append({
            "registry_id": f"IB-MATH-AA-{base_id}",
            "source_kind": pair["source_kind"],
            "source_title": f"IB Mathematics: Analysis and Approaches {pair['level']} {pair['session']} {pair['paper']} {pair['timezone']}",
            "exam_locator": {
                "curriculum": "ib",
                "course": "math-aa",
                "level": pair["level"],
                "session": pair["session"],
                "paper": pair["paper"],
                "timezone": pair["timezone"],
            },
            "question_file_path": pair["paper_path"],
            "answer_file_path": pair["markscheme_path"],
            "question_file_sha256": pair["paper_sha256"],
            "answer_file_sha256": pair["markscheme_sha256"],
            "rights_status": pair["rights_status"],
            "verification_status": pair["authenticity_status"],
            "student_use_status": pair["student_use_status"],
            "permission_basis": pair["permission_basis"],
            "approved_by": pair["approved_by"],
            "approved_at": pair["approved_at"],
            "question_keys": sorted(question_keys.get(base_id, [])),
            "notes": "Exact local paper and paired markscheme approved through the recorded user-confirmed organization authorization. Question content must still pass visual transcription and item-level release checks.",
        })
    registry["sources"] = retained + generated
    REGISTRY_PATH.write_text(json.dumps(registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"retained_sources": len(retained), "generated_ib_sources": len(generated), "registered_question_keys": sum(len(row["question_keys"]) for row in generated)}, indent=2))


if __name__ == "__main__":
    main()
