import { atom } from 'nanostores';

export interface MapState {
  center: [number, number];
  zoom: number;
  backgroundLayer: string;
}

// Default values
const DEFAULT_CENTER: [number, number] = [50.897146, 7.098337];
const DEFAULT_ZOOM = 17;
const DEFAULT_BACKGROUND_LAYER = 'osm';

export const mapState = atom<MapState>({
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  backgroundLayer: DEFAULT_BACKGROUND_LAYER,
});

// URL parameter utilities
const URL_PARAMS = {
  LAT: 'lat',
  LNG: 'lng',
  ZOOM: 'z',
  LAYER: 'layer',
} as const;

// Parse URL parameters
const parseUrlParams = (): Partial<MapState> => {
  const urlParams = new URLSearchParams(window.location.search);
  const lat = urlParams.get(URL_PARAMS.LAT);
  const lng = urlParams.get(URL_PARAMS.LNG);
  const zoom = urlParams.get(URL_PARAMS.ZOOM);
  const layer = urlParams.get(URL_PARAMS.LAYER);

  const state: Partial<MapState> = {};

  if (lat && lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      state.center = [latNum, lngNum];
    }
  }

  if (zoom) {
    const zoomNum = parseInt(zoom, 10);
    if (!isNaN(zoomNum) && zoomNum >= 0 && zoomNum <= 19) {
      state.zoom = zoomNum;
    }
  }

  if (layer && ['osm', 'nrw-orthophoto'].includes(layer)) {
    state.backgroundLayer = layer;
  }

  return state;
};

// Update URL parameters
const updateUrlParams = (state: MapState) => {
  const url = new URL(window.location.href);
  url.searchParams.set(URL_PARAMS.LAT, state.center[0].toString());
  url.searchParams.set(URL_PARAMS.LNG, state.center[1].toString());
  url.searchParams.set(URL_PARAMS.ZOOM, state.zoom.toString());
  url.searchParams.set(URL_PARAMS.LAYER, state.backgroundLayer);
  
  // Update URL without reloading the page
  window.history.replaceState({}, '', url.toString());
};

// Initialize map state from URL parameters
export const initializeMapState = () => {
  const urlState = parseUrlParams();
  const currentState = mapState.get();
  
  const newState: MapState = {
    center: urlState.center || currentState.center,
    zoom: urlState.zoom || currentState.zoom,
    backgroundLayer: urlState.backgroundLayer || currentState.backgroundLayer,
  };

  mapState.set(newState);
  updateUrlParams(newState);
};

// Actions
export const setMapCenter = (center: [number, number]) => {
  const current = mapState.get();
  const newState = { ...current, center };
  mapState.set(newState);
  updateUrlParams(newState);
};

export const setMapZoom = (zoom: number) => {
  const current = mapState.get();
  const newState = { ...current, zoom };
  mapState.set(newState);
  updateUrlParams(newState);
};

export const setBackgroundLayer = (backgroundLayer: string) => {
  const current = mapState.get();
  const newState = { ...current, backgroundLayer };
  mapState.set(newState);
  updateUrlParams(newState);
};

export const updateMapState = (updates: Partial<MapState>) => {
  const current = mapState.get();
  const newState = { ...current, ...updates };
  mapState.set(newState);
  updateUrlParams(newState);
};