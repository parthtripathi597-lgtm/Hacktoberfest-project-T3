import React from 'react';
import {
  FileText,
  Scissors,
  Cpu,
  Database,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  BookOpen,
} from 'lucide-react';

interface ArchitectureViewProps {
  onGoToWorkbench: () => void;
  onGoToVsCode: () => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  onGoToWorkbench,
  onGoToVsCode,
}) => {
  return (
    <div className="space-y-10">
      {/* Editorial Kicker & Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            System Design & Engineering
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Pipeline Architecture & Mathematical Vectors
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            A breakdown of each stage: PDF text parsing, semantic ~500-word window chunking, dense vector transformation via Hugging Face, and persistent ChromaDB storage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToWorkbench}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
          >
            Launch Workbench
          </button>
          <button
            onClick={onGoToVsCode}
            className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Get VS Code Files
          </button>
        </div>
      </div>

      {/* 4-Stage Visual Pipeline Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stage 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500 block">Stage 01</span>
              <h3 className="text-sm font-bold text-white mt-0.5">PDF Extraction</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Reads book PDFs page by page via <code className="text-indigo-400 font-mono">pypdf</code>. Repairs hyphenated cross-line words, normalizes whitespace, and tags source page numbers.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Output: Raw page texts with page metadata
          </div>
        </div>

        {/* Stage 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500 block">Stage 02</span>
              <h3 className="text-sm font-bold text-white mt-0.5">500-Word Chunking</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Partitions stream into target ~500 word blocks. Evaluates punctuation to preserve sentence integrity. Adds a 50-word context overlap to prevent boundary truncation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Output: Chunks with word count & start/end pages
          </div>
        </div>

        {/* Stage 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500 block">Stage 03</span>
              <h3 className="text-sm font-bold text-white mt-0.5">Hugging Face Vectors</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Encodes chunks into dense mathematical vectors (384-D or 768-D) using <code className="text-indigo-400 font-mono">sentence-transformers</code>. Normalizes vectors with L2 unit norm.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Output: 384-dimensional float32 arrays
          </div>
        </div>

        {/* Stage 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500 block">Stage 04</span>
              <h3 className="text-sm font-bold text-white mt-0.5">ChromaDB Storage</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Persists embeddings and metadata into a local disk-backed Chroma collection. Builds an HNSW index for sub-millisecond approximate nearest neighbor (ANN) retrieval.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-500">
            Output: Persistent SQLite/HNSW vector store
          </div>
        </div>
      </div>

      {/* Why ~500 Words is Ideal for Books */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Why ~500 Words is the Gold Standard for Book Ingestion</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              1. Narrative Context Preservation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In literature, philosophy, and history, arguments and narrative arcs unfold across multiple paragraphs. A 100-word chunk loses rhetorical momentum, while a 500-word chunk captures complete scenes, character dialogues, or strategic doctrines.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              2. Transformer Context Fit
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              500 words corresponds to ~650–700 tokens, perfectly matching modern 512–1024 token embedding windows of Hugging Face transformer models like <code className="text-indigo-400 font-mono">all-MiniLM-L6-v2</code> without overflowing the context length.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-200">
              3. High Semantic Signal-to-Noise
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dense vector embeddings of ~500 words provide sufficient vocabulary density for high cosine separation between themes (e.g. strategic retreat vs offensive siege in Sun Tzu).
            </p>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-semibold text-white">
              Hugging Face Embedding Model Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select the best trade-off between speed, memory footprint, and retrieval accuracy
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Model Identifier</th>
                <th className="py-2.5 px-3">Dimensions</th>
                <th className="py-2.5 px-3">Model Size</th>
                <th className="py-2.5 px-3">Speed (CPU/GPU)</th>
                <th className="py-2.5 px-3">Best Use Case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-slate-300">
              <tr className="hover:bg-slate-950/40">
                <td className="py-3 px-3 text-white font-semibold">
                  sentence-transformers/all-MiniLM-L6-v2
                </td>
                <td className="py-3 px-3 text-indigo-400">384</td>
                <td className="py-3 px-3">80 MB</td>
                <td className="py-3 px-3 text-emerald-400">Ultra-Fast (~15ms)</td>
                <td className="py-3 px-3 font-sans text-slate-400">
                  Recommended for local laptops & fast PDF ingestion
                </td>
              </tr>
              <tr className="hover:bg-slate-950/40">
                <td className="py-3 px-3 text-white font-semibold">
                  BAAI/bge-small-en-v1.5
                </td>
                <td className="py-3 px-3 text-indigo-400">384</td>
                <td className="py-3 px-3">130 MB</td>
                <td className="py-3 px-3 text-emerald-400">Fast (~20ms)</td>
                <td className="py-3 px-3 font-sans text-slate-400">
                  High MTEB benchmark score, balanced size
                </td>
              </tr>
              <tr className="hover:bg-slate-950/40">
                <td className="py-3 px-3 text-white font-semibold">
                  sentence-transformers/all-mpnet-base-v2
                </td>
                <td className="py-3 px-3 text-indigo-400">768</td>
                <td className="py-3 px-3">420 MB</td>
                <td className="py-3 px-3 text-amber-400">Moderate (~60ms)</td>
                <td className="py-3 px-3 font-sans text-slate-400">
                  Maximum semantic accuracy for deep research & RAG
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
