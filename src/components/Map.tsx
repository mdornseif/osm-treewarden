import React, { useCallback, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import pDebounce from 'p-debounce';
import BaseMap from './BaseMap';
import TreeLayer from './TreeLayer';
import BackgroundLayerSlidein from './BackgroundLayerSlidein';
import MapControls from './MapControls';
import TreeTypeSelector from './TreeTypeSelector';
import { OverpassService } from '../services/overpass';
import { useTreeStore } from '../store/useTreeStore';
import { isAddingTree, selectedTreeType } from '../store/treeStore';
import { useStore } from '@nanostores/react';
import { Tree } from '../types';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  onMarkerClick: (tree: Tree) => void;
  selectedTreeId: number | null;
}

// Component to handle map events and tree loading
const MapEventHandler: React.FC = () => {
  const map = useMap();
  const { loadTreesForBounds } = useTreeStore();

  // Create a debounced version of the tree loading function
  const debouncedLoadTrees = useMemo(
    () => pDebounce(async () => {
      try {
        const bounds = OverpassService.calculateBounds(map.getBounds());
        await loadTreesForBounds(bounds);
      } catch (error) {
        console.error('Error loading trees:', error);
      }
    }, 5000), // 5 second debounce
    [map, loadTreesForBounds]
  );

  const handleLoadTrees = useCallback(async () => {
    try {
      const bounds = OverpassService.calculateBounds(map.getBounds());
      await loadTreesForBounds(bounds);
    } catch (error) {
      console.error('Error loading trees:', error);
    }
  }, [map, loadTreesForBounds]);

  // Load trees when map is ready
  React.useEffect(() => {
    if (map) {
      // Load initial trees (not debounced)
      handleLoadTrees();

      // Listen for map view changes to reload trees with debouncing
      const handleMoveEnd = () => {
        debouncedLoadTrees();
      };

      map.on('moveend', handleMoveEnd);

      // Cleanup
      return () => {
        map.off('moveend', handleMoveEnd);
      };
    }
  }, [map, handleLoadTrees, debouncedLoadTrees]);

  return null; // This component doesn't render anything
};

const Map: React.FC<MapProps> = ({ 
  center = [50.897146, 7.098337], 
  zoom = 17,
  onMarkerClick,
  selectedTreeId
}) => {
  const { trees, isLoading, error } = useTreeStore();
  const addingTree = useStore(isAddingTree);
  const treeType = useStore(selectedTreeType);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <BaseMap center={center} zoom={zoom}>
        <MapEventHandler />
        <TreeLayer 
          trees={trees}
          onMarkerClick={onMarkerClick}
          selectedTreeId={selectedTreeId}
        />
        <BackgroundLayerSlidein />
        <MapControls />
      </BaseMap>
      
      {/* Tree Type Selector Modal */}
      <TreeTypeSelector isVisible={addingTree && !treeType} />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1000
        }}>
          Bäume werden geladen...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 0, 0, 0.1)',
          color: 'red',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid red',
          zIndex: 1000
        }}>
          Fehler: {error}
        </div>
      )}
    </div>
  );
};

export default Map; 