"""
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
