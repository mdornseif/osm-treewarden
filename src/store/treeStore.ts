import { atom, computed } from 'nanostores';
import { OverpassService } from '../services/overpass';
import { Tree, MapBounds } from '../types';
import { loadOrchardsForBounds } from './orchardStore';

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

// Check if bounds have changed significantly enough to warrant reloading
function hasSignificantBoundsChange(newBounds: MapBounds, currentBounds: MapBounds | null): boolean {
  if (!currentBounds) {
    return true; // No current bounds, so any bounds are significant
  }

  // Calculate the center and size of both bounds
  const currentCenter = {
    lat: (currentBounds.north + currentBounds.south) / 2,
    lng: (currentBounds.east + currentBounds.west) / 2
  };
  
  const newCenter = {
    lat: (newBounds.north + newBounds.south) / 2,
    lng: (newBounds.east + newBounds.west) / 2
  };

  const currentSize = {
    lat: currentBounds.north - currentBounds.south,
    lng: currentBounds.east - currentBounds.west
  };

  const newSize = {
    lat: newBounds.north - newBounds.south,
    lng: newBounds.east - newBounds.west
  };

  // Check if center has moved more than 25% of the current bounds size
  const latDiff = Math.abs(newCenter.lat - currentCenter.lat);
  const lngDiff = Math.abs(newCenter.lng - currentCenter.lng);
  
  const hasSignificantPan = latDiff > (currentSize.lat * 0.25) || lngDiff > (currentSize.lng * 0.25);

  // Check if zoom has changed more than 3 fold (either direction)
  const latZoomRatio = newSize.lat / currentSize.lat;
  const lngZoomRatio = newSize.lng / currentSize.lng;
  
  const hasSignificantZoom = latZoomRatio > 3 || latZoomRatio < 0.333 || 
                            lngZoomRatio > 3 || lngZoomRatio < 0.333;

  return hasSignificantPan || hasSignificantZoom;
}

// Actions
export async function loadTreesForBounds(newBounds: MapBounds, forceReload: boolean = false): Promise<void> {
  const currentBounds = bounds.get();
  
  // Check if we need to reload based on significant changes
  if (!forceReload && !hasSignificantBoundsChange(newBounds, currentBounds)) {
    console.log('🔄 Bounds change not significant enough, skipping tree reload');
    console.log('Current bounds:', currentBounds);
    console.log('New bounds:', newBounds);
    return;
  }

  try {
    loading.set(true);
    error.set(null);
    
    const fetchedTrees = await OverpassService.fetchTrees(newBounds);
    
    trees.set(fetchedTrees);
    bounds.set(newBounds);
    lastUpdated.set(new Date());
    
    console.log(`Loaded ${fetchedTrees.length} trees for bounds:`, newBounds);
    
    // After trees are loaded successfully, start low-priority orchard loading
    loadOrchardsForBounds(newBounds, forceReload).catch(err => {
      console.warn('Failed to load orchards after tree loading:', err);
    });
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