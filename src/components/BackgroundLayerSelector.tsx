import React from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from '../styles/background-layer.module.css';

interface BackgroundLayerSelectorProps {
  onClose?: () => void;
}

const BackgroundLayerSelector: React.FC<BackgroundLayerSelectorProps> = ({ onClose }) => {
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

    return {
      'osm': {
        name: 'OpenStreetMap',
        description: 'Standard Straßenkarte mit Straßennamen und Landmarken',
        layer: osmLayer
      },
      'nrw-orthophoto': {
        name: 'NRW Orthophoto',
        description: 'Luftbildaufnahmen von Geobasis NRW (RGB)',
        layer: nrwOrthophotoLayer
      },
      'nrw-iorthophoto': {
        name: 'NRW i-Orthophoto',
        description: 'Interaktive Luftbildaufnahmen von Geobasis NRW',
        layer: nrwIOrthophotoLayer
      },
      'nrw-vorthophoto': {
        name: 'NRW vorläufiges Orthophoto',
        description: 'Vorläufige Luftbildaufnahmen von Geobasis NRW',
        layer: nrwVOrthophotoLayer
      },
      'nrw-infrared': {
        name: 'NRW Infrared',
        description: 'Luftbildaufnahmen von Geobasis NRW (Infrarot für Vegetationsanalyse)',
        layer: nrwInfraredLayer
      },
      'esri-world-imagery': {
        name: 'Esri World Imagery',
        description: 'Hochauflösende Satellitenbilder (global)',
        layer: esriWorldImageryLayer
      }
    };
  }, []);

  const [currentLayer, setCurrentLayer] = React.useState('osm');

  // Initialize the map with the default layer
  React.useEffect(() => {
    if (map) {
      // Remove all existing tile layers (both TileLayer and WMS layers)
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer || layer instanceof L.TileLayer.WMS) {
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
      console.log(`🔄 Switching from ${currentLayer} to ${layerKey}`);
      
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