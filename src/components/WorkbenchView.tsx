import React, { useState } from 'react';
import { SAMPLE_BOOKS, SampleBook } from '../data/sampleBooks';
import { TextChunk } from '../utils/chunker';
import { VectorVisualizer } from './VectorVisualizer';
import {
  Upload,
  BookOpen,
  Sliders,
  Database,
  ArrowRight,
  FileText,
  Layers,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface WorkbenchViewProps {
  currentBook: SampleBook;
  onSelectBook: (book: SampleBook) => void;
  onUploadPdf: (file: File) => void;
  isExtractingPdf: boolean;
  chunks: TextChunk[];
  embeddings: number[][];
  targetWords: number;
  onTargetWordsChange: (words: number) => void;
  overlapWords: number;
  onOverlapWordsChange: (overlap: number) => void;
  respectSentences: boolean;
  onRespectSentencesChange: (val: boolean) => void;
  selectedModel: string;
  onSelectedModelChange: (model: string) => void;
  onSyncToChroma: () => void;
  isSyncing: boolean;
  syncedToChroma: boolean;
  chromaCount: number;
  onGoToSearch: () => void;
  onGoToVsCode: () => void;
}

export const WorkbenchView: React.FC<WorkbenchViewProps> = ({
  currentBook,
  onSelectBook,
  onUploadPdf,
  isExtractingPdf,
  chunks,
  embeddings,
  targetWords,
  onTargetWordsChange,
  overlapWords,
  onOverlapWordsChange,
  respectSentences,
  onRespectSentencesChange,
  selectedModel,
  onSelectedModelChange,
  onSyncToChroma,
  isSyncing,
  syncedToChroma,
  chromaCount,
  onGoToSearch,
  onGoToVsCode,
}) => {
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(
    chunks.length > 0 ? chunks[0].id : null
  );
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadPdf(e.target.files[0]);
    }
  };

  const selectedChunk = chunks.find((c) => c.id === selectedChunkId) || chunks[0];

  const handleCopyChunk = (chunk: TextChunk) => {
    navigator.clipboard.writeText(chunk.text);
    setCopiedChunkId(chunk.id);
    setTimeout(() => setCopiedChunkId(null), 2000);
  };

  const totalExtractedWords = currentBook.pages.reduce(
    (acc, p) => acc + p.text.trim().split(/\s+/).filter(Boolean).length,
    0
  );

  const avgWordsPerChunk =
    chunks.length > 0
      ? Math.round(chunks.reduce((acc, c) => acc + c.metadata.wordCount, 0) / chunks.length)
      : 0;

  const modelDim = selectedModel.includes('mpnet') ? 768 : 384;

  return (
    <div className="space-y-8">
      {/* Editorial Kicker & Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Pipeline Configuration & Execution
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Book Ingestion & Vector Generator
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Extracts PDF text, partitions into approximately 500-word sentence-safe chunks, transforms through Hugging Face transformer embeddings, and populates ChromaDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToVsCode}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap"
          >
            View Python Project Files
          </button>
          <button
            onClick={onSyncToChroma}
            disabled={isSyncing}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg shadow-sm transition-all whitespace-nowrap ${
              syncedToChroma
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700'
            }`}
          >
            {syncedToChroma ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synced to ChromaDB</span>
              </>
            ) : isSyncing ? (
              <span>Embedding & Syncing...</span>
            ) : (
              <>
                <Database className="w-3.5 h-3.5" />
                <span>Store in ChromaDB</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5">
          <span className="text-xs text-slate-400">Total Book Words</span>
          <p className="text-xl font-bold text-white font-mono tabular-nums mt-0.5">
            {totalExtractedWords.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Across {currentBook.pages.length} pages
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5">
          <span className="text-xs text-slate-400">Chunks Generated</span>
          <p className="text-xl font-bold text-indigo-400 font-mono tabular-nums mt-0.5">
            {chunks.length}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Target: ~{targetWords} words
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5">
          <span className="text-xs text-slate-400">Avg Words / Chunk</span>
          <p className="text-xl font-bold text-white font-mono tabular-nums mt-0.5">
            {avgWordsPerChunk}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Overlap: {overlapWords} words
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5">
          <span className="text-xs text-slate-400">Vector Dimensions</span>
          <p className="text-xl font-bold text-white font-mono tabular-nums mt-0.5">
            {modelDim}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Dense float32 L2
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-3.5">
          <span className="text-xs text-slate-400">ChromaDB Store</span>
          <p className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
            {chromaCount} vectors
          </p>
          <button
            onClick={onGoToSearch}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1 flex items-center gap-1 font-medium"
          >
            <span>Query collection</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Book Selector & Upload */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Select Book or Upload PDF</span>
            </h2>
            <span className="text-xs text-slate-400">Source Material</span>
          </div>

          {/* Sample Books List */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-300">Preset Sample Books</label>
            <div className="space-y-1.5">
              {SAMPLE_BOOKS.map((book) => {
                const isSelected = currentBook.id === book.id;
                return (
                  <button
                    key={book.id}
                    onClick={() => onSelectBook(book)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/80 text-white'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{book.title}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {book.pages.length} pages
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{book.author}</span>
                      <span>·</span>
                      <span>{book.year > 0 ? book.year : `${Math.abs(book.year)} BCE`}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PDF Drag & Drop Upload */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-medium text-slate-300">Upload a PDF to the backend</label>
            <label className="relative flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all group">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 mb-1.5 transition-colors" />
              <span className="text-xs font-medium text-slate-200">
                {isExtractingPdf
                  ? 'Uploading PDF and extracting text...'
                  : 'Click to select or drop PDF file'}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Saved by the API, then text is extracted in your browser
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileChange}
                disabled={isExtractingPdf}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Chunking & Model Tuning */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Pipeline Hyperparameters</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">config.py values</span>
          </div>

          <div className="space-y-5">
            {/* Target Words Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-200">
                  Target Words per Chunk: <span className="text-indigo-400 font-mono font-bold">~{targetWords} words</span>
                </label>
                <span className="text-slate-400 text-[11px]">User specification: ~500</span>
              </div>
              <input
                type="range"
                min="200"
                max="800"
                step="25"
                value={targetWords}
                onChange={(e) => onTargetWordsChange(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>200 words (fine-grained)</span>
                <span className="text-indigo-400 font-semibold">500 words (standard)</span>
                <span>800 words (broad context)</span>
              </div>
            </div>

            {/* Overlap Words Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-slate-200">
                  Context Overlap: <span className="text-indigo-400 font-mono font-bold">{overlapWords} words</span>
                </label>
                <span className="text-slate-400 text-[11px]">Prevents boundary context loss</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={overlapWords}
                onChange={(e) => onOverlapWordsChange(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 words</span>
                <span>50 words</span>
                <span>100 words</span>
              </div>
            </div>

            {/* Hugging Face Model Selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">
                Hugging Face Embedding Model
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'sentence-transformers/all-MiniLM-L6-v2',
                    name: 'all-MiniLM-L6-v2',
                    dim: '384-D',
                    note: 'Fast, lightweight (80MB), high efficiency',
                  },
                  {
                    id: 'BAAI/bge-small-en-v1.5',
                    name: 'bge-small-en-v1.5',
                    dim: '384-D',
                    note: 'Top MTEB benchmark score for size',
                  },
                  {
                    id: 'sentence-transformers/all-mpnet-base-v2',
                    name: 'all-mpnet-base-v2',
                    dim: '768-D',
                    note: 'Highest semantic quality & accuracy',
                  },
                  {
                    id: 'mixedbread-ai/mxbai-embed-large',
                    name: 'mxbai-embed-large',
                    dim: '1024-D',
                    note: 'State of the art large embedding',
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onSelectedModelChange(m.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedModel === m.id
                        ? 'bg-indigo-950/70 border-indigo-500 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span>{m.name}</span>
                      <span className="font-mono text-indigo-400 text-[11px]">{m.dim}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{m.note}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sentence Boundary Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-medium text-slate-200 block">
                  Preserve Sentence Boundaries
                </span>
                <span className="text-[11px] text-slate-400">
                  Breaks at periods/punctuation near target rather than slicing mid-sentence
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRespectSentencesChange(!respectSentences)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  respectSentences ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    respectSentences ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vector Space Projection */}
      <VectorVisualizer
        chunks={chunks}
        embeddings={embeddings}
        modelName={selectedModel}
        dimensions={modelDim}
        selectedChunkId={selectedChunkId}
        onSelectChunk={setSelectedChunkId}
      />

      {/* Generated Chunks Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Extracted Chunks Inspector ({chunks.length} total)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Examine exact word counts, page boundaries, and text payload for each vector record
            </p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Book: {currentBook.title}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Chunk Selection List */}
          <div className="lg:col-span-4 max-h-[460px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {chunks.map((chunk, idx) => {
              const isSelected = chunk.id === (selectedChunk?.id || chunks[0]?.id);
              return (
                <button
                  key={chunk.id}
                  onClick={() => setSelectedChunkId(chunk.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 text-white'
                      : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="font-mono text-indigo-400">
                      Chunk #{idx + 1}
                    </span>
                    <span className="font-mono tabular-nums text-slate-400">
                      {chunk.metadata.wordCount} words
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                    <span>Pages {chunk.metadata.startPage}–{chunk.metadata.endPage}</span>
                    <span>·</span>
                    <span>~{chunk.metadata.estimatedTokens} tokens</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {chunk.text}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Active Chunk Full Viewer */}
          <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
            {selectedChunk ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-indigo-400 font-bold">{selectedChunk.id}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300">{selectedChunk.metadata.wordCount} words</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">
                      Pages {selectedChunk.metadata.startPage}–{selectedChunk.metadata.endPage}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyChunk(selectedChunk)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded hover:border-slate-700 transition-colors"
                  >
                    {copiedChunkId === selectedChunk.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="max-h-[340px] overflow-y-auto text-xs sm:text-sm text-slate-200 leading-relaxed font-sans pr-2 custom-scrollbar whitespace-pre-wrap">
                  {selectedChunk.text}
                </div>

                {/* Metadata JSON preview */}
                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                    ChromaDB Ingestion Metadata Dictionary
                  </span>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                    {JSON.stringify(
                      {
                        book_title: selectedChunk.metadata.bookTitle,
                        chunk_index: selectedChunk.metadata.chunkIndex,
                        start_page: selectedChunk.metadata.startPage,
                        end_page: selectedChunk.metadata.endPage,
                        word_count: selectedChunk.metadata.wordCount,
                        char_count: selectedChunk.metadata.charCount,
                        estimated_tokens: selectedChunk.metadata.estimatedTokens,
                      },
                      null,
                      2
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                No chunks available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
