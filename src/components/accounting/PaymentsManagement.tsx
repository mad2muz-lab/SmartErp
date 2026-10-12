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
  useColorModeValue
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiDownload, FiSearch, FiFilter } from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { formatCurrency as formatCurrencyText } from '../../utils/currencyUtils';
import { isConvexOrgId, DEFAULT_PAYMENTS } from '../../utils/accountingUtils';
import '../../utils/procurementCurrency.css';

interface Payment {
  _id: string;
  payment_number: string;
  date: string;
  supplier_id?: string;
  supplier_name?: string;
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

interface PaymentFormData {
  date: string;
  supplier_id?: string;
  supplier_name?: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'check' | 'credit_card';
  reference_number?: string;
  description?: string;
}

interface PaymentsManagementProps {
  organizationId?: any;
  userId?: any;
  triggerAction?: { action?: string; timestamp: number } | null;
}

const PaymentsManagement: React.FC<PaymentsManagementProps> = ({ 
  organizationId: propOrgId, 
  userId: propUserId,
  triggerAction 
}) => {
  const { user, selectedOrganization } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const [formData, setFormData] = useState<PaymentFormData>({
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

  const storageKey = `trading_erp_payments_${organizationId || 'default'}`;

  // Local fallback payments state
  const [localPayments, setLocalPayments] = useState<Payment[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_PAYMENTS));
      return DEFAULT_PAYMENTS as Payment[];
    } catch {
      return DEFAULT_PAYMENTS as Payment[];
    }
  });

  const isConvex = isConvexOrgId(organizationId);

  // Queries
  const payments = useQuery(
    api.accounting.payments.listPayments,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  const suppliers = useQuery(
    api.suppliers.listSuppliers,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  // Mutations
  const createPayment = useMutation(api.accounting.payments.createPayment);
  const updatePayment = useMutation(api.accounting.payments.updatePayment);
  const deletePayment = useMutation(api.accounting.payments.deletePayment);

  const effectivePayments: Payment[] = (payments && payments.length > 0) ? payments : localPayments;

  // Filter payments
  const filteredPayments = effectivePayments.filter(payment => {
    const matchesSearch = payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesPaymentMethod = paymentMethodFilter === 'all' || payment.payment_method === paymentMethodFilter;
    
    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  const handleCreatePayment = async () => {
    try {
      if (isConvex && user) {
        await createPayment({
          organization_id: organizationId,
          date: formData.date,
          supplier_id: formData.supplier_id,
          supplier_name: formData.supplier_name,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number,
          description: formData.description,
          created_by: user._id
        });
      } else {
        const nextNum = localPayments.length + 1;
        const newPayment: Payment = {
          _id: `pay_${Date.now()}`,
          payment_number: `PAY-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`,
          date: formData.date,
          supplier_id: formData.supplier_id,
          supplier_name: formData.supplier_name || 'Vendor / Supplier',
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
        const updated = [newPayment, ...localPayments];
        setLocalPayments(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      toast({
        title: 'Payment created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error creating payment',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;

    try {
      if (isConvex) {
        await updatePayment({
          payment_id: selectedPayment._id as any,
          date: formData.date,
          supplier_id: formData.supplier_id,
          supplier_name: formData.supplier_name,
          amount: formData.amount,
          payment_method: formData.payment_method,
          reference_number: formData.reference_number,
          description: formData.description
        });
      } else {
        const updated = localPayments.map(p => {
          if (p._id === selectedPayment._id) {
            return {
              ...p,
              date: formData.date,
              supplier_id: formData.supplier_id,
              supplier_name: formData.supplier_name || p.supplier_name,
              amount: Number(formData.amount),
              payment_method: formData.payment_method,
              reference_number: formData.reference_number,
              description: formData.description,
              updated_at: new Date().toISOString()
            };
          }
          return p;
        });
        setLocalPayments(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      toast({
        title: 'Payment updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating payment',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      if (isConvex) {
        await deletePayment({ payment_id: paymentId as any });
      } else {
        const updated = localPayments.filter(p => p._id !== paymentId);
        setLocalPayments(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }
      toast({
        title: 'Payment deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting payment',
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
    setSelectedPayment(null);
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

  const openEditModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormData({
      date: payment.date,
      supplier_id: payment.supplier_id,
      supplier_name: payment.supplier_name,
      amount: payment.amount,
      payment_method: payment.payment_method,
      reference_number: payment.reference_number,
      description: payment.description || ''
    });
    setIsEditing(true);
    onOpen();
  };

  const openViewModal = (payment: Payment) => {
    setSelectedPayment(payment);
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

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Payments Management</Heading>
            <Text color="gray.600">Record and manage payments to suppliers</Text>
          </VStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={openCreateModal}
          >
            New Payment
          </Button>
        </Flex>

        {/* Summary Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Total Payments</Text>
                <Text fontSize="2xl" fontWeight="bold">{filteredPayments.length}</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Total Amount</Text>
                <Text fontSize="2xl" fontWeight="bold" color="red.500">
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
                  {filteredPayments.filter(p => p.status === 'confirmed').length}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">Pending</Text>
                <Text fontSize="2xl" fontWeight="bold" color="yellow.500">
                  {filteredPayments.filter(p => p.status === 'pending').length}
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
                  placeholder="Search payments..."
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

        {/* Payments Table */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Payments</Heading>
          </CardHeader>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Payment #</Th>
                    <Th>Date</Th>
                    <Th>Supplier</Th>
                    <Th>Amount</Th>
                    <Th>Payment Method</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPayments.map((payment) => (
                    <Tr key={payment._id}>
                      <Td fontWeight="medium">{payment.payment_number}</Td>
                      <Td>{new Date(payment.date).toLocaleDateString()}</Td>
                      <Td>{payment.supplier_name || 'N/A'}</Td>
                      <Td fontWeight="medium">{formatCurrency(payment.amount)}</Td>
                      <Td>{getPaymentMethodLabel(payment.payment_method)}</Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="View payment"
                            icon={<FiEye />}
                            size="sm"
                            variant="ghost"
                            onClick={() => openViewModal(payment)}
                          />
                          <IconButton
                            aria-label="Edit payment"
                            icon={<FiEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(payment)}
                          />
                          <IconButton
                            aria-label="Delete payment"
                            icon={<FiTrash2 />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDeletePayment(payment._id)}
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
            {isEditing ? 'Edit Payment' : 'Create New Payment'}
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
                  <FormLabel>Supplier Name</FormLabel>
                  <Input
                    placeholder="Type or select supplier..."
                    value={formData.supplier_name || ''}
                    onChange={(e) => {
                      const typedName = e.target.value;
                      const matched = suppliers?.find(s => s.name?.toLowerCase() === typedName.toLowerCase());
                      setFormData({
                        ...formData,
                        supplier_name: typedName,
                        supplier_id: matched?._id || formData.supplier_id || `supp_${Date.now()}`
                      });
                    }}
                    list="suppliers-datalist"
                  />
                  <datalist id="suppliers-datalist">
                    {suppliers?.map((s) => (
                      <option key={s._id} value={s.name} />
                    ))}
                    <option value="FixFast Industrial Solutions" />
                    <option value="Gulf Cable & Electricals Ltd." />
                    <option value="Saudi Logistics & Transport" />
                    <option value="Direct Trade Vendor" />
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
              onClick={isEditing ? handleUpdatePayment : handleCreatePayment}
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
          <ModalHeader>Payment Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPayment && (
              <VStack spacing={4} align="stretch">
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Payment Number</Text>
                    <Text fontWeight="medium">{selectedPayment.payment_number}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Date</Text>
                    <Text>{new Date(selectedPayment.date).toLocaleDateString()}</Text>
                  </Box>
                </Grid>

                <Divider />

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Supplier</Text>
                    <Text>{selectedPayment.supplier_name || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Amount</Text>
                    <Text fontWeight="medium" fontSize="lg">{formatCurrency(selectedPayment.amount)}</Text>
                  </Box>
                </Grid>

                <Divider />

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Payment Method</Text>
                    <Text>{getPaymentMethodLabel(selectedPayment.payment_method)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Status</Text>
                    <Badge colorScheme={getStatusColor(selectedPayment.status)}>
                      {selectedPayment.status}
                    </Badge>
                  </Box>
                </Grid>

                {selectedPayment.reference_number && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.600">Reference Number</Text>
                      <Text>{selectedPayment.reference_number}</Text>
                    </Box>
                  </>
                )}

                {selectedPayment.description && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.600">Description</Text>
                      <Text>{selectedPayment.description}</Text>
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

export default PaymentsManagement;
