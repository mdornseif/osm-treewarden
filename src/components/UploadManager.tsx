import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { patches, clearAllPatches, loadPatchesFromOsmChange } from '../store/patchStore';
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
  const [fileUploadMessage, setFileUploadMessage] = useState<string>('');
  
  const patchStoreData = useStore(patches);
  const { trees, bounds, loadTreesForBounds } = useTreeStore();
  const { isAuthenticated, login, getOsmAuthInstance } = useOsmAuth();

  const handleShowOsmChange = () => {
    console.log('🔍 handleShowOsmChange called');
    console.log('🔍 patchStoreData:', patchStoreData);
    console.log('🔍 trees count:', trees.length);
    console.log('🔍 trees sample:', trees.slice(0, 2));
    
    const osmChangeXml = convertPatchesToOsmChange(patchStoreData, trees);
    console.log('🔍 osmChangeXml result:', osmChangeXml);
    console.log('🔍 osmChangeXml length:', osmChangeXml.length);
    
    setOsmChangeContent(osmChangeXml);
    setShowOsmChange(true);
  };

  const handleDownloadOsmChange = () => {
    console.log('🔍 handleDownloadOsmChange called');
    console.log('🔍 patchStoreData:', patchStoreData);
    console.log('🔍 trees count:', trees.length);
    
    const osmChangeXml = convertPatchesToOsmChange(patchStoreData, trees);
    console.log('🔍 osmChangeXml for download:', osmChangeXml);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadOsmChangeFile(osmChangeXml, `osm-change-${timestamp}.osc`);
  };

  const handleCloseOsmChange = () => {
    setShowOsmChange(false);
    setOsmChangeContent('');
  };

  const handleShowOsmXml = () => {
    console.log('🔍 handleShowOsmXml called');
    console.log('🔍 patchStoreData:', patchStoreData);
    console.log('🔍 trees count:', trees.length);
    console.log('🔍 trees sample:', trees.slice(0, 2));
    
    const uploadData = generateOSMUploadData(patchStoreData, trees);
    console.log('🔍 uploadData result:', uploadData);
    
    if (uploadData) {
      console.log('🔍 uploadData is not null, generating XML...');
      const osmXml = generateOSMXML(uploadData);
      console.log('🔍 osmXml result:', osmXml);
      console.log('🔍 osmXml length:', osmXml.length);
      
      setOsmXmlContent(osmXml);
      setShowOsmXml(true);
    } else {
      console.warn('❌ uploadData is null - no changes to display');
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.toLowerCase().endsWith('.osc')) {
      setFileUploadMessage('❌ Please select a .osc file (OsmChange format)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          const success = loadPatchesFromOsmChange(content);
          if (success) {
            setFileUploadMessage(`✅ Successfully loaded OsmChange file: ${file.name}`);
            // Clear message after 3 seconds
            setTimeout(() => setFileUploadMessage(''), 3000);
          } else {
            setFileUploadMessage('❌ Failed to load OsmChange file. Please check the file format.');
          }
        } catch (error) {
          setFileUploadMessage(`❌ Error loading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    };
    reader.onerror = () => {
      setFileUploadMessage('❌ Error reading file');
    };
    reader.readAsText(file);

    // Reset the input
    event.target.value = '';
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
      
      // Upload successful - clear patches and reload trees
      console.log('✅ Upload successful, clearing patches and reloading trees...');
      
      // Clear all patches from the store
      clearAllPatches();
      
      // Reload trees if we have current bounds
      if (bounds) {
        console.log('🔄 Reloading trees with current bounds:', bounds);
        await loadTreesForBounds(bounds, true); // Force reload after upload
      } else {
        console.log('⚠️ No current bounds available, skipping tree reload');
      }
      
      setUploadProgress({ 
        stage: 'complete', 
        message: 'Upload completed successfully! Patches cleared and trees reloaded.', 
        changesetId: uploadProgress?.changesetId 
      });
      
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
            <span className={styles['store-label']}>OsmChange laden:</span>
            <input
              type="file"
              accept=".osc"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="osmchange-file-input"
            />
            <label htmlFor="osmchange-file-input" className={styles['file-upload-button']}>
              📁 Datei auswählen
            </label>
          </div>
          
          {fileUploadMessage && (
            <div className={`${styles['file-upload-message']} ${fileUploadMessage.includes('✅') ? styles.success : styles.error}`}>
              {fileUploadMessage}
            </div>
          )}
          
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