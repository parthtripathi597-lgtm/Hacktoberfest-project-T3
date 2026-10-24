"""
PDF Text Extractor.
Extracts text page-by-page from book PDF files.
"""
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader
import re

def clean_extracted_text(text: str) -> str:
    """Normalize whitespace, remove hyphenated line breaks and control characters."""
    if not text:
        return ""
    # Fix hyphenated words broken across lines (e.g. "con- / dition" -> "condition")
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)
    # Replace multiple newlines or tabs with a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_book_pages(pdf_path: Path) -> List[Dict[str, Any]]:
    """
    Extracts pages with their page numbers from a PDF file.
    Returns: List of {"page_number": int, "text": str}
    """
    reader = PdfReader(str(pdf_path))
    pages_data = []

    for index, page in enumerate(reader.pages):
        page_num = index + 1
        raw_text = page.extract_text() or ""
        cleaned = clean_extracted_text(raw_text)
        if cleaned:
            pages_data.append({
                "page_number": page_num,
                "text": cleaned
            })

    return pages_data

def get_book_title_from_path(pdf_path: Path) -> str:
    """Derive clean readable book title from file name."""
    stem = pdf_path.stem
    # Replace underscores and dashes with spaces
    title = re.sub(r'[_-]+', ' ', stem).title()
    return title
