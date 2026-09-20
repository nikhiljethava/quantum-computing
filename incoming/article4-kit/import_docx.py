"""Extract the user-supplied V9 source for build-time authoring, never at runtime.

This is a source importer, not the missing supplied validate_handoff.py.
It preserves document paragraph/table order, reference numbers, and image bytes.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
from pathlib import Path
from zipfile import ZipFile

from lxml import etree


NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}
LESSONS = [
    "sampling", "scheduling", "transmon", "ions", "routing", "blockade",
    "photonics", "loss", "phase", "entanglement",
]


def plain(element):
    values = []
    for node in element.iter():
        if node.tag == f"{{{NS['w']}}}t":
            values.append(node.text or "")
        elif node.tag in (f"{{{NS['w']}}}br", f"{{{NS['w']}}}cr"):
            values.append("\n")
        elif node.tag == f"{{{NS['w']}}}tab":
            values.append("\t")
    return "".join(values)


def dump(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    kit = Path(__file__).resolve().parent
    output = kit / "article4-v9"
    media = output / "media"
    media.mkdir(parents=True, exist_ok=True)
    original = output / args.source.name
    if args.source.resolve() != original.resolve():
        if original.exists() and original.read_bytes() != args.source.read_bytes():
            raise SystemExit("An existing source copy differs; refusing to overwrite it.")
        shutil.copy2(args.source, original)

    blocks, references, images = [], [], []
    with ZipFile(original) as archive:
        rels = {
            r.get("Id"): {"target": r.get("Target"), "external": r.get("TargetMode") == "External"}
            for r in etree.fromstring(archive.read("word/_rels/document.xml.rels"))
        }
        document = etree.fromstring(archive.read("word/document.xml"))
        for element in document.find("w:body", NS):
            if element.tag == f"{{{NS['w']}}}p":
                style = element.find("w:pPr/w:pStyle", NS)
                block = {
                    "kind": "paragraph",
                    "text": plain(element),
                    "style": style.get(f"{{{NS['w']}}}val") if style is not None else None,
                    "numbered": element.find("w:pPr/w:numPr", NS) is not None,
                    "images": [],
                    "links": [],
                }
                for link in element.findall("w:hyperlink", NS):
                    relation = rels.get(link.get(f"{{{NS['r']}}}id"))
                    if relation and relation["external"]:
                        block["links"].append({"text": plain(link), "url": relation["target"]})
                for image in element.findall(".//a:blip", NS):
                    relation = rels.get(image.get(f"{{{NS['r']}}}embed"))
                    if not relation or relation["external"]:
                        continue
                    target = relation["target"]
                    if not re.fullmatch(r"media/image\d+\.png", target):
                        raise ValueError(f"Unexpected embedded image path: {target}")
                    contents = archive.read("word/" + target)
                    (output / target).write_bytes(contents)
                    block["images"].append(target)
                    images.append({"path": target, "byte_count": len(contents), "sha256": hashlib.sha256(contents).hexdigest(), "block_index": len(blocks)})
                match = re.match(r"^\[(\d+)\]\s+", block["text"])
                if match:
                    references.append({"id": f"[{match.group(1)}]", "number": int(match.group(1)), "text": block["text"], "links": block["links"]})
                blocks.append(block)
            elif element.tag == f"{{{NS['w']}}}tbl":
                rows = []
                for row in element.findall("w:tr", NS):
                    rows.append(["\n".join(plain(p) for p in cell.findall("w:p", NS)) for cell in row.findall("w:tc", NS)])
                blocks.append({"kind": "table", "rows": rows})

    for i, image in enumerate(images):
        image["lesson_id"] = LESSONS[i - 1] if i else None
        image["role"] = "lesson_still" if i else "editorial_cover"
        following = blocks[image["block_index"] + 1:]
        image["caption"] = next((b["text"] for b in following if b["kind"] == "paragraph" and b["text"].strip()), "")
        image["mapping_basis"] = "Document order and adjacent caption; original embedded filename retained."

    dump(output / "document-blocks.json", blocks)
    dump(output / "references.json", references)
    dump(output / "media-manifest.json", images)
    lines = ["<!-- Mechanical extraction of the supplied DOCX; not a replacement implementation brief. -->", ""]
    for block in blocks:
        if block["kind"] == "paragraph":
            style = block["style"] or ""
            prefix = "# " if style == "Title" else "## " if style == "Heading1" else "### " if style == "Heading2" else "#### " if style == "Heading3" else ""
            if block["text"]:
                lines.extend([prefix + block["text"], ""])
            for path in block["images"]:
                caption = next(i["caption"] for i in images if i["path"] == path)
                lines.extend([f"![{caption.replace('[', '(').replace(']', ')')}]({path})", ""])
        else:
            rows = [[c.replace("|", "&#124;").replace("\n", "<br>") for c in row] for row in block["rows"]]
            if rows:
                lines.append("| " + " | ".join(rows[0]) + " |")
                lines.append("| " + " | ".join("---" for _ in rows[0]) + " |")
                lines.extend("| " + " | ".join(row) + " |" for row in rows[1:])
                lines.append("")
    lines.extend(["## Extracted reference destinations", ""])
    for reference in references:
        for link in reference["links"]:
            lines.append(f"- {reference['id']} {link['url']}")
    (output / "article.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    inventory = {
        "source_revision": "article4-v9",
        "source_filename": original.name,
        "source_sha256": hashlib.sha256(original.read_bytes()).hexdigest(),
        "source_kind": "User-supplied DOCX; original moving-media and fixture package not supplied",
        "implementation_brief": "CODEX_ARTICLE4_BRIEF.md" if (kit / "CODEX_ARTICLE4_BRIEF.md").exists() else None,
        "source_review_date": None,
        "paragraph_count": sum(b["kind"] == "paragraph" for b in blocks),
        "table_count": sum(b["kind"] == "table" for b in blocks),
        "reference_count": len(references),
        "embedded_png_count": len(images),
        "lesson_ids": LESSONS,
        "missing_supplied_files": (["CODEX_ARTICLE4_BRIEF.md"] if not (kit / "CODEX_ARTICLE4_BRIEF.md").exists() else []) + ["ACCEPTANCE_CASES.json", "golden-fixtures.json", "validate_handoff.py", "V9 review notes", "10 MP4 videos", "10 GIF alternatives", "40 numbered step PNGs", "10 separately identified print PNGs"],
        "limitations": [
            "PNG extractions are byte-identical embedded stills; video/step/print provenance cannot be inferred from them.",
            "DOCX metadata contains 2013 timestamps; these are not scientific review dates.",
            "No older V4/V5/V7 material was imported.",
            "This importer does not validate scientific claims or application behavior.",
        ],
    }
    dump(kit / "SOURCE_INVENTORY.json", inventory)
    print(json.dumps(inventory, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
