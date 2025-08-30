import { atom } from 'nanostores';
import { MAP_CONFIG } from '../config';

export interface URLMapState {
  center: [number, number];
  zoom: number;
  backgroundLayer: string;
}

// Default state
const defaultState: URLMapState = {
  center: MAP_CONFIG.INITIAL_CENTER,
  zoom: MAP_CONFIG.INITIAL_ZOOM,
  backgroundLayer: 'osm'
};

// URL parameter store
export const urlMapState = atom<URLMapState>(defaultState);

// URL parameter keys
const URL_PARAMS = {
  LAT: 'lat',
  LNG: 'lng', 
  ZOOM: 'zoom',
  LAYER: 'layer'
} as const;

/**
 * Parse URL parameters and return map state
 */
export const parseURLParams = (): URLMapState => {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  const urlParams = new URLSearchParams(window.location.search);
  
  const lat = urlParams.get(URL_PARAMS.LAT);
  const lng = urlParams.get(URL_PARAMS.LNG);
  const zoom = urlParams.get(URL_PARAMS.ZOOM);
  const layer = urlParams.get(URL_PARAMS.LAYER);

  // Parse and validate parameters
  const parsedLat = lat ? parseFloat(lat) : defaultState.center[0];
  const parsedLng = lng ? parseFloat(lng) : defaultState.center[1];
  const parsedZoom = zoom ? parseInt(zoom, 10) : defaultState.zoom;
  const parsedLayer = layer || defaultState.backgroundLayer;

  // Validate coordinates (basic validation)
  const validLat = !isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : defaultState.center[0];
  const validLng = !isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180 ? parsedLng : defaultState.center[1];
  const validZoom = !isNaN(parsedZoom) && parsedZoom >= 1 && parsedZoom <= 20 ? parsedZoom : defaultState.zoom;

  return {
    center: [validLat, validLng],
    zoom: validZoom,
    backgroundLayer: parsedLayer
  };
};

/**
 * Update URL parameters with current map state
 */
export const updateURLParams = (state: URLMapState, replace: boolean = true): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  const params = url.searchParams;

  // Update parameters
  params.set(URL_PARAMS.LAT, state.center[0].toFixed(6));
  params.set(URL_PARAMS.LNG, state.center[1].toFixed(6));
  params.set(URL_PARAMS.ZOOM, state.zoom.toString());
  params.set(URL_PARAMS.LAYER, state.backgroundLayer);

  // Update browser history
  const newUrl = `${url.pathname}?${params.toString()}`;
  if (replace) {
    window.history.replaceState(null, '', newUrl);
  } else {
    window.history.pushState(null, '', newUrl);
  }
};

/**
 * Initialize URL store from current URL parameters
 */
export const initializeURLStore = (): void => {
  const state = parseURLParams();
  urlMapState.set(state);
};

/**
 * Update map center in URL and store
 */
export const updateMapCenter = (center: [number, number]): void => {
  const current = urlMapState.get();
  const newState = { ...current, center };
  urlMapState.set(newState);
  updateURLParams(newState);
};

/**
 * Update map zoom in URL and store
 */
export const updateMapZoom = (zoom: number): void => {
  const current = urlMapState.get();
  const newState = { ...current, zoom };
  urlMapState.set(newState);
  updateURLParams(newState);
};

/**
 * Update background layer in URL and store
 */
export const updateBackgroundLayer = (backgroundLayer: string): void => {
  const current = urlMapState.get();
  const newState = { ...current, backgroundLayer };
  urlMapState.set(newState);
  updateURLParams(newState);
};

/**
 * Update multiple map parameters at once
 */
export const updateMapState = (partialState: Partial<URLMapState>): void => {
  const current = urlMapState.get();
  const newState = { ...current, ...partialState };
  urlMapState.set(newState);
  updateURLParams(newState);
};

/**
 * Get shareable URL for current map state
 */
export const getShareableURL = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const state = urlMapState.get();
  const url = new URL(window.location.pathname, window.location.origin);
  const params = url.searchParams;

  params.set(URL_PARAMS.LAT, state.center[0].toFixed(6));
  params.set(URL_PARAMS.LNG, state.center[1].toFixed(6));
  params.set(URL_PARAMS.ZOOM, state.zoom.toString());
  params.set(URL_PARAMS.LAYER, state.backgroundLayer);

  return url.toString();
};