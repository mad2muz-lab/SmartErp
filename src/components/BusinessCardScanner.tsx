import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  useColorModeValue,
  Icon,
  Divider,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiCamera, FiUpload, FiX, FiCheck, FiBookOpen } from 'react-icons/fi';
import Webcam from 'react-webcam';
import { OCRService, BusinessCardData } from '../utils/ocrService';
import OCRTrainingInterface from './OCRTrainingInterface';

interface BusinessCardScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataExtracted: (data: BusinessCardData) => void;
  title?: string;
}

const BusinessCardScanner: React.FC<BusinessCardScannerProps> = ({
  isOpen,
  onClose,
  onDataExtracted,
  title = 'Scan Business Card',
}) => {
  const [mode, setMode] = useState<'select' | 'camera' | 'upload'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Training interface
  const {
    isOpen: isTrainingOpen,
    onOpen: onTrainingOpen,
    onClose: onTrainingClose,
  } = useDisclosure();

  const handleCameraCapture = useCallback(async () => {
    try {
      if (webcamRef.current) {
        console.log('Capturing image from camera...');
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          console.log('Image captured successfully');
          await processImageFromBase64(imageSrc);
        } else {
          setError('Failed to capture image from camera');
        }
      } else {
        setError('Camera not available');
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      setError(`Camera capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          setError('Please select a valid image file');
          return;
        }
        
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError('File size must be less than 10MB');
          return;
        }
        
        await processImageFile(file);
      } else {
        setError('No file selected');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setError(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processImageFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('Starting OCR processing...');
      const ocrService = OCRService.getInstance();
      const result = await ocrService.processImage(file);
      
      console.log('OCR processing completed successfully');
      
      // Auto-fill the form directly
      handleDataProcessed(result);
    } catch (err) {
      console.error('OCR processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const processImageFromBase64 = async (base64Data: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('Converting base64 to file...');
      
      // Create a canvas to process the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise<void>((resolve, reject) => {
        img.onload = async () => {
          try {
            // Set canvas size
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas
            ctx?.drawImage(img, 0, 0);
            
            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
              if (blob) {
                const file = new File([blob], 'business-card.jpg', { type: 'image/jpeg' });
                console.log('Base64 conversion completed');
                await processImageFile(file);
                resolve();
              } else {
                reject(new Error('Failed to convert image to blob'));
              }
            }, 'image/jpeg', 0.8);
          } catch (err) {
            reject(err);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        // Set image source
        img.src = base64Data;
      });
    } catch (err) {
      console.error('Base64 conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-fill data directly into the form
  const handleDataProcessed = (data: BusinessCardData) => {
    onDataExtracted(data);
    handleClose();
  };

  const handleClose = () => {
    setMode('select');
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  };

  const handleCameraMode = async () => {
    const hasPermission = await checkCameraPermission();
    if (hasPermission) {
      setMode('camera');
      setError(null);
    } else {
      setError('Camera permission denied. Please allow camera access and try again.');
    }
  };

  const handleUploadMode = () => {
    setMode('upload');
    setError(null);
    fileInputRef.current?.click();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack justify="space-between">
              <Text>{title}</Text>
              <Button
                leftIcon={<Icon as={FiBookOpen} />}
                size="sm"
                colorScheme="purple"
                variant="outline"
                onClick={onTrainingOpen}
              >
                Train OCR
              </Button>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {mode === 'select' && (
                <Card>
                  <CardBody>
                    <VStack spacing={6}>
                      <Text fontSize="lg" fontWeight="bold">
                        Choose how to scan your business card
                      </Text>
                      
                      <HStack spacing={4} width="100%">
                        <Button
                          leftIcon={<Icon as={FiCamera} />}
                          colorScheme="blue"
                          size="lg"
                          flex={1}
                          onClick={handleCameraMode}
                        >
                          Use Camera
                        </Button>
                        
                        <Button
                          leftIcon={<Icon as={FiUpload} />}
                          colorScheme="green"
                          size="lg"
                          flex={1}
                          onClick={handleUploadMode}
                        >
                          Upload Image
                        </Button>
                      </HStack>
                      
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {mode === 'camera' && (
                <Card>
                  <CardBody>
                    <VStack spacing={4}>
                      <Text fontSize="lg" fontWeight="bold">
                        Capture Business Card
                      </Text>
                      
                      <Box
                        border="2px solid"
                        borderColor={borderColor}
                        borderRadius="lg"
                        overflow="hidden"
                        position="relative"
                        width="100%"
                        maxWidth="500px"
                      >
                        <Webcam
                          ref={webcamRef}
                          screenshotFormat="image/jpeg"
                          width="100%"
                          height="auto"
                          videoConstraints={{
                            width: 1280,
                            height: 720,
                            facingMode: 'environment'
                          }}
                        />
                      </Box>
                      
                      <HStack spacing={4}>
                        <Button
                          leftIcon={<Icon as={FiCamera} />}
                          colorScheme="blue"
                          onClick={handleCameraCapture}
                          isLoading={isProcessing}
                          loadingText="Processing..."
                        >
                          Capture & Process
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => setMode('select')}
                        >
                          Back
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {isProcessing && (
                <Card>
                  <CardBody>
                    <VStack spacing={4}>
                      <Spinner size="lg" color="blue.500" />
                      <Text>Processing business card...</Text>
                      <Text fontSize="sm" color="gray.600">
                        This may take a few seconds
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error}
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button onClick={handleClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Training Interface */}
      <OCRTrainingInterface
        isOpen={isTrainingOpen}
        onClose={onTrainingClose}
      />
    </>
  );
};

export default BusinessCardScanner;
