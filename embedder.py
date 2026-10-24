"""
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
