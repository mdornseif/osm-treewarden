import React from 'react';
import { useMap } from 'react-leaflet';
import { startAddingTree, isAddingTree, selectedTreeType, addTreeAtLocation } from '../store/treeStore';
import { useStore } from '@nanostores/react';
import styles from '../styles/map-controls.module.css';

const MapControls: React.FC = () => {
  const map = useMap();
  const addingTree = useStore(isAddingTree);
  const treeType = useStore(selectedTreeType);

  const handleAddTreeClick = () => {
    startAddingTree();
  };

  const handleMapClick = (e: any) => {
    if (addingTree && treeType) {
      const { lat, lng } = e.latlng;
      addTreeAtLocation(lat, lng);
    }
  };

  // Add click listener to map when in adding mode
  React.useEffect(() => {
    if (addingTree && treeType) {
      map.on('click', handleMapClick);
      
      // Change cursor to indicate adding mode
      map.getContainer().style.cursor = 'crosshair';
      
      return () => {
        map.off('click', handleMapClick);
        map.getContainer().style.cursor = '';
      };
    }
  }, [map, addingTree, treeType]);

  return (
    <div className={styles.mapControls}>
      <button
        className={`${styles.controlButton} ${styles.addButton} ${addingTree ? styles.active : ''}`}
        onClick={handleAddTreeClick}
        title={addingTree ? "Klicken Sie auf die Karte, um einen Baum hinzuzufügen" : "Baum hinzufügen"}
        disabled={addingTree}
      >
        <span className={styles.buttonIcon}>➕</span>
        {addingTree && treeType && (
          <span className={styles.addingIndicator}>
            {treeType === 'apple' ? '🍎' : '🍐'} Klicken Sie auf die Karte
          </span>
        )}
      </button>
    </div>
  );
};

export default MapControls; 