import React from 'react';
import { useStore } from '@nanostores/react';
import { uiState, selectTree, closeTreeInfo } from './store/uiStore';
import { useTreeStore } from './store/useTreeStore';
// Import osmAuthStore to ensure it gets initialized
import './store/osmAuthStore';
import Map from './components/Map';
import TreeInfoSlidein from './components/TreeInfoSlidein';
import { Tree } from './types';
import { initializeMapState } from './store/mapStateStore';

function App() {
  const { selectedTreeId, isTreeInfoOpen } = useStore(uiState);
  const { trees } = useTreeStore();
  
  // Initialize map state from URL parameters on app start
  React.useEffect(() => {
    initializeMapState();
  }, []);
  
  const selectedTree = selectedTreeId 
    ? trees.find(tree => tree.id === selectedTreeId) || null
    : null;

  const handleTreeSelect = (tree: Tree) => {
    selectTree(tree.id);
  };

  const handleTreeInfoClose = () => {
    closeTreeInfo();
  };

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}>
      <Map 
        onMarkerClick={handleTreeSelect}
        selectedTreeId={selectedTreeId}
      />
      <TreeInfoSlidein
        tree={selectedTree}
        isOpen={isTreeInfoOpen}
        onClose={handleTreeInfoClose}
      />
    </div>
  );
}

export default App; 