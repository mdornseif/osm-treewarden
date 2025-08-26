import React, { useState } from 'react';
import BackgroundLayerSelector from './BackgroundLayerSelector';
import styles from '../styles/background-layer.module.css';

const BackgroundLayerSlidein: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`${styles['background-layer-window-container']} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles['background-layer-toggle']}
        onClick={toggleWindow}
        title={isOpen ? 'Hintergrund-Karte ausblenden' : 'Hintergrund-Karte anzeigen'}
        data-testid="background-layer-toggle"
      >
        {isOpen ? '×' : '🗺️'}
      </button>
      {isOpen && (
        <div className={styles['background-layer-window']}>
          <BackgroundLayerSelector />
        </div>
      )}
    </div>
  );
};

export default BackgroundLayerSlidein; 