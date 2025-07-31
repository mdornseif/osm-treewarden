import React from 'react';
import { CircleMarker } from 'react-leaflet';
import { Tree } from '../types';
import { getTreeDesign } from '../utils/treeUtils';
import TreePopup from './TreePopup';

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
            <TreePopup tree={tree} />
          </CircleMarker>
        );
      })}
    </>
  );
};

export default TreeLayer; 