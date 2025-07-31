import React, { useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import BaseMap from './BaseMap';
import TreeLayer from './TreeLayer';
import { OverpassService } from '../services/overpass';
import { useTreeStore } from '../store/useTreeStore';

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

// Component to handle map events and tree loading
const MapEventHandler: React.FC = () => {
  const map = useMap();
  const { loadTreesForBounds } = useTreeStore();
  const debounceTimeoutRef = useRef<number | null>(null);

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
      // Load initial trees
      handleLoadTrees();

      // Listen for map view changes to reload trees with debouncing
      const handleMoveEnd = () => {
        // Clear existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        // Debounce the API call to prevent rate limiting
        debounceTimeoutRef.current = setTimeout(() => {
          handleLoadTrees();
        }, 1000); // Wait 1 second after map stops moving
      };

      map.on('moveend', handleMoveEnd);

      // Cleanup
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        map.off('moveend', handleMoveEnd);
      };
    }
  }, [map, handleLoadTrees]);

  return null; // This component doesn't render anything
};

const Map: React.FC<MapProps> = ({ 
  center = [50.897146, 7.098337], 
  zoom = 16 
}) => {
  const { trees, isLoading, treeCount, error } = useTreeStore();

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <BaseMap center={center} zoom={zoom}>
        <MapEventHandler />
        <TreeLayer trees={trees} />
      </BaseMap>
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          Loading trees...
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
          Error: {error}
        </div>
      )}
      
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000
      }}>
        Trees: {treeCount}
      </div>
    </div>
  );
};

export default Map; 