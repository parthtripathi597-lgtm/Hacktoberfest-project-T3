"""
Extract text and images from a PDF using PyMuPDF.

Usage:
    python extract_pdf.py <input.pdf> [--output output.json] [--assets assets]
"""

import argparse
import json
import sys
from pathlib import Path

import fitz  # PyMuPDF


def extract_pdf(pdf_path: str, output_json: str, assets_dir: str) -> None:
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        sys.exit(f"Error: '{pdf_path}' not found.")

    assets = Path(assets_dir)
    assets.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)
    result = {
        "source": pdf_path.name,
        "total_pages": len(doc),
        "pages": [],
    }
    image_count = 0

    for page_num in range(len(doc)):
        page = doc[page_num]

        # --- text --------------------------------------------------------
        text = page.get_text("text")

        page_data = {
            "page": page_num + 1,
            "text": text,
            "images": [],
        }

        # --- images ------------------------------------------------------
        for img_index, img_info in enumerate(page.get_images(full=True)):
            xref = img_info[0]
            try:
                base_image = doc.extract_image(xref)
            except Exception:
                continue

            ext = base_image.get("ext", "png")
            image_bytes = base_image["image"]
            image_count += 1
            filename = f"page{page_num + 1}_img{img_index + 1}.{ext}"
            filepath = assets / filename
            filepath.write_bytes(image_bytes)

            page_data["images"].append(
                {
                    "file": str(filepath),
                    "width": base_image.get("width"),
                    "height": base_image.get("height"),
                    "colorspace": str(base_image.get("colorspace", "")),
                    "bpc": base_image.get("bpc"),
                    "size_bytes": len(image_bytes),
                }
            )

        result["pages"].append(page_data)

    doc.close()

    # --- write JSON ------------------------------------------------------
    output = Path(output_json)
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"Done — {len(result['pages'])} pages processed, {image_count} images saved.")
    print(f"  Text  → {output}")
    print(f"  Images → {assets}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract text & images from a PDF.")
    parser.add_argument("pdf", help="Path to the input PDF file")
    parser.add_argument("--output", default="output.json", help="Output JSON file (default: output.json)")
    parser.add_argument("--assets", default="assets", help="Directory for extracted images (default: assets)")
    args = parser.parse_args()

    extract_pdf(args.pdf, args.output, args.assets)

