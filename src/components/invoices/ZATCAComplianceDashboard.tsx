import React, { useState } from 'react';
import {
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
  Button,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Divider,
  Icon,
  Tooltip,
  useColorModeValue,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  useSteps,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  FiSettings,
  FiEdit3,
  FiPrinter,
  FiDownload,
  FiMaximize2,
  FiCode,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertCircle,
  FiShield,
  FiKey,
  FiFileText,
  FiDatabase,
  FiRefreshCw,
} from 'react-icons/fi';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import FormattedCurrencyDisplay from '../FormattedCurrencyDisplay';

interface ZATCAComplianceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const ZATCAComplianceDashboard: React.FC<ZATCAComplianceDashboardProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Define the ZATCA compliance steps
  const steps = [
    {
      title: 'Get ZATCA Compliance CSID',
      description: 'Register with ZATCA and obtain your Compliance Solution Identifier',
      icon: FiSettings,
      color: 'blue',
      required: true,
      status: invoice.zatca_csid ? 'complete' : 'incomplete',
    },
    {
      title: 'Generate Digital Certificate',
      description: 'Create your digital signing certificate for invoice authentication',
      icon: FiEdit3,
      color: 'blue',
      required: true,
      status: invoice.zatca_certificate ? 'complete' : 'incomplete',
    },
    {
      title: 'Create ZATCA Invoice',
      description: 'Generate UBL XML invoice with all required ZATCA elements',
      icon: FiFileText,
      color: 'green',
      required: true,
      status: invoice.zatca_xml ? 'complete' : 'incomplete',
    },
    {
      title: 'Sign Invoice',
      description: 'Apply digital signature using your certificate',
      icon: FiShield,
      color: 'green',
      required: true,
      status: invoice.digital_signature ? 'complete' : 'incomplete',
    },
    {
      title: 'Generate QR Code',
      description: 'Create QR code for invoice verification (simplified invoices)',
      icon: FiMaximize2,
      color: 'green',
      required: invoice.invoice_type === 'simplified',
      status: invoice.qr_code ? 'complete' : 'incomplete',
    },
    {
      title: 'Submit to ZATCA',
      description: 'Send signed invoice to ZATCA for validation and approval',
      icon: FiDatabase,
      color: 'purple',
      required: true,
      status: invoice.zatca_reference ? 'complete' : 'incomplete',
    },
  ];

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  // Calculate compliance percentage
  const completedSteps = steps.filter(step => step.status === 'complete').length;
  const requiredSteps = steps.filter(step => step.required).length;
  const compliancePercentage = Math.round((completedSteps / requiredSteps) * 100);

  // Handle step actions
  const handleStepAction = async (stepIndex: number, action: string) => {
    setIsProcessing(true);
    setSelectedAction(action);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: `${steps[stepIndex].title} Completed`,
        description: `Successfully completed ${action}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Update step status (in real implementation, this would update the database)
      steps[stepIndex].status = 'complete';
      setActiveStep(stepIndex + 1);

    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to complete ${action}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      setSelectedAction(null);
    }
  };

  const getStepIcon = (step: any, index: number) => {
    if (step.status === 'complete') {
      return <Icon as={FiCheckCircle} color="green.500" />;
    } else if (index === activeStep) {
      return <Icon as={FiClock} color="blue.500" />;
    } else {
      return <Icon as={step.icon} color="gray.400" />;
    }
  };

  const getStepColor = (step: any, index: number) => {
    if (step.status === 'complete') {
      return 'green';
    } else if (index === activeStep) {
      return 'blue';
    } else {
      return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <Icon as={FiShield} color="blue.500" />
            <Text>ZATCA Compliance Dashboard</Text>
            <Badge colorScheme={compliancePercentage === 100 ? 'green' : 'orange'} size="lg">
              {compliancePercentage}% Compliant
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Compliance Overview */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="lg">Compliance Overview</Text>
                  <Badge colorScheme={compliancePercentage === 100 ? 'green' : 'orange'}>
                    {completedSteps} of {requiredSteps} Required Steps Complete
                  </Badge>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <Progress 
                    value={compliancePercentage} 
                    colorScheme={compliancePercentage === 100 ? 'green' : 'orange'}
                    size="lg"
                    w="100%"
                  />
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Complete all required steps to achieve ZATCA compliance
                  </Text>
                </VStack>
              </CardBody>
            </Card>

            {/* Invoice Information */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Text fontWeight="bold">Invoice Information</Text>
              </CardHeader>
              <CardBody>
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <GridItem>
                    <Stat>
                      <StatLabel>Invoice Number</StatLabel>
                      <StatNumber fontSize="lg">{invoice.invoice_number || invoice._id}</StatNumber>
                    </Stat>
                  </GridItem>
                  <GridItem>
                    <Stat>
                      <StatLabel>Invoice Type</StatLabel>
                      <StatNumber fontSize="lg" textTransform="capitalize">
                        {invoice.invoice_type || 'Standard'}
                      </StatNumber>
                    </Stat>
                  </GridItem>
                  <GridItem>
                    <Stat>
                      <StatLabel>Total Amount</StatLabel>
                      <StatNumber fontSize="lg" color="green.500">
                        <FormattedCurrencyDisplay amount={invoice.grand_total || 0} currency="SAR" />
                      </StatNumber>
                    </Stat>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>

            {/* ZATCA Compliance Steps */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardHeader>
                <Text fontWeight="bold">ZATCA Compliance Steps</Text>
                <Text fontSize="sm" color="gray.600">
                  Follow these steps in order to achieve full ZATCA compliance
                </Text>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {steps.map((step, index) => (
                    <Box key={index}>
                      <Card 
                        bg={step.status === 'complete' ? 'green.50' : 'white'}
                        borderColor={step.status === 'complete' ? 'green.200' : borderColor}
                        borderWidth={step.status === 'complete' ? 2 : 1}
                      >
                        <CardBody>
                          <HStack spacing={4} align="start">
                            {/* Step Number and Icon */}
                            <VStack spacing={1}>
                              <Box
                                w={10}
                                h={10}
                                borderRadius="full"
                                bg={getStepColor(step, index) + '.100'}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                border="2px solid"
                                borderColor={getStepColor(step, index) + '.300'}
                              >
                                {step.status === 'complete' ? (
                                  <Icon as={FiCheckCircle} color="green.500" />
                                ) : (
                                  <Text fontWeight="bold" color={getStepColor(step, index) + '.600'}>
                                    {index + 1}
                                  </Text>
                                )}
                              </Box>
                              {step.required && (
                                <Badge size="sm" colorScheme="red">Required</Badge>
                              )}
                            </VStack>

                            {/* Step Content */}
                            <VStack spacing={2} align="start" flex={1}>
                              <HStack>
                                <Text fontWeight="bold" fontSize="lg">
                                  {step.title}
                                </Text>
                                {step.status === 'complete' && (
                                  <Badge colorScheme="green">Complete</Badge>
                                )}
                              </HStack>
                              <Text fontSize="sm" color="gray.600">
                                {step.description}
                              </Text>
                              
                              {/* Action Button */}
                              <HStack spacing={2}>
                                <Button
                                  size="sm"
                                  colorScheme={getStepColor(step, index)}
                                  leftIcon={getStepIcon(step, index)}
                                  onClick={() => handleStepAction(index, step.title)}
                                  isDisabled={isProcessing || step.status === 'complete'}
                                  isLoading={isProcessing && selectedAction === step.title}
                                >
                                  {step.status === 'complete' ? 'Completed' : 'Execute'}
                                </Button>
                                
                                {step.title === 'View XML Records' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<FiCode />}
                                    colorScheme="purple"
                                  >
                                    View XML
                                  </Button>
                                )}
                              </HStack>
                            </VStack>
                          </HStack>
                        </CardBody>
                      </Card>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>

            {/* Compliance Status */}
            {compliancePercentage === 100 ? (
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>ZATCA Compliance Achieved!</AlertTitle>
                  <AlertDescription>
                    This invoice is fully compliant with ZATCA requirements and ready for submission.
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>ZATCA Compliance Incomplete</AlertTitle>
                  <AlertDescription>
                    Complete the remaining steps to achieve full ZATCA compliance.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FiRefreshCw />}
              onClick={() => {
                // Refresh compliance status
                window.location.reload();
              }}
            >
              Refresh Status
            </Button>
            {compliancePercentage === 100 && (
              <Button
                colorScheme="green"
                leftIcon={<FiCheckCircle />}
                onClick={() => {
                  toast({
                    title: 'Invoice Ready for ZATCA',
                    description: 'This invoice is fully compliant and ready for submission',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                }}
              >
                Mark as ZATCA Ready
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ZATCAComplianceDashboard;