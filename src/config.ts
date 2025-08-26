// Application configuration constants
import packageJson from '../package.json' assert { type: 'json' };

export const MAP_CONFIG = {
  // Initial map position and zoom
  INITIAL_CENTER: [50.897146, 7.098337] as [number, number], // [lat, lng]
  INITIAL_ZOOM: 17,
  
  // Zoom level threshold for switching between all trees and fruit trees only
  FRUIT_TREE_ZOOM_THRESHOLD: 13,
  
  // Map bounds expansion factor (25% = 0.25)
  BOUNDS_EXPANSION_FACTOR: 0.25,
} as const;

export const OVERPASS_CONFIG = {
  // Overpass API settings
  URL: 'https://overpass-api.de/api/interpreter',
  TIMEOUT: 10000, // 10 seconds
  
  // Query timeout for Overpass API
  QUERY_TIMEOUT: 25,
} as const;

export const APP_CONFIG = {
  // Application metadata
  NAME: 'TreeWarden',
  VERSION: packageJson.version,
  
  // OSM changeset metadata
  CHANGESET_TAGS: {
    created_by: 'TreeWarden',
    comment: 'Tree data updates via TreeWarden application',
    source: 'TreeWarden web application',
  },
} as const; 