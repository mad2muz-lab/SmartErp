// Web-safe platform detection
const detectPlatform = (): 'web' | 'ios' | 'android' => {
  // Check if we're in a web environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web';
  }

  // For mobile environments, detect from user agent
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    if (/android/i.test(navigator.userAgent)) {
      return 'android';
    }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      return 'ios';
    }
  }

  // Fallback to web
  return 'web';
};

// Platform-specific OAuth configuration
export const getAuthConfig = () => {
  const platform = detectPlatform();
  const isWeb = platform === 'web';

  if (isWeb) {
    // Web configuration
    const envRedirectUri = import.meta.env.VITE_AUTH_REDIRECT_URI;
    const envAppUrl = import.meta.env.VITE_APP_URL;
    
    // For local development, use the current port
    if (!envRedirectUri || envRedirectUri.includes('localhost')) {
      const currentPort = window.location.port || '3000';
      return {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        redirectUri: `http://localhost:${currentPort}/auth/callback`,
        appUrl: `http://localhost:${currentPort}`,
      };
    }
    
    // For production, use environment variables
    return {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: envRedirectUri || 'http://localhost:3000/auth/callback',
      appUrl: envAppUrl || 'http://localhost:3000',
    };
  } else {
    // Mobile configuration
    return {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      redirectUri: 'tradingerp://auth/callback', // Custom scheme for mobile
      appUrl: 'tradingerp://', // Custom scheme
    };
  }
};

// OAuth scopes
export const OAUTH_SCOPES = [
  'openid',
  'email', 
  'profile'
];

// OAuth parameters
export const getOAuthParams = () => {
  const config = getAuthConfig();
  
  return {
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  };
};

// Platform detection
const currentPlatform = detectPlatform();
export const isMobile = currentPlatform !== 'web';
export const isWeb = currentPlatform === 'web';
export const isIOS = currentPlatform === 'ios';
export const isAndroid = currentPlatform === 'android';

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// API endpoints
export const getApiConfig = () => {
  const config = getAuthConfig();
  
  return {
    convexUrl: import.meta.env.VITE_CONVEX_URL || '',
    appUrl: config.appUrl,
    redirectUri: config.redirectUri,
  };
};
