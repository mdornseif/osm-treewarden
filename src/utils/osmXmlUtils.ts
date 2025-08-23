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
export function generateOSMXML(uploadData: any): string {
  console.log('🔍 generateOSMXML called with:', uploadData);
  
  if (!uploadData || !uploadData.changeset) {
    console.error('❌ Invalid upload data - missing changeset');
    throw new Error('Invalid upload data: missing changeset');
  }

  console.log('🔍 Generating XML for changeset and modify nodes...');
  console.log('🔍 Changeset tags:', uploadData.changeset.tag);
  console.log('🔍 Modify nodes count:', uploadData.modify?.length || 0);
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<osm version="0.6" generator="TreeWarden">\n';
  
  // Add changeset
  xml += '  <changeset>\n';
  uploadData.changeset.tag.forEach((tag: any) => {
    xml += `    <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
  });
  xml += '  </changeset>\n';
  
  // Add modify nodes
  if (uploadData.modify && uploadData.modify.length > 0) {
    console.log('🔍 Adding modify nodes to XML...');
    uploadData.modify.forEach((node: any) => {
      console.log('🔍 Processing modify node:', node);
      xml += `  <node id="${node.id}" version="${node.version}" lat="${node.lat}" lon="${node.lon}">\n`;
      node.tag.forEach((tag: any) => {
        xml += `    <tag k="${escapeXml(tag.k)}" v="${escapeXml(tag.v)}"/>\n`;
      });
      xml += '  </node>\n';
    });
  } else {
    console.warn('⚠️ No modify nodes to add to XML');
  }
  
  xml += '</osm>';
  console.log('🔍 Generated XML length:', xml.length);
  console.log('🔍 Generated XML preview:', xml.substring(0, 500) + '...');
  
  return xml;
}

// Generate OSM upload data from patches and trees
export function generateOSMUploadData(patches: Record<number, TreePatch>, trees: Tree[]): any | null {
  console.log('🔍 generateOSMUploadData called with:', { patches, treesCount: trees.length });
  console.log('🔍 patches keys:', Object.keys(patches));
  console.log('🔍 patches values:', Object.values(patches));
  console.log('🔍 trees sample:', trees.slice(0, 2));
  
  if (Object.keys(patches).length === 0) {
    console.warn('No changes to upload. Please make some changes first.');
    return null;
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
      
      if (tree) {
        console.log('🔍 Found tree:', tree);
        
        // For modified nodes, we must have the version from the server
        if (!tree.version) {
          console.error(`❌ Missing version for node ${patch.osmId}. Cannot upload modifications without version.`);
          // missingVersions.push(patch.osmId); // This line was removed from the new_code, so it's removed here.
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
      } else {
        console.error(`❌ CRITICAL ERROR: Patch for tree ID ${patch.osmId} has no corresponding tree data!`);
        console.error(`❌ This will cause data loss - the patch cannot be safely uploaded.`);
        // missingTrees.push(patch.osmId); // This line was removed from the new_code, so it's removed here.
        return;
      }
    }
  });

  // Check if any nodes are missing versions
  // if (missingVersions.length > 0) { // This block was removed from the new_code, so it's removed here.
  //   const nodeList = missingVersions.join(', ');
  //   console.error(`Cannot upload changes for nodes: ${nodeList}\n\nMissing version information. Please reload the tree data and try again.`);
  //   return null;
  // }

  // Check if any patches are missing corresponding trees
  // if (missingTrees.length > 0) { // This block was removed from the new_code, so it's removed here.
  //   const nodeList = missingTrees.join(', ');
  //   console.error(`❌ CRITICAL ERROR: Cannot upload patches for nodes: ${nodeList}`);
  //   console.error(`❌ These patches have no corresponding tree data and would cause data loss.`);
  //   console.error(`❌ Please reload the tree data and try again.`);
  //   return null;
  // }

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