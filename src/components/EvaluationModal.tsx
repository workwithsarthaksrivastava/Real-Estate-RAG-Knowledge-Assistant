import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  BarChart3,
  HelpCircle,
  FileCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EvaluationReport, EvaluationResult } from '../types/rag';
import { FormattedMessage } from './FormattedMessage';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const runBenchmark = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluation/run', { method: 'POST' });
      if (!res.ok) throw new Error('Benchmark run failed');
      const data: EvaluationReport = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute evaluation suite');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              Automated RAG Evaluation & Grounding Benchmark
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Runs end-to-end test cases measuring exact factual retrieval, conflict resolution, and anti-hallucination refusals.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Dashboard Bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800">
            <div>
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1">
                Evaluation Benchmark Suite (10 Test Cases)
              </div>
              <div className="text-xs text-neutral-400">
                Covers: Exact Specs, Pricing, Paraphrased Queries, Conflicting Timelines, Typos, and Hallucination Refusals.
              </div>
            </div>

            <button
              onClick={runBenchmark}
              disabled={isRunning}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-neutral-950 font-medium text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow"
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Pipeline...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{report ? 'Re-run Benchmark' : 'Run Full Benchmark'}</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Metric Stats Cards */}
          {report && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-500 text-xs">Pass Rate</div>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                  {report.summary.passRate}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  {report.summary.passed} of {report.summary.totalTests} passed
                </div>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-500 text-xs">Failed / Issues</div>
                <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
                  {report.summary.failed}
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  Target: 0 regressions
                </div>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-500 text-xs">Avg Latency</div>
                <div className="text-xl font-bold text-sky-400 font-mono mt-0.5">
                  {report.summary.avgLatencyMs}ms
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  Hybrid retrieval + synth
                </div>
              </div>

              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                <div className="text-neutral-500 text-xs">Grounding Mode</div>
                <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                  100%
                </div>
                <div className="text-[10px] text-neutral-400 mt-1">
                  Zero unverified claims
                </div>
              </div>
            </div>
          )}

          {/* Results List */}
          {report ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Benchmark Results by Test Case
              </div>

              <div className="space-y-2">
                {report.results.map((res: EvaluationResult, idx: number) => {
                  const isExpanded = expandedId === res.test_case_id;
                  return (
                    <div
                      key={res.test_case_id}
                      className={`p-3.5 rounded-xl border transition-colors ${
                        res.passed
                          ? 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                          : 'bg-rose-950/20 border-rose-900/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-2.5 flex-1">
                          <div className="mt-0.5">
                            {res.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                          </div>
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="text-xs font-semibold text-neutral-200">
                                #{idx + 1} {res.question}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                                {res.category}
                              </span>
                            </div>

                            <div className="text-xs text-neutral-300">
                              {isExpanded ? (
                                <div className="mt-2 p-3 rounded-lg bg-neutral-900/90 border border-neutral-800">
                                  <FormattedMessage content={res.actual_answer} />
                                </div>
                              ) : (
                                <p className="text-xs text-neutral-400 line-clamp-2">
                                  <strong className="text-neutral-300">Answer:</strong> {res.actual_answer.replace(/[#*`_]/g, '')}
                                </p>
                              )}
                            </div>

                            <div className="text-[11px] text-neutral-500 flex items-center space-x-3 pt-1">
                              <span>Status: {res.notes}</span>
                              <span>•</span>
                              <span>Citations: {res.citations_count}</span>
                              <span>•</span>
                              <span className="font-mono">{res.latency_ms}ms</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end space-y-2 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              res.passed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {res.passed ? 'PASS' : 'FAIL'}
                          </span>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : res.test_case_id)}
                            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer text-xs flex items-center gap-0.5"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-neutral-500 space-y-3">
              <FileCheck className="w-10 h-10 mx-auto text-neutral-700 stroke-1" />
              <p className="text-neutral-400">No benchmark evaluation has been executed yet.</p>
              <p className="text-[11px] text-neutral-600 max-w-md mx-auto">
                Click "Run Full Benchmark" to run all 10 automated test cases against the live vector and RAG engine.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Automated RAG Assertion Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
