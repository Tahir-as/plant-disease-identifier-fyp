import React from 'react';
import { useSelector } from 'react-redux';

// All page components
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import UploadSection from './components/UploadSection';
import ResultDisplay from './components/ResultDisplay';
import TipsSection from './components/TipsSection';

function App() {
  // Read upload/detection status from Redux store
  const status = useSelector((state) => state.disease.status);

  return (
    <div className="app-container">
      {/* Top nav bar with logo and language selector */}
      <Header />

      {/* Main scrollable content area */}
      <main className="main-content">

        {/* Hero heading — always visible */}
        <Hero />

        {/* Feature cards row — always visible */}
        <Features />

        {/* 
          CENTER SECTION:
          - idle / uploading → show the upload dropzone with "Upload a picture of a plant."
          - finished         → show the detected disease name + solution + TTS buttons
        */}
        {status === 'finished' ? <ResultDisplay /> : <UploadSection />}

        {/* Tips for best photo results — always visible below */}
        <TipsSection />

      </main>
    </div>
  );
}

export default App;

