import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../store/useMapStore';
import { setBackgroundLayer } from '../store/mapStore';
import styles from '../styles/background-layer.module.css';

const BackgroundLayerSelector: React.FC = () => {
  const map = useMap();
  const { backgroundLayer } = useMapStore();

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

  // Initialize the map with the current layer from store
  React.useEffect(() => {
    if (map) {
      // Find and remove any existing TileLayer
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      // Add the current layer from store
      const layerConfig = layers[backgroundLayer as keyof typeof layers];
      if (layerConfig) {
        layerConfig.layer.addTo(map);
      }
    }
  }, [map, layers, backgroundLayer]);

  const handleLayerChange = (layerKey: string) => {
    if (map && layerKey !== backgroundLayer) {
      // Remove current layer
      const currentLayerConfig = layers[backgroundLayer as keyof typeof layers];
      if (currentLayerConfig) {
        map.removeLayer(currentLayerConfig.layer);
      }

      // Add new layer
      const newLayerConfig = layers[layerKey as keyof typeof layers];
      if (newLayerConfig) {
        newLayerConfig.layer.addTo(map);
        setBackgroundLayer(layerKey);
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
                <label className={`${styles['layer-label']} ${backgroundLayer === key ? styles['selected'] : ''}`}>
                  <input
                    type="radio"
                    name="backgroundLayer"
                    value={key}
                    checked={backgroundLayer === key}
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
              {layers[backgroundLayer as keyof typeof layers]?.name}
            </div>
            <div className={styles['current-layer-description']}>
              {layers[backgroundLayer as keyof typeof layers]?.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundLayerSelector; 