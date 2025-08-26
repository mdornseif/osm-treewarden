import { describe, it, expect } from 'vitest';
import { OverpassService } from '../overpass';
import { MapBounds } from '../../types';

describe('OverpassService', () => {
  const testBounds: MapBounds = {
    south: 50.0,
    west: 7.0,
    north: 51.0,
    east: 8.0
  };

  describe('buildTreeQuery', () => {
    it('should build query for all trees at low zoom levels', () => {
      const query = OverpassService.buildTreeQuery(testBounds, 12);
      
      expect(query).toBe('[out:json][timeout:25];node["natural"="tree"](50,7,51,8);out meta;');
    });

    it('should build query for all trees when no zoom is provided', () => {
      const query = OverpassService.buildTreeQuery(testBounds);
      
      expect(query).toBe('[out:json][timeout:25];node["natural"="tree"](50,7,51,8);out meta;');
    });

    it('should build query for fruit trees only at high zoom levels', () => {
      const query = OverpassService.buildTreeQuery(testBounds, 13);
      
      const expectedGenusQueries = [
        'node["natural"="tree"]["genus"="Malus"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Sorbus"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Pyrus"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Prunus"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Cydonia"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Juglans"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Mespilus"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Cornus"](50,7,51,8)',
        'node["natural"="tree"]["genus"="Ficus"](50,7,51,8)'
      ].join(';');
      
      const expectedQuery = `[out:json][timeout:25];(${expectedGenusQueries};);out meta;`;
      
      expect(query).toBe(expectedQuery);
    });

    it('should build query for fruit trees only at very high zoom levels', () => {
      const query = OverpassService.buildTreeQuery(testBounds, 16);
      
      // Should still filter for fruit trees at very high zoom
      expect(query).toContain('genus"="Malus"');
      expect(query).toContain('genus"="Pyrus"');
      expect(query).toContain('genus"="Prunus"');
      expect(query).not.toContain('["natural"="tree"](50,7,51,8)'); // Should not be the simple query
    });

    it('should include all expected fruit tree genera', () => {
      const query = OverpassService.buildTreeQuery(testBounds, 16);
      
      const expectedGenera = ['Malus', 'Sorbus', 'Pyrus', 'Prunus', 'Cydonia', 'Juglans', 'Mespilus', 'Cornus', 'Ficus'];
      
      expectedGenera.forEach(genus => {
        expect(query).toContain(`genus"="${genus}"`);
      });
    });
  });

  describe('calculateBounds', () => {
    it('should expand bounds by 25%', () => {
      const mockMapBounds = {
        getNorth: () => 51.0,
        getSouth: () => 50.0,
        getEast: () => 8.0,
        getWest: () => 7.0
      };

      const result = OverpassService.calculateBounds(mockMapBounds);

      expect(result.north).toBe(51.25); // 51.0 + (1.0 * 0.25)
      expect(result.south).toBe(49.75); // 50.0 - (1.0 * 0.25)
      expect(result.east).toBe(8.25);   // 8.0 + (1.0 * 0.25)
      expect(result.west).toBe(6.75);   // 7.0 - (1.0 * 0.25)
    });
  });
});