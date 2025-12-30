import React from 'react';
import { useMap } from 'react-leaflet';
import { useStore } from '@nanostores/react';
import L from 'leaflet';
import { mapState } from '../store/mapStateStore';

// Komponente zur Initialisierung der Hintergrundkarte beim App-Start
// Diese Komponente wird immer gerendert, damit die Karte sofort sichtbar ist
const BackgroundLayerInitializer: React.FC = () => {
  const map = useMap();
  const { backgroundLayer } = useStore(mapState);

  // Erstelle Leaflet-Layer aus den Tile-Layer-Konfigurationen
  const layers = React.useMemo(() => {
    // NRW DOP Infrared (Color Infrared) für Vegetationsanalyse
    const nrwInfraredLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
      layers: 'nw_dop_cir',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    // NRW i-Orthophoto (interaktives Orthophoto)
    const nrwIOrthophotoLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_idop', {
      layers: 'nw_idop_rgb',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    // NRW vorläufiges Orthophoto (provisorisches Orthophoto)
    const nrwVOrthophotoLayer = L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_vdop', {
      layers: 'nw_vdop_rgb',
      format: 'image/png',
      transparent: true,
      version: '1.3.0',
      attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
    });

    // Esri World Imagery - Hochauflösende Satellitenbilder
    const esriWorldImageryLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    });

    const layerMap: Record<string, L.TileLayer> = {
      'osm': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        subdomains: ['a', 'b', 'c']
      }),
      'nrw-orthophoto': L.tileLayer.wms('https://www.wms.nrw.de/geobasis/wms_nw_dop', {
        layers: 'nw_dop_rgb',
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        attribution: '&copy; <a href="https://www.bezreg-koeln.nrw.de/brk_internet/geobasis/luftbildinformationen/digitale_orthophotos/index.html">Geobasis NRW</a>'
      }),
      'nrw-iorthophoto': nrwIOrthophotoLayer,
      'nrw-vorthophoto': nrwVOrthophotoLayer,
      'nrw-infrared': nrwInfraredLayer,
      'esri-world-imagery': esriWorldImageryLayer
    };

    return layerMap;
  }, []);

  // Initialisiere die Karte mit dem Layer aus URL/Store
  React.useEffect(() => {
    if (map) {
      // Entferne alle vorhandenen Tile-Layer (sowohl TileLayer als auch WMS-Layer)
      map.eachLayer((layer) => {
        if (layer instanceof L.TileLayer || layer instanceof L.TileLayer.WMS) {
          map.removeLayer(layer);
        }
      });

      // Füge den aktuellen Layer aus dem Store hinzu
      const layer = layers[backgroundLayer];
      if (layer) {
        layer.addTo(map);
      }
    }
  }, [map, layers, backgroundLayer]);

  return null; // Diese Komponente rendert nichts
};

export default BackgroundLayerInitializer;

