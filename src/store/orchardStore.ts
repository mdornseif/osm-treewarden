import { atom, computed } from 'nanostores';
import { OverpassService } from '../services/overpass';
import { Orchard, MapBounds } from '../types';

// Store state
export const orchards = atom<Orchard[]>([]);
export const orchardLoading = atom<boolean>(false);
export const orchardError = atom<string | null>(null);
export const orchardBounds = atom<MapBounds | null>(null);
export const orchardLastUpdated = atom<Date | null>(null);

// Computed values
export const orchardCount = computed(orchards, (orchardsState) => orchardsState.length);
export const hasOrchards = computed(orchards, (orchardsState) => orchardsState.length > 0);
export const isOrchardLoading = computed(orchardLoading, (loading) => loading);
export const hasOrchardError = computed(orchardError, (error) => error !== null);

// Utility function to check if bounds change is significant enough to reload orchards
function hasSignificantOrchardBoundsChange(newBounds: MapBounds, currentBounds: MapBounds | null): boolean {
  if (!currentBounds) return true;

  // For orchards, use a larger threshold since they cover bigger areas
  const latThreshold = 0.02; // ~2.2km
  const lngThreshold = 0.02; // ~2.2km (varies by latitude)
  const zoomThreshold = 1.5; // More tolerant zoom changes

  const latDiff = Math.abs(newBounds.north - currentBounds.north) + Math.abs(newBounds.south - currentBounds.south);
  const lngDiff = Math.abs(newBounds.east - currentBounds.east) + Math.abs(newBounds.west - currentBounds.west);

  const hasSignificantPan = latDiff > latThreshold || lngDiff > lngThreshold;

  // Calculate zoom level difference (approximation based on bounds size)
  const currentSize = (currentBounds.north - currentBounds.south) * (currentBounds.east - currentBounds.west);
  const newSize = (newBounds.north - newBounds.south) * (newBounds.east - newBounds.west);
  const sizeDiff = Math.abs(Math.log(newSize / currentSize));
  const hasSignificantZoom = sizeDiff > zoomThreshold;

  return hasSignificantPan || hasSignificantZoom;
}

// Calculate expanded bounds for orchard fetching (larger area than trees)
function calculateOrchardBounds(treeBounds: MapBounds): MapBounds {
  const latDiff = treeBounds.north - treeBounds.south;
  const lngDiff = treeBounds.east - treeBounds.west;
  
  // Use larger expansion for orchards (4.5x as in legacy code)
  const latExpansion = latDiff * 4.5;
  const lngExpansion = lngDiff * 4.5;
  
  return {
    south: treeBounds.south - latExpansion,
    west: treeBounds.west - lngExpansion,
    north: treeBounds.north + latExpansion,
    east: treeBounds.east + lngExpansion
  };
}

// Actions
export async function loadOrchardsForBounds(treeBounds: MapBounds, forceReload: boolean = false): Promise<void> {
  const expandedBounds = calculateOrchardBounds(treeBounds);
  const currentBounds = orchardBounds.get();
  
  // Check if we need to reload based on significant changes
  if (!forceReload && !hasSignificantOrchardBoundsChange(expandedBounds, currentBounds)) {
    console.log('🍎 Orchard bounds change not significant enough, skipping orchard reload');
    console.log('Current orchard bounds:', currentBounds);
    console.log('New orchard bounds:', expandedBounds);
    return;
  }

  try {
    orchardLoading.set(true);
    orchardError.set(null);
    
    // Add a small delay to ensure this runs with lower priority than trees
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('🍎 Starting orchard fetch with low priority...');
    const fetchedOrchards = await OverpassService.fetchOrchards(expandedBounds);
    
    orchards.set(fetchedOrchards);
    orchardBounds.set(expandedBounds);
    orchardLastUpdated.set(new Date());
    
    console.log(`🍎 Loaded ${fetchedOrchards.length} orchards for expanded bounds:`, expandedBounds);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred while loading orchards';
    orchardError.set(errorMessage);
    orchards.set([]);
    console.error('Error loading orchards:', err);
  } finally {
    orchardLoading.set(false);
  }
}

export function clearOrchards(): void {
  orchards.set([]);
  orchardBounds.set(null);
  orchardLastUpdated.set(null);
  orchardError.set(null);
}

export function clearOrchardError(): void {
  orchardError.set(null);
}

export function setOrchardError(errorMessage: string): void {
  orchardError.set(errorMessage);
}

// Utility functions
export function getOrchardsInBounds(bounds: MapBounds): Orchard[] {
  return orchards.get().filter(orchard => {
    // Check if any coordinate of the orchard is within bounds
    return orchard.coordinates.some(([lat, lon]) => 
      lat >= bounds.south && lat <= bounds.north &&
      lon >= bounds.west && lon <= bounds.east
    );
  });
}

export function getOrchardById(id: number): Orchard | undefined {
  return orchards.get().find(orchard => orchard.id === id);
}