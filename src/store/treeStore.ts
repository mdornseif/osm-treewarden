import { atom, computed } from 'nanostores';
import { OverpassService } from '../services/overpass';
import { Tree, MapBounds, Orchard } from '../types';

// Store state
export const trees = atom<Tree[]>([]);
export const orchards = atom<Orchard[]>([]);
export const loading = atom<boolean>(false);
export const error = atom<string | null>(null);
export const bounds = atom<MapBounds | null>(null);
export const lastUpdated = atom<Date | null>(null);

// Tree addition state
export const isAddingTree = atom<boolean>(false);
export const selectedTreeType = atom<string | null>(null);

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
    
    // Fetch both trees and orchards in parallel
    const [fetchedTrees, fetchedOrchards] = await Promise.all([
      OverpassService.fetchTrees(newBounds),
      OverpassService.fetchOrchards(newBounds)
    ]);
    
    trees.set(fetchedTrees);
    orchards.set(fetchedOrchards);
    bounds.set(newBounds);
    lastUpdated.set(new Date());
    
    console.log(`Loaded ${fetchedTrees.length} trees and ${fetchedOrchards.length} orchards for bounds:`, newBounds);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    error.set(errorMessage);
    trees.set([]);
    orchards.set([]);
    console.error('Error loading trees and orchards:', err);
  } finally {
    loading.set(false);
  }
}

export function clearTrees(): void {
  trees.set([]);
  orchards.set([]);
  bounds.set(null);
  lastUpdated.set(null);
  error.set(null);
}

// Tree addition actions
export function startAddingTree(): void {
  isAddingTree.set(true);
  selectedTreeType.set(null);
}

export function selectTreeType(treeType: string): void {
  selectedTreeType.set(treeType);
}

export function cancelAddingTree(): void {
  isAddingTree.set(false);
  selectedTreeType.set(null);
}

export function addTreeAtLocation(lat: number, lon: number): void {
  const treeType = selectedTreeType.get();
  if (!treeType) {
    console.error('No tree type selected');
    return;
  }

  // Generate a temporary negative ID for new trees
  const tempId = -(Date.now() + Math.random());
  
  // Create tree properties based on selected type
  const properties: Record<string, string> = {};
  
  if (treeType === 'apple') {
    properties.genus = 'Malus';
    properties.species = 'Malus domestica';
  } else if (treeType === 'pear') {
    properties.genus = 'Pyrus';
    properties.species = 'Pyrus communis';
  }

  const newTree: Tree = {
    id: tempId,
    lat,
    lon,
    type: 'node',
    properties,
    tags: properties
  };

  // Add the new tree to the existing trees
  const currentTrees = trees.get();
  trees.set([...currentTrees, newTree]);

  // Reset adding state
  isAddingTree.set(false);
  selectedTreeType.set(null);

  console.log(`Added new ${treeType} tree at ${lat}, ${lon}`);
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