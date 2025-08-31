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
let orchardLoadingRequest: AbortController | null = null;
let isTreeFetchQueued: boolean = false;

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

// Function to load orchards separately
async function loadOrchards(boundsToLoad: MapBounds): Promise<void> {
  // Don't load orchards if a new tree fetch is queued
  if (isTreeFetchQueued) {
    console.log('🚫 Skipping orchard loading - new tree fetch is queued');
    return;
  }

  // Cancel any ongoing orchard request
  if (orchardLoadingRequest) {
    console.log('🚫 Cancelling previous orchard loading request');
    orchardLoadingRequest.abort();
  }

  orchardLoadingRequest = new AbortController();
  const orchardRequestId = Date.now();

  try {
    console.log(`🍎 Starting orchard loading (${orchardRequestId})`);
    const fetchedOrchards = await OverpassService.fetchOrchards(boundsToLoad);
    
    // Check again if tree fetch was queued during orchard loading
    if (isTreeFetchQueued) {
      console.log('🚫 Tree fetch queued during orchard loading - discarding orchard results');
      return;
    }
    
    orchards.set(fetchedOrchards);
    console.log(`🍎 Loaded ${fetchedOrchards.length} orchards for bounds:`, boundsToLoad);
  } catch (err) {
    // Check if this was an abort error (request was cancelled)
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(`🚫 Orchard request ${orchardRequestId} was aborted`);
      return;
    }
    
    console.error('Error loading orchards:', err);
    // Don't set orchards to empty array on error - keep existing orchards
    // This ensures main functionality still works even if orchards fail
  } finally {
    if (orchardLoadingRequest && !orchardLoadingRequest.signal.aborted) {
      orchardLoadingRequest = null;
    }
  }
}

// Actions
export async function loadTreesForBounds(newBounds: MapBounds, forceReload: boolean = false, _zoom?: number): Promise<void> {
  const currentBounds = bounds.get();
  
  // Check if we need to reload based on significant changes
  if (!forceReload && !hasSignificantBoundsChange(newBounds, currentBounds)) {
    console.log('🔄 Bounds change not significant enough, skipping tree reload');
    console.log('Current bounds:', currentBounds);
    console.log('New bounds:', newBounds);
    return;
  }

  // Mark that a tree fetch is queued
  isTreeFetchQueued = true;

  // Cancel any ongoing requests
  if (currentLoadingRequest) {
    console.log('🚫 Cancelling previous tree loading request');
    currentLoadingRequest.abort();
  }
  if (orchardLoadingRequest) {
    console.log('🚫 Cancelling ongoing orchard loading request');
    orchardLoadingRequest.abort();
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
    isTreeFetchQueued = false;
    if (currentLoadingRequest) {
      currentLoadingRequest.abort();
      currentLoadingRequest = null;
    }
  }, 30000); // 30 second safety timeout
  
  try {
    loading.set(true);
    error.set(null);
    
    // First, fetch only trees
    const fetchedTrees = await OverpassService.fetchTrees(newBounds);
    
    // Update tree data immediately
    trees.set(fetchedTrees);
    bounds.set(newBounds);
    lastUpdated.set(new Date());
    
    console.log(`🌳 Loaded ${fetchedTrees.length} trees for bounds:`, newBounds);
    
    // Clear the tree fetch queue flag
    isTreeFetchQueued = false;
    
    // Now load orchards in the background (don't await)
    // This ensures main functionality works immediately with trees
    loadOrchards(newBounds).catch(err => {
      console.error('Background orchard loading failed:', err);
      // Don't propagate this error - main functionality should still work
    });
    
  } catch (err) {
    // Check if this was an abort error (request was cancelled)
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(`🚫 Request ${requestId} was aborted`);
      isTreeFetchQueued = false;
      return;
    }
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    error.set(errorMessage);
    trees.set([]);
    // Don't clear orchards on tree loading error - keep existing orchards
    console.error('Error loading trees:', err);
    console.error(`❌ Error loading trees (${requestId}):`, err);
    console.error(`❌ Error details (${requestId}):`, errorMessage);
    isTreeFetchQueued = false;
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
  // Cancel any ongoing loading requests
  if (currentLoadingRequest) {
    console.log('🚫 Cancelling tree loading request due to clearTrees');
    currentLoadingRequest.abort();
    currentLoadingRequest = null;
  }
  if (orchardLoadingRequest) {
    console.log('🚫 Cancelling orchard loading request due to clearTrees');
    orchardLoadingRequest.abort();
    orchardLoadingRequest = null;
  }
  
  // Clear the tree fetch queue flag
  isTreeFetchQueued = false;
  
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
  // Don't load Streuobstwiesen if a new tree fetch is queued
  if (isTreeFetchQueued) {
    console.log('🚫 Skipping Streuobstwiesen loading - new tree fetch is queued');
    return;
  }

  try {
    const fetchedOrchards = await OverpassService.fetchStreuobstwiesen(bounds);
    
    // Check again if tree fetch was queued during loading
    if (isTreeFetchQueued) {
      console.log('🚫 Tree fetch queued during Streuobstwiesen loading - discarding results');
      return;
    }
    
    orchards.set(fetchedOrchards);
    console.log(`Loaded ${fetchedOrchards.length} Streuobstwiesen for bounds:`, bounds);
  } catch (err) {
    console.error('Error loading Streuobstwiesen:', err);
    // Don't set orchards to empty array on error - keep existing orchards
    // This ensures main functionality still works even if Streuobstwiesen fail
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