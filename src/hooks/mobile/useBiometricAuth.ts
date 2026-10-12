import { useState, useEffect, useCallback } from 'react';
import { biometricAuth, BiometricStatus, BiometricConfig } from '../../utils/mobile/biometricAuth';

export const useBiometricAuth = () => {
  const [status, setStatus] = useState<BiometricStatus>({
    isAvailable: false,
    isEnrolled: false,
    supportedTypes: [],
    strength: 'none',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<BiometricConfig>(biometricAuth.getConfig());

  // Initialize biometric authentication
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const biometricStatus = await biometricAuth.initialize();
        setStatus(biometricStatus);
        
        if (biometricStatus.error) {
          setError(biometricStatus.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Authenticate user
  const authenticate = useCallback(async (
    reason?: string,
    options?: {
      fallbackTitle?: string;
      cancelTitle?: string;
      disableDeviceFallback?: boolean;
    }
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await biometricAuth.authenticate(reason, options);
      
      if (success) {
        await biometricAuth.markAuthenticated();
      }
      
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enable biometric authentication
  const enable = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await biometricAuth.enable();
      setConfig(biometricAuth.getConfig());
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disable biometric authentication
  const disable = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await biometricAuth.disable();
      setConfig(biometricAuth.getConfig());
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Configure biometric authentication
  const configure = useCallback(async (newConfig: Partial<BiometricConfig>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await biometricAuth.configure(newConfig);
      setConfig(biometricAuth.getConfig());
      
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if user is authenticated
  const isAuthenticated = useCallback(async (): Promise<boolean> => {
    try {
      return await biometricAuth.isAuthenticated();
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  // Clear authentication
  const clearAuthentication = useCallback(async (): Promise<void> => {
    try {
      await biometricAuth.clearAuthentication();
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Get biometric name for current platform
  const getBiometricName = useCallback((): string => {
    return biometricAuth.getBiometricName();
  }, []);

  // Check if biometric is supported
  const isSupported = useCallback((): boolean => {
    return biometricAuth.isSupported();
  }, []);

  // Refresh status
  const refreshStatus = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const biometricStatus = await biometricAuth.getStatus();
      setStatus(biometricStatus);
      
      if (biometricStatus.error) {
        setError(biometricStatus.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    status,
    config,
    isLoading,
    error,
    
    // Actions
    authenticate,
    enable,
    disable,
    configure,
    isAuthenticated,
    clearAuthentication,
    getBiometricName,
    isSupported,
    refreshStatus,
    
    // Computed values
    isAvailable: status.isAvailable,
    isEnrolled: status.isEnrolled,
    isEnabled: config.enabled,
    supportedTypes: status.supportedTypes,
    strength: status.strength,
  };
};
