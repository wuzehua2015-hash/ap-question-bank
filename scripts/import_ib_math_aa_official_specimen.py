from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from pypdf import PdfReader, PdfWriter


COMPONENTS = [
    ("MathsAA_HL_P1_Specimen_2021", "Higher/Specimen-2021/Paper 1", 3, 18, 19, 34),
    ("MathsAA_HL_P2_Specimen_2021", "Higher/Specimen-2021/Paper 2", 35, 46, 47, 62),
    ("MathsAA_HL_P3_Specimen_2021", "Higher/Specimen-2021/Paper 3", 63, 67, 68, 76),
    ("MathsAA_SL_P1_Specimen_2021", "Standard/Specimen-2021/Paper 1", 77, 88, 89, 99),
    ("MathsAA_SL_P2_Specimen_2021", "Standard/Specimen-2021/Paper 2", 100, 111, 112, 121),
]


def write_range(reader: PdfReader, start: int, end: int, destination: Path) -> None:
    writer = PdfWriter()
    for page_number in range(start - 1, end):
        writer.add_page(reader.pages[page_number])
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("wb") as handle:
        writer.write(handle)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--packet", required=True, type=Path)
    parser.add_argument("--source-root", required=True, type=Path)
    args = parser.parse_args()

    reader = PdfReader(str(args.packet))
    if len(reader.pages) != 121:
        raise SystemExit(f"Expected 121 pages, found {len(reader.pages)}")

    archive_root = args.source_root / "Official-Specimen-First-Assessment-2021"
    archive_root.mkdir(parents=True, exist_ok=True)
    packet_copy = archive_root / "dp-mathematics-analysis-and-approaches-specimen-papers-en.pdf"
    packet_copy.write_bytes(args.packet.read_bytes())

    manifest = {
        "source_id": "IB-MATH-AA-SPECIMEN-FIRST-ASSESSMENT-2021",
        "packet_sha256": sha256(packet_copy),
        "packet_pages": len(reader.pages),
        "public_bank_eligible": False,
        "rights_status": "internal-source-only-pending-explicit-republication-permission",
        "components": [],
    }

    for base_id, folder, paper_start, paper_end, ms_start, ms_end in COMPONENTS:
        target = args.source_root / folder
        paper_path = target / f"{base_id}.pdf"
        markscheme_path = target / f"{base_id}_MS.pdf"
        write_range(reader, paper_start, paper_end, paper_path)
        write_range(reader, ms_start, ms_end, markscheme_path)
        manifest["components"].append(
            {
                "base_id": base_id,
                "paper_path": str(paper_path.relative_to(args.source_root)).replace("\\", "/"),
                "markscheme_path": str(markscheme_path.relative_to(args.source_root)).replace("\\", "/"),
                "paper_pages": paper_end - paper_start + 1,
                "markscheme_pages": ms_end - ms_start + 1,
                "paper_sha256": sha256(paper_path),
                "markscheme_sha256": sha256(markscheme_path),
            }
        )

    (archive_root / "SOURCE_MANIFEST.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False))


if __name__ == "__main__":
    main()
