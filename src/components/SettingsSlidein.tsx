import React, { useState } from 'react';
import Settings from './Settings';
import styles from '../styles/settings.module.css';

const SettingsSlidein: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`${styles['settings-window-container']} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles['settings-toggle']}
        onClick={toggleWindow}
                  title={isOpen ? 'Einstellungen ausblenden' : 'Einstellungen anzeigen'}
      >
        {isOpen ? '×' : '⚙️'}
      </button>
      {isOpen && (
        <div className={styles['settings-window']}>
          <Settings />
        </div>
      )}
    </div>
  );
};

export default SettingsSlidein;