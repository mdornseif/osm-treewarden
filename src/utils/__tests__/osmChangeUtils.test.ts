import { describe, it, expect, vi } from 'vitest';
import { convertPatchesToOsmChange, downloadOsmChangeFile, parseOsmChangeFile } from '../osmChangeUtils';
import { TreePatch, Tree } from '../../types';

// Mock DOM APIs for testing
const mockDOMParser = {
  parseFromString: vi.fn()
};

Object.defineProperty(window, 'DOMParser', {
  value: vi.fn(() => mockDOMParser)
});

describe('osmChangeUtils', () => {
  describe('parseOsmChangeFile', () => {
    it('should parse valid OsmChange XML and return patches', () => {
      const mockXmlDoc = {
        getElementsByTagName: vi.fn(() => []),
        querySelectorAll: vi.fn(() => [
          {
            getAttribute: vi.fn((attr: string) => {
              if (attr === 'id') return '123';
              if (attr === 'version') return '2';
              return null;
            }),
            querySelectorAll: vi.fn(() => [
              {
                getAttribute: vi.fn((attr: string) => {
                  if (attr === 'k') return 'species';
                  if (attr === 'v') return 'Malus domestica';
                  return null;
                })
              },
              {
                getAttribute: vi.fn((attr: string) => {
                  if (attr === 'k') return 'genus';
                  if (attr === 'v') return 'Malus';
                  return null;
                })
              }
            ])
          }
        ])
      };

      mockDOMParser.parseFromString.mockReturnValue(mockXmlDoc);

      const osmChangeContent = `<?xml version="1.0" encoding="UTF-8"?>
<osmChange version="0.6" generator="OSM Tree Warden">
  <modify>
    <node id="123" changeset="1" version="2" lat="52.5200" lon="13.4050">
      <tag k="species" v="Malus domestica"/>
      <tag k="genus" v="Malus"/>
    </node>
  </modify>
</osmChange>`;

      const result = parseOsmChangeFile(osmChangeContent);

      expect(result).toEqual({
        123: {
          osmId: 123,
          version: 2,
          changes: {
            species: 'Malus domestica',
            genus: 'Malus'
          }
        }
      });
    });

    it('should handle parsing errors gracefully', () => {
      const mockXmlDoc = {
        getElementsByTagName: vi.fn(() => [{ message: 'Parse error' }])
      };

      mockDOMParser.parseFromString.mockReturnValue(mockXmlDoc);

      const invalidXml = 'invalid xml content';

      expect(() => parseOsmChangeFile(invalidXml)).toThrow('Invalid XML format');
    });

    it('should handle empty OsmChange file', () => {
      const mockXmlDoc = {
        getElementsByTagName: vi.fn(() => []),
        querySelectorAll: vi.fn(() => [])
      };

      mockDOMParser.parseFromString.mockReturnValue(mockXmlDoc);

      const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<osmChange version="0.6" generator="OSM Tree Warden">
</osmChange>`;

      const result = parseOsmChangeFile(emptyXml);

      expect(result).toEqual({});
    });
  });

  describe('convertPatchesToOsmChange', () => {
    it('should convert patches to OsmChange XML with original data preserved', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: 52.5200,
          lon: 13.4050,
          version: 1,
          tags: {
            'natural': 'tree',
            'species': 'Malus domestica',
            'genus': 'Malus'
          },
          properties: {
            species: 'Malus domestica',
            genus: 'Malus',
            cultivar: 'Golden Delicious'
          }
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      // Should contain all original tags plus the new tag
      expect(result).toContain('<tag k="natural" v="tree"/>');
      expect(result).toContain('<tag k="species" v="Malus domestica"/>');
      expect(result).toContain('<tag k="genus" v="Malus"/>');
      expect(result).toContain('<tag k="cultivar" v="Golden Delicious"/>');
      expect(result).toContain('<tag k="cultivar:wikidata" v="Q1565579"/>');
      
      // Should not be empty
      expect(result).not.toBe('');
      expect(result).toContain('<modify>');
    });

    it('should throw error for invalid coordinates (lat=0)', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: 0, // Invalid coordinate
          lon: 13.4050,
          version: 1,
          properties: {
            species: 'Malus domestica'
          }
        }
      ];

      expect(() => convertPatchesToOsmChange(patches, trees))
        .toThrow('Tree 123 has invalid coordinates: lat=0, lon=13.405');
    });

    it('should throw error for invalid coordinates (lon=0)', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: 52.5200,
          lon: 0, // Invalid coordinate
          version: 1,
          properties: {
            species: 'Malus domestica'
          }
        }
      ];

      expect(() => convertPatchesToOsmChange(patches, trees))
        .toThrow('Tree 123 has invalid coordinates: lat=52.52, lon=0');
    });

    it('should throw error for missing coordinates (lat=undefined)', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: undefined as unknown as number, // Invalid coordinate
          lon: 13.4050,
          version: 1,
          properties: {
            species: 'Malus domestica'
          }
        }
      ];

      expect(() => convertPatchesToOsmChange(patches, trees))
        .toThrow('Tree 123 has invalid coordinates: lat=undefined, lon=13.405');
    });

    it('should merge patch changes with existing tree data', () => {
      const patches: Record<number, TreePatch> = {
        12688058037: {
          osmId: 12688058037,
          version: 4,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12688058037,
          type: 'node',
          lat: 50.9321747,
          lon: 7.2268566,
          version: 3,
          tags: {
            'natural': 'tree',
            'species': 'Malus domestica',
            'genus': 'Malus'
          },
          properties: {
            species: 'Malus domestica',
            genus: 'Malus',
            cultivar: 'Golden Delicious'
          }
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      // Should include ALL original data plus the new tag
      expect(result).toContain('<tag k="natural" v="tree"/>');
      expect(result).toContain('<tag k="species" v="Malus domestica"/>');
      expect(result).toContain('<tag k="genus" v="Malus"/>');
      expect(result).toContain('<tag k="cultivar" v="Golden Delicious"/>');
      expect(result).toContain('<tag k="cultivar:wikidata" v="Q1565579"/>');
      
      // Should have correct node attributes
      expect(result).toContain('<node id="12688058037" changeset="1" version="4" lat="50.9321747" lon="7.2268566">');
      
      // Should not be empty
      expect(result).not.toBe('');
      expect(result).toContain('<modify>');
    });

    it('should handle trees with only properties (no tags)', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: 52.5200,
          lon: 13.4050,
          version: 1,
          properties: {
            species: 'Malus domestica',
            genus: 'Malus'
          }
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      // Should include properties as tags
      expect(result).toContain('<tag k="species" v="Malus domestica"/>');
      expect(result).toContain('<tag k="genus" v="Malus"/>');
      expect(result).toContain('<tag k="cultivar:wikidata" v="Q1565579"/>');
    });

    it('should handle trees with only tags (no properties)', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: 52.5200,
          lon: 13.4050,
          version: 1,
          tags: {
            'natural': 'tree',
            'species': 'Malus domestica'
          },
          properties: {}
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      // Should include tags
      expect(result).toContain('<tag k="natural" v="tree"/>');
      expect(result).toContain('<tag k="species" v="Malus domestica"/>');
      expect(result).toContain('<tag k="cultivar:wikidata" v="Q1565579"/>');
    });

    it('should skip patches with missing tree data', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        },
        456: {
          osmId: 456,
          version: 1,
          changes: {
            'species': 'Pyrus communis'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: 52.5200,
          lon: 13.4050,
          version: 1,
          properties: {
            species: 'Malus domestica'
          }
        }
        // Tree 456 is missing
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      // Should only include tree 123
      expect(result).toContain('<node id="123"');
      expect(result).not.toContain('<node id="456"');
      expect(result).toContain('<tag k="species" v="Malus domestica"/>');
      expect(result).toContain('<tag k="cultivar:wikidata" v="Q1565579"/>');
    });

    it('should handle empty patches object', () => {
      const patches: Record<number, TreePatch> = {};
      const trees: Tree[] = [];

      const result = convertPatchesToOsmChange(patches, trees);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osmChange version="0.6" generator="TreeWarden">');
      expect(result).toContain('</osmChange>');
      expect(result).not.toContain('<modify>');
    });

    // REGRESSION TEST: This test would catch the exact issue described by the user
    it('should NOT regress to only including patch changes (data loss scenario)', () => {
      // This simulates the exact scenario described by the user:
      // "if i add a tag to a node i still get an empty osm changeset xml"
      const patches: Record<number, TreePatch> = {
        12688058037: {
          osmId: 12688058037,
          version: 4,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12688058037,
          type: 'node',
          lat: 50.9321747,
          lon: 7.2268566,
          version: 3,
          tags: {
            'natural': 'tree',
            'species': 'Malus domestica',
            'genus': 'Malus'
          },
          properties: {
            species: 'Malus domestica',
            genus: 'Malus',
            cultivar: 'Golden Delicious'
          }
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      // CRITICAL: These assertions would fail if the regression occurred
      // If someone accidentally reverted to only including patch changes, these would fail:
      
      // 1. Should include ALL original tags (not just the patch)
      expect(result).toContain('<tag k="natural" v="tree"/>');
      expect(result).toContain('<tag k="species" v="Malus domestica"/>');
      expect(result).toContain('<tag k="genus" v="Malus"/>');
      expect(result).toContain('<tag k="cultivar" v="Golden Delicious"/>');
      
      // 2. Should include the new patch tag
      expect(result).toContain('<tag k="cultivar:wikidata" v="Q1565579"/>');
      
      // 3. Should NOT be empty (this was the user's main issue)
      expect(result).not.toBe('');
      expect(result.length).toBeGreaterThan(100); // Should be substantial XML
      
      // 4. Should contain the complete node structure
      expect(result).toContain('<node id="12688058037" changeset="1" version="4" lat="50.9321747" lon="7.2268566">');
      expect(result).toContain('</node>');
      expect(result).toContain('<modify>');
      expect(result).toContain('</modify>');
      
      // 5. Should have the correct number of tags (original + new)
      const tagMatches = result.match(/<tag k=/g);
      expect(tagMatches).toHaveLength(5); // 4 original + 1 new
    });

    // REGRESSION TEST: This test would catch coordinate validation regression
    it('should NOT regress to allowing invalid coordinates', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            'cultivar:wikidata': 'Q1565579'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 123,
          type: 'node',
          lat: 0, // Invalid coordinate
          lon: 7.2268566,
          version: 1,
          properties: {
            species: 'Malus domestica'
          }
        }
      ];

      // This should throw an error - if it doesn't, we have a regression
      expect(() => convertPatchesToOsmChange(patches, trees))
        .toThrow('Tree 123 has invalid coordinates: lat=0, lon=7.2268566');
    });
  });

  describe('downloadOsmChangeFile', () => {
    it('should create and trigger download', () => {
      // Mock DOM APIs
      const mockBlob = { type: 'application/xml' };
      const mockUrl = 'blob:mock-url';
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };

      window.Blob = vi.fn(() => mockBlob) as unknown as typeof Blob;
      window.URL.createObjectURL = vi.fn(() => mockUrl);
      window.URL.revokeObjectURL = vi.fn();
      window.document.createElement = vi.fn(() => mockLink) as unknown as typeof document.createElement;
      window.document.body.appendChild = vi.fn();
      window.document.body.removeChild = vi.fn();

      const content = '<osmChange>test</osmChange>';
      const filename = 'test.osc';

      downloadOsmChangeFile(content, filename);

      expect(window.Blob).toHaveBeenCalledWith([content], { type: 'application/xml' });
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockLink.href).toBe(mockUrl);
      expect(mockLink.download).toBe(filename);
      expect(mockLink.click).toHaveBeenCalled();
      expect(window.document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(window.document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });
}); 