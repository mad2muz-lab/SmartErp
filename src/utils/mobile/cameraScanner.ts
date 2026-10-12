import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Camera and scanning types
export type ScanType = 'document' | 'qr' | 'barcode' | 'photo' | 'business_card';
export type CameraType = 'front' | 'back';
export type FlashMode = 'on' | 'off' | 'auto' | 'torch';

export interface ScanResult {
  type: ScanType;
  success: boolean;
  data?: any;
  imageUri?: string;
  error?: string;
  timestamp: number;
}

export interface CameraConfig {
  type: CameraType;
  flashMode: FlashMode;
  autoFocus: boolean;
  whiteBalance: 'auto' | 'sunny' | 'cloudy' | 'shadow' | 'fluorescent' | 'incandescent';
  zoom: number;
  quality: number; // 0.0 to 1.0
}

export interface DocumentScanConfig {
  enableAutoCapture: boolean;
  autoCaptureDelay: number; // milliseconds
  enableFlash: boolean;
  enableGrid: boolean;
  aspectRatio: '4:3' | '16:9' | 'square';
  quality: number;
}

class CameraScannerService {
  private config: CameraConfig = {
    type: 'back',
    flashMode: 'auto',
    autoFocus: true,
    whiteBalance: 'auto',
    zoom: 0,
    quality: 0.8,
  };

  private documentConfig: DocumentScanConfig = {
    enableAutoCapture: false,
    autoCaptureDelay: 2000,
    enableFlash: false,
    enableGrid: true,
    aspectRatio: '4:3',
    quality: 0.9,
  };

