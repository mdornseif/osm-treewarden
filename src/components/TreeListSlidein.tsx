import React from 'react';
import { toggleTreeList } from '../store/uiStore';
import TreeList from './TreeList';
import styles from '../styles/tree-list.module.css';
import { Tree } from '../types';

interface TreeListSlideinProps {
  isOpen: boolean;
  onTreeSelect: (tree: Tree) => void;
  selectedTreeId: number | null;
}

const TreeListSlidein: React.FC<TreeListSlideinProps> = ({
  isOpen,
  onTreeSelect,
  selectedTreeId,
}) => {
  return (
    <div className={`${styles['tree-list-window-container']} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles['tree-list-toggle']}
        onClick={toggleTreeList}
        title={isOpen ? 'Baumliste ausblenden' : 'Baumliste anzeigen'}
      >
        {isOpen ? '×' : '🌳'}
      </button>
      {isOpen && (
        <div className={styles['tree-list-window']}>
          <TreeList 
            onTreeSelect={onTreeSelect}
            selectedTreeId={selectedTreeId}
          />
        </div>
      )}
    </div>
  );
};

export default TreeListSlidein; 