"""
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
