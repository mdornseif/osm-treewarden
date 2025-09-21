import { describe, it, expect } from 'vitest';
import { getTreeDisplayName, getTreeDesign, getTreeIssues } from '../treeUtils';
import { Tree, Orchard } from '../../types';

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

  describe('getTreeIssues', () => {
    describe('orchard denotation suggestions', () => {
      const mockOrchard: Orchard = {
        id: 1001,
        type: 'way',
        coordinates: [
          [7.098300, 50.897100], // Bottom-left (lon, lat)
          [7.098300, 50.897200], // Bottom-right (lon, lat)
          [7.098400, 50.897200], // Top-right (lon, lat)
          [7.098400, 50.897100], // Top-left (lon, lat)
          [7.098300, 50.897100]  // Close polygon (lon, lat)
        ],
        properties: {
          name: 'Test Orchard',
          crop: 'apple'
        }
      };

      it('should suggest denotation=agricultural for tree within orchard when denotation is not set', () => {
        const tree: Tree = {
          id: 123456,
          lat: 50.897150, // Inside the orchard
          lon: 7.098350, // Inside the orchard
          type: 'node',
          properties: {
            genus: 'Malus',
            species: 'Malus domestica'
          }
        };

        const result = getTreeIssues(tree, [mockOrchard]);
        
        expect(result.todos).toHaveLength(1);
        expect(result.todos[0].message).toBe('Der Baum befindet sich in einem Obstgarten. Vorschlag: "denotation": "agricultural" setzen.');
        expect(result.todos[0].patch).toEqual([{
          key: 'denotation',
          value: 'agricultural'
        }]);
        expect(result.todos[0].severity).toBe('todos');
      });

      it('should not suggest denotation when tree already has denotation set', () => {
        const tree: Tree = {
          id: 123456,
          lat: 50.897150, // Inside the orchard
          lon: 7.098350, // Inside the orchard
          type: 'node',
          properties: {
            genus: 'Malus',
            species: 'Malus domestica',
            denotation: 'landmark'
          }
        };

        const result = getTreeIssues(tree, [mockOrchard]);
        
        // Should not have any denotation suggestions since it's already set
        const denotationSuggestions = result.todos.filter(todo => 
          todo.message.includes('denotation')
        );
        expect(denotationSuggestions).toHaveLength(0);
      });

      it('should not suggest denotation for tree outside orchard', () => {
        const tree: Tree = {
          id: 123456,
          lat: 50.897300, // Outside the orchard
          lon: 7.098500, // Outside the orchard
          type: 'node',
          properties: {
            genus: 'Malus',
            species: 'Malus domestica'
          }
        };

        const result = getTreeIssues(tree, [mockOrchard]);
        
        // Should not have any denotation suggestions since tree is outside orchard
        const denotationSuggestions = result.todos.filter(todo => 
          todo.message.includes('denotation')
        );
        expect(denotationSuggestions).toHaveLength(0);
      });

      it('should not suggest denotation when no orchards are provided', () => {
        const tree: Tree = {
          id: 123456,
          lat: 50.897150,
          lon: 7.098350,
          type: 'node',
          properties: {
            genus: 'Malus',
            species: 'Malus domestica'
          }
        };

        const result = getTreeIssues(tree, []);
        
        // Should not have any denotation suggestions since no orchards provided
        const denotationSuggestions = result.todos.filter(todo => 
          todo.message.includes('denotation')
        );
        expect(denotationSuggestions).toHaveLength(0);
      });

      it('should not suggest denotation when orchards parameter is undefined', () => {
        const tree: Tree = {
          id: 123456,
          lat: 50.897150,
          lon: 7.098350,
          type: 'node',
          properties: {
            genus: 'Malus',
            species: 'Malus domestica'
          }
        };

        const result = getTreeIssues(tree);
        
        // Should not have any denotation suggestions since orchards is undefined
        const denotationSuggestions = result.todos.filter(todo => 
          todo.message.includes('denotation')
        );
        expect(denotationSuggestions).toHaveLength(0);
      });

      it('should suggest denotation for tree in multiple orchards (only once)', () => {
        const secondOrchard: Orchard = {
          id: 1002,
          type: 'way',
          coordinates: [
            [7.098340, 50.897140], // Overlapping with first orchard (lon, lat)
            [7.098340, 50.897160],
            [7.098360, 50.897160],
            [7.098360, 50.897140],
            [7.098340, 50.897140]
          ],
          properties: {
            name: 'Second Test Orchard',
            crop: 'pear'
          }
        };

        const tree: Tree = {
          id: 123456,
          lat: 50.897150, // Inside both orchards
          lon: 7.098350, // Inside both orchards
          type: 'node',
          properties: {
            genus: 'Malus',
            species: 'Malus domestica'
          }
        };

        const result = getTreeIssues(tree, [mockOrchard, secondOrchard]);
        
        // Should only suggest denotation once, even though tree is in multiple orchards
        const denotationSuggestions = result.todos.filter(todo => 
          todo.message.includes('denotation')
        );
        expect(denotationSuggestions).toHaveLength(1);
        expect(denotationSuggestions[0].patch).toEqual([{
          key: 'denotation',
          value: 'agricultural'
        }]);
      });
    });
  });
}); 