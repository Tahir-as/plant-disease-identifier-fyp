import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadImage } from '../store/diseaseSlice';
import { Upload } from 'lucide-react';

const UploadSection = () => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const status = useSelector(state => state.disease.status);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      dispatch(uploadImage({ imageUrl }));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const imageUrl = URL.createObjectURL(file);
      dispatch(uploadImage({ imageUrl }));
    }
  };

  return (
    <section style={styles.container}>
      <h2 style={styles.title}>Upload a picture of a plant.</h2>
      
      <div
        style={styles.dropzone}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleFileChange}
        />
        <div style={styles.iconContainer}>
          <Upload size={32} color="#10b981" />
        </div>
        <p style={styles.uploadText}>
          {status === 'uploading' ? 'Analyzing image...' : 'Click or drag image here'}
        </p>
      </div>
    </section>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '2rem',
    minHeight: '400px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1a1e23',
    textAlign: 'center'
  },
  dropzone: {
    width: '100%',
    border: '2px dashed #10b981',
    backgroundColor: '#f0fdf4',
    borderRadius: '12px',
    padding: '3rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  iconContainer: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '50%',
    marginBottom: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  uploadText: {
    fontSize: '1.125rem',
    fontWeight: '500',
    color: '#64748b'
  }
};

export default UploadSection;
