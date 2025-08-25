import React from 'react';
import { useMap } from 'react-leaflet';
import { setMapCenter, setMapZoom } from '../store/mapStore';

const MapStateSync: React.FC = () => {
  const map = useMap();

  React.useEffect(() => {
    if (map) {
      // Listen for map view changes to update URL parameters
      const handleMoveEnd = () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(zoom);
      };

      const handleZoomEnd = () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        setMapCenter([center.lat, center.lng]);
        setMapZoom(zoom);
      };

      map.on('moveend', handleMoveEnd);
      map.on('zoomend', handleZoomEnd);

      // Cleanup
      return () => {
        map.off('moveend', handleMoveEnd);
        map.off('zoomend', handleZoomEnd);
      };
    }
  }, [map]);

  return null; // This component doesn't render anything
};

export default MapStateSync;