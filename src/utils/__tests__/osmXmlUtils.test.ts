import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateOSMXML, generateOSMUploadData, downloadOSMXMLFile } from '../osmXmlUtils';
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

describe('osmXmlUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateOSMUploadData', () => {
    it('should generate OSM upload data with tree information', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 2,
          changes: {
            genus: 'Quercus',
            species: 'Quercus robur'
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12345,
          lat: 50.123,
          lon: 7.456,
          version: 2,
          type: 'node',
          properties: {
            existing_tag: 'existing_value'
          }
        }
      ];

      const result = generateOSMUploadData(patches, trees);

      expect(result).toBeDefined();
      expect(result?.changeset.tag).toEqual([
        { k: 'created_by', v: 'TreeWarden' },
        { k: 'comment', v: 'Tree data updates via TreeWarden application' },
        { k: 'source', v: 'TreeWarden web application' }
      ]);
      expect(result?.modify).toHaveLength(1);
      expect(result?.modify[0]).toEqual({
        id: 12345,
        lat: 50.123,
        lon: 7.456,
        version: 2,
        tag: [
          { k: 'existing_tag', v: 'existing_value' },
          { k: 'genus', v: 'Quercus' },
          { k: 'species', v: 'Quercus robur' }
        ]
      });
    });

    it('should generate OSM upload data with patch data only when trees are missing', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 2,
          changes: {
            genus: 'Quercus',
            species: 'Quercus robur'
          }
        }
      };

      const trees: Tree[] = [];

      // Should throw an error when no trees are available
      expect(() => generateOSMUploadData(patches, trees)).toThrow(
        'Cannot upload patches without tree data - this would cause data loss in OSM'
      );
    });

    it('should handle empty patches', () => {
      const patches: Record<number, TreePatch> = {};
      const trees: Tree[] = [];

      const result = generateOSMUploadData(patches, trees);

      expect(result).toBeNull();
    });

    it('should handle patches with missing tree versions', () => {
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
          id: 12345,
          lat: 50.123,
          lon: 7.456,
          // Missing version
          type: 'node',
          properties: {}
        }
      ];

      const result = generateOSMUploadData(patches, trees);

      expect(result).toBeNull();
    });

    it('should merge existing properties with patch changes', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 2,
          changes: {
            genus: 'Quercus', // This will override existing
            species: 'Quercus robur' // This is new
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12345,
          lat: 50.123,
          lon: 7.456,
          version: 2,
          type: 'node',
          properties: {
            genus: 'OldGenus', // Will be overridden
            height: '25' // Will be preserved
          }
        }
      ];

      const result = generateOSMUploadData(patches, trees);

      expect(result?.modify[0].tag).toEqual([
        { k: 'genus', v: 'Quercus' }, // Overridden
        { k: 'height', v: '25' }, // Preserved
        { k: 'species', v: 'Quercus robur' } // New
      ]);
    });

    it('should filter out empty tag values', () => {
      const patches: Record<number, TreePatch> = {
        12345: {
          osmId: 12345,
          version: 2,
          changes: {
            genus: 'Quercus',
            species: '', // Empty value
            height: '   ' // Whitespace only
          }
        }
      };

      const trees: Tree[] = [
        {
          id: 12345,
          lat: 50.123,
          lon: 7.456,
          version: 2,
          type: 'node',
          properties: {
            existing: 'value',
            empty: '' // Empty existing value
          }
        }
      ];

      const result = generateOSMUploadData(patches, trees);

      expect(result?.modify[0].tag).toEqual([
        { k: 'existing', v: 'value' },
        { k: 'genus', v: 'Quercus' }
        // Empty values are filtered out
      ]);
    });
  });

  describe('generateOSMXML', () => {
    it('should generate changeset XML when changesetId is null', () => {
      const changesetData = {
        changeset: {
          tag: [
            { k: 'created_by', v: 'TreeWarden' },
            { k: 'comment', v: 'Test changes' }
          ]
        },
        modify: [
          {
            id: 12345,
            lat: 50.123,
            lon: 7.456,
            version: 2,
            tag: [
              { k: 'genus', v: 'Quercus' },
              { k: 'species', v: 'Quercus robur' }
            ]
          }
        ]
      };

      const result = generateOSMXML(changesetData, null);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osm version="0.6" generator="TreeWarden">');
      expect(result).toContain('<changeset>');
      expect(result).toContain('<tag k="created_by" v="TreeWarden"/>');
      expect(result).toContain('<tag k="comment" v="Test changes"/>');
      expect(result).toContain('</changeset>');
      expect(result).toContain('</osm>');
      // Changeset creation XML should NOT contain node elements
      expect(result).not.toContain('<node');
    });

    it('should generate changes XML when changesetId is provided', () => {
      const changesetData = {
        changeset: {
          tag: [
            { k: 'created_by', v: 'TreeWarden' }
          ]
        },
        modify: [
          {
            id: 12345,
            lat: 50.123,
            lon: 7.456,
            version: 2,
            tag: [
              { k: 'genus', v: 'Quercus' }
            ]
          }
        ]
      };

      const result = generateOSMXML(changesetData, '999');

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osmChange version="0.6" generator="TreeWarden">');
      expect(result).toContain('<modify>');
      expect(result).toContain('<node id="12345" lat="50.123" lon="7.456" version="2" changeset="999">');
      expect(result).toContain('<tag k="genus" v="Quercus"/>');
      expect(result).toContain('</modify>');
      expect(result).toContain('</osmChange>');
    });

    it('should handle empty modify array', () => {
      const changesetData = {
        changeset: {
          tag: [
            { k: 'created_by', v: 'TreeWarden' }
          ]
        },
        modify: []
      };

      const result = generateOSMXML(changesetData, null);

      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<osm version="0.6" generator="TreeWarden">');
      expect(result).toContain('<changeset>');
      expect(result).toContain('</changeset>');
      expect(result).toContain('</osm>');
      expect(result).not.toContain('<node');
    });

    it('should escape XML special characters', () => {
      const changesetData = {
        changeset: {
          tag: [
            { k: 'comment', v: 'Test with & < > " \' characters' }
          ]
        },
        modify: [
          {
            id: 12345,
            lat: 50.123,
            lon: 7.456,
            version: 2,
            tag: [
              { k: 'note', v: 'Tree with & special <characters> and "quotes"' }
            ]
          }
        ]
      };

      // Test changeset creation XML (should only escape changeset tags)
      const changesetResult = generateOSMXML(changesetData, null);
      expect(changesetResult).toContain('<tag k="comment" v="Test with &amp; &lt; &gt; &quot; &#39; characters"/>');
      expect(changesetResult).not.toContain('<node'); // No nodes in changeset creation

      // Test changes XML (should escape node tags)
      const changesResult = generateOSMXML(changesetData, '999');
      expect(changesResult).toContain('<tag k="note" v="Tree with &amp; special &lt;characters&gt; and &quot;quotes&quot;"/>');
    });
  });

  describe('downloadOSMXMLFile', () => {
    it('should trigger file download with correct content and filename', () => {
      const content = '<?xml version="1.0"?><osm>test</osm>';
      const filename = 'test-api.xml';

      downloadOSMXMLFile(content, filename);

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockDownload).toHaveBeenCalled();
    });
  });
}); 