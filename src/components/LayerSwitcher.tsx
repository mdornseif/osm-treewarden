import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface LayerSwitcherProps {
  onLayerChange?: (layerName: string) => void;
}

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ onLayerChange }) => {
  const map = useMap();

  // Define the background layers
  const layers = React.useMemo(() => {
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    // NRW Orthophoto WMS layer
    const nrwOrthophotoLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
      layers: 'nw_dop',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    return {
      'osm': {
        name: 'OpenStreetMap',
        layer: osmLayer
      },
      'nrw-orthophoto': {
        name: 'NRW Orthophoto',
        layer: nrwOrthophotoLayer
      }
    };
  }, []);

  const [currentLayer, setCurrentLayer] = React.useState('osm');

  // Initialize the map with the default layer
  React.useEffect(() => {
    if (map) {
      // Remove any existing layers
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      // Add the current layer
      const layerConfig = layers[currentLayer as keyof typeof layers];
      if (layerConfig) {
        layerConfig.layer.addTo(map);
      }
    }
  }, [map, layers, currentLayer]);

  const handleLayerChange = (layerKey: string) => {
    if (map && layerKey !== currentLayer) {
      // Remove current layer
      const currentLayerConfig = layers[currentLayer as keyof typeof layers];
      if (currentLayerConfig) {
        map.removeLayer(currentLayerConfig.layer);
      }

      // Add new layer
      const newLayerConfig = layers[layerKey as keyof typeof layers];
      if (newLayerConfig) {
        newLayerConfig.layer.addTo(map);
        setCurrentLayer(layerKey);
        onLayerChange?.(layerKey);
      }
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: 1000,
      background: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      padding: '8px',
      fontSize: '12px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
        Hintergrund-Karte
      </div>
      {Object.entries(layers).map(([key, config]) => (
        <div key={key} style={{ marginBottom: '4px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            color: currentLayer === key ? '#007cbf' : '#333'
          }}>
            <input
              type="radio"
              name="layer"
              value={key}
              checked={currentLayer === key}
              onChange={() => handleLayerChange(key)}
              style={{ marginRight: '6px' }}
            />
            {config.name}
          </label>
        </div>
      ))}
    </div>
  );
};

export default LayerSwitcher; 