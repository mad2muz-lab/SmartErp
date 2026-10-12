import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useBiometricAuth } from '../../hooks/mobile/useBiometricAuth';

const BiometricAuthSettings: React.FC = () => {
  const {
    status,
    config,
    isLoading,
    error,
    authenticate,
    enable,
    disable,
    configure,
    getBiometricName,
    isSupported,
    refreshStatus,
  } = useBiometricAuth();

  // Handle enable/disable toggle
  const handleToggleBiometric = async () => {
    if (config.enabled) {
      Alert.alert(
        'Disable Biometric Authentication',
        'Are you sure you want to disable biometric authentication?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              const success = await disable();
              if (success) {
                Alert.alert('Success', 'Biometric authentication has been disabled');
              } else {
                Alert.alert('Error', 'Failed to disable biometric authentication');
              }
            },
          },
        ]
      );
    } else {
      // First authenticate to enable
      const authenticated = await authenticate(
        'Authenticate to enable biometric login',
        { fallbackTitle: 'Use Passcode' }
      );
      
      if (authenticated) {
        const success = await enable();
        if (success) {
          Alert.alert('Success', 'Biometric authentication has been enabled');
        } else {
          Alert.alert('Error', 'Failed to enable biometric authentication');
        }
      }
    }
  };

  // Test biometric authentication
  const handleTestBiometric = async () => {
    const authenticated = await authenticate(
      'Test biometric authentication',
      { fallbackTitle: 'Use Passcode' }
    );
    
    if (authenticated) {
      Alert.alert('Success', 'Biometric authentication test successful!');
    } else {
      Alert.alert('Failed', 'Biometric authentication test failed');
    }
  };

  // Get strength color
  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return '#38a169';
      case 'weak': return '#d69e2e';
      default: return '#718096';
    }
  };

  // Get strength text
  const getStrengthText = (strength: string) => {
    switch (strength) {
      case 'strong': return 'Strong';
      case 'weak': return 'Weak';
      default: return 'None';
    }
  };

  if (!isSupported()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Biometric Authentication</Text>
          <Text style={styles.subtitle}>Not supported on this platform</Text>
        </View>
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedText}>
            Biometric authentication is only available on iOS and Android devices.
          </Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Biometric Authentication</Text>
          <Text style={styles.subtitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3182ce" />
          <Text style={styles.loadingText}>Checking biometric availability...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Biometric Authentication</Text>
        <Text style={styles.subtitle}>
          Secure your app with {getBiometricName()}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Available:</Text>
          <Text style={[styles.statusValue, { color: status.isAvailable ? '#38a169' : '#e53e3e' }]}>
            {status.isAvailable ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Enrolled:</Text>
          <Text style={[styles.statusValue, { color: status.isEnrolled ? '#38a169' : '#e53e3e' }]}>
            {status.isEnrolled ? 'Yes' : 'No'}
          </Text>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Strength:</Text>
          <Text style={[styles.statusValue, { color: getStrengthColor(status.strength) }]}>
            {getStrengthText(status.strength)}
          </Text>
        </View>
        
        {status.supportedTypes.length > 0 && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Supported:</Text>
            <Text style={styles.statusValue}>
              {status.supportedTypes.join(', ')}
            </Text>
          </View>
        )}
      </View>

      {/* Configuration Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configuration</Text>
        
        <View style={styles.configRow}>
          <View style={styles.configInfo}>
            <Text style={styles.configLabel}>Enable Biometric Login</Text>
            <Text style={styles.configDescription}>
              Use {getBiometricName()} to quickly access your account
            </Text>
          </View>
          <Switch
            value={config.enabled}
            onValueChange={handleToggleBiometric}
            trackColor={{ false: '#e2e8f0', true: '#3182ce' }}
            thumbColor={config.enabled ? '#ffffff' : '#f4f3f4'}
            disabled={!status.isAvailable || !status.isEnrolled}
          />
        </View>
        
        {config.enabled && (
          <View style={styles.configRow}>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>Fallback to Passcode</Text>
              <Text style={styles.configDescription}>
                Allow fallback to device passcode if biometric fails
              </Text>
            </View>
            <Switch
              value={config.fallbackEnabled}
              onValueChange={(value) => configure({ fallbackEnabled: value })}
              trackColor={{ false: '#e2e8f0', true: '#3182ce' }}
              thumbColor={config.fallbackEnabled ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        )}
      </View>

      {/* Actions Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Actions</Text>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.testButton]}
          onPress={handleTestBiometric}
          disabled={!config.enabled}
        >
          <Text style={styles.actionButtonText}>Test Authentication</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.refreshButton]}
          onPress={refreshStatus}
        >
          <Text style={styles.actionButtonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>

      {/* Help Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Help</Text>
        
        <Text style={styles.helpText}>
          • Biometric authentication provides secure, convenient access to your account{'\n'}
          • Your biometric data is stored securely on your device{'\n'}
          • You can always fall back to your device passcode{'\n'}
          • This feature requires biometric authentication to be set up on your device
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  errorContainer: {
    backgroundColor: '#fed7d7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  unsupportedText: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#718096',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    color: '#4a5568',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  configInfo: {
    flex: 1,
    marginRight: 16,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d3748',
    marginBottom: 4,
  },
  configDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#3182ce',
  },
  refreshButton: {
    backgroundColor: '#38a169',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
});

export default BiometricAuthSettings;
