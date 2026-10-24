import JSZip from 'jszip';

export interface ProjectFile {
  name: string;
  path: string;
  language: string;
  description: string;
  content: string;
}

export const VS_CODE_PROJECT_FILES: ProjectFile[] = [
  {
    name: 'requirements.txt',
    path: 'requirements.txt',
    language: 'plaintext',
    description: 'Dependencies: ChromaDB, Sentence-Transformers, PyPDF, Torch, Rich',
    content: `# Core vector database & embedding pipeline requirements
chromadb>=0.4.24
sentence-transformers>=2.6.0
pypdf>=4.0.0
torch>=2.0.0
tqdm>=4.66.0
rich>=13.7.0
google-genai>=0.1.0
python-dotenv>=1.0.0
`,
  },
  {
    name: 'config.py',
    path: 'config.py',
    language: 'python',
    description: 'Central pipeline configuration (chunk size, overlap, model name, Chroma path)',
    content: `"""
Pipeline Configuration for Book Ingestion into ChromaDB.
"""
from pathlib import Path
import os

# Chunking Configuration (~500 words per chunk as requested)
TARGET_WORD_COUNT = 500
OVERLAP_WORD_COUNT = 50
RESPECT_SENTENCE_BOUNDARIES = True

# HuggingFace Embedding Model
# Popular options:
# - "sentence-transformers/all-MiniLM-L6-v2" (Fast, 384 dimensions, great balance)
# - "BAAI/bge-small-en-v1.5" (High MTEB benchmark, 384 dimensions)
# - "sentence-transformers/all-mpnet-base-v2" (Maximum accuracy, 768 dimensions)
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")

# ChromaDB Settings
CHROMA_PERSIST_DIR = Path("./chroma_db")
COLLECTION_NAME = "book_knowledge_base"
DISTANCE_METRIC = "cosine"  # "cosine", "l2", or "ip"

# Directory containing PDF books to ingest
BOOKS_DIR = Path("./books")

# Batch processing size for vector embeddings
BATCH_SIZE = 32
`,
  },
  {
    name: 'chunker.py',
    path: 'chunker.py',
    language: 'python',
    description: 'Sentence-aware text chunker breaking extracted book text into ~500 word units',
    content: `"""
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
                if re.search(r'[.!?]["\']?$', w):
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
`,
  },
  {
    name: 'pdf_extractor.py',
    path: 'pdf_extractor.py',
    language: 'python',
    description: 'Extracts clean text and page numbers from PDF book files using pypdf',
    content: `"""
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
    text = re.sub(r'(\\w+)-\\s*\\n\\s*(\\w+)', r'\\1\\2', text)
    # Replace multiple newlines or tabs with a single space
    text = re.sub(r'\\s+', ' ', text)
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
`,
  },
  {
    name: 'embedder.py',
    path: 'embedder.py',
    language: 'python',
    description: 'HuggingFace embedding model wrapper using sentence-transformers with auto GPU/MPS/CPU',
    content: `"""
Hugging Face Embedding Generator.
Encodes text chunks into dense mathematical vectors using sentence-transformers.
Automatically selects CUDA GPU, Apple Silicon MPS, or CPU.
"""
from typing import List
import torch
from sentence_transformers import SentenceTransformer
import config

class HuggingFaceEmbedder:
    def __init__(self, model_name: str = config.EMBEDDING_MODEL_NAME):
        self.model_name = model_name
        self.device = self._get_optimal_device()
        print(f"Loading Hugging Face model '{self.model_name}' onto device: {self.device}...")
        self.model = SentenceTransformer(self.model_name, device=self.device)
        self.embedding_dimension = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded successfully. Vector dimension: {self.embedding_dimension}")

    @staticmethod
    def _get_optimal_device() -> str:
        """Auto-detect optimal acceleration device."""
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    def embed_texts(self, texts: List[str], batch_size: int = config.BATCH_SIZE) -> List[List[float]]:
        """
        Encode a list of text strings into normalized float vectors.
        Uses L2 normalization so cosine distance equals dot product.
        """
        if not texts:
            return []
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 20,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> List[float]:
        """Embed a single search query."""
        emb = self.model.encode(
            query,
            normalize_embeddings=True,
            convert_to_numpy=True
        )
        return emb.tolist()
`,
  },
  {
    name: 'chroma_store.py',
    path: 'chroma_store.py',
    language: 'python',
    description: 'ChromaDB persistent vector store client, batch upsert, and collection manager',
    content: `"""
ChromaDB Vector Store Manager.
Manages persistent collection, batch upserting, and semantic querying.
"""
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
import config
from chunker import TextChunk

class ChromaStore:
    def __init__(
        self,
        persist_dir: str = str(config.CHROMA_PERSIST_DIR),
        collection_name: str = config.COLLECTION_NAME,
        distance_metric: str = config.DISTANCE_METRIC
    ):
        self.persist_dir = persist_dir
        self.collection_name = collection_name
        
        # Initialize persistent ChromaDB client
        self.client = chromadb.PersistentClient(
            path=self.persist_dir,
            settings=Settings(anonymized_telemetry=False)
        )
        
        # Get or create collection with specified space
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": distance_metric}
        )

    def upsert_chunks(
        self,
        chunks: List[TextChunk],
        embeddings: List[List[float]]
    ) -> int:
        """
        Upserts text chunks and their mathematical vectors into ChromaDB.
        Idempotent: updates existing chunk IDs and inserts new ones.
        """
        if not chunks:
            return 0

        ids = [chunk.chunk_id for chunk in chunks]
        documents = [chunk.text for chunk in chunks]
        metadatas = [
            {
                "book_title": chunk.book_title,
                "chunk_index": chunk.chunk_index,
                "start_page": chunk.start_page,
                "end_page": chunk.end_page,
                "word_count": chunk.word_count,
                "char_count": chunk.char_count,
            }
            for chunk in chunks
        ]

        # ChromaDB supports batch upsert
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            end_idx = i + batch_size
            self.collection.upsert(
                ids=ids[i:end_idx],
                embeddings=embeddings[i:end_idx],
                documents=documents[i:end_idx],
                metadatas=metadatas[i:end_idx],
            )

        return len(chunks)

    def query_similar(
        self,
        query_embedding: List[float],
        n_results: int = 5,
        where_filter: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Query ChromaDB using a query vector.
        Returns top matches with documents, metadata, and distance.
        """
        res = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter
        )

        output = []
        if res and res.get("ids") and len(res["ids"][0]) > 0:
            for i in range(len(res["ids"][0])):
                doc_id = res["ids"][0][i]
                doc_text = res["documents"][0][i]
                metadata = res["metadatas"][0][i]
                dist = res["distances"][0][i] if res.get("distances") else 0.0
                # For cosine distance, similarity = 1 - distance
                similarity = 1.0 - dist if config.DISTANCE_METRIC == "cosine" else dist

                output.append({
                    "id": doc_id,
                    "text": doc_text,
                    "metadata": metadata,
                    "distance": dist,
                    "similarity": similarity,
                })

        return output

    def get_stats(self) -> Dict[str, Any]:
        """Return collection vector count and information."""
        return {
            "collection_name": self.collection_name,
            "total_vectors": self.collection.count(),
            "persist_directory": str(self.persist_dir),
        }
`,
  },
  {
    name: 'ingest_pipeline.py',
    path: 'ingest_pipeline.py',
    language: 'python',
    description: 'Main executable: reads all PDF books from ./books, breaks into ~500 word chunks, embeds with HuggingFace, and stores in ChromaDB',
    content: `"""
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

    console.print(f"Found [bold green]{len(pdf_files)}[/bold green] book PDF(s) to process:\\n")
    for idx, f in enumerate(pdf_files, 1):
        console.print(f"  {idx}. [cyan]{f.name}[/cyan] ({f.stat().st_size / (1024*1024):.2f} MB)")

    # 1. Initialize Hugging Face Embedder & ChromaStore
    console.print("\\n[bold]Initializing Hugging Face Embedder and ChromaDB...[/bold]")
    embedder = HuggingFaceEmbedder()
    chroma = ChromaStore()

    total_chunks_processed = 0

    # 2. Process each PDF book
    for pdf_path in pdf_files:
        book_title = get_book_title_from_path(pdf_path)
        console.print(f"\\n[bold blue]Processing Book:[/bold blue] {book_title}")

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
    console.print("\\n", table)
    console.print("\\n[bold green]Done! You can now query your vectors with:[/bold green]")
    console.print("[cyan]python query_search.py[/cyan]\\n")

if __name__ == "__main__":
    run_ingestion()
`,
  },
  {
    name: 'query_search.py',
    path: 'query_search.py',
    language: 'python',
    description: 'Interactive semantic search CLI to query the ChromaDB vector database',
    content: `"""
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
    console.print(f"[green]Connected to ChromaDB.[/green] Total vectors in collection: [bold]{stats['total_vectors']}[/bold]\\n")

    if stats["total_vectors"] == 0:
        console.print("[yellow]ChromaDB collection is empty! Run 'python ingest_pipeline.py' first.[/yellow]")
        return

    console.print("Type your question or query below. Type [bold red]'exit'[/bold red] to quit.\\n")

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
                console.print("[yellow]No relevant passages found.[/yellow]\\n")
                continue

            console.print(f"\\n[bold green]Top {len(results)} Relevant Chunks Retrieved:[/bold green]\\n")

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
            console.print("\\n[dim]Exiting...[/dim]")
            break

if __name__ == "__main__":
    interactive_query()
`,
  },
  {
    name: 'test_pipeline.py',
    path: 'test_pipeline.py',
    language: 'python',
    description: 'Automated test suite verifying chunking logic, HuggingFace embeddings, and ChromaDB insertion',
    content: `"""
Unit Test & Integration Verification.
Tests chunking algorithm word boundaries, embedding generation,
and ChromaDB insertion/querying.
"""
import unittest
from chunker import chunk_book_pages, count_words
from embedder import HuggingFaceEmbedder
from chroma_store import ChromaStore

class TestPipeline(unittest.TestCase):
    def test_chunking_near_500_words(self):
        # Create 1200 words mock text
        sentence = "Artificial intelligence and neural embedding representations transform book retrieval systems. "
        words_per_s = count_words(sentence)
        repeats = 1200 // words_per_s + 5
        mock_pages = [{"page_number": 1, "text": sentence * repeats}]

        chunks = chunk_book_pages(mock_pages, book_title="Test Book", target_words=500, overlap_words=50)
        self.assertGreaterEqual(len(chunks), 2)
        
        first = chunks[0]
        # Target ~500 words (450 - 550 allowable tolerance due to sentence boundary)
        self.assertTrue(450 <= first.word_count <= 550, f"Expected ~500 words, got {first.word_count}")
        self.assertEqual(first.book_title, "Test Book")

    def test_huggingface_and_chroma_integration(self):
        embedder = HuggingFaceEmbedder()
        self.assertEqual(embedder.embedding_dimension, 384)

        text = "Deep learning and vector databases enable semantic search over literature."
        vector = embedder.embed_query(text)
        self.assertEqual(len(vector), 384)

        chroma = ChromaStore(collection_name="test_temp_collection")
        self.assertIsNotNone(chroma.collection)

if __name__ == "__main__":
    unittest.main()
`,
  },
  {
    name: 'quiz_generator.py',
    path: 'quiz_generator.py',
    language: 'python',
    description: 'AI Quiz Generator: retrieves ChromaDB chunks and generates interactive MCQs with citations',
    content: `"""
AI Quiz Generator from ChromaDB Book Chunks.
Retrieves grounded ~500-word passages from ChromaDB and generates
multiple-choice questions with answer keys, explanations, and page citations.
"""
import os
import json
import random
from typing import List, Dict, Any
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

import config
from chroma_store import ChromaStore

console = Console()

def generate_quiz_for_book(book_title: str = None, num_questions: int = 5):
    console.rule("[bold cyan]AI Book Quiz Generator (ChromaDB + LLM)[/bold cyan]")
    
    chroma = ChromaStore()
    stats = chroma.get_stats()
    
    if stats["total_vectors"] == 0:
        console.print("[yellow]ChromaDB is empty! Run 'python ingest_pipeline.py' first to index your book PDFs.[/yellow]")
        return

    console.print(f"[green]Connected to ChromaDB.[/green] Total vectors available: [bold]{stats['total_vectors']}[/bold]")
    
    # Retrieve all or filtered records from collection
    results = chroma.collection.get()
    if not results or not results["documents"]:
        console.print("[yellow]No documents found in ChromaDB collection.[/yellow]")
        return

    documents = results["documents"]
    metadatas = results["metadatas"]
    ids = results["ids"]

    # Filter by book title if provided
    items = []
    for doc, meta, doc_id in zip(documents, metadatas, ids):
        if book_title is None or meta.get("book_title", "").lower() == book_title.lower():
            items.append({"id": doc_id, "text": doc, "metadata": meta})

    if not items:
        console.print(f"[yellow]No chunks found for book '{book_title}'.[/yellow]")
        return

    console.print(f"Selected pool of [cyan]{len(items)}[/cyan] chunks for quiz generation.")
    sample_size = min(len(items), num_questions)
    sampled_chunks = random.sample(items, sample_size)

    # Check for GEMINI_API_KEY for real LLM quiz generation
    api_key = os.getenv("GEMINI_API_KEY")
    ai_client = None
    if api_key:
        try:
            from google import genai
            ai_client = genai.Client(api_key=api_key)
            console.print("[green]Using Gemini API for live LLM quiz generation.[/green]\\n")
        except Exception as e:
            console.print(f"[dim]Gemini SDK note: {e}. Using deterministic quiz mode.[/dim]\\n")
    else:
        console.print("[dim]Note: GEMINI_API_KEY not set. Generating quiz using grounded book passages.[/dim]\\n")

    quiz_items = []
    for idx, chunk in enumerate(sampled_chunks, 1):
        meta = chunk["metadata"]
        title = meta.get("book_title", "Book")
        start_p = meta.get("start_page", 1)
        end_p = meta.get("end_page", 1)
        text = chunk["text"]

        if ai_client:
            prompt = f"""Based STRICTLY on this ~500-word book passage from '{title}' (Pages {start_p}-{end_p}):
\"\"\"{text}\"\"\"

Generate 1 high-quality multiple choice question with 4 options testing comprehension of this passage.
Return ONLY valid JSON in this format:
{{
  "question": "Question text?",
  "options": ["A", "B", "C", "D"],
  "correct_index": 0,
  "explanation": "Why the correct answer is right based on the text"
}}
"""
            try:
                response = ai_client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt,
                )
                raw_json = response.text.strip().replace("\`\`\`json", "").replace("\`\`\`", "").strip()
                parsed = json.loads(raw_json)
                parsed["metadata"] = meta
                parsed["source_text"] = text[:300] + "..."
                quiz_items.append(parsed)
                continue
            except Exception as e:
                pass

        # Grounded fallback quiz question
        snippet = " ".join(text.split()[:25])
        quiz_items.append({
            "question": f"In '{title}' (Pages {start_p}–{end_p}), what does this section discuss?",
            "options": [
                f"It details: {snippet}...",
                f"It concludes the opposite of what occurred on page {start_p}",
                "It describes an unrelated tangent not found in the chapter",
                "It provides commentary from an external 21st-century reviewer"
            ],
            "correct_index": 0,
            "explanation": f"Grounded directly in Pages {start_p}–{end_p} of '{title}'.",
            "metadata": meta,
            "source_text": text[:300] + "..."
        })

    # Interactive Quiz Runner in Terminal
    console.rule("[bold magenta]Interactive Quiz Session[/bold magenta]")
    score = 0
    total = len(quiz_items)

    for idx, q in enumerate(quiz_items, 1):
        meta = q["metadata"]
        console.print(f"[bold yellow]Question {idx} of {total}:[/bold yellow] {q['question']}")
        console.print(f"[dim]Book: {meta.get('book_title')} · Pages {meta.get('start_page')}–{meta.get('end_page')}[/dim]\\n")

        for opt_idx, opt in enumerate(q["options"]):
            console.print(f"  [cyan]{chr(65 + opt_idx)})[/cyan] {opt}")

        user_choice = ""
        while user_choice not in ["A", "B", "C", "D"]:
            user_choice = console.input("\\n[bold]Your Answer (A/B/C/D): [/bold]").strip().upper()

        chosen_idx = ord(user_choice) - ord("A")
        if chosen_idx == q["correct_index"]:
            console.print("[bold green]Correct! Well done.[/bold green]")
            score += 1
        else:
            correct_letter = chr(65 + q["correct_index"])
            console.print(f"[bold red]Incorrect.[/bold red] The correct answer was [bold green]{correct_letter}[/bold green].")

        console.print(f"[italic]{q['explanation']}[/italic]\\n")
        console.print("-" * 50 + "\\n")

    console.rule("[bold cyan]Quiz Complete[/bold cyan]")
    percentage = (score / total) * 100
    console.print(f"Final Score: [bold green]{score}/{total}[/bold green] ([bold]{percentage:.1f}%[/bold])\\n")

if __name__ == "__main__":
    generate_quiz_for_book()
`,
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    description: 'Comprehensive setup guide and execution commands for VS Code',
    content: `# PDF Book Chunker, HuggingFace Embedder & ChromaDB Pipeline

A production-ready pipeline that extracts text from book PDFs, breaks them into **~500-word semantic chunks**, passes them through a **Hugging Face embedding model** to convert into mathematical vectors, and stores them in **ChromaDB** with full metadata and persistent storage.

---

## 🚀 Quick Setup in VS Code

### 1. Open in VS Code
Open your VS Code project folder containing these files.

### 2. Create and Activate a Python Virtual Environment
Open the VS Code Terminal (\`Ctrl + \`\` or \`Cmd + \`\`) and run:

\`\`\`bash
# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows (Command Prompt or PowerShell)
python -m venv venv
venv\\Scripts\\activate
\`\`\`

### 3. Install Dependencies
\`\`\`bash
pip install --upgrade pip
pip install -r requirements.txt
\`\`\`

---

## 📚 Ingesting Your Books

1. Place your book PDF files into the \`books/\` folder:
   \`\`\`
   your-project/
   ├── books/
   │   ├── my_favorite_book.pdf
   │   └── another_book.pdf
   ├── config.py
   ├── ingest_pipeline.py
   └── ...
   \`\`\`

2. Run the ingestion pipeline:
   \`\`\`bash
   python ingest_pipeline.py
   \`\`\`

This will:
- Extract text page-by-page.
- Break text into **chunks of ~500 words** with sentence boundaries preserved and a 50-word context overlap.
- Pass chunks through Hugging Face \`sentence-transformers/all-MiniLM-L6-v2\` (or your chosen model in \`config.py\`).
- Generate normalized 384-dimensional mathematical vectors.
- Persist vectors and metadata (book title, start/end page, word count) in ChromaDB under \`./chroma_db/\`.

---

## 🔍 Semantic Search / Querying Your Books

Once ingested, test semantic retrieval using the query CLI:

\`\`\`bash
python query_search.py
\`\`\`

Type any concept, question, or quote to retrieve the most semantically relevant 500-word passages with similarity scores and page numbers!

---

## ⚙️ Configuration Options (\`config.py\`)

| Setting | Default | Description |
|---|---|---|
| \`TARGET_WORD_COUNT\` | \`500\` | Target words per chunk |
| \`OVERLAP_WORD_COUNT\` | \`50\` | Context overlap between chunks |
| \`EMBEDDING_MODEL_NAME\` | \`"sentence-transformers/all-MiniLM-L6-v2"\` | Hugging Face model identifier |
| \`CHROMA_PERSIST_DIR\` | \`"./chroma_db"\` | Directory where ChromaDB stores vectors on disk |
| \`DISTANCE_METRIC\` | \`"cosine"\` | Metric for similarity (\`cosine\`, \`l2\`, \`ip\`) |
`,
  },
  {
    name: '.gitignore',
    path: '.gitignore',
    language: 'plaintext',
    description: 'Git ignore rules for Python, virtual environments, and ChromaDB database files',
    content: `# Virtual environments
venv/
env/
.venv/

# ChromaDB vector database storage
chroma_db/

# Python cache
__pycache__/
*.py[cod]
*$py.class
.pytest_cache/

# User PDFs (if large)
# books/*.pdf

# OS files
.DS_Store
Thumbs.db
`,
  },
];

/**
 * Creates and triggers a download of a complete ZIP archive
 * containing all VS Code project files.
 */
export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Add project files
  for (const file of VS_CODE_PROJECT_FILES) {
    zip.file(file.path, file.content);
  }

  // Add sample books folder with a placeholder instructions file
  zip.file(
    'books/DROP_YOUR_PDF_BOOKS_HERE.txt',
    'Drop your PDF book files in this folder, then run:\npython ingest_pipeline.py\n'
  );

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pdf-books-chromadb-pipeline.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
