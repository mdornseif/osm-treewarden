import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Orchard } from '../types';
import { MAP_CONFIG } from '../config';

interface OrchardLayerProps {
  orchards: Orchard[];
}

const OrchardLayer: React.FC<OrchardLayerProps> = ({ orchards }) => {
  const map = useMap();
  const [zoom, setZoom] = React.useState(map.getZoom());

  // Listen for zoom changes
  React.useEffect(() => {
    const handleZoomEnd = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  React.useEffect(() => {
    if (!map || orchards.length === 0) return;

    const layers: L.Layer[] = [];
    const usePins = zoom < MAP_CONFIG.FRUIT_TREE_ZOOM_THRESHOLD; // Show pins for large areas (low zoom)

    orchards.forEach((orchard) => {
      if (usePins) {
        // Create pin markers for large areas (low zoom levels)
        const center = calculateOrchardCenter(orchard.coordinates);
        const marker = L.marker(center, {
          icon: L.divIcon({
            className: 'orchard-pin',
            html: '🍎',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });

        // Add popup with orchard information
        if (orchard.properties.name) {
          marker.bindPopup(`
            <div>
              <strong>${orchard.properties.name}</strong><br/>
              ${orchard.properties.species ? `Art: ${orchard.properties.species}<br/>` : ''}
              ${orchard.properties.crop ? `Ernte: ${orchard.properties.crop}<br/>` : ''}
              ${orchard.properties.trees ? `Bäume: ${orchard.properties.trees}<br/>` : ''}
              ${orchard.properties.note ? `Notiz: ${orchard.properties.note}<br/>` : ''}
              ${orchard.properties.description ? `Beschreibung: ${orchard.properties.description}` : ''}
            </div>
          `);
        }

        layers.push(marker);
      } else {
        // Create polygon areas for small areas (high zoom levels)
        const coordinates = orchard.coordinates;
        
        const polygon = L.polygon(coordinates, {
          color: '#ff0000', // Bright red
          weight: 2,
          fillColor: '#ff0000',
          fillOpacity: 0.3,
          opacity: 0.8
        });

        // Add popup with orchard information
        if (orchard.properties.name) {
          polygon.bindPopup(`
            <div>
              <strong>${orchard.properties.name}</strong><br/>
              ${orchard.properties.species ? `Art: ${orchard.properties.species}<br/>` : ''}
              ${orchard.properties.crop ? `Ernte: ${orchard.properties.crop}<br/>` : ''}
              ${orchard.properties.trees ? `Bäume: ${orchard.properties.trees}<br/>` : ''}
              ${orchard.properties.note ? `Notiz: ${orchard.properties.note}<br/>` : ''}
              ${orchard.properties.description ? `Beschreibung: ${orchard.properties.description}` : ''}
            </div>
          `);
        }

        layers.push(polygon);
      }
    });

    // Add all layers to the map
    layers.forEach(layer => layer.addTo(map));

    // Cleanup function
    return () => {
      layers.forEach(layer => {
        if (map.hasLayer(layer)) {
          map.removeLayer(layer);
        }
      });
    };
  }, [map, orchards, zoom]);

  // Helper function to calculate the center of an orchard
  const calculateOrchardCenter = (coordinates: [number, number][]): [number, number] => {
    if (coordinates.length === 0) return [0, 0];
    
    const sumLat = coordinates.reduce((sum, coord) => sum + coord[0], 0);
    const sumLng = coordinates.reduce((sum, coord) => sum + coord[1], 0);
    
    return [sumLat / coordinates.length, sumLng / coordinates.length];
  };

  return null; // This component doesn't render anything visible
};

export default OrchardLayer; 