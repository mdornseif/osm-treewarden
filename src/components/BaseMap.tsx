import React from 'react';
import { MapContainer } from 'react-leaflet';
import { useStore } from '@nanostores/react';
import 'leaflet/dist/leaflet.css';
import { mapState } from '../store/mapStateStore';
import BackgroundLayerInitializer from './BackgroundLayerInitializer';

// Fix for default markers in Leaflet with React
import L from 'leaflet';
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BaseMapProps {
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
}

const BaseMap: React.FC<BaseMapProps> = ({ 
  center, 
  zoom,
  children
}) => {
  const { center: storeCenter, zoom: storeZoom, isInitialized } = useStore(mapState);
  
  // Use props if provided, otherwise use store values (for URL params)
  const mapCenter = center || (isInitialized ? storeCenter : [50.897146, 7.098337]);
  const mapZoom = zoom !== undefined ? zoom : (isInitialized ? storeZoom : 16);

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom}
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0
      }}
    >
      <BackgroundLayerInitializer />
      {children}
    </MapContainer>
  );
};

export default BaseMap; 