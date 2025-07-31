import { describe, it, expect, beforeEach } from 'vitest';
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
} from '../store/changeStore';

describe('Change Store', () => {
  beforeEach(() => {
    // Clear all stores before each test
    clearAllChanges();
  });

  describe('Initial State', () => {
    it('should start with empty stores', () => {
      expect(changes.get()).toEqual({});
      expect(pendingChanges.get()).toEqual({});
      expect(appliedChanges.get()).toEqual({});
      expect(changeCount.get()).toBe(0);
      expect(pendingChangeCount.get()).toBe(0);
      expect(appliedChangeCount.get()).toBe(0);
      expect(hasChanges.get()).toBe(false);
      expect(hasPendingChanges.get()).toBe(false);
    });
  });

  describe('addChange', () => {
    it('should add a change with OSM ID as key', () => {
      const osmId = 12345;
      const version = 1;
      const changeData = { species: 'Oak', height: '10m' };

      addChange(osmId, version, changeData);

      expect(changes.get()[osmId]).toEqual({
        osmId,
        version,
        changes: changeData,
        timestamp: expect.any(String)
      });
      expect(changeCount.get()).toBe(1);
      expect(hasChanges.get()).toBe(true);
    });

    it('should add multiple changes with different OSM IDs', () => {
      addChange(1, 1, { species: 'Oak' });
      addChange(2, 1, { species: 'Maple' });

      expect(Object.keys(changes.get())).toHaveLength(2);
      expect(changeCount.get()).toBe(2);
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