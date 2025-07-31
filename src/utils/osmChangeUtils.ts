import { TreePatch, Tree } from '../types';

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

export function convertPatchesToOsmChange(
  patches: Record<number, TreePatch>, 
  trees: Tree[],
  changesetId: number = 1
): string {
  const modifyNodes: OsmChangeNode[] = [];
  
  Object.values(patches).forEach(patch => {
    // Find the corresponding tree to get coordinates
    const tree = trees.find(t => t.id === patch.osmId);
    
    if (tree) {
      // Convert changes object to tag array
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
    }
  });
  
  const osmChangeDoc: OsmChangeDocument = {
    osmChange: {
      version: "0.6",
      generator: "OSM Tree Warden",
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