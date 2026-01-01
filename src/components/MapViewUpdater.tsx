import React from 'react';
import { useMap } from 'react-leaflet';
import { useStore } from '@nanostores/react';
import { mapState } from '../store/mapStateStore';

// Komponente, die die Karte aktualisiert, wenn sich die initialisierten Werte ändern
// Dies ist notwendig, weil MapContainer die center/zoom Props nur beim ersten Rendern verwendet
const MapViewUpdater: React.FC = () => {
  const map = useMap();
  const { center, zoom, isInitialized } = useStore(mapState);
  const prevInitialized = React.useRef(false);

  React.useEffect(() => {
    // Wenn die Initialisierung gerade abgeschlossen wurde, aktualisiere die Karte
    if (isInitialized && !prevInitialized.current) {
      map.setView(center, zoom);
      prevInitialized.current = true;
    }
  }, [map, center, zoom, isInitialized]);

  return null;
};

export default MapViewUpdater;

