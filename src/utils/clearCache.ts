// Utility function to clear all cached data and prevent stale security messages
export const clearAllCachedData = async (): Promise<void> => {
  try {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear browser cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Clear IndexedDB if available
    if ('indexedDB' in window) {
      const databases = await indexedDB.databases();
      databases.forEach(db => {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
        }
      });
    }
    
    // Force reload of current page to ensure fresh content
    if (typeof window !== 'undefined') {
      // Add a timestamp to force cache refresh
      const url = new URL(window.location.href);
      url.searchParams.set('_t', Date.now().toString());
      window.location.href = url.toString();
    }
    
    console.log('✅ All cached data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing cached data:', error);
  }
};

// Function to clear specific security-related cached data
export const clearSecurityCache = (): void => {
  try {
    // Remove specific security-related items
    localStorage.removeItem('trading-erp-user');
    localStorage.removeItem('trading-erp-organization');
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-session');
    
    // Clear any cached authentication data
    sessionStorage.removeItem('auth-state');
    sessionStorage.removeItem('user-data');
    
    console.log('✅ Security cache cleared');
  } catch (error) {
    console.error('❌ Error clearing security cache:', error);
  }
};

// Function to validate and sanitize user state
export const sanitizeUserState = (state: any): any => {
  if (!state) return null;
  
  // Remove any potentially sensitive information
  const sanitized = { ...state };
  
  // Remove any references to internal system roles
  if (sanitized.message) {
    sanitized.message = sanitized.message
      .replace(/global admin/gi, 'administrator')
      .replace(/system administrator/gi, 'support')
      .replace(/IT department/gi, 'support team');
  }
  
  return sanitized;
};
