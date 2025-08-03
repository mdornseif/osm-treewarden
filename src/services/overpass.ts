import { Tree, Orchard, MapBounds, OverpassResponse } from '../types';

export class OverpassService {
  private static readonly OVERPASS_URL = 'http://overpass-api.de/api/interpreter';
  private static readonly TIMEOUT = 180000;

  static buildTreeQuery(bounds: MapBounds): string {
    const { south, west, north, east } = bounds;
    const filter = '["natural"="tree"]';
    return `[out:json][timeout:25];node${filter}(${south},${west},${north},${east});out meta;`;
  }

  static buildOrchardQuery(bounds: MapBounds): string {
    const { south, west, north, east } = bounds;
    return `[out:json][timeout:25];
    way["landuse"="orchard"](${south},${west},${north},${east});
    out geom;
    relation["landuse"="orchard"](${south},${west},${north},${east});
    out geom;`;
  }

  static async fetchTrees(bounds: MapBounds): Promise<Tree[]> {
    const query = OverpassService.buildTreeQuery(bounds);
    return OverpassService.fetchFromOverpass(query, OverpassService.parseTreeData);
  }

  static async fetchOrchards(bounds: MapBounds): Promise<Orchard[]> {
    const query = OverpassService.buildOrchardQuery(bounds);
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

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 5000000) {
        throw new Error('Response too large - Overpass API returned too much data');
      }

      const textPromise = response.text();
      const textTimeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Response text read timeout')), 3000)
      );

      const responseText = await Promise.race([textPromise, textTimeoutPromise]);

      if (responseText.length > 1000000) {
        throw new Error('Response text too large - Overpass API returned too much data');
      }

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

  static calculateBounds(mapBounds: any): MapBounds {
    const latDiff = mapBounds.getNorth() - mapBounds.getSouth();
    const lngDiff = mapBounds.getEast() - mapBounds.getWest();
    const latExpansion = latDiff * 0.25;
    const lngExpansion = lngDiff * 0.25;

    return {
      south: mapBounds.getSouth() - latExpansion,
      west: mapBounds.getWest() - lngExpansion,
      north: mapBounds.getNorth() + latExpansion,
      east: mapBounds.getEast() + lngExpansion
    };
  }
} 