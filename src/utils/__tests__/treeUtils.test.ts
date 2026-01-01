import { describe, it, expect } from 'vitest';
import { getTreeDisplayName, getTreeDesign } from '../treeUtils';
import { Tree } from '../../types';

describe('treeUtils', () => {
  describe('getTreeDisplayName', () => {
    it('should return taxon:cultivar when available', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          'taxon:cultivar': 'Golden Maple',
          taxon: 'Acer platanoides',
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      };

      expect(getTreeDisplayName(tree)).toBe('Golden Maple');
    });

    it('should return taxon when taxon:cultivar is not available', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          taxon: 'Acer platanoides',
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      };

      expect(getTreeDisplayName(tree)).toBe('Acer platanoides');
    });

    it('should return species when taxon properties are not available', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      };

      expect(getTreeDisplayName(tree)).toBe('Acer platanoides');
    });

    it('should return genus when species is not available', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Acer'
        }
      };

      expect(getTreeDisplayName(tree)).toBe('Acer');
    });

    it('should return fallback with tree ID when no name properties are available', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {}
      };

      expect(getTreeDisplayName(tree)).toBe('Baum 123456');
    });

    it('should prioritize taxon:cultivar over other properties', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          'taxon:cultivar': 'Golden Maple',
          taxon: 'Acer platanoides',
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      };

      expect(getTreeDisplayName(tree)).toBe('Golden Maple');
    });
  });

  describe('getTreeDesign', () => {
    it('should return yellow colors for Pyrus genus', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Pyrus'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#B8860B');
      expect(result.fillColor).toBe('#FFD700');
    });

    it('should return dark violet colors for Prunus genus', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Prunus'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#4B0082');
      expect(result.fillColor).toBe('#8B008B');
    });

    it('should return bright green colors for Malus genus', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Malus'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#006400');
      expect(result.fillColor).toBe('#00FF00');
    });

    it('should return orange colors for Sorbus genus', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Sorbus'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#CC7000');
      expect(result.fillColor).toBe('#FFA500');
    });

    it('should return orange colors for Cormus genus', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Cormus'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#CC7000');
      expect(result.fillColor).toBe('#FFA500');
    });

    it('should return dark dirty yellow colors for Cydonia genus', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Cydonia'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#8B6914');
      expect(result.fillColor).toBe('#B8860B');
    });

    it('should return bright brown colors for Mespilus genus', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Mespilus'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#8B4513');
      expect(result.fillColor).toBe('#CD853F');
    });

    it('should handle case-insensitive genus matching', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'PYRUS'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toBe('#B8860B');
      expect(result.fillColor).toBe('#FFD700');
    });

    it('should generate hash-based colors for unknown genera', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'UnknownGenus',
          species: 'UnknownSpecies'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.fillColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.color).not.toBe(result.fillColor);
    });

    it('should generate hash-based colors when genus is not available', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          species: 'UnknownSpecies'
        }
      };

      const result = getTreeDesign(tree);
      expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.fillColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should generate consistent colors for the same genus', () => {
      const tree1: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'UnknownGenus',
          species: 'Species1'
        }
      };

      const tree2: Tree = {
        id: 789012,
        lat: 50.897200,
        lon: 7.098400,
        properties: {
          genus: 'UnknownGenus',
          species: 'Species2'
        }
      };

      const result1 = getTreeDesign(tree1);
      const result2 = getTreeDesign(tree2);

      expect(result1.fillColor).toBe(result2.fillColor);
      expect(result1.color).not.toBe(result2.color); // Different species, different border color
    });

    it('should return valid hex color strings', () => {
      const tree: Tree = {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'TestGenus'
        }
      };

      const result = getTreeDesign(tree);
      
      // Check that both colors are valid hex strings
      expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.fillColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      
      // Check that colors are different (border should be muted)
      expect(result.color).not.toBe(result.fillColor);
    });
  });
}); 