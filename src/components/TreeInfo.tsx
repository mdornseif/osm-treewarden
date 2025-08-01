import React, { useState } from 'react';
import { Tree } from '../types';
import { getTreeDisplayName, getTreeIssues } from '../utils/treeUtils';
import { addPatch, getPatchByOsmId, hasPatchForOsmId, getPatchedTree } from '../store/patchStore';
import styles from '../styles/tree-popup.module.css';

interface TreeInfoProps {
  tree: Tree;
}

const TreeInfo: React.FC<TreeInfoProps> = ({ tree }) => {
const patchedTree = getPatchedTree(tree)  
  const { errors, warnings } = getTreeIssues(patchedTree);
  
  // State for inline editing
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Check for patches for this tree
  const hasPatch = hasPatchForOsmId(tree.id);
  const patch = hasPatch ? getPatchByOsmId(tree.id) : null;
  
  const handleApplyPatch = (patch: { key: string; value: string }[]) => {
    const patchData: Record<string, string> = {};
    patch.forEach(({ key, value }) => {
      patchData[key] = value;
    });
    addPatch(tree.id, tree.version || 1, patchData);
  };
  
  const isTagPatched = (tagKey: string) => {
    return patch && patch.changes && tagKey in patch.changes;
  };
  
  const isTagNew = (tagKey: string) => {
    return patch && patch.changes && tagKey in patch.changes && !(tagKey in tree.properties);
  };
  
  const isTagModified = (tagKey: string) => {
    return patch && patch.changes && tagKey in patch.changes && tagKey in tree.properties;
  };
  
  const getTagStatus = (tagKey: string) => {
    if (isTagNew(tagKey)) return 'new';
    if (isTagModified(tagKey)) return 'modified';
    return 'unchanged';
  };
  
  const createTagLink = (tagKey: string) => {
    const encodedKey = encodeURIComponent(tagKey);
    return `https://wiki.openstreetmap.org/wiki/DE:Key:${encodedKey}`;
  };

  const createOsmLink = (osmId: number) => {
    return `https://www.openstreetmap.org/node/${osmId}`;
  };

  const createWikidataLink = (wikidataId: string) => {
    return `https://www.wikidata.org/wiki/${wikidataId}`;
  };

  const isWikidataTag = (tagKey: string) => {
    return tagKey.endsWith(':wikidata');
  };

  const sortTags = (entries: [string, any][]) => {
    const priorityOrder = [
      'genus',
      'species', 
      'species:wikidata',
      'taxon',
      'taxon:cultivar',
      'cultivar',
      'cultivar:wikidata',
      'denotation',
      'leaf_type',
      'leaf_cycle'
    ];

    return entries.sort(([keyA], [keyB]) => {
      const indexA = priorityOrder.indexOf(keyA);
      const indexB = priorityOrder.indexOf(keyB);
      
      // If both keys are in priority order, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only keyA is in priority order, it comes first
      if (indexA !== -1) {
        return -1;
      }
      
      // If only keyB is in priority order, it comes first
      if (indexB !== -1) {
        return 1;
      }
      
      // If neither is in priority order, sort alphabetically
      return keyA.localeCompare(keyB);
    });
  };

  const handleStartEdit = (tagKey: string, currentValue: string) => {
    setEditingTag(tagKey);
    setEditValue(currentValue);
  };

  const handleSaveEdit = (tagKey: string) => {
    if (editValue.trim() !== '') {
      const patchData: Record<string, string> = {};
      patchData[tagKey] = editValue.trim();
      addPatch(tree.id, tree.version || 1, patchData);
    }
    setEditingTag(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, tagKey: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(tagKey);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const renderTagValue = (tagKey: string, tagValue: string) => {
    // Don't allow editing of Wikidata tags
    if (isWikidataTag(tagKey)) {
      return (
        <a
          href={createWikidataLink(tagValue)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles['tag-value']} ${styles['wikidata-link']}`}
        >
          {tagValue}
        </a>
      );
    }

    // If this tag is being edited, show input field
    if (editingTag === tagKey) {
      return (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, tagKey)}
          onBlur={() => handleSaveEdit(tagKey)}
          className={`${styles['tag-value']} ${styles['tag-value-editing']}`}
          autoFocus
        />
      );
    }

    // Check if this tag has been modified
    const isModified = isTagModified(tagKey);
    const newValue = isModified && patch ? patch.changes[tagKey] : null;

    // Otherwise show clickable span
    return (
      <span 
        className={`${styles['tag-value']} ${styles['tag-value-editable']}`}
        onClick={() => handleStartEdit(tagKey, tagValue)}
        title="Klicken zum Bearbeiten"
      >
        {isModified ? (
          <>
            <span className={styles['tag-value-old']}>
              {String(tagValue)}
            </span>
            {' → '}
            <span className={styles['tag-value-new']}>
              {newValue}
            </span>
          </>
        ) : (
          String(tagValue)
        )}
      </span>
    );
  };

  const renderTagStatus = (tagKey: string) => {
    const status = getTagStatus(tagKey);
    
    if (status === 'new') {
      return (
        <span className={styles['tag-status']} title="Neuer Tag wird hinzugefügt">
          ➕ Neu
        </span>
      );
    }
    
    return null;
  };

  return (
    <div className={styles['tree-info']}>
      <div className={styles['tree-info-header']}>
        <h3 className={styles['tree-name']}>{getTreeDisplayName(tree)}</h3>
        <div className={styles['tree-osm-details']}>
        OSM ID: {' '} <a 
            href={createOsmLink(tree.id)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles['tree-osm-id']}
          >{tree.id}
          </a>
          {tree.version && (
            <span className={styles['tree-osm-version']}>Version: {tree.version}</span>
          )}
        </div>
      </div>
      
      <div className={styles['tree-info-content']}>
        {/* Issues Section */}
        {(errors.length > 0 || warnings.length > 0) && (
          <div className={styles['tree-issues']}>
            <strong>Probleme:</strong>
            <div className={styles['issues-list']}>
              {errors.map((error, index) => (
                <div key={`error-${index}`} className={`${styles['issue-item']} ${styles['issue-error']}`}>
                  <span className={styles['issue-icon']}>❌</span>
                  <div className={styles['issue-message']}>
                    {error.message}
                    {error.patch && (
                      <div>
                        Beheben, indem{' '}
                        {error.patch.map((patch, patchIndex) => (
                          <span key={patchIndex}>
                            {patchIndex > 0 && ' und '}
                            <code>{patch.key} = {patch.value}</code>
                          </span>
                        ))}
                        {' '}gesetzt wird?{' '}
                        <button
                          className={styles['patch-button']}
                          onClick={() => handleApplyPatch(error.patch!)}
                        >
                          ja
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {warnings.map((warning, index) => (
                <div key={`warning-${index}`} className={`${styles['issue-item']} ${styles['issue-warning']}`}>
                  <span className={styles['issue-icon']}>⚠️</span>
                  <span className={styles['issue-message']}>
                    {warning.message}
                    {warning.patch && (
                      <span>
                        {' '}Beheben, indem{' '}
                        {warning.patch.map((patch, patchIndex) => (
                          <span key={patchIndex}>
                            {patchIndex > 0 && ' und '}
                            <strong>{patch.key}</strong> auf <strong>{patch.value}</strong>
                          </span>
                        ))}
                        {' '}gesetzt wird?{' '}
                        <button
                          className={styles['patch-button']}
                          onClick={() => handleApplyPatch(warning.patch!)}
                        >
                          [ja]
                        </button>
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tags Section */}
        <div className={styles['tree-tags']}>
          <strong>Tags:</strong>
          <div className={styles['tags-list']}>
            {/* Existing tags */}
            {Object.keys(tree.properties).length > 0 && 
              sortTags(Object.entries(tree.properties)).map(([key, value]) => (
                <div key={key} className={`${styles['tag-item']} ${isTagPatched(key) ? styles['tag-patched'] : ''}`}>
                  <a 
                    href={createTagLink(key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['tag-key']}
                  >
                    {key}
                  </a>
                  {renderTagValue(key, value)}
                  {renderTagStatus(key)}
                </div>
              ))
            }
            {/* Patched tags that don't exist yet */}
            {patch && patch.changes && 
              Object.entries(patch.changes)
                .filter(([key]) => !(key in tree.properties))
                .map(([key, value]) => (
                  <div key={key} className={`${styles['tag-item']} ${styles['tag-patched']} ${styles['tag-new']}`}>
                    <a 
                      href={createTagLink(key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles['tag-key']}
                    >
                      {key}
                    </a>
                    <span className={styles['tag-value']}>
                       {value}
                    </span>
                    {renderTagStatus(key)}
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreeInfo; 