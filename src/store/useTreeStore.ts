import { useStore } from '@nanostores/react';
import { 
  trees, 
  orchards,
  loading, 
  pendingReload,
  error, 
  bounds, 
  lastUpdated,
  treeCount,
  hasTrees,
  isLoading,
  isPendingReload,
  hasError,
  isAddingTree,
  selectedTreeType,
  showStreuobstwiesen,
  loadTreesForBounds,
  clearTrees,
  setError,
  clearError,
  setPendingReload,
  loadStreuobstwiesen,
  toggleStreuobstwiesen,
  getTreesInBounds,
  getTreeById,
  getTreesBySpecies,
  getTreesByGenus,
  startAddingTree,
  selectTreeType,
  cancelAddingTree,
  addTreeAtLocation
} from './treeStore';

export function useTreeStore() {
  return {
    // State
    trees: useStore(trees),
    orchards: useStore(orchards),
    loading: useStore(loading),
    pendingReload: useStore(pendingReload),
    error: useStore(error),
    bounds: useStore(bounds),
    lastUpdated: useStore(lastUpdated),
    
    // Tree addition state
    isAddingTree: useStore(isAddingTree),
    selectedTreeType: useStore(selectedTreeType),
    
    // Streuobstwiesen state
    showStreuobstwiesen: useStore(showStreuobstwiesen),
    
    // Computed
    treeCount: useStore(treeCount),
    hasTrees: useStore(hasTrees),
    isLoading: useStore(isLoading),
    isPendingReload: useStore(isPendingReload),
    hasError: useStore(hasError),
    
    // Actions
    loadTreesForBounds,
    clearTrees,
    setError,
    clearError,
    setPendingReload,
    loadStreuobstwiesen,
    toggleStreuobstwiesen,
    
    // Tree addition actions
    startAddingTree,
    selectTreeType,
    cancelAddingTree,
    addTreeAtLocation,
    
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

export function useOrchards() {
  return useStore(orchards);
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

// Tree addition specific hooks
export function useIsAddingTree() {
  return useStore(isAddingTree);
}

export function useSelectedTreeType() {
  return useStore(selectedTreeType);
} 