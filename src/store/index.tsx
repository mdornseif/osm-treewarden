import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { Tree, MapBounds } from '../types';

// Export nanostore-based stores
export * from './treeStore';
export * from './patchStore';
export * from './useTreeStore';
export * from './usePatchStore';

// State interface
export interface AppState {
  trees: Tree[];
  selectedTree: Tree | null;
  patchset: Map<number, Record<string, string>>;
  basemap: string;
  loading: boolean;
  mapBounds: MapBounds | null;
  mapZoom: number;
}

// Action types
export type AppAction =
  | { type: 'SET_TREES'; payload: Tree[] }
  | { type: 'SET_SELECTED_TREE'; payload: Tree | null }
  | { type: 'ADD_TO_PATCHSET'; payload: { treeId: number; key: string; value: string } }
  | { type: 'REMOVE_FROM_PATCHSET'; payload: { treeId: number; key: string } }
  | { type: 'CLEAR_PATCHSET' }
  | { type: 'SET_BASEMAP'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MAP_BOUNDS'; payload: MapBounds }
  | { type: 'SET_MAP_ZOOM'; payload: number };

// Initial state
const initialState: AppState = {
  trees: [],
  selectedTree: null,
  patchset: new Map(),
  basemap: 'cyclosm',
  loading: false,
  mapBounds: null,
  mapZoom: 16
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TREES':
      return { ...state, trees: action.payload };
    
    case 'SET_SELECTED_TREE':
      return { ...state, selectedTree: action.payload };
    
    case 'ADD_TO_PATCHSET': {
      const newPatchset = new Map(state.patchset);
      if (!newPatchset.has(action.payload.treeId)) {
        newPatchset.set(action.payload.treeId, {});
      }
      const treeChanges = newPatchset.get(action.payload.treeId)!;
      treeChanges[action.payload.key] = action.payload.value;
      return { ...state, patchset: newPatchset };
    }
    
    case 'REMOVE_FROM_PATCHSET': {
      const newPatchset = new Map(state.patchset);
      if (newPatchset.has(action.payload.treeId)) {
        const treeChanges = newPatchset.get(action.payload.treeId)!;
        delete treeChanges[action.payload.key];
        if (Object.keys(treeChanges).length === 0) {
          newPatchset.delete(action.payload.treeId);
        }
      }
      return { ...state, patchset: newPatchset };
    }
    
    case 'CLEAR_PATCHSET':
      return { ...state, patchset: new Map() };
    
    case 'SET_BASEMAP':
      return { ...state, basemap: action.payload };
    
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_MAP_BOUNDS':
      return { ...state, mapBounds: action.payload };
    
    case 'SET_MAP_ZOOM':
      return { ...state, mapZoom: action.payload };
    
    default:
      return state;
  }
}

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