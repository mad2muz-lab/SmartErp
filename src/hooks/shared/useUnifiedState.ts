import React from 'react';
import { useAppState } from '../../contexts/shared/AppStateContext';
import { useAuth } from '../../contexts/shared/AuthContext';
import { isWeb, getStorage } from '../../utils/shared/platform';
import { offlineStorage, PendingChange } from '../../utils/shared/offlineStorage';

/**
 * Enhanced unified hook for managing data with comprehensive offline support
 */
export const useUnifiedData = <T>(
  key: string,
  serverData: T[],
  options: {
    offlineSupport?: boolean;
    syncOnConnect?: boolean;
    autoSync?: boolean;
  } = {}
) => {
  const [localData, setLocalData] = React.useState<T[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isOffline, setIsOffline] = React.useState(false);
  const [pendingChangesCount, setPendingChangesCount] = React.useState(0);
  const { selectedOrganization, user } = useAuth();
  const storage = getStorage();

  // Initialize offline storage
  React.useEffect(() => {
    offlineStorage.initialize();
  }, []);

  // Monitor online status and pending changes
  React.useEffect(() => {
    const checkStatus = () => {
      const online = offlineStorage.isOnline();
      const pendingCount = offlineStorage.getPendingChangesCount();
      setIsOffline(!online);
      setPendingChangesCount(pendingCount);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Initialize with server data or offline data
  React.useEffect(() => {
    const initializeData = async () => {
      if (serverData && serverData.length > 0 && !isOffline) {
        // Online: use server data and store offline
        setLocalData(serverData);
        if (options.offlineSupport && selectedOrganization) {
          await offlineStorage.storeOfflineData(key, serverData, selectedOrganization);
        }
      } else if (isOffline) {
        // Offline: load from offline storage
        const offlineData = await offlineStorage.getOfflineDataForKey(key);
        if (offlineData.length > 0) {
          setLocalData(offlineData);
        }
      }
    };

    initializeData();
  }, [serverData, isOffline, key, options.offlineSupport, selectedOrganization]);

  // Auto-sync when coming back online
  React.useEffect(() => {
    if (!isOffline && options.syncOnConnect && pendingChangesCount > 0) {
      console.log('🔄 Auto-syncing pending changes...');
      offlineStorage.triggerSync();
    }
  }, [isOffline, options.syncOnConnect, pendingChangesCount]);

  // Enhanced data operations with offline support
  const addItem = React.useCallback(async (item: T) => {
    const newData = [...localData, item];
    setLocalData(newData);

    if (options.offlineSupport && selectedOrganization && user) {
      await offlineStorage.addPendingChange({
        type: 'create',
        entity: key,
        data: item,
        organization_id: selectedOrganization,
        user_id: user._id,
        maxRetries: 3,
      });
    }
  }, [localData, key, options.offlineSupport, selectedOrganization, user]);

  const updateItem = React.useCallback(async (id: string, updates: Partial<T>) => {
    const newData = localData.map(item => 
      (item as any)._id === id ? { ...item, ...updates } : item
    );
    setLocalData(newData);

    if (options.offlineSupport && selectedOrganization && user) {
      await offlineStorage.addPendingChange({
        type: 'update',
        entity: key,
        data: { id, updates },
        organization_id: selectedOrganization,
        user_id: user._id,
        maxRetries: 3,
      });
    }
  }, [localData, key, options.offlineSupport, selectedOrganization, user]);

  const removeItem = React.useCallback(async (id: string) => {
    const newData = localData.filter(item => (item as any)._id !== id);
    setLocalData(newData);

    if (options.offlineSupport && selectedOrganization && user) {
      await offlineStorage.addPendingChange({
        type: 'delete',
        entity: key,
        data: { id },
        organization_id: selectedOrganization,
        user_id: user._id,
        maxRetries: 3,
      });
    }
  }, [localData, key, options.offlineSupport, selectedOrganization, user]);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isOffline) {
        // Offline refresh: load from offline storage
        const offlineData = await offlineStorage.getOfflineDataForKey(key);
        setLocalData(offlineData);
      } else {
        // Online refresh: trigger sync and reload
        await offlineStorage.triggerSync();
        // Server data will be updated via useEffect
      }
      setIsLoading(false);
    } catch (error) {
      setError('Failed to refresh data');
      setIsLoading(false);
    }
  }, [isOffline, key]);

  const manualSync = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await offlineStorage.triggerSync();
      setIsLoading(false);
    } catch (error) {
      setError('Failed to sync data');
      setIsLoading(false);
    }
  }, []);

  return {
    data: localData,
    setData: setLocalData,
    isLoading,
    error,
    isOffline,
    pendingChangesCount,
    refresh,
    addItem,
    updateItem,
    removeItem,
    manualSync,
  };
};

