import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TreeList from '../TreeList';
import { useTreeStore } from '../../store/useTreeStore';

// Mock the tree store
vi.mock('../../store/useTreeStore');
const mockUseTreeStore = vi.mocked(useTreeStore);

// Mock the tree utils
vi.mock('../../utils/treeUtils', () => ({
  getTreeDisplayName: vi.fn((tree) => tree.properties.species || tree.properties.genus || `Tree ${tree.id}`)
}));

describe('TreeList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state when trees are loading', () => {
    mockUseTreeStore.mockReturnValue({
      trees: [],
      isLoading: true,
      error: null,
      treeCount: 0,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Trees')).toBeInTheDocument();
    expect(screen.getByText('Loading trees...')).toBeInTheDocument();
  });

  it('should display error state when there is an error', () => {
    const errorMessage = 'Failed to load trees';
    mockUseTreeStore.mockReturnValue({
      trees: [],
      isLoading: false,
      error: errorMessage,
      treeCount: 0,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Trees')).toBeInTheDocument();
    expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    expect(screen.getByText(`Error: ${errorMessage}`)).toHaveClass('error');
  });

  it('should display empty state when no trees are found', () => {
    mockUseTreeStore.mockReturnValue({
      trees: [],
      isLoading: false,
      error: null,
      treeCount: 0,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Trees (0)')).toBeInTheDocument();
    expect(screen.getByText('No trees found in this area.')).toBeInTheDocument();
  });

  it('should display tree count in header when trees are loaded', () => {
    const mockTrees = [
      {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      }
    ];

    mockUseTreeStore.mockReturnValue({
      trees: mockTrees,
      isLoading: false,
      error: null,
      treeCount: 1,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Trees (1)')).toBeInTheDocument();
  });

  it('should display tree list with OSM ID and species', () => {
    const mockTrees = [
      {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      },
      {
        id: 789012,
        lat: 50.897200,
        lon: 7.098400,
        properties: {
          species: 'Quercus robur',
          genus: 'Quercus'
        }
      }
    ];

    mockUseTreeStore.mockReturnValue({
      trees: mockTrees,
      isLoading: false,
      error: null,
      treeCount: 2,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Trees (2)')).toBeInTheDocument();
    expect(screen.getByText('OSM ID: 123456')).toBeInTheDocument();
    expect(screen.getByText('OSM ID: 789012')).toBeInTheDocument();
  });

  it('should display tree with genus when species is not available', () => {
    const mockTrees = [
      {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Acer'
        }
      }
    ];

    mockUseTreeStore.mockReturnValue({
      trees: mockTrees,
      isLoading: false,
      error: null,
      treeCount: 1,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Acer')).toBeInTheDocument();
    expect(screen.getByText('OSM ID: 123456')).toBeInTheDocument();
  });

  it('should display tree with fallback name when neither species nor genus is available', () => {
    const mockTrees = [
      {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {}
      }
    ];

    mockUseTreeStore.mockReturnValue({
      trees: mockTrees,
      isLoading: false,
      error: null,
      treeCount: 1,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Tree 123456')).toBeInTheDocument();
    expect(screen.getByText('OSM ID: 123456')).toBeInTheDocument();
  });

  it('should not display species span when species is not available', () => {
    const mockTrees = [
      {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          genus: 'Acer'
        }
      }
    ];

    mockUseTreeStore.mockReturnValue({
      trees: mockTrees,
      isLoading: false,
      error: null,
      treeCount: 1,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Acer')).toBeInTheDocument();
    expect(screen.getByText('OSM ID: 123456')).toBeInTheDocument();
    expect(screen.queryByText('Acer')).toBeInTheDocument(); // Only the name, not as species
  });

  it('should have correct CSS classes for styling', () => {
    const mockTrees = [
      {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      }
    ];

    mockUseTreeStore.mockReturnValue({
      trees: mockTrees,
      isLoading: false,
      error: null,
      treeCount: 1,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    expect(screen.getByText('Trees (1)').closest('.tree-list-header')).toBeInTheDocument();
    expect(screen.getByText('OSM ID: 123456').closest('.tree-id')).toBeInTheDocument();
  });

  it('should render tree items as list elements', () => {
    const mockTrees = [
      {
        id: 123456,
        lat: 50.897146,
        lon: 7.098337,
        properties: {
          species: 'Acer platanoides',
          genus: 'Acer'
        }
      }
    ];

    mockUseTreeStore.mockReturnValue({
      trees: mockTrees,
      isLoading: false,
      error: null,
      treeCount: 1,
      loadTreesForBounds: vi.fn(),
    });

    render(<TreeList />);
    
    const treeItem = screen.getByText('OSM ID: 123456').closest('li');
    expect(treeItem).toHaveClass('tree-item');
  });
}); 