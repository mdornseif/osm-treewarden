import { useStore } from '@nanostores/react';
import {
  patches,
  pendingPatches,
  appliedPatches,
  patchCount,
  pendingPatchCount,
  appliedPatchCount,
  hasPatches,
  hasPendingPatches,
  addPatch,
  updatePatch,
  removePatch,
  moveToPending,
  applyPatch,
  clearAllPatches,
  clearPendingPatches,
  clearAppliedPatches,
  getPatchByOsmId,
  getPendingPatchByOsmId,
  getAppliedPatchByOsmId,
  getAllPatches,
  getAllPendingPatches,
  getAllAppliedPatches,
  hasPatchForOsmId,
  hasPendingPatchForOsmId,
  hasAppliedPatchForOsmId
} from './patchStore';


export function usePatchStore() {
  const patchesState = useStore(patches);
  const pendingPatchesState = useStore(pendingPatches);
  const appliedPatchesState = useStore(appliedPatches);
  const patchCountValue = useStore(patchCount);
  const pendingPatchCountValue = useStore(pendingPatchCount);
  const appliedPatchCountValue = useStore(appliedPatchCount);
  const hasPatchesValue = useStore(hasPatches);
  const hasPendingPatchesValue = useStore(hasPendingPatches);

  return {
    // State
    patches: patchesState,
    pendingPatches: pendingPatchesState,
    appliedPatches: appliedPatchesState,
    
    // Computed values
    patchCount: patchCountValue,
    pendingPatchCount: pendingPatchCountValue,
    appliedPatchCount: appliedPatchCountValue,
    hasPatches: hasPatchesValue,
    hasPendingPatches: hasPendingPatchesValue,
    
    // Actions
    addPatch,
    updatePatch,
    removePatch,
    moveToPending,
    applyPatch,
    clearAllPatches,
    clearPendingPatches,
    clearAppliedPatches,
    
    // Utility functions
    getPatchByOsmId,
    getPendingPatchByOsmId,
    getAppliedPatchByOsmId,
    getAllPatches,
    getAllPendingPatches,
    getAllAppliedPatches,
    hasPatchForOsmId,
    hasPendingPatchForOsmId,
    hasAppliedPatchForOsmId
  };
}

// Hook for specific patch by OSM ID
export function usePatchByOsmId(osmId: number) {
  const patchesState = useStore(patches);
  const pendingPatchesState = useStore(pendingPatches);
  const appliedPatchesState = useStore(appliedPatches);
  
  const patch = patchesState[osmId];
  const pendingPatch = pendingPatchesState[osmId];
  const appliedPatch = appliedPatchesState[osmId];
  
  return {
    patch,
    pendingPatch,
    appliedPatch,
    hasPatch: !!patch,
    hasPendingPatch: !!pendingPatch,
    hasAppliedPatch: !!appliedPatch
  };
}

// Hook for patch statistics
export function usePatchStats() {
  const patchCountValue = useStore(patchCount);
  const pendingPatchCountValue = useStore(pendingPatchCount);
  const appliedPatchCountValue = useStore(appliedPatchCount);
  const hasPatchesValue = useStore(hasPatches);
  const hasPendingPatchesValue = useStore(hasPendingPatches);
  
  return {
    totalPatches: patchCountValue,
    pendingPatches: pendingPatchCountValue,
    appliedPatches: appliedPatchCountValue,
    hasPatches: hasPatchesValue,
    hasPendingPatches: hasPendingPatchesValue
  };
}