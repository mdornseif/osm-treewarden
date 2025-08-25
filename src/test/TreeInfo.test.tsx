import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TreeInfo from '../components/TreeInfo';
import { Tree } from '../types';

// Mock the patch store
vi.mock('../store/patchStore', () => ({
  addPatch: vi.fn(),
  getPatchedTree: (tree: Tree) => tree
}));

// Mock the usePatchStore hook
vi.mock('../store/usePatchStore', () => ({
  usePatchByOsmId: () => ({ patch: null })
}));

describe('TreeInfo Component', () => {
  it('should show add species:cultivar button when tag does not exist', () => {
    const treeWithoutSpeciesCultivar: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        species: 'Quercus robur',
        genus: 'Quercus'
      }
    };

    render(<TreeInfo tree={treeWithoutSpeciesCultivar} />);
    
    expect(screen.getByText('➕ Species:cultivar')).toBeInTheDocument();
  });

  it('should not show add species:cultivar button when tag already exists', () => {
    const treeWithSpeciesCultivar: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        species: 'Quercus robur',
        genus: 'Quercus',
        'species:cultivar': 'Fastigiata'
      }
    };

    render(<TreeInfo tree={treeWithSpeciesCultivar} />);
    
    expect(screen.queryByText('➕ Species:cultivar')).not.toBeInTheDocument();
  });

  it('should call addPatch when add species:cultivar button is clicked', async () => {
    const { addPatch } = await import('../store/patchStore');
    const treeWithoutSpeciesCultivar: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        species: 'Quercus robur',
        genus: 'Quercus'
      }
    };

    render(<TreeInfo tree={treeWithoutSpeciesCultivar} />);
    
    const addButton = screen.getByText('➕ Species:cultivar');
    fireEvent.click(addButton);
    
    expect(addPatch).toHaveBeenCalledWith(1, 1, { 'species:cultivar': '' });
  });
});