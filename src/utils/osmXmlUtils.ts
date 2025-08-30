import { TreePatch } from '../types';
import { Tree } from '../types';
import { APP_CONFIG } from '../config';

// Escape XML special characters
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Generate OSM XML for changeset or changes
interface OSMTag {
  k: string;
  v: string;
}

interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  version: number;
  tag: OSMTag[];
}

interface ChangesetData {
  changeset?: {
    tag: { k: string; v: string }[];
  };
  modify?: OSMNode[];
}

export function generateOSMXML(changesetData: ChangesetData, changesetId: string | null = null): string {
  console.log('🛠️ generateOSMXML called with changesetId:', changesetId, 'and data:', changesetData);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  if (changesetId) {
    // Generate changes XML
    xml += '<osmChange version="0.6" generator="TreeWarden">\n';
    
    if (changesetData.modify && changesetData.modify.length > 0) {
      xml += '  <modify>\n';
      changesetData.modify.forEach((node: OSMNode) => {
        xml += `    <node id="${node.id}" lat="${node.lat}" lon="${node.lon}" version="${node.version}" changeset="${changesetId}">\n`;
        node.tag.forEach((tag: OSMTag) => {
          xml += `      <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
        });
        xml += '    </node>\n';
      });
      xml += '  </modify>\n';
    }
    
    xml += '</osmChange>';
  } else {
    // Generate changeset XML with modify nodes
    xml += '<osm version="0.6" generator="TreeWarden">\n';
    xml += '  <changeset>\n';
    changesetData.changeset?.tag.forEach((tag: { k: string; v: string }) => {
      xml += `    <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
    });
    xml += '  </changeset>\n';
    
    // Include modify nodes in the changeset XML
    if (changesetData.modify && changesetData.modify.length > 0) {
      changesetData.modify.forEach((node: OSMNode) => {
        xml += `  <node id="${node.id}" lat="${node.lat}" lon="${node.lon}" version="${node.version}">\n`;
        node.tag.forEach((tag: OSMTag) => {
          xml += `    <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
        });
        xml += '  </node>\n';
      });
    }
    
    xml += '</osm>';
  }
  
  xml += '</osm>';
  console.log('🔍 Generated XML length:', xml.length);
  console.log('🔍 Generated XML preview:', xml.substring(0, 500) + '...');
  
  return xml;
}

// Generate OSM upload data from patches and trees
export function generateOSMUploadData(patches: Record<number, TreePatch>, trees: Tree[]): ChangesetData | null {
  console.log('🔍 generateOSMUploadData called with:', { patches, treesCount: trees.length });
  console.log('🔍 patches keys:', Object.keys(patches));
  console.log('🔍 patches values:', Object.values(patches));
  console.log('🔍 trees sample:', trees.slice(0, 2));
  
  if (Object.keys(patches).length === 0) {
    console.warn('No changes to upload. Please make some changes first.');
    return null;
  }

  // Check if we have any trees at all - if not, we can't safely upload patches
  if (trees.length === 0) {
    throw new Error('Cannot upload patches without tree data - this would cause data loss in OSM');
  }

  console.log('🔍 Processing patches...');
  const uploadData: any = {
    changeset: {
      tag: [
        { k: 'created_by', v: APP_CONFIG.CHANGESET_TAGS.created_by },
        { k: 'comment', v: APP_CONFIG.CHANGESET_TAGS.comment },
        { k: 'source', v: APP_CONFIG.CHANGESET_TAGS.source }
      ]
    },
    modify: []
  };

  let hasValidPatches = false;
  let hasMissingVersions = false;

  Object.values(patches).forEach(patch => {
    console.log('🔍 Processing patch:', patch);
    const tree = trees.find(t => t.id === patch.osmId);
    console.log('🔍 Found tree for patch:', tree);
    
    if (!tree) {
      console.warn(`⚠️ Patch for OSM ID ${patch.osmId} does not have a corresponding tree entry. This patch will be skipped.`);
      return;
    }

    console.log('🔍 Tree found, creating modify node...');
    console.log('🔍 Tree coordinates:', { lat: tree.lat, lon: tree.lon });
    console.log('🔍 Tree version:', tree.version);
    console.log('🔍 Patch changes:', patch.changes);

    const hasChanges = Object.keys(patch.changes).length > 0;
    console.log('🔍 Has changes:', hasChanges, 'Changes:', patch.changes);

    if (hasChanges) {
      // Create a Map for O(1) tag lookup and merging
      const tagMap = new Map<string, string>();
      
      console.log('🔍 Found tree:', tree);
      
      // For modified nodes, we must have the version from the server
      if (!tree.version) {
        console.error(`❌ Missing version for node ${patch.osmId}. Cannot upload modifications without version.`);
        hasMissingVersions = true;
        return;
      }

      // Add existing tags from tree properties
      if (tree.properties) {
        console.log('🔍 Adding existing properties:', tree.properties);
        Object.keys(tree.properties).forEach(key => {
          const value = tree.properties[key];
          if (value && value.trim() !== '') {
            tagMap.set(key, value);
          }
        });
      }

      // Add or update modified properties from patch
      console.log('🔍 Adding patch changes:', patch.changes);
      Object.keys(patch.changes).forEach(key => {
        const value = patch.changes[key];
        if (value && value.trim() !== '') {
          tagMap.set(key, value);
        }
      });

      console.log('🔍 Final tag map:', Array.from(tagMap.entries()));

      // Create modified node data with complete information
      const modifiedNode = {
        id: patch.osmId,
        lat: tree.lat,
        lon: tree.lon,
        version: tree.version,
        tag: Array.from(tagMap.entries()).map(([k, v]) => ({ k, v }))
      };

      console.log('🔍 Adding modified node:', modifiedNode);
      uploadData.modify.push(modifiedNode);
      hasValidPatches = true;
    }
  });

  // If we have missing versions, return null
  if (hasMissingVersions) {
    return null;
  }

  // If we have no valid patches to upload, return null
  if (!hasValidPatches) {
    return null;
  }

  console.log('📝 Generated OSM Changeset Data:', uploadData);
  return uploadData;
}

// Download OSM XML file
export function downloadOSMXMLFile(xmlContent: string, filename: string): void {
  const blob = new Blob([xmlContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 