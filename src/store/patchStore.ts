import { atom, computed } from 'nanostores';
import { TreePatch } from '../types';

// Store state - using OSM ID as key
export const patches = atom<Record<number, TreePatch>>({});
export const pendingPatches = atom<Record<number, TreePatch>>({});
export const appliedPatches = atom<Record<number, TreePatch>>({});

// Computed values
export const patchCount = computed(patches, (patches) => Object.keys(patches).length);
export const pendingPatchCount = computed(pendingPatches, (pendingPatches) => Object.keys(pendingPatches).length);
export const appliedPatchCount = computed(appliedPatches, (appliedPatches) => Object.keys(appliedPatches).length);
export const hasPatches = computed(patches, (patches) => Object.keys(patches).length > 0);
export const hasPendingPatches = computed(pendingPatches, (pendingPatches) => Object.keys(pendingPatches).length > 0);

// Actions
export function addPatch(osmId: number, version: number, patchData: Record<string, string>, timestamp?: string, userId?: number, username?: string): void {
  const newPatch: TreePatch = {
    osmId,
    version,
    changes: patchData,
    timestamp: timestamp || new Date().toISOString(),
    userId,
    username
  };

  const currentPatches = patches.get();
  currentPatches[osmId] = newPatch;
  patches.set({ ...currentPatches });

  console.log(`Added patch for OSM ID ${osmId}, version ${version}:`, patchData);
}

export function updatePatch(osmId: number, newChanges: Record<string, string>): void {
  const currentPatches = patches.get();
  const existingPatch = currentPatches[osmId];
  
  if (existingPatch) {
    const updatedPatch: TreePatch = {
      ...existingPatch,
      changes: { ...existingPatch.changes, ...newChanges },
      timestamp: new Date().toISOString()
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
  console.log('Cleared all patches');
}

export function clearPendingPatches(): void {
  pendingPatches.set({});
  console.log('Cleared pending patches');
}

export function clearAppliedPatches(): void {
  appliedPatches.set({});
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