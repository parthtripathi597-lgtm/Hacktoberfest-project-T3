/**
 * Vector mathematics and in-memory ChromaDB collection simulator.
 * Provides exact cosine similarity, Euclidean distance, vector normalization,
 * and high-dimensional semantic simulation.
 */

export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function magnitude(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

export function normalizeVector(v: number[]): number[] {
  const mag = magnitude(v);
  if (mag === 0) return v.slice();
  return v.map(x => x / mag);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  const dot = dotProduct(a, b);
  // Clamp between -1.0 and 1.0 for floating-point inaccuracies
  return Math.max(-1, Math.min(1, dot / (magA * magB)));
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Deterministic text-to-vector embedding generator for browser simulation.
 * Uses bag-of-words character n-gram hashing and semantic term weights
 * to produce normalized embeddings of exact dimension (e.g. 384 or 768).
 */
export function generateSimulatedEmbedding(
  text: string,
  dimensions = 384
): number[] {
  const vec = new Float64Array(dimensions);
  const lower = text.toLowerCase();
  const words = lower.split(/[^a-z0-9]+/).filter(Boolean);

  if (words.length === 0) {
    vec[0] = 1;
    return Array.from(vec);
  }

  // Hash words and n-grams across dimensions
  for (let wIdx = 0; wIdx < words.length; wIdx++) {
    const word = words[wIdx];
    const weight = 1.0 / Math.sqrt(wIdx + 1); // Slight positional decay

    for (let i = 0; i < word.length; i++) {
      const code = word.charCodeAt(i);
      const idx1 = (code * 31 + i * 17 + wIdx * 13) % dimensions;
      const idx2 = (code * 19 + i * 23) % dimensions;
      vec[idx1] += weight * Math.sin(code + i);
      vec[idx2] += weight * Math.cos(code * 2 + i);
    }

    // Hash bi-grams if available
    if (wIdx < words.length - 1) {
      const nextWord = words[wIdx + 1];
      const bigramHash = (word.length * 37 + nextWord.length * 41 + word.charCodeAt(0) * 11) % dimensions;
      vec[bigramHash] += weight * 1.5;
    }
  }

  // Normalize to unit length (L2 norm)
  return normalizeVector(Array.from(vec));
}

/**
 * 2D projection via Principal Component Analysis (Power iteration method)
 * for visualizing high-dimensional embeddings on a scatter plot
 */
export function projectVectorsTo2D(
  vectors: number[][]
): Array<{ x: number; y: number }> {
  if (vectors.length === 0) return [];
  if (vectors.length === 1) return [{ x: 0, y: 0 }];

  const dim = vectors[0].length;
  const n = vectors.length;

  // Compute mean vector
  const mean = new Array(dim).fill(0);
  for (const v of vectors) {
    for (let j = 0; j < dim; j++) {
      mean[j] += v[j];
    }
  }
  for (let j = 0; j < dim; j++) mean[j] /= n;

  // Center vectors
  const centered = vectors.map(v => v.map((val, j) => val - mean[j]));

  // Find 1st principal component via power iteration
  let pc1 = centered[0].slice();
  pc1 = normalizeVector(pc1);
  for (let iter = 0; iter < 10; iter++) {
    const next = new Array(dim).fill(0);
    for (const v of centered) {
      const proj = dotProduct(v, pc1);
      for (let j = 0; j < dim; j++) {
        next[j] += proj * v[j];
      }
    }
    pc1 = normalizeVector(next);
  }

  // Find 2nd principal component (deflation)
  let pc2 = centered[centered.length - 1].slice();
  // Orthogonalize against pc1
  const projOnPc1 = dotProduct(pc2, pc1);
  pc2 = pc2.map((val, j) => val - projOnPc1 * pc1[j]);
  pc2 = normalizeVector(pc2);

  for (let iter = 0; iter < 10; iter++) {
    const next = new Array(dim).fill(0);
    for (const v of centered) {
      const proj = dotProduct(v, pc2);
      for (let j = 0; j < dim; j++) {
        next[j] += proj * v[j];
      }
    }
    // Re-orthogonalize against pc1
    const dot1 = dotProduct(next, pc1);
    const ortho = next.map((val, j) => val - dot1 * pc1[j]);
    pc2 = normalizeVector(ortho);
  }

  // Project centered vectors onto pc1 and pc2
  const projected = centered.map(v => ({
    x: dotProduct(v, pc1),
    y: dotProduct(v, pc2),
  }));

  // Normalize scale to range [-1, 1]
  const maxX = Math.max(...projected.map(p => Math.abs(p.x))) || 1;
  const maxY = Math.max(...projected.map(p => Math.abs(p.y))) || 1;

  return projected.map(p => ({
    x: p.x / maxX,
    y: p.y / maxY,
  }));
}

/**
 * ChromaDB In-Memory Collection Record
 */
export interface ChromaRecord<TMetadata = Record<string, unknown>> {
  id: string;
  document: string;
  embedding: number[];
  metadata: TMetadata;
}

export interface ChromaQueryResult<TMetadata = Record<string, unknown>> {
  id: string;
  document: string;
  metadata: TMetadata;
  distance: number;
  similarity: number; // 1 - distance (for cosine)
}

/**
 * In-memory ChromaDB Collection class mirroring ChromaDB's Python API
 */
export class ChromaCollectionSimulator<TMetadata = Record<string, unknown>> {
  name: string;
  metadata: Record<string, unknown>;
  private records: Map<string, ChromaRecord<TMetadata>> = new Map();

  constructor(name: string, metadata: Record<string, unknown> = { 'hnsw:space': 'cosine' }) {
    this.name = name;
    this.metadata = metadata;
  }

  count(): number {
    return this.records.size;
  }

  add(params: {
    ids: string[];
    embeddings: number[][];
    metadatas: TMetadata[];
    documents: string[];
  }): void {
    const { ids, embeddings, metadatas, documents } = params;
    for (let i = 0; i < ids.length; i++) {
      this.records.set(ids[i], {
        id: ids[i],
        document: documents[i],
        embedding: embeddings[i],
        metadata: metadatas[i],
      });
    }
  }

  peek(limit = 10): ChromaRecord<TMetadata>[] {
    return Array.from(this.records.values()).slice(0, limit);
  }

  getAll(): ChromaRecord<TMetadata>[] {
    return Array.from(this.records.values());
  }

  delete(ids: string[]): void {
    for (const id of ids) {
      this.records.delete(id);
    }
  }

  clear(): void {
    this.records.clear();
  }

  query(params: {
    queryEmbedding: number[];
    nResults?: number;
    where?: Record<string, unknown>;
  }): ChromaQueryResult<TMetadata>[] {
    const { queryEmbedding, nResults = 5, where } = params;
    const allRecords = Array.from(this.records.values());

    const filtered = allRecords.filter(rec => {
      if (!where) return true;
      for (const [key, val] of Object.entries(where)) {
        if ((rec.metadata as Record<string, unknown>)[key] !== val) {
          return false;
        }
      }
      return true;
    });

    const scored = filtered.map(rec => {
      const sim = cosineSimilarity(queryEmbedding, rec.embedding);
      const distance = 1 - sim; // Cosine distance in ChromaDB
      return {
        id: rec.id,
        document: rec.document,
        metadata: rec.metadata,
        distance,
        similarity: sim,
      };
    });

    // Sort by distance ascending (nearest first)
    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, nResults);
  }
}
