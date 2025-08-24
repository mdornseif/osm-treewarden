import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock Leaflet for testing
interface MockLeaflet {
  Icon: {
    Default: {
      prototype: Record<string, unknown>;
      mergeOptions: typeof vi.fn;
    };
  };
  map: typeof vi.fn;
  tileLayer: typeof vi.fn;
  circleMarker: typeof vi.fn;
  marker: typeof vi.fn;
  divIcon: typeof vi.fn;
  control: {
    layers: typeof vi.fn;
  };
  CRS: {
    EPSG3857: Record<string, unknown>;
  };
}

(global as typeof globalThis & { L: MockLeaflet }).L = {
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: vi.fn(),
    },
  },
  map: vi.fn(() => ({
    setView: vi.fn(),
    addLayer: vi.fn(),
    remove: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getBounds: vi.fn(() => ({
      getSouth: () => 50.8,
      getWest: () => 7.0,
      getNorth: () => 51.0,
      getEast: () => 7.2,
    })),
  })),
  tileLayer: vi.fn(() => ({
    addTo: vi.fn(),
  })),
  marker: vi.fn(() => ({
    addTo: vi.fn(),
    bindPopup: vi.fn(),
  })),
  layerGroup: vi.fn(() => ({
    addTo: vi.fn(),
    clearLayers: vi.fn(),
  })),
  divIcon: vi.fn(() => ({})),
};

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => {
    return vi.fn(() => 
      React.createElement('div', { 
        'data-testid': 'map-container', 
        style 
      }, children)
    )();
  },
  TileLayer: ({ url, attribution, maxZoom }: { url?: string; attribution?: string; maxZoom?: number }) => {
    return vi.fn(() => 
      React.createElement('div', { 
        'data-testid': 'tile-layer', 
        'data-url': url, 
        'data-attribution': attribution, 
        'data-max-zoom': maxZoom 
      }, 'Tile Layer')
    )();
  },
  Marker: ({ children, position }: { children?: React.ReactNode; position?: [number, number] }) => {
    return vi.fn(() => 
      React.createElement('div', { 
        'data-testid': 'marker', 
        'data-position': JSON.stringify(position) 
      }, children)
    )();
  },
  Popup: ({ children }: { children?: React.ReactNode }) => {
    return vi.fn(() => 
      React.createElement('div', { 
        'data-testid': 'popup' 
      }, children)
    )();
  },
  useMap: () => ({
    getBounds: vi.fn(() => ({
      getSouth: () => 50.8,
      getWest: () => 7.0,
      getNorth: () => 51.0,
      getEast: () => 7.2,
    })),
    on: vi.fn(),
    off: vi.fn(),
  }),
})); 