import { TreePatch, Tree } from '../types';
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
  version?: number;
  tag: OSMTag[];
}

interface ChangesetData {
  changeset?: {
    tag: { k: string; v: string }[];
  };
  create?: OSMNode[];
  modify: OSMNode[];
}

export function generateOSMXML(changesetData: ChangesetData, changesetId: string | null = null): string {
  console.log('🛠️ generateOSMXML called with changesetId:', changesetId, 'and data:', changesetData);
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  
  if (changesetId) {
    // Generate changes XML for uploading to an existing changeset
    xml += '<osmChange version="0.6" generator="TreeWarden">\n';
    
    // Handle create operations for new trees
    if (changesetData.create && changesetData.create.length > 0) {
      xml += '  <create>\n';
      changesetData.create.forEach((node: OSMNode) => {
        xml += `    <node id="${node.id}" lat="${node.lat}" lon="${node.lon}" changeset="${changesetId}">\n`;
        node.tag.forEach((tag: OSMTag) => {
          xml += `      <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
        });
        xml += '    </node>\n';
      });
      xml += '  </create>\n';
    }
    
    // Handle modify operations for existing trees
    if (changesetData.modify.length > 0) {
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
    // Generate changeset creation XML (should only contain changeset metadata, no nodes)
    xml += '<osm version="0.6" generator="TreeWarden">\n';
    xml += '  <changeset>\n';
    changesetData.changeset?.tag.forEach((tag: { k: string; v: string }) => {
      xml += `    <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
    });
    xml += '  </changeset>\n';
    xml += '</osm>';
  }
  
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
  const uploadData: ChangesetData = {
    changeset: {
      tag: [
        { k: 'created_by', v: APP_CONFIG.CHANGESET_TAGS.created_by },
        { k: 'comment', v: APP_CONFIG.CHANGESET_TAGS.comment },
        { k: 'source', v: APP_CONFIG.CHANGESET_TAGS.source }
      ]
    },
    create: [],
    modify: []
  };

  let hasValidPatches = false;
  let hasMissingVersions = false;
  const missingTreeIds: number[] = [];

  Object.values(patches).forEach(patch => {
    console.log('🔍 Processing patch:', patch);
    const tree = trees.find(t => t.id === patch.osmId);
    console.log('🔍 Found tree for patch:', tree);
    
    if (!tree) {
      console.warn(`⚠️ Patch for OSM ID ${patch.osmId} does not have a corresponding tree entry. This patch will be skipped.`);
      missingTreeIds.push(patch.osmId);
      return;
    }

    const hasChanges = Object.keys(patch.changes).length > 0;
    console.log('🔍 Has changes:', hasChanges, 'Changes:', patch.changes);

    if (hasChanges) {
      // Create a Map for O(1) tag lookup and merging
      const tagMap = new Map<string, string>();
      
      // Check if this is a new tree (negative ID)
      const isNewTree = patch.osmId < 0;
      console.log('🔍 Is new tree:', isNewTree, 'ID:', patch.osmId);
      
      if (isNewTree) {
        // Handle new tree creation
        console.log('🔍 Creating new tree node...');
        console.log('🔍 Tree coordinates:', { lat: tree.lat, lon: tree.lon });
        console.log('🔍 Patch changes:', patch.changes);

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

        // Add or update properties from patch
        console.log('🔍 Adding patch changes:', patch.changes);
        Object.keys(patch.changes).forEach(key => {
          const value = patch.changes[key];
          if (value && value.trim() !== '') {
            tagMap.set(key, value);
          }
        });

        console.log('🔍 Final tag map for new tree:', Array.from(tagMap.entries()));

        // Create new node data (no version needed for new nodes)
        const newNode: OSMNode = {
          id: patch.osmId, // Negative ID will be replaced by OSM server
          lat: tree.lat,
          lon: tree.lon,
          tag: Array.from(tagMap.entries()).map(([k, v]) => ({ k, v }))
        };

        console.log('🔍 Adding new node:', newNode);
        uploadData.create!.push(newNode);
        hasValidPatches = true;
      } else {
        // Handle existing tree modification
        console.log('🔍 Modifying existing tree node...');
        console.log('🔍 Tree coordinates:', { lat: tree.lat, lon: tree.lon });
        console.log('🔍 Patch version:', patch.version);
        console.log('🔍 Patch changes:', patch.changes);
        
        // For modified nodes, we must have the version from the patch
        if (!patch.version) {
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

        console.log('🔍 Final tag map for modified tree:', Array.from(tagMap.entries()));

        // Create modified node data with complete information
        const modifiedNode: OSMNode = {
          id: patch.osmId,
          lat: tree.lat,
          lon: tree.lon,
          version: patch.version!, // We validated this exists above
          tag: Array.from(tagMap.entries()).map(([k, v]) => ({ k, v }))
        };

        console.log('🔍 Adding modified node:', modifiedNode);
        uploadData.modify.push(modifiedNode);
        hasValidPatches = true;
      }
    }
  });

  // If we have missing versions, return null
  if (hasMissingVersions) {
    return null;
  }

  // If we have no valid patches to upload, return null with helpful error message
  if (!hasValidPatches) {
    if (missingTreeIds.length > 0) {
      const missingIdsStr = missingTreeIds.slice(0, 5).join(', ') + (missingTreeIds.length > 5 ? ` und ${missingTreeIds.length - 5} weitere` : '');
      throw new Error(`Keine gültigen Änderungen zum Hochladen gefunden. Die Bäume für die Patches (OSM-IDs: ${missingIdsStr}) sind nicht im aktuellen Kartenbereich geladen. Bitte navigieren Sie zu dem Bereich, in dem sich diese Bäume befinden, oder laden Sie die Bäume neu.`);
    }
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