import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mapState, initializeMapState, setMapCenter, setMapZoom, setBackgroundLayer } from '../store/mapStore';

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  search: '',
  pathname: '/',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

// Mock window.history
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  length: 1,
  scrollRestoration: 'auto',
  state: null,
};

describe('Map Store', () => {
  beforeEach(() => {
    // Reset the store
    mapState.set({
      center: [50.897146, 7.098337],
      zoom: 17,
      backgroundLayer: 'osm',
    });

    // Mock window.location and window.history
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    Object.defineProperty(window, 'history', {
      value: mockHistory,
      writable: true,
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default values', () => {
    const state = mapState.get();
    expect(state.center).toEqual([50.897146, 7.098337]);
    expect(state.zoom).toBe(17);
    expect(state.backgroundLayer).toBe('osm');
  });

  it('should parse URL parameters correctly', () => {
    // Set URL parameters
    mockLocation.search = '?lat=51.5074&lng=-0.1278&z=15&layer=nrw-orthophoto';
    
    initializeMapState();
    
    const state = mapState.get();
    expect(state.center).toEqual([51.5074, -0.1278]);
    expect(state.zoom).toBe(15);
    expect(state.backgroundLayer).toBe('nrw-orthophoto');
  });

  it('should ignore invalid URL parameters', () => {
    // Set invalid URL parameters
    mockLocation.search = '?lat=invalid&lng=invalid&z=invalid&layer=invalid';
    
    initializeMapState();
    
    const state = mapState.get();
    expect(state.center).toEqual([50.897146, 7.098337]); // Default values
    expect(state.zoom).toBe(17);
    expect(state.backgroundLayer).toBe('osm');
  });

  it('should update URL when setting map center', () => {
    setMapCenter([51.5074, -0.1278]);
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining('lat=51.5074&lng=-0.1278')
    );
  });

  it('should update URL when setting zoom level', () => {
    setMapZoom(15);
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining('z=15')
    );
  });

  it('should update URL when setting background layer', () => {
    setBackgroundLayer('nrw-orthophoto');
    
    expect(mockHistory.replaceState).toHaveBeenCalledWith(
      {},
      '',
      expect.stringContaining('layer=nrw-orthophoto')
    );
  });

  it('should handle partial URL parameters', () => {
    // Only set lat and lng
    mockLocation.search = '?lat=51.5074&lng=-0.1278';
    
    initializeMapState();
    
    const state = mapState.get();
    expect(state.center).toEqual([51.5074, -0.1278]);
    expect(state.zoom).toBe(17); // Default zoom
    expect(state.backgroundLayer).toBe('osm'); // Default layer
  });

  it('should validate zoom level range', () => {
    // Test zoom levels outside valid range
    mockLocation.search = '?z=-1'; // Invalid: too low
    initializeMapState();
    expect(mapState.get().zoom).toBe(17); // Should use default

    mockLocation.search = '?z=20'; // Invalid: too high
    initializeMapState();
    expect(mapState.get().zoom).toBe(17); // Should use default

    mockLocation.search = '?z=10'; // Valid
    initializeMapState();
    expect(mapState.get().zoom).toBe(10); // Should use provided value
  });

  it('should validate background layer options', () => {
    // Test invalid layer
    mockLocation.search = '?layer=invalid-layer';
    initializeMapState();
    expect(mapState.get().backgroundLayer).toBe('osm'); // Should use default

    // Test valid layers
    mockLocation.search = '?layer=nrw-orthophoto';
    initializeMapState();
    expect(mapState.get().backgroundLayer).toBe('nrw-orthophoto');

    mockLocation.search = '?layer=osm';
    initializeMapState();
    expect(mapState.get().backgroundLayer).toBe('osm');
  });
});