import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Icon,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Tooltip,
  Flex,
  Spacer,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Code
} from '@chakra-ui/react';
import { 
  FiArrowRight, 
  FiArrowDown, 
  FiFileText, 
  FiUser, 
  FiClock,
  FiEye,
  FiExternalLink
} from 'react-icons/fi';
import { SaudiRiyalIcon } from '../icons/SaudiRiyalIcon';
import { formatCurrencyDisplay } from '../../utils/invoiceCurrencyUtils';

interface ProcessFlowStep {
  step: number;
  document_type: string;
  document_id: string;
  document_number: string;
  action: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  metadata?: any;
  financial_data?: {
    amount: number;
    currency: string;
    conversion_rate?: number;
  };
}

interface ProcessFlowData {
  document_id: string;
  document_type: string;
  document_number: string;
  complete_chain: ProcessFlowStep[];
  source_documents: Array<{
    document_type: string;
    document_id: string;
    document_number: string;
    amount?: number;
    currency?: string;
  }>;
  derived_documents: Array<{
    document_type: string;
    document_id: string;
    document_number: string;
    amount?: number;
    currency?: string;
  }>;
}

interface ProcessFlowTrackerProps {
  processFlow: ProcessFlowData | null;
  isCompact?: boolean;
}

const ProcessFlowTracker: React.FC<ProcessFlowTrackerProps> = ({ 
  processFlow, 
  isCompact = false 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const stepBgColor = useColorModeValue('gray.50', 'gray.700');
  const primaryColor = useColorModeValue('blue.500', 'blue.300');
  const successColor = useColorModeValue('green.500', 'green.300');
  const warningColor = useColorModeValue('orange.500', 'orange.300');

  if (!processFlow || !processFlow.complete_chain || processFlow.complete_chain.length === 0) {
    return (
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center">
            No process flow information available
          </Text>
        </CardBody>
      </Card>
    );
  }

  const getDocumentIcon = (docType: string) => {
    switch (docType.toLowerCase()) {
      case 'lead':
        return '🎯';
      case 'quotation':
        return '📋';
      case 'invoice':
        return '🧾';
      case 'delivery_note':
        return '📦';
      case 'purchase_order':
        return '🛒';
      default:
        return '📄';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'created':
        return successColor;
      case 'converted':
        return primaryColor;
      case 'updated':
        return warningColor;
      case 'approved':
        return successColor;
      default:
        return 'gray.500';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStep = (step: ProcessFlowStep, index: number, isLast: boolean) => {
    return (
      <Box key={step.step} position="relative">
        <HStack spacing={4} align="start">
          {/* Step Number */}
          <Box
            minW="32px"
            h="32px"
            borderRadius="full"
            bg={primaryColor}
            color="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="sm"
            fontWeight="bold"
            position="relative"
            zIndex={2}
          >
            {step.step}
          </Box>

          {/* Step Content */}
          <Box flex={1} bg={stepBgColor} p={4} borderRadius="md" border="1px" borderColor={borderColor}>
            <HStack justify="space-between" mb={2}>
              <HStack spacing={2}>
                <Text fontSize="lg">{getDocumentIcon(step.document_type)}</Text>
                <VStack align="start" spacing={0}>
                  <Text fontWeight="bold" fontSize="md">
                    {step.document_type.charAt(0).toUpperCase() + step.document_type.slice(1)}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    {step.document_number}
                  </Text>
                </VStack>
              </HStack>
              
              <Badge colorScheme="blue" variant="subtle">
                {step.action.charAt(0).toUpperCase() + step.action.slice(1)}
              </Badge>
            </HStack>

            <HStack spacing={4} fontSize="sm" color="gray.600">
              <HStack spacing={1}>
                <Icon as={FiUser} />
                <Text>{step.user_name}</Text>
              </HStack>
              <HStack spacing={1}>
                <Icon as={FiClock} />
                <Text>{formatDate(step.timestamp)}</Text>
              </HStack>
              {step.financial_data && (
                <HStack spacing={1}>
                  <SaudiRiyalIcon boxSize={4} />
                  <Text className="invoice-currency-sar">
                    {formatCurrencyDisplay(step.financial_data.amount, step.financial_data.currency as any)}
                  </Text>
                </HStack>
              )}
            </HStack>

            {step.metadata && step.metadata.conversion_type && (
              <Box mt={2} p={2} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                <Text fontSize="xs" color="blue.700">
                  Conversion: {step.metadata.conversion_type.replace('_', ' → ')}
                </Text>
              </Box>
            )}
          </Box>
        </HStack>

        {/* Connector Line */}
        {!isLast && (
          <Box
            position="absolute"
            left="15px"
            top="32px"
            w="2px"
            h="20px"
            bg={borderColor}
            zIndex={1}
          />
        )}
      </Box>
    );
  };

  const renderCompactView = () => (
    <Card>
      <CardHeader pb={2}>
        <HStack justify="space-between">
          <Heading size="sm">Source Journey</Heading>
          <Button size="sm" variant="outline" onClick={onOpen}>
            <Icon as={FiEye} mr={1} />
            View Details
          </Button>
        </HStack>
      </CardHeader>
      <CardBody pt={0}>
        <HStack spacing={2} align="center">
          {processFlow.complete_chain.slice(0, 3).map((step, index) => (
            <React.Fragment key={step.step}>
              <HStack spacing={1}>
                <Text fontSize="sm">{getDocumentIcon(step.document_type)}</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {step.document_number}
                </Text>
              </HStack>
              {index < Math.min(processFlow.complete_chain.length - 1, 2) && (
                <Icon as={FiArrowRight} color="gray.400" />
              )}
            </React.Fragment>
          ))}
          {processFlow.complete_chain.length > 3 && (
            <Text fontSize="sm" color="gray.500">
              +{processFlow.complete_chain.length - 3} more
            </Text>
          )}
        </HStack>
      </CardBody>
    </Card>
  );

  const renderDetailedView = () => (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md">Complete Process Flow</Heading>
          <Badge colorScheme="blue" variant="subtle">
            {processFlow.complete_chain.length} Steps
          </Badge>
        </HStack>
      </CardHeader>
      <CardBody>
        <VStack spacing={4} align="stretch">
          {processFlow.complete_chain.map((step, index) => 
            renderStep(step, index, index === processFlow.complete_chain.length - 1)
          )}
        </VStack>

        {/* Source and Derived Documents */}
        {(processFlow.source_documents.length > 0 || processFlow.derived_documents.length > 0) && (
          <>
            <Divider my={4} />
            <VStack spacing={4} align="stretch">
              {processFlow.source_documents.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2} color="green.600">
                    Source Documents
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {processFlow.source_documents.map((doc, index) => (
                      <Badge key={index} colorScheme="green" variant="subtle" p={2}>
                        <HStack spacing={1}>
                          <Text>{getDocumentIcon(doc.document_type)}</Text>
                          <Text>{doc.document_number}</Text>
                          {doc.amount && (
                            <Text className="invoice-currency-sar">
                              ({formatCurrencyDisplay(doc.amount, doc.currency as any)})
                            </Text>
                          )}
                        </HStack>
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}

              {processFlow.derived_documents.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2} color="blue.600">
                    Derived Documents
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {processFlow.derived_documents.map((doc, index) => (
                      <Badge key={index} colorScheme="blue" variant="subtle" p={2}>
                        <HStack spacing={1}>
                          <Text>{getDocumentIcon(doc.document_type)}</Text>
                          <Text>{doc.document_number}</Text>
                          {doc.amount && (
                            <Text className="invoice-currency-sar">
                              ({formatCurrencyDisplay(doc.amount, doc.currency as any)})
                            </Text>
                          )}
                        </HStack>
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </>
        )}
      </CardBody>
    </Card>
  );

  return (
    <>
      {isCompact ? renderCompactView() : renderDetailedView()}

      {/* Detailed Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>Process Flow Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {processFlow.complete_chain.map((step, index) => 
                renderStep(step, index, index === processFlow.complete_chain.length - 1)
              )}
            </VStack>

            {/* Detailed Table View */}
            <Box mt={6}>
              <Text fontWeight="bold" mb={3}>Step Details</Text>
              <TableContainer>
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Step</Th>
                      <Th>Document</Th>
                      <Th>Action</Th>
                      <Th>User</Th>
                      <Th>Date</Th>
                      <Th>Amount</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {processFlow.complete_chain.map((step) => (
                      <Tr key={step.step}>
                        <Td>
                          <Badge colorScheme="blue">{step.step}</Badge>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <Text>{getDocumentIcon(step.document_type)}</Text>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">
                                {step.document_number}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {step.document_type}
                              </Text>
                            </VStack>
                          </HStack>
                        </Td>
                        <Td>
                          <Badge colorScheme="green" variant="subtle">
                            {step.action}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{step.user_name}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">{formatDate(step.timestamp)}</Text>
                        </Td>
                        <Td>
                          {step.financial_data ? (
                            <Text fontSize="sm" className="invoice-currency-sar">
                              {formatCurrencyDisplay(step.financial_data.amount, step.financial_data.currency as any)}
                            </Text>
                          ) : (
                            <Text fontSize="sm" color="gray.400">-</Text>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProcessFlowTracker;
