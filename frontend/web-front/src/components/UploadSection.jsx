import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { scanPlant, setImagePreview } from '../store/diseaseSlice';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

const UploadSection = () => {
  const dispatch      = useDispatch();
  const fileInputRef  = useRef(null);
  const { status, error } = useSelector((state) => state.disease);
  const isUploading   = status === 'uploading';

  const [dragOver, setDragOver] = useState(false);

  // ── Process a picked / dropped file ────────────────────────────────────────
  const processFile = (file) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPEG, PNG, WebP, or BMP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10 MB.');
      return;
    }

    // Store local preview URL so ResultDisplay can show the image immediately
    const previewUrl = URL.createObjectURL(file);
    dispatch(setImagePreview(previewUrl));

    // Fire the real API call
    dispatch(scanPlant(file));
  };

  // ── Event handlers ──────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const dropzoneStyle = {
    ...styles.dropzone,
    ...(dragOver   ? styles.dropzoneActive : {}),
    ...(isUploading ? styles.dropzoneDisabled : {}),
  };

  return (
    <section style={styles.container}>
      <h2 style={styles.title}>Upload a picture of a plant</h2>
      <p style={styles.subtitle}>Supports JPEG · PNG · WebP · BMP  (max 10 MB)</p>

      <div
        style={dropzoneStyle}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current.click()}
        role="button"
        aria-label="Upload plant image"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !isUploading && fileInputRef.current.click()}
      >
        <input
          id="plant-image-input"
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div style={styles.iconContainer}>
          {isUploading
            ? <Loader2 size={32} color="#10b981" style={styles.spinner} />
            : <Upload  size={32} color="#10b981" />
          }
        </div>

        <p style={styles.primaryText}>
          {isUploading ? 'Analyzing image…' : 'Click or drag image here'}
        </p>

        {!isUploading && (
          <p style={styles.secondaryText}>
            Our AI will identify plant diseases instantly
          </p>
        )}
      </div>

      {/* Error banner */}
      {status === 'error' && error && (
        <div style={styles.errorBanner} role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}
    </section>
  );
};

// ── Inline styles ─────────────────────────────────────────────────────────────
const styles = {
  container: {
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    gap:             '1rem',
    width:           '100%',
    maxWidth:        '600px',
    margin:          '0 auto',
    padding:         '2rem',
    backgroundColor: '#fff',
    borderRadius:    '16px',
    boxShadow:       '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize:   '1.5rem',
    fontWeight: '700',
    color:      '#1a1e23',
    textAlign:  'center',
    margin:     0,
  },
  subtitle: {
    fontSize: '0.875rem',
    color:    '#94a3b8',
    margin:   0,
  },
  dropzone: {
    width:           '100%',
    border:          '2px dashed #10b981',
    backgroundColor: '#f0fdf4',
    borderRadius:    '12px',
    padding:         '3rem 2rem',
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    cursor:          'pointer',
    transition:      'all 0.2s ease',
    gap:             '0.5rem',
  },
  dropzoneActive: {
    backgroundColor: '#dcfce7',
    borderColor:     '#16a34a',
    transform:       'scale(1.01)',
  },
  dropzoneDisabled: {
    cursor:  'not-allowed',
    opacity:  0.7,
  },
  iconContainer: {
    backgroundColor: 'white',
    padding:         '16px',
    borderRadius:    '50%',
    marginBottom:    '0.5rem',
    boxShadow:       '0 2px 4px rgba(0,0,0,0.05)',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  primaryText: {
    fontSize:   '1.125rem',
    fontWeight: '600',
    color:      '#475569',
    margin:     0,
  },
  secondaryText: {
    fontSize: '0.875rem',
    color:    '#94a3b8',
    margin:   0,
  },
  errorBanner: {
    display:         'flex',
    alignItems:      'center',
    gap:             '0.5rem',
    width:           '100%',
    padding:         '0.75rem 1rem',
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    '8px',
    color:           '#dc2626',
    fontSize:        '0.875rem',
  },
};

export default UploadSection;
