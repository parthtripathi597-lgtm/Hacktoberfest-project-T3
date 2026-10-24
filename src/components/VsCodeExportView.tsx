import React, { useState } from 'react';
import {
  VS_CODE_PROJECT_FILES,
  ProjectFile,
  downloadProjectZip,
} from '../utils/vscodeProjectTemplate';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Folder,
  Terminal,
  ExternalLink,
  BookMarked,
  CheckCircle,
} from 'lucide-react';

export const VsCodeExportView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<ProjectFile>(VS_CODE_PROJECT_FILES[1]); // Default to config.py or ingest_pipeline.py
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopyFile = (file: ProjectFile) => {
    navigator.clipboard.writeText(file.content);
    setCopiedFile(file.name);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleCopySnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Editorial Kicker & Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            VS Code Ready Project Files
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Production Python Pipeline Files
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Copy and paste these files directly into your VS Code project folder or download the entire configured repository as a zip archive.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadProjectZip()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Project (.ZIP)</span>
          </button>
        </div>
      </div>

      {/* Quick Terminal Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 text-xs flex items-center justify-center font-mono border border-indigo-500/30">
                  1
                </span>
                <span>Virtual Environment</span>
              </span>
              <button
                onClick={() =>
                  handleCopySnippet(
                    'python3 -m venv venv && source venv/bin/activate',
                    'venv'
                  )
                }
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy Command"
              >
                {copiedSnippet === 'venv' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Create an isolated Python 3 environment in your project.
            </p>
          </div>
          <pre className="mt-3 p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
            python3 -m venv venv && source venv/bin/activate
          </pre>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 text-xs flex items-center justify-center font-mono border border-indigo-500/30">
                  2
                </span>
                <span>Install Dependencies</span>
              </span>
              <button
                onClick={() =>
                  handleCopySnippet('pip install -r requirements.txt', 'install')
                }
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy Command"
              >
                {copiedSnippet === 'install' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Installs ChromaDB, Sentence-Transformers, and PyPDF.
            </p>
          </div>
          <pre className="mt-3 p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
            pip install -r requirements.txt
          </pre>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-400 text-xs flex items-center justify-center font-mono border border-indigo-500/30">
                  3
                </span>
                <span>Run Ingestion</span>
              </span>
              <button
                onClick={() =>
                  handleCopySnippet('python ingest_pipeline.py', 'run')
                }
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy Command"
              >
                {copiedSnippet === 'run' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Drops PDFs in <code className="text-indigo-400">books/</code> and executes chunking + embedding.
            </p>
          </div>
          <pre className="mt-3 p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
            python ingest_pipeline.py
          </pre>
        </div>
      </div>

      {/* Main File Explorer & Code Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left: Project File Tree */}
        <div className="lg:col-span-4 border-r border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                <span>VS Code Workspace Files</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {VS_CODE_PROJECT_FILES.length} files
              </span>
            </div>

            <div className="space-y-1">
              {/* Virtual folder indicator */}
              <div className="text-[11px] font-mono text-slate-500 px-2 py-1 flex items-center gap-1.5">
                <Folder className="w-3 h-3 text-slate-600" />
                <span>books/ (drop PDFs here)</span>
              </div>

              {VS_CODE_PROJECT_FILES.map((file) => {
                const isSelected = selectedFile.name === file.name;
                return (
                  <button
                    key={file.name}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                      isSelected
                        ? 'bg-indigo-950/70 text-white font-medium border border-indigo-500/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-indigo-400' : 'text-slate-500'
                        }`}
                      />
                      <span className="font-mono truncate">{file.name}</span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {file.language}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <button
              onClick={() => downloadProjectZip()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Entire Project ZIP</span>
            </button>
          </div>
        </div>

        {/* Right: Code Viewer & Copy */}
        <div className="lg:col-span-8 bg-slate-950 flex flex-col justify-between">
          <div>
            {/* Header with filename, language, and Copy button */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold text-white">
                  {selectedFile.path}
                </span>
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  — {selectedFile.description}
                </span>
              </div>

              <button
                onClick={() => handleCopyFile(selectedFile)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                {copiedFile === selectedFile.name ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content Container */}
            <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed text-slate-300">
              <pre>
                <code>{selectedFile.content}</code>
              </pre>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{selectedFile.content.split('\n').length} lines · UTF-8</span>
            <span>Paste directly into your VS Code workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
};
