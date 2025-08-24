
import { atom, computed } from 'nanostores';
import { osmAuth } from 'osm-auth';

// Authentication state interface
export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  timestamp: string | null;
}

// Store state
export const authState = atom<AuthState>({
  isAuthenticated: false,
  token: null,
  timestamp: null
});

// Computed values
export const isAuthenticated = computed(authState, (state) => state.isAuthenticated);
export const authToken = computed(authState, (state) => state.token);
export const authTimestamp = computed(authState, (state) => state.timestamp);

// localStorage keys
const AUTH_STORAGE_KEY = 'osm-treewarden-auth';

// osm-auth instance
let osmAuthInstance: any = null;

// Initialize osm-auth library
function initializeOsmAuth(): void {
  try {
    console.log('🔑 Initializing OSM OAuth...');
    
    // Generate redirect URI based on current browser location
    const currentOrigin = window.location.origin;
    const redirectUri = currentOrigin + window.location.pathname;
    
    console.log('🔗 Generated redirect URI:', redirectUri);
    
    // Initialize osm-auth with the provided OAuth configuration
    osmAuthInstance = osmAuth({
      client_id: 'BxotvxIGppe-bd81erCe2UhcAzePALXMtCcSaMlhAS4',
      redirect_uri: redirectUri,
      scope: 'write_api',
      auto: true, // Disable automatic token handling to debug
      singlepage: true, // Single page application mode
      url: 'https://www.openstreetmap.org',
      apiUrl: 'https://api.openstreetmap.org'
    });
    
    console.log('✅ osmAuth initialized successfully:', osmAuthInstance);
    
    // Handle OAuth callback if authorization code is present in URL
    if (window.location.search.slice(1).split('&').some(p => p.startsWith('code='))) {
      console.log('🔄 OAuth callback detected, completing authentication...');
      osmAuthInstance.authenticate(function(err: Error | null, result: unknown) {
        if (err) {
          console.error('❌ OAuth callback failed:', err);
          handleAuthError(err);
        } else {
          console.log('✅ OAuth callback successful:', result);
          // Get token directly from localStorage since token function is not exposed
          const accessToken = localStorage.getItem('https://www.openstreetmap.orgoauth2_access_token');
          if (accessToken) {
            setAuth(accessToken.replace(/"/g, '')); // Remove quotes as per osm-auth source
          }
                        // Clean up the URL by removing OAuth parameters
                        const cleanUrl = window.location.origin + window.location.pathname;
                        window.history.replaceState({}, document.title, cleanUrl);
        }
      });
    }
    
    // Check if user is already authenticated
    if (osmAuthInstance.authenticated()) {
      console.log('🔐 User is already authenticated');
      // Note: User details are not fetched automatically
    } else {
      console.log('🔓 User is not authenticated');
    }
    
  } catch (error) {
    console.error('❌ Failed to initialize osm-auth:', error);
  }
}

// localStorage persistence functions
function saveAuthToLocalStorage(data: AuthState): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save auth to localStorage:', error);
  }
}

function loadAuthFromLocalStorage(): AuthState | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to load auth from localStorage:', error);
    return null;
  }
}

// Initialize auth state from localStorage
function initializeAuthState(): void {
  const storedAuth = loadAuthFromLocalStorage();
  
  if (storedAuth) {
    // Check if the stored auth is still valid (not expired)
    const isValid = storedAuth.timestamp && 
      (new Date().getTime() - new Date(storedAuth.timestamp).getTime()) < (24 * 60 * 60 * 1000); // 24 hours
    
    if (isValid) {
      authState.set(storedAuth);
    } else {
      // Clear expired auth
      clearAuth();
    }
  }
}

// Set up automatic saving when auth state changes
authState.subscribe((state) => {
  saveAuthToLocalStorage(state);
});

// Actions
export function setAuth(token: string): void {
  const newState: AuthState = {
    isAuthenticated: true,
    token,
    timestamp: new Date().toISOString()
  };
  
  authState.set(newState);
  console.log('Authentication set for token:', token);
}

export function clearAuth(): void {
  const newState: AuthState = {
    isAuthenticated: false,
    token: null,
    timestamp: null
  };
  
  authState.set(newState);
  
  // Also clear from localStorage
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear auth from localStorage:', error);
  }
  
  console.log('Authentication cleared');
}

// OSM Auth library actions
export function login(): void {
  if (osmAuthInstance) {
    console.log('🔐 Initiating OSM login...');
    // Call authenticate() with a callback function as required by the API
    osmAuthInstance.authenticate(function(err: Error | null, result: unknown) {
      if (err) {
        console.error('❌ Login failed:', err);
        handleAuthError(err);
      } else {
        console.log('✅ Login successful:', result);
        // Get token directly from localStorage since token function is not exposed
        const accessToken = localStorage.getItem('https://www.openstreetmap.orgoauth2_access_token');
        if (accessToken) {
          setAuth(accessToken.replace(/"/g, '')); // Remove quotes as per osm-auth source
        }
      }
    });
  } else {
    console.error('❌ osm-auth not initialized');
  }
}

export function logout(): void {
  if (osmAuthInstance) {
    console.log('🚪 Initiating OSM logout...');
    osmAuthInstance.logout();
    clearAuth();
  } else {
    console.error('❌ osm-auth not initialized');
  }
}

export function getOsmAuthInstance(): any {
  return osmAuthInstance;
}

// Handle auth error event
function handleAuthError(error: Error | unknown): void {
  console.error('Authentication error:', error);
  clearAuth();
}

// Utility functions
export function getAuthToken(): string | null {
  return authState.get().token;
}

export function getAuthUser(): { id: number | null; username: string | null } | null {
  return null; // User information is not stored
}

export function hasValidAuth(): boolean {
  const state = authState.get();
  if (!state.isAuthenticated || !state.timestamp) {
    return false;
  }
  
  // Check if auth is not expired (24 hours)
  const now = new Date().getTime();
  const authTime = new Date(state.timestamp).getTime();
  return (now - authTime) < (24 * 60 * 60 * 1000);
}

// Debug function
export function debugAuthState(): void {
  console.log('=== OSM Auth Store Debug ===');
  console.log('Current state:', authState.get());
  console.log('localStorage:', loadAuthFromLocalStorage());
  console.log('Has valid auth:', hasValidAuth());
  console.log('osm-auth instance:', osmAuthInstance);
}

// Initialize auth state and osm-auth library on module load
initializeAuthState();
initializeOsmAuth(); 