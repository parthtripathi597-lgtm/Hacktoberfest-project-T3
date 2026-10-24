"""
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
