// Platform detection utilities - Web-safe implementation
const detectPlatform = (): 'web' | 'ios' | 'android' => {
  // Check if we're in a web environment
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    return 'web';
  }
  
  // For mobile environments, we'll need to detect differently
  // This will be handled by React Native's Platform when available
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    if (/android/i.test(navigator.userAgent)) {
      return 'android';
    }
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      return 'ios';
    }
  }

  // Fallback to web if React Native is not available or we're in web environment
  return 'web';
};

export const isWeb = detectPlatform() === 'web';
export const isIOS = detectPlatform() === 'ios';
export const isAndroid = detectPlatform() === 'android';
export const isMobile = !isWeb;

// Get current platform
export const getPlatform = (): 'web' | 'ios' | 'android' => {
  return detectPlatform();
};

// Platform-specific imports
export const importPlatformSpecific = async <T>(
  moduleName: string,
  fallbackModule?: string
): Promise<T> => {
  const platform = getPlatform();
  
  try {
    // Try platform-specific module first
    const module = await import(/* @vite-ignore */ `../${platform}/${moduleName}`);
    return module.default || module;
  } catch (error) {
    // Fallback to web module or specified fallback
    if (fallbackModule) {
      const fallback = await import(/* @vite-ignore */ `../${fallbackModule}/${moduleName}`);
      return fallback.default || fallback;
    }
    
    // Default fallback to web
    if (platform !== 'web') {
      const webModule = await import(/* @vite-ignore */ `../web/${moduleName}`);
      return webModule.default || webModule;
    }
    
    throw new Error(`Module ${moduleName} not found for platform ${platform}`);
  }
};

// Platform-specific storage
export const getStorage = () => {
  // Always use localStorage for web builds to avoid React Native dependencies
  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail in environments where localStorage is not available
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail
      }
    },
    clear: () => {
      try {
        localStorage.clear();
      } catch {
        // Silently fail
      }
    },
  };
};

// Platform-specific navigation
export const getNavigationType = () => {
  return isWeb ? 'web' : 'mobile';
};

// Platform-specific UI components
export const getUIProvider = () => {
  return isWeb ? 'chakra' : 'nativebase';
};

// Platform-specific features
export const getPlatformFeatures = () => {
  return {
    biometricAuth: isMobile,
    camera: isMobile,
    fileSystem: isMobile,
    pushNotifications: isMobile,
    offlineStorage: true,
    realTimeSync: true,
  };
};

// Platform-specific constants
export const PLATFORM_CONSTANTS = {
  web: {
    minTouchTarget: 44,
    defaultFontSize: 16,
    borderRadius: 8,
  },
  mobile: {
    minTouchTarget: 44,
    defaultFontSize: 16,
    borderRadius: 8,
  },
} as const;

// Get platform-specific constants
export const getPlatformConstants = () => {
  return PLATFORM_CONSTANTS[isWeb ? 'web' : 'mobile'];
};

// Platform-specific validation
export const validatePlatformSupport = (feature: string): boolean => {
  const features = getPlatformFeatures();
  return features[feature as keyof typeof features] || false;
};

// Platform-specific error handling
export const handlePlatformError = (error: Error, context: string) => {
  console.error(`[${getPlatform()}] Error in ${context}:`, error);
  
  if (isWeb) {
    // Web-specific error handling
    console.error('Web error details:', error.stack);
  } else {
    // Mobile-specific error handling
    console.error('Mobile error details:', error.message);
  }
};
