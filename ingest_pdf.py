"""
PDF → Chunked Embeddings → ChromaDB ingestion pipeline.

Usage:
    python ingest_pdf.py book1.pdf book2.pdf ...
    python ingest_pdf.py *.pdf

Options:
    --chunk-size     Target words per chunk          (default: 500)
    --chunk-overlap  Overlap in words between chunks (default: 50)
    --model          HuggingFace embedding model     (default: all-MiniLM-L6-v2)
    --collection     ChromaDB collection name        (default: books)
    --db-dir         ChromaDB persistent directory   (default: ./chroma_db)
    --assets         Directory for extracted images   (default: ./assets)
"""

import argparse
import json
import re
import sys
import uuid
from pathlib import Path

import chromadb
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer


# ── Text extraction ─────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path: str) -> list[dict]:
    """Return a list of {page, text} dicts for every page in the PDF."""
    doc = fitz.open(pdf_path)
    pages = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()
        if text:
            pages.append({"page": page_num + 1, "text": text})
    doc.close()
    return pages


def extract_images_from_pdf(pdf_path: str, assets_dir: Path) -> int:
    """Save every embedded image to *assets_dir*. Return image count."""
    assets_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    stem = Path(pdf_path).stem
    count = 0
    for page_num in range(len(doc)):
        for img_idx, img_info in enumerate(doc[page_num].get_images(full=True)):
            xref = img_info[0]
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            ext = base.get("ext", "png")
            count += 1
            out = assets_dir / f"{stem}_p{page_num + 1}_img{img_idx + 1}.{ext}"
            out.write_bytes(base["image"])
    doc.close()
    return count


# ── Chunking ─────────────────────────────────────────────────────────────

def chunk_text(
    text: str,
    chunk_size: int = 500,
    chunk_overlap: int = 50,
) -> list[str]:
    """
    Split *text* into overlapping chunks of roughly *chunk_size* words.

    • Tries to break on paragraph boundaries first, then sentences.
    • Guarantees every chunk is non-empty.
    """
    words = text.split()
    if not words:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunk = " ".join(chunk_words)

        # Try to break at the last paragraph or sentence boundary
        if end < len(words):
            # Look for the last paragraph break (\n\n) in the chunk
            para_break = chunk.rfind("\n\n")
            if para_break > len(chunk) // 2:
                chunk = chunk[:para_break].strip()
                # Recalculate how many words we actually consumed
                end = start + len(chunk.split())
            else:
                # Fall back to sentence boundary (. ! ?)
                sent_match = list(re.finditer(r'[.!?]\s', chunk))
                if sent_match and sent_match[-1].end() > len(chunk) // 2:
                    chunk = chunk[: sent_match[-1].end()].strip()
                    end = start + len(chunk.split())

        chunks.append(chunk)
        start = max(start + 1, end - chunk_overlap)  # slide with overlap

    return chunks


# ── Pipeline ─────────────────────────────────────────────────────────────

def ingest_pdfs(
    pdf_paths: list[str],
    chunk_size: int,
    chunk_overlap: int,
    model_name: str,
    collection_name: str,
    db_dir: str,
    assets_dir: str,
) -> None:
    # 1. Load embedding model
    print(f"Loading embedding model: {model_name} …")
    model = SentenceTransformer(model_name)

    # 2. Set up ChromaDB (persistent on disk)
    client = chromadb.PersistentClient(path=db_dir)
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )
    print(f"ChromaDB collection '{collection_name}' ready at ./{db_dir}/")

    assets = Path(assets_dir)
    total_chunks = 0
    total_images = 0

    for pdf_path in pdf_paths:
        pdf = Path(pdf_path)
        if not pdf.exists():
            print(f"  ⚠  Skipping '{pdf}' — file not found.")
            continue

        print(f"\n{'─' * 60}")
        print(f"Processing: {pdf.name}")
        print(f"{'─' * 60}")

        # Extract text
        pages = extract_text_from_pdf(str(pdf))
        print(f"  Extracted text from {len(pages)} pages.")

        # Extract images
        img_count = extract_images_from_pdf(str(pdf), assets)
        total_images += img_count
        print(f"  Saved {img_count} images to {assets}/")

        # Chunk
        all_chunks: list[dict] = []
        for page_data in pages:
            page_chunks = chunk_text(
                page_data["text"],
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
            )
            for idx, chunk in enumerate(page_chunks):
                all_chunks.append(
                    {
                        "id": str(uuid.uuid4()),
                        "text": chunk,
                        "metadata": {
                            "source": pdf.name,
                            "page": page_data["page"],
                            "chunk_index": idx,
                            "word_count": len(chunk.split()),
                        },
                    }
                )

        print(f"  Created {len(all_chunks)} chunks (~{chunk_size} words each).")

        if not all_chunks:
            continue

        # Embed
        texts = [c["text"] for c in all_chunks]
        print(f"  Embedding {len(texts)} chunks …")
        embeddings = model.encode(texts, show_progress_bar=True, batch_size=64)

        # Upsert into ChromaDB (batch by 5 000 — Chroma limit is 5 461)
        BATCH = 5000
        for i in range(0, len(all_chunks), BATCH):
            batch = all_chunks[i : i + BATCH]
            collection.upsert(
                ids=[c["id"] for c in batch],
                embeddings=[emb.tolist() for emb in embeddings[i : i + BATCH]],
                documents=[c["text"] for c in batch],
                metadatas=[c["metadata"] for c in batch],
            )
        total_chunks += len(all_chunks)
        print(f"  ✓ Stored in ChromaDB.")

    # ── Summary ──────────────────────────────────────────────────────
    print(f"\n{'═' * 60}")
    print(f"Done!  {len(pdf_paths)} PDF(s) processed.")
    print(f"  Total chunks embedded : {total_chunks}")
    print(f"  Total images saved    : {total_images}")
    print(f"  Collection size       : {collection.count()} documents")
    print(f"  ChromaDB dir          : {db_dir}/")
    print(f"  Assets dir            : {assets_dir}/")
    print(f"{'═' * 60}")


# ── CLI ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Ingest PDFs → chunk → embed → ChromaDB",
    )
    parser.add_argument("pdfs", nargs="+", help="One or more PDF files to ingest")
    parser.add_argument("--chunk-size", type=int, default=500, help="Words per chunk (default: 500)")
    parser.add_argument("--chunk-overlap", type=int, default=50, help="Word overlap between chunks (default: 50)")
    parser.add_argument("--model", default="all-MiniLM-L6-v2", help="HuggingFace model (default: all-MiniLM-L6-v2)")
    parser.add_argument("--collection", default="books", help="ChromaDB collection name (default: books)")
    parser.add_argument("--db-dir", default="chroma_db", help="ChromaDB directory (default: ./chroma_db)")
    parser.add_argument("--assets", default="assets", help="Image output directory (default: ./assets)")
    args = parser.parse_args()

    ingest_pdfs(
        pdf_paths=args.pdfs,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
        model_name=args.model,
        collection_name=args.collection,
        db_dir=args.db_dir,
        assets_dir=args.assets,
    )

