import test from 'node:test';
import assert from 'node:assert/strict';
import { countWords, chunkPlainText, chunkBookPages } from './chunker.ts';

test('countWords accurately calculates word count', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('Hello world from AI Studio'), 5);
  assert.equal(countWords('Multiple   spaces \n and \t newlines'), 4);
});

test('chunkPlainText produces ~500 word chunks from a long document', () => {
  // Generate a mock book text with 1200 words
  const sentence = 'The quick brown fox jumps over the lazy dog. Artificial intelligence revolutionizes vector search and database retrieval. ';
  const wordsInSentence = sentence.trim().split(/\s+/).length; // 15 words
  const repeatCount = Math.ceil(1200 / wordsInSentence);
  const sampleBookText = sentence.repeat(repeatCount);

  const chunks = chunkPlainText(sampleBookText, {
    targetWords: 500,
    overlapWords: 50,
    bookTitle: 'Test Book',
  });

  assert.ok(chunks.length >= 2, 'Should create at least 2 chunks for 1200 words');
  
  // First chunk should be around 500 words
  const firstChunk = chunks[0];
  assert.ok(firstChunk.metadata.wordCount >= 450 && firstChunk.metadata.wordCount <= 550, 
    `Chunk size should be around 500 words, got ${firstChunk.metadata.wordCount}`);
  assert.equal(firstChunk.metadata.bookTitle, 'Test Book');
  assert.equal(firstChunk.metadata.chunkIndex, 0);
  assert.ok(firstChunk.id.includes('test_book_chunk_0000'));
});

test('chunkBookPages tracks page provenance across multiple pages', () => {
  const pages = [
    { pageNumber: 1, text: 'This is page one. '.repeat(40) }, // ~160 words
    { pageNumber: 2, text: 'This is page two. '.repeat(50) }, // ~200 words
    { pageNumber: 3, text: 'This is page three. '.repeat(60) }, // ~240 words
  ];

  const chunks = chunkBookPages(pages, {
    targetWords: 300,
    overlapWords: 30,
    bookTitle: 'Multi-Page Spec',
  });

  assert.ok(chunks.length >= 2);
  assert.equal(chunks[0].metadata.startPage, 1);
  assert.ok(chunks[0].metadata.endPage >= 1);
  assert.equal(chunks[chunks.length - 1].metadata.endPage, 3);
});

test('small text under 500 words produces exactly 1 chunk', () => {
  const smallText = 'Just a brief passage about Hugging Face embeddings and ChromaDB vector store.';
  const chunks = chunkPlainText(smallText, {
    targetWords: 500,
    bookTitle: 'Short Note',
  });

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].metadata.chunkIndex, 0);
  assert.equal(chunks[0].metadata.totalChunks, 1);
  assert.equal(chunks[0].metadata.wordCount, 12);
});
