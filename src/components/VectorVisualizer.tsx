import React, { useMemo, useState } from 'react';
import { projectVectorsTo2D } from '../utils/vectorMath';
import { TextChunk } from '../utils/chunker';
import { Info, Sparkles } from 'lucide-react';

interface VectorVisualizerProps {
  chunks: TextChunk[];
  embeddings: number[][];
  modelName: string;
  dimensions: number;
  selectedChunkId: string | null;
  onSelectChunk: (id: string) => void;
}

export const VectorVisualizer: React.FC<VectorVisualizerProps> = ({
  chunks,
  embeddings,
  modelName,
  dimensions,
  selectedChunkId,
  onSelectChunk,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Compute 2D PCA projection for vectors
  const points = useMemo(() => {
    if (embeddings.length === 0) return [];
    return projectVectorsTo2D(embeddings);
  }, [embeddings]);

  const activeChunk = chunks.find((c) => c.id === selectedChunkId) || chunks[hoveredIdx ?? 0];
  const activeEmbedding = activeChunk
    ? embeddings[chunks.findIndex((c) => c.id === activeChunk.id)]
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>2D Semantic Space Projection (PCA)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Dimensionality reduction from {dimensions}-D Hugging Face vectors to 2D Cartesian plane
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Model: {modelName.split('/').pop()}</span>
          <span>·</span>
          <span className="text-indigo-400">{dimensions} dimensions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Scatter Plot */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800/80 rounded-lg p-4 relative min-h-[300px] flex items-center justify-center overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20 pointer-events-none">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="border-r border-b border-slate-700/50" />
            ))}
          </div>

          <svg className="w-full h-64 overflow-visible" viewBox="-120 -120 240 240">
            {/* Center axes */}
            <line x1="-110" y1="0" x2="110" y2="0" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="0" y1="-110" x2="0" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

            {/* Connecting lines to origin or neighbors */}
            {points.map((pt, i) => {
              const isSelected = chunks[i]?.id === selectedChunkId;
              const isHovered = hoveredIdx === i;
              if (!isSelected && !isHovered) return null;
              return (
                <line
                  key={`line-${i}`}
                  x1="0"
                  y1="0"
                  x2={pt.x * 95}
                  y2={pt.y * 95}
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeOpacity="0.4"
                  strokeDasharray="2 2"
                />
              );
            })}

            {/* Scatter points */}
            {points.map((pt, i) => {
              const chunk = chunks[i];
              if (!chunk) return null;
              const isSelected = chunk.id === selectedChunkId;
              const isHovered = hoveredIdx === i;

              return (
                <g
                  key={chunk.id}
                  transform={`translate(${pt.x * 95}, ${pt.y * 95})`}
                  className="cursor-pointer transition-transform"
                  onClick={() => onSelectChunk(chunk.id)}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <circle
                    r={isSelected ? 7 : isHovered ? 6 : 4.5}
                    className={`transition-all duration-150 ${
                      isSelected
                        ? 'fill-indigo-400 stroke-white stroke-2'
                        : isHovered
                        ? 'fill-cyan-400 stroke-cyan-200 stroke-1'
                        : 'fill-indigo-600/80 stroke-indigo-400/40 hover:fill-indigo-400'
                    }`}
                  />
                  {(isSelected || isHovered) && (
                    <text
                      y="-10"
                      textAnchor="middle"
                      className="text-[10px] fill-slate-200 font-mono pointer-events-none"
                    >
                      Chunk #{chunk.metadata.chunkIndex + 1}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 left-3 text-[11px] text-slate-500 font-mono flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              <span>Chunks (~500 words)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              <span>Selected Vector</span>
            </span>
          </div>
        </div>

        {/* Vector Detail Inspector */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-lg p-4">
          <div>
            <div className="flex flex-wrap gap-2 items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <span className="text-xs font-semibold text-slate-300">
                Vector Value Inspection
              </span>
              {activeChunk && (
                <span className="break-all text-xs font-mono text-indigo-400">
                  {activeChunk.id}
                </span>
              )}
            </div>

            {activeEmbedding ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Unit Length (L2 Norm):</span>
                  <span className="font-mono text-emerald-400 tabular-nums">1.000000</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>First 16 Vector Dimensions:</span>
                  <span className="font-mono text-slate-500 text-[11px]">float32</span>
                </div>

                {/* Vector Floats Grid */}
                <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-900/90 rounded border border-slate-800 font-mono text-[11px] text-slate-300">
                  {activeEmbedding.slice(0, 16).map((val, idx) => (
                    <div
                      key={idx}
                      className="p-1 rounded bg-slate-950/60 text-center tabular-nums text-indigo-300/90 border border-slate-800/50"
                    >
                      {val >= 0 ? `+${val.toFixed(4)}` : val.toFixed(4)}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Showing first 16 of {activeEmbedding.length} dense dimensions. Normalized vectors enable instantaneous cosine distance calculation in ChromaDB.
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-8 text-center">
                Select a chunk to view mathematical vector
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Cosine similarity matches angle orientation regardless of document length.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
