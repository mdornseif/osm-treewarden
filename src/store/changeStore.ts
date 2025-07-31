import { atom, computed } from 'nanostores';
import { TreeChange } from '../types';

// Store state - using OSM ID as key
export const changes = atom<Record<number, TreeChange>>({});
export const pendingChanges = atom<Record<number, TreeChange>>({});
export const appliedChanges = atom<Record<number, TreeChange>>({});

// Computed values
export const changeCount = computed(changes, (changes) => Object.keys(changes).length);
export const pendingChangeCount = computed(pendingChanges, (pendingChanges) => Object.keys(pendingChanges).length);
export const appliedChangeCount = computed(appliedChanges, (appliedChanges) => Object.keys(appliedChanges).length);
export const hasChanges = computed(changes, (changes) => Object.keys(changes).length > 0);
export const hasPendingChanges = computed(pendingChanges, (pendingChanges) => Object.keys(pendingChanges).length > 0);

// Actions
export function addChange(osmId: number, version: number, changeData: Record<string, string>, timestamp?: string, userId?: number, username?: string): void {
  const newChange: TreeChange = {
    osmId,
    version,
    changes: changeData,
    timestamp: timestamp || new Date().toISOString(),
    userId,
    username
  };

  const currentChanges = changes.get();
  currentChanges[osmId] = newChange;
  changes.set({ ...currentChanges });

  console.log(`Added change for OSM ID ${osmId}, version ${version}:`, changeData);
}

export function updateChange(osmId: number, newChanges: Record<string, string>): void {
  const currentChanges = changes.get();
  const existingChange = currentChanges[osmId];
  
  if (existingChange) {
    const updatedChange: TreeChange = {
      ...existingChange,
      changes: { ...existingChange.changes, ...newChanges },
      timestamp: new Date().toISOString()
    };
    
    currentChanges[osmId] = updatedChange;
    changes.set({ ...currentChanges });
    
    console.log(`Updated change for OSM ID ${osmId}:`, newChanges);
  }
}

export function removeChange(osmId: number): void {
  const currentChanges = changes.get();
  if (currentChanges[osmId]) {
    delete currentChanges[osmId];
    changes.set({ ...currentChanges });
    
    console.log(`Removed change for OSM ID ${osmId}`);
  }
}

export function moveToPending(osmId: number): void {
  const currentChanges = changes.get();
  const currentPending = pendingChanges.get();
  
  const change = currentChanges[osmId];
  if (change) {
    // Remove from main changes
    delete currentChanges[osmId];
    changes.set({ ...currentChanges });
    
    // Add to pending changes
    currentPending[osmId] = change;
    pendingChanges.set({ ...currentPending });
    
    console.log(`Moved change for OSM ID ${osmId} to pending`);
  }
}

export function applyChange(osmId: number): void {
  const currentPending = pendingChanges.get();
  const currentApplied = appliedChanges.get();
  
  const change = currentPending[osmId];
  if (change) {
    // Remove from pending
    delete currentPending[osmId];
    pendingChanges.set({ ...currentPending });
    
    // Add to applied
    currentApplied[osmId] = change;
    appliedChanges.set({ ...currentApplied });
    
    console.log(`Applied change for OSM ID ${osmId}`);
  }
}

export function clearAllChanges(): void {
  changes.set({});
  pendingChanges.set({});
  appliedChanges.set({});
  console.log('Cleared all changes');
}

export function clearPendingChanges(): void {
  pendingChanges.set({});
  console.log('Cleared pending changes');
}

export function clearAppliedChanges(): void {
  appliedChanges.set({});
  console.log('Cleared applied changes');
}

// Utility functions
export function getChangeByOsmId(osmId: number): TreeChange | undefined {
  return changes.get()[osmId];
}

export function getPendingChangeByOsmId(osmId: number): TreeChange | undefined {
  return pendingChanges.get()[osmId];
}

export function getAppliedChangeByOsmId(osmId: number): TreeChange | undefined {
  return appliedChanges.get()[osmId];
}

export function getAllChanges(): TreeChange[] {
  return Object.values(changes.get());
}

export function getAllPendingChanges(): TreeChange[] {
  return Object.values(pendingChanges.get());
}

export function getAllAppliedChanges(): TreeChange[] {
  return Object.values(appliedChanges.get());
}

export function hasChangeForOsmId(osmId: number): boolean {
  return osmId in changes.get();
}

export function hasPendingChangeForOsmId(osmId: number): boolean {
  return osmId in pendingChanges.get();
}

export function hasAppliedChangeForOsmId(osmId: number): boolean {
  return osmId in appliedChanges.get();
}