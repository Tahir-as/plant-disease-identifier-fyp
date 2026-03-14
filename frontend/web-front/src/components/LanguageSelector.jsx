import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../store/diseaseSlice';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const dispatch = useDispatch();
  const currentLanguage = useSelector((state) => state.disease.language);

  const handleLanguageChange = (e) => {
    dispatch(setLanguage(e.target.value));
  };

  return (
    <div className="language-selector" style={styles.container}>
      <Globe size={18} color="#64748b" />
      <select 
        value={currentLanguage} 
        onChange={handleLanguageChange}
        style={styles.select}
      >
        <option value="en">English</option>
        <option value="ur">Urdu (اردو)</option>
        <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
        <option value="sd">Sindhi (سنڌي)</option>
      </select>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '4px 12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  select: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    fontSize: '0.875rem',
    color: '#1a1e23',
    cursor: 'pointer',
    fontWeight: '500'
  }
};

export default LanguageSelector;
