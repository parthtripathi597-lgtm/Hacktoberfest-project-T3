"""
Query the ChromaDB book collection with natural language.

Usage:
    python query_books.py "What is machine learning?"
    python query_books.py "neural networks" --n 10 --collection books
"""

import argparse

import chromadb
from sentence_transformers import SentenceTransformer


def query(
    question: str,
    n_results: int = 5,
    model_name: str = "all-MiniLM-L6-v2",
    collection_name: str = "books",
    db_dir: str = "chroma_db",
) -> None:
    model = SentenceTransformer(model_name)
    client = chromadb.PersistentClient(path=db_dir)

    try:
        collection = client.get_collection(collection_name)
    except Exception:
        print(f"Collection '{collection_name}' not found in {db_dir}/.")
        print("Run ingest_pdf.py first to populate the database.")
        return

    embedding = model.encode([question])[0].tolist()

    results = collection.query(
        query_embeddings=[embedding],
        n_results=n_results,
        include=["documents", "metadatas", "distances"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    dists = results["distances"][0]

    print(f"\nTop {len(docs)} results for: \"{question}\"\n")
    for i, (doc, meta, dist) in enumerate(zip(docs, metas, dists), 1):
        similarity = 1 - dist  # cosine distance → similarity
        print(f"{'─' * 60}")
        print(f"  [{i}] {meta['source']}  •  page {meta['page']}  •  similarity {similarity:.4f}")
        print(f"{'─' * 60}")
        # Show first 300 chars as preview
        preview = doc[:300] + ("…" if len(doc) > 300 else "")
        print(f"  {preview}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Semantic search over ingested books")
    parser.add_argument("question", help="Natural-language query")
    parser.add_argument("--n", type=int, default=5, help="Number of results (default: 5)")
    parser.add_argument("--model", default="all-MiniLM-L6-v2", help="Embedding model")
    parser.add_argument("--collection", default="books", help="ChromaDB collection")
    parser.add_argument("--db-dir", default="chroma_db", help="ChromaDB directory")
    args = parser.parse_args()

    query(args.question, args.n, args.model, args.collection, args.db_dir)

