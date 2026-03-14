import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { resetState } from '../store/diseaseSlice';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';

const ResultDisplay = () => {
  const dispatch = useDispatch();
  const { imageUrl, disease, solution, language } = useSelector((state) => state.disease);
  const [isPlaying, setIsPlaying] = useState(false);
  // Track the active utterance so we can cancel it when language changes
  const utteranceRef = useRef(null);

  // When language changes, cancel any active speech — no setState in the body
  useEffect(() => {
    return () => {
      // Cleanup: cancel speech when language changes or component unmounts
      if (utteranceRef.current) {
        utteranceRef.current.onend = null; // detach so setIsPlaying isn't called after cancel
        utteranceRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, [language]);

  const currentSolutionContext = solution[language] || solution['en'];

  const getVoiceLangCode = (langCode) => {
    switch (langCode) {
      case 'en': return 'en-US';
      case 'ur': return 'ur-PK';
      case 'pa': return 'pa-IN';
      case 'sd': return 'sd-IN';
      default: return 'en-US';
    }
  };

  const handlePlayVoice = () => {
    if (isPlaying) {
      // User hit Stop — detach handler first so onend doesn't fire after cancel
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentSolutionContext);
      utterance.lang = getVoiceLangCode(language);

      // Reset playing state when speech naturally finishes
      utterance.onend = () => {
        utteranceRef.current = null;
        setIsPlaying(false);
      };

      // Also reset if speech fails
      utterance.onerror = () => {
        utteranceRef.current = null;
        setIsPlaying(false);
      };

      utteranceRef.current = utterance; // store ref so cleanup can detach it
      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Sorry, your browser doesn't support Text-to-Speech.");
    }
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    dispatch(resetState());
  };

  return (
    <div className="result-display" style={styles.container}>
      <div style={styles.imageContainer}>
        {imageUrl && <img src={imageUrl} alt="Uploaded Plant" style={styles.image} />}
      </div>
      
      <div style={styles.contentContainer}>
        <h2 style={styles.diseaseTitle}>{disease}</h2>
        <div style={styles.solutionBox}>
          <p style={styles.solutionText}>{currentSolutionContext}</p>
          
          <div style={styles.actionButtons}>
            <button 
              onClick={handlePlayVoice} 
              style={{...styles.button, ...styles.playButton}}
            >
              {isPlaying ? <VolumeX size={18} /> : <Volume2 size={18} />}
              <span>{isPlaying ? 'Stop Voice' : 'Play Voice'}</span>
            </button>
            
            <button 
              onClick={handleReset} 
              style={{...styles.button, ...styles.resetButton}}
            >
              <RefreshCw size={18} />
              <span>Scan Another</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    width: '100%',
    maxWidth: '600px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    margin: '0 auto'
  },
  imageContainer: {
    width: '100%',
    maxWidth: '300px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  image: {
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'cover'
  },
  contentContainer: {
    width: '100%',
    textAlign: 'center'
  },
  diseaseTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: '1rem'
  },
  solutionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0'
  },
  solutionText: {
    fontSize: '1rem',
    color: '#334155',
    lineHeight: '1.6',
    marginBottom: '1.5rem',
    textAlign: 'justify'
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  playButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  resetButton: {
    backgroundColor: '#10b981',
    color: 'white',
  }
};

export default ResultDisplay;
