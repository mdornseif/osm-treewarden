import React, { useEffect, useRef } from 'react';
import { CircleMarker } from 'react-leaflet';
import { Tree } from '../types';
import { getTreeDesign } from '../utils/treeUtils';
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
  const markerRefs = useRef<Record<number, any>>({});

  // Handle marker click - open TreeInfo instead of popup
  const handleMarkerClick = (tree: Tree) => {
    onMarkerClick(tree);
  };

  // Highlight selected marker
  useEffect(() => {
    if (selectedTreeId && markerRefs.current[selectedTreeId]) {
      const marker = markerRefs.current[selectedTreeId];
      // Add highlight class or custom styling
      const element = marker.getElement();
      if (element) {
        element.style.filter = 'drop-shadow(0 0 8px #ff6b35)';
        element.style.zIndex = '1000';
        element.style.transform = 'scale(1.2)';
      }
    }

    return () => {
      // Remove highlight from all markers
      Object.values(markerRefs.current).forEach(marker => {
        const element = marker.getElement();
        if (element) {
          element.style.filter = '';
          element.style.zIndex = '';
          element.style.transform = '';
        }
      });
    };
  }, [selectedTreeId]);

  return (
    <>
      {trees.map((tree) => {
        const { color, fillColor } = getTreeDesign(tree);
        const isSelected = tree.id === selectedTreeId;
        
        return (
          <CircleMarker 
            key={tree.id} 
            center={[tree.lat, tree.lon]}
            radius={isSelected ? 8 : 6}
            fillColor={isSelected ? '#ff6b35' : fillColor}
            color={isSelected ? '#ff6b35' : color}
            weight={isSelected ? 3 : 2}
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
        );
      })}
    </>
  );
};

export default TreeLayer; 