import React from 'react';
import { Popup } from 'react-leaflet';
import { Tree } from '../types';
import { getTreeDisplayName } from '../utils/treeUtils';
import styles from '../styles/tree-markers.module.css';

interface TreePopupProps {
  tree: Tree;
}

const TreePopup: React.FC<TreePopupProps> = ({ tree }) => {
  const treeName = getTreeDisplayName(tree);
  const osmLink = `https://www.openstreetmap.org/node/${tree.id}`;

  return (
    <Popup className={styles['tree-popup']}>
      <div className={styles['tree-popup-content']}>
        <div className={styles['tree-popup-title']}>
          {treeName}
        </div>
        <div className={styles['tree-popup-osm']}>
          <a 
            href={osmLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles['tree-popup-osm-link']}
          >
            OSM ID: {tree.id}
          </a>
        </div>
      </div>
    </Popup>
  );
};

export default TreePopup; 