import { useStore } from '@nanostores/react';
import { 
  trees, 
  loading, 
  error, 
  bounds, 
  lastUpdated,
  treeCount,
  hasTrees,
  isLoading,
  hasError,
  loadTreesForBounds,
  clearTrees,
  setError,
  clearError,
  getTreesInBounds,
  getTreeById,
  getTreesBySpecies,
  getTreesByGenus
} from './treeStore';

export function useTreeStore() {
  return {
    // State
    trees: useStore(trees),
    loading: useStore(loading),
    error: useStore(error),
    bounds: useStore(bounds),
    lastUpdated: useStore(lastUpdated),
    
    // Computed
    treeCount: useStore(treeCount),
    hasTrees: useStore(hasTrees),
    isLoading: useStore(isLoading),
    hasError: useStore(hasError),
    
    // Actions
    loadTreesForBounds,
    clearTrees,
    setError,
    clearError,
    
    // Utilities
    getTreesInBounds,
    getTreeById,
    getTreesBySpecies,
    getTreesByGenus
  };
}

// Specific hooks for individual stores
export function useTrees() {
  return useStore(trees);
}

export function useTreeLoading() {
  return useStore(loading);
}

export function useTreeError() {
  return useStore(error);
}

export function useTreeBounds() {
  return useStore(bounds);
}

export function useTreeCount() {
  return useStore(treeCount);
}

export function useHasTrees() {
  return useStore(hasTrees);
} 