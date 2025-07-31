import React from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { usePatchStore } from '../store/usePatchStore';
import { clearTrees } from '../store/treeStore';
import { clearAllPatches } from '../store/patchStore';

const Settings: React.FC = () => {
  const { treeCount } = useTreeStore();
  const { patchCount } = usePatchStore();

  const handleClearTrees = () => {
    if (window.confirm('Are you sure you want to clear all trees? This action cannot be undone.')) {
      clearTrees();
    }
  };

  const handleClearPatches = () => {
    if (window.confirm('Are you sure you want to clear all patches? This action cannot be undone.')) {
      clearAllPatches();
    }
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h3>Settings</h3>
      </div>
      <div className="settings-content">
        <div className="settings-section">
          <h4>Store Information</h4>
          <div className="store-info">
            <div className="store-item">
              <span className="store-label">Trees in store:</span>
              <span className="store-value">{treeCount}</span>
            </div>
            <div className="store-item">
              <span className="store-label">Changes in patch store:</span>
              <span className="store-value">{patchCount}</span>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h4>Store Management</h4>
          <div className="store-actions">
            <button 
              className="clear-button clear-trees"
              onClick={handleClearTrees}
              disabled={treeCount === 0}
            >
              Clear Tree Store
            </button>
            <button 
              className="clear-button clear-patches"
              onClick={handleClearPatches}
              disabled={patchCount === 0}
            >
              Clear Patch Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;