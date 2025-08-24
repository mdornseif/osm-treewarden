import { TreePatch } from '../types';
import { Tree } from '../types';

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
  
  console.log('🛠️ Generated OSM XML:', xml);
  return xml;
}

// Generate OSM upload data from patches and trees
export function generateOSMUploadData(patches: Record<number, TreePatch>, trees: Tree[]): ChangesetData | null {
  console.log('🔍 generateOSMUploadData called with:', { patches, treesCount: trees.length });
  
  if (Object.keys(patches).length === 0) {
    console.warn('No changes to upload. Please make some changes first.');
    return null;
  }

  // Generate OSM API changeset data
  const changesetData = {
    changeset: {
      tag: [
        { k: 'created_by', v: 'TreeWarden' },
        { k: 'comment', v: 'Tree data updates via TreeWarden application' },
        { k: 'source', v: 'TreeWarden web application' }
      ]
    },
    create: [],
    modify: [] as Array<{
      id: number;
      lat: number;
      lon: number;
      version: number;
      tag: Array<{ k: string; v: string }>;
    }>,
    delete: []
  };

  // Create a Map for O(1) tree lookup if trees are available
  const treeMap = new Map();
  if (trees.length > 0) {
    trees.forEach(tree => treeMap.set(tree.id, tree));
    console.log('🔍 Tree map created with', treeMap.size, 'trees');
  } else {
    console.log('🔍 No trees available, will use patch data only');
  }

  // Process each tree in the patches
  const missingVersions: number[] = [];
  
  Object.values(patches).forEach(patch => {
    console.log('🔍 Processing patch for tree ID:', patch.osmId);
    const tree = treeMap.get(patch.osmId);
    
    const hasChanges = Object.keys(patch.changes).length > 0;
    console.log('🔍 Has changes:', hasChanges, 'Changes:', patch.changes);

    if (hasChanges) {
      // Create a Map for O(1) tag lookup and merging
      const tagMap = new Map<string, string>();
      
      if (tree) {
        console.log('🔍 Found tree:', tree);
        
        // For modified nodes, we must have the version from the server
        if (!tree.version) {
          console.error(`❌ Missing version for node ${patch.osmId}. Cannot upload modifications without version.`);
          missingVersions.push(patch.osmId);
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
        changesetData.modify.push(modifiedNode);
      } else {
        console.log('🔍 Tree not found, using patch data only');
        
        // Fallback: use only patch data (similar to OsmChange generation)
        // Note: This won't have coordinates, but it will show the changes
        const patchTags = Object.entries(patch.changes).map(([k, v]) => ({ k, v }));
        
        const modifiedNode = {
          id: patch.osmId,
          lat: 0, // Placeholder - would need tree data for real coordinates
          lon: 0, // Placeholder - would need tree data for real coordinates
          version: patch.version,
          tag: patchTags
        };

        console.log('🔍 Adding modified node (patch only):', modifiedNode);
        changesetData.modify.push(modifiedNode);
      }
    }
  });

  // Check if any nodes are missing versions
  if (missingVersions.length > 0) {
    const nodeList = missingVersions.join(', ');
    console.error(`Cannot upload changes for nodes: ${nodeList}\n\nMissing version information. Please reload the tree data and try again.`);
    return null;
  }

  console.log('📝 Generated OSM Changeset Data:', changesetData);
  return changesetData;
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