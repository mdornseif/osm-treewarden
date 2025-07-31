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
          <p>Bäume werden geladen...</p>
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
          <p className="error">Fehler: {error}</p>
        </div>
      </div>
    );
  }

  // Sort trees in reverse order by genus + species + osm.id
  const sortedTrees = [...trees].sort((a, b) => {
    const aKey = `${a.properties.genus || ''}${a.properties.species || ''}${a.id}`;
    const bKey = `${b.properties.genus || ''}${b.properties.species || ''}${b.id}`;
    return bKey.localeCompare(aKey); // Reverse sort
  });

  return (
    <div className="tree-list">
      <div className="tree-list-header">
        <h3>Bäume ({trees.length})</h3>
      </div>
      <div className="tree-list-content">
        {trees.length === 0 ? (
          <p>Keine Bäume in diesem Bereich gefunden.</p>
        ) : (
          <ul className="tree-items">
            {sortedTrees.map((tree) => {
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
                      <span className="tree-updated-label">aktualisiert</span>
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