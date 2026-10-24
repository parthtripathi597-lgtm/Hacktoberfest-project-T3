import test from 'node:test';
import assert from 'node:assert/strict';
import { getModelDimensions, syncBookCollection } from './frontendCollection.ts';
import { ChromaCollectionSimulator, generateSimulatedEmbedding } from './vectorMath.ts';
import { chunkBookPages } from './chunker.ts';
import { SAMPLE_BOOKS } from '../data/sampleBooks.ts';

test('model dimensions match every available embedding model', () => {
  assert.equal(getModelDimensions('sentence-transformers/all-MiniLM-L6-v2'), 384);
  assert.equal(getModelDimensions('BAAI/bge-small-en-v1.5'), 384);
  assert.equal(getModelDimensions('sentence-transformers/all-mpnet-base-v2'), 768);
  assert.equal(getModelDimensions('mixedbread-ai/mxbai-embed-large'), 1024);
});

test('re-sync replaces obsolete book chunks and retains other books', () => {
  const store = new ChromaCollectionSimulator();
  const sync = (book: typeof SAMPLE_BOOKS[number], targetWords: number, dimensions = 384) => {
    const chunks = chunkBookPages(book.pages, {targetWords, overlapWords: 50, respectSentences: true, bookTitle: book.title});
    syncBookCollection(store as ChromaCollectionSimulator<any>, chunks, chunks.map(chunk => generateSimulatedEmbedding(chunk.text, dimensions)), book.title);
    return chunks;
  };
  const other = sync(SAMPLE_BOOKS[1], 500);
  sync(SAMPLE_BOOKS[0], 200);
  const updated = sync(SAMPLE_BOOKS[0], 800);
  assert.equal(store.count(), other.length + updated.length);
  assert.deepEqual(store.getAll().filter(record => (record.metadata as any).bookTitle === SAMPLE_BOOKS[0].title).map(record => record.id), updated.map(chunk => chunk.id));
});

test('model size changes rebuild a compatible searchable collection', () => {
  const store = new ChromaCollectionSimulator<any>();
  const book = SAMPLE_BOOKS[0];
  const chunks = chunkBookPages(book.pages, {targetWords: 500, overlapWords: 50, respectSentences: true, bookTitle: book.title});
  for (const dimensions of [384, 768, 1024]) {
    syncBookCollection(store, chunks, chunks.map(chunk => generateSimulatedEmbedding(chunk.text, dimensions)), book.title);
    assert.ok(store.getAll().every(record => record.embedding.length === dimensions));
    assert.equal(store.query({queryEmbedding: generateSimulatedEmbedding('creature', dimensions), nResults: 1}).length, 1);
  }
});
