import React from 'react';
import { useSelector } from 'react-redux';

import Header        from './components/Header';
import Hero          from './components/Hero';
import Features      from './components/Features';
import UploadSection from './components/UploadSection';
import ResultDisplay from './components/ResultDisplay';
import TipsSection   from './components/TipsSection';

function App() {
  const status = useSelector((state) => state.disease.status);

  // Show result card once scan succeeds; show upload for all other states
  const showResult = status === 'finished';

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <Hero />
        <Features />

        {/* Spinner CSS injected once for the Loader2 animation in UploadSection */}
        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        {showResult ? <ResultDisplay /> : <UploadSection />}

        <TipsSection />
      </main>
    </div>
  );
}

export default App;
