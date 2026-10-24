import type { TextChunk, ChunkMetadata } from './chunker';
import type { ChromaCollectionSimulator } from './vectorMath';

export function getModelDimensions(model: string): number {
  if (model === 'mixedbread-ai/mxbai-embed-large') return 1024;
  if (model === 'sentence-transformers/all-mpnet-base-v2') return 768;
  return 384;
}

// Replace this book's previous chunks; a collection cannot mix vector sizes.
export function syncBookCollection(
  store: ChromaCollectionSimulator<ChunkMetadata>,
  chunks: TextChunk[],
  embeddings: number[][],
  bookTitle: string,
): void {
  const dimension = embeddings[0]?.length;
  if (store.getAll().some(record => record.embedding.length !== dimension)) {
    store.clear();
  }
  store.delete(store.getAll().filter(record => record.metadata.bookTitle === bookTitle).map(record => record.id));
  store.add({
    ids: chunks.map(chunk => chunk.id),
    embeddings,
    metadatas: chunks.map(chunk => chunk.metadata),
    documents: chunks.map(chunk => chunk.text),
  });
}
