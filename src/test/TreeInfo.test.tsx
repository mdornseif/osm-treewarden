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
  // Genus tag tests
  it('should show add genus button when genus tag does not exist', () => {
    const treeWithoutGenus: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        species: 'Quercus robur'
      }
    };

    render(<TreeInfo tree={treeWithoutGenus} />);
    
    expect(screen.getByText('➕ Genus')).toBeInTheDocument();
  });

  it('should not show add genus button when genus tag already exists', () => {
    const treeWithGenus: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        genus: 'Quercus',
        species: 'Quercus robur'
      }
    };

    render(<TreeInfo tree={treeWithGenus} />);
    
    expect(screen.queryByText('➕ Genus')).not.toBeInTheDocument();
  });

  it('should call addPatch when add genus button is clicked', async () => {
    const { addPatch } = await import('../store/patchStore');
    const treeWithoutGenus: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        species: 'Quercus robur'
      }
    };

    render(<TreeInfo tree={treeWithoutGenus} />);
    
    const addButton = screen.getByText('➕ Genus');
    fireEvent.click(addButton);
    
    expect(addPatch).toHaveBeenCalledWith(1, 1, { 'genus': '' });
  });

  // Species tag tests
  it('should show add species button when species tag does not exist', () => {
    const treeWithoutSpecies: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        genus: 'Quercus'
      }
    };

    render(<TreeInfo tree={treeWithoutSpecies} />);
    
    expect(screen.getByText('➕ Species')).toBeInTheDocument();
  });

  it('should not show add species button when species tag already exists', () => {
    const treeWithSpecies: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        genus: 'Quercus',
        species: 'Quercus robur'
      }
    };

    render(<TreeInfo tree={treeWithSpecies} />);
    
    expect(screen.queryByText('➕ Species')).not.toBeInTheDocument();
  });

  it('should call addPatch when add species button is clicked', async () => {
    const { addPatch } = await import('../store/patchStore');
    const treeWithoutSpecies: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {
        genus: 'Quercus'
      }
    };

    render(<TreeInfo tree={treeWithoutSpecies} />);
    
    const addButton = screen.getByText('➕ Species');
    fireEvent.click(addButton);
    
    expect(addPatch).toHaveBeenCalledWith(1, 1, { 'species': '' });
  });

  // Species:cultivar tag tests (existing functionality)
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

  // Test showing multiple buttons when multiple tags are missing
  it('should show multiple add buttons when multiple tags are missing', () => {
    const treeWithMinimalTags: Tree = {
      id: 1,
      lat: 50.897146,
      lon: 7.098337,
      properties: {}
    };

    render(<TreeInfo tree={treeWithMinimalTags} />);
    
    expect(screen.getByText('➕ Genus')).toBeInTheDocument();
    expect(screen.getByText('➕ Species')).toBeInTheDocument();
    expect(screen.getByText('➕ Species:cultivar')).toBeInTheDocument();
  });
});