import React, { useRef } from 'react';
import { CircleMarker, Marker } from 'react-leaflet';
import { useMap } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import { Tree } from '../types';
import { getTreeDesign, getTreeDisplayName } from '../utils/treeUtils';
import TreePopup from './TreePopup';

interface TreeLayerProps {
  trees: Tree[];
  onMarkerClick: (tree: Tree) => void;
  selectedTreeId: number | null;
}

const TreeLayer: React.FC<TreeLayerProps> = ({ 
  trees, 
  onMarkerClick, 
  selectedTreeId 
}) => {
  const markerRefs = useRef<Record<number, L.CircleMarker | L.Marker>>({});
  const map = useMap();
  const zoom = map.getZoom();

  // Handle marker click - open TreeInfo instead of popup
  const handleMarkerClick = (tree: Tree) => {
    onMarkerClick(tree);
  };

  // Show labels when zoomed in enough (zoom >= 18)
  const showLabels = zoom >= 18;

  return (
    <>
      {trees.map((tree) => {
        const { color, fillColor } = getTreeDesign(tree);
        const isSelected = tree.id === selectedTreeId;
        const treeName = getTreeDisplayName(tree).replace(/\n/g, ' ');
        
        return (
          <React.Fragment key={tree.id}>
            {/* Original marker - unchanged */}
            <CircleMarker 
              center={[tree.lat, tree.lon]}
              radius={6}
              fillColor={fillColor}
              color={color}
              weight={2}
              opacity={0.8}
              fillOpacity={0.6}
              ref={(ref) => {
                if (ref) markerRefs.current[tree.id] = ref;
              }}
              eventHandlers={{
                click: () => handleMarkerClick(tree),
              }}
            >
              <TreePopup tree={tree} />
            </CircleMarker>
            
            {/* Highlight circle for selected marker */}
            {isSelected && (
              <CircleMarker 
                center={[tree.lat, tree.lon]}
                radius={12}
                fillColor="transparent"
                color="#000000"
                weight={5}
                opacity={1}
                fillOpacity={0}
              />
            )}

            {/* Tree name label - shown when zoomed in */}
            {showLabels && (
              <Marker
                position={[tree.lat, tree.lon]}
                icon={new DivIcon({
                  className: 'tree-label',
                  html: `<div class="tree-label-text">${treeName}</div>`,
                  iconSize: [100, 20],
                  iconAnchor: [-16, 10], // Shift ~1em (16px) right of marker
                })}
                interactive={false}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

export default TreeLayer; 