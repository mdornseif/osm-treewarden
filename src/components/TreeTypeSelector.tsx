import React from 'react';
import { selectTreeType, cancelAddingTree } from '../store/treeStore';
import styles from '../styles/tree-type-selector.module.css';

interface TreeTypeSelectorProps {
  isVisible: boolean;
}

const TreeTypeSelector: React.FC<TreeTypeSelectorProps> = ({ isVisible }) => {
  if (!isVisible) {
    return null;
  }

  const handleTreeTypeSelect = (treeType: string) => {
    selectTreeType(treeType);
  };

  const handleCancel = () => {
    cancelAddingTree();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3>Baum hinzufügen</h3>
          <button 
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Schließen"
          >
            ×
          </button>
        </div>
        
        <div className={styles.content}>
          <p>Welche Art von Baum möchten Sie hinzufügen?</p>
          
          <div className={styles.treeOptions}>
            <button 
              className={styles.treeOption}
              onClick={() => handleTreeTypeSelect('apple')}
            >
              <div className={styles.treeIcon}>🍎</div>
              <div className={styles.treeInfo}>
                <div className={styles.treeName}>Apfel</div>
                <div className={styles.treeSpecies}>Malus domestica</div>
              </div>
            </button>
            
            <button 
              className={styles.treeOption}
              onClick={() => handleTreeTypeSelect('pear')}
            >
              <div className={styles.treeIcon}>🍐</div>
              <div className={styles.treeInfo}>
                <div className={styles.treeName}>Birne</div>
                <div className={styles.treeSpecies}>Pyrus communis</div>
              </div>
            </button>
          </div>
        </div>
        
        <div className={styles.footer}>
          <button 
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreeTypeSelector; 