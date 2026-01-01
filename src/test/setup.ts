import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Mock TileLayer class for instanceof checks
class MockTileLayer {
  addTo = vi.fn();
  constructor() {}
}

class MockTileLayerWMS extends MockTileLayer {
  constructor() {
    super();
  }
}

// Mock Leaflet for testing
interface MockLeaflet {
  Icon: {
    Default: {
      prototype: Record<string, unknown>;
      mergeOptions: typeof vi.fn;
    };
  };
  map: typeof vi.fn;
  tileLayer: typeof vi.fn & {
    wms: typeof vi.fn;
  };
  TileLayer: typeof MockTileLayer & {
    WMS: typeof MockTileLayerWMS;
  };
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
  TileLayer: Object.assign(MockTileLayer, {
    WMS: MockTileLayerWMS,
  }) as typeof MockTileLayer & { WMS: typeof MockTileLayerWMS },
  tileLayer: Object.assign(
    vi.fn(() => new MockTileLayer()),
    {
      wms: vi.fn(() => new MockTileLayerWMS()),
    }
  ) as typeof vi.fn & { wms: typeof vi.fn },
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
  useMap: () => {
    const mockLayers: unknown[] = [];
    return {
      getBounds: vi.fn(() => ({
        getSouth: () => 50.8,
        getWest: () => 7.0,
        getNorth: () => 51.0,
        getEast: () => 7.2,
      })),
      on: vi.fn(),
      off: vi.fn(),
      eachLayer: vi.fn((callback: (layer: unknown) => void) => {
        mockLayers.forEach(callback);
      }),
      removeLayer: vi.fn((layer: unknown) => {
        const index = mockLayers.indexOf(layer);
        if (index > -1) {
          mockLayers.splice(index, 1);
        }
      }),
      addLayer: vi.fn((layer: unknown) => {
        mockLayers.push(layer);
      }),
    };
  },
})); 