import React from 'react';
import { Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-stone-200 bg-[#f9f8f5] mt-20 text-stone-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-stone-200">
          {/* Brand & Purpose */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center text-emerald-400">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-900 text-sm">ScopeGuard AI</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500 bg-stone-200/70 px-1.5 py-0.5 rounded">
                  Open-Weight
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Know when a client request goes beyond the original deal.
              </p>
            </div>
          </div>

          {/* Privacy & Engine badge */}
          <div className="text-xs text-stone-500 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 border border-stone-200 font-mono text-[11px]">
              Evidence-Grounded Analysis
            </span>
          </div>
        </div>

        {/* Legal Disclaimer & Context */}
        <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-stone-500">
          <p className="max-w-2xl leading-relaxed">
            <strong className="text-stone-700">Disclaimer:</strong> ScopeGuard AI compares incoming requests against original agreements for decision support and drafting purposes. It does not provide legal advice or constitute a legally binding determination.
          </p>
          <p className="shrink-0 text-stone-400 text-[11px]">
            Built for independent contractors and digital agencies.
          </p>
        </div>
      </div>
    </footer>
  );
};
