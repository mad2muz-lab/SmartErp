import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { isWeb, getStorage } from '../../utils/shared/platform';

// Global application state interface
interface AppState {
  // UI State
  isLoading: boolean;
  isOnline: boolean;
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  
  // Navigation State
  currentRoute: string;
  previousRoute: string;
  
  // Data State
  lastSyncTime: number;
  pendingChanges: any[];
  offlineData: any[];
  
  // Settings State
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
  };
  
  // Cache State
  cacheExpiry: number;
  cacheSize: number;
  
  // Error State
  errors: Array<{
    id: string;
    message: string;
    timestamp: number;
    type: 'error' | 'warning' | 'info';
  }>;
}

// Actions interface
interface AppStateActions {
  // UI Actions
  setLoading: (loading: boolean) => void;
  setOnline: (online: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'ar') => void;
  
  // Navigation Actions
  setCurrentRoute: (route: string) => void;
  
  // Data Actions
  setLastSyncTime: (time: number) => void;
  addPendingChange: (change: any) => void;
  removePendingChange: (id: string) => void;
  addOfflineData: (data: any) => void;
  clearOfflineData: () => void;
  
  // Settings Actions
  updateNotifications: (settings: Partial<AppState['notifications']>) => void;
  
  // Cache Actions
  setCacheExpiry: (expiry: number) => void;
  setCacheSize: (size: number) => void;
  
  // Error Actions
  addError: (error: Omit<AppState['errors'][0], 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  
  // Utility Actions
  resetState: () => void;
  syncState: () => Promise<void>;
}

// Combined context type
interface AppStateContextType {
  state: AppState;
  actions: AppStateActions;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Default state
const defaultState: AppState = {
  isLoading: false,
  isOnline: navigator.onLine,
  theme: 'light',
  language: 'en',
  currentRoute: '/',
  previousRoute: '/',
  lastSyncTime: Date.now(),
  pendingChanges: [],
  offlineData: [],
  notifications: {
    enabled: true,
    sound: true,
    vibration: true,
  },
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  cacheSize: 0,
  errors: [],
};

// Storage keys
const STORAGE_KEYS = {
  APP_STATE: 'trading-erp-app-state',
  THEME: 'trading-erp-theme',
  LANGUAGE: 'trading-erp-language',
  NOTIFICATIONS: 'trading-erp-notifications',
  OFFLINE_DATA: 'trading-erp-offline-data',
  PENDING_CHANGES: 'trading-erp-pending-changes',
  LAST_SYNC: 'trading-erp-last-sync',
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const storage = getStorage();

  // Load state from storage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        // Load individual settings from storage
        const savedTheme = isWeb 
          ? localStorage.getItem(STORAGE_KEYS.THEME) 
          : await storage.getItem(STORAGE_KEYS.THEME);
        
        const savedLanguage = isWeb 
          ? localStorage.getItem(STORAGE_KEYS.LANGUAGE) 
          : await storage.getItem(STORAGE_KEYS.LANGUAGE);
        
        const savedNotifications = isWeb 
          ? localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) 
          : await storage.getItem(STORAGE_KEYS.NOTIFICATIONS);
        
        const savedOfflineData = isWeb 
          ? localStorage.getItem(STORAGE_KEYS.OFFLINE_DATA) 
          : await storage.getItem(STORAGE_KEYS.OFFLINE_DATA);
        
        const savedPendingChanges = isWeb 
          ? localStorage.getItem(STORAGE_KEYS.PENDING_CHANGES) 
          : await storage.getItem(STORAGE_KEYS.PENDING_CHANGES);
        
        const savedLastSync = isWeb 
          ? localStorage.getItem(STORAGE_KEYS.LAST_SYNC) 
          : await storage.getItem(STORAGE_KEYS.LAST_SYNC);