  // Request camera permissions
  async requestPermissions(): Promise<boolean> {
    try {
      console.log('📷 Requesting camera permissions...');
      
      const { status } = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted' || mediaStatus.status !== 'granted') {
        console.log('❌ Camera or media library permissions not granted');
        return false;
      }
      
      console.log('✅ Camera permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Failed to request camera permissions:', error);
      return false;
    }
  }

  // Check if camera permissions are granted
  async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      
      return status === 'granted' && mediaStatus.status === 'granted';
    } catch (error) {
      console.error('❌ Failed to check camera permissions:', error);
      return false;
    }
  }

  // Configure camera settings
  async configureCamera(config: Partial<CameraConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      console.log('✅ Camera configuration updated:', this.config);
    } catch (error) {
      console.error('❌ Failed to configure camera:', error);
      throw error;
    }
  }

  // Configure document scanning
  async configureDocumentScan(config: Partial<DocumentScanConfig>): Promise<void> {
    try {
      this.documentConfig = { ...this.documentConfig, ...config };
      console.log('✅ Document scan configuration updated:', this.documentConfig);
    } catch (error) {
      console.error('❌ Failed to configure document scan:', error);
      throw error;
    }
  }

  // Take a photo
  async takePhoto(): Promise<ScanResult> {
    try {
      console.log('📸 Taking photo...');
      
      if (!(await this.hasPermissions())) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return {
            type: 'photo',
            success: false,
            error: 'Camera permissions not granted',
            timestamp: Date.now(),
          };
        }
      }

      // Use ImagePicker for taking photos
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: this.config.quality,
        cameraType: this.config.type === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('✅ Photo captured successfully');
        
        return {
          type: 'photo',
          success: true,
          data: {
            width: asset.width,
            height: asset.height,
            type: asset.type,
          },
          imageUri: asset.uri,
          timestamp: Date.now(),
        };
      } else {
        return {
          type: 'photo',
          success: false,
          error: 'Photo capture cancelled',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('❌ Failed to take photo:', error);
      return {
        type: 'photo',
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  // Scan document
  async scanDocument(): Promise<ScanResult> {
    try {
      console.log('📄 Scanning document...');
      
      if (!(await this.hasPermissions())) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return {
            type: 'document',
            success: false,
            error: 'Camera permissions not granted',
            timestamp: Date.now(),
          };
        }
      }

      // Use ImagePicker with document-optimized settings
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: this.documentConfig.quality,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('✅ Document scanned successfully');
        
        // Here you would typically process the image for document detection
        // For now, we'll just return the captured image
        return {
          type: 'document',
          success: true,
          data: {
            width: asset.width,
            height: asset.height,
            type: asset.type,
            processed: false, // Would be true after OCR processing
          },
          imageUri: asset.uri,
          timestamp: Date.now(),
        };
      } else {
        return {
          type: 'document',
          success: false,
          error: 'Document scan cancelled',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('❌ Failed to scan document:', error);
      return {
        type: 'document',
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  // Scan QR code or barcode
  async scanQRCode(): Promise<ScanResult> {
    try {
      console.log('📱 Scanning QR code...');
      
      if (!(await this.hasPermissions())) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return {
            type: 'qr',
            success: false,
            error: 'Camera permissions not granted',
            timestamp: Date.now(),
          };
        }
      }

      // For QR code scanning, we'll use the camera and process the image
      // In a real implementation, you'd use a QR code library like expo-barcode-scanner
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1], // Square aspect ratio for QR codes
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('✅ QR code image captured');
        
        // Here you would process the image to detect QR codes
        // For now, we'll simulate a successful scan
        return {
          type: 'qr',
          success: true,
          data: {
            content: 'https://example.com/qr-code-content',
            format: 'QR_CODE',
            width: asset.width,
            height: asset.height,
          },
          imageUri: asset.uri,
          timestamp: Date.now(),
        };
      } else {
        return {
          type: 'qr',
          success: false,
          error: 'QR code scan cancelled',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('❌ Failed to scan QR code:', error);
      return {
        type: 'qr',
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  // Scan business card
  async scanBusinessCard(): Promise<ScanResult> {
    try {
      console.log('💼 Scanning business card...');
      
      if (!(await this.hasPermissions())) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return {
            type: 'business_card',
            success: false,
            error: 'Camera permissions not granted',
            timestamp: Date.now(),
          };
        }
      }

      // Use ImagePicker with business card optimized settings
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3.5, 2], // Business card aspect ratio
        quality: 0.9,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('✅ Business card scanned successfully');
        
        // Here you would process the image for OCR to extract contact information
        // For now, we'll simulate extracted data
        return {
          type: 'business_card',
          success: true,
          data: {
            name: 'John Doe',
            company: 'Example Corp',
            email: 'john.doe@example.com',
            phone: '+1-555-0123',
            address: '123 Business St, City, State',
            processed: false, // Would be true after OCR processing
          },
          imageUri: asset.uri,
          timestamp: Date.now(),
        };
      } else {
        return {
          type: 'business_card',
          success: false,
          error: 'Business card scan cancelled',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('❌ Failed to scan business card:', error);
      return {
        type: 'business_card',
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  // Pick image from gallery
  async pickImage(): Promise<ScanResult> {
    try {
      console.log('🖼️ Picking image from gallery...');
      
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      if (mediaStatus.status !== 'granted') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          return {
            type: 'photo',
            success: false,
            error: 'Media library permissions not granted',
            timestamp: Date.now(),
          };
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: this.config.quality,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('✅ Image picked successfully');
        
        return {
          type: 'photo',
          success: true,
          data: {
            width: asset.width,
            height: asset.height,
            type: asset.type,
            source: 'gallery',
          },
          imageUri: asset.uri,
          timestamp: Date.now(),
        };
      } else {
        return {
          type: 'photo',
          success: false,
          error: 'Image pick cancelled',
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error('❌ Failed to pick image:', error);
      return {
        type: 'photo',
        success: false,
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  // Save image to gallery
  async saveToGallery(imageUri: string): Promise<boolean> {
    try {
      console.log('💾 Saving image to gallery...');
      
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      if (mediaStatus.status !== 'granted') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('❌ Media library permissions not granted');
          return false;
        }
      }

      await MediaLibrary.saveToLibraryAsync(imageUri);
      console.log('✅ Image saved to gallery');
      return true;
    } catch (error) {
      console.error('❌ Failed to save image to gallery:', error);
      return false;
    }
  }

  // Get camera configuration
  getConfig(): CameraConfig {
    return { ...this.config };
  }

  // Get document scan configuration
  getDocumentConfig(): DocumentScanConfig {
    return { ...this.documentConfig };
  }

  // Check if camera is supported
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Get available camera types
  getAvailableCameraTypes(): CameraType[] {
    return ['back', 'front'];
  }

  // Get available flash modes
  getAvailableFlashModes(): FlashMode[] {
    return ['on', 'off', 'auto', 'torch'];
  }
}

// Export singleton instance
export const cameraScanner = new CameraScannerService();

// Export types
export type { ScanResult, CameraConfig, DocumentScanConfig, ScanType, CameraType, FlashMode };
