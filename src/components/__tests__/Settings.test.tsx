import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../Settings';

// Type definitions for mock store returns
interface MockTreeStore {
  treeCount: number;
  clearTrees?: () => void;
}

interface MockPatchStore {
  patchCount: number;
  clearAllPatches?: () => void;
}
import { useTreeStore } from '../../store/useTreeStore';
import { usePatchStore } from '../../store/usePatchStore';
import { clearTrees } from '../../store/treeStore';
import { clearAllPatches } from '../../store/patchStore';

// Mock the store hooks
vi.mock('../../store/useTreeStore');
vi.mock('../../store/usePatchStore');
vi.mock('../../store/treeStore');
vi.mock('../../store/patchStore');

const mockUseTreeStore = vi.mocked(useTreeStore);
const mockUsePatchStore = vi.mocked(usePatchStore);
const mockClearTrees = vi.mocked(clearTrees);
const mockClearAllPatches = vi.mocked(clearAllPatches);

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('should render settings header', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    expect(screen.getByText('Einstellungen')).toBeInTheDocument();
  });

  it('should display store information section', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);

    render(<Settings />);
    
    expect(screen.getByText('Speicher-Informationen')).toBeInTheDocument();
    expect(screen.getByText('Bäume im Speicher:')).toBeInTheDocument();
    expect(screen.getByText('Änderungen im Patch-Speicher:')).toBeInTheDocument();
  });

  it('should display correct tree count', () => {
    const treeCount = 42;
    mockUseTreeStore.mockReturnValue({
      treeCount,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    expect(screen.getByText(treeCount.toString())).toBeInTheDocument();
  });

  it('should display correct patch count', () => {
    const patchCount = 17;
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount,
    } as MockTreeStore);

    render(<Settings />);
    
    expect(screen.getByText(patchCount.toString())).toBeInTheDocument();
  });

  it('should display store management section', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    expect(screen.getByText('Speicher-Verwaltung')).toBeInTheDocument();
  });

  it('should render clear tree store button', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    expect(screen.getByText('Baum-Speicher löschen')).toBeInTheDocument();
  });

  it('should render clear patch store button', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);

    render(<Settings />);
    
    expect(screen.getByText('Patch-Speicher löschen')).toBeInTheDocument();
  });

  it('should disable clear tree store button when tree count is 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    expect(clearTreeButton).toBeDisabled();
  });

  it('should disable clear patch store button when patch count is 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    expect(clearPatchButton).toBeDisabled();
  });

  it('should enable clear tree store button when tree count is greater than 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    expect(clearTreeButton).not.toBeDisabled();
  });

  it('should enable clear patch store button when patch count is greater than 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    expect(clearPatchButton).not.toBeDisabled();
  });

  it('should show confirmation dialog when clearing tree store', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    fireEvent.click(clearTreeButton);
    
    expect(mockConfirm).toHaveBeenCalledWith('Sind Sie sicher, dass Sie alle Bäume löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.');
  });

  it('should show confirmation dialog when clearing patch store', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    fireEvent.click(clearPatchButton);
    
    expect(mockConfirm).toHaveBeenCalledWith('Sind Sie sicher, dass Sie alle Änderungen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.');
  });

  it('should call clearTrees when confirmation is accepted', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);
    mockConfirm.mockReturnValue(true);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    fireEvent.click(clearTreeButton);
    
    expect(mockClearTrees).toHaveBeenCalled();
  });

  it('should call clearAllPatches when confirmation is accepted', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);
    mockConfirm.mockReturnValue(true);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    fireEvent.click(clearPatchButton);
    
    expect(mockClearAllPatches).toHaveBeenCalled();
  });

  it('should not call clearTrees when confirmation is rejected', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as MockPatchStore);
    mockConfirm.mockReturnValue(false);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    fireEvent.click(clearTreeButton);
    
    expect(mockClearTrees).not.toHaveBeenCalled();
  });

  it('should not call clearAllPatches when confirmation is rejected', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);
    mockConfirm.mockReturnValue(false);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    fireEvent.click(clearPatchButton);
    
    expect(mockClearAllPatches).not.toHaveBeenCalled();
  });

  it('should display both counts when both stores have data', () => {
    const treeCount = 10;
    const patchCount = 7;
    mockUseTreeStore.mockReturnValue({
      treeCount,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount,
    } as MockTreeStore);

    render(<Settings />);
    
    expect(screen.getByText(treeCount.toString())).toBeInTheDocument();
    expect(screen.getByText(patchCount.toString())).toBeInTheDocument();
    expect(screen.getByText('Baum-Speicher löschen')).not.toBeDisabled();
    expect(screen.getByText('Patch-Speicher löschen')).not.toBeDisabled();
  });

  it('should have correct CSS classes for store values', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);

    render(<Settings />);
    
    const treeValue = screen.getByText('5');
    const patchValue = screen.getByText('3');
    
    expect(treeValue).toHaveClass('_store-value_6d5d9b');
    expect(patchValue).toHaveClass('_store-value_6d5d9b');
  });

  it('should have correct CSS classes for clear buttons', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as MockTreeStore);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as MockTreeStore);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Baum-Speicher löschen');
    const clearPatchButton = screen.getByText('Patch-Speicher löschen');
    
    expect(clearTreeButton).toHaveClass('_clear-button_6d5d9b', '_clear-trees_6d5d9b');
    expect(clearPatchButton).toHaveClass('_clear-button_6d5d9b', '_clear-patches_6d5d9b');
  });
});