import React from 'react';
import { Download, Terminal } from 'lucide-react';
import { downloadProjectZip } from '../utils/vscodeProjectTemplate';

export type ActiveTab = 'workbench' | 'quiz' | 'search' | 'vscode' | 'architecture';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  chromaCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, chromaCount }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onTabChange('workbench');
            }}
            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-white hover:text-indigo-300 transition-colors whitespace-nowrap"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-sm">
              <Terminal className="w-4 h-4" />
            </div>
            <span>BookVector Chroma</span>
          </a>
        </div>

        {/* Zone 2: 5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => onTabChange('workbench')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'workbench'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Workbench
          </button>
          <button
            onClick={() => onTabChange('quiz')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'quiz'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Quiz Studio
          </button>
          <button
            onClick={() => onTabChange('search')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-2 ${
              activeTab === 'search'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <span>Vector Search</span>
            {chromaCount > 0 && (
              <span className="text-xs font-mono text-indigo-400 tabular-nums">
                ({chromaCount})
              </span>
            )}
          </button>
          <button
            onClick={() => onTabChange('vscode')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'vscode'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            VS Code Project
          </button>
          <button
            onClick={() => onTabChange('architecture')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'architecture'
                ? 'text-white border-indigo-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Architecture
          </button>
        </nav>

        {/* Zone 3: 1 primary action button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => downloadProjectZip()}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 active:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download VS Code Zip</span>
          </button>
        </div>
      </div>
    </header>
  );
};
