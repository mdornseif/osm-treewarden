import { useStore } from '@nanostores/react';
import { uiState, selectTree, closeTreeInfo } from './store/uiStore';
import { useTreeStore } from './store/useTreeStore';
import { useOsmAuth } from './store/useOsmAuthStore';
// Import osmAuthStore to ensure it gets initialized
import './store/osmAuthStore';
import Map from './components/Map';
import TreeListSlidein from './components/TreeListSlidein';
import SettingsSlidein from './components/SettingsSlidein';
import UploadSlidein from './components/UploadSlidein';
import TreeInfoSlidein from './components/TreeInfoSlidein';
import { Tree } from './types';
import styles from './styles/settings.module.css';

function App() {
  const { selectedTreeId, isTreeInfoOpen, isTreeListOpen } = useStore(uiState);
  const { trees } = useTreeStore();
  const { isAuthenticated, login } = useOsmAuth();
  
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
      {!isAuthenticated && (
        <button 
          className={`${styles['auth-button']} ${styles['login']}`}
          onClick={login}
          style={{
            position: 'absolute',
            top: '160px',
            right: '10px',
            width: '40px',
            height: '40px',
            border: 'none',
            borderRadius: '50%',
            fontSize: '18px',
            cursor: 'pointer',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 0,
            lineHeight: 1
          }}
          title="Bei OSM anmelden"
        >
          🔐
        </button>
      )}
    </div>
  );
}

export default App; 