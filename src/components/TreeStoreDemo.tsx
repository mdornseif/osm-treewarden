import React from 'react';
import { useTreeStore } from '../store/useTreeStore';

const TreeStoreDemo: React.FC = () => {
  const { 
    error, 
    bounds, 
    lastUpdated,
    treeCount,
    hasTrees,
    isLoading,
    hasError,
    loadTreesForBounds,
    clearTrees,
    clearError,
    getTreesBySpecies,
    getTreesByGenus
  } = useTreeStore();

  const handleLoadCologne = async () => {
    const cologneBounds = {
      south: 50.8,
      west: 6.9,
      north: 51.0,
      east: 7.2
    };
    await loadTreesForBounds(cologneBounds);
  };

  const handleLoadBerlin = async () => {
    const berlinBounds = {
      south: 52.4,
      west: 13.3,
      north: 52.6,
      east: 13.5
    };
    await loadTreesForBounds(berlinBounds);
  };

  const handleClear = () => {
    clearTrees();
  };

  const oakTrees = getTreesBySpecies('Quercus');
  const mapleTrees = getTreesByGenus('Acer');

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 1000,
      maxWidth: '300px',
      fontSize: '14px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Tree Store Demo</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={handleLoadCologne}
          disabled={isLoading}
          style={{ marginRight: '5px', padding: '5px 10px' }}
        >
          Load Cologne
        </button>
        <button 
          onClick={handleLoadBerlin}
          disabled={isLoading}
          style={{ marginRight: '5px', padding: '5px 10px' }}
        >
          Load Berlin
        </button>
        <button 
          onClick={handleClear}
          style={{ padding: '5px 10px' }}
        >
          Clear
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong>
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Trees: {treeCount}</div>
        <div>Has Trees: {hasTrees ? 'Yes' : 'No'}</div>
        {hasError && <div style={{ color: 'red' }}>Error: {error}</div>}
      </div>

      {bounds && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Current Bounds:</strong>
          <div>South: {bounds.south.toFixed(3)}</div>
          <div>West: {bounds.west.toFixed(3)}</div>
          <div>North: {bounds.north.toFixed(3)}</div>
          <div>East: {bounds.east.toFixed(3)}</div>
        </div>
      )}

      {lastUpdated && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Last Updated:</strong>
          <div>{lastUpdated.toLocaleTimeString()}</div>
        </div>
      )}

      {hasTrees && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Tree Types:</strong>
          <div>Oak Trees: {oakTrees.length}</div>
          <div>Maple Trees: {mapleTrees.length}</div>
        </div>
      )}

      {hasError && (
        <button 
          onClick={clearError}
          style={{ padding: '5px 10px', background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '3px' }}
        >
          Clear Error
        </button>
      )}
    </div>
  );
};

export default TreeStoreDemo; 