/**
 * Unified hook for managing form state with validation
 */
export const useUnifiedForm = <T extends Record<string, any>>(
  initialData: T,
  validationSchema?: any
) => {
  const { actions } = useAppState();
  const [data, setData] = React.useState<T>(initialData);
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({});
  const [isValidating, setIsValidating] = React.useState(false);

  // Validate form data
  const validate = async (): Promise<boolean> => {
    if (!validationSchema) return true;

    setIsValidating(true);
    try {
      await validationSchema.validate(data, { abortEarly: false });
      setErrors({});
      return true;
    } catch (validationError: any) {
      const newErrors: Partial<Record<keyof T, string>> = {};
      validationError.inner.forEach((error: any) => {
        newErrors[error.path as keyof T] = error.message;
      });
      setErrors(newErrors);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Update form field
  const updateField = (field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Reset form
  const reset = () => {
    setData(initialData);
    setErrors({});
  };

  // Submit form with validation
  const submit = async (onSubmit: (data: T) => Promise<void>) => {
    const isValid = await validate();
    if (isValid) {
      try {
        await onSubmit(data);
        return true;
      } catch (error) {
        actions.addError({
          message: 'Form submission failed',
          type: 'error',
        });
        return false;
      }
    }
    return false;
  };

  return {
    data,
    errors,
    isValidating,
    updateField,
    validate,
    reset,
    submit,
  };
};

/**
 * Unified hook for managing loading states
 */
export const useUnifiedLoading = () => {
  const { state, actions } = useAppState();

  const setLoading = (loading: boolean) => {
    actions.setLoading(loading);
  };

  const withLoading = async <T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await asyncFn();
      return result;
    } finally {
      setLoading(false);
    }
  };

  return {
    isLoading: state.isLoading,
    setLoading,
    withLoading,
  };
};

/**
 * Unified hook for managing notifications
 */
export const useUnifiedNotifications = () => {
  const { state, actions } = useAppState();

  const updateSettings = (settings: Partial<typeof state.notifications>) => {
    actions.updateNotifications(settings);
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    // Add to error state for now (can be enhanced with actual notifications)
    actions.addError({
      message,
      type,
    });
  };

  return {
    settings: state.notifications,
    updateSettings,
    showNotification,
  };
};

/**
 * Unified hook for managing theme and language
 */
export const useUnifiedSettings = () => {
  const { state, actions } = useAppState();

  const setTheme = (theme: 'light' | 'dark') => {
    actions.setTheme(theme);
  };

  const setLanguage = (language: 'en' | 'ar') => {
    actions.setLanguage(language);
  };

  const toggleTheme = () => {
    actions.setTheme(state.theme === 'light' ? 'dark' : 'light');
  };

  return {
    theme: state.theme,
    language: state.language,
    setTheme,
    setLanguage,
    toggleTheme,
  };
};

/**
 * Hook for offline status and sync management
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [pendingChangesCount, setPendingChangesCount] = React.useState(0);
  const [lastSyncTime, setLastSyncTime] = React.useState<number | null>(null);

  React.useEffect(() => {
    const checkStatus = () => {
      const online = offlineStorage.isOnline();
      const pendingCount = offlineStorage.getPendingChangesCount();
      const status = offlineStorage.getOfflineStatus();
      
      setIsOnline(online);
      setPendingChangesCount(pendingCount);
      setLastSyncTime(status.lastSyncAttempt);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = React.useCallback(async () => {
    await offlineStorage.triggerSync();
  }, []);

  const getOfflineStatus = React.useCallback(() => {
    return offlineStorage.getOfflineStatus();
  }, []);

  return {
    isOnline,
    pendingChangesCount,
    lastSyncTime,
    triggerSync,
    getOfflineStatus,
  };
};
