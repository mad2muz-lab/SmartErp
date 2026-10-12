import { useState, useCallback } from 'react';
import { cameraScanner, ScanResult, CameraConfig, DocumentScanConfig } from '../../utils/mobile/cameraScanner';

export const useCameraScanner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  // Take a photo
  const takePhoto = useCallback(async (): Promise<ScanResult | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await cameraScanner.takePhoto();
      setLastResult(result);
      
      if (!result.success) {
        setError(result.error || 'Failed to take photo');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to take photo';
      setError(errorMessage);
      return {
        type: 'photo',
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Scan document
  const scanDocument = useCallback(async (): Promise<ScanResult | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await cameraScanner.scanDocument();
      setLastResult(result);
      
      if (!result.success) {
        setError(result.error || 'Failed to scan document');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to scan document';
      setError(errorMessage);
      return {
        type: 'document',
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Scan QR code
  const scanQRCode = useCallback(async (): Promise<ScanResult | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await cameraScanner.scanQRCode();
      setLastResult(result);
      
      if (!result.success) {
        setError(result.error || 'Failed to scan QR code');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to scan QR code';
      setError(errorMessage);
      return {
        type: 'qr',
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Scan business card
  const scanBusinessCard = useCallback(async (): Promise<ScanResult | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await cameraScanner.scanBusinessCard();
      setLastResult(result);
      
      if (!result.success) {
        setError(result.error || 'Failed to scan business card');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to scan business card';
      setError(errorMessage);
      return {
        type: 'business_card',
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Pick image from gallery
  const pickImage = useCallback(async (): Promise<ScanResult | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await cameraScanner.pickImage();
      setLastResult(result);
      
      if (!result.success) {
        setError(result.error || 'Failed to pick image');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Failed to pick image';
      setError(errorMessage);
      return {
        type: 'photo',
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save image to gallery
  const saveToGallery = useCallback(async (imageUri: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await cameraScanner.saveToGallery(imageUri);
      
      if (!success) {
        setError('Failed to save image to gallery');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err.message || 'Failed to save image to gallery';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Configure camera
  const configureCamera = useCallback(async (config: Partial<CameraConfig>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cameraScanner.configureCamera(config);
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to configure camera';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Configure document scanning
  const configureDocumentScan = useCallback(async (config: Partial<DocumentScanConfig>): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cameraScanner.configureDocumentScan(config);
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to configure document scan';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const granted = await cameraScanner.requestPermissions();
      
      if (!granted) {
        setError('Camera permissions not granted');
      }
      
      return granted;
    } catch (err) {
      const errorMessage = err.message || 'Failed to request permissions';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check permissions
  const hasPermissions = useCallback(async (): Promise<boolean> => {
    try {
      return await cameraScanner.hasPermissions();
    } catch (err) {
      setError(err.message || 'Failed to check permissions');
      return false;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear last result
  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  // Get camera configuration
  const getConfig = useCallback((): CameraConfig => {
    return cameraScanner.getConfig();
  }, []);

  // Get document scan configuration
  const getDocumentConfig = useCallback((): DocumentScanConfig => {
    return cameraScanner.getDocumentConfig();
  }, []);

  // Check if camera is supported
  const isSupported = useCallback((): boolean => {
    return cameraScanner.isSupported();
  }, []);

  // Get available camera types
  const getAvailableCameraTypes = useCallback(() => {
    return cameraScanner.getAvailableCameraTypes();
  }, []);

  // Get available flash modes
  const getAvailableFlashModes = useCallback(() => {
    return cameraScanner.getAvailableFlashModes();
  }, []);

  return {
    // State
    isLoading,
    error,
    lastResult,
    
    // Actions
    takePhoto,
    scanDocument,
    scanQRCode,
    scanBusinessCard,
    pickImage,
    saveToGallery,
    configureCamera,
    configureDocumentScan,
    requestPermissions,
    hasPermissions,
    clearError,
    clearResult,
    
    // Configuration
    getConfig,
    getDocumentConfig,
    isSupported,
    getAvailableCameraTypes,
    getAvailableFlashModes,
  };
};
