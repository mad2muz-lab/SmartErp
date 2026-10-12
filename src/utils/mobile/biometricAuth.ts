import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Biometric authentication types
export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';
export type BiometricStrength = 'strong' | 'weak' | 'none';

export interface BiometricConfig {
  enabled: boolean;
  type: BiometricType;
  strength: BiometricStrength;
  fallbackEnabled: boolean;
  fallbackTitle?: string;
  cancelTitle?: string;
  promptMessage?: string;
}

export interface BiometricStatus {
  isAvailable: boolean;
  isEnrolled: boolean;
  supportedTypes: BiometricType[];
  strength: BiometricStrength;
  error?: string;
}

class BiometricAuthService {
  private config: BiometricConfig = {
    enabled: false,
    type: 'none',
    strength: 'none',
    fallbackEnabled: true,
    fallbackTitle: 'Use Passcode',
    cancelTitle: 'Cancel',
    promptMessage: 'Authenticate to continue',
  };

  // Initialize biometric authentication
  async initialize(): Promise<BiometricStatus> {
    try {
      console.log('🔐 Initializing biometric authentication...');
      
      // Check if biometric authentication is available
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!isAvailable) {
        console.log('❌ Biometric hardware not available');
        return {
          isAvailable: false,
          isEnrolled: false,
          supportedTypes: [],
          strength: 'none',
          error: 'Biometric hardware not available',
        };
      }

      if (!isEnrolled) {
        console.log('⚠️ No biometric authentication enrolled');
        return {
          isAvailable: true,
          isEnrolled: false,
          supportedTypes: [],
          strength: 'none',
          error: 'No biometric authentication enrolled',
        };
      }

      // Get supported authentication types
      const supportedTypes = await this.getSupportedTypes();
      const strength = this.getBiometricStrength(supportedTypes);

      // Load saved configuration
      await this.loadConfig();

      console.log('✅ Biometric authentication initialized:', {
        isAvailable,
        isEnrolled,
        supportedTypes,
        strength,
      });

      return {
        isAvailable: true,
        isEnrolled: true,
        supportedTypes,
        strength,
      };
    } catch (error) {
      console.error('❌ Failed to initialize biometric authentication:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        strength: 'none',
        error: error.message,
      };
    }
  }

  // Get supported biometric types
  private async getSupportedTypes(): Promise<BiometricType[]> {
    const types: BiometricType[] = [];
    
    try {
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      for (const type of supportedTypes) {
        switch (type) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            types.push('fingerprint');
            break;
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            types.push('face');
            break;
          case LocalAuthentication.AuthenticationType.IRIS:
            types.push('iris');
            break;
        }
      }
    } catch (error) {
      console.error('❌ Failed to get supported types:', error);
    }

    return types;
  }

  // Determine biometric strength
  private getBiometricStrength(types: BiometricType[]): BiometricStrength {
    if (types.includes('iris')) return 'strong';
    if (types.includes('face')) return 'strong';
    if (types.includes('fingerprint')) return 'weak';
    return 'none';
  }

  // Configure biometric authentication
  async configure(config: Partial<BiometricConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      await this.saveConfig();
      console.log('✅ Biometric configuration updated:', this.config);
    } catch (error) {
      console.error('❌ Failed to configure biometric authentication:', error);
      throw error;
    }
  }

  // Authenticate user
  async authenticate(
    reason: string = 'Please authenticate to continue',
    options: {
      fallbackTitle?: string;
      cancelTitle?: string;
      disableDeviceFallback?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      if (!this.config.enabled) {
        console.log('⚠️ Biometric authentication is disabled');
        return false;
      }

      console.log('🔐 Starting biometric authentication...');

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackTitle: options.fallbackTitle || this.config.fallbackTitle,
        cancelTitle: options.cancelTitle || this.config.cancelTitle,
        disableDeviceFallback: options.disableDeviceFallback || false,
      });

      if (result.success) {
        console.log('✅ Biometric authentication successful');
        return true;
      } else {
        console.log('❌ Biometric authentication failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Biometric authentication error:', error);
      return false;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      // For now, we'll use a simple check
      // In a real app, you might want to implement session management
      const lastAuth = await SecureStore.getItemAsync('last-biometric-auth');
      if (!lastAuth) return false;

      const lastAuthTime = parseInt(lastAuth);
      const now = Date.now();
      const sessionTimeout = 30 * 60 * 1000; // 30 minutes

      return (now - lastAuthTime) < sessionTimeout;
    } catch (error) {
      console.error('❌ Failed to check authentication status:', error);
      return false;
    }
  }

  // Mark user as authenticated
  async markAuthenticated(): Promise<void> {
    try {
      await SecureStore.setItemAsync('last-biometric-auth', Date.now().toString());
      console.log('✅ User marked as authenticated');
    } catch (error) {
      console.error('❌ Failed to mark user as authenticated:', error);
    }
  }

  // Clear authentication
  async clearAuthentication(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('last-biometric-auth');
      console.log('✅ Authentication cleared');
    } catch (error) {
      console.error('❌ Failed to clear authentication:', error);
    }
  }

  // Get current configuration
  getConfig(): BiometricConfig {
    return { ...this.config };
  }

  // Get biometric status
  async getStatus(): Promise<BiometricStatus> {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await this.getSupportedTypes();
      const strength = this.getBiometricStrength(supportedTypes);

      return {
        isAvailable,
        isEnrolled,
        supportedTypes,
        strength,
      };
    } catch (error) {
      console.error('❌ Failed to get biometric status:', error);
      return {
        isAvailable: false,
        isEnrolled: false,
        supportedTypes: [],
        strength: 'none',
        error: error.message,
      };
    }
  }

  // Enable biometric authentication
  async enable(): Promise<void> {
    try {
      const status = await this.getStatus();
      if (!status.isAvailable || !status.isEnrolled) {
        throw new Error('Biometric authentication not available or not enrolled');
      }

      this.config.enabled = true;
      await this.saveConfig();
      console.log('✅ Biometric authentication enabled');
    } catch (error) {
      console.error('❌ Failed to enable biometric authentication:', error);
      throw error;
    }
  }

  // Disable biometric authentication
  async disable(): Promise<void> {
    try {
      this.config.enabled = false;
      await this.saveConfig();
      console.log('✅ Biometric authentication disabled');
    } catch (error) {
      console.error('❌ Failed to disable biometric authentication:', error);
      throw error;
    }
  }

  // Save configuration to secure storage
  private async saveConfig(): Promise<void> {
    try {
      await SecureStore.setItemAsync('biometric-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('❌ Failed to save biometric config:', error);
    }
  }

  // Load configuration from secure storage
  private async loadConfig(): Promise<void> {
    try {
      const saved = await SecureStore.getItemAsync('biometric-config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('❌ Failed to load biometric config:', error);
    }
  }

  // Get platform-specific biometric name
  getBiometricName(): string {
    if (Platform.OS === 'ios') {
      if (this.config.type === 'face') return 'Face ID';
      if (this.config.type === 'fingerprint') return 'Touch ID';
      return 'Biometric Authentication';
    } else {
      if (this.config.type === 'face') return 'Face Recognition';
      if (this.config.type === 'fingerprint') return 'Fingerprint';
      return 'Biometric Authentication';
    }
  }

  // Check if biometric is supported on current platform
  isSupported(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }
}

// Export singleton instance
export const biometricAuth = new BiometricAuthService();

// Export types
export type { BiometricConfig, BiometricStatus, BiometricType, BiometricStrength };
