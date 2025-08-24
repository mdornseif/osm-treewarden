import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from '../styles/background-layer.module.css';

const BackgroundLayerSelector: React.FC = () => {
  const map = useMap();

  // Define the background layers
  const layers = React.useMemo(() => {
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    });

    // NRW Orthophoto WMS layer - using correct layer name 'nw_dop_rgb'
    const nrwOrthophotoLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
      layers: 'nw_dop_rgb',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    return {
      'osm': {
        name: 'OpenStreetMap',
        description: 'Standard Straßenkarte',
        layer: osmLayer
      },
      'nrw-orthophoto': {
        name: 'NRW Orthophoto',
        description: 'Luftbildaufnahmen von Geobasis NRW',
        layer: nrwOrthophotoLayer
      }
    };
  }, []);

  const [currentLayer, setCurrentLayer] = React.useState('osm');

  // Initialize the map with the default layer
  React.useEffect(() => {
    if (map) {
      // Find and remove the default TileLayer from BaseMap
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          const tileLayer = layer as L.TileLayer;
          // Check if this is the default OpenStreetMap layer by checking its URL template
          if (tileLayer.options && tileLayer.options.attribution?.includes('OpenStreetMap')) {
            map.removeLayer(layer);
          }
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
      }
    }
  };

  return (
    <div className={styles['background-layer-selector']}>
      <div className={styles['background-layer-header']}>
        <h3>Hintergrund-Karte</h3>
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
              {layers[currentLayer as keyof typeof layers]?.name}
            </div>
            <div className={styles['current-layer-description']}>
              {layers[currentLayer as keyof typeof layers]?.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundLayerSelector; 