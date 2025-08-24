import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock Leaflet for testing
(global as typeof globalThis & { L: any }).L = {
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
} as any;

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, style }: any) => {
    return vi.fn(() => 
      React.createElement('div', { 
        'data-testid': 'map-container', 
        style 
      }, children)
    )();
  },
  TileLayer: ({ url, attribution, maxZoom }: any) => {
    return vi.fn(() => 
      React.createElement('div', { 
        'data-testid': 'tile-layer', 
        'data-url': url, 
        'data-attribution': attribution, 
        'data-max-zoom': maxZoom 
      }, 'Tile Layer')
    )();
  },
  Marker: ({ children, position }: any) => {
    return vi.fn(() => 
      React.createElement('div', { 
        'data-testid': 'marker', 
        'data-position': JSON.stringify(position) 
      }, children)
    )();
  },
  Popup: ({ children }: any) => {
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