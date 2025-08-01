import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { patches } from '../store/patchStore';
import { useTreeStore } from '../store/useTreeStore';
import { useOsmAuth } from '../store/useOsmAuthStore';
import { convertPatchesToOsmChange, downloadOsmChangeFile } from '../utils/osmChangeUtils';
import { generateOSMXML, generateOSMUploadData, downloadOSMXMLFile } from '../utils/osmXmlUtils';
import { uploadToOSM, UploadProgress } from '../utils/osmUploadUtils';
import styles from '../styles/settings.module.css';

const UploadManager: React.FC = () => {
  const [showOsmChange, setShowOsmChange] = useState(false);
  const [osmChangeContent, setOsmChangeContent] = useState('');
  const [showOsmXml, setShowOsmXml] = useState(false);
  const [osmXmlContent, setOsmXmlContent] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const patchStoreData = useStore(patches);
  const { trees } = useTreeStore();
  const { isAuthenticated, login, getOsmAuthInstance } = useOsmAuth();

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

  const handleShowOsmXml = () => {
    const uploadData = generateOSMUploadData(patchStoreData, trees);
    if (uploadData) {
      const osmXml = generateOSMXML(uploadData);
      setOsmXmlContent(osmXml);
      setShowOsmXml(true);
    } else {
      alert('No changes to display. Please make some changes first.');
    }
  };

  const handleDownloadOsmXml = () => {
    const uploadData = generateOSMUploadData(patchStoreData, trees);
    if (uploadData) {
      const osmXml = generateOSMXML(uploadData);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadOSMXMLFile(osmXml, `osm-api-${timestamp}.xml`);
    } else {
      alert('No changes to download. Please make some changes first.');
    }
  };

  const handleCloseOsmXml = () => {
    setShowOsmXml(false);
    setOsmXmlContent('');
  };

  const handleUploadToOSM = async () => {
    if (Object.keys(patchStoreData).length === 0) {
      alert('No changes to upload. Please make some changes first.');
      return;
    }

    const osmAuthInstance = getOsmAuthInstance();
    if (!osmAuthInstance) {
      alert('OSM authentication not available. Please try logging in again.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ stage: 'creating-changeset', message: 'Starting upload...' });

    try {
      await uploadToOSM(patchStoreData, trees, osmAuthInstance, (progress) => {
        setUploadProgress(progress);
      });
      
      // Clear patches after successful upload
      // Note: This would require importing clearAllPatches from patchStore
      // For now, we'll just show success message
      
    } catch (error) {
      console.error('Upload failed:', error);
      // Error is already handled in uploadToOSM and shown via progress
    } finally {
      setIsUploading(false);
      // Clear progress after a delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 5000);
    }
  };

  const getUploadButtonText = () => {
    if (isUploading) {
      return 'Uploading...';
    }
    return 'Upload to OSM';
  };

  const getUploadButtonClass = () => {
    const baseClass = `${styles['auth-button']} ${styles['upload']}`;
    return isUploading ? `${baseClass} ${styles['uploading']}` : baseClass;
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
            <span className={styles['store-label']}>OsmChange:</span>
            <button 
              className={styles['clear-button']}
              onClick={handleShowOsmChange}
              disabled={Object.keys(patchStoreData).length === 0}
              title="OsmChange Format anzeigen"
            >
              👁️
            </button>
            <button 
              className={styles['clear-button']}
              onClick={handleDownloadOsmChange}
              disabled={Object.keys(patchStoreData).length === 0}
              title="OsmChange herunterladen"
            >
              ⬇️
            </button>
          </div>
          
          <div className={styles['store-actions']}>
            <span className={styles['store-label']}>OSM API:</span>
            <button 
              className={styles['clear-button']}
              onClick={handleShowOsmXml}
              disabled={Object.keys(patchStoreData).length === 0}
              title="OSM API XML anzeigen"
            >
              👁️
            </button>
            <button 
              className={styles['clear-button']}
              onClick={handleDownloadOsmXml}
              disabled={Object.keys(patchStoreData).length === 0}
              title="OSM API XML herunterladen"
            >
              ⬇️
            </button>
          </div>
        </div>

        <div className={styles['settings-section']}>
          <h4>Upload</h4>
          {!isAuthenticated ? (
            <div className={styles['auth-actions']}>
              <button 
                className={`${styles['auth-button']} ${styles['login']}`}
                onClick={login}
              >
                Bei OSM anmelden
              </button>
            </div>
          ) : (
            <div className={styles['auth-actions']}>
              <button 
                className={getUploadButtonClass()}
                onClick={handleUploadToOSM}
                disabled={isUploading || Object.keys(patchStoreData).length === 0}
              >
                {getUploadButtonText()}
              </button>
              {uploadProgress && (
                <div className={styles['upload-progress']}>
                  <div className={styles['upload-message']}>
                    {uploadProgress.message}
                  </div>
                  {uploadProgress.changesetId && (
                    <div className={styles['upload-changeset']}>
                      Changeset: {uploadProgress.changesetId}
                    </div>
                  )}
                  {uploadProgress.stage === 'error' && uploadProgress.error && (
                    <div className={styles['upload-error']}>
                      Error: {uploadProgress.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

        {showOsmXml && (
          <div className={styles['osm-change-modal']}>
            <div className={styles['osm-change-content']}>
              <div className={styles['osm-change-header']}>
                <h4>OSM API XML</h4>
                <button 
                  className={styles['close-button']}
                  onClick={handleCloseOsmXml}
                >
                  ×
                </button>
              </div>
              <div className={styles['osm-change-body']}>
                <pre>{osmXmlContent}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadManager; 