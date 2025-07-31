import React, { useState } from 'react';
import UploadManager from './UploadManager';
import { hasPatches } from '../store/patchStore';
import { useStore } from '@nanostores/react';
import styles from '../styles/settings.module.css';

const UploadSlidein: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const hasPatchesInStore = useStore(hasPatches);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  // Don't render anything if there are no patches
  if (!hasPatchesInStore) {
    return null;
  }

  return (
    <div className={`${styles['settings-window-container']} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles['upload-toggle']}
        onClick={toggleWindow}
        title={isOpen ? 'Upload Manager ausblenden' : 'Upload Manager anzeigen'}
      >
        {isOpen ? '×' : '📤'}
      </button>
      {isOpen && (
        <div className={styles['settings-window']}>
          <UploadManager />
        </div>
      )}
    </div>
  );
};

export default UploadSlidein; 