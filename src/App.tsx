import React from 'react';
import { useStore } from '@nanostores/react';
import { uiState, selectTree, closeTreeInfo } from './store/uiStore';
import { useTreeStore } from './store/useTreeStore';
import { useMapStore } from './store/useMapStore';
import { initializeMapState } from './store/mapStore';
// Import osmAuthStore to ensure it gets initialized
import './store/osmAuthStore';
import Map from './components/Map';
import TreeListSlidein from './components/TreeListSlidein';
import SettingsSlidein from './components/SettingsSlidein';
import UploadSlidein from './components/UploadSlidein';
import TreeInfoSlidein from './components/TreeInfoSlidein';
import { Tree } from './types';

function App() {
  const { selectedTreeId, isTreeInfoOpen, isTreeListOpen } = useStore(uiState);
  const { trees } = useTreeStore();
  const mapState = useMapStore();
  
  // Initialize map state from URL parameters on component mount
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
        center={mapState.center}
        zoom={mapState.zoom}
        onMarkerClick={handleTreeSelect}
        selectedTreeId={selectedTreeId}
      />
      <SettingsSlidein />
      <UploadSlidein />
      <TreeListSlidein 
        isOpen={isTreeListOpen}
        onTreeSelect={handleTreeSelect}
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