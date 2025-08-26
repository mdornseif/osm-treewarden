import { TreePatch, Tree } from '../types';
import { APP_CONFIG } from '../config';

export interface OsmChangeNode {
  id: number;
  changeset: number;
  version: number;
  lat: number;
  lon: number;
  tag: Array<{ k: string; v: string }>;
}

export interface OsmChangeDocument {
  osmChange: {
    version: string;
    generator: string;
    modify: OsmChangeNode[];
  };
}

export function parseOsmChangeFile(content: string): Record<number, TreePatch> {
  const patches: Record<number, TreePatch> = {};
  
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.getElementsByTagName('parsererror');
    if (parseError.length > 0) {
      throw new Error('Invalid XML format');
    }
    
    // Find all modify nodes
    const modifyNodes = xmlDoc.querySelectorAll('modify node');
    
    modifyNodes.forEach((nodeElement) => {
      const id = parseInt(nodeElement.getAttribute('id') || '0');
      const version = parseInt(nodeElement.getAttribute('version') || '1');
      
      if (id > 0) {
        // Extract all tags
        const changes: Record<string, string> = {};
        const tagElements = nodeElement.querySelectorAll('tag');
        
        tagElements.forEach((tagElement) => {
          const key = tagElement.getAttribute('k');
          const value = tagElement.getAttribute('v');
          if (key && value !== null) {
            changes[key] = value;
          }
        });
        
        // Create patch
        patches[id] = {
          osmId: id,
          version: version,
          changes: changes
        };
      }
    });
    
  } catch (error) {
    console.error('Error parsing OsmChange file:', error);
    throw new Error(`Failed to parse OsmChange file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return patches;
}

export function convertPatchesToOsmChange(
  patches: Record<number, TreePatch>, 
  trees: Tree[],
  changesetId: number = 1
): string {
  console.log('🔍 convertPatchesToOsmChange called with:');
  console.log('🔍 patches:', patches);
  console.log('🔍 patches keys:', Object.keys(patches));
  console.log('🔍 trees count:', trees.length);
  console.log('🔍 changesetId:', changesetId);
  
  const modifyNodes: OsmChangeNode[] = [];
  const missingTrees: number[] = [];
  
  Object.values(patches).forEach(patch => {
    console.log('🔍 Processing patch:', patch);
    // Find the corresponding tree to get coordinates
    const tree = trees.find(t => t.id === patch.osmId);
    console.log('🔍 Found tree for patch:', tree);
    
    if (!tree) {
      console.warn(`⚠️ Patch for OSM ID ${patch.osmId} does not have a corresponding tree entry. This patch will be skipped.`);
      missingTrees.push(patch.osmId);
      return;
    }

    console.log('🔍 Tree found, creating modify node...');
    console.log('🔍 Tree coordinates:', { lat: tree.lat, lon: tree.lon });
    console.log('🔍 Tree version:', tree.version);
    console.log('🔍 Patch changes:', patch.changes);
      
    const tags = Object.entries(patch.changes).map(([k, v]) => ({ k, v }));
    
    const node: OsmChangeNode = {
      id: patch.osmId,
      changeset: changesetId,
      version: patch.version,
      lat: tree.lat,
      lon: tree.lon,
      tag: tags
    };
    
    modifyNodes.push(node);
  });
  
  // Log summary of missing trees
  if (missingTrees.length > 0) {
    console.warn(`⚠️ WARNING: ${missingTrees.length} patches were skipped due to missing tree data:`, missingTrees);
    console.warn(`⚠️ These patches cannot be safely converted to OsmChange format without coordinates.`);
  }
  
  const osmChangeDoc: OsmChangeDocument = {
    osmChange: {
      version: "0.6",
      generator: APP_CONFIG.NAME,
      modify: modifyNodes
    }
  };
  
  return formatOsmChangeXml(osmChangeDoc);
}

function formatOsmChangeXml(doc: OsmChangeDocument): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<osmChange version="${doc.osmChange.version}" generator="${doc.osmChange.generator}">\n`;
  
  if (doc.osmChange.modify.length > 0) {
    xml += '  <modify>\n';
    doc.osmChange.modify.forEach(node => {
      xml += `    <node id="${node.id}" changeset="${node.changeset}" version="${node.version}" lat="${node.lat}" lon="${node.lon}">\n`;
      node.tag.forEach(tag => {
        xml += `      <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
      });
      xml += '    </node>\n';
    });
    xml += '  </modify>\n';
  }
  
  xml += '</osmChange>';
  return xml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function downloadOsmChangeFile(content: string, filename: string = 'osm-change.osc'): void {
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 