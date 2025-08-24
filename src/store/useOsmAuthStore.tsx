import { useStore } from '@nanostores/react';
import {
  authState,
  isAuthenticated,
  authToken,
  authTimestamp,
  setAuth,
  clearAuth,
  login,
  logout,
  getOsmAuthInstance,
  getAuthToken,
  getAuthUser,
  hasValidAuth,
  debugAuthState
} from './osmAuthStore';

// React hook for OSM authentication
export function useOsmAuth() {
  const state = useStore(authState);
  const authenticated = useStore(isAuthenticated);
  const token = useStore(authToken);
  const timestamp = useStore(authTimestamp);

  return {
    // State
    state,
    isAuthenticated: authenticated,
    token,
    timestamp,
    
    // Actions
    setAuth,
    clearAuth,
    login,
    logout,
    
    // Utility functions
    getOsmAuthInstance,
    getAuthToken,
    getAuthUser,
    hasValidAuth,
    debugAuthState
  };
}

// Hook for just the authentication status
export function useOsmAuthStatus() {
  const authenticated = useStore(isAuthenticated);
  const hasValid = hasValidAuth();
  
  return {
    isAuthenticated: authenticated,
    hasValidAuth: hasValid
  };
}

// Hook for just the auth token
export function useOsmAuthToken() {
  const token = useStore(authToken);
  
  return {
    token,
    getAuthToken
  };
}

// Hook for auth actions
export function useOsmAuthActions() {
  return {
    login,
    logout,
    setAuth,
    clearAuth,
    getOsmAuthInstance
  };
} 