import { atom, computed } from 'nanostores';
import { OverpassService } from '../services/overpass';
import { Tree, MapBounds } from '../types';

// Store state
export const trees = atom<Tree[]>([]);
export const loading = atom<boolean>(false);
export const error = atom<string | null>(null);
export const bounds = atom<MapBounds | null>(null);
export const lastUpdated = atom<Date | null>(null);

// Computed values
export const treeCount = computed(trees, (trees) => trees.length);
export const hasTrees = computed(trees, (trees) => trees.length > 0);
export const isLoading = computed(loading, (loading) => loading);
export const hasError = computed(error, (error) => error !== null);

// Actions
export async function loadTreesForBounds(newBounds: MapBounds): Promise<void> {
  try {
    loading.set(true);
    error.set(null);
    
    const fetchedTrees = await OverpassService.fetchTrees(newBounds);
    
    trees.set(fetchedTrees);
    bounds.set(newBounds);
    lastUpdated.set(new Date());
    
    console.log(`Loaded ${fetchedTrees.length} trees for bounds:`, newBounds);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    error.set(errorMessage);
    trees.set([]);
    console.error('Error loading trees:', err);
  } finally {
    loading.set(false);
  }
}

export function clearTrees(): void {
  trees.set([]);
  bounds.set(null);
  lastUpdated.set(null);
  error.set(null);
}

export function setError(errorMessage: string): void {
  error.set(errorMessage);
}

export function clearError(): void {
  error.set(null);
}

// Utility functions
export function getTreesInBounds(bounds: MapBounds): Tree[] {
  const currentTrees = trees.get();
  return currentTrees.filter(tree => 
    tree.lat >= bounds.south && 
    tree.lat <= bounds.north && 
    tree.lon >= bounds.west && 
    tree.lon <= bounds.east
  );
}

export function getTreeById(id: number): Tree | undefined {
  return trees.get().find(tree => tree.id === id);
}

export function getTreesBySpecies(species: string): Tree[] {
  return trees.get().filter(tree => 
    tree.properties.species?.toLowerCase().includes(species.toLowerCase())
  );
}

export function getTreesByGenus(genus: string): Tree[] {
  return trees.get().filter(tree => 
    tree.properties.genus?.toLowerCase().includes(genus.toLowerCase())
  );
} 