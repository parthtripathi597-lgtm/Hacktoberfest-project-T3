"""
Semantic Chunking Module.
Breaks raw extracted text into ~500 word chunks with configurable overlap
while respecting sentence boundaries and recording page provenance.
"""
from typing import List, Dict, Any
import re
from dataclasses import dataclass, asdict

@dataclass
class TextChunk:
    chunk_id: str
    text: str
    book_title: str
    chunk_index: int
    start_page: int
    end_page: int
    word_count: int
    char_count: int

def count_words(text: str) -> int:
    """Accurately count words separated by whitespace."""
    return len(text.strip().split())

def chunk_book_pages(
    pages: List[Dict[str, Any]],
    book_title: str,
    target_words: int = 500,
    overlap_words: int = 50,
    respect_sentences: bool = True
) -> List[TextChunk]:
    """
    Chunks a list of {page_number, text} dicts into ~500 word chunks.
    Preserves page numbers and ensures words are not split mid-sentence.
    """
    # 1. Flatten all words with their source page number
    word_tokens = []
    for page_entry in pages:
        p_num = page_entry.get("page_number", 1)
        raw_text = page_entry.get("text", "")
        for word in raw_text.split():
            word_tokens.append({"word": word, "page": p_num})

    if not word_tokens:
        return []

    chunks = []
    total_tokens = len(word_tokens)
    start_idx = 0
    chunk_counter = 0

    sanitized_title = re.sub(r'[^a-zA-Z0-9]+', '_', book_title).strip('_').lower()

    while start_idx < total_tokens:
        end_idx = min(start_idx + target_words, total_tokens)

        # Look for sentence boundary near target_words if enabled
        if respect_sentences and end_idx < total_tokens:
            search_start = max(start_idx + target_words - 40, start_idx + 100)
            search_end = min(start_idx + target_words + 40, total_tokens)
            best_boundary = end_idx
            min_dist = float('inf')

            for i in range(search_start, search_end):
                w = word_tokens[i]["word"]
                if re.search(r'[.!?]["']?$', w):
                    dist = abs(i - (start_idx + target_words))
                    if dist < min_dist:
                        min_dist = dist
                        best_boundary = i + 1
            end_idx = best_boundary

        slice_words = word_tokens[start_idx:end_idx]
        chunk_text = " ".join(item["word"] for item in slice_words)
        start_page = slice_words[0]["page"]
        end_page = slice_words[-1]["page"]
        word_count = len(slice_words)

        chunk_id = f"{sanitized_title}_c{chunk_counter:04d}"

        chunk = TextChunk(
            chunk_id=chunk_id,
            text=chunk_text,
            book_title=book_title,
            chunk_index=chunk_counter,
            start_page=start_page,
            end_page=end_page,
            word_count=word_count,
            char_count=len(chunk_text),
        )
        chunks.append(chunk)
        chunk_counter += 1

        step = max(1, (end_idx - start_idx) - overlap_words)
        start_idx += step

        if end_idx >= total_tokens:
            break

    return chunks
