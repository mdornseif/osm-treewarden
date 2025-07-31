// Core data types
export interface Tree {
  id: number;
  lat: number;
  lon: number;
  version?: number;
  timestamp?: string;
  uid?: number;
  user?: string;
  type: 'node';
  tags?: Record<string, string>;
  properties: TreeProperties;
}

export interface TreeProperties {
  species?: string;
  genus?: string;
  taxon?: string;
  cultivar?: string;
  height?: string;
  diameter_crown?: string;
  circumference?: string;
  leaf_type?: string;
  leaf_cycle?: string;
  age?: string;
  planted?: string;
  start_date?: string;
  denotation?: string;
  protection?: string;
  loc_name?: string;
  'species:wikidata'?: string;
  'species:wikipedia'?: string;
  'taxon:cultivar'?: string;
  [key: string]: string | undefined;
}

export interface Orchard {
  id: number;
  type: 'way' | 'relation';
  coordinates: [number, number][];
  tags?: Record<string, string>;
  properties: OrchardProperties;
}

export interface OrchardProperties {
  name?: string;
  species?: string;
  crop?: string;
  trees?: string;
  note?: string;
  description?: string;
}

export interface MapBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

// API response types
export interface OverpassResponse {
  elements: OverpassElement[];
}

export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  version?: number;
  timestamp?: string;
  uid?: number;
  user?: string;
  tags?: Record<string, string>;
  geometry?: Array<{ lat: number; lon: number }>;
}

export interface OSMChangesetData {
  changeset: {
    tag: Array<{ k: string; v: string }>;
  };
  create: any[];
  modify: OSMNode[];
  delete: any[];
}

export interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  version?: number;
  tag: Array<{ k: string; v: string }>;
}

// Validation types
export interface ValidationResult {
  warnings: string[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationSuggestion {
  text: string;
  fix?: {
    action: string;
    value: string;
  };
}

export interface GenusMapping {
  [genus: string]: {
    species: string;
    'species:wikidata': string;
    'species:wikipedia'?: string;
  };
}

// URL and state types
export interface URLParams {
  center?: string;
  zoom?: string;
  basemap?: string;
}

// Map layer types
export interface MapLayer {
  id: string;
  name: string;
  url: string;
  attribution: string;
  maxZoom?: number;
  minZoom?: number;
  ext?: string;
}

// Global types
declare global {
  interface Window {
    L: any;
    osmAuth: any;
  }
}

// Change management types
export interface TreeChange {
  osmId: number;
  version: number;
  changes: Record<string, string>;
  timestamp?: string;
  userId?: number;
  username?: string;
}

export interface ChangeStore {
  changes: Record<number, TreeChange>;
  pendingChanges: Record<number, TreeChange>;
  appliedChanges: Record<number, TreeChange>;
} 