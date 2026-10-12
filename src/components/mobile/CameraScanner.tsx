import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useCameraScanner } from '../../hooks/mobile/useCameraScanner';

const CameraScanner: React.FC = () => {
  const {
    isLoading,
    error,
    lastResult,
    takePhoto,
    scanDocument,
    scanQRCode,
    scanBusinessCard,
    pickImage,
    saveToGallery,
    requestPermissions,
    hasPermissions,
    clearError,
    clearResult,
    isSupported,
  } = useCameraScanner();

  const [showResult, setShowResult] = useState(false);

  // Handle scan action
  const handleScan = async (scanType: 'photo' | 'document' | 'qr' | 'business_card') => {
    try {
      // Check permissions first
      const hasPerms = await hasPermissions();
      if (!hasPerms) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert('Permission Required', 'Camera permission is required to use this feature.');
          return;
        }
      }

      let result;
      switch (scanType) {
        case 'photo':
          result = await takePhoto();
          break;
        case 'document':
          result = await scanDocument();
          break;
        case 'qr':
          result = await scanQRCode();
          break;
        case 'business_card':
          result = await scanBusinessCard();
          break;
      }

      if (result?.success) {
        setShowResult(true);
        Alert.alert('Success', `${scanType.charAt(0).toUpperCase() + scanType.slice(1)} captured successfully!`);
      } else if (result?.error) {
        Alert.alert('Error', result.error);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to perform scan operation');
    }
  };

  // Handle pick image from gallery
  const handlePickImage = async () => {
    try {
      const result = await pickImage();
      if (result?.success) {
        setShowResult(true);
        Alert.alert('Success', 'Image picked successfully!');
      } else if (result?.error) {
        Alert.alert('Error', result.error);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // Handle save to gallery
  const handleSaveToGallery = async () => {
    if (!lastResult?.imageUri) {
      Alert.alert('Error', 'No image to save');
      return;
    }

    try {
      const success = await saveToGallery(lastResult.imageUri);
      if (success) {
        Alert.alert('Success', 'Image saved to gallery!');
      } else {
        Alert.alert('Error', 'Failed to save image to gallery');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to save image to gallery');
    }
  };

  // Clear result
  const handleClearResult = () => {
    setShowResult(false);
    clearResult();
    clearError();
  };

  // Get scan type icon
  const getScanTypeIcon = (type: string) => {
    switch (type) {
      case 'photo': return '📸';
      case 'document': return '📄';
      case 'qr': return '📱';
      case 'business_card': return '💼';
      default: return '📷';
    }
  };

  // Get scan type title
  const getScanTypeTitle = (type: string) => {
    switch (type) {
      case 'photo': return 'Take Photo';
      case 'document': return 'Scan Document';
      case 'qr': return 'Scan QR Code';
      case 'business_card': return 'Scan Business Card';
      default: return 'Scan';
    }
  };

  // Get scan type description
  const getScanTypeDescription = (type: string) => {
    switch (type) {
      case 'photo': return 'Capture a photo using camera';
      case 'document': return 'Scan documents and receipts';
      case 'qr': return 'Scan QR codes and barcodes';
      case 'business_card': return 'Scan business cards for contacts';
      default: return 'Use camera to scan';
    }
  };

  if (!isSupported()) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Camera Scanner</Text>
          <Text style={styles.subtitle}>Not supported on this platform</Text>
        </View>
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedText}>
            Camera scanning is only available on iOS and Android devices.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Camera Scanner</Text>
        <Text style={styles.subtitle}>
          Capture photos, scan documents, and more
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearError}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scan Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scan Options</Text>
        
        {['photo', 'document', 'qr', 'business_card'].map((scanType) => (
          <TouchableOpacity
            key={scanType}
            style={styles.scanOption}
            onPress={() => handleScan(scanType as any)}
            disabled={isLoading}
          >
            <Text style={styles.scanIcon}>{getScanTypeIcon(scanType)}</Text>
            <View style={styles.scanInfo}>
              <Text style={styles.scanTitle}>{getScanTypeTitle(scanType)}</Text>
              <Text style={styles.scanDescription}>{getScanTypeDescription(scanType)}</Text>
            </View>
            {isLoading && <ActivityIndicator size="small" color="#3182ce" />}
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.scanOption}
          onPress={handlePickImage}
          disabled={isLoading}
        >
          <Text style={styles.scanIcon}>🖼️</Text>
          <View style={styles.scanInfo}>
            <Text style={styles.scanTitle}>Pick from Gallery</Text>
            <Text style={styles.scanDescription}>Select image from photo gallery</Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color="#3182ce" />}
        </TouchableOpacity>
      </View>

      {/* Scan Result */}
      {showResult && lastResult && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan Result</Text>
          
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultType}>
                {getScanTypeIcon(lastResult.type)} {getScanTypeTitle(lastResult.type)}
              </Text>
              <Text style={styles.resultTime}>
                {new Date(lastResult.timestamp).toLocaleTimeString()}
              </Text>
            </View>

            {lastResult.imageUri && (
              <Image
                source={{ uri: lastResult.imageUri }}
                style={styles.resultImage}
                resizeMode="contain"
              />
            )}

            {lastResult.data && (
              <View style={styles.resultData}>
                <Text style={styles.resultDataTitle}>Extracted Data:</Text>
                {Object.entries(lastResult.data).map(([key, value]) => (
                  <Text key={key} style={styles.resultDataItem}>
                    <Text style={styles.resultDataKey}>{key}:</Text> {String(value)}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.resultActions}>
              {lastResult.imageUri && (
                <TouchableOpacity
                  style={[styles.resultButton, styles.saveButton]}
                  onPress={handleSaveToGallery}
                >
                  <Text style={styles.resultButtonText}>Save to Gallery</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.resultButton, styles.clearButton]}
                onPress={handleClearResult}
              >
                <Text style={styles.resultButtonText}>Clear Result</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Help Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help</Text>
        
        <Text style={styles.helpText}>
          • <Text style={styles.helpBold}>Take Photo:</Text> Capture high-quality photos{'\n'}
          • <Text style={styles.helpBold}>Scan Document:</Text> Optimized for documents and receipts{'\n'}
          • <Text style={styles.helpBold}>Scan QR Code:</Text> Read QR codes and barcodes{'\n'}
          • <Text style={styles.helpBold}>Scan Business Card:</Text> Extract contact information{'\n'}
          • <Text style={styles.helpBold}>Pick from Gallery:</Text> Select existing images{'\n'}
          • All scans are processed locally for privacy
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#c53030',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  scanOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scanIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  scanInfo: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 4,
  },
  scanDescription: {
    fontSize: 14,
    color: '#718096',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
  },
  resultTime: {
    fontSize: 14,
    color: '#718096',
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultData: {
    marginBottom: 16,
  },
  resultDataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  resultDataItem: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  resultDataKey: {
    fontWeight: '500',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#3182ce',
  },
  resultButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: '600',
    color: '#2d3748',
  },
});

export default CameraScanner;
