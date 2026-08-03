from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
from collections import defaultdict
from datetime import date
from pathlib import Path

import fitz
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
INVENTORY_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "canonical_source_inventory.json"
INTAKE_PATH = ROOT.parents[1] / "subjects" / "IB" / "Group-5-Mathematics" / "02-data" / "real_exam_intake" / "question_intake_manifest.json"
OUTPUT_ROOT = ROOT / "public" / "data" / "ib" / "math-aa" / "real-source-assets"
MANIFEST_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "visual_intake_manifest.json"
DRAFT_PATH = ROOT / "public" / "data" / "ib" / "math-aa" / "real_source_draft_bank.json"
QA_ROOT = ROOT / "tmp" / "pdfs" / "ib-math-aa-visual-intake"
REUSE_ASSETS: dict[str, dict] = {}

HEADER_RE = re.compile(r"(?m)^\s*(\d{1,2})\.?\s*\n?\s*\[Maximum marks?:\s*(\d{1,3})\]", re.IGNORECASE)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_slug(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-").lower()


def page_blocks(page: fitz.Page) -> list[dict]:
    rows = []
    for block in page.get_text("blocks", sort=True):
        x0, y0, x1, y1, text, *_ = block
        rows.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "text": text.replace("\u00a0", " ")})
    return rows


def page_lines(page: fitz.Page) -> list[dict]:
    rows = []
    for block in page.get_text("dict", sort=True).get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            text = "".join(span.get("text", "") for span in spans).replace("\u00a0", " ")
            x0, y0, x1, y1 = line.get("bbox", (0, 0, 0, 0))
            rows.append({"x0": x0, "y0": y0, "x1": x1, "y1": y1, "text": text})
    return rows


def paper_anchor(page: fitz.Page, question_number: int, marks: int) -> tuple[float, str]:
    blocks = page_blocks(page)
    for block in blocks:
        match = HEADER_RE.search(block["text"])
        if match and int(match.group(1)) == question_number and int(match.group(2)) == marks:
            return max(38.0, block["y0"] - 8), "exact_header_block"
    mark_token = re.compile(rf"\[Maximum marks?:\s*{marks}\]", re.IGNORECASE)
    candidates = [block for block in blocks if mark_token.search(block["text"])]
    if len(candidates) == 1:
        candidate = candidates[0]
        nearby = [block["y0"] for block in blocks if block["y1"] >= candidate["y0"] - 12 and re.search(rf"(^|\s){question_number}\.?($|\s)", block["text"])]
        return max(38.0, min([candidate["y0"], *nearby]) - 8), "mark_header_with_nearby_number"
    return 42.0, "page_top_fallback"


def markscheme_anchor(page: fitz.Page, question_number: int) -> tuple[float, str]:
    lines = page_lines(page)
    patterns = [
        re.compile(
            rf"(?:^|Section\s+[AB]\s+|Total\s+\[\d+\s+marks?\]\s+)"
            rf"{question_number}(?:\s*\.(?:\s+|$)|\s+METHOD\s+|\s+(?=\())",
            re.IGNORECASE,
        ),
        re.compile(rf"^\s*Question\s+{question_number}\b(?!\s+continued)", re.IGNORECASE),
    ]
    for line in lines:
        if line["x0"] > 90:
            continue
        compact = re.sub(r"\s+", " ", line["text"]).strip()
        split_header = (
            line["x0"] < 60
            and compact == str(question_number)
            and any(
                abs(other["y0"] - line["y0"]) < 2
                and re.match(r"^(?:METHOD\b|\(a\))", re.sub(r"\s+", " ", other["text"]).strip(), re.IGNORECASE)
                for other in lines
            )
        )
        if any(pattern.search(compact) for pattern in patterns) or split_header:
            return max(38.0, line["y0"] - 8), "question_header_line"
    return 42.0, "page_top_fallback"


