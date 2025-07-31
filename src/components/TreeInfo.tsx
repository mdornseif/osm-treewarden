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
      'taxon',
      'taxon:cultivar',
      'cultivar',
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
          className="tag-value wikidata-link"
        >
          {tagValue}
        </a>
      );
    }
    return <span className="tag-value">{String(tagValue)}</span>;
  };

  return (
    <div className="tree-info">
      <div className="tree-info-header">
        <h3 className="tree-name">{getTreeDisplayName(tree)}</h3>
        <div className="tree-osm-details">
        OSM ID: {' '} <a 
            href={createOsmLink(tree.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="tree-osm-id"
          >{tree.id}
          </a>
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
              {sortTags(Object.entries(tree.properties)).map(([key, value]) => (
                <div key={key} className="tag-item">
                  <a 
                    href={createTagLink(key)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tag-key"
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