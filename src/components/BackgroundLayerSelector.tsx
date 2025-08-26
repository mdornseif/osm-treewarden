import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { tileLayers } from '../utils/tileLayers';
import styles from '../styles/background-layer.module.css';

interface BackgroundLayerSelectorProps {
  onClose?: () => void;
}

const BackgroundLayerSelector: React.FC<BackgroundLayerSelectorProps> = ({ onClose }) => {
  const map = useMap();

  // Create Leaflet layers from the tile layer configurations
  const layers = React.useMemo(() => {
    const layerMap: Record<string, { name: string; description: string; layer: L.TileLayer }> = {};

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

      // Add descriptions for each layer
      const descriptions: Record<string, string> = {
        'osm': 'Standard Straßenkarte',
        'satellite': 'Satellitenbilder von Esri',
        'nrw-orthophoto': 'Luftbildaufnahmen von Geobasis NRW',
        'nrw-cadastre': 'Liegenschaftskataster von Geobasis NRW'
      };

      layerMap[tileLayer.id] = {
        name: tileLayer.name,
        description: descriptions[tileLayer.id] || 'Kartenebene',
        layer
      };
    });

    return layerMap;
  }, []);

  const [currentLayer, setCurrentLayer] = React.useState('osm');

  // Initialize the map with the default layer
  React.useEffect(() => {
    if (map) {
      // Remove any existing tile layers
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
      }
    }
  };

  return (
    <div className={styles['background-layer-selector']}>
      <div className={styles['background-layer-header']}>
        <h3>Hintergrund-Karte</h3>
        {onClose && (
          <button 
            className={styles['close-button']} 
            onClick={onClose}
            title="Hintergrund-Karte schließen"
          >
            ×
          </button>
        )}
      </div>
      <div className={styles['background-layer-content']}>
        <div className={styles['background-layer-section']}>
          <h4>Verfügbare Karten</h4>
          <div className={styles['layer-options']}>
            {Object.entries(layers).map(([key, config]) => (
              <div key={key} className={styles['layer-option']}>
                <label className={`${styles['layer-label']} ${currentLayer === key ? styles['selected'] : ''}`}>
                  <input
                    type="radio"
                    name="backgroundLayer"
                    value={key}
                    checked={currentLayer === key}
                    onChange={() => handleLayerChange(key)}
                    className={styles['layer-radio']}
                  />
                  <div className={styles['layer-info']}>
                    <div className={styles['layer-name']}>{config.name}</div>
                    <div className={styles['layer-description']}>{config.description}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles['background-layer-section']}>
          <h4>Aktuelle Karte</h4>
          <div className={styles['current-layer-info']}>
            <div className={styles['current-layer-name']}>
              {layers[currentLayer]?.name}
            </div>
            <div className={styles['current-layer-description']}>
              {layers[currentLayer]?.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundLayerSelector; 