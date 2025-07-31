import React from 'react';
import { useTreeStore } from '../store/useTreeStore';
import { usePatchStore } from '../store/usePatchStore';
import { getTreeDisplayName, getTreeIssues } from '../utils/treeUtils';

const TreeList: React.FC = () => {
  const { trees, isLoading, error } = useTreeStore();
  const { hasPatchForOsmId } = usePatchStore();

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
            {trees.map((tree) => {
              const { errors, warnings } = getTreeIssues(tree);
              const hasErrors = errors.length > 0;
              const hasWarnings = warnings.length > 0;
              
              let itemClassName = 'tree-item';
              if (hasErrors) {
                itemClassName += ' tree-item-error';
              } else if (hasWarnings) {
                itemClassName += ' tree-item-warning';
              }

              const hasPatch = hasPatchForOsmId(tree.id);

              return (
                <li key={tree.id} className={itemClassName}>
                  <div className="tree-name">
                    {getTreeDisplayName(tree)}
                    {hasPatch && (
                      <span className="tree-updated-label">updated</span>
                    )}
                  </div>
                  <div className="tree-details">
                    <span className="tree-id">OSM ID: {tree.id}</span>
                    {tree.properties.species && (
                      <span className="tree-species">
                        {tree.properties.species}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TreeList; 