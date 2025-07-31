import { describe, it, expect, beforeEach } from 'vitest';
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
} from '../store/patchStore';

describe('Patch Store', () => {
  beforeEach(() => {
    // Clear all stores before each test
    clearAllPatches();
  });

  describe('Initial State', () => {
    it('should start with empty stores', () => {
      expect(patches.get()).toEqual({});
      expect(pendingPatches.get()).toEqual({});
      expect(appliedPatches.get()).toEqual({});
      expect(patchCount.get()).toBe(0);
      expect(pendingPatchCount.get()).toBe(0);
      expect(appliedPatchCount.get()).toBe(0);
      expect(hasPatches.get()).toBe(false);
      expect(hasPendingPatches.get()).toBe(false);
    });
  });

  describe('addPatch', () => {
    it('should add a patch with OSM ID as key', () => {
      const osmId = 12345;
      const version = 1;
      const patchData = { species: 'Oak', height: '10m' };

      addPatch(osmId, version, patchData);

      expect(patches.get()[osmId]).toEqual({
        osmId,
        version,
        changes: patchData,
        timestamp: expect.any(String)
      });
      expect(patchCount.get()).toBe(1);
      expect(hasPatches.get()).toBe(true);
    });

    it('should add multiple patches with different OSM IDs', () => {
      addPatch(1, 1, { species: 'Oak' });
      addPatch(2, 1, { species: 'Maple' });

      expect(Object.keys(patches.get())).toHaveLength(2);
      expect(patchCount.get()).toBe(2);
    });
  });

  describe('updateChange', () => {
    it('should update existing change', () => {
      const osmId = 12345;
      addChange(osmId, 1, { species: 'Oak' });
      
      updateChange(osmId, { height: '15m' });

      const updatedChange = changes.get()[osmId];
      expect(updatedChange.changes).toEqual({
        species: 'Oak',
        height: '15m'
      });
    });

    it('should not update non-existent change', () => {
      const osmId = 99999;
      updateChange(osmId, { height: '15m' });
      
      expect(changes.get()[osmId]).toBeUndefined();
    });
  });

  describe('removeChange', () => {
    it('should remove existing change', () => {
      const osmId = 12345;
      addChange(osmId, 1, { species: 'Oak' });
      
      removeChange(osmId);

      expect(changes.get()[osmId]).toBeUndefined();
      expect(changeCount.get()).toBe(0);
      expect(hasChanges.get()).toBe(false);
    });

    it('should not affect non-existent change', () => {
      const osmId = 99999;
      removeChange(osmId);
      
      expect(changeCount.get()).toBe(0);
    });
  });

  describe('moveToPending', () => {
    it('should move change from main store to pending', () => {
      const osmId = 12345;
      addChange(osmId, 1, { species: 'Oak' });
      
      moveToPending(osmId);

      expect(changes.get()[osmId]).toBeUndefined();
      expect(pendingChanges.get()[osmId]).toBeDefined();
      expect(changeCount.get()).toBe(0);
      expect(pendingChangeCount.get()).toBe(1);
      expect(hasChanges.get()).toBe(false);
      expect(hasPendingChanges.get()).toBe(true);
    });

    it('should not move non-existent change', () => {
      const osmId = 99999;
      moveToPending(osmId);
      
      expect(pendingChangeCount.get()).toBe(0);
    });
  });

  describe('applyChange', () => {
    it('should move change from pending to applied', () => {
      const osmId = 12345;
      addChange(osmId, 1, { species: 'Oak' });
      moveToPending(osmId);
      
      applyChange(osmId);

      expect(pendingChanges.get()[osmId]).toBeUndefined();
      expect(appliedChanges.get()[osmId]).toBeDefined();
      expect(pendingChangeCount.get()).toBe(0);
      expect(appliedChangeCount.get()).toBe(1);
      expect(hasPendingChanges.get()).toBe(false);
    });

    it('should not apply non-existent pending change', () => {
      const osmId = 99999;
      applyChange(osmId);
      
      expect(appliedChangeCount.get()).toBe(0);
    });
  });

  describe('clear functions', () => {
    it('should clear all changes', () => {
      addChange(1, 1, { species: 'Oak' });
      addChange(2, 1, { species: 'Maple' });
      moveToPending(1);
      applyChange(1);
      
      clearAllChanges();

      expect(changeCount.get()).toBe(0);
      expect(pendingChangeCount.get()).toBe(0);
      expect(appliedChangeCount.get()).toBe(0);
    });

    it('should clear only pending changes', () => {
      addChange(1, 1, { species: 'Oak' });
      moveToPending(1);
      addChange(2, 1, { species: 'Maple' });
      
      clearPendingChanges();

      expect(changeCount.get()).toBe(1);
      expect(pendingChangeCount.get()).toBe(0);
    });

    it('should clear only applied changes', () => {
      addChange(1, 1, { species: 'Oak' });
      moveToPending(1);
      applyChange(1);
      
      clearAppliedChanges();

      expect(appliedChangeCount.get()).toBe(0);
    });
  });

  describe('utility functions', () => {
    it('should get change by OSM ID', () => {
      const osmId = 12345;
      addChange(osmId, 1, { species: 'Oak' });
      
      const change = getChangeByOsmId(osmId);
      expect(change).toBeDefined();
      expect(change?.osmId).toBe(osmId);
    });

    it('should check if change exists for OSM ID', () => {
      const osmId = 12345;
      expect(hasChangeForOsmId(osmId)).toBe(false);
      
      addChange(osmId, 1, { species: 'Oak' });
      expect(hasChangeForOsmId(osmId)).toBe(true);
    });

    it('should get all changes as array', () => {
      addChange(1, 1, { species: 'Oak' });
      addChange(2, 1, { species: 'Maple' });
      
      const allChanges = getAllChanges();
      expect(allChanges).toHaveLength(2);
      expect(allChanges.map(c => c.osmId)).toEqual([1, 2]);
    });
  });

  describe('computed values', () => {
    it('should update computed values correctly', () => {
      expect(changeCount.get()).toBe(0);
      expect(hasChanges.get()).toBe(false);
      
      addChange(1, 1, { species: 'Oak' });
      
      expect(changeCount.get()).toBe(1);
      expect(hasChanges.get()).toBe(true);
    });
  });
});