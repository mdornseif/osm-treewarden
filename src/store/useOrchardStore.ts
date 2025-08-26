import { useStore } from '@nanostores/react';
import { 
  orchards, 
  orchardLoading, 
  orchardError, 
  orchardBounds, 
  orchardLastUpdated,
  orchardCount,
  hasOrchards,
  isOrchardLoading,
  hasOrchardError,
  loadOrchardsForBounds,
  clearOrchards,
  setOrchardError,
  clearOrchardError,
  getOrchardsInBounds,
  getOrchardById
} from './orchardStore';

export function useOrchardStore() {
  return {
    // State
    orchards: useStore(orchards),
    loading: useStore(orchardLoading),
    error: useStore(orchardError),
    bounds: useStore(orchardBounds),
    lastUpdated: useStore(orchardLastUpdated),
    
    // Computed
    orchardCount: useStore(orchardCount),
    hasOrchards: useStore(hasOrchards),
    isLoading: useStore(isOrchardLoading),
    hasError: useStore(hasOrchardError),
    
    // Actions
    loadOrchardsForBounds,
    clearOrchards,
    setOrchardError,
    clearOrchardError,
    
    // Utilities
    getOrchardsInBounds,
    getOrchardById
  };
}

// Specific hooks for individual stores
export function useOrchards() {
  return useStore(orchards);
}

export function useOrchardLoading() {
  return useStore(orchardLoading);
}

export function useOrchardError() {
  return useStore(orchardError);
}