import React from 'react';
import { Tree } from '../types';
import TreeInfo from './TreeInfo';
import styles from '../styles/tree-popup.module.css';

interface TreeInfoSlideinProps {
  tree: Tree | null;
  isOpen: boolean;
  onClose: () => void;
}

const TreeInfoSlidein: React.FC<TreeInfoSlideinProps> = ({ tree, isOpen, onClose }) => {
  return (
    <div 
      className={`${styles['tree-info-sidebar-container']} ${isOpen ? styles.open : ''}`}
      onClick={onClose}
    >
      {isOpen && tree && (
        <div 
          className={styles['tree-info-sidebar']}
          onClick={(e) => e.stopPropagation()}
        >
          <TreeInfo tree={tree} onClose={onClose} />
        </div>
      )}
    </div>
  );
};

export default TreeInfoSlidein; 