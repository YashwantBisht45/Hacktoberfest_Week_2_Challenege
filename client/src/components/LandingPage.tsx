import React from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert, FileText, Search, Lock, Scale, AlertTriangle, Layers } from 'lucide-react';

interface LandingPageProps {
  onOpenWorkspace: () => void;
  onOpenWorkspaceWithSample: (sampleIndex: number) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenWorkspace,
  onOpenWorkspaceWithSample,
}) => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span>Contract Scope Verification</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-[1.2]">
          Know when a client request <br className="hidden sm:inline" />
          <span className="text-emerald-800">goes beyond the original deal.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Scope creep erodes margins and creates tension. ScopeGuard AI provides objective, evidence-grounded contract comparisons so you can respond to requests with clarity.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenWorkspace}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm px-6 py-3 rounded-lg shadow-sm hover:shadow transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <span>Analyze a client request</span>
            <ArrowRight className="w-4 h-4 text-emerald-300" />
          </button>
          
          <button
            onClick={() => onOpenWorkspaceWithSample(0)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-800 font-medium text-sm px-6 py-3 rounded-lg border border-stone-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
          >
            <span>Load sample SOW scenario</span>
          </button>
        </div>

        {/* Value pillars */}
        <div className="mt-12 pt-8 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-700" />
              Contract-Bound Analysis
            </h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-normal">
              Every finding references exact text from your agreed Statement of Work, checking verbatim presence rather than speculation.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-700" />
              On-Device Privacy
            </h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-normal">
              When configured with local Ollama, all contract text remains entirely on your device and is never sent to external servers.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Clear Next Actions
            </h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-normal">
              Differentiate covered deliverables, out-of-scope work, and genuine ambiguities before drafting your client reply.
            </p>
          </div>
        </div>
      </section>

      {/* The Scope-Creep Problem section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-stone-900 text-stone-100 rounded-2xl p-8 sm:p-10 border border-stone-800 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <AlertTriangle className="w-4 h-4" />
              The Dilemma
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Scope creep happens in informal messages, not formal addendums.
            </h2>
            <p className="mt-4 text-stone-300 text-sm sm:text-base leading-relaxed">
              When a client asks for "just one quick change," it is hard to tell whether it is an agreed deliverable or uncompensated extra work. Freelancers worry about creating friction, while clients often believe the request is minor.
            </p>
            <p className="mt-3 text-stone-400 text-sm leading-relaxed">
              ScopeGuard AI acts as an objective reference: it compares the client's request against the agreed statement of work and presents exact contract citations before you respond.
            </p>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            How ScopeGuard AI Works
          </h2>
          <p className="mt-2 text-stone-600 text-sm sm:text-base">
            Three structured steps to evaluate scope boundaries with contract evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-base mb-4 border border-stone-200">
              1
            </div>
            <h3 className="text-base font-semibold text-stone-900 mb-2">Original Agreement</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Paste the signed Statement of Work, proposal deliverables, or milestone schedule established at the start.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-base mb-4 border border-stone-200">
              2
            </div>
            <h3 className="text-base font-semibold text-stone-900 mb-2">Client Request</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Paste the latest client message, email thread, or ticket comment requesting new tasks or modifications.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-stone-200 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center font-bold text-base mb-4 border border-stone-200">
              3
            </div>
            <h3 className="text-base font-semibold text-stone-900 mb-2">Evidence-Backed Results</h3>
            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              Review what is included, what exceeds scope, and what requires clarification—with verified clause citations.
            </p>
          </div>
        </div>
      </section>

      {/* Visual Comparison Example */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-stone-50 rounded-2xl p-6 sm:p-8 border border-stone-200">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Example Comparison</span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">Comparing Scope vs. Reality</h2>
            </div>
            <span className="text-xs text-stone-500 bg-white px-2.5 py-1 rounded border border-stone-200 self-start sm:self-auto font-mono text-[11px]">
              Realistic Freelance Scenario
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Agreement Box */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-stone-400" />
                  Original Statement of Work
                </span>
                <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">Agreed</span>
              </div>
              <div className="space-y-1.5 text-xs text-stone-700 font-mono bg-stone-50 p-3.5 rounded-lg border border-stone-100">
                <p className="font-semibold text-stone-900">Deliverables:</p>
                <p>• 5 Shopify core page templates (Home, PDP, Collection, About, Contact)</p>
                <p>• Standard Shopify Payments &amp; PayPal gateway integration</p>
                <p className="text-stone-500 mt-2 font-semibold">Explicit Exclusions:</p>
                <p className="text-stone-500">• Custom ERP or inventory synchronization</p>
                <p className="text-stone-500">• Multi-currency / international tax nexus configuration</p>
              </div>
            </div>

            {/* Client Request Box */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  New Incoming Request
                </span>
                <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-mono">Pending Evaluation</span>
              </div>
              <div className="text-xs text-stone-800 bg-amber-50/40 p-3.5 rounded-lg border border-amber-100 leading-relaxed italic">
                "We urgently need the store to automatically sync inventory with our German warehouse distributor's custom SAP SOAP API in real time. Can we include this in next Friday's launch?"
              </div>
              <div className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Result:</strong> Classified as <em>Likely Out-of-Scope</em>, citing the specific ERP exclusion clause from the agreement.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Trust Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="border border-stone-200 rounded-2xl p-6 sm:p-10 bg-white shadow-sm">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Privacy, Evidence &amp; Trust
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              ScopeGuard AI is designed with data privacy and open-weight models at its core:
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-stone-200 bg-stone-50/50 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm">
                <Lock className="w-4 h-4 text-emerald-700" />
                Local Processing (Ollama)
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                When running with local Ollama, all contract text and client messages remain on your own device and are never transmitted across the network.
              </p>
            </div>

            <div className="border border-stone-200 bg-stone-50/50 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm">
                <Search className="w-4 h-4 text-emerald-700" />
                Verbatim Citation Verification
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every contract quotation cited by the model is verified verbatim against your agreement text. Quotes not present in your document are flagged as unverified.
              </p>
            </div>

            <div className="border border-stone-200 bg-stone-50/50 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm">
                <Scale className="w-4 h-4 text-emerald-700" />
                Decision Support, Not Legal Advice
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                ScopeGuard AI provides structured comparison to inform your client communications. It is not a law firm and its outputs are not legally binding determinations.
              </p>
            </div>

            <div className="border border-stone-200 bg-stone-50/50 p-5 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-semibold text-stone-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-emerald-700" />
                Hosted Provider Transparency
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                If you configure an OpenAI-compatible hosted open-weight endpoint, data is transmitted to that provider per their privacy policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ready CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Ready to review a client request?
        </h2>
        <p className="mt-2 text-stone-600 text-sm sm:text-base">
          Open the workspace to paste your agreement and verify scope boundaries.
        </p>
        <div className="mt-6">
          <button
            onClick={onOpenWorkspace}
            className="inline-flex items-center justify-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-sm px-6 py-3 rounded-lg shadow-sm hover:shadow transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
          >
            <span>Open ScopeGuard Workspace</span>
            <ArrowRight className="w-4 h-4 text-emerald-300" />
          </button>
        </div>
      </section>
    </div>
  );
};
