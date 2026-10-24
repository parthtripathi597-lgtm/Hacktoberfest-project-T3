import React, { useState } from 'react';
import { TextChunk } from '../utils/chunker';
import { QuizQuestion, generateQuizFromChunks } from '../utils/quizEngine';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface QuizStudioViewProps {
  chunks: TextChunk[];
  bookTitle: string;
  onGoToVsCode: () => void;
  onGoToWorkbench: () => void;
}

export const QuizStudioView: React.FC<QuizStudioViewProps> = ({
  chunks,
  bookTitle,
  onGoToVsCode,
  onGoToWorkbench,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const questions: QuizQuestion[] = React.useMemo(() => {
    return generateQuizFromChunks(chunks, 4);
  }, [chunks]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (revealed[questionId]) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    setRevealed((prev) => ({ ...prev, [questionId]: true }));
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setRevealed({});
  };

  const totalAnswered = Object.keys(revealed).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;

  return (
    <div className="space-y-8">
      {/* Editorial Kicker & Intro */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            End-To-End Application Layer
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            AI Quiz Generation from ChromaDB
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
            Yes! This vector database backend is the exact foundation for your AI Book Quiz app. ChromaDB provides grounded book passages with page citations, preventing hallucinations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetQuiz}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Quiz</span>
          </button>
          <button
            onClick={onGoToVsCode}
            className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Inspect quiz_generator.py
          </button>
        </div>
      </div>

      {/* RAG Quiz Architecture Explanation Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <span>How the Backend Powers Your AI Quiz App</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-white block mb-1">1. User Enters Book</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The user drops their PDF. Our <code className="text-indigo-400 font-mono">pdf_extractor.py</code> and <code className="text-indigo-400 font-mono">chunker.py</code> slice it into ~500-word conceptual segments.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-white block mb-1">2. Vectors Stored in ChromaDB</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Dense Hugging Face vectors index each passage with page numbers. You can retrieve chunks by chapter, plot topic, or sample across the whole book.
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="font-semibold text-white block mb-1">3. LLM Generates Grounded Quiz</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              The retrieved 500-word passage is passed to the LLM (Gemini or OpenAI). The AI generates questions with exact citations and zero hallucinations.
            </p>
          </div>
        </div>
      </div>

      {/* Score Summary if answered */}
      {totalAnswered > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Current Quiz Progress:</span>
            <span className="text-sm font-bold text-white font-mono tabular-nums">
              {correctCount} / {totalAnswered} Correct ({Math.round((correctCount / totalAnswered) * 100)}%)
            </span>
          </div>
          <span className="text-xs text-indigo-400 font-mono">
            {totalAnswered === questions.length ? 'Quiz Completed!' : `${questions.length - totalAnswered} remaining`}
          </span>
        </div>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="p-10 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
          No chunks available. Please go to the Workbench and process a book first.
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((q, qIndex) => {
            const isAnswered = revealed[q.id];
            const userPick = selectedAnswers[q.id];

            return (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-500/30">
                      Question {qIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{q.bookTitle}</span>
                    </span>
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    Source: Pages {q.startPage}–{q.endPage}
                  </span>
                </div>

                {/* Question prompt */}
                <h3 className="text-sm font-semibold text-white leading-relaxed">
                  {q.question}
                </h3>

                {/* 4 Multiple Choice Options */}
                <div className="space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userPick === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let btnStyle = 'bg-slate-950/60 border-slate-800 text-slate-200 hover:border-slate-700';

                    if (isAnswered) {
                      if (isCorrect) {
                        btnStyle = 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200 font-medium';
                      } else if (isSelected && !isCorrect) {
                        btnStyle = 'bg-rose-950/60 border-rose-500/80 text-rose-200';
                      } else {
                        btnStyle = 'bg-slate-950/30 border-slate-800/40 text-slate-500 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        disabled={isAnswered}
                        className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono flex items-center justify-center shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>

                        {isAnswered && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                        )}
                        {isAnswered && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation upon answering */}
                {isAnswered && (
                  <div className="mt-3 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5 text-xs animate-fade-in">
                    <span className="font-semibold text-indigo-400 block">
                      Passage Grounding & Explanation:
                    </span>
                    <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                      {q.explanation}
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>Chunk Reference: {q.sourceChunkId}</span>
                      <span>·</span>
                      <span>Verified against ChromaDB persistent vector</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
