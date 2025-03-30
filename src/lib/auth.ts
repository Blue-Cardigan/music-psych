export const AUTH_COOKIE_NAME = 'spotify_access_token';

export function getAccessToken(): string | null {
  // Try to get from sessionStorage first (faster)
  const sessionToken = sessionStorage.getItem(AUTH_COOKIE_NAME);
  if (sessionToken) {
    return sessionToken;
  }

  // Then try to get from cookie
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${AUTH_COOKIE_NAME}=`));
  if (tokenCookie) {
    const token = tokenCookie.split('=')[1];
    // Store in sessionStorage for future use
    sessionStorage.setItem(AUTH_COOKIE_NAME, token);
    return token;
  }
  return null;
}

export function setAccessToken(token: string) {
  // Set in sessionStorage for client-side access
  sessionStorage.setItem(AUTH_COOKIE_NAME, token);
}

export function removeAccessToken() {
  // Remove from sessionStorage
  sessionStorage.removeItem(AUTH_COOKIE_NAME);
}

export function isAuthenticated(): boolean {
  // Check if we have a token in sessionStorage
  return !!sessionStorage.getItem(AUTH_COOKIE_NAME);
}

// Helper to check if we're in the initial redirect state
export function isInitialRedirect(): boolean {
  return window.location.pathname === '/' && window.location.search.includes('code=');
} 