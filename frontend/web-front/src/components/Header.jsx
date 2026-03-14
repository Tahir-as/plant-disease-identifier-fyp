import React from 'react';
import { Leaf } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

// Header component with logo and language selection
const Header = () => {
  return (
    <header className="header" style={styles.header}>
      {/* Brand logo and name */}
      <div className="logo-container" style={styles.logoContainer}>
        <div className="logo-icon" style={styles.logoIcon}>
          <Leaf className="leaf-icon" size={24} color="#10b981" />
        </div>
        <div className="logo-text">
          <h1 style={styles.title}>Plant Disease ID</h1>
        </div>
      </div>
      
      {/* Actions container with language selector */}
      <div className="header-actions">
        <LanguageSelector />
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoIcon: {
    backgroundColor: '#dcfce7',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1a1e23',
    margin: 0
  }
};

export default Header;
