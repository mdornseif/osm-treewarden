import React from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { getTreeDisplayName } from '../utils/treeUtils';

const TreeList: React.FC = () => {
  const { trees, isLoading, error } = useTreeStore();

  if (isLoading) {
    return (
      <div className="tree-list">
        <div className="tree-list-header">
          <h3>Trees</h3>
        </div>
        <div className="tree-list-content">
          <p>Loading trees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tree-list">
        <div className="tree-list-header">
          <h3>Trees</h3>
        </div>
        <div className="tree-list-content">
          <p className="error">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-list">
      <div className="tree-list-header">
        <h3>Trees ({trees.length})</h3>
      </div>
      <div className="tree-list-content">
        {trees.length === 0 ? (
          <p>No trees found in this area.</p>
        ) : (
          <ul className="tree-items">
            {trees.map((tree) => (
              <li key={tree.id} className="tree-item">
                <div className="tree-name">{getTreeDisplayName(tree)}</div>
                <div className="tree-details">
                  <span className="tree-coordinates">
                    {tree.lat.toFixed(6)}, {tree.lon.toFixed(6)}
                  </span>
                  {tree.properties.species && (
                    <span className="tree-species">
                      {tree.properties.species}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TreeList; 