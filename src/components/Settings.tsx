import React from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { usePatchStore } from '../store/usePatchStore';
import { clearTrees } from '../store/treeStore';
import { clearAllPatches } from '../store/patchStore';
import styles from '../styles/settings.module.css';

const Settings: React.FC = () => {
  const { treeCount } = useTreeStore();
  const { patchCount } = usePatchStore();

  const handleClearTrees = () => {
    if (window.confirm('Sind Sie sicher, dass Sie alle Bäume löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      clearTrees();
    }
  };

  const handleClearPatches = () => {
    if (window.confirm('Sind Sie sicher, dass Sie alle Änderungen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      clearAllPatches();
    }
  };

  return (
    <div className={styles.settings}>
      <div className={styles['settings-header']}>
        <h3>Einstellungen</h3>
      </div>
      <div className={styles['settings-content']}>
        <div className={styles['settings-section']}>
          <h4>Speicher-Informationen</h4>
          <div className={styles['store-info']}>
            <div className={styles['store-item']}>
              <span className={styles['store-label']}>Bäume im Speicher:</span>
              <span className={styles['store-value']}>{treeCount}</span>
            </div>
            <div className={styles['store-item']}>
              <span className={styles['store-label']}>Änderungen im Patch-Speicher:</span>
              <span className={styles['store-value']}>{patchCount}</span>
            </div>
          </div>
        </div>
        
        <div className={styles['settings-section']}>
          <h4>Speicher-Verwaltung</h4>
          <div className={styles['store-actions']}>
            <button 
              className={`${styles['clear-button']} ${styles['clear-trees']}`}
              onClick={handleClearTrees}
              disabled={treeCount === 0}
            >
              Baum-Speicher löschen
            </button>
            <button 
              className={`${styles['clear-button']} ${styles['clear-patches']}`}
              onClick={handleClearPatches}
              disabled={patchCount === 0}
            >
              Patch-Speicher löschen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;