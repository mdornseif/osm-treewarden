import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { Tree } from '../types';

interface TreeLayerProps {
  trees: Tree[];
}

const TreeLayer: React.FC<TreeLayerProps> = ({ trees }) => {
  // Helper function to get tree display name
  const getTreeDisplayName = (tree: Tree): string => {
    const properties = tree.properties;
    
    // Priority order: taxon:cultivar > taxon > species > genus
    if (properties['taxon:cultivar']) {
      return properties['taxon:cultivar'];
    }
    if (properties.taxon) {
      return properties.taxon;
    }
    if (properties.species) {
      return properties.species;
    }
    if (properties.genus) {
      return properties.genus;
    }
    
    // Fallback to tree ID if no name available
    return `Tree ${tree.id}`;
  };

  return (
    <>
      {trees.map((tree) => (
        <Marker 
          key={tree.id} 
          position={[tree.lat, tree.lon]}
        >
          <Popup>
            <div>
              <h3>{getTreeDisplayName(tree)}</h3>
              <p>ID: {tree.id}</p>
              <p>Coordinates: {tree.lat.toFixed(6)}, {tree.lon.toFixed(6)}</p>
              {tree.properties.species && (
                <p>Species: {tree.properties.species}</p>
              )}
              {tree.properties.genus && (
                <p>Genus: {tree.properties.genus}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default TreeLayer; 