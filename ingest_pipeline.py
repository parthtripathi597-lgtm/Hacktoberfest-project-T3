"""
Main Ingestion Pipeline.
Executes the full pipeline:
1. Discovers PDF books in the './books' directory.
2. Extracts text and cleans pages.
3. Chunks text into ~500 word segments with sentence preservation.
4. Generates mathematical vector embeddings using Hugging Face Sentence Transformers.
5. Stores embeddings and metadata in ChromaDB.
"""
from pathlib import Path
import sys
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn

import config
from pdf_extractor import extract_book_pages, get_book_title_from_path
from chunker import chunk_book_pages
from embedder import HuggingFaceEmbedder
from chroma_store import ChromaStore

console = Console()

def run_ingestion():
    console.rule("[bold cyan]Book PDF to ChromaDB Vector Ingestion Pipeline[/bold cyan]")
    
    books_dir = config.BOOKS_DIR
    if not books_dir.exists():
        books_dir.mkdir(parents=True, exist_ok=True)
        console.print(f"[yellow]Created books directory at '{books_dir}'. Please drop your PDF books there.[/yellow]")
        return

    pdf_files = list(books_dir.glob("*.pdf"))
    if not pdf_files:
        console.print(f"[bold yellow]No PDF files found in '{books_dir}'![/bold yellow]")
        console.print("Please copy your PDF books into the [green]books/[/green] folder and run this script again.")
        sys.exit(0)

    console.print(f"Found [bold green]{len(pdf_files)}[/bold green] book PDF(s) to process:\n")
    for idx, f in enumerate(pdf_files, 1):
        console.print(f"  {idx}. [cyan]{f.name}[/cyan] ({f.stat().st_size / (1024*1024):.2f} MB)")

    # 1. Initialize Hugging Face Embedder & ChromaStore
    console.print("\n[bold]Initializing Hugging Face Embedder and ChromaDB...[/bold]")
    embedder = HuggingFaceEmbedder()
    chroma = ChromaStore()

    total_chunks_processed = 0

    # 2. Process each PDF book
    for pdf_path in pdf_files:
        book_title = get_book_title_from_path(pdf_path)
        console.print(f"\n[bold blue]Processing Book:[/bold blue] {book_title}")

        # Step A: Extract pages
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            TimeElapsedColumn(),
            transient=True
        ) as progress:
            task = progress.add_task(f"Extracting text from {pdf_path.name}...", total=None)
            pages = extract_book_pages(pdf_path)
            progress.remove_task(task)

        if not pages:
            console.print(f"[red]Warning: No text could be extracted from '{pdf_path.name}' (might be scanned images).[/red]")
            continue

        console.print(f"  Extracted [green]{len(pages)}[/green] pages.")

        # Step B: Chunk into ~500 words
        chunks = chunk_book_pages(
            pages=pages,
            book_title=book_title,
            target_words=config.TARGET_WORD_COUNT,
            overlap_words=config.OVERLAP_WORD_COUNT,
            respect_sentences=config.RESPECT_SENTENCE_BOUNDARIES
        )

        console.print(f"  Generated [green]{len(chunks)}[/green] chunks (~{config.TARGET_WORD_COUNT} words each).")

        # Step C: Generate HuggingFace Vector Embeddings
        console.print(f"  Passing chunks through HuggingFace model '{config.EMBEDDING_MODEL_NAME}'...")
        chunk_texts = [c.text for c in chunks]
        embeddings = embedder.embed_texts(chunk_texts)

        # Step D: Store in ChromaDB
        console.print(f"  Storing vectors and metadata in ChromaDB collection '{config.COLLECTION_NAME}'...")
        inserted = chroma.upsert_chunks(chunks, embeddings)
        total_chunks_processed += inserted
        console.print(f"  [bold green]Successfully stored {inserted} chunks for '{book_title}'![/bold green]")

    # Summary table
    stats = chroma.get_stats()
    table = Table(title="Pipeline Ingestion Complete", show_header=True, header_style="bold magenta")
    table.add_column("Property", style="dim")
    table.add_column("Value", style="bold")
    table.add_row("ChromaDB Persist Directory", str(stats["persist_directory"]))
    table.add_row("Collection Name", str(stats["collection_name"]))
    table.add_row("Total Vectors in Store", str(stats["total_vectors"]))
    table.add_row("Target Words per Chunk", f"~{config.TARGET_WORD_COUNT} words")
    table.add_row("Hugging Face Embedding Model", config.EMBEDDING_MODEL_NAME)
    console.print("\n", table)
    console.print("\n[bold green]Done! You can now query your vectors with:[/bold green]")
    console.print("[cyan]python query_search.py[/cyan]\n")

if __name__ == "__main__":
    run_ingestion()
