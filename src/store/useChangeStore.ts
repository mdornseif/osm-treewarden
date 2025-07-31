import { useStore } from '@nanostores/react';
import {
  changes,
  pendingChanges,
  appliedChanges,
  changeCount,
  pendingChangeCount,
  appliedChangeCount,
  hasChanges,
  hasPendingChanges,
  addChange,
  updateChange,
  removeChange,
  moveToPending,
  applyChange,
  clearAllChanges,
  clearPendingChanges,
  clearAppliedChanges,
  getChangeByOsmId,
  getPendingChangeByOsmId,
  getAppliedChangeByOsmId,
  getAllChanges,
  getAllPendingChanges,
  getAllAppliedChanges,
  hasChangeForOsmId,
  hasPendingChangeForOsmId,
  hasAppliedChangeForOsmId
} from './changeStore';
import { TreeChange } from '../types';

export function useChangeStore() {
  const changesState = useStore(changes);
  const pendingChangesState = useStore(pendingChanges);
  const appliedChangesState = useStore(appliedChanges);
  const changeCountValue = useStore(changeCount);
  const pendingChangeCountValue = useStore(pendingChangeCount);
  const appliedChangeCountValue = useStore(appliedChangeCount);
  const hasChangesValue = useStore(hasChanges);
  const hasPendingChangesValue = useStore(hasPendingChanges);

  return {
    // State
    changes: changesState,
    pendingChanges: pendingChangesState,
    appliedChanges: appliedChangesState,
    
    // Computed values
    changeCount: changeCountValue,
    pendingChangeCount: pendingChangeCountValue,
    appliedChangeCount: appliedChangeCountValue,
    hasChanges: hasChangesValue,
    hasPendingChanges: hasPendingChangesValue,
    
    // Actions
    addChange,
    updateChange,
    removeChange,
    moveToPending,
    applyChange,
    clearAllChanges,
    clearPendingChanges,
    clearAppliedChanges,
    
    // Utility functions
    getChangeByOsmId,
    getPendingChangeByOsmId,
    getAppliedChangeByOsmId,
    getAllChanges,
    getAllPendingChanges,
    getAllAppliedChanges,
    hasChangeForOsmId,
    hasPendingChangeForOsmId,
    hasAppliedChangeForOsmId
  };
}

// Hook for specific change by OSM ID
export function useChangeByOsmId(osmId: number) {
  const changesState = useStore(changes);
  const pendingChangesState = useStore(pendingChanges);
  const appliedChangesState = useStore(appliedChanges);
  
  const change = changesState[osmId];
  const pendingChange = pendingChangesState[osmId];
  const appliedChange = appliedChangesState[osmId];
  
  return {
    change,
    pendingChange,
    appliedChange,
    hasChange: !!change,
    hasPendingChange: !!pendingChange,
    hasAppliedChange: !!appliedChange
  };
}

// Hook for change statistics
export function useChangeStats() {
  const changeCountValue = useStore(changeCount);
  const pendingChangeCountValue = useStore(pendingChangeCount);
  const appliedChangeCountValue = useStore(appliedChangeCount);
  const hasChangesValue = useStore(hasChanges);
  const hasPendingChangesValue = useStore(hasPendingChanges);
  
  return {
    totalChanges: changeCountValue,
    pendingChanges: pendingChangeCountValue,
    appliedChanges: appliedChangeCountValue,
    hasChanges: hasChangesValue,
    hasPendingChanges: hasPendingChangesValue
  };
}