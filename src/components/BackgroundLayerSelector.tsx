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

<<<<<<< HEAD
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
=======
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
>>>>>>> 49f964a (feat: add NRW i-Orthophoto and vorläufiges Orthophoto layers)
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
<<<<<<< HEAD
      // Remove any existing tile layers
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
=======
      // Remove all existing tile layers (both TileLayer and WMS layers)
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer || layer instanceof L.TileLayer.WMS) {
>>>>>>> 49f964a (feat: add NRW i-Orthophoto and vorläufiges Orthophoto layers)
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
      console.log(`🔄 Switching from ${currentLayer} to ${layerKey}`);
      
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