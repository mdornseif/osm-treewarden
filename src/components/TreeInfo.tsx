import React from 'react';
import { Tree } from '../types';
import { getTreeDisplayName, getTreeIssues } from '../utils/treeUtils';
import styles from '../styles/tree-popup.module.css';

interface TreeInfoProps {
  tree: Tree;
}

const TreeInfo: React.FC<TreeInfoProps> = ({ tree }) => {
  const { errors, warnings } = getTreeIssues(tree);
  
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

  const renderTagValue = (tagKey: string, tagValue: string) => {
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
    return <span className={styles['tag-value']}>{String(tagValue)}</span>;
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
                  <span className={styles['issue-message']}>{error.message}</span>
                </div>
              ))}
              {warnings.map((warning, index) => (
                <div key={`warning-${index}`} className={`${styles['issue-item']} ${styles['issue-warning']}`}>
                  <span className={styles['issue-icon']}>⚠️</span>
                  <span className={styles['issue-message']}>{warning.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tags Section */}
        {Object.keys(tree.properties).length > 0 && (
          <div className={styles['tree-tags']}>
            <strong>Tags:</strong>
            <div className={styles['tags-list']}>
              {sortTags(Object.entries(tree.properties)).map(([key, value]) => (
                <div key={key} className={styles['tag-item']}>
                  <a 
                    href={createTagLink(key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['tag-key']}
                  >
                    {key}
                  </a>
                  {renderTagValue(key, value)}
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