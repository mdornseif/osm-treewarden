import { useStore } from '@nanostores/react';
import { uiState, selectTree, closeTreeInfo } from './store/uiStore';
import { useTreeStore } from './store/useTreeStore';
import Map from './components/Map';
import TreeListSlidein from './components/TreeListSlidein';
import SettingsSlidein from './components/SettingsSlidein';
import UploadSlidein from './components/UploadSlidein';
import TreeInfoSlidein from './components/TreeInfoSlidein';
import { Tree } from './types';

function App() {
  const { selectedTreeId, isTreeInfoOpen, isTreeListOpen } = useStore(uiState);
  const { trees } = useTreeStore();
  
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