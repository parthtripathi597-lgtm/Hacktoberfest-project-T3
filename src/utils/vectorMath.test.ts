import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cosineSimilarity,
  euclideanDistance,
  normalizeVector,
  generateSimulatedEmbedding,
  ChromaCollectionSimulator,
} from './vectorMath.ts';

test('cosineSimilarity computes correct similarity for identical and orthogonal vectors', () => {
  const v1 = [1, 0, 0];
  const v2 = [1, 0, 0];
  const v3 = [0, 1, 0];

  assert.equal(Math.round(cosineSimilarity(v1, v2) * 1000) / 1000, 1.0);
  assert.equal(Math.round(cosineSimilarity(v1, v3) * 1000) / 1000, 0.0);
});

test('generateSimulatedEmbedding returns unit normalized vector of specified dimensions', () => {
  const emb384 = generateSimulatedEmbedding('HuggingFace embedding model vector pipeline', 384);
  assert.equal(emb384.length, 384);

  // Check unit length (L2 norm ≈ 1.0)
  const norm = Math.sqrt(emb384.reduce((acc, v) => acc + v * v, 0));
  assert.ok(Math.abs(norm - 1.0) < 1e-4, 'Vector must be unit normalized');
});

test('ChromaCollectionSimulator handles add, count, and semantic query matching', () => {
  const collection = new ChromaCollectionSimulator<{ bookTitle: string; page: number }>(
    'books_collection'
  );

  const doc1 = 'Artificial intelligence in robotics and automation systems';
  const doc2 = 'Culinary techniques for French baking and pastry dough';
  const emb1 = generateSimulatedEmbedding(doc1, 384);
  const emb2 = generateSimulatedEmbedding(doc2, 384);

  collection.add({
    ids: ['chunk_01', 'chunk_02'],
    embeddings: [emb1, emb2],
    metadatas: [
      { bookTitle: 'AI Robotics', page: 12 },
      { bookTitle: 'French Pastry', page: 45 },
    ],
    documents: [doc1, doc2],
  });

  assert.equal(collection.count(), 2);

  // Query about machine learning / robotics
  const queryEmb = generateSimulatedEmbedding('robotics intelligent machines', 384);
  const results = collection.query({
    queryEmbedding: queryEmb,
    nResults: 2,
  });

  assert.equal(results.length, 2);
  // Nearest result should be doc1 (robotics)
  assert.equal(results[0].id, 'chunk_01');
  assert.ok(results[0].similarity > results[1].similarity);
});
