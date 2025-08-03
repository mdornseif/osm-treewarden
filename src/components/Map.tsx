import React, { useCallback, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import pDebounce from 'p-debounce';
import BaseMap from './BaseMap';
import TreeLayer from './TreeLayer';
import { OverpassService } from '../services/overpass';
import { useTreeStore } from '../store/useTreeStore';
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <BaseMap center={center} zoom={zoom}>
        <MapEventHandler />
        <TreeLayer 
          trees={trees}
          onMarkerClick={onMarkerClick}
          selectedTreeId={selectedTreeId}
        />
      </BaseMap>
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          Bäume werden geladen...
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          Fehler: {error}
        </div>
      )}
    </div>
  );
};

export default Map; 