def render_clip(page: fitz.Page, clip: fitz.Rect, output: Path, dpi: int, quality: int) -> dict:
    clip &= page.rect
    if clip.width < 100 or clip.height < 18:
        raise ValueError(f"invalid clip {clip}")
    relative_path = output.relative_to(ROOT / "public").as_posix()
    crop_points = [round(clip.x0, 2), round(clip.y0, 2), round(clip.x1, 2), round(clip.y1, 2)]
    prior = REUSE_ASSETS.get(relative_path)
    if output.is_file() and prior and prior.get("crop_points") == crop_points:
        if sha256(output) == prior.get("sha256"):
            return {key: prior[key] for key in ["path", "sha256", "width", "height", "size_bytes", "crop_points"]}
    pix = page.get_pixmap(clip=clip, dpi=dpi, alpha=False)
    image = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, "WEBP", quality=quality, method=6)
    return {
        "path": relative_path,
        "sha256": sha256(output),
        "width": image.width,
        "height": image.height,
        "size_bytes": output.stat().st_size,
        "crop_points": crop_points,
    }


def build_assets_for_kind(doc: fitz.Document, rows: list[dict], kind: str, pair_slug: str, dpi: int, quality: int) -> tuple[dict[str, list[dict]], list[dict]]:
    anchors: dict[str, tuple[int, float, str]] = {}
    issues = []
    start_page_field = f"{kind}_page_start"
    end_page_field = f"{kind}_page_end"
    for row in rows:
        page_number = int(row[start_page_field])
        page = doc[page_number - 1]
        if kind == "paper":
            y, method = paper_anchor(page, int(row["question_number"]), int(row["marks"]))
        else:
            y, method = markscheme_anchor(page, int(row["question_number"]))
        anchors[row["source_question_id"]] = (page_number, y, method)
        if method == "page_top_fallback":
            issues.append({"source_question_id": row["source_question_id"], "kind": kind, "issue": "start_anchor_fallback"})

    by_question: dict[str, list[dict]] = {}
    ordered = sorted(rows, key=lambda row: int(row["question_number"]))
    for index, row in enumerate(ordered):
        qid = row["source_question_id"]
        start_page = int(row[start_page_field])
        end_page = int(row[end_page_field])
        _, start_y, anchor_method = anchors[qid]
        next_anchor = None
        if index + 1 < len(ordered):
            next_row = ordered[index + 1]
            next_page, next_y, _ = anchors[next_row["source_question_id"]]
            if next_page == end_page:
                next_anchor = max(55.0, next_y - 5)

        assets = []
        for page_number in range(start_page, end_page + 1):
            page = doc[page_number - 1]
            top = start_y if page_number == start_page else 42.0
            bottom = next_anchor if page_number == end_page and next_anchor is not None else page.rect.height - 38.0
            if bottom <= top + 20:
                bottom = page.rect.height - 38.0
                issues.append({"source_question_id": qid, "kind": kind, "issue": "invalid_end_anchor_fallback", "page": page_number})
            clip = fitz.Rect(34.0, top, page.rect.width - 34.0, bottom)
            output = OUTPUT_ROOT / kind / pair_slug / f"q{int(row['question_number']):02d}-p{page_number:02d}.webp"
            asset = render_clip(page, clip, output, dpi, quality)
            asset.update({
                "source_page": page_number,
                "anchor_method": anchor_method if page_number == start_page else "continued_page",
                "visual_review_status": "pending_visual_review",
            })
            assets.append(asset)
        by_question[qid] = assets
    return by_question, issues


