import React, { useState } from 'react';
import { Search, Database, Sparkles, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { ChromaQueryResult } from '../utils/vectorMath';
import { ChunkMetadata } from '../utils/chunker';

interface SemanticSearchViewProps {
  onSearch: (query: string, nResults: number) => ChromaQueryResult<ChunkMetadata>[];
  chromaCount: number;
  onGoToWorkbench: () => void;
  onGoToVsCode: () => void;
}

const PRESET_QUERIES = [
  'Creature awakening with yellow eye and convulsions',
  'Supreme excellence consists in breaking enemy resistance without fighting',
  'White rabbit with waistcoat and pocket watch',
  'Chemical instruments and natural philosophy at Ingolstadt',
  'All warfare is based on deception and feigned disorder',
  'Falling down the rabbit hole past shelves and marmalade jars',
];

export const SemanticSearchView: React.FC<SemanticSearchViewProps> = ({
  onSearch,
  chromaCount,
  onGoToWorkbench,
  onGoToVsCode,
}) => {
  const [query, setQuery] = useState('');
  const [nResults, setNResults] = useState(3);
  const [results, setResults] = useState<ChromaQueryResult<ChunkMetadata>[] | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleExecuteSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim() || isSearching) return;
    setSearchError(null);
    setIsSearching(true);
    setSearchedQuery(searchQuery);

    // Simulate fast vector calculation and query
    setTimeout(() => {
      try {
        const searchResults = onSearch(searchQuery, nResults);
        setResults(searchResults);
      } catch (error: unknown) {
        setResults(null);
        setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 120);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Kicker & Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Vector Retrieval Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            ChromaDB Semantic Query Playground
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Pass natural language queries through the Hugging Face embedding model, generate a query vector, and execute a cosine similarity nearest-neighbor lookup across stored book chunks.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>ChromaDB Vectors:</span>
          <span className="text-emerald-400 font-bold tabular-nums">{chromaCount}</span>
        </div>
      </div>

      {chromaCount === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-white">ChromaDB Store is Currently Empty</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please run the pipeline chunker in the Workbench to vectorize and populate ChromaDB with ~500-word book passages before executing queries.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoToWorkbench}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <span>Go to Pipeline Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search Bar Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleExecuteSearch();
                  }}
                  placeholder="Enter a concept, scene, question, or quote..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={nResults}
                  onChange={(e) => setNResults(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>Top 1 chunk</option>
                  <option value={3}>Top 3 chunks</option>
                  <option value={5}>Top 5 chunks</option>
                  <option value={10}>Top 10 chunks</option>
                </select>

                <button
                  onClick={() => handleExecuteSearch()}
                  disabled={!query.trim() || isSearching}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSearching ? 'Vector Searching...' : 'Vector Search'}</span>
                </button>
              </div>
            </div>

            {/* Preset Query Chips */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-mono text-slate-400">
                Quick Test Prompts (Semantic Concept Matches):
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESET_QUERIES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(preset);
                      handleExecuteSearch(preset);
                    }}
                    className="text-xs text-slate-300 bg-slate-950/70 hover:bg-slate-800 hover:text-white border border-slate-800 px-2.5 py-1 rounded transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {searchError && <p role="alert" className="text-sm text-rose-400">{searchError}</p>}

          {/* Results List */}
          {results && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex flex-wrap break-words items-center gap-2 text-xs text-slate-300">
                  <span>Retrieved</span>
                  <span className="font-bold text-white font-mono">{results.length}</span>
                  <span>chunks for:</span>
                  <span className="text-indigo-400 italic">"{searchedQuery}"</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Ranked by Cosine Similarity
                </span>
              </div>

              {results.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs">
                  No matching chunks found in ChromaDB collection.
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map((res, index) => {
                    const simPercent = Math.max(0, Math.min(100, Math.round(res.similarity * 1000) / 10));
                    return (
                      <div
                        key={res.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 hover:border-slate-700 transition-colors"
                      >
                        {/* Header bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                              #{index + 1} Match
                            </span>
                            <div className="flex items-center gap-2 text-xs font-medium text-white">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                              <span>{res.metadata.bookTitle}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                            <span className="text-slate-400">
                              Pages {res.metadata.startPage}–{res.metadata.endPage}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">
                              {res.metadata.wordCount} words
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-400 font-bold tabular-nums">
                              {simPercent}% Match (Cosine)
                            </span>
                          </div>
                        </div>

                        {/* Chunk text payload */}
                        <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans bg-slate-950 p-4 rounded-lg border border-slate-800/60 max-h-56 overflow-y-auto whitespace-pre-wrap">
                          {res.document}
                        </div>

                        {/* Provenance Footer */}
                        <div className="flex flex-wrap break-all gap-2 items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                          <span>Chunk ID: {res.id}</span>
                          <span>Chroma Distance Metric: {res.distance.toFixed(4)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quick instructions for executing this in VS Code */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div>
              <span className="text-slate-200 font-medium block">
                Want to query this in your terminal?
              </span>
              <span>
                Use the generated <code className="text-indigo-400 font-mono">query_search.py</code> script inside your VS Code project.
              </span>
            </div>
            <button
              onClick={onGoToVsCode}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Inspect Python code</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
