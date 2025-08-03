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
    it('should convert patches to OsmChange XML', () => {
      const patches: Record<number, TreePatch> = {
        123: {
          osmId: 123,
          version: 2,
          changes: {
            species: 'Malus domestica',
            genus: 'Malus'
          }
        }
      };

      const trees: Tree[] = [
                  {
            id: 123,
            type: 'node',
            lat: 52.5200,
            lon: 13.4050,
            properties: {
              species: 'Malus',
              genus: 'Malus'
            }
          }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osmChange version="0.6" generator="OSM Tree Warden">');
      expect(result).toContain('<modify>');
      expect(result).toContain('<node id="123" changeset="1" version="2" lat="52.52" lon="13.405">');
      expect(result).toContain('<tag k="species" v="Malus domestica"/>');
      expect(result).toContain('<tag k="genus" v="Malus"/>');
      expect(result).toContain('</modify>');
      expect(result).toContain('</osmChange>');
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

      window.Blob = vi.fn(() => mockBlob) as any;
      window.URL.createObjectURL = vi.fn(() => mockUrl);
      window.URL.revokeObjectURL = vi.fn();
      window.document.createElement = vi.fn(() => mockLink) as any;
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