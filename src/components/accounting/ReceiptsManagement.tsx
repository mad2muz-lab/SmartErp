import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack,
  HStack,
  Badge,
  IconButton,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiDownload, FiSearch, FiFilter } from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { formatCurrency as formatCurrencyText } from '../../utils/currencyUtils';
import { isConvexOrgId, DEFAULT_RECEIPTS } from '../../utils/accountingUtils';
import '../../utils/procurementCurrency.css';

interface Receipt {
  _id: string;
  receipt_number: string;
  date: string;
  customer_id?: string;
  customer_name?: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  reference_number?: string;
  description?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

interface ReceiptFormData {
  date: string;
  customer_id?: string;
  customer_name?: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  reference_number?: string;
  description?: string;
}

interface ReceiptsManagementProps {
  organizationId?: any;
  userId?: any;
  triggerAction?: { action?: string; timestamp: number } | null;
}

const ReceiptsManagement: React.FC<ReceiptsManagementProps> = ({ 
  organizationId: propOrgId, 
  userId: propUserId,
  triggerAction 
}) => {
  const { user, selectedOrganization } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [formData, setFormData] = useState<ReceiptFormData>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'cash',
    description: ''
  });

  const formatCurrency = (amount: number) => {
    return (
      <span className="procurement-currency-sar">
        {formatCurrencyText(amount, 'SAR')}
      </span>
    );
  };

  const organizationId = propOrgId || (typeof selectedOrganization === 'string' 
    ? selectedOrganization 
    : (selectedOrganization as any)?._id);

  const storageKey = `trading_erp_receipts_${organizationId || 'default'}`;

  // Local fallback receipts state
  const [localReceipts, setLocalReceipts] = useState<Receipt[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_RECEIPTS));
      return DEFAULT_RECEIPTS as Receipt[];
    } catch {
      return DEFAULT_RECEIPTS as Receipt[];
    }
  });

  const isConvex = isConvexOrgId(organizationId);

  // Queries
  const receipts = useQuery(
    api.accounting.receipts.listReceipts,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  const customers = useQuery(
    api.customers.listCustomers,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  // Mutations
  const createReceipt = useMutation(api.accounting.receipts.createReceipt);
  const updateReceipt = useMutation(api.accounting.receipts.updateReceipt);
  const deleteReceipt = useMutation(api.accounting.receipts.deleteReceipt);

  const effectiveReceipts: Receipt[] = (receipts && receipts.length > 0) ? receipts : localReceipts;

  // Filter receipts
  const filteredReceipts = effectiveReceipts.filter(receipt => {
    const matchesSearch = receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         receipt.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || receipt.status === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || receipt.payment_method === paymentMethodFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const handleCreateReceipt = async () => {
    try {
      if (isConvex && user) {
        await createReceipt({
          organization_id: organizationId,
          date: formData.date,
          customer_id: formData.customer_id,
          customer_name: formData.customer_name,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number,
          description: formData.description,
          created_by: user._id
        });
      } else {
        const nextNum = localReceipts.length + 1;
        const newReceipt: Receipt = {
          _id: `rec_${Date.now()}`,
          receipt_number: `REC-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`,
          date: formData.date,
          customer_id: formData.customer_id,
          customer_name: formData.customer_name || 'Direct Customer',
          amount: Number(formData.amount),
          payment_method: formData.payment_method,
          reference_number: formData.reference_number || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          description: formData.description,
          status: 'confirmed',
          created_by: user?.email || user?.name || 'Local User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: organizationId || 'default'
        };
        const updated = [newReceipt, ...localReceipts];
        setLocalReceipts(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      toast({
        title: 'Receipt created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error creating receipt',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateReceipt = async () => {
    if (!selectedReceipt) return;

    try {
      if (isConvex) {
        await updateReceipt({
          receipt_id: selectedReceipt._id as any,
          date: formData.date,
          customer_id: formData.customer_id,
          customer_name: formData.customer_name,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number,
          description: formData.description
        });
      } else {
        const updated = localReceipts.map(r => {
          if (r._id === selectedReceipt._id) {
            return {
              ...r,
              date: formData.date,
              customer_id: formData.customer_id,
              customer_name: formData.customer_name || r.customer_name,
              amount: Number(formData.amount),
              payment_method: formData.payment_method,
              reference_number: formData.reference_number,
              description: formData.description,
              updated_at: new Date().toISOString()
            };
          }
          return r;
        });
        setLocalReceipts(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      toast({
        title: 'Receipt updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating receipt',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      if (isConvex) {
        await deleteReceipt({ receipt_id: receiptId as any });
      } else {
        const updated = localReceipts.filter(r => r._id !== receiptId);
        setLocalReceipts(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
      toast({
        title: 'Receipt deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting receipt',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      payment_method: 'cash',
      description: ''
    });
    setSelectedReceipt(null);
    setIsEditing(false);
  };

  const openCreateModal = () => {
    resetForm();
    onOpen();
  };

  React.useEffect(() => {
    if (triggerAction?.action === 'new') {
      openCreateModal();
    }
  }, [triggerAction?.timestamp]);

  const openEditModal = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setFormData({
      date: receipt.date,
      customer_id: receipt.customer_id,
      customer_name: receipt.customer_name,
      amount: receipt.amount,
      payment_method: receipt.payment_method,
      reference_number: receipt.reference_number,
      description: receipt.description || ''
    });
    setIsEditing(true);
    onOpen();
  };

  const openViewModal = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    onViewOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'green';
      case 'pending': return 'yellow';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'check': return 'Check';
      case 'credit_card': return 'Credit Card';
      default: return method;
    }
  };

  const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Receipts Management</Heading>
            <Text color="gray.600">Record and manage cash and bank receipts</Text>
          </VStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={openCreateModal}
          >
            New Receipt
          </Button>
        </Flex>

        {/* Summary Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Total Receipts</Text>
                <Text fontSize="2xl" fontWeight="bold">{filteredReceipts.length}</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Total Amount</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {formatCurrency(totalAmount)}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Confirmed</Text>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {filteredReceipts.filter(r => r.status === 'confirmed').length}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Pending</Text>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                  {filteredReceipts.filter(r => r.status === 'pending').length}
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Filters */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <FormControl>
                <FormLabel>Search</FormLabel>
                <Input
                  placeholder="Search receipts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Payment Method</FormLabel>
                <Select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)}>
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="credit_card">Credit Card</option>
                </Select>
              </FormControl>
            </Grid>
          </CardBody>
        </Card>

        {/* Receipts Table */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Receipts</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Receipt #</Th>
                    <Th>Date</Th>
                    <Th>Customer</Th>
                    <Th>Amount</Th>
                    <Th>Payment Method</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredReceipts.map((receipt) => (
                    <Tr key={receipt._id}>
                      <Td fontWeight="medium">{receipt.receipt_number}</Td>
                      <Td>{new Date(receipt.date).toLocaleDateString()}</Td>
                      <Td>{receipt.customer_name || 'N/A'}</Td>
                      <Td fontWeight="medium">{formatCurrency(receipt.amount)}</Td>
                      <Td>{getPaymentMethodLabel(receipt.payment_method)}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(receipt.status)}>
                          {receipt.status}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="View receipt"
                            icon={<FiEye />}
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewModal(receipt)}
                          />
                          <IconButton
                            aria-label="Edit receipt"
                            icon={<FiEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(receipt)}
                          />
                          <IconButton
                            aria-label="Delete receipt"
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeleteReceipt(receipt._id)}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </VStack>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'Edit Receipt' : 'Create New Receipt'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <FormControl>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Amount</FormLabel>
                  <NumberInput
                    value={formData.amount}
                    onChange={(value) => setFormData({ ...formData, amount: Number(value) })}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </Grid>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} w="full">
                <FormControl>
                  <FormLabel>Customer Name</FormLabel>
                  <Input
                    placeholder="Type or select customer..."
                    value={formData.customer_name || ''}
                    onChange={(e) => {
                      const typedName = e.target.value;
                      const matched = customers?.find(c => c.name?.toLowerCase() === typedName.toLowerCase() || (c as any).customer_company_name?.toLowerCase() === typedName.toLowerCase());
                      setFormData({
                        ...formData,
                        customer_name: typedName,
                        customer_id: matched?._id || formData.customer_id || `cust_${Date.now()}`
                      });
                    }}
                    list="customers-datalist"
                  />
                  <datalist id="customers-datalist">
                    {customers?.map((c) => (
                      <option key={c._id} value={c.name || (c as any).customer_company_name} />
                    ))}
                    <option value="Al-Madina Construction & Trading Co." />
                    <option value="Riyadh Modern Contracting" />
                    <option value="Efficiency Global Supplies" />
                    <option value="Direct Retail Customer" />
                  </datalist>
                </FormControl>
                <FormControl>
                  <FormLabel>Payment Method</FormLabel>
                  <Select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                  </Select>
                </FormControl>
              </Grid>

              <FormControl>
                <FormLabel>Reference Number</FormLabel>
                <Input
                  value={formData.reference_number || ''}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="Enter reference number"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={isEditing ? handleUpdateReceipt : handleCreateReceipt}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Receipt Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedReceipt && (
              <VStack spacing={4} align="stretch">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Receipt Number</Text>
                    <Text fontWeight="medium">{selectedReceipt.receipt_number}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Date</Text>
                    <Text>{new Date(selectedReceipt.date).toLocaleDateString()}</Text>
                  </Box>
                </Grid>

                <Divider />

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Customer</Text>
                    <Text>{selectedReceipt.customer_name || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Amount</Text>
                    <Text fontWeight="medium" fontSize="lg">{formatCurrency(selectedReceipt.amount)}</Text>
                  </Box>
                </Grid>

                <Divider />

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Payment Method</Text>
                    <Text>{getPaymentMethodLabel(selectedReceipt.payment_method)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedReceipt.status)}>
                      {selectedReceipt.status}
                    </Badge>
                  </Box>
                </Grid>

                {selectedReceipt.reference_number && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.600">Reference Number</Text>
                      <Text>{selectedReceipt.reference_number}</Text>
                    </Box>
                  </>
                )}

                {selectedReceipt.description && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.600">Description</Text>
                      <Text>{selectedReceipt.description}</Text>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onViewClose}>
              Close
            </Button>
            <Button leftIcon={<FiDownload />} colorScheme="blue">
              Export
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ReceiptsManagement;
