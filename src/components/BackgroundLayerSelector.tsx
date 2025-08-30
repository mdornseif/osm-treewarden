import React from 'react';
import { useMap } from 'react-leaflet';
import { useStore } from '@nanostores/react';
import L from 'leaflet';
import styles from '../styles/background-layer.module.css';
import { mapState, setBackgroundLayer, BACKGROUND_LAYERS } from '../store/mapStateStore';

interface BackgroundLayerSelectorProps {
  onClose?: () => void;
}

const BackgroundLayerSelector: React.FC<BackgroundLayerSelectorProps> = ({ onClose }) => {
  const map = useMap();
  const { backgroundLayer } = useStore(mapState);

  // Create Leaflet layers from the tile layer configurations
  const layers = React.useMemo(() => {
    // NRW DOP Infrared (Color Infrared) for vegetation analysis
    const nrwInfraredLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
      layers: 'nw_dop_cir',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    // NRW i-Orthophoto (interactive orthophoto)
    const nrwIOrthophotoLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_idop', {
      layers: 'nw_idop_rgb',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    // NRW vorläufiges Orthophoto (provisional orthophoto)
    const nrwVOrthophotoLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_vdop', {
      layers: 'nw_vdop_rgb',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    // Esri World Imagery - High resolution satellite imagery
    const esriWorldImageryLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    });

    const layerMap: Record<string, { name: string; description: string; layer: L.TileLayer }> = {
      'osm': {
        name: BACKGROUND_LAYERS.osm.name,
        description: BACKGROUND_LAYERS.osm.description,
        layer: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        })
      },
      'nrw-orthophoto': {
        name: BACKGROUND_LAYERS['nrw-orthophoto'].name,
        description: BACKGROUND_LAYERS['nrw-orthophoto'].description,
        layer: L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
          layers: 'nw_dop_rgb',
          format: 'image/png',
          transparent: true,
          version: '1.3.0',
          attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
        })
      },
      'nrw-iorthophoto': {
        name: BACKGROUND_LAYERS['nrw-iorthophoto'].name,
        description: BACKGROUND_LAYERS['nrw-iorthophoto'].description,
        layer: nrwIOrthophotoLayer
      },
      'nrw-vorthophoto': {
        name: BACKGROUND_LAYERS['nrw-vorthophoto'].name,
        description: BACKGROUND_LAYERS['nrw-vorthophoto'].description,
        layer: nrwVOrthophotoLayer
      },
      'nrw-infrared': {
        name: BACKGROUND_LAYERS['nrw-infrared'].name,
        description: BACKGROUND_LAYERS['nrw-infrared'].description,
        layer: nrwInfraredLayer
      },
      'esri-world-imagery': {
        name: BACKGROUND_LAYERS['esri-world-imagery'].name,
        description: BACKGROUND_LAYERS['esri-world-imagery'].description,
        layer: esriWorldImageryLayer
      }
    };

    return layerMap;
  }, []);

  // Initialize the map with the layer from URL/store
  React.useEffect(() => {
    if (map) {
      // Remove all existing tile layers (both TileLayer and WMS layers)
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer || layer instanceof L.TileLayer.WMS) {
          map.removeLayer(layer);
        }
      });

      // Add the current layer from store
      const layerConfig = layers[backgroundLayer];
      if (layerConfig) {
        layerConfig.layer.addTo(map);
      }
    }
  }, [map, layers, backgroundLayer]);

  const handleLayerChange = (layerKey: string) => {
    if (map && layerKey !== backgroundLayer) {
      console.log(`🔄 Switching from ${backgroundLayer} to ${layerKey}`);
      
      // Remove current layer
      const currentLayerConfig = layers[backgroundLayer];
      if (currentLayerConfig) {
        map.removeLayer(currentLayerConfig.layer);
      }

      // Add new layer
      const newLayerConfig = layers[layerKey];
      if (newLayerConfig) {
        newLayerConfig.layer.addTo(map);
        // Update the store and URL
        setBackgroundLayer(layerKey);
        console.log(`✅ Switched to ${layerKey}: ${newLayerConfig.name}`);
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
              {layers[backgroundLayer]?.name}
            </div>
            <div className={styles['current-layer-description']}>
              {layers[backgroundLayer]?.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundLayerSelector; 