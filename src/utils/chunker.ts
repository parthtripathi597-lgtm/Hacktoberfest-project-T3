/**
 * Core text chunker for book ingestion pipelines.
 * Breaks book text into semantic chunks of target ~500 words with configurable overlap
 * while respecting sentence boundaries.
 */

export interface ChunkMetadata {
  bookTitle: string;
  chunkIndex: number;
  totalChunks: number;
  wordCount: number;
  charCount: number;
  startPage: number;
  endPage: number;
  estimatedTokens: number;
  timestamp: string;
}

export interface TextChunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
}

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface ChunkingOptions {
  targetWords?: number; // Target words per chunk, default 500
  overlapWords?: number; // Word overlap between chunks, default 50
  respectSentences?: boolean; // Keep sentences intact
  bookTitle?: string;
}

/**
 * Counts words accurately by splitting on whitespace sequences
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Splits text into sentences using common punctuation boundaries
 */
export function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  // Match sentences ending with ., !, ? followed by whitespace or end of text
  const rawSentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g);
  if (!rawSentences) return [text];
  return rawSentences.map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Chunks a list of page contents into ~500 words chunks
 */
export function chunkBookPages(
  pages: PageContent[],
  options: ChunkingOptions = {}
): TextChunk[] {
  const targetWords = options.targetWords ?? 500;
  const overlapWords = options.overlapWords ?? 50;
  const respectSentences = options.respectSentences ?? true;
  const bookTitle = options.bookTitle || 'Book';

  if (!pages || pages.length === 0) {
    return [];
  }

  // Build a stream of units with page provenance
  interface ProvenanceWord {
    word: string;
    page: number;
  }

  const allWordsWithPages: ProvenanceWord[] = [];
  
  for (const page of pages) {
    const words = page.text.trim().split(/\s+/).filter(Boolean);
    for (const w of words) {
      allWordsWithPages.push({ word: w, page: page.pageNumber });
    }
  }

  if (allWordsWithPages.length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let startIndex = 0;
  const totalWords = allWordsWithPages.length;

  while (startIndex < totalWords) {
    let endIndex = Math.min(startIndex + targetWords, totalWords);

    // If respect sentences is on and we are not at the very end of document,
    // look ahead or behind slightly to find a sentence ending punctuation
    if (respectSentences && endIndex < totalWords) {
      // Look within a window of ±35 words for sentence boundary (., !, ?)
      let bestBreak = endIndex;
      let minDistance = 999;
      const searchStart = Math.max(startIndex + targetWords - 40, startIndex + 100);
      const searchEnd = Math.min(startIndex + targetWords + 40, totalWords);

      for (let i = searchStart; i < searchEnd; i++) {
        const word = allWordsWithPages[i].word;
        if (/[.!?]["']?$/.test(word)) {
          const dist = Math.abs(i - (startIndex + targetWords));
          if (dist < minDistance) {
            minDistance = dist;
            bestBreak = i + 1;
          }
        }
      }
      endIndex = bestBreak;
    }

    const chunkWords = allWordsWithPages.slice(startIndex, endIndex);
    const chunkText = chunkWords.map(item => item.word).join(' ');
    const actualWordCount = chunkWords.length;
    const startPage = chunkWords[0].page;
    const endPage = chunkWords[chunkWords.length - 1].page;
    const chunkIndex = chunks.length;

    // Generate deterministic chunk ID
    const sanitizedTitle = bookTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const id = `${sanitizedTitle}_chunk_${String(chunkIndex).padStart(4, '0')}`;

    chunks.push({
      id,
      text: chunkText,
      metadata: {
        bookTitle,
        chunkIndex,
        totalChunks: 0, // updated after all chunks created
        wordCount: actualWordCount,
        charCount: chunkText.length,
        startPage,
        endPage,
        estimatedTokens: Math.round(actualWordCount * 1.33),
        timestamp: new Date().toISOString(),
      },
    });

    // Advance startIndex by (endIndex - startIndex - overlapWords)
    const step = Math.max(1, (endIndex - startIndex) - overlapWords);
    startIndex += step;

    // Prevent infinite loop if step doesn't advance
    if (endIndex >= totalWords) {
      break;
    }
  }

  // Update totalChunks in metadata
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  return chunks;
}

/**
 * Chunks plain text into ~500 word chunks
 */
export function chunkPlainText(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  return chunkBookPages([{ pageNumber: 1, text }], options);
}
