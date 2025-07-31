import React from 'react';
import { Tree } from '../types';
import { getTreeDisplayName } from '../utils/treeUtils';

interface TreeInfoProps {
  tree: Tree;
}

const TreeInfo: React.FC<TreeInfoProps> = ({ tree }) => {
  return (
    <div className="tree-info">
      <div className="tree-info-header">
        <h3 className="tree-name">{getTreeDisplayName(tree)}</h3>
        <div className="tree-osm-details">
          <span className="tree-osm-id">OSM ID: {tree.id}</span>
          {tree.version && (
            <span className="tree-osm-version">Version: {tree.version}</span>
          )}
        </div>
      </div>
      
      <div className="tree-info-content">
        <div className="tree-coordinates">
          <strong>Coordinates:</strong> {tree.lat.toFixed(6)}, {tree.lon.toFixed(6)}
        </div>
        
        {tree.properties.species && (
          <div className="tree-species">
            <strong>Species:</strong> {tree.properties.species}
          </div>
        )}
        
        {tree.properties.genus && (
          <div className="tree-genus">
            <strong>Genus:</strong> {tree.properties.genus}
          </div>
        )}
        
        {Object.keys(tree.properties).length > 0 && (
          <div className="tree-tags">
            <strong>Tags:</strong>
            <div className="tags-list">
              {Object.entries(tree.properties).map(([key, value]) => (
                <div key={key} className="tag-item">
                  <span className="tag-key">{key}:</span>
                  <span className="tag-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreeInfo; 