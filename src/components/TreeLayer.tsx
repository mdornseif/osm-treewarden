import React from 'react';
import { CircleMarker, Popup } from 'react-leaflet';
import { Tree } from '../types';
import { getTreeDisplayName, getTreeDesign } from '../utils/treeUtils';

interface TreeLayerProps {
  trees: Tree[];
}

const TreeLayer: React.FC<TreeLayerProps> = ({ trees }) => {
  return (
    <>
      {trees.map((tree) => {
        const { color, fillColor } = getTreeDesign(tree);
        
        return (
          <CircleMarker 
            key={tree.id} 
            center={[tree.lat, tree.lon]}
            radius={6}
            fillColor={fillColor}
            color={color}
            weight={2}
            opacity={0.8}
            fillOpacity={0.6}
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
          </CircleMarker>
        );
      })}
    </>
  );
};

export default TreeLayer; 