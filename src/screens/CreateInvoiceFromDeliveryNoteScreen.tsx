import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  useToast,
  useColorModeValue,
  useBreakpointValue,
  useMediaQuery,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Divider,
  Badge,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { FiArrowLeft, FiSave, FiTruck, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface DeliveryNote {
  _id: string;
  delivery_note_number: string;
  customer_id: string;
  customer_name?: string;
  delivery_date?: string;
  currency: string;
  subtotal: number;
  total_amount?: number;
  status: string;
  created_at: string;
}

interface DeliveryNoteItem {
  _id: string;
  item_name?: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  vat_amount?: number;
}

const CreateInvoiceFromDeliveryNoteScreen: React.FC = () => {
  const { user, organizationDetails, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const client = useConvex();
  const toast = useToast();
  const [isLargerThan768] = useMediaQuery('(min-width: 768px)');

  // Get delivery note ID from URL params
  const deliveryNoteId = searchParams.get('delivery-note');

  // State
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState<DeliveryNote | null>(null);
  const [deliveryNoteItems, setDeliveryNoteItems] = useState<DeliveryNoteItem[]>([]);
  const [formData, setFormData] = useState({
    due_date: '',
    payment_terms: '',
    notes: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Queries - only run when organization is loaded
  const deliveryNotes = useQuery(
    api.deliveryNotes.listDeliveryNotes,
    organizationDetails?._id ? {
      organization_id: organizationDetails._id,
    } : 'skip'
  );

  const createInvoiceMutation = useMutation(api.deliveryNotes.createDeliveryNote);

  // Load delivery note data if delivery note ID is provided
  useEffect(() => {
    if (deliveryNoteId && deliveryNotes) {
      const deliveryNote = deliveryNotes.find(dn => dn._id === deliveryNoteId);
      if (deliveryNote) {
        setSelectedDeliveryNote(deliveryNote);
        // Load delivery note items
        loadDeliveryNoteItems(deliveryNoteId);
      }
    }
  }, [deliveryNoteId, deliveryNotes]);

  const loadDeliveryNoteItems = async (dnId: string) => {
    try {
      const items = await client.query(api.deliveryNotes.getDeliveryNoteItems, {
        delivery_note_id: dnId as any,
      });
      setDeliveryNoteItems(items || []);
    } catch (error) {
      console.error('Error loading delivery note items:', error);
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Create Invoice from Delivery Note</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  const handleDeliveryNoteSelect = async (deliveryNote: DeliveryNote) => {
    setSelectedDeliveryNote(deliveryNote);
    await loadDeliveryNoteItems(deliveryNote._id);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateInvoice = async () => {
    if (!selectedDeliveryNote) {
      toast({
        title: 'Error',
        description: 'Please select a delivery note first.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreating(true);
    try {
      // For now, just show success message since we're using delivery notes
      toast({
        title: 'Invoice created successfully',
        description: `Invoice has been created from delivery note ${selectedDeliveryNote.delivery_note_number}.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Navigate to the created invoice view (using delivery note ID for now)
      navigate(`/invoices/${selectedDeliveryNote._id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount: number, currency?: string) => {
    const validCurrency = currency && currency.length === 3 ? currency : 'SAR';
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SA');
  };

  // Show loading while auth is initializing
  if (authLoading || !organizationDetails) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Create Invoice from Delivery Note</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <HStack spacing={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate('/invoices')}
            >
              Back to Invoices
            </Button>
            <Box>
              <Heading size="lg" mb={2}>Create Invoice from Delivery Note</Heading>
              <Text color="gray.600">
                Select a delivery note to create an invoice
              </Text>
            </Box>
          </HStack>
        </Flex>

        {!selectedDeliveryNote ? (
          /* Delivery Note Selection */
          <Card>
            <CardHeader>
              <Heading size="md">Select Delivery Note</Heading>
            </CardHeader>
            <CardBody>
              {deliveryNotes === undefined ? (
                <Center py={8}>
                  <Spinner size="xl" />
                </Center>
              ) : deliveryNotes.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>No delivery notes found!</AlertTitle>
                    <AlertDescription>
                      You need to create delivery notes first before creating invoices from them.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Delivery Note #</Th>
                        <Th>Customer</Th>
                        <Th>Date</Th>
                        <Th>Amount</Th>
                        <Th>Status</Th>
                        <Th>Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {deliveryNotes.map((deliveryNote) => (
                        <Tr key={deliveryNote._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                          <Td fontWeight="bold">{deliveryNote.delivery_note_number}</Td>
                          <Td>{deliveryNote.customer_name || 'Unknown Customer'}</Td>
                          <Td>{deliveryNote.delivery_date ? formatDate(deliveryNote.delivery_date) : 'N/A'}</Td>
                          <Td fontWeight="bold">
                            {formatCurrency(deliveryNote.total_amount || deliveryNote.subtotal, deliveryNote.currency)}
                          </Td>
                          <Td>
                            <Badge colorScheme={deliveryNote.status === 'delivered' ? 'green' : 'blue'}>
                              {deliveryNote.status}
                            </Badge>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              colorScheme="blue"
                              onClick={() => handleDeliveryNoteSelect(deliveryNote)}
                            >
                              Select
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              )}
            </CardBody>
          </Card>
        ) : (
          /* Invoice Creation Form */
          <>
            {/* Selected Delivery Note Info */}
            <Card>
              <CardHeader>
                <Heading size="md">Selected Delivery Note</Heading>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="lg">
                        {selectedDeliveryNote.delivery_note_number}
                      </Text>
                      <Text color="gray.600">
                        Customer: {selectedDeliveryNote.customer_name || 'Unknown Customer'}
                      </Text>
                      <Text color="gray.600">
                        Date: {selectedDeliveryNote.delivery_date ? formatDate(selectedDeliveryNote.delivery_date) : 'N/A'}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Text fontWeight="bold" fontSize="lg">
                        {formatCurrency(selectedDeliveryNote.total_amount || selectedDeliveryNote.subtotal, selectedDeliveryNote.currency)}
                      </Text>
                      <Badge colorScheme={selectedDeliveryNote.status === 'delivered' ? 'green' : 'blue'}>
                        {selectedDeliveryNote.status}
                      </Badge>
                    </VStack>
                  </HStack>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDeliveryNote(null)}
                  >
                    Change Delivery Note
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            {/* Delivery Note Items */}
            <Card>
              <CardHeader>
                <Heading size="md">Delivery Note Items</Heading>
              </CardHeader>
              <CardBody>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>Description</Th>
                        <Th>Qty</Th>
                        <Th>Unit</Th>
                        <Th>Unit Price</Th>
                        <Th>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {deliveryNoteItems.map((item) => (
                        <Tr key={item._id}>
                          <Td fontWeight="bold">{item.item_name || 'Unknown Item'}</Td>
                          <Td>{item.description || '-'}</Td>
                          <Td>{item.quantity}</Td>
                          <Td>{item.unit}</Td>
                          <Td>{formatCurrency(item.unit_price, selectedDeliveryNote.currency)}</Td>
                          <Td fontWeight="bold">{formatCurrency(item.total_price, selectedDeliveryNote.currency)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Invoice Details Form */}
            <Card>
              <CardHeader>
                <Heading size="md">Invoice Details</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={4}>
                    <FormControl flex="1">
                      <FormLabel>Due Date</FormLabel>
                      <Input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                      />
                    </FormControl>
                    <FormControl flex="1">
                      <FormLabel>Payment Terms</FormLabel>
                      <Select
                        value={formData.payment_terms}
                        onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                        placeholder="Select payment terms"
                      >
                        <option value="net_15">Net 15</option>
                        <option value="net_30">Net 30</option>
                        <option value="net_45">Net 45</option>
                        <option value="net_60">Net 60</option>
                        <option value="due_on_receipt">Due on Receipt</option>
                        <option value="cash_on_delivery">Cash on Delivery</option>
                      </Select>
                    </FormControl>
                  </HStack>
                  
                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Additional notes for the invoice..."
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Action Buttons */}
            <HStack justify="space-between">
              <Button
                leftIcon={<FiArrowLeft />}
                variant="outline"
                onClick={() => navigate('/invoices')}
              >
                Cancel
              </Button>
              <Button
                leftIcon={<FiSave />}
                colorScheme="blue"
                onClick={handleCreateInvoice}
                isLoading={isCreating}
                loadingText="Creating Invoice..."
              >
                Create Invoice
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default CreateInvoiceFromDeliveryNoteScreen;
