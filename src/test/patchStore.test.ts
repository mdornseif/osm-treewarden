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
        userId: undefined,
        username: undefined
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

    it('should merge changes when adding multiple patches for the same OSM ID', () => {
      const osmId = 12345;
      
      // First patch
      addPatch(osmId, 1, { species: 'Oak' });
      
      // Second patch - should merge with first
      addPatch(osmId, 1, { height: '15m' });
      
      const patch = patches.get()[osmId];
      expect(patch.changes).toEqual({
        species: 'Oak',
        height: '15m'
      });
      expect(patchCount.get()).toBe(1);
    });
  });

  describe('updatePatch', () => {
    it('should update existing patch', () => {
      const osmId = 12345;
      addPatch(osmId, 1, { species: 'Oak' });
      
      updatePatch(osmId, { height: '15m' });

      const updatedPatch = patches.get()[osmId];
      expect(updatedPatch.changes).toEqual({
        species: 'Oak',
        height: '15m'
      });
    });

    it('should not update non-existent patch', () => {
      const osmId = 99999;
      updatePatch(osmId, { height: '15m' });
      
      expect(patches.get()[osmId]).toBeUndefined();
    });
  });

  describe('removePatch', () => {
    it('should remove existing patch', () => {
      const osmId = 12345;
      addPatch(osmId, 1, { species: 'Oak' });
      
      removePatch(osmId);

      expect(patches.get()[osmId]).toBeUndefined();
      expect(patchCount.get()).toBe(0);
      expect(hasPatches.get()).toBe(false);
    });

    it('should not affect non-existent patch', () => {
      const osmId = 99999;
      removePatch(osmId);
      
      expect(patchCount.get()).toBe(0);
    });
  });

  describe('moveToPending', () => {
    it('should move patch from main store to pending', () => {
      const osmId = 12345;
      addPatch(osmId, 1, { species: 'Oak' });
      
      moveToPending(osmId);

      expect(patches.get()[osmId]).toBeUndefined();
      expect(pendingPatches.get()[osmId]).toBeDefined();
      expect(patchCount.get()).toBe(0);
      expect(pendingPatchCount.get()).toBe(1);
      expect(hasPatches.get()).toBe(false);
      expect(hasPendingPatches.get()).toBe(true);
    });

    it('should not move non-existent patch', () => {
      const osmId = 99999;
      moveToPending(osmId);
      
      expect(pendingPatchCount.get()).toBe(0);
    });
  });

  describe('applyPatch', () => {
    it('should move patch from pending to applied', () => {
      const osmId = 12345;
      addPatch(osmId, 1, { species: 'Oak' });
      moveToPending(osmId);
      
      applyPatch(osmId);

      expect(pendingPatches.get()[osmId]).toBeUndefined();
      expect(appliedPatches.get()[osmId]).toBeDefined();
      expect(pendingPatchCount.get()).toBe(0);
      expect(appliedPatchCount.get()).toBe(1);
      expect(hasPendingPatches.get()).toBe(false);
    });

    it('should not apply non-existent pending patch', () => {
      const osmId = 99999;
      applyPatch(osmId);
      
      expect(appliedPatchCount.get()).toBe(0);
    });
  });

  describe('clear functions', () => {
    it('should clear all patches', () => {
      addPatch(1, 1, { species: 'Oak' });
      addPatch(2, 1, { species: 'Maple' });
      moveToPending(1);
      applyPatch(1);
      
      clearAllPatches();

      expect(patchCount.get()).toBe(0);
      expect(pendingPatchCount.get()).toBe(0);
      expect(appliedPatchCount.get()).toBe(0);
    });

    it('should clear only pending patches', () => {
      addPatch(1, 1, { species: 'Oak' });
      moveToPending(1);
      addPatch(2, 1, { species: 'Maple' });
      
      clearPendingPatches();

      expect(patchCount.get()).toBe(1);
      expect(pendingPatchCount.get()).toBe(0);
    });

    it('should clear only applied patches', () => {
      addPatch(1, 1, { species: 'Oak' });
      moveToPending(1);
      applyPatch(1);
      
      clearAppliedPatches();

      expect(appliedPatchCount.get()).toBe(0);
    });
  });

  describe('utility functions', () => {
    it('should get patch by OSM ID', () => {
      const osmId = 12345;
      addPatch(osmId, 1, { species: 'Oak' });
      
      const patch = getPatchByOsmId(osmId);
      expect(patch).toBeDefined();
      expect(patch?.osmId).toBe(osmId);
    });

    it('should check if patch exists for OSM ID', () => {
      const osmId = 12345;
      expect(hasPatchForOsmId(osmId)).toBe(false);
      
      addPatch(osmId, 1, { species: 'Oak' });
      expect(hasPatchForOsmId(osmId)).toBe(true);
    });

    it('should get all patches as array', () => {
      addPatch(1, 1, { species: 'Oak' });
      addPatch(2, 1, { species: 'Maple' });
      
      const allPatches = getAllPatches();
      expect(allPatches).toHaveLength(2);
      expect(allPatches.map(p => p.osmId)).toEqual([1, 2]);
    });
  });

  describe('computed values', () => {
    it('should update computed values correctly', () => {
      expect(patchCount.get()).toBe(0);
      expect(hasPatches.get()).toBe(false);
      
      addPatch(1, 1, { species: 'Oak' });
      
      expect(patchCount.get()).toBe(1);
      expect(hasPatches.get()).toBe(true);
    });
  });
});