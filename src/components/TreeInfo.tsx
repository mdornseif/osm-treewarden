import React from 'react';
import { Tree } from '../types';
import { getTreeDisplayName } from '../utils/treeUtils';

interface TreeInfoProps {
  tree: Tree;
}

const TreeInfo: React.FC<TreeInfoProps> = ({ tree }) => {
  const createTagLink = (tagKey: string) => {
    const encodedKey = encodeURIComponent(tagKey);
    return `https://wiki.openstreetmap.org/wiki/DE:Key:${encodedKey}`;
  };

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
        {Object.keys(tree.properties).length > 0 && (
          <div className="tree-tags">
            <strong>Tags:</strong>
            <div className="tags-list">
              {Object.entries(tree.properties).map(([key, value]) => (
                <div key={key} className="tag-item">
                  <a 
                    href={createTagLink(key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tag-key"
                  >
                    {key}
                  </a>
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