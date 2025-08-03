import { atom } from 'nanostores';

export interface UIState {
  selectedTreeId: number | null;
  isTreeInfoOpen: boolean;
  isTreeListOpen: boolean;
  highlightedMarkerId: number | null;
}

export const uiState = atom<UIState>({
  selectedTreeId: null,
  isTreeInfoOpen: false,
  isTreeListOpen: false,
  highlightedMarkerId: null,
});

// Actions
export const selectTree = (treeId: number) => {
  const current = uiState.get();
  uiState.set({
    ...current,
    selectedTreeId: treeId,
    isTreeInfoOpen: true,
    highlightedMarkerId: treeId,
  });
};

export const closeTreeInfo = () => {
  const current = uiState.get();
  uiState.set({
    ...current,
    selectedTreeId: null,
    isTreeInfoOpen: false,
    highlightedMarkerId: null,
  });
};

export const toggleTreeList = () => {
  const current = uiState.get();
  uiState.set({
    ...current,
    isTreeListOpen: !current.isTreeListOpen,
  });
}; 