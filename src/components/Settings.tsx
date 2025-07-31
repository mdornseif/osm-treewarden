import React from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { usePatchStore } from '../store/usePatchStore';
import { clearTrees } from '../store/treeStore';
import { clearAllPatches } from '../store/patchStore';

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
    <div className="settings">
      <div className="settings-header">
        <h3>Einstellungen</h3>
      </div>
      <div className="settings-content">
        <div className="settings-section">
          <h4>Speicher-Informationen</h4>
          <div className="store-info">
            <div className="store-item">
              <span className="store-label">Bäume im Speicher:</span>
              <span className="store-value">{treeCount}</span>
            </div>
            <div className="store-item">
              <span className="store-label">Änderungen im Patch-Speicher:</span>
              <span className="store-value">{patchCount}</span>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h4>Speicher-Verwaltung</h4>
          <div className="store-actions">
            <button 
              className="clear-button clear-trees"
              onClick={handleClearTrees}
              disabled={treeCount === 0}
            >
              Baum-Speicher löschen
            </button>
            <button 
              className="clear-button clear-patches"
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