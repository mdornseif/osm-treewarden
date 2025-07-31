import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { patches } from '../store/patchStore';
import { useTreeStore } from '../store/useTreeStore';
import { convertPatchesToOsmChange, downloadOsmChangeFile } from '../utils/osmChangeUtils';
import styles from '../styles/settings.module.css';

const UploadManager: React.FC = () => {
  const [showOsmChange, setShowOsmChange] = useState(false);
  const [osmChangeContent, setOsmChangeContent] = useState('');
  const patchStoreData = useStore(patches);
  const { trees } = useTreeStore();

  const handleShowOsmChange = () => {
    const osmChangeXml = convertPatchesToOsmChange(patchStoreData, trees);
    setOsmChangeContent(osmChangeXml);
    setShowOsmChange(true);
  };

  const handleDownloadOsmChange = () => {
    const osmChangeXml = convertPatchesToOsmChange(patchStoreData, trees);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadOsmChangeFile(osmChangeXml, `osm-change-${timestamp}.osc`);
  };

  const handleCloseOsmChange = () => {
    setShowOsmChange(false);
    setOsmChangeContent('');
  };

  return (
    <div className={styles.settings}>
      <div className={styles['settings-header']}>
        <h3>Upload Manager</h3>
      </div>
      <div className={styles['settings-content']}>
        <div className={styles['settings-section']}>
          <h4>Patch Store Daten</h4>
          <div className={styles['store-info']}>
            <div className={styles['store-item']}>
              <span className={styles['store-label']}>Anzahl Patches:</span>
              <span>{Object.keys(patchStoreData).length}</span>
            </div>
          </div>
          
          <div className={styles['store-actions']}>
            <button 
              className={styles['clear-button']}
              onClick={handleShowOsmChange}
              disabled={Object.keys(patchStoreData).length === 0}
            >
              OsmChange Format anzeigen
            </button>
            <button 
              className={styles['clear-button']}
              onClick={handleDownloadOsmChange}
              disabled={Object.keys(patchStoreData).length === 0}
            >
              OsmChange herunterladen
            </button>
          </div>
        </div>

        <div className={styles['settings-section']}>
          <h4>Patch Store JSON</h4>
          <div className={styles['json-display']}>
            <pre>{JSON.stringify(patchStoreData, null, 2)}</pre>
          </div>
        </div>

        {showOsmChange && (
          <div className={styles['osm-change-modal']}>
            <div className={styles['osm-change-content']}>
              <div className={styles['osm-change-header']}>
                <h4>OsmChange Format</h4>
                <button 
                  className={styles['close-button']}
                  onClick={handleCloseOsmChange}
                >
                  ×
                </button>
              </div>
              <div className={styles['osm-change-body']}>
                <pre>{osmChangeContent}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadManager; 