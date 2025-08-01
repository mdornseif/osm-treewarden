import { describe, it, expect, beforeEach, vi } from 'vitest';
import { convertPatchesToOsmChange, downloadOsmChangeFile } from '../osmChangeUtils';
import { TreePatch, Tree } from '../../types';

// Mock the download function
const mockDownload = vi.fn();
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: mockDownload,
  })),
  writable: true,
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
  writable: true,
});

describe('osmChangeUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertPatchesToOsmChange', () => {
    it('should convert patches to OsmChange XML format', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 2,
          changes: {
            genus: 'Quercus',
            species: 'Quercus robur'
          }
        },
        67890: {
          osmId: 67890,
          version: 1,
          changes: {
            height: '25',
            circumference: '3.2'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12345,
          lat: 50.123,
          lon: 7.456,
          type: 'node',
          properties: {}
        },
        {
          id: 67890,
          lat: 50.789,
          lon: 7.012,
          type: 'node',
          properties: {}
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osmChange version="0.6" generator="OSM Tree Warden">');
      expect(result).toContain('<modify>');
      expect(result).toContain('<node id="12345" changeset="1" version="2" lat="50.123" lon="7.456">');
      expect(result).toContain('<tag k="genus" v="Quercus"/>');
      expect(result).toContain('<tag k="species" v="Quercus robur"/>');
      expect(result).toContain('<node id="67890" changeset="1" version="1" lat="50.789" lon="7.012">');
      expect(result).toContain('<tag k="height" v="25"/>');
      expect(result).toContain('<tag k="circumference" v="3.2"/>');
      expect(result).toContain('</modify>');
      expect(result).toContain('</osmChange>');
    });

    it('should handle empty patches', () => {
      const patches: Record<number, TreePatch> = {};
      const trees: Tree[] = [];

      const result = convertPatchesToOsmChange(patches, trees);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osmChange version="0.6" generator="OSM Tree Warden">');
      expect(result).toContain('</osmChange>');
      expect(result).not.toContain('<modify>');
    });

    it('should handle patches with missing trees', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 2,
          changes: {
            genus: 'Quercus'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 67890, // Different ID
          lat: 50.789,
          lon: 7.012,
          type: 'node',
          properties: {}
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osmChange version="0.6" generator="OSM Tree Warden">');
      expect(result).toContain('</osmChange>');
      expect(result).not.toContain('<node id="12345"');
    });

    it('should escape XML special characters in tag values', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 1,
          changes: {
            note: 'Tree with & special <characters> and "quotes"'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12345,
          lat: 50.123,
          lon: 7.456,
          type: 'node',
          properties: {}
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees);

      expect(result).toContain('<tag k="note" v="Tree with &amp; special &lt;characters&gt; and &quot;quotes&quot;"/>');
    });

    it('should use custom changeset ID', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 1,
          changes: {
            genus: 'Quercus'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12345,
          lat: 50.123,
          lon: 7.456,
          type: 'node',
          properties: {}
        }
      ];

      const result = convertPatchesToOsmChange(patches, trees, 999);

      expect(result).toContain('<node id="12345" changeset="999" version="1" lat="50.123" lon="7.456">');
    });
  });

  describe('downloadOsmChangeFile', () => {
    it('should trigger file download with correct content and filename', () => {
      const content = '<?xml version="1.0"?><osmChange>test</osmChange>';
      const filename = 'test-change.osc';

      downloadOsmChangeFile(content, filename);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockDownload).toHaveBeenCalled();
    });

    it('should use default filename when not provided', () => {
      const content = '<?xml version="1.0"?><osmChange>test</osmChange>';

      downloadOsmChangeFile(content);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockDownload).toHaveBeenCalled();
    });
  });
}); 