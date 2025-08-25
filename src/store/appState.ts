import type { Tree, MapBounds } from '../types';

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
export const initialState: AppState = {
  trees: [],
  selectedTree: null,
  patchset: new Map(),
  basemap: 'cyclosm',
  loading: false,
  mapBounds: null,
  mapZoom: 16
};

// Reducer
export function appReducer(state: AppState, action: AppAction): AppState {
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