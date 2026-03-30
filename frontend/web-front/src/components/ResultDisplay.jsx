import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { resetState, setLanguage } from '../store/diseaseSlice';
import { Volume2, VolumeX, RefreshCw, Leaf, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'sd', label: 'سنڌي' },
];

const ResultDisplay = () => {
  const dispatch = useDispatch();
  const { imageUrl, disease, plant, confidence, is_healthy, top_results, solution, language } =
    useSelector((state) => state.disease);

  const [isPlaying,    setIsPlaying]    = useState(false);
  const [showTopK,     setShowTopK]     = useState(false);
  const utteranceRef = useRef(null);

  // Cancel speech when language changes or component unmounts
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current = null;
      }
      window.speechSynthesis.cancel();
    };
  }, [language]);

  const currentSolution = solution[language] || solution['en'] || '';

  const voiceLang = { en: 'en-US', ur: 'ur-PK', pa: 'pa-IN', sd: 'sd-IN' };

  // ── TTS ─────────────────────────────────────────────────────────────────────
  const handlePlayVoice = () => {
    if (isPlaying) {
      if (utteranceRef.current) { utteranceRef.current.onend = null; utteranceRef.current = null; }
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }
    if (!('speechSynthesis' in window)) { alert("Your browser doesn't support Text-to-Speech."); return; }

    const u = new SpeechSynthesisUtterance(currentSolution);
    u.lang    = voiceLang[language] || 'en-US';
    u.onend   = () => { utteranceRef.current = null; setIsPlaying(false); };
    u.onerror = () => { utteranceRef.current = null; setIsPlaying(false); };
    utteranceRef.current = u;
    setIsPlaying(true);
    window.speechSynthesis.speak(u);
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    dispatch(resetState());
  };

  // ── Confidence badge colour ──────────────────────────────────────────────────
  const confPct   = confidence != null ? Math.round(confidence * 100) : null;
  const confColor = confPct >= 80 ? '#16a34a' : confPct >= 50 ? '#d97706' : '#dc2626';

  return (
    <div style={styles.wrapper}>

      {/* ── Image preview ──────────────────────────────────────────────────── */}
      {imageUrl && (
        <div style={styles.imageWrap}>
          <img src={imageUrl} alt="Uploaded plant" style={styles.image} />
        </div>
      )}

      {/* ── Result card ────────────────────────────────────────────────────── */}
      <div style={styles.card}>

        {/* Status badge */}
        <div style={{ ...styles.badge, backgroundColor: is_healthy ? '#dcfce7' : '#fef2f2' }}>
          {is_healthy
            ? <><Leaf size={15} color="#16a34a" /> <span style={{ color: '#16a34a' }}>Plant is Healthy</span></>
            : <><AlertTriangle size={15} color="#dc2626" /> <span style={{ color: '#dc2626' }}>Disease Detected</span></>
          }
        </div>

        {/* Disease name */}
        <h2 style={{ ...styles.diseaseName, color: is_healthy ? '#16a34a' : '#dc2626' }}>
          {disease}
        </h2>
        <p style={styles.plantName}>{plant && `Plant: ${plant}`}</p>

        {/* Confidence */}
        {confPct != null && (
          <div style={styles.confRow}>
            <span style={styles.confLabel}>Confidence</span>
            <div style={styles.confBarTrack}>
              <div style={{ ...styles.confBarFill, width: `${confPct}%`, backgroundColor: confColor }} />
            </div>
            <span style={{ ...styles.confPct, color: confColor }}>{confPct}%</span>
          </div>
        )}

        {/* Language selector */}
        <div style={styles.langRow}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => dispatch(setLanguage(l.code))}
              style={{ ...styles.langBtn, ...(language === l.code ? styles.langBtnActive : {}) }}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Solution text */}
        <div style={styles.solutionBox}>
          <p style={styles.solutionText}>{currentSolution || 'No treatment advice available.'}</p>
        </div>

        {/* Action buttons */}
        <div style={styles.actionRow}>
          <button onClick={handlePlayVoice} style={{ ...styles.btn, ...styles.btnBlue }}>
            {isPlaying ? <VolumeX size={18} /> : <Volume2 size={18} />}
            <span>{isPlaying ? 'Stop' : 'Read Aloud'}</span>
          </button>
          <button onClick={handleReset} style={{ ...styles.btn, ...styles.btnGreen }}>
            <RefreshCw size={18} />
            <span>Scan Another</span>
          </button>
        </div>

        {/* Top-K predictions accordion */}
        {top_results?.length > 1 && (
          <div style={styles.topK}>
            <button
              onClick={() => setShowTopK((v) => !v)}
              style={styles.topKToggle}
              aria-expanded={showTopK}
            >
              <span>Other predictions</span>
              {showTopK ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showTopK && (
              <ul style={styles.topKList}>
                {top_results.slice(1).map((r, i) => {
                  const pct = Math.round(r.confidence * 100);
                  return (
                    <li key={i} style={styles.topKItem}>
                      <span style={styles.topKLabel}>{r.label.replace(/___/g, ' › ').replace(/_/g, ' ')}</span>
                      <span style={styles.topKPct}>{pct}%</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  wrapper: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '1.5rem',
    width:         '100%',
    maxWidth:      '640px',
    margin:        '0 auto',
  },
  imageWrap: {
    width:        '100%',
    maxWidth:     '320px',
    borderRadius: '12px',
    overflow:     'hidden',
    boxShadow:    '0 4px 12px rgba(0,0,0,0.12)',
  },
  image: {
    width:     '100%',
    height:    'auto',
    display:   'block',
    objectFit: 'cover',
  },
  card: {
    width:           '100%',
    backgroundColor: '#fff',
    borderRadius:    '16px',
    padding:         '1.75rem',
    boxShadow:       '0 4px 6px -1px rgba(0,0,0,0.1)',
    display:         'flex',
    flexDirection:   'column',
    gap:             '1rem',
  },
  badge: {
    display:       'inline-flex',
    alignItems:    'center',
    gap:           '6px',
    padding:       '4px 12px',
    borderRadius:  '999px',
    fontSize:      '0.8rem',
    fontWeight:    '600',
    alignSelf:     'flex-start',
  },
  diseaseName: {
    fontSize:    '1.5rem',
    fontWeight:  '700',
    margin:      0,
    lineHeight:  1.2,
  },
  plantName: {
    fontSize: '0.9rem',
    color:    '#64748b',
    margin:   0,
  },
  confRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '0.75rem',
  },
  confLabel: {
    fontSize:   '0.8rem',
    color:      '#64748b',
    whiteSpace: 'nowrap',
  },
  confBarTrack: {
    flex:            1,
    height:          '8px',
    backgroundColor: '#e2e8f0',
    borderRadius:    '999px',
    overflow:        'hidden',
  },
  confBarFill: {
    height:       '100%',
    borderRadius: '999px',
    transition:   'width 0.6s ease',
  },
  confPct: {
    fontSize:   '0.85rem',
    fontWeight: '700',
    minWidth:   '38px',
    textAlign:  'right',
  },
  langRow: {
    display:  'flex',
    gap:      '0.5rem',
    flexWrap: 'wrap',
  },
  langBtn: {
    padding:         '5px 14px',
    border:          '1.5px solid #e2e8f0',
    borderRadius:    '999px',
    background:      '#f8fafc',
    color:           '#64748b',
    fontSize:        '0.8rem',
    fontWeight:      '500',
    cursor:          'pointer',
    transition:      'all 0.15s',
  },
  langBtnActive: {
    borderColor:     '#10b981',
    backgroundColor: '#f0fdf4',
    color:           '#059669',
    fontWeight:      '700',
  },
  solutionBox: {
    backgroundColor: '#f8fafc',
    borderRadius:    '10px',
    padding:         '1rem 1.25rem',
    border:          '1px solid #e2e8f0',
  },
  solutionText: {
    fontSize:   '0.95rem',
    color:      '#334155',
    lineHeight: '1.7',
    margin:     0,
    textAlign:  'justify',
  },
  actionRow: {
    display:        'flex',
    gap:            '0.75rem',
    justifyContent: 'center',
    flexWrap:       'wrap',
  },
  btn: {
    display:      'flex',
    alignItems:   'center',
    gap:          '6px',
    padding:      '10px 20px',
    border:       'none',
    borderRadius: '8px',
    fontSize:     '0.875rem',
    fontWeight:   '600',
    cursor:       'pointer',
    transition:   'opacity 0.15s',
  },
  btnBlue:  { backgroundColor: '#3b82f6', color: 'white' },
  btnGreen: { backgroundColor: '#10b981', color: 'white' },
  topK: {
    borderTop:  '1px solid #f1f5f9',
    paddingTop: '0.75rem',
  },
  topKToggle: {
    display:         'flex',
    alignItems:      'center',
    gap:             '6px',
    background:      'none',
    border:          'none',
    cursor:          'pointer',
    color:           '#64748b',
    fontSize:        '0.85rem',
    fontWeight:      '600',
    padding:         '0',
    width:           '100%',
    justifyContent:  'space-between',
  },
  topKList: {
    listStyle: 'none',
    margin:    '0.5rem 0 0',
    padding:   0,
    display:   'flex',
    flexDirection: 'column',
    gap:       '0.4rem',
  },
  topKItem: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    padding:        '4px 8px',
    borderRadius:   '6px',
    backgroundColor: '#f8fafc',
    fontSize:       '0.82rem',
  },
  topKLabel: { color: '#334155' },
  topKPct:   { color: '#94a3b8', fontWeight: '600' },
};

export default ResultDisplay;
