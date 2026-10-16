import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Copy,
  Check,
  FileCheck,
  Clock,
  Layers,
  RefreshCw,
  Quote,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ScopeAnalysisResult, ClassificationType } from '../types/analysis';

interface AnalysisResultsProps {
  result: ScopeAnalysisResult;
  onReset: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ result, onReset }) => {
  const [draftText, setDraftText] = useState(result.changeOrderDraft);
  const [copied, setCopied] = useState(false);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(draftText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleResetDraft = () => {
    setDraftText(result.changeOrderDraft);
  };

  const getClassificationBadge = (classification: ClassificationType) => {
    switch (classification) {
      case 'ALREADY_INCLUDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Already Included</span>
          </span>
        );
      case 'LIKELY_ADDITIONAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-300">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            <span>Likely Out-of-Scope</span>
          </span>
        );
      case 'NEEDS_CLARIFICATION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Needs Clarification</span>
          </span>
        );
    }
  };

  /**
   * Returns a concise, honest next-action prompt for each classification.
   * Avoids presenting ScopeGuard output as a legal determination.
   */
  const getNextAction = (classification: ClassificationType) => {
    switch (classification) {
      case 'ALREADY_INCLUDED':
        return {
          bg: 'bg-emerald-50/60 border-emerald-200/60',
          textColor: 'text-emerald-900',
          labelColor: 'text-emerald-700',
          icon: <ArrowRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />,
          label: 'Suggested next step',
          text: 'This item appears covered under the current agreement based on the cited evidence. Confirm with your client that expectations are aligned before proceeding.',
        };
      case 'LIKELY_ADDITIONAL':
        return {
          bg: 'bg-rose-50/50 border-rose-200/50',
          textColor: 'text-rose-900',
          labelColor: 'text-rose-700',
          icon: <ArrowRight className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />,
          label: 'Suggested next step',
          text: 'This item appears to fall outside the agreed scope based on the analysis. Consider raising a change-order conversation with your client. This analysis is decision support — not a legal determination.',
        };
      case 'NEEDS_CLARIFICATION':
      default:
        return {
          bg: 'bg-amber-50/60 border-amber-200/60',
          textColor: 'text-amber-950',
          labelColor: 'text-amber-700',
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />,
          label: 'What to clarify',
          text: 'The agreement does not conclusively address this item. Raise the specific questions below with your client before committing to or refusing the work.',
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Executive Summary Card */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">Scope Evaluation Summary</h2>
              <p className="text-xs text-stone-500">Contract comparison against agreed deliverables</p>
            </div>
          </div>
          {result.modelMetadata && (
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-stone-100 text-stone-600 text-xs font-mono shrink-0 border border-stone-200">
              <span>Engine: {result.modelMetadata.provider}</span>
              <span className="text-stone-300">•</span>
              <span>{result.modelMetadata.model}</span>
            </div>
          )}
        </div>

        <p className="text-sm sm:text-base text-stone-800 leading-relaxed">
          {result.summary}
        </p>

        {/* Breakdown counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200">
            <div className="text-xs text-stone-500 font-medium">Decomposed Client Requests</div>
            <div className="text-2xl font-bold text-stone-900 mt-1">{result.requests.length}</div>
          </div>
          <div className="p-3.5 rounded-lg bg-rose-50/70 border border-rose-200">
            <div className="text-xs text-rose-800 font-medium">Likely Out-of-Scope</div>
            <div className="text-2xl font-bold text-rose-900 mt-1">
              {result.requests.filter((r) => r.classification === 'LIKELY_ADDITIONAL').length}
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200">
            <div className="text-xs text-amber-800 font-medium">Clarification Points</div>
            <div className="text-2xl font-bold text-amber-900 mt-1">
              {result.requests.filter((r) => r.classification === 'NEEDS_CLARIFICATION').length}
            </div>
          </div>
        </div>

        {/* Decision-support disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-50 border border-stone-100 text-[11px] text-stone-500">
          <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
          <span>
            ScopeGuard AI provides decision support based on the text you supplied. It does not constitute
            legal advice. Quoted evidence is automatically checked against your agreement text, but always
            review findings in the context of your full contract before responding to your client.
          </span>
        </div>
      </div>

      {/* 2. Decomposed Request Classifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-800" />
            Request-by-Request Analysis
          </h3>
          <span className="text-xs text-stone-500">Each distinct request evaluated separately</span>
        </div>

        <div className="space-y-5">
          {result.requests.map((item, idx) => {
            const nextAction = getNextAction(item.classification);
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Request #{idx + 1}
                    </div>
                    <h4 className="text-base font-bold text-stone-900 break-words">
                      "{item.request}"
                    </h4>
                  </div>
                  <div className="shrink-0">{getClassificationBadge(item.classification)}</div>
                </div>

                {/* Rationale */}
                <div className="text-xs sm:text-sm text-stone-700 bg-stone-50 p-3.5 rounded-lg border border-stone-200 leading-relaxed">
                  <span className="font-semibold text-stone-900 block mb-1">Analysis Rationale:</span>
                  {item.reasoning}
                </div>

                {/* Evidence Section */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-stone-400" />
                      Agreement Evidence
                    </span>
                    <span className="text-stone-500 font-mono text-[11px]">
                      Strength: <strong className="text-stone-800">{item.evidenceStrength}</strong>
                    </span>
                  </div>

                  {item.evidence && item.evidence.length > 0 ? (
                    <div className="space-y-2">
                      {item.evidence.map((ev, eIdx) => (
                        <div
                          key={eIdx}
                          className={`p-3 rounded-lg border text-xs leading-relaxed ${
                            ev.verificationStatus === 'VERIFIED'
                              ? 'bg-emerald-50/40 border-emerald-300 text-emerald-950'
                              : 'bg-stone-50 border-stone-200 text-stone-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                            <span className="flex items-center gap-1 font-medium">
                              {ev.verificationStatus === 'VERIFIED' ? (
                                <span className="text-emerald-800 flex items-center gap-1.5 font-semibold">
                                  <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                                  Verified in agreement text
                                </span>
                              ) : (
                                <span className="text-stone-600 flex items-center gap-1.5 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  Not found verbatim — unverified citation
                                </span>
                              )}
                            </span>
                            {ev.sourceSectionId && (
                              <span className="text-stone-500 font-sans">
                                § {ev.sourceSectionId}
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs bg-white p-2.5 rounded border border-stone-200 text-stone-800 break-words leading-relaxed">
                            "{ev.quote}"
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-lg border border-stone-200">
                      No specific agreement clause was cited for this item. The classification is based on the
                      overall scope context and contractual silence — treat this conclusion with extra caution.
                    </p>
                  )}
                </div>

                {/* Uncertainty disclosure */}
                {item.uncertainty &&
                  item.uncertainty.toLowerCase() !== 'none' &&
                  item.uncertainty.toLowerCase() !== 'none identified' && (
                    <div className="text-xs text-stone-700 bg-amber-50/70 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-amber-900">Contractual uncertainty: </span>
                        {item.uncertainty}
                      </div>
                    </div>
                  )}

                {/* Next action */}
                <div className={`text-xs p-3 rounded-lg border flex items-start gap-2 ${nextAction.bg}`}>
                  {nextAction.icon}
                  <div className={nextAction.textColor}>
                    <span className={`font-semibold ${nextAction.labelColor}`}>{nextAction.label}: </span>
                    {nextAction.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Potential Impact & Unknowns */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-5">
        <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-800" />
          Delivery &amp; Scope Impact Assessment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Possible Additional Work */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Identified Additional Work
            </h4>
            {result.impact.possibleWork.length > 0 ? (
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-600">
                {result.impact.possibleWork.map((work, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 flex-shrink-0" />
                    <span>{work}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400 italic">No additional work items identified.</p>
            )}
          </div>

          {/* Timeline Considerations */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Timeline Considerations
            </h4>
            {result.impact.timelineConsiderations.length > 0 ? (
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-600">
                {result.impact.timelineConsiderations.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400 italic">No timeline delays flagged.</p>
            )}
          </div>

          {/* Unknowns / Missing Info */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider">
              Unstated Assumptions &amp; Unknowns
            </h4>
            {result.impact.unknowns.length > 0 ? (
              <ul className="space-y-1.5 text-xs sm:text-sm text-stone-600">
                {result.impact.unknowns.map((u, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-2 flex-shrink-0" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400 italic">No unstated dependencies found.</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Clarification Questions */}
      {result.clarificationQuestions && result.clarificationQuestions.length > 0 && (
        <div className="bg-amber-50/50 rounded-xl border border-amber-200 p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-800" />
            <h3 className="text-base font-bold text-amber-950">
              Recommended Questions for Your Client
            </h3>
          </div>
          <p className="text-xs text-amber-900">
            Clarify these points before committing to or refusing any additions:
          </p>
          <ul className="space-y-2">
            {result.clarificationQuestions.map((q, idx) => (
              <li
                key={idx}
                className="bg-white p-3 rounded-lg border border-amber-200/70 text-xs sm:text-sm text-amber-950 font-medium flex items-start gap-2.5"
              >
                <span className="font-bold text-amber-800 flex-shrink-0">{idx + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Editable Client Response Draft */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-800" />
              Editable Client Response Draft
            </h3>
            <p className="text-xs text-stone-500">
              Starting point for your reply — review, edit, and fill in any placeholders before sending
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetDraft}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              title="Reset to generated draft"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Draft
            </button>
            <button
              onClick={handleCopyDraft}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                copied
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-800 hover:bg-emerald-900 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Response
                </>
              )}
            </button>
          </div>
        </div>

        {/* Legal reminder */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-600">
          <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0 mt-0.5" />
          <span>
            This draft is an editable template for communication. ScopeGuard AI does not provide legal advice.
            Review the message, replace all bracketed items, and confirm terms before sending.
          </span>
        </div>

        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          rows={8}
          className="w-full p-3.5 text-xs sm:text-sm font-mono text-stone-800 bg-stone-50 rounded-lg border border-stone-200 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700 transition-colors resize-y leading-relaxed"
          placeholder="Client reply message draft…"
          aria-label="Editable client reply message draft"
        />

        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>Complete placeholders like [Client Name], [price], or [timeline] before sending.</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center pt-2">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
        >
          <RefreshCw className="w-4 h-4 text-stone-600" />
          Analyze Another Request
        </button>
      </div>
    </div>
  );
};
