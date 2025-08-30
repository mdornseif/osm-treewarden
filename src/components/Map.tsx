import React, { useCallback, useMemo } from 'react';
import { useMap } from 'react-leaflet';
import pDebounce from 'p-debounce';
import BaseMap from './BaseMap';
import TreeLayer from './TreeLayer';
import OrchardLayer from './OrchardLayer';
import MapControls from './MapControls';
import TreeTypeSelector from './TreeTypeSelector';
import { OverpassService } from '../services/overpass';
import { useTreeStore } from '../store/useTreeStore';
import { isAddingTree, selectedTreeType, showStreuobstwiesen as showStreuobstwiesenStore } from '../store/treeStore';
import { useStore } from '@nanostores/react';
import { Tree } from '../types';
import { MAP_CONFIG } from '../config';
import { mapState, setMapView } from '../store/mapStateStore';

interface MapProps {
  center?: [number, number];
  zoom?: number;
  onMarkerClick: (tree: Tree) => void;
  selectedTreeId: number | null;
}

// Component to handle map events and tree loading
const MapEventHandler: React.FC = () => {
  const map = useMap();
  const { loadTreesForBounds, loadStreuobstwiesen, setPendingReload } = useTreeStore();
  
  // Debounced function to update URL with map view changes
  const debouncedUpdateMapView = useMemo(
    () => pDebounce((center: [number, number], zoom: number) => {
      setMapView(center, zoom);
    }, 1000), // 1 second debounce for URL updates
    []
  );

  // Create a debounced version of the tree loading function
  const debouncedLoadTrees = useMemo(
    () => pDebounce(async () => {
      try {
        console.log('🔄 Starting debounced tree loading...');
        setPendingReload(false); // Clear pending state when starting actual load
        const bounds = OverpassService.calculateBounds(map.getBounds());
        const zoom = map.getZoom();
        
        // Load trees with proper error handling
        await loadTreesForBounds(bounds, false, zoom);
        
        // Also load Streuobstwiesen if they are visible
        const streuobstwiesenVisible = showStreuobstwiesenStore.get();
        if (streuobstwiesenVisible) {
          await loadStreuobstwiesen(bounds);
        }
        
        console.log('✅ Debounced tree loading completed successfully');
      } catch (error) {
        console.error('❌ Error in debounced tree loading:', error);
        setPendingReload(false); // Ensure pending state is cleared on error
        // The loadTreesForBounds function already handles setting loading to false
      }
    }, 2000), // 2 second debounce
    [map, loadTreesForBounds, loadStreuobstwiesen, setPendingReload]
  );

  const handleLoadTrees = useCallback(async () => {
    try {
      console.log('🌳 Starting initial tree loading...');
      const bounds = OverpassService.calculateBounds(map.getBounds());
      const zoom = map.getZoom();
      await loadTreesForBounds(bounds, false, zoom);
      console.log('✅ Initial tree loading completed');
    } catch (error) {
      console.error('❌ Error in initial tree loading:', error);
    }
  }, [map, loadTreesForBounds]);

  // Load trees when map is ready
  React.useEffect(() => {
    if (map) {
      // Load initial trees (not debounced)
      handleLoadTrees();

      // Listen for map view changes to reload trees with debouncing
      const handleMoveEnd = () => {
        setPendingReload(true); // Set pending state when map movement ends
        debouncedLoadTrees();
        
        // Update URL with new map view
        const center = map.getCenter();
        const zoom = map.getZoom();
        debouncedUpdateMapView([center.lat, center.lng], zoom);
      };

      map.on('moveend', handleMoveEnd);

      // Cleanup
      return () => {
        map.off('moveend', handleMoveEnd);
      };
    }
  }, [map, handleLoadTrees, debouncedLoadTrees, setPendingReload, debouncedUpdateMapView]);

  return null; // This component doesn't render anything
};

const Map: React.FC<MapProps> = ({ 
  center, 
  zoom,
  onMarkerClick,
  selectedTreeId
}) => {
  const { trees, orchards, isLoading, isPendingReload, error, showStreuobstwiesen } = useTreeStore();
  const addingTree = useStore(isAddingTree);
  const treeType = useStore(selectedTreeType);
  const { center: storeCenter, zoom: storeZoom, isInitialized } = useStore(mapState);
  
  // Use props if provided, otherwise use store values (for URL params)
  const mapCenter = center || (isInitialized ? storeCenter : MAP_CONFIG.INITIAL_CENTER);
  const mapZoom = zoom !== undefined ? zoom : (isInitialized ? storeZoom : MAP_CONFIG.INITIAL_ZOOM);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .orchard-pin {
            background: none !important;
            border: none !important;
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.5));
          }
        `}
      </style>
      <BaseMap center={mapCenter} zoom={mapZoom}>
        <MapEventHandler />
        <TreeLayer 
          trees={trees}
          onMarkerClick={onMarkerClick}
          selectedTreeId={selectedTreeId}
        />
        {showStreuobstwiesen && (
          <OrchardLayer orchards={orchards} />
        )}
        <MapControls 
          onTreeSelect={onMarkerClick}
          selectedTreeId={selectedTreeId}
        />
      </BaseMap>
      
      {/* Tree Type Selector Modal */}
      <TreeTypeSelector isVisible={addingTree && !treeType} />
      
      {/* Unobtrusive loading indicator for pending reloads */}
      {isPendingReload && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Aktualisiere...
        </div>
      )}
      
      {/* Full screen loading indicator for actual API calls */}
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