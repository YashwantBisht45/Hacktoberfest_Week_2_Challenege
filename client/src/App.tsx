import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Workspace } from './components/Workspace';
import { Footer } from './components/Footer';
import { getApiEndpoint } from './config/api';

export function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [preselectedSampleIndex, setPreselectedSampleIndex] = useState<number | null>(null);
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        const response = await fetch(getApiEndpoint('/api/health'));
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'ok') {
            setServerHealthy(true);
            return;
          }
        }
        setServerHealthy(false);
      } catch (err) {
        console.warn('Backend /api/health check failed:', err);
        setServerHealthy(false);
      }
    };

    checkBackendHealth();
  }, []);

  const handleOpenWorkspace = () => {
    setPreselectedSampleIndex(null);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWorkspaceWithSample = (sampleIndex: number) => {
    setPreselectedSampleIndex(sampleIndex);
    setCurrentView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOverview = () => {
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9] text-stone-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar
        onNavigateToWorkspace={handleOpenWorkspace}
        onNavigateToLanding={handleBackToOverview}
        currentView={currentView}
        serverHealthy={serverHealthy}
      />

      <main className="flex-1">
        {currentView === 'landing' ? (
          <LandingPage
            onOpenWorkspace={handleOpenWorkspace}
            onOpenWorkspaceWithSample={handleOpenWorkspaceWithSample}
          />
        ) : (
          <Workspace
            onBackToOverview={handleBackToOverview}
            preselectedSampleIndex={preselectedSampleIndex}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
