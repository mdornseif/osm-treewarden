import { atom } from 'nanostores';
import { urlMapState, updateMapCenter, updateMapZoom, updateBackgroundLayer, initializeURLStore } from './urlStore';
import { MAP_CONFIG } from '../config';

export interface MapState {
  center: [number, number];
  zoom: number;
  backgroundLayer: string;
  isInitialized: boolean;
}

// Map state store that syncs with URL parameters
export const mapState = atom<MapState>({
  center: MAP_CONFIG.INITIAL_CENTER,
  zoom: MAP_CONFIG.INITIAL_ZOOM,
  backgroundLayer: 'osm',
  isInitialized: false
});

// Available background layers
export const BACKGROUND_LAYERS = {
  'osm': {
    name: 'OpenStreetMap',
    description: 'Standard Straßenkarte mit Straßennamen und Landmarken'
  },
  'nrw-orthophoto': {
    name: 'NRW Orthophoto',
    description: 'Luftbildaufnahmen von Geobasis NRW (RGB)'
  },
  'nrw-iorthophoto': {
    name: 'NRW i-Orthophoto',
    description: 'Interaktive Luftbildaufnahmen von Geobasis NRW'
  },
  'nrw-vorthophoto': {
    name: 'NRW vorläufiges Orthophoto',
    description: 'Vorläufige Luftbildaufnahmen von Geobasis NRW'
  },
  'nrw-infrared': {
    name: 'NRW Infrared',
    description: 'Luftbildaufnahmen von Geobasis NRW (Infrarot für Vegetationsanalyse)'
  },
  'esri-world-imagery': {
    name: 'Esri World Imagery',
    description: 'Hochauflösende Satellitenbilder (global)'
  }
} as const;

export type BackgroundLayerKey = keyof typeof BACKGROUND_LAYERS;

/**
 * Initialize map state from URL parameters
 */
export const initializeMapState = (): void => {
  initializeURLStore();
  const urlState = urlMapState.get();
  
  mapState.set({
    center: urlState.center,
    zoom: urlState.zoom,
    backgroundLayer: urlState.backgroundLayer,
    isInitialized: true
  });
};

/**
 * Update map center and sync with URL
 */
export const setMapCenter = (center: [number, number]): void => {
  const current = mapState.get();
  mapState.set({ ...current, center });
  updateMapCenter(center);
};

/**
 * Update map zoom and sync with URL
 */
export const setMapZoom = (zoom: number): void => {
  const current = mapState.get();
  mapState.set({ ...current, zoom });
  updateMapZoom(zoom);
};

/**
 * Update background layer and sync with URL
 */
export const setBackgroundLayer = (backgroundLayer: string): void => {
  const current = mapState.get();
  mapState.set({ ...current, backgroundLayer });
  updateBackgroundLayer(backgroundLayer);
};

/**
 * Update map view (center and zoom) and sync with URL
 */
export const setMapView = (center: [number, number], zoom: number): void => {
  const current = mapState.get();
  mapState.set({ ...current, center, zoom });
  updateMapCenter(center);
  updateMapZoom(zoom);
};

/**
 * Check if a background layer key is valid
 */
export const isValidBackgroundLayer = (layer: string): layer is BackgroundLayerKey => {
  return layer in BACKGROUND_LAYERS;
};

/**
 * Get background layer info
 */
export const getBackgroundLayerInfo = (layer: string) => {
  return BACKGROUND_LAYERS[layer as BackgroundLayerKey] || BACKGROUND_LAYERS.osm;
};

// Subscribe to URL state changes and update map state accordingly
urlMapState.subscribe((urlState) => {
  const current = mapState.get();
  if (current.isInitialized) {
    mapState.set({
      ...current,
      center: urlState.center,
      zoom: urlState.zoom,
      backgroundLayer: urlState.backgroundLayer
    });
  }
});