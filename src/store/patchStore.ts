import { atom, computed } from 'nanostores';
import { TreePatch, Tree } from '../types';
import { parseOsmChangeFile } from '../utils/osmChangeUtils';

// localStorage keys
const PATCHES_STORAGE_KEY = 'osm-treewarden-patches';
const PENDING_PATCHES_STORAGE_KEY = 'osm-treewarden-pending-patches';
const APPLIED_PATCHES_STORAGE_KEY = 'osm-treewarden-applied-patches';

// Store state - using OSM ID as key
export const patches = atom<Record<number, TreePatch>>({});
export const pendingPatches = atom<Record<number, TreePatch>>({});
export const appliedPatches = atom<Record<number, TreePatch>>({});

// localStorage persistence functions
function saveToLocalStorage(key: string, data: Record<number, TreePatch>): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save to localStorage (${key}):`, error);
  }
}

function loadFromLocalStorage(key: string): Record<number, TreePatch> | null {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn(`Failed to load from localStorage (${key}):`, error);
    return null;
  }
}

// Initialize stores from localStorage
function initializeStores(): void {
  const storedPatches = loadFromLocalStorage(PATCHES_STORAGE_KEY);
  const storedPendingPatches = loadFromLocalStorage(PENDING_PATCHES_STORAGE_KEY);
  const storedAppliedPatches = loadFromLocalStorage(APPLIED_PATCHES_STORAGE_KEY);

  // Only set if we have actual data (not null and not empty object)
  if (storedPatches && Object.keys(storedPatches).length > 0) {
    patches.set(storedPatches);
  }
  if (storedPendingPatches && Object.keys(storedPendingPatches).length > 0) {
    pendingPatches.set(storedPendingPatches);
  }
  if (storedAppliedPatches && Object.keys(storedAppliedPatches).length > 0) {
    appliedPatches.set(storedAppliedPatches);
  }
}

// Set up automatic saving when stores change
// Use a flag to prevent saving during initialization
let isInitialized = false;

patches.subscribe((patches) => {
  if (isInitialized) {
    saveToLocalStorage(PATCHES_STORAGE_KEY, patches);
  }
});

pendingPatches.subscribe((pendingPatches) => {
  if (isInitialized) {
    saveToLocalStorage(PENDING_PATCHES_STORAGE_KEY, pendingPatches);
  }
});

appliedPatches.subscribe((appliedPatches) => {
  if (isInitialized) {
    saveToLocalStorage(APPLIED_PATCHES_STORAGE_KEY, appliedPatches);
  }
});

// Initialize stores on module load
initializeStores();
// Mark as initialized after loading from localStorage
isInitialized = true;

// Computed values
export const patchCount = computed(patches, (patches) => Object.keys(patches).length);
export const pendingPatchCount = computed(pendingPatches, (pendingPatches) => Object.keys(pendingPatches).length);
export const appliedPatchCount = computed(appliedPatches, (appliedPatches) => Object.keys(appliedPatches).length);
export const hasPatches = computed(patches, (patches) => Object.keys(patches).length > 0);
export const hasPendingPatches = computed(pendingPatches, (pendingPatches) => Object.keys(pendingPatches).length > 0);

/**
 * Applies any existing patches from the patchStore to a tree
 * Returns a new tree object with patched properties if changes exist
 */
export function getPatchedTree(tree: Tree): Tree {
  const patch = getPatchByOsmId(tree.id);
  
  if (!patch) {
    return tree; // No patches exist, return original tree
  }
  
  // Create a new tree object with patched properties
  const patchedTree: Tree = {
    ...tree,
    properties: {
      ...tree.properties,
      ...patch.changes
    }
  };
  
  return patchedTree;
}

// Actions
export function addPatch(osmId: number, version: number, patchData: Record<string, string>, userId?: number, username?: string): void {
  const currentPatches = patches.get();
  const existingPatch = currentPatches[osmId];
  
  if (existingPatch) {
    // Merge with existing patch
    const updatedPatch: TreePatch = {
      ...existingPatch,
      changes: { ...existingPatch.changes, ...patchData }
    };
    
    currentPatches[osmId] = updatedPatch;
    patches.set({ ...currentPatches });
    
    console.log(`Updated patch for OSM ID ${osmId}, version ${version}:`, patchData);
  } else {
    // Create new patch
    const newPatch: TreePatch = {
      osmId,
      version,
      changes: patchData,
      userId,
      username
    };

    currentPatches[osmId] = newPatch;
    patches.set({ ...currentPatches });

    console.log(`Added new patch for OSM ID ${osmId}, version ${version}:`, patchData);
  }
}

export function updatePatch(osmId: number, newChanges: Record<string, string>): void {
  const currentPatches = patches.get();
  const existingPatch = currentPatches[osmId];
  
  if (existingPatch) {
    const updatedPatch: TreePatch = {
      ...existingPatch,
      changes: { ...existingPatch.changes, ...newChanges }
    };
    
    currentPatches[osmId] = updatedPatch;
    patches.set({ ...currentPatches });
    
    console.log(`Updated patch for OSM ID ${osmId}:`, newChanges);
  }
}

export function removePatch(osmId: number): void {
  const currentPatches = patches.get();
  if (currentPatches[osmId]) {
    delete currentPatches[osmId];
    patches.set({ ...currentPatches });
    
    console.log(`Removed patch for OSM ID ${osmId}`);
  }
}

export function moveToPending(osmId: number): void {
  const currentPatches = patches.get();
  const currentPending = pendingPatches.get();
  
  const patch = currentPatches[osmId];
  if (patch) {
    // Remove from main patches
    delete currentPatches[osmId];
    patches.set({ ...currentPatches });
    
    // Add to pending patches
    currentPending[osmId] = patch;
    pendingPatches.set({ ...currentPending });
    
    console.log(`Moved patch for OSM ID ${osmId} to pending`);
  }
}

export function applyPatch(osmId: number): void {
  const currentPending = pendingPatches.get();
  const currentApplied = appliedPatches.get();
  
  const patch = currentPending[osmId];
  if (patch) {
    // Remove from pending
    delete currentPending[osmId];
    pendingPatches.set({ ...currentPending });
    
    // Add to applied
    currentApplied[osmId] = patch;
    appliedPatches.set({ ...currentApplied });
    
    console.log(`Applied patch for OSM ID ${osmId}`);
  }
}

export function clearAllPatches(): void {
  patches.set({});
  pendingPatches.set({});
  appliedPatches.set({});
  
  // Also clear localStorage
  try {
    localStorage.removeItem(PATCHES_STORAGE_KEY);
    localStorage.removeItem(PENDING_PATCHES_STORAGE_KEY);
    localStorage.removeItem(APPLIED_PATCHES_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
  
  console.log('Cleared all patches');
}

export function clearPendingPatches(): void {
  pendingPatches.set({});
  
  // Also clear localStorage
  try {
    localStorage.removeItem(PENDING_PATCHES_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear pending patches from localStorage:', error);
  }
  
  console.log('Cleared pending patches');
}

export function clearAppliedPatches(): void {
  appliedPatches.set({});
  
  // Also clear localStorage
  try {
    localStorage.removeItem(APPLIED_PATCHES_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear applied patches from localStorage:', error);
  }
  
  console.log('Cleared applied patches');
}

// Utility functions
export function getPatchByOsmId(osmId: number): TreePatch | undefined {
  return patches.get()[osmId];
}

export function getPendingPatchByOsmId(osmId: number): TreePatch | undefined {
  return pendingPatches.get()[osmId];
}

export function getAppliedPatchByOsmId(osmId: number): TreePatch | undefined {
  return appliedPatches.get()[osmId];
}

export function getAllPatches(): TreePatch[] {
  return Object.values(patches.get());
}

export function getAllPendingPatches(): TreePatch[] {
  return Object.values(pendingPatches.get());
}

export function getAllAppliedPatches(): TreePatch[] {
  return Object.values(appliedPatches.get());
}

export function hasPatchForOsmId(osmId: number): boolean {
  return osmId in patches.get();
}

export function hasPendingPatchForOsmId(osmId: number): boolean {
  return osmId in pendingPatches.get();
}

export function hasAppliedPatchForOsmId(osmId: number): boolean {
  return osmId in appliedPatches.get();
}

// Debug and utility functions
export function debugLocalStorage(): void {
  console.log('=== PatchStore localStorage Debug ===');
  console.log('Patches:', loadFromLocalStorage(PATCHES_STORAGE_KEY));
  console.log('Pending Patches:', loadFromLocalStorage(PENDING_PATCHES_STORAGE_KEY));
  console.log('Applied Patches:', loadFromLocalStorage(APPLIED_PATCHES_STORAGE_KEY));
  console.log('Current Store State:');
  console.log('- Patches:', patches.get());
  console.log('- Pending Patches:', pendingPatches.get());
  console.log('- Applied Patches:', appliedPatches.get());
}

export function exportPatchesToJSON(): string {
  const allData = {
    patches: patches.get(),
    pendingPatches: pendingPatches.get(),
    appliedPatches: appliedPatches.get(),
    exportTimestamp: new Date().toISOString()
  };
  return JSON.stringify(allData, null, 2);
}

export function importPatchesFromJSON(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.patches) {
      patches.set(data.patches);
    }
    if (data.pendingPatches) {
      pendingPatches.set(data.pendingPatches);
    }
    if (data.appliedPatches) {
      appliedPatches.set(data.appliedPatches);
    }
    
    console.log('Successfully imported patches from JSON');
    return true;
  } catch (error) {
    console.error('Failed to import patches from JSON:', error);
    return false;
  }
}

export function loadPatchesFromOsmChange(osmChangeContent: string): boolean {
  try {
    const newPatches = parseOsmChangeFile(osmChangeContent);
    
    // Merge with existing patches
    const currentPatches = patches.get();
    const mergedPatches = { ...currentPatches, ...newPatches };
    
    patches.set(mergedPatches);
    
    console.log(`Successfully loaded ${Object.keys(newPatches).length} patches from OsmChange`);
    return true;
  } catch (error) {
    console.error('Failed to load patches from OsmChange:', error);
    return false;
  }
}