        // Update state with saved values
        setState(prevState => ({
          ...prevState,
          theme: (savedTheme as 'light' | 'dark') || 'light',
          language: (savedLanguage as 'en' | 'ar') || 'en',
          notifications: savedNotifications ? JSON.parse(savedNotifications) : prevState.notifications,
          offlineData: savedOfflineData ? JSON.parse(savedOfflineData) : [],
          pendingChanges: savedPendingChanges ? JSON.parse(savedPendingChanges) : [],
          lastSyncTime: savedLastSync ? parseInt(savedLastSync) : Date.now(),
        }));
      } catch (error) {
        console.error('Error loading app state from storage:', error);
      }
    };

    loadState();
  }, []);

  // Save state to storage when it changes
  useEffect(() => {
    const saveState = async () => {
      try {
        if (isWeb) {
          localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
          localStorage.setItem(STORAGE_KEYS.LANGUAGE, state.language);
          localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(state.notifications));
          localStorage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(state.offlineData));
          localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(state.pendingChanges));
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, state.lastSyncTime.toString());
        } else {
          await storage.setItem(STORAGE_KEYS.THEME, state.theme);
          await storage.setItem(STORAGE_KEYS.LANGUAGE, state.language);
          await storage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(state.notifications));
          await storage.setItem(STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(state.offlineData));
          await storage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(state.pendingChanges));
          await storage.setItem(STORAGE_KEYS.LAST_SYNC, state.lastSyncTime.toString());
        }
      } catch (error) {
        console.error('Error saving app state to storage:', error);
      }
    };

    saveState();
  }, [state.theme, state.language, state.notifications, state.offlineData, state.pendingChanges, state.lastSyncTime]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    if (isWeb) {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (isWeb) {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  // Actions
  const actions: AppStateActions = {
    setLoading: (loading: boolean) => {
      setState(prev => ({ ...prev, isLoading: loading }));
    },

    setOnline: (online: boolean) => {
      setState(prev => ({ ...prev, isOnline: online }));
    },

    setTheme: (theme: 'light' | 'dark') => {
      setState(prev => ({ ...prev, theme }));
    },

    setLanguage: (language: 'en' | 'ar') => {
      setState(prev => ({ ...prev, language }));
    },

    setCurrentRoute: (route: string) => {
      setState(prev => ({ 
        ...prev, 
        previousRoute: prev.currentRoute,
        currentRoute: route 
      }));
    },

    setLastSyncTime: (time: number) => {
      setState(prev => ({ ...prev, lastSyncTime: time }));
    },

    addPendingChange: (change: any) => {
      setState(prev => ({ 
        ...prev, 
        pendingChanges: [...prev.pendingChanges, { ...change, id: Date.now().toString() }] 
      }));
    },

    removePendingChange: (id: string) => {
      setState(prev => ({ 
        ...prev, 
        pendingChanges: prev.pendingChanges.filter(change => change.id !== id) 
      }));
    },

    addOfflineData: (data: any) => {
      setState(prev => ({ 
        ...prev, 
        offlineData: [...prev.offlineData, { ...data, id: Date.now().toString() }] 
      }));
    },

    clearOfflineData: () => {
      setState(prev => ({ ...prev, offlineData: [] }));
    },

    updateNotifications: (settings: Partial<AppState['notifications']>) => {
      setState(prev => ({ 
        ...prev, 
        notifications: { ...prev.notifications, ...settings } 
      }));
    },

    setCacheExpiry: (expiry: number) => {
      setState(prev => ({ ...prev, cacheExpiry: expiry }));
    },

    setCacheSize: (size: number) => {
      setState(prev => ({ ...prev, cacheSize: size }));
    },

    addError: (error: Omit<AppState['errors'][0], 'id' | 'timestamp'>) => {
      const newError = {
        ...error,
        id: Date.now().toString(),
        timestamp: Date.now(),
      };
      setState(prev => ({ 
        ...prev, 
        errors: [...prev.errors, newError] 
      }));
    },

    removeError: (id: string) => {
      setState(prev => ({ 
        ...prev, 
        errors: prev.errors.filter(error => error.id !== id) 
      }));
    },

    clearErrors: () => {
      setState(prev => ({ ...prev, errors: [] }));
    },

    resetState: () => {
      setState(defaultState);
    },

    syncState: async () => {
      try {
        // Sync pending changes with backend
        if (state.pendingChanges.length > 0) {
          console.log('🔄 Syncing pending changes:', state.pendingChanges.length);
          // TODO: Implement actual sync logic with Convex
          setState(prev => ({ 
            ...prev, 
            pendingChanges: [],
            lastSyncTime: Date.now() 
          }));
        }

        // Sync offline data
        if (state.offlineData.length > 0) {
          console.log('🔄 Syncing offline data:', state.offlineData.length);
          // TODO: Implement actual sync logic with Convex
          setState(prev => ({ 
            ...prev, 
            offlineData: [] 
          }));
        }
      } catch (error) {
        console.error('Error syncing state:', error);
        actions.addError({
          message: 'Failed to sync data',
          type: 'error',
        });
      }
    },
  };

  const contextValue: AppStateContextType = {
    state,
    actions,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
};
