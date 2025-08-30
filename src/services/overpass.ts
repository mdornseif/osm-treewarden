import { Tree, Orchard, MapBounds, OverpassResponse } from '../types';
import L from 'leaflet';
import { MAP_CONFIG, OVERPASS_CONFIG } from '../config';

export class OverpassService {
  private static readonly OVERPASS_URL = OVERPASS_CONFIG.URL;
  private static readonly TIMEOUT = OVERPASS_CONFIG.TIMEOUT;
  private static readonly HIGH_ZOOM_THRESHOLD = MAP_CONFIG.FRUIT_TREE_ZOOM_THRESHOLD;
  
  // Extract unique genus values from SPECIES_REFERENCE_DATA
  private static readonly FRUIT_TREE_GENERA = [
    'Malus',
    'Sorbus', 
    'Pyrus',
    'Prunus',
    'Cydonia',
    'Juglans',
    'Mespilus',
    'Cornus',
    'Ficus'
  ];

  static buildTreeQuery(bounds: MapBounds, zoom?: number): string {
    const { south, west, north, east } = bounds;
    
    // At high zoom levels, filter for fruit trees only
    if (zoom && zoom >= this.HIGH_ZOOM_THRESHOLD) {
      const genusQueries = this.FRUIT_TREE_GENERA
        .map(genus => `node["natural"="tree"]["genus"="${genus}"](${south},${west},${north},${east})`)
        .join(';');
      
      return `[out:json][timeout:${OVERPASS_CONFIG.QUERY_TIMEOUT}];(${genusQueries};);out meta;`;
    }
    
    // At low zoom levels, query all trees
    const filter = '["natural"="tree"]';
    return `[out:json][timeout:${OVERPASS_CONFIG.QUERY_TIMEOUT}];node${filter}(${south},${west},${north},${east});out meta;`;
  }

  static buildOrchardQuery(bounds: MapBounds): string {
    const { south, west, north, east } = bounds;
    return `[out:json][timeout:${OVERPASS_CONFIG.QUERY_TIMEOUT}];
    way["landuse"="orchard"](${south},${west},${north},${east});
    out geom;
    relation["landuse"="orchard"](${south},${west},${north},${east});
    out geom;`;
  }

  static buildStreuobstwieseQuery(bounds: MapBounds): string {
    const { south, west, north, east } = bounds;
    return `[out:json][timeout:${OVERPASS_CONFIG.QUERY_TIMEOUT}];
    (
      way["landuse"="orchard"](${south},${west},${north},${east});
      way["name"~"^Streuobst", i](${south},${west},${north},${east});
    );
    out geom;`;
  }

  static async fetchTrees(bounds: MapBounds, zoom?: number): Promise<Tree[]> {
    const query = OverpassService.buildTreeQuery(bounds, zoom);
    return OverpassService.fetchFromOverpass(query, OverpassService.parseTreeData);
  }

  static async fetchOrchards(bounds: MapBounds): Promise<Orchard[]> {
    const query = OverpassService.buildOrchardQuery(bounds);
    return OverpassService.fetchFromOverpass(query, OverpassService.parseOrchardData);
  }

  static async fetchStreuobstwiesen(bounds: MapBounds): Promise<Orchard[]> {
    const query = OverpassService.buildStreuobstwieseQuery(bounds);
    return OverpassService.fetchFromOverpass(query, OverpassService.parseOrchardData);
  }

  private static async fetchFromOverpass<T>(
    query: string, 
    parser: (data: OverpassResponse) => T[]
  ): Promise<T[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.TIMEOUT);

    try {
      const response = await fetch(this.OVERPASS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // const contentLength = response.headers.get('content-length');

      const textPromise = response.text();
      const textTimeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Response text read timeout')), 3000)
      );

      const responseText = await Promise.race([textPromise, textTimeoutPromise]);

      const data: OverpassResponse = JSON.parse(responseText);
      return parser.call(OverpassService, data);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - Overpass API is slow or unavailable');
      }
      throw error;
    }
  }

  private static parseTreeData(data: OverpassResponse): Tree[] {
    const trees: Tree[] = [];

    if (data.elements) {
      data.elements.forEach((element) => {
        if (element.type === 'node' && element.lat && element.lon) {
          const tree: Tree = {
            id: element.id,
            lat: element.lat,
            lon: element.lon,
            version: element.version,
            timestamp: element.timestamp,
            uid: element.uid,
            user: element.user,
            type: 'node',
            tags: element.tags || {},
            properties: this.extractTreeProperties(element.tags)
          };
          trees.push(tree);
        }
      });
    }

    return trees;
  }

  private static parseOrchardData(data: OverpassResponse): Orchard[] {
    const orchards: Orchard[] = [];

    if (data.elements) {
      data.elements.forEach((element) => {
        if ((element.type === 'way' || element.type === 'relation') && element.geometry) {
          const coordinates: [number, number][] = element.geometry.map(point => [point.lat, point.lon]);

          const orchard: Orchard = {
            id: element.id,
            type: element.type,
            coordinates: coordinates,
            tags: element.tags || {},
            properties: this.extractOrchardProperties(element.tags)
          };
          orchards.push(orchard);
        }
      });
    }

    return orchards;
  }

  private static extractTreeProperties(tags?: Record<string, string>): Record<string, string> {
    const properties: Record<string, string> = {};

    if (tags) {
      Object.keys(tags).forEach(key => {
        if (tags[key] && tags[key].trim() !== '') {
          properties[key] = tags[key];
        }
      });
    }

    return properties;
  }

  private static extractOrchardProperties(tags?: Record<string, string>): Record<string, string> {
    const properties: Record<string, string> = {};

    if (tags) {
      if (tags.name) properties.name = tags.name;
      if (tags.species) properties.species = tags.species;
      if (tags.crop) properties.crop = tags.crop;
      if (tags.trees) properties.trees = tags.trees;
      if (tags.note) properties.note = tags.note;
      if (tags.description) properties.description = tags.description;
    }

    return properties;
  }

  static calculateBounds(mapBounds: L.LatLngBounds): MapBounds {
    const latDiff = mapBounds.getNorth() - mapBounds.getSouth();
    const lngDiff = mapBounds.getEast() - mapBounds.getWest();
    const latExpansion = latDiff * MAP_CONFIG.BOUNDS_EXPANSION_FACTOR;
    const lngExpansion = lngDiff * MAP_CONFIG.BOUNDS_EXPANSION_FACTOR;

    return {
      south: mapBounds.getSouth() - latExpansion,
      west: mapBounds.getWest() - lngExpansion,
      north: mapBounds.getNorth() + latExpansion,
      east: mapBounds.getEast() + lngExpansion
    };
  }
} 