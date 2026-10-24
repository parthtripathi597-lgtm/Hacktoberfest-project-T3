"""
Semantic Search & Retrieval CLI.
Converts user queries into mathematical vectors via Hugging Face model
and retrieves top matching 500-word chunks from ChromaDB.
"""
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

import config
from embedder import HuggingFaceEmbedder
from chroma_store import ChromaStore

console = Console()

def interactive_query():
    console.rule("[bold cyan]ChromaDB Semantic Book Search[/bold cyan]")
    console.print("Loading embedding model and connecting to ChromaDB...")

    embedder = HuggingFaceEmbedder()
    chroma = ChromaStore()

    stats = chroma.get_stats()
    console.print(f"[green]Connected to ChromaDB.[/green] Total vectors in collection: [bold]{stats['total_vectors']}[/bold]\n")

    if stats["total_vectors"] == 0:
        console.print("[yellow]ChromaDB collection is empty! Run 'python ingest_pipeline.py' first.[/yellow]")
        return

    console.print("Type your question or query below. Type [bold red]'exit'[/bold red] to quit.\n")

    while True:
        try:
            query = console.input("[bold yellow]Enter Search Query: [/bold yellow]").strip()
            if not query:
                continue
            if query.lower() in ("exit", "quit", "q"):
                console.print("[dim]Goodbye![/dim]")
                break

            # 1. Convert query to mathematical vector
            query_vector = embedder.embed_query(query)

            # 2. Search ChromaDB
            results = chroma.query_similar(query_vector, n_results=3)

            if not results:
                console.print("[yellow]No relevant passages found.[/yellow]\n")
                continue

            console.print(f"\n[bold green]Top {len(results)} Relevant Chunks Retrieved:[/bold green]\n")

            for idx, res in enumerate(results, 1):
                meta = res["metadata"]
                title = meta.get("book_title", "Unknown Book")
                page_info = f"Pages {meta.get('start_page', '?')}–{meta.get('end_page', '?')}"
                word_count = f"{meta.get('word_count', '?')} words"
                score = f"Similarity: {res['similarity'] * 100:.1f}% (Distance: {res['distance']:.4f})"

                header = f"[bold cyan]Match #{idx}[/bold cyan] · [bold]{title}[/bold] ({page_info}, {word_count}) · [green]{score}[/green]"
                
                # Truncate or display full text
                text_preview = res["text"]
                if len(text_preview) > 600:
                    text_preview = text_preview[:600] + "... [dim](full chunk stored)[/dim]"

                console.print(Panel(
                    text_preview,
                    title=header,
                    title_align="left",
                    border_style="blue"
                ))
                console.print()

        except KeyboardInterrupt:
            console.print("\n[dim]Exiting...[/dim]")
            break

if __name__ == "__main__":
    interactive_query()
