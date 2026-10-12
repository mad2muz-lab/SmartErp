/**
 * Comprehensive authentication cleanup utilities
 * Use these functions to ensure complete removal of authentication state
 */

export interface CleanupOptions {
  clearLocalStorage?: boolean;
  clearSessionStorage?: boolean;
  clearCookies?: boolean;
  clearCache?: boolean;
  forceReload?: boolean;
}

/**
 * Force clear all authentication-related data
 */
export const forceAuthCleanup = async (options: CleanupOptions = {}): Promise<void> => {
  const {
    clearLocalStorage = true,
    clearSessionStorage = true,
    clearCookies = true,
    clearCache = true,
    forceReload = false
  } = options;

  console.log('🧹 Starting FORCE authentication cleanup...');

  // Clear localStorage
  if (clearLocalStorage) {
    const keysToRemove = [
      'trading-erp-user',
      'trading-erp-organization',
      'google_user',
      'convex-auth-token',
      'convex-session-id'
    ];

    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        console.log(`🗑️ Removing localStorage: ${key}`);
        localStorage.removeItem(key);
      }
    });

    // Also clear any remaining keys that might contain auth data
    Object.keys(localStorage).forEach(key => {
      if (key.includes('auth') || key.includes('user') || key.includes('session') || key.includes('token')) {
        console.log(`🗑️ Removing localStorage: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }

  // Clear sessionStorage
  if (clearSessionStorage) {
    console.log('🗑️ Clearing sessionStorage');
    sessionStorage.clear();
  }

  // Clear cookies
  if (clearCookies) {
    console.log('🗑️ Clearing cookies');
    document.cookie.split(";").forEach(c => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }

  // Clear service worker cache
  if (clearCache && 'serviceWorker' in navigator && 'caches' in window) {
    console.log('🗑️ Clearing service worker caches');
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const cacheNames = await caches.keys();

      // Clear all caches
      await Promise.all(
        cacheNames.map(name => {
          console.log(`🗑️ Deleting cache: ${name}`);
          return caches.delete(name);
        })
      );

      // Unregister service workers if needed
      await Promise.all(
        registrations.map(registration => {
          console.log('🗑️ Unregistering service worker');
          return registration.unregister();
        })
      );
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  console.log('✅ Force authentication cleanup completed');

  // Force page reload if requested
  if (forceReload) {
    console.log('🔄 Reloading page...');
    window.location.href = '/login?clear=true';
  }
};

/**
 * Standard authentication cleanup (less aggressive)
 */
export const standardAuthCleanup = (): void => {
  console.log('🧹 Starting standard authentication cleanup...');

  // Clear specific authentication keys
  const keysToRemove = [
    'trading-erp-user',
    'trading-erp-organization'
  ];

  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️ Removing ${key}`);
      localStorage.removeItem(key);
    }
  });

  // Clear session storage
  sessionStorage.clear();

  console.log('✅ Standard authentication cleanup completed');
};

/**
 * Clear browser storage and redirect to login
 */
export const clearAndRedirect = async (): Promise<void> => {
  await forceAuthCleanup({ forceReload: true });
};

/**
 * Debug function to log current authentication state
 */
export const debugAuthState = (): void => {
  console.group('🔍 Authentication State Debug');

  // Check localStorage
  console.log('📦 localStorage:');
  Object.keys(localStorage).forEach(key => {
    if (key.includes('user') || key.includes('auth') || key.includes('session') || key.includes('token')) {
      console.log(`  ${key}:`, localStorage.getItem(key));
    }
  });

  // Check sessionStorage
  console.log('📦 sessionStorage:');
  Object.keys(sessionStorage).forEach(key => {
    console.log(`  ${key}:`, sessionStorage.getItem(key));
  });

  // Check cookies
  console.log('🍪 Cookies:');
  document.cookie.split(';').forEach(cookie => {
    console.log(`  ${cookie.trim()}`);
  });

  console.groupEnd();
};

/**
 * Check if user is properly logged out
 */
export const isLoggedOut = (): boolean => {
  const user = localStorage.getItem('trading-erp-user');
  const googleUser = localStorage.getItem('google_user');
  return !user && !googleUser;
};