def make_contact_sheet(pair_slug: str, rows: list[dict], assets: dict[str, dict]) -> None:
    thumbs = []
    for row in sorted(rows, key=lambda item: int(item["question_number"])):
        qid = row["source_question_id"]
        first = assets[qid]["paper"][0]
        image = Image.open(ROOT / "public" / first["path"]).convert("RGB")
        image.thumbnail((300, 420))
        tile = Image.new("RGB", (320, 470), "white")
        tile.paste(image, ((320 - image.width) // 2, 32))
        ImageDraw.Draw(tile).text((10, 8), f"Q{row['question_number']} paper", fill="black")
        thumbs.append(tile)
    if not thumbs:
        return
    columns = 4
    rows_count = (len(thumbs) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * 320, rows_count * 470), "#dddddd")
    for index, tile in enumerate(thumbs):
        sheet.paste(tile, ((index % columns) * 320, (index // columns) * 470))
    QA_ROOT.mkdir(parents=True, exist_ok=True)
    sheet.save(QA_ROOT / f"{pair_slug}.webp", "WEBP", quality=88, method=6)


def question_id_maps(questions: list[dict]) -> dict[str, str]:
    result = {}
    grouped: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for row in questions:
        grouped[(row["level"], row["paper"])].append(row)
    for (_, paper), rows in grouped.items():
        for sequence, row in enumerate(sorted(rows, key=lambda item: (item["session"], item["timezone"], item["base_id"], item["question_number"])), start=1):
            result[row["source_question_id"]] = f"{paper}-{sequence:06d}"
    return result


def build(dpi: int, quality: int, contact_sheets: bool, limit: int | None) -> None:
    global REUSE_ASSETS
    REUSE_ASSETS = {}
    if MANIFEST_PATH.exists():
        prior_manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        if prior_manifest.get("render") == {"dpi": dpi, "format": "webp", "quality": quality}:
            for question in prior_manifest.get("questions", []):
                for kind in ["paper", "markscheme"]:
                    for asset in question.get("assets", {}).get(kind, []):
                        REUSE_ASSETS[asset["path"]] = asset
    inventory = json.loads(INVENTORY_PATH.read_text(encoding="utf-8"))
    intake = json.loads(INTAKE_PATH.read_text(encoding="utf-8"))
    source_root = Path(inventory["source_root"])
    pairs = {pair["base_id"]: pair for pair in inventory["canonical_pairs"]}
    questions = intake["questions"][:limit] if limit else intake["questions"]
    by_pair: dict[str, list[dict]] = defaultdict(list)
    for row in questions:
        by_pair[row["base_id"]].append(row)

    all_assets: dict[str, dict] = {}
    issues = []
    for base_id, rows in by_pair.items():
        pair = pairs[base_id]
        pair_slug = safe_slug(base_id)
        with fitz.open(source_root / pair["paper_path"]) as paper_doc, fitz.open(source_root / pair["markscheme_path"]) as markscheme_doc:
            paper_assets, paper_issues = build_assets_for_kind(paper_doc, rows, "paper", pair_slug, dpi, quality)
            markscheme_assets, markscheme_issues = build_assets_for_kind(markscheme_doc, rows, "markscheme", pair_slug, dpi, quality)
        issues.extend(paper_issues)
        issues.extend(markscheme_issues)
        for row in rows:
            qid = row["source_question_id"]
            all_assets[qid] = {"paper": paper_assets[qid], "markscheme": markscheme_assets[qid]}
        if contact_sheets:
            make_contact_sheet(pair_slug, rows, all_assets)

    id_map = question_id_maps(intake["questions"])
    asset_rows = []
    draft_items = []
    for row in questions:
        qid = row["source_question_id"]
        asset_row = {**row, "question_id": id_map[qid], "assets": all_assets[qid]}
        asset_rows.append(asset_row)
        draft_items.append({
            "question_id": id_map[qid],
            "curriculum": "ib",
            "course": "math-aa",
            "level": row["level"],
            "paper": row["paper"],
            "session": row["session"],
            "timezone": row["timezone"],
            "question_number": row["question_number"],
            "marks": row["marks"],
            "calculator_allowed": row["calculator_allowed"],
            "structural_role": row["structural_role"],
            "text": "",
            "parts": [],
            "solution": {"outline": ""},
            "markscheme": {"rows": []},
            "source_images": all_assets[qid]["paper"],
            "markscheme_images": all_assets[qid]["markscheme"],
            "source": {
                "registry_id": f"IB-MATH-AA-{row['base_id']}",
                "source_question_id": qid,
                "paper_id": row["base_id"],
                "paper_path": pairs[row["base_id"]]["paper_path"],
                "markscheme_path": pairs[row["base_id"]]["markscheme_path"],
                "paper_sha256": row["paper_sha256"],
                "markscheme_sha256": row["markscheme_sha256"],
                "paper_pages": [row["paper_page_start"], row["paper_page_end"]],
                "markscheme_pages": [row["markscheme_page_start"], row["markscheme_page_end"]],
                "rights_status": row["rights_status"],
            },
            "publication_review": {
                "content_rights": row["rights_status"],
                "permission_basis": row["permission_basis"],
                "visual_source_assets": "generated_pending_item_review",
            },
            "transcription_status": "pending_visual_transcription",
            "visual_review_status": "pending_visual_review",
            "classification_status": "pending_prompt_and_markscheme_review",
            "scoring_status": "pending_mark_point_transcription",
            "publish_status": "blocked",
            "student_visible": False,
        })

    manifest = {
        "schema_version": 1,
        "generated_at": date.today().isoformat(),
        "render": {"dpi": dpi, "format": "webp", "quality": quality},
        "question_count": len(asset_rows),
        "asset_count": sum(len(row["assets"][kind]) for row in asset_rows for kind in ["paper", "markscheme"]),
        "fallback_anchor_count": sum(1 for issue in issues if "fallback" in issue["issue"]),
        "issues": issues,
        "questions": asset_rows,
    }
    referenced_paths = {
        asset["path"]
        for row in asset_rows
        for kind in ["paper", "markscheme"]
        for asset in row["assets"][kind]
    }
    if OUTPUT_ROOT.exists():
        for output in OUTPUT_ROOT.rglob("*.webp"):
            if output.relative_to(ROOT / "public").as_posix() not in referenced_paths:
                output.unlink()
    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    DRAFT_PATH.write_text(json.dumps(draft_items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: manifest[key] for key in ["question_count", "asset_count", "fallback_anchor_count"]}, indent=2))


def validate() -> None:
    errors = []
    if not MANIFEST_PATH.exists() or not DRAFT_PATH.exists():
        raise SystemExit("Visual intake outputs are missing; run the build command first.")
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    draft = json.loads(DRAFT_PATH.read_text(encoding="utf-8"))
    if manifest.get("question_count") != len(manifest.get("questions", [])):
        errors.append("manifest question count mismatch")
    if len(draft) != manifest.get("question_count"):
        errors.append("draft question count mismatch")
    ids = set()
    asset_count = 0
    for row in manifest.get("questions", []):
        qid = row.get("question_id")
        canonical_id = (row.get("level"), qid)
        if not qid or canonical_id in ids:
            errors.append(f"missing or duplicate question ID: {qid}")
        ids.add(canonical_id)
        for kind in ["paper", "markscheme"]:
            assets = row.get("assets", {}).get(kind, [])
            if not assets:
                errors.append(f"{qid}: missing {kind} assets")
            for asset in assets:
                asset_count += 1
                path = ROOT / "public" / asset.get("path", "")
                if not path.is_file():
                    errors.append(f"{qid}: missing asset {path}")
                    continue
                if sha256(path) != asset.get("sha256"):
                    errors.append(f"{qid}: asset fingerprint mismatch {path}")
                if asset.get("width", 0) < 300 or asset.get("height", 0) < 40:
                    errors.append(f"{qid}: asset dimensions are too small {path}")
    if asset_count != manifest.get("asset_count"):
        errors.append("manifest asset count mismatch")
    if errors:
        print(f"IB Math AA visual intake failed with {len(errors)} error(s):")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)
    print(f"IB Math AA visual intake passed: {len(ids)} questions and {asset_count} verified assets.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--contact-sheets", action="store_true")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--dpi", type=int, default=144)
    parser.add_argument("--quality", type=int, default=88)
    args = parser.parse_args()
    if args.check:
        validate()
    else:
        build(args.dpi, args.quality, args.contact_sheets, args.limit)


if __name__ == "__main__":
    main()
