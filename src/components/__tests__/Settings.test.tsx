import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../Settings';
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
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should display store information section', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText('Store Information')).toBeInTheDocument();
    expect(screen.getByText('Trees in store:')).toBeInTheDocument();
    expect(screen.getByText('Changes in patch store:')).toBeInTheDocument();
  });

  it('should display correct tree count', () => {
    const treeCount = 42;
    mockUseTreeStore.mockReturnValue({
      treeCount,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText(treeCount.toString())).toBeInTheDocument();
  });

  it('should display correct patch count', () => {
    const patchCount = 17;
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText(patchCount.toString())).toBeInTheDocument();
  });

  it('should display store management section', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText('Store Management')).toBeInTheDocument();
  });

  it('should render clear tree store button', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText('Clear Tree Store')).toBeInTheDocument();
  });

  it('should render clear patch store button', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText('Clear Patch Store')).toBeInTheDocument();
  });

  it('should disable clear tree store button when tree count is 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Clear Tree Store');
    expect(clearTreeButton).toBeDisabled();
  });

  it('should disable clear patch store button when patch count is 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Clear Patch Store');
    expect(clearPatchButton).toBeDisabled();
  });

  it('should enable clear tree store button when tree count is greater than 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Clear Tree Store');
    expect(clearTreeButton).not.toBeDisabled();
  });

  it('should enable clear patch store button when patch count is greater than 0', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Clear Patch Store');
    expect(clearPatchButton).not.toBeDisabled();
  });

  it('should show confirmation dialog when clearing tree store', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Clear Tree Store');
    fireEvent.click(clearTreeButton);
    
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear all trees? This action cannot be undone.');
  });

  it('should show confirmation dialog when clearing patch store', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Clear Patch Store');
    fireEvent.click(clearPatchButton);
    
    expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to clear all patches? This action cannot be undone.');
  });

  it('should call clearTrees when confirmation is accepted', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);
    mockConfirm.mockReturnValue(true);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Clear Tree Store');
    fireEvent.click(clearTreeButton);
    
    expect(mockClearTrees).toHaveBeenCalled();
  });

  it('should call clearAllPatches when confirmation is accepted', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);
    mockConfirm.mockReturnValue(true);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Clear Patch Store');
    fireEvent.click(clearPatchButton);
    
    expect(mockClearAllPatches).toHaveBeenCalled();
  });

  it('should not call clearTrees when confirmation is rejected', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 0,
    } as any);
    mockConfirm.mockReturnValue(false);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Clear Tree Store');
    fireEvent.click(clearTreeButton);
    
    expect(mockClearTrees).not.toHaveBeenCalled();
  });

  it('should not call clearAllPatches when confirmation is rejected', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 0,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);
    mockConfirm.mockReturnValue(false);

    render(<Settings />);
    
    const clearPatchButton = screen.getByText('Clear Patch Store');
    fireEvent.click(clearPatchButton);
    
    expect(mockClearAllPatches).not.toHaveBeenCalled();
  });

  it('should display both counts when both stores have data', () => {
    const treeCount = 10;
    const patchCount = 7;
    mockUseTreeStore.mockReturnValue({
      treeCount,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount,
    } as any);

    render(<Settings />);
    
    expect(screen.getByText(treeCount.toString())).toBeInTheDocument();
    expect(screen.getByText(patchCount.toString())).toBeInTheDocument();
    expect(screen.getByText('Clear Tree Store')).not.toBeDisabled();
    expect(screen.getByText('Clear Patch Store')).not.toBeDisabled();
  });

  it('should have correct CSS classes for store values', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);

    render(<Settings />);
    
    const treeValue = screen.getByText('5');
    const patchValue = screen.getByText('3');
    
    expect(treeValue).toHaveClass('store-value');
    expect(patchValue).toHaveClass('store-value');
  });

  it('should have correct CSS classes for clear buttons', () => {
    mockUseTreeStore.mockReturnValue({
      treeCount: 5,
    } as any);
    mockUsePatchStore.mockReturnValue({
      patchCount: 3,
    } as any);

    render(<Settings />);
    
    const clearTreeButton = screen.getByText('Clear Tree Store');
    const clearPatchButton = screen.getByText('Clear Patch Store');
    
    expect(clearTreeButton).toHaveClass('clear-button', 'clear-trees');
    expect(clearPatchButton).toHaveClass('clear-button', 'clear-patches');
  });
});