import React, { useState } from 'react';
import { Tree } from '../types';
import { getTreeDisplayName, getTreeIssues } from '../utils/treeUtils';
import { addPatch, getPatchedTree } from '../store/patchStore';
import { usePatchByOsmId } from '../store/usePatchStore';
import { useOrchards } from '../store/useTreeStore';
import styles from '../styles/tree-popup.module.css';

interface TreeInfoProps {
  tree: Tree;
  onClose?: () => void;
}

const TreeInfo: React.FC<TreeInfoProps> = ({ tree, onClose }) => {
  const patchedTree = getPatchedTree(tree);
  const orchards = useOrchards();
  const { errors, warnings } = getTreeIssues(patchedTree, orchards);
  
  // Subscribe to patchStore changes for this specific tree
  const { patch } = usePatchByOsmId(tree.id);
  
  // State for inline editing
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
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

  const sortTags = (entries: [string, string | number | undefined][]) => {
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

  const hasSpeciesCultivarTag = () => {
    return 'species:cultivar' in patchedTree.properties || 
           (patch && patch.changes && 'species:cultivar' in patch.changes);
  };

  const hasGenusTag = () => {
    return 'genus' in patchedTree.properties || 
           (patch && patch.changes && 'genus' in patch.changes);
  };

  const hasSpeciesTag = () => {
    return 'species' in patchedTree.properties || 
           (patch && patch.changes && 'species' in patch.changes);
  };

  const handleAddSpeciesCultivar = () => {
    const patchData: Record<string, string> = {};
    patchData['species:cultivar'] = '';
    addPatch(tree.id, tree.version || 1, patchData);
    // Start editing the new tag immediately
    setEditingTag('species:cultivar');
    setEditValue('');
  };

  const handleAddGenus = () => {
    const patchData: Record<string, string> = {};
    patchData['genus'] = '';
    addPatch(tree.id, tree.version || 1, patchData);
    // Start editing the new tag immediately
    setEditingTag('genus');
    setEditValue('');
  };

  const handleAddSpecies = () => {
    const patchData: Record<string, string> = {};
    patchData['species'] = '';
    addPatch(tree.id, tree.version || 1, patchData);
    // Start editing the new tag immediately
    setEditingTag('species');
    setEditValue('');
  };

  const renderTagValue = (tagKey: string, tagValue: string) => {
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

    // Show clickable span with optional link icon for Wikidata tags
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
        {isWikidataTag(tagKey) && (
          <a
            href={createWikidataLink(tagValue)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles['wikidata-link-icon']}
            title="Wikidata öffnen"
            onClick={(e) => e.stopPropagation()} // Prevent triggering edit mode
          >
            🔗
          </a>
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
        <div className={styles['tree-info-header-content']}>
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
        {onClose && (
          <button 
            className={styles['close-button']} 
            onClick={onClose}
            title="Tree-Info Panel schließen"
          >
            ×
          </button>
        )}
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
                            <code>{patch.key} = {patch.value}</code>
                          </span>
                        ))}
                        {' '}gesetzt wird?{' '}
                        <button
                          className={styles['patch-button']}
                          onClick={() => handleApplyPatch(warning.patch!)}
                        >
                          ja
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
                  {renderTagValue(key, String(value || ''))}
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
                    {renderTagValue(key, value)}
                    {renderTagStatus(key)}
                  </div>
                ))
            }
          </div>
        </div>

        {/* Add Tag Buttons */}
        <div className={styles['add-tag-buttons']}>
          {!hasGenusTag() && (
            <div className={styles['add-tag-button-container']}>
              <button 
                className={styles['add-tag-button']}
                onClick={handleAddGenus}
                title="Genus hinzufügen"
              >
                ➕ Genus
              </button>
            </div>
          )}
          
          {!hasSpeciesTag() && (
            <div className={styles['add-tag-button-container']}>
              <button 
                className={styles['add-tag-button']}
                onClick={handleAddSpecies}
                title="Species hinzufügen"
              >
                ➕ Species
              </button>
            </div>
          )}

          {!hasSpeciesCultivarTag() && (
            <div className={styles['add-tag-button-container']}>
              <button 
                className={styles['add-tag-button']}
                onClick={handleAddSpeciesCultivar}
                title="Species:cultivar hinzufügen"
              >
                ➕ Species:cultivar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TreeInfo; 