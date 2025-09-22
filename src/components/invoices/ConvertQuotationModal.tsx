import React, { useState, useEffect } from 'react';
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
  Select,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Box
} from '@chakra-ui/react';
import { useQuery, useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';
import { formatCurrencyDisplay } from '../../utils/invoiceCurrencyUtils';

interface ConvertQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConvert: (quotationId: string) => void;
}

const ConvertQuotationModal: React.FC<ConvertQuotationModalProps> = ({
  isOpen,
  onClose,
  onConvert
}) => {
  const { selectedOrganization } = useAuth();
  const toast = useToast();
  const client = useConvex();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');

  // Fetch customers (same as InvoiceForm)
  const customers = useQuery(api.customers.listCustomers, 
    selectedOrganization ? { organization_id: selectedOrganization } : "skip"
  );

  // Fetch quotations for selected customer with error handling
  const [customerQuotations, setCustomerQuotations] = useState<any[] | null>(null);
  const [quotationsLoading, setQuotationsLoading] = useState(false);
  const [quotationsError, setQuotationsError] = useState<string | null>(null);

  // Fetch quotations manually with error handling
  useEffect(() => {
    const fetchQuotations = async () => {
      if (!selectedCustomerId || !selectedOrganization) {
        setCustomerQuotations(null);
        return;
      }

      setQuotationsLoading(true);
      setQuotationsError(null);
      
      try {
        // Try to fetch quotations using Convex client
        const quotationsData = await client.query(api.quotations.getQuotationsByCustomer, {
          customer_id: selectedCustomerId,
          organization_id: selectedOrganization
        });
        setCustomerQuotations(quotationsData || []);
      } catch (error) {
        console.error('Error fetching quotations:', error);
        setQuotationsError('Failed to load quotations');
        setCustomerQuotations([]);
      } finally {
        setQuotationsLoading(false);
      }
    };

    fetchQuotations();
  }, [selectedCustomerId, selectedOrganization, client]);

  // Reset selections when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCustomerId('');
      setSelectedQuotationId('');
    }
  }, [isOpen]);

  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedQuotationId(''); // Reset quotation selection
  };

  const handleConvert = () => {
    if (!selectedQuotationId) {
      toast({
        title: 'Error',
        description: 'Please select a quotation to convert',
        status: 'error',
      });
      return;
    }

    onConvert(selectedQuotationId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'sent': return 'blue';
      case 'accepted': return 'green';
      case 'rejected': return 'red';
      case 'expired': return 'orange';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <VStack align="start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold">Convert Quotation to Invoice</Text>
            <Text fontSize="sm" color="gray.500">
              Select a customer and quotation to convert to an invoice
            </Text>
          </VStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Customer Selection */}
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Text fontWeight="bold" fontSize="lg">Step 1: Select Customer</Text>
                  <Select
                    placeholder="Choose a customer..."
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    size="lg"
                  >
                    {customers?.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.customer_company_name}
                      </option>
                    ))}
                  </Select>
                  {selectedCustomerId && customers && customers.length > 0 && (
                    <Text fontSize="sm" color="green.600">
                      ✓ Customer selected: {customers.find(c => c._id === selectedCustomerId)?.customer_company_name}
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Quotation Selection */}
            {selectedCustomerId && (
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    <Text fontWeight="bold" fontSize="lg">Step 2: Select Quotation</Text>
                    
                    {quotationsLoading ? (
                      <HStack justify="center" py={8}>
                        <Spinner size="lg" />
                        <Text>Loading quotations...</Text>
                      </HStack>
                    ) : quotationsError ? (
                      <Alert status="error">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Error loading quotations!</AlertTitle>
                          <AlertDescription>{quotationsError}</AlertDescription>
                        </Box>
                      </Alert>
                    ) : customerQuotations === null ? (
                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Select a customer first</AlertTitle>
                          <AlertDescription>
                            Please select a customer to view their quotations.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    ) : customerQuotations.length === 0 ? (
                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>No quotations found!</AlertTitle>
                          <AlertDescription>
                            This customer doesn't have any quotations available for conversion.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    ) : (
                      <TableContainer>
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Quotation #</Th>
                              <Th>Date</Th>
                              <Th>Valid Until</Th>
                              <Th>Amount</Th>
                              <Th>Status</Th>
                              <Th>Action</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {customerQuotations.map((quotation) => (
                              <Tr 
                                key={quotation._id}
                                bg={selectedQuotationId === quotation._id ? 'blue.50' : 'transparent'}
                                _hover={{ bg: 'gray.50' }}
                                cursor="pointer"
                                onClick={() => setSelectedQuotationId(quotation._id)}
                              >
                                <Td fontWeight="medium">{quotation.quotation_number}</Td>
                                <Td>{formatDate(quotation.valid_until)}</Td>
                                <Td>{formatDate(quotation.valid_until)}</Td>
                                <Td className="invoice-currency-sar">
                                  {formatCurrencyDisplay(quotation.total_amount, quotation.currency as any)}
                                </Td>
                                <Td>
                                  <Badge colorScheme={getStatusColor(quotation.status)}>
                                    {quotation.status}
                                  </Badge>
                                </Td>
                                <Td>
                                  <Button
                                    size="sm"
                                    colorScheme={selectedQuotationId === quotation._id ? "blue" : "gray"}
                                    variant={selectedQuotationId === quotation._id ? "solid" : "outline"}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedQuotationId(quotation._id);
                                    }}
                                  >
                                    {selectedQuotationId === quotation._id ? 'Selected' : 'Select'}
                                  </Button>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    )}

                    {selectedQuotationId && (
                      <Alert status="success">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Quotation Selected!</AlertTitle>
                          <AlertDescription>
                            Ready to convert quotation to invoice. Click "Convert to Invoice" below.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
        </ModalBody>
        
        <ModalFooter>
          <HStack>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleConvert}
              isDisabled={!selectedQuotationId}
              leftIcon={<Text>📄</Text>}
            >
              Convert to Invoice
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConvertQuotationModal;
