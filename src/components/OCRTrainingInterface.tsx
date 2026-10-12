import React, { useState, useRef } from 'react';
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
  Grid,
  GridItem,
  Heading,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FiUpload, FiX, FiCheck, FiCamera, FiBookOpen, FiSave } from 'react-icons/fi';
import { OCRService, BusinessCardData } from '../utils/ocrService';

interface TrainingSample {
  id: string;
  imageFile: File;
  imagePreview: string;
  extractedText: string;
  correctedData: BusinessCardData;
  timestamp: number;
}

interface OCRTrainingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const OCRTrainingInterface: React.FC<OCRTrainingInterfaceProps> = ({
  isOpen,
  onClose,
}) => {
  const [trainingSamples, setTrainingSamples] = useState<TrainingSample[]>([]);
  const [currentSample, setCurrentSample] = useState<TrainingSample | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (file) {
        console.log('Training file selected:', file.name, 'Size:', file.size, 'Type:', file.type);
        
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
        
        await processTrainingImage(file);
      } else {
        setError('No file selected');
      }
    } catch (error) {
      console.error('Training file upload error:', error);
      setError(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processTrainingImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      console.log('Processing training image...');
      
      // Create image preview
      const imagePreview = await fileToBase64(file);
      
      // Get raw text from OCR service
      const ocrService = OCRService.getInstance();
      const extractedText = await ocrService.getRawText(file);
      
      // Create new training sample
      const newSample: TrainingSample = {
        id: Date.now().toString(),
        imageFile: file,
        imagePreview,
        extractedText,
        correctedData: {
          companyName: '',
          contactPerson: '',
          title: '',
          email: '',
          phone: '',
          mobile: '',
          website: '',
          address: '',
          vatNumber: '',
          crNumber: ''
        },
        timestamp: Date.now()
      };
      
      setTrainingSamples(prev => [...prev, newSample]);
      setCurrentSample(newSample);
      
      console.log('Training sample created successfully');
    } catch (err) {
      console.error('Training image processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process training image');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleCorrectedDataChange = (field: keyof BusinessCardData, value: string) => {
    if (currentSample) {
      setCurrentSample({
        ...currentSample,
        correctedData: {
          ...currentSample.correctedData,
          [field]: value
        }
      });
    }
  };

  const saveTrainingSample = () => {
    if (currentSample) {
      setTrainingSamples(prev => 
        prev.map(sample => 
          sample.id === currentSample.id ? currentSample : sample
        )
      );
      
      // Here you would typically save to a database or local storage
      console.log('Training sample saved:', currentSample);
      
      // Add to OCR service training data
      const ocrService = OCRService.getInstance();
      ocrService.addTrainingSample(currentSample.extractedText, currentSample.correctedData);
      
      setCurrentSample(null);
    }
  };

  const removeTrainingSample = (id: string) => {
    setTrainingSamples(prev => prev.filter(sample => sample.id !== id));
    
    // Remove from OCR service training data
    const ocrService = OCRService.getInstance();
    ocrService.removeTrainingSample(id);
    
    if (currentSample?.id === id) {
      setCurrentSample(null);
    }
  };

  const handleClose = () => {
    setCurrentSample(null);
    setError(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiBookOpen} />
            <Text>OCR Training Interface</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Upload Section */}
            <Card>
              <CardBody>
                <VStack spacing={4}>
                  <Heading size="md">Upload Business Card for Training</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Upload a business card image and manually correct the extracted data to train the OCR system.
                  </Text>
                  
                  <Button
                    leftIcon={<Icon as={FiUpload} />}
                    onClick={() => fileInputRef.current?.click()}
                    colorScheme="blue"
                    isLoading={isProcessing}
                    loadingText="Processing..."
                  >
                    Upload Business Card
                  </Button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  
                  {error && (
                    <Alert status="error">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Training Samples List */}
            {trainingSamples.length > 0 && (
              <Card>
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="md">Training Samples ({trainingSamples.length})</Heading>
                    
                    <List spacing={3} width="100%">
                      {trainingSamples.map((sample) => (
                        <ListItem key={sample.id}>
                          <Card variant="outline">
                            <CardBody>
                              <HStack justify="space-between" align="start">
                                <VStack align="start" flex={1}>
                                  <HStack>
                                    <Text fontWeight="bold">{sample.imageFile.name}</Text>
                                    <Badge colorScheme="green">Training Sample</Badge>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600">
                                    Company: {sample.correctedData.companyName || 'Not labeled'}
                                  </Text>
                                  <Text fontSize="sm" color="gray.600">
                                    Contact: {sample.correctedData.contactPerson || 'Not labeled'}
                                  </Text>
                                </VStack>
                                
                                <HStack>
                                  <Button
                                    size="sm"
                                    onClick={() => setCurrentSample(sample)}
                                    leftIcon={<Icon as={FiCheck} />}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="outline"
                                    onClick={() => removeTrainingSample(sample.id)}
                                    leftIcon={<Icon as={FiX} />}
                                  >
                                    Remove
                                  </Button>
                                </HStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        </ListItem>
                      ))}
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            )}

            {/* Data Correction Interface */}
            {currentSample && (
              <Card>
                <CardBody>
                  <VStack spacing={6}>
                    <Heading size="md">Correct Extracted Data</Heading>
                    
                    <Grid templateColumns="repeat(2, 1fr)" gap={6} width="100%">
                      {/* Image Preview */}
                      <GridItem>
                        <VStack spacing={4}>
                          <Text fontWeight="bold">Business Card Image</Text>
                          <Box
                            border="1px solid"
                            borderColor={borderColor}
                            borderRadius="md"
                            overflow="hidden"
                            maxWidth="300px"
                          >
                            <img
                              src={currentSample.imagePreview}
                              alt="Business Card"
                              style={{ width: '100%', height: 'auto' }}
                            />
                          </Box>
                        </VStack>
                      </GridItem>

                      {/* Extracted Text */}
                      <GridItem>
                        <VStack spacing={4}>
                          <Text fontWeight="bold">Extracted Text</Text>
                          <Textarea
                            value={currentSample.extractedText}
                            readOnly
                            height="200px"
                            fontSize="sm"
                          />
                        </VStack>
                      </GridItem>
                    </Grid>

                    <Divider />

                    {/* Data Correction Form */}
                    <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                      <FormControl>
                        <FormLabel>Company Name</FormLabel>
                        <Input
                          value={currentSample.correctedData.companyName}
                          onChange={(e) => handleCorrectedDataChange('companyName', e.target.value)}
                          placeholder="Enter correct company name"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Contact Person</FormLabel>
                        <Input
                          value={currentSample.correctedData.contactPerson}
                          onChange={(e) => handleCorrectedDataChange('contactPerson', e.target.value)}
                          placeholder="Enter correct contact person name"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Title</FormLabel>
                        <Input
                          value={currentSample.correctedData.title}
                          onChange={(e) => handleCorrectedDataChange('title', e.target.value)}
                          placeholder="Enter correct job title"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                          value={currentSample.correctedData.email}
                          onChange={(e) => handleCorrectedDataChange('email', e.target.value)}
                          placeholder="Enter correct email address"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Mobile</FormLabel>
                        <Input
                          value={currentSample.correctedData.mobile}
                          onChange={(e) => handleCorrectedDataChange('mobile', e.target.value)}
                          placeholder="Enter correct mobile number"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          value={currentSample.correctedData.phone}
                          onChange={(e) => handleCorrectedDataChange('phone', e.target.value)}
                          placeholder="Enter correct phone number"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Website</FormLabel>
                        <Input
                          value={currentSample.correctedData.website}
                          onChange={(e) => handleCorrectedDataChange('website', e.target.value)}
                          placeholder="Enter correct website"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>VAT Number</FormLabel>
                        <Input
                          value={currentSample.correctedData.vatNumber}
                          onChange={(e) => handleCorrectedDataChange('vatNumber', e.target.value)}
                          placeholder="Enter correct VAT number"
                        />
                      </FormControl>

                      <GridItem colSpan={2}>
                        <FormControl>
                          <FormLabel>Address</FormLabel>
                          <Textarea
                            value={currentSample.correctedData.address}
                            onChange={(e) => handleCorrectedDataChange('address', e.target.value)}
                            placeholder="Enter correct address"
                            rows={3}
                          />
                        </FormControl>
                      </GridItem>
                    </Grid>

                    <HStack spacing={4}>
                      <Button
                        leftIcon={<Icon as={FiSave} />}
                        colorScheme="green"
                        onClick={saveTrainingSample}
                      >
                        Save Training Sample
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentSample(null)}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={handleClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OCRTrainingInterface;
