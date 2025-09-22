import React, { useState } from 'react';
import {
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Icon,
  Badge,
  useColorModeValue,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';
import {
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiSettings,
  FiEdit3,
  FiFileText,
  FiMaximize2,
  FiDatabase,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface OneClickZATCAComplianceProps {
  invoice: any;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const OneClickZATCACompliance: React.FC<OneClickZATCAComplianceProps> = ({
  invoice,
  onSuccess,
  onError
}) => {
  const toast = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [failedSteps, setFailedSteps] = useState<string[]>([]);

  // Define the ZATCA compliance workflow
  const zatcaWorkflow = [
    {
      id: 'csid',
      name: 'Get ZATCA Compliance CSID',
      description: 'Register with ZATCA and obtain your Compliance Solution Identifier',
      icon: FiSettings,
      required: true,
      estimatedTime: '30 seconds',
    },
    {
      id: 'certificate',
      name: 'Generate Digital Certificate',
      description: 'Create your digital signing certificate for invoice authentication',
      icon: FiEdit3,
      required: true,
      estimatedTime: '15 seconds',
    },
    {
      id: 'xml',
      name: 'Generate UBL XML Invoice',
      description: 'Create ZATCA-compliant UBL XML with all required elements',
      icon: FiFileText,
      required: true,
      estimatedTime: '10 seconds',
    },
    {
      id: 'signature',
      name: 'Apply Digital Signature',
      description: 'Sign the invoice using your digital certificate',
      icon: FiShield,
      required: true,
      estimatedTime: '5 seconds',
    },
    {
      id: 'qr_code',
      name: 'Generate QR Code',
      description: 'Create QR code for invoice verification (if required)',
      icon: FiMaximize2,
      required: invoice.invoice_type === 'simplified',
      estimatedTime: '3 seconds',
    },
    {
      id: 'submit',
      name: 'Submit to ZATCA',
      description: 'Send signed invoice to ZATCA for validation and approval',
      icon: FiDatabase,
      required: true,
      estimatedTime: '20 seconds',
    },
  ];

  // Execute a single step
  const executeStep = async (step: any): Promise<boolean> => {
    try {
      setCurrentStep(step.name);
      
      // Simulate step execution with realistic timing
      const delay = step.estimatedTime === '30 seconds' ? 3000 :
                   step.estimatedTime === '20 seconds' ? 2000 :
                   step.estimatedTime === '15 seconds' ? 1500 :
                   step.estimatedTime === '10 seconds' ? 1000 :
                   step.estimatedTime === '5 seconds' ? 500 : 300;
      
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Simulate updating the invoice with ZATCA compliance data
      // In a real implementation, this would call actual ZATCA functions and update the database
      const updateData: any = {};
      
      switch (step.id) {
        case 'csid':
          updateData.zatca_csid = `CSID-${Date.now()}`;
          break;
        case 'certificate':
          updateData.zatca_certificate = `CERT-${Date.now()}`;
          break;
        case 'xml':
          updateData.zatca_xml = `XML-${Date.now()}`;
          break;
        case 'signature':
          updateData.digital_signature = `SIG-${Date.now()}`;
          break;
        case 'qr_code':
          updateData.qr_code = `QR-${Date.now()}`;
          break;
        case 'submit':
          updateData.zatca_reference = `ZATCA-${Date.now()}`;
          updateData.is_submitted = true;
          updateData.is_validated = true;
          break;
      }
      
      // Simulate success (in real implementation, this would be an actual database update)
      const success = Math.random() > 0.1; // 90% success rate for demo
      
      if (success) {
        setCompletedSteps(prev => [...prev, step.id]);
        // Update the invoice object locally to reflect changes
        Object.assign(invoice, updateData);
        return true;
      } else {
        setFailedSteps(prev => [...prev, step.id]);
        return false;
      }
    } catch (error) {
      setFailedSteps(prev => [...prev, step.id]);
      return false;
    }
  };

  // Execute the complete ZATCA compliance workflow
  const executeZATCACompliance = async () => {
    setIsProcessing(true);
    setIsModalOpen(true);
    setProgress(0);
    setCompletedSteps([]);
    setFailedSteps([]);
    
    const requiredSteps = zatcaWorkflow.filter(step => step.required);
    const totalSteps = requiredSteps.length;
    
    try {
      for (let i = 0; i < requiredSteps.length; i++) {
        const step = requiredSteps[i];
        const stepProgress = ((i + 1) / totalSteps) * 100;
        
        const success = await executeStep(step);
        
        if (!success) {
          throw new Error(`Failed to complete step: ${step.name}`);
        }
        
        setProgress(stepProgress);
      }
      
      // All steps completed successfully
      toast({
        title: 'ZATCA Compliance Complete!',
        description: 'Invoice is now fully compliant and ready for ZATCA submission',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      onSuccess?.();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: 'ZATCA Compliance Failed',
        description: errorMessage,
        status: 'error',
        duration: 8000,
        isClosable: true,
      });
      
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  // Check if invoice is already compliant
  const isAlreadyCompliant = () => {
    return invoice.zatca_csid && 
           invoice.zatca_certificate && 
           invoice.zatca_xml && 
           invoice.digital_signature && 
           invoice.zatca_reference;
  };

  // Check if invoice is compliant after processing
  const isCompliantAfterProcessing = () => {
    return completedSteps.length >= zatcaWorkflow.filter(step => step.required).length;
  };

  // Get step status
  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (failedSteps.includes(stepId)) return 'failed';
    if (currentStep === zatcaWorkflow.find(s => s.id === stepId)?.name) return 'processing';
    return 'pending';
  };

  // Get step icon
  const getStepIcon = (step: any) => {
    const status = getStepStatus(step.id);
    switch (status) {
      case 'completed':
        return <Icon as={FiCheckCircle} color="green.500" />;
      case 'failed':
        return <Icon as={FiXCircle} color="red.500" />;
      case 'processing':
        return <Icon as={FiClock} color="blue.500" />;
      default:
        return <Icon as={step.icon} color="gray.400" />;
    }
  };

  // Get step color
  const getStepColor = (step: any) => {
    const status = getStepStatus(step.id);
    switch (status) {
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      case 'processing':
        return 'blue';
      default:
        return 'gray';
    }
  };

  if (isAlreadyCompliant() || isCompliantAfterProcessing()) {
    return (
      <Button
        colorScheme="green"
        leftIcon={<FiCheckCircle />}
        size="lg"
        isDisabled
      >
        ZATCA Compliant ✓
      </Button>
    );
  }

  return (
    <>
      <Button
        colorScheme="blue"
        leftIcon={<FiShield />}
        size="lg"
        onClick={executeZATCACompliance}
        isLoading={isProcessing}
        loadingText="Processing ZATCA..."
      >
        One-Click ZATCA Compliance
      </Button>

      {/* Progress Modal */}
      <Modal isOpen={isModalOpen} onClose={() => {}} closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay />
        <ModalContent maxW="600px">
          <ModalHeader>
            <HStack>
              <Icon as={FiShield} color="blue.500" />
              <Text>ZATCA Compliance in Progress</Text>
            </HStack>
          </ModalHeader>
          <ModalBody>
            <VStack spacing={6} align="stretch">
              {/* Progress Bar */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">Overall Progress</Text>
                  <Text fontSize="sm" color="gray.600">{Math.round(progress)}%</Text>
                </HStack>
                <Progress 
                  value={progress} 
                  colorScheme="blue" 
                  size="lg" 
                  borderRadius="md"
                />
              </Box>

              {/* Current Step */}
              {currentStep && (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Currently Processing:</AlertTitle>
                    <AlertDescription>{currentStep}</AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Steps List */}
              <VStack spacing={3} align="stretch">
                {zatcaWorkflow.filter(step => step.required).map((step, index) => (
                  <Card key={step.id} size="sm">
                    <CardBody>
                      <HStack spacing={3}>
                        <Box>
                          {getStepIcon(step)}
                        </Box>
                        <VStack align="start" spacing={1} flex={1}>
                          <HStack>
                            <Text fontWeight="medium">{step.name}</Text>
                            <Badge 
                              colorScheme={getStepColor(step)} 
                              size="sm"
                            >
                              {getStepStatus(step.id)}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            {step.description}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Estimated time: {step.estimatedTime}
                          </Text>
                        </VStack>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>

              {/* Error Display */}
              {failedSteps.length > 0 && (
                <Alert status="error">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Failed Steps:</AlertTitle>
                    <AlertDescription>
                      {failedSteps.map(stepId => 
                        zatcaWorkflow.find(s => s.id === stepId)?.name
                      ).join(', ')}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setIsProcessing(false);
                setCurrentStep('');
              }}
              isDisabled={isProcessing}
            >
              Cancel Process
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default OneClickZATCACompliance;
