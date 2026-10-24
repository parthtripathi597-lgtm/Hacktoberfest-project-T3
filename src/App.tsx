/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { WorkbenchView } from './components/WorkbenchView';
import { SemanticSearchView } from './components/SemanticSearchView';
import { VsCodeExportView } from './components/VsCodeExportView';
import { ArchitectureView } from './components/ArchitectureView';
import { SAMPLE_BOOKS, SampleBook } from './data/sampleBooks';
import { chunkBookPages, TextChunk, ChunkMetadata } from './utils/chunker';
import {
  generateSimulatedEmbedding,
  ChromaCollectionSimulator,
  ChromaQueryResult,
} from './utils/vectorMath';
import { extractTextFromPdfFile } from './utils/pdfExtractor';

import { QuizStudioView } from './components/QuizStudioView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workbench');
  const [currentBook, setCurrentBook] = useState<SampleBook>(SAMPLE_BOOKS[0]);
  const [targetWords, setTargetWords] = useState<number>(500);
  const [overlapWords, setOverlapWords] = useState<number>(50);
  const [respectSentences, setRespectSentences] = useState<boolean>(true);
  const [selectedModel, setSelectedModel] = useState<string>(
    'sentence-transformers/all-MiniLM-L6-v2'
  );
  const [isExtractingPdf, setIsExtractingPdf] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncedToChroma, setSyncedToChroma] = useState<boolean>(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // ChromaDB in-memory simulator instance
  const chromaStore = useMemo(() => {
    return new ChromaCollectionSimulator<ChunkMetadata>('book_knowledge_base');
  }, []);

  const [chromaCount, setChromaCount] = useState<number>(0);

  // Compute chunks whenever book or parameters change
  const chunks: TextChunk[] = useMemo(() => {
    return chunkBookPages(currentBook.pages, {
      targetWords,
      overlapWords,
      respectSentences,
      bookTitle: currentBook.title,
    });
  }, [currentBook, targetWords, overlapWords, respectSentences]);

  // Compute mathematical embeddings for the chunks
  const dimensions = selectedModel.includes('mpnet') ? 768 : 384;
  const embeddings: number[][] = useMemo(() => {
    return chunks.map((chunk) =>
      generateSimulatedEmbedding(chunk.text, dimensions)
    );
  }, [chunks, dimensions]);

  // Initial sync of the first book to ChromaDB so search works immediately out-of-the-box
  useEffect(() => {
    if (chunks.length > 0 && chromaStore.count() === 0) {
      chromaStore.add({
        ids: chunks.map((c) => c.id),
        embeddings: embeddings,
        metadatas: chunks.map((c) => c.metadata),
        documents: chunks.map((c) => c.text),
      });
      setChromaCount(chromaStore.count());
      setSyncedToChroma(true);
    }
  }, [chunks, embeddings, chromaStore]);

  // Reset synced state when book or chunk parameters change
  useEffect(() => {
    setSyncedToChroma(false);
  }, [currentBook.id, targetWords, overlapWords, respectSentences, selectedModel]);

  // Sync current chunks & vectors to ChromaDB
  const handleSyncToChroma = () => {
    setIsSyncing(true);
    setTimeout(() => {
      chromaStore.add({
        ids: chunks.map((c) => c.id),
        embeddings: embeddings,
        metadatas: chunks.map((c) => c.metadata),
        documents: chunks.map((c) => c.text),
      });
      setChromaCount(chromaStore.count());
      setIsSyncing(false);
      setSyncedToChroma(true);
      showNotification(`Successfully stored ${chunks.length} vectors in ChromaDB!`);
    }, 250);
  };

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  // Upload user PDF file
  const handleUploadPdf = async (file: File) => {
    setIsExtractingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/process-pdf', {
        method: 'POST',
        body: formData,
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const detail =
          typeof result === 'object' && result !== null && 'detail' in result
            ? result.detail
            : undefined;
        throw new Error(
          typeof detail === 'string' ? detail : `PDF upload failed (${response.status})`
        );
      }

      if (
        typeof result !== 'object' ||
        result === null ||
        !('status' in result) ||
        result.status !== 'ok' ||
        !('filename' in result) ||
        typeof result.filename !== 'string'
      ) {
        throw new Error('The backend returned an unexpected response while uploading the PDF.');
      }

      const extractedPages = await extractTextFromPdfFile(file);
      const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');

      const newBook: SampleBook = {
        id: `custom_${Date.now()}`,
        title: cleanTitle,
        author: 'Uploaded Document',
        year: new Date().getFullYear(),
        description: `Custom PDF document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        pages: extractedPages,
      };

      setCurrentBook(newBook);
      showNotification(
        `Uploaded "${result.filename}" and extracted ${extractedPages.length} pages`
      );
    } catch (err: any) {
      console.error(err);
      alert(
        err.message ||
          'PDF upload failed. Check that the backend is running and the file contains readable text.'
      );
    } finally {
      setIsExtractingPdf(false);
    }
  };

  // Search query executor
  const handleExecuteSearch = (
    query: string,
    nResults: number
  ): ChromaQueryResult<ChunkMetadata>[] => {
    const queryEmb = generateSimulatedEmbedding(query, dimensions);
    return chromaStore.query({
      queryEmbedding: queryEmb,
      nResults,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Global Top Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        chromaCount={chromaCount}
      />

      {/* Ephemeral Notification Banner */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in border border-emerald-400/40">
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'workbench' && (
          <WorkbenchView
            currentBook={currentBook}
            onSelectBook={setCurrentBook}
            onUploadPdf={handleUploadPdf}
            isExtractingPdf={isExtractingPdf}
            chunks={chunks}
            embeddings={embeddings}
            targetWords={targetWords}
            onTargetWordsChange={setTargetWords}
            overlapWords={overlapWords}
            onOverlapWordsChange={setOverlapWords}
            respectSentences={respectSentences}
            onRespectSentencesChange={setRespectSentences}
            selectedModel={selectedModel}
            onSelectedModelChange={setSelectedModel}
            onSyncToChroma={handleSyncToChroma}
            isSyncing={isSyncing}
            syncedToChroma={syncedToChroma}
            chromaCount={chromaCount}
            onGoToSearch={() => setActiveTab('search')}
            onGoToVsCode={() => setActiveTab('vscode')}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizStudioView
            chunks={chunks}
            bookTitle={currentBook.title}
            onGoToVsCode={() => setActiveTab('vscode')}
            onGoToWorkbench={() => setActiveTab('workbench')}
          />
        )}

        {activeTab === 'search' && (
          <SemanticSearchView
            onSearch={handleExecuteSearch}
            chromaCount={chromaCount}
            onGoToWorkbench={() => setActiveTab('workbench')}
            onGoToVsCode={() => setActiveTab('vscode')}
          />
        )}

        {activeTab === 'vscode' && <VsCodeExportView />}

        {activeTab === 'architecture' && (
          <ArchitectureView
            onGoToWorkbench={() => setActiveTab('workbench')}
            onGoToVsCode={() => setActiveTab('vscode')}
          />
        )}
      </main>

      {/* Anti-slop clean footer: no telemetry tickers, clean unboxed metadata */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">BookVector Chroma</span>
            <span>·</span>
            <span>PDF Chunker, Hugging Face Vectors & ChromaDB Vector Store</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('workbench')}
              className="hover:text-slate-200 transition-colors"
            >
              Workbench
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className="hover:text-slate-200 transition-colors"
            >
              Quiz Studio
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className="hover:text-slate-200 transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('vscode')}
              className="hover:text-slate-200 transition-colors"
            >
              VS Code Codebase
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className="hover:text-slate-200 transition-colors"
            >
              Architecture
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
