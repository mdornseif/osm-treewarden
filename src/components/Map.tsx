import React, { useState, useCallback, useRef } from 'react';
import { useMap } from 'react-leaflet';
import BaseMap from './BaseMap';
import TreeLayer from './TreeLayer';
import { OverpassService } from '../services/overpass';
import { Tree } from '../types';

interface MapProps {
  center?: [number, number];
  zoom?: number;
}

// Component to handle map events and tree loading
const MapEventHandler: React.FC<{ 
  onTreesLoaded: (trees: Tree[]) => void;
  onLoadingChange: (loading: boolean) => void;
}> = ({ onTreesLoaded, onLoadingChange }) => {
  const map = useMap();
  const debounceTimeoutRef = useRef<number | null>(null);

  const loadTreesForBounds = useCallback(async () => {
    try {
      onLoadingChange(true);
      const bounds = OverpassService.calculateBounds(map.getBounds());
      const fetchedTrees = await OverpassService.fetchTrees(bounds);
      onTreesLoaded(fetchedTrees);
      console.log(`Loaded ${fetchedTrees.length} trees`);
    } catch (error) {
      console.error('Error loading trees:', error);
      onTreesLoaded([]);
    } finally {
      onLoadingChange(false);
    }
  }, [map, onTreesLoaded, onLoadingChange]);

  // Load trees when map is ready
  React.useEffect(() => {
    if (map) {
      // Load initial trees
      loadTreesForBounds();

      // Listen for map view changes to reload trees with debouncing
      const handleMoveEnd = () => {
        // Clear existing timeout
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        // Debounce the API call to prevent rate limiting
        debounceTimeoutRef.current = setTimeout(() => {
          loadTreesForBounds();
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
  }, [map, loadTreesForBounds]);

  return null; // This component doesn't render anything
};

const Map: React.FC<MapProps> = ({ 
  center = [50.897146, 7.098337], 
  zoom = 16 
}) => {
  const [trees, setTrees] = useState<Tree[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTreesLoaded = useCallback((loadedTrees: Tree[]) => {
    setTrees(loadedTrees);
  }, []);

  const handleLoadingChange = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <BaseMap center={center} zoom={zoom}>
        <MapEventHandler 
          onTreesLoaded={handleTreesLoaded} 
          onLoadingChange={handleLoadingChange}
        />
        <TreeLayer trees={trees} />
      </BaseMap>
      
      {loading && (
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
      
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 1000
      }}>
        Trees: {trees.length}
      </div>
    </div>
  );
};

export default Map; 