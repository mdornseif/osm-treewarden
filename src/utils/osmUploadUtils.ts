import { TreePatch, Tree } from '../types';
import { generateOSMXML, generateOSMUploadData } from './osmXmlUtils';

export interface UploadProgress {
  stage: 'creating-changeset' | 'uploading-changes' | 'closing-changeset' | 'complete' | 'error';
  message: string;
  changesetId?: string;
  error?: string;
  uploadResult?: string;
}

export async function uploadToOSM(
  patches: Record<number, TreePatch>,
  trees: Tree[],
  osmAuthInstance: any,
  onProgress?: (progress: UploadProgress) => void
): Promise<void> {
  try {
    // Step 1: Generate upload data
    onProgress?.({ stage: 'creating-changeset', message: 'Generating upload data...' });
    
    const uploadData = generateOSMUploadData(patches, trees);
    if (!uploadData) {
      throw new Error('No changes to upload. Please make some changes first.');
    }

    // Step 2: Create changeset
    onProgress?.({ stage: 'creating-changeset', message: 'Creating changeset...' });
    
    const changesetXml = generateOSMXML(uploadData, null);
    console.log('📤 Starting changeset creation with osm-auth fetch...');
    
    const changesetResponse = await osmAuthInstance.fetch('https://api.openstreetmap.org/api/0.6/changeset/create', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: changesetXml
    });
    
    if (!changesetResponse.ok) {
      const responseText = await changesetResponse.text();
      const errorDetails = `HTTP ${changesetResponse.status} ${changesetResponse.statusText}: ${responseText}`;
      console.error('❌ Changeset creation failed:', errorDetails);
      throw new Error(errorDetails);
    }
    
    const changesetId = await changesetResponse.text();
    console.log('🆔 Changeset-ID erhalten:', changesetId);
    
    onProgress?.({ 
      stage: 'uploading-changes', 
      message: 'Uploading changes...', 
      changesetId 
    });

    // Step 3: Upload changes
    const changesXml = generateOSMXML(uploadData, changesetId);
    console.log('📤 Uploading changes to changeset', changesetId);
    
    const uploadResponse = await osmAuthInstance.fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml'
      },
      body: changesXml
    });
    
    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      const errorDetails = `HTTP ${uploadResponse.status} ${uploadResponse.statusText}: ${responseText}`;
      console.error('❌ Upload failed:', errorDetails);
      throw new Error(errorDetails);
    }
    
    const uploadResult = await uploadResponse.text();
    console.log('✅ Upload successful:', uploadResult);
    
    // Step 4: Close changeset
    onProgress?.({ 
      stage: 'closing-changeset', 
      message: 'Closing changeset...', 
      changesetId,
      uploadResult 
    });
    
    const closeResponse = await osmAuthInstance.fetch(`https://api.openstreetmap.org/api/0.6/changeset/${changesetId}/close`, {
      method: 'PUT'
    });
    
    if (!closeResponse.ok) {
      const responseText = await closeResponse.text();
      const errorDetails = `HTTP ${closeResponse.status} ${closeResponse.statusText}: ${responseText}`;
      console.error('❌ Changeset close failed:', errorDetails);
      throw new Error(errorDetails);
    }
    
    console.log('✅ Changeset closed successfully');
    
    onProgress?.({ 
      stage: 'complete', 
      message: `Upload completed successfully! Changeset: ${changesetId}`, 
      changesetId,
      uploadResult 
    });
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    onProgress?.({ 
      stage: 'error', 
      message: error instanceof Error ? error.message : 'Upload failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
} 