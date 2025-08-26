import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { tileLayers } from '../utils/tileLayers';

interface LayerSwitcherProps {
  onLayerChange?: (layerName: string) => void;
}

const LayerSwitcher: React.FC<LayerSwitcherProps> = ({ onLayerChange }) => {
  const map = useMap();

  // Create Leaflet layers from the tile layer configurations
  const layers = React.useMemo(() => {
    const layerMap: Record<string, { name: string; layer: L.TileLayer }> = {};

    tileLayers.forEach((tileLayer) => {
      let layer: L.TileLayer;

      if (tileLayer.id === 'nrw-orthophoto' || tileLayer.id === 'nrw-cadastre') {
        // Handle WMS layers
        const isOrthophoto = tileLayer.id === 'nrw-orthophoto';
        const baseUrl = isOrthophoto 
          ? 'https://www.wms.nrw.de/geobasis/wms_nw_dop'
          : 'https://www.wms.nrw.de/geobasis/wms_nw_alkis';
        
        const layers = isOrthophoto ? 'nw_dop_rgb' : 'adv_alkis_flurstuecke,adv_alkis_gebaeude';
        const format = isOrthophoto ? 'image/png' : 'image/png';
        const transparent = !isOrthophoto;

        layer = L.tileLayer.wms(baseUrl, {
          layers,
          format,
          transparent,
          version: '1.3.0',
          attribution: tileLayer.attribution,
          maxZoom: tileLayer.maxZoom
        });
      } else {
        // Handle regular tile layers
        const options: L.TileLayerOptions = {
          attribution: tileLayer.attribution,
          maxZoom: tileLayer.maxZoom
        };

        if (tileLayer.subdomains) {
          options.subdomains = tileLayer.subdomains;
        }

        layer = L.tileLayer(tileLayer.url, options);
      }

      layerMap[tileLayer.id] = {
        name: tileLayer.name,
        layer
      };
    });

    return layerMap;
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
      const layerConfig = layers[currentLayer];
      if (layerConfig) {
        layerConfig.layer.addTo(map);
      }
    }
  }, [map, layers, currentLayer]);

  const handleLayerChange = (layerKey: string) => {
    if (map && layerKey !== currentLayer) {
      // Remove current layer
      const currentLayerConfig = layers[currentLayer];
      if (currentLayerConfig) {
        map.removeLayer(currentLayerConfig.layer);
      }

      // Add new layer
      const newLayerConfig = layers[layerKey];
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