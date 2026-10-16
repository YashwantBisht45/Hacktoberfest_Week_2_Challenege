import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

interface NavbarProps {
  onNavigateToWorkspace: () => void;
  onNavigateToLanding: () => void;
  currentView: 'landing' | 'workspace';
  serverHealthy?: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigateToWorkspace,
  onNavigateToLanding,
  currentView,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#fcfbf9]/95 border-b border-stone-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onNavigateToLanding}
          className="flex items-center gap-2.5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-lg p-1"
          aria-label="ScopeGuard AI Home"
        >
          <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-emerald-400 shadow-sm group-hover:bg-stone-800 transition-colors">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-stone-900 text-lg tracking-tight">ScopeGuard</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">
                AI
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block -mt-0.5 font-medium">Contract scope protection</p>
          </div>
        </button>

        {/* Right side navigation */}
        <div className="flex items-center gap-3">
          {currentView === 'workspace' ? (
            <button
              onClick={onNavigateToLanding}
              className="text-sm font-medium text-stone-600 hover:text-stone-900 px-3.5 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
            >
              Overview
            </button>
          ) : (
            <button
              onClick={onNavigateToWorkspace}
              className="inline-flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Open Workspace</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
