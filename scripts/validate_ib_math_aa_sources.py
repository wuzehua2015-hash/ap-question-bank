from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from pypdf import PdfReader

try:
    import fitz
except ImportError:
    fitz = None


ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "canonical_source_inventory.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def render_probe(path: Path, page_count: int, workdir: Path) -> list[str]:
    errors: list[str] = []
    executable = shutil.which("pdftoppm")
    pages = sorted({1, max(1, page_count // 2), page_count})
    if not executable and fitz is None:
        return ["Neither pdftoppm nor PyMuPDF is available; source render probes cannot run"]
    if not executable:
        try:
            document = fitz.open(path)
            for page_number in pages:
                page = document.load_page(page_number - 1)
                pixmap = page.get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
                image_path = workdir / f"{path.stem}-{page_number}.png"
                pixmap.save(image_path)
                if not image_path.exists() or image_path.stat().st_size == 0:
                    errors.append(f"{path}: page {page_number} produced an empty render")
            document.close()
        except Exception as error:
            errors.append(f"{path}: PyMuPDF render probe failed: {error}")
        return errors
    for page_number in pages:
        prefix = workdir / f"{path.stem}-{page_number}"
        result = subprocess.run(
            [
                executable,
                "-f",
                str(page_number),
                "-l",
                str(page_number),
                "-singlefile",
                "-png",
                "-r",
                "72",
                str(path),
                str(prefix),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        image_path = prefix.with_suffix(".png")
        if result.returncode != 0 or not image_path.exists() or image_path.stat().st_size == 0:
            errors.append(f"{path}: page {page_number} failed to render: {result.stderr.strip()}")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--render-probes", action="store_true")
    args = parser.parse_args()

    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    source_root = Path(inventory["source_root"])
    pairs = inventory.get("canonical_pairs", [])
    errors: list[str] = []
    paper_hashes: dict[str, str] = {}
    markscheme_hashes: dict[str, str] = {}
    locators: set[tuple[str, str, str, str]] = set()

    if len(pairs) != inventory.get("summary", {}).get("canonical_pairs"):
        errors.append("Canonical pair count does not match the inventory summary")

    with tempfile.TemporaryDirectory(prefix="ib-math-aa-source-probes-") as temp_dir:
        render_root = Path(temp_dir)
        for pair in pairs:
            base_id = pair.get("base_id", "(missing base_id)")
            locator = (pair.get("level"), pair.get("session"), pair.get("paper"), pair.get("timezone"))
            if locator in locators:
                errors.append(f"{base_id}: duplicate level/session/Paper/timezone locator {locator}")
            locators.add(locator)

            for key in [
                "paper_path",
                "markscheme_path",
                "paper_sha256",
                "markscheme_sha256",
                "paper_size_bytes",
                "markscheme_size_bytes",
                "paper_page_count",
                "markscheme_page_count",
                "source_kind",
                "authenticity_status",
                "rights_status",
                "student_use_status",
                "permission_basis",
                "approved_by",
                "approved_at",
            ]:
                if pair.get(key) in (None, ""):
                    errors.append(f"{base_id}: missing {key}")

            if pair.get("authenticity_status") != "verified_real_source":
                errors.append(f"{base_id}: authenticity status is not verified_real_source")
            if pair.get("rights_status") != "licensed_permission":
                errors.append(f"{base_id}: source rights status is not licensed_permission")
            if pair.get("student_use_status") != "approved_for_structured_student_use":
                errors.append(f"{base_id}: unexpected student-use status")
            if pair.get("permission_basis") != "user_confirmed_organization_authorization":
                errors.append(f"{base_id}: permission basis is not the user-confirmed organization authorization")
            if pair.get("paper") == "P1" and pair.get("calculator_allowed") is not False:
                errors.append(f"{base_id}: P1 calculator rule must be false")
            if pair.get("paper") in {"P2", "P3"} and pair.get("calculator_allowed") is not True:
                errors.append(f"{base_id}: {pair.get('paper')} calculator rule must be true")

            for kind in ["paper", "markscheme"]:
                file_path = source_root / pair.get(f"{kind}_path", "")
                if not file_path.is_file():
                    errors.append(f"{base_id}: missing {kind} file {file_path}")
                    continue
                actual_hash = sha256(file_path)
                actual_size = file_path.stat().st_size
                try:
                    actual_pages = len(PdfReader(str(file_path), strict=False).pages)
                except Exception as error:
                    errors.append(f"{base_id}: cannot read {kind} PDF: {error}")
                    continue
                if actual_hash != pair.get(f"{kind}_sha256"):
                    errors.append(f"{base_id}: {kind} SHA-256 mismatch")
                if actual_size != pair.get(f"{kind}_size_bytes"):
                    errors.append(f"{base_id}: {kind} byte-size mismatch")
                if actual_pages != pair.get(f"{kind}_page_count"):
                    errors.append(f"{base_id}: {kind} page-count mismatch")
                hash_owners = paper_hashes if kind == "paper" else markscheme_hashes
                if actual_hash in hash_owners:
                    errors.append(f"{base_id}: duplicate {kind} file content with {hash_owners[actual_hash]}")
                hash_owners[actual_hash] = base_id
                if args.render_probes:
                    errors.extend(render_probe(file_path, actual_pages, render_root))

    expected_summary = {
        "sl_pairs": sum(1 for pair in pairs if pair.get("level") == "SL"),
        "hl_pairs": sum(1 for pair in pairs if pair.get("level") == "HL"),
    }
    for key, count in expected_summary.items():
        if inventory.get("summary", {}).get(key) != count:
            errors.append(f"Summary {key} does not match the pair list")

    if errors:
        print(f"IB Math AA source validation failed: {len(errors)} error(s)")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    mode = "with PDF render probes" if args.render_probes else "metadata and file integrity"
    print(f"IB Math AA source validation passed: {len(pairs)} exact paper/markscheme pairs; {mode} verified.")


if __name__ == "__main__":
    main()
