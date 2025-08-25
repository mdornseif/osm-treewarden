import { useStore } from '@nanostores/react';
import { mapState, MapState } from './mapStore';

export const useMapStore = () => {
  const state = useStore(mapState);
  return state;
};

export type { MapState };