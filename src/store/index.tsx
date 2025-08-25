import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Tree, MapBounds } from '../types';
import { AppState, AppAction, initialState, appReducer } from './appState';

// Export nanostore-based stores
export * from './treeStore';
export * from './patchStore';
export * from './useTreeStore';
export * from './usePatchStore';
export * from './appState';

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the app context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks for specific state
export function useTrees() {
  const { state, dispatch } = useApp();
  return {
    trees: state.trees,
    setTrees: (trees: Tree[]) => dispatch({ type: 'SET_TREES', payload: trees })
  };
}

export function useSelectedTree() {
  const { state, dispatch } = useApp();
  return {
    selectedTree: state.selectedTree,
    setSelectedTree: (tree: Tree | null) => dispatch({ type: 'SET_SELECTED_TREE', payload: tree })
  };
}

export function usePatchset() {
  const { state, dispatch } = useApp();
  return {
    patchset: state.patchset,
    addToPatchset: (treeId: number, key: string, value: string) => 
      dispatch({ type: 'ADD_TO_PATCHSET', payload: { treeId, key, value } }),
    removeFromPatchset: (treeId: number, key: string) => 
      dispatch({ type: 'REMOVE_FROM_PATCHSET', payload: { treeId, key } }),
    clearPatchset: () => dispatch({ type: 'CLEAR_PATCHSET' })
  };
}

export function useBasemap() {
  const { state, dispatch } = useApp();
  return {
    basemap: state.basemap,
    setBasemap: (basemap: string) => dispatch({ type: 'SET_BASEMAP', payload: basemap })
  };
}

export function useLoading() {
  const { state, dispatch } = useApp();
  return {
    loading: state.loading,
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading })
  };
}

export function useMapState() {
  const { state, dispatch } = useApp();
  return {
    mapBounds: state.mapBounds,
    mapZoom: state.mapZoom,
    setMapBounds: (bounds: MapBounds) => dispatch({ type: 'SET_MAP_BOUNDS', payload: bounds }),
    setMapZoom: (zoom: number) => dispatch({ type: 'SET_MAP_ZOOM', payload: zoom })
  };
} 