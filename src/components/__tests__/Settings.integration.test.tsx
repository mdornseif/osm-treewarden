import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../Settings';
import { trees } from '../../store/treeStore';
import { patches } from '../../store/patchStore';
import { clearTrees } from '../../store/treeStore';
import { clearAllPatches } from '../../store/patchStore';

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

describe('Settings Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    
    // Reset stores to initial state
    trees.set([]);
    patches.set({});
  });

  it('should display real-time tree count from store', async () => {
    render(<Settings />);
    
    // Initially should show 0 for both counts
    const treeValues = screen.getAllByText('0');
    expect(treeValues).toHaveLength(2);
    
    // Add some trees to the store
    const mockTrees = [
      { id: 1, lat: 50.0, lon: 7.0, properties: {} },
      { id: 2, lat: 50.1, lon: 7.1, properties: {} },
    ];
    trees.set(mockTrees);
    
    // Should update to show 2 for tree count
    await waitFor(() => {
      const treeCountElement = screen.getByText('Bäume im Speicher:').nextElementSibling;
      expect(treeCountElement).toHaveTextContent('2');
    });
  });

  it('should display real-time patch count from store', async () => {
    render(<Settings />);
    
    // Initially should show 0 for both counts
    const patchValues = screen.getAllByText('0');
    expect(patchValues).toHaveLength(2);
    
    // Add some patches to the store
    const mockPatches = {
      1: { osmId: 1, version: 1, changes: {} },
      2: { osmId: 2, version: 1, changes: {} },
      3: { osmId: 3, version: 1, changes: {} },
    };
    patches.set(mockPatches);
    
    // Should update to show 3 for patch count
    await waitFor(() => {
      const patchCountElement = screen.getByText('Änderungen im Patch-Speicher:').nextElementSibling;
      expect(patchCountElement).toHaveTextContent('3');
    });
  });

  it('should enable clear buttons when stores have data', async () => {
    // Add data to stores
    trees.set([{ id: 1, lat: 50.0, lon: 7.0, properties: {} }]);
    patches.set({ 1: { osmId: 1, version: 1, changes: {} } });
    
    render(<Settings />);
    
    await waitFor(() => {
      const clearTreeButton = screen.getByText('Baum-Speicher löschen');
      const clearPatchButton = screen.getByText('Patch-Speicher löschen');
      
      expect(clearTreeButton).not.toBeDisabled();
      expect(clearPatchButton).not.toBeDisabled();
    });
  });

  it('should disable clear buttons when stores are empty', async () => {
    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    
    expect(clearTreeButton).toBeDisabled();
    expect(clearPatchButton).toBeDisabled();
  });

  it('should clear tree store when button is clicked and confirmed', async () => {
    // Add trees to store
    const mockTrees = [
      { id: 1, lat: 50.0, lon: 7.0, properties: {} },
      { id: 2, lat: 50.1, lon: 7.1, properties: {} },
    ];
    trees.set(mockTrees);
    
    render(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    fireEvent.click(clearTreeButton);
    
    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith('Sind Sie sicher, dass Sie alle Bäume löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.');
    
    // Should clear the store
    await waitFor(() => {
      const treeCountElement = screen.getByText('Bäume im Speicher:').nextElementSibling;
      expect(treeCountElement).toHaveTextContent('0');
    });
    
    // Verify store is actually cleared
    expect(trees.get()).toEqual([]);
  });

  it('should clear patch store when button is clicked and confirmed', async () => {
    // Add patches to store
    const mockPatches = {
      1: { osmId: 1, version: 1, changes: {} },
      2: { osmId: 2, version: 1, changes: {} },
    };
    patches.set(mockPatches);
    
    render(<Settings />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
    
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    fireEvent.click(clearPatchButton);
    
    // Should show confirmation dialog
    expect(mockConfirm).toHaveBeenCalledWith('Sind Sie sicher, dass Sie alle Änderungen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.');
    
    // Should clear the store
    await waitFor(() => {
      const patchCountElement = screen.getByText('Änderungen im Patch-Speicher:').nextElementSibling;
      expect(patchCountElement).toHaveTextContent('0');
    });
    
    // Verify store is actually cleared
    expect(patches.get()).toEqual({});
  });

  it('should not clear stores when confirmation is rejected', async () => {
    // Add data to stores
    const mockTrees = [{ id: 1, lat: 50.0, lon: 7.0, properties: {} }];
    const mockPatches = { 1: { osmId: 1, version: 1, changes: {} } };
    
    trees.set(mockTrees);
    patches.set(mockPatches);
    mockConfirm.mockReturnValue(false);
    
    render(<Settings />);
    
    await waitFor(() => {
      const treeCountElement = screen.getByText('Bäume im Speicher:').nextElementSibling;
      expect(treeCountElement).toHaveTextContent('1');
    });
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    fireEvent.click(clearTreeButton);
    
    // Should not clear the store
    await waitFor(() => {
      const treeCountElement = screen.getByText('Bäume im Speicher:').nextElementSibling;
      expect(treeCountElement).toHaveTextContent('1');
    });
    
    // Verify store is not cleared
    expect(trees.get()).toEqual(mockTrees);
  });

  it('should update counts when stores change externally', async () => {
    render(<Settings />);
    
    // Initially should show 0 for both counts
    const initialValues = screen.getAllByText('0');
    expect(initialValues).toHaveLength(2);
    
    // Simulate external store updates
    trees.set([{ id: 1, lat: 50.0, lon: 7.0, properties: {} }]);
    patches.set({ 1: { osmId: 1, version: 1, changes: {} } });
    
    // Should update to show 1 for both
    await waitFor(() => {
      const treeCountElement = screen.getByText('Bäume im Speicher:').nextElementSibling;
      const patchCountElement = screen.getByText('Änderungen im Patch-Speicher:').nextElementSibling;
      expect(treeCountElement).toHaveTextContent('1');
      expect(patchCountElement).toHaveTextContent('1');
    });
  });

  it('should handle rapid store updates correctly', async () => {
    render(<Settings />);
    
    // Rapid store updates
    trees.set([{ id: 1, lat: 50.0, lon: 7.0, properties: {} }]);
    trees.set([{ id: 1, lat: 50.0, lon: 7.0, properties: {} }, { id: 2, lat: 50.1, lon: 7.1, properties: {} }]);
    trees.set([]);
    
    await waitFor(() => {
      const treeCountElement = screen.getByText('Bäume im Speicher:').nextElementSibling;
      expect(treeCountElement).toHaveTextContent('0');
    });
  });

  it('should maintain button states correctly during store updates', async () => {
    render(<Settings />);
    
    // Initially buttons should be disabled
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    expect(clearTreeButton).toBeDisabled();
    expect(clearPatchButton).toBeDisabled();
    
    // Add data to stores
    trees.set([{ id: 1, lat: 50.0, lon: 7.0, properties: {} }]);
    patches.set({ 1: { osmId: 1, version: 1, changes: {} } });
    
    // Buttons should become enabled
    await waitFor(() => {
      expect(clearTreeButton).not.toBeDisabled();
      expect(clearPatchButton).not.toBeDisabled();
    });
    
    // Clear stores
    trees.set([]);
    patches.set({});
    
    // Buttons should become disabled again
    await waitFor(() => {
      expect(clearTreeButton).toBeDisabled();
      expect(clearPatchButton).toBeDisabled();
    });
  });
});