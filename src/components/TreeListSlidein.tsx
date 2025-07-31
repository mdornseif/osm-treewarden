import React, { useState } from 'react';
import TreeList from './TreeList';
import styles from '../styles/tree-list.module.css';
import { Tree } from '../types';

interface TreeListSlideinProps {
  onTreeSelect: (tree: Tree) => void;
}

const TreeListSlidein: React.FC<TreeListSlideinProps> = ({ onTreeSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`${styles['tree-list-window-container']} ${isOpen ? styles.open : ''}`}>
      <button 
        className={styles['tree-list-toggle']}
        onClick={toggleWindow}
                  title={isOpen ? 'Baumliste ausblenden' : 'Baumliste anzeigen'}
      >
        {isOpen ? '×' : '🌳'}
      </button>
      {isOpen && (
        <div className={styles['tree-list-window']}>
          <TreeList onTreeSelect={onTreeSelect} />
        </div>
      )}
    </div>
  );
};

export default TreeListSlidein; 