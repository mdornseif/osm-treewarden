import { atom, computed } from 'nanostores';
import { OverpassService } from '../services/overpass';
import { Tree, Orchard, MapBounds } from '../types';
import { addPatch } from './patchStore';

// Store state
export const trees = atom<Tree[]>([]);
export const orchards = atom<Orchard[]>([]);
export const loading = atom<boolean>(false);
export const pendingReload = atom<boolean>(false);
export const error = atom<string | null>(null);
export const bounds = atom<MapBounds | null>(null);
export const lastUpdated = atom<Date | null>(null);
export const showStreuobstwiesen = atom<boolean>(false);

// Track ongoing requests to prevent race conditions
let currentLoadingRequest: AbortController | null = null;

// Tree addition state
export const isAddingTree = atom<boolean>(false);
export const selectedTreeType = atom<string | null>(null);

// Computed values
export const treeCount = computed(trees, (trees) => trees.length);
export const hasTrees = computed(trees, (trees) => trees.length > 0);
export const isLoading = computed(loading, (loading) => loading);
export const isPendingReload = computed(pendingReload, (pendingReload) => pendingReload);
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
export async function loadTreesForBounds(newBounds: MapBounds, forceReload: boolean = false, zoom?: number): Promise<void> {
  const currentBounds = bounds.get();
  
  // Check if we need to reload based on significant changes
  if (!forceReload && !hasSignificantBoundsChange(newBounds, currentBounds)) {
    console.log('🔄 Bounds change not significant enough, skipping tree reload');
    console.log('Current bounds:', currentBounds);
    console.log('New bounds:', newBounds);
    return;
  }

  // Cancel any ongoing request
  if (currentLoadingRequest) {
    console.log('🚫 Cancelling previous loading request');
    currentLoadingRequest.abort();
  }
  
  // Create new AbortController for this request
  currentLoadingRequest = new AbortController();
  const requestId = Date.now(); // Unique ID for this request
  
  console.log(`🌳 Starting tree loading (${requestId}), setting loading=true`);
  
  // Safety timeout to prevent loading state from getting stuck
  const loadingTimeout = setTimeout(() => {
    console.warn(`⚠️ Tree loading timeout after 30 seconds (${requestId}), forcing loading=false`);
    loading.set(false);
    pendingReload.set(false);
    error.set('Loading timeout - please try again');
    if (currentLoadingRequest) {
      currentLoadingRequest.abort();
      currentLoadingRequest = null;
    }
  }, 30000); // 30 second safety timeout
  
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
    // Check if this was an abort error (request was cancelled)
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(`🚫 Request ${requestId} was aborted`);
      return;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    error.set(errorMessage);
    trees.set([]);
    orchards.set([]);
    console.error('Error loading trees and orchards:', err);
    console.error(`❌ Error loading trees (${requestId}):`, err);
    console.error(`❌ Error details (${requestId}):`, errorMessage);
  } finally {
    clearTimeout(loadingTimeout); // Clear the safety timeout
    console.log(`🌳 Tree loading finished (${requestId}), setting loading=false`);
    loading.set(false);
    // Also ensure pending reload is cleared in case of any race conditions
    pendingReload.set(false);
    // Clear the current request if it's still ours
    if (currentLoadingRequest && !currentLoadingRequest.signal.aborted) {
      currentLoadingRequest = null;
    }
  }
}

export function clearTrees(): void {
  // Cancel any ongoing loading request
  if (currentLoadingRequest) {
    console.log('🚫 Cancelling loading request due to clearTrees');
    currentLoadingRequest.abort();
    currentLoadingRequest = null;
  }
  
  trees.set([]);
  orchards.set([]);
  bounds.set(null);
  lastUpdated.set(null);
  error.set(null);
  loading.set(false); // Ensure loading state is cleared
  pendingReload.set(false);
}

export function setPendingReload(isPending: boolean): void {
  pendingReload.set(isPending);
}

export async function loadStreuobstwiesen(bounds: MapBounds): Promise<void> {
  try {
    const fetchedOrchards = await OverpassService.fetchStreuobstwiesen(bounds);
    orchards.set(fetchedOrchards);
    console.log(`Loaded ${fetchedOrchards.length} Streuobstwiesen for bounds:`, bounds);
  } catch (err) {
    console.error('Error loading Streuobstwiesen:', err);
    orchards.set([]);
  }
}

export function toggleStreuobstwiesen(): void {
  const current = showStreuobstwiesen.get();
  showStreuobstwiesen.set(!current);
  
  if (!current) {
    // When turning on, load Streuobstwiesen for current bounds
    const currentBounds = bounds.get();
    if (currentBounds) {
      loadStreuobstwiesen(currentBounds);
    }
  } else {
    // When turning off, clear orchards
    orchards.set([]);
  }
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
  
  // Create basic tree properties with natural=tree
  const basicProperties: Record<string, string> = {
    natural: 'tree'
  };
  
  // Create genus-specific properties for the patch store
  const genusProperties: Record<string, string> = {};
  
  if (treeType === 'apple') {
    genusProperties.genus = 'Malus';
    genusProperties.species = 'Malus domestica';
  } else if (treeType === 'pear') {
    genusProperties.genus = 'Pyrus';
    genusProperties.species = 'Pyrus communis';
  }

  // Create the new tree with basic properties (natural=tree)
  const newTree: Tree = {
    id: tempId,
    lat,
    lon,
    type: 'node',
    properties: basicProperties,
    tags: basicProperties
  };

  // Add the new tree to the tree store
  const currentTrees = trees.get();
  trees.set([...currentTrees, newTree]);

  // Add the genus information to the patch store
  addPatch(tempId, 0, genusProperties);

  // Reset adding state
  isAddingTree.set(false);
  selectedTreeType.set(null);

  console.log(`Added new ${treeType} tree at ${lat}, ${lon} with natural=tree to treeStore and genus info to patchStore`);
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