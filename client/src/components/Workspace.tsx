import React, { useState, useEffect } from 'react';
import {
  FileText,
  MessageSquare,
  Trash2,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  HelpCircle,
  Loader2,
  Cpu,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../data/sampleData';
import { ScopeAnalysisResult } from '../types/analysis';
import { AnalysisResults } from './AnalysisResults';
import { getApiEndpoint } from '../config/api';

interface WorkspaceProps {
  onBackToOverview: () => void;
  preselectedSampleIndex?: number | null;
}

type ErrorKind = 'unavailable' | 'timeout' | 'ratelimit' | 'validation' | 'generic';

function classifyError(msg: string): ErrorKind {
  const m = msg.toLowerCase();
  if (m.includes('unavailable') || m.includes('unreachable') || m.includes('econnrefused') || m.includes('ollama') || m.includes('ai service')) return 'unavailable';
  if (m.includes('timeout') || m.includes('timed out') || m.includes('504') || m.includes('408')) return 'timeout';
  if (m.includes('too many') || m.includes('rate limit') || m.includes('429')) return 'ratelimit';
  if (m.includes('validation') || m.includes('400') || m.includes('invalid')) return 'validation';
  return 'generic';
}

export const Workspace: React.FC<WorkspaceProps> = ({
  onBackToOverview,
  preselectedSampleIndex = null,
}) => {
  const [agreementText, setAgreementText] = useState('');
  const [requestText, setRequestText] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScopeAnalysisResult | null>(null);

  // Apply preselected sample if requested from landing page
  useEffect(() => {
    if (preselectedSampleIndex !== null && SAMPLE_DATASETS[preselectedSampleIndex]) {
      const sample = SAMPLE_DATASETS[preselectedSampleIndex];
      setAgreementText(sample.originalAgreement);
      setRequestText(sample.clientRequest);
      setAnalysisResult(null);
      setError(null);
    }
  }, [preselectedSampleIndex]);

  const isAgreementValid = agreementText.trim().length >= 10;
  const isRequestValid = requestText.trim().length >= 5;
  const isFormValid = isAgreementValid && isRequestValid;

  const handleClearAgreement = () => {
    setAgreementText('');
    setAnalysisResult(null);
    setError(null);
  };

  const handleClearRequest = () => {
    setRequestText('');
    setAnalysisResult(null);
    setError(null);
  };

  const handleClearAll = () => {
    setAgreementText('');
    setRequestText('');
    setTouched(false);
    setAnalysisResult(null);
    setError(null);
  };

  const handleLoadSample = (index: number) => {
    const sample = SAMPLE_DATASETS[index];
    if (sample) {
      setAgreementText(sample.originalAgreement);
      setRequestText(sample.clientRequest);
      setTouched(false);
      setAnalysisResult(null);
      setError(null);
    }
  };

  const submitAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiEndpoint('/api/analyze'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreement: agreementText,
          clientRequest: requestText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Analysis request failed (HTTP ${response.status})`);
      }

      if (data.status === 'success' && data.data) {
        setAnalysisResult(data.data);
      } else {
        throw new Error('Server returned an unexpected response structure.');
      }
    } catch (err: unknown) {
      console.error('Scope analysis failed:', err);
      const msg = err instanceof Error ? err.message : 'An error occurred during analysis.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isFormValid || loading) return;
    await submitAnalysis();
  };

  const handleRetry = () => {
    if (!isFormValid || loading) return;
    submitAnalysis();
  };

  const errorKind = error ? classifyError(error) : null;

  const errorTitle: Record<ErrorKind, string> = {
    unavailable: 'AI Engine Unavailable',
    timeout:     'Analysis Timed Out',
    ratelimit:   'Too Many Requests',
    validation:  'Input Not Accepted',
    generic:     'Analysis Failed',
  };

  const errorDetail: Record<ErrorKind, React.ReactNode> = {
    unavailable: (
      <div className="space-y-1.5">
        <p>The local Ollama service is not reachable. Your agreement and request text have been preserved.</p>
        <div className="mt-2 text-xs bg-rose-100/60 p-2.5 rounded-lg border border-rose-300 font-mono text-rose-950">
          Start Ollama: <strong>ollama serve</strong> — then pull the model if needed: <strong>ollama pull gemma2:2b</strong>
        </div>
      </div>
    ),
    timeout: (
      <p>
        The AI analysis took too long and was cancelled. Complex contract analysis or busy upstream model queues can take 1–2 minutes. Your text is preserved — try clicking Retry Analysis below.
      </p>
    ),
    ratelimit: (
      <p>
        Too many requests in a short time. Please wait a minute and try again.
      </p>
    ),
    validation: (
      <p>
        The server did not accept the request: <span className="font-mono">{error}</span>
      </p>
    ),
    generic: (
      <p>{error}</p>
    ),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <button
            onClick={onBackToOverview}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 mb-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Overview
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Scope Analysis Workspace
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Compare incoming client requests against your agreed deliverables and out-of-scope clauses.
          </p>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative group">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              aria-label="Load a sample scenario"
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-500" />
              Load Sample Scenario
            </button>
            <div className="absolute right-0 mt-1 w-80 bg-white rounded-xl shadow-lg border border-stone-200 py-1 hidden group-hover:block group-focus-within:block z-20">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-100">
                Sample Datasets
              </div>
              {SAMPLE_DATASETS.map((sample, idx) => (
                <button
                  key={sample.name}
                  onClick={() => handleLoadSample(idx)}
                  className="w-full text-left px-3 py-2.5 text-xs text-stone-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors flex flex-col gap-0.5"
                >
                  <span className="font-semibold">{sample.name}</span>
                  <span className="text-[11px] text-stone-500">{sample.description}</span>
                </button>
              ))}
            </div>
          </div>

          {(agreementText || requestText) && (
            <button
              onClick={handleClearAll}
              type="button"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Both
            </button>
          )}
        </div>
      </div>

      {/* If results exist, display them; otherwise display the input form */}
      {analysisResult ? (
        <AnalysisResults
          result={analysisResult}
          onReset={() => {
            setAnalysisResult(null);
            setError(null);
          }}
        />
      ) : (
        <form onSubmit={handleAnalyzeClick} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel 1: Original Agreement */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700/60 focus-within:border-emerald-700 transition-colors">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-800" />
                  <label htmlFor="agreement-input" className="text-sm font-semibold text-stone-900 cursor-pointer">
                    Original Agreement / SOW
                  </label>
                  <span className="text-[10px] text-red-600 font-semibold">*Required</span>
                </div>
                <div className="flex items-center gap-2">
                  {agreementText && (
                    <button
                      type="button"
                      onClick={handleClearAgreement}
                      disabled={loading}
                      className="text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
                      aria-label="Clear agreement text"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleLoadSample(0)}
                    disabled={loading}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-medium px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
                    aria-label="Load example agreement"
                  >
                    Load Example
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col space-y-3">
                <p className="text-xs text-stone-500 leading-normal">
                  Paste the original contract, proposal, or statement of work defining milestones, explicit deliverables, and out-of-scope clauses.
                </p>

                <div className="relative flex-1">
                  <textarea
                    id="agreement-input"
                    value={agreementText}
                    onChange={(e) => {
                      setAgreementText(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    placeholder="e.g. STATEMENT OF WORK: Deliverables include 5 pages (Home, PDP, Collection, About, Contact). Out of scope: custom ERP integration..."
                    rows={13}
                    className={`w-full h-full min-h-[260px] p-3.5 text-xs sm:text-sm font-mono text-stone-800 bg-stone-50/40 rounded-xl border ${
                      touched && !isAgreementValid
                        ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-400'
                        : 'border-stone-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    } resize-y focus:outline-none transition-colors disabled:opacity-60`}
                    aria-required="true"
                    aria-invalid={touched && !isAgreementValid}
                    aria-describedby={touched && !isAgreementValid ? 'agreement-error' : undefined}
                  />
                </div>

                {touched && !isAgreementValid && (
                  <div id="agreement-error" className="flex items-center gap-1.5 text-xs text-red-600 font-medium" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Please provide the original agreement text (minimum 10 characters).
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                  <span>Plain text or contract clause paste</span>
                  <span className="font-mono">{agreementText.length.toLocaleString()} characters</span>
                </div>
              </div>
            </div>

            {/* Panel 2: New Client Request */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden focus-within:ring-2 focus-within:ring-emerald-700/60 focus-within:border-emerald-700 transition-colors">
              <div className="px-5 py-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-800" />
                  <label htmlFor="request-input" className="text-sm font-semibold text-stone-900 cursor-pointer">
                    New Client Request
                  </label>
                  <span className="text-[10px] text-red-600 font-semibold">*Required</span>
                </div>
                <div className="flex items-center gap-2">
                  {requestText && (
                    <button
                      type="button"
                      onClick={handleClearRequest}
                      disabled={loading}
                      className="text-stone-400 hover:text-stone-700 text-xs px-2 py-1 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-400"
                      aria-label="Clear client request text"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleLoadSample(0)}
                    disabled={loading}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-medium px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
                    aria-label="Load example client request"
                  >
                    Load Example
                  </button>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col space-y-3">
                <p className="text-xs text-stone-500 leading-normal">
                  Paste the message, email thread, or ticket comment from your client requesting changes or new items.
                </p>

                <div className="relative flex-1">
                  <textarea
                    id="request-input"
                    value={requestText}
                    onChange={(e) => {
                      setRequestText(e.target.value);
                      if (error) setError(null);
                    }}
                    disabled={loading}
                    placeholder="e.g. 'Can we also add automatic real-time inventory syncing with our custom SAP SOAP API in time for next Friday's launch?'"
                    rows={13}
                    className={`w-full h-full min-h-[260px] p-3.5 text-xs sm:text-sm font-mono text-stone-800 bg-stone-50/40 rounded-xl border ${
                      touched && !isRequestValid
                        ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-400'
                        : 'border-stone-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                    } resize-y focus:outline-none transition-colors disabled:opacity-60`}
                    aria-required="true"
                    aria-invalid={touched && !isRequestValid}
                    aria-describedby={touched && !isRequestValid ? 'request-error' : undefined}
                  />
                </div>

                {touched && !isRequestValid && (
                  <div id="request-error" className="flex items-center gap-1.5 text-xs text-red-600 font-medium" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Please paste the client's request message (minimum 5 characters).
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                  <span>Email, Slack, or ticketing message</span>
                  <span className="font-mono">{requestText.length.toLocaleString()} characters</span>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
            <span>
              <strong className="text-stone-700">Privacy:</strong> When using local Ollama, your text is processed
              entirely on this device and never sent to external servers. When using a hosted provider, text is sent
              to that provider per their privacy policy. Avoid including unnecessary personal data.{' '}
              <strong className="text-stone-700">ScopeGuard AI provides decision support, not legal advice.</strong>
            </span>
          </div>

          {/* Error Banner */}
          {error && errorKind && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3" role="alert">
              {errorKind === 'unavailable' ? (
                <WifiOff className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : errorKind === 'timeout' ? (
                <Clock className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm space-y-1.5 flex-1 min-w-0">
                <p className="font-semibold">{errorTitle[errorKind]}</p>
                <div className="text-xs leading-relaxed">{errorDetail[errorKind]}</div>
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={loading || !isFormValid}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-700 hover:bg-rose-800 text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-700 disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Analysis
                </button>
              </div>
            </div>
          )}

          {/* Action Controls & Submission feedback */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
            <div className="flex items-center gap-2 text-xs text-stone-500">
              <HelpCircle className="w-4 h-4 text-stone-400 flex-shrink-0" />
              <span>
                ScopeGuard AI checks each request against contract clauses and verifies exact citations.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 ${
                loading
                  ? 'bg-emerald-700/80 cursor-wait'
                  : 'bg-emerald-800 hover:bg-emerald-900'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                  <span>Evaluating Scope Boundaries…</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-emerald-200" />
                  <span>Analyze Scope</span>
                </>
              )}
            </button>
          </div>

          {/* Loading state indicator banner */}
          {loading && (
            <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 flex items-start gap-3 text-stone-700 text-xs">
              <Cpu className="w-4 h-4 text-emerald-700 animate-pulse flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-stone-800">
                  Running AI scope analysis — this may take 1–2 minutes on local CPU hardware.
                </p>
                <p className="text-stone-500">
                  Decomposing your client request, comparing it clause-by-clause against the agreement, and
                  independently verifying each citation. Please keep this tab open.
                </p>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
