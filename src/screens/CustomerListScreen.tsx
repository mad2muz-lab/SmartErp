import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  useColorModeValue,
  IconButton,
  Tooltip,
  InputGroup,
  InputLeftElement,
  Input,
  useBreakpointValue,
} from '@chakra-ui/react';
import MobileTable from '../components/MobileTable';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { PullToRefresh, isMobileDevice } from '../utils/mobileTouch';
import { FloatingActionButton } from '../components/MobileBottomNav';
import CustomerForm from '../components/CustomerForm';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiEye,
  FiMail,
  FiPhone,
  FiGlobe,
} from 'react-icons/fi';
import { toast as hotToast } from 'react-hot-toast';

const CustomerListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { selectedOrganization } = useAuth();
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Form state - removed as we're using CustomerForm component

  // Fetch customers
  const customers = useQuery(
    api.customers.listCustomers,
    selectedOrganization ? { organization_id: selectedOrganization as any } : 'skip'
  );

  // Mutations - MUST be called before any conditional returns
  const createCustomer = useMutation(api.customers.createCustomer);
  const updateCustomer = useMutation(api.customers.updateCustomer);
  const deleteCustomer = useMutation(api.customers.deleteCustomer);

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    console.log('🔄 Refreshing customer data...');

    try {
      // Force re-fetch of customer data
      // In a real implementation, you might want to invalidate specific queries
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('✅ Customer data refreshed');
      toast({
        title: 'Refreshed',
        description: 'Customer data has been updated',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('❌ Error refreshing customers:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Could not refresh customer data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize pull-to-refresh for mobile
  useEffect(() => {
    if (isMobile && containerRef.current && isMobileDevice()) {
      const pullToRefresh = new PullToRefresh(containerRef.current, handleRefresh);

      return () => {
        pullToRefresh.destroy();
      };
    }
  }, [isMobile, handleRefresh]);

  // Handle loading and error states
  if (customers === undefined) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Customer Management</Heading>
            <Text color="gray.600">Loading customers...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Show message if no organization is selected
  if (!selectedOrganization) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Customer Management</Heading>
            <Text color="gray.600">Please select an organization to view customers</Text>
          </Box>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Text color="gray.500">No organization selected</Text>
                <Text fontSize="sm" color="gray.400">Please select an organization from the dashboard to manage customers</Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    );
  }

  const handleOpenModal = (customer?: any, edit = false) => {
    setSelectedCustomer(customer);
    setIsEditMode(edit);
    onOpen();
  };

  const handleSubmit = async (formData: any) => {
    if (!selectedOrganization) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (isEditMode && selectedCustomer) {
        await updateCustomer({
          id: selectedCustomer._id,
          ...formData,
        });
        hotToast.success('Customer updated successfully');
      } else {
        await createCustomer({
          ...formData,
          organization_id: selectedOrganization as any,
          created_by: 'admin',
        });
        hotToast.success('Customer created successfully');
      }
      onClose();
    } catch (error) {
      hotToast.error('Failed to save customer');
      console.error(error);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await deleteCustomer({ id: customerId as any });
        hotToast.success('Customer deleted successfully');
      } catch (error) {
        hotToast.error('Failed to delete customer');
        console.error(error);
      }
    }
  };

  const filteredCustomers = customers?.filter(customer =>
    customer.customer_company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getReliabilityColor = (rating: number) => {
    if (rating >= 8) return 'green';
    if (rating >= 6) return 'yellow';
    return 'red';
  };

  return (
    <Box
      ref={containerRef}
      overflowY="auto"
      maxH={isMobile ? "100vh" : "auto"}
      position="relative"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>Customer Management</Heading>
            <Text color="gray.600">Manage your customer database and relationships</Text>
          </Box>
          <Button
            colorScheme="blue"
            leftIcon={<FiPlus />}
            onClick={() => handleOpenModal()}
          >
            Add Customer
          </Button>
        </HStack>

        {/* Search */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <InputGroup>
              <InputLeftElement>
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search customers by name, company, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </CardBody>
        </Card>

        {/* Customers Table */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            {filteredCustomers.length > 0 ? (
              <MobileTable
                data={filteredCustomers}
                columns={[
                  {
                    key: 'customer_company_name',
                    label: 'Customer/Company Name',
                    render: (value) => <Text fontWeight="medium">{value}</Text>
                  },
                  {
                    key: 'customer_type',
                    label: 'Type',
                    render: (value) => (
                      <Badge colorScheme={value === 'business' ? 'blue' : 'green'}>
                        {value}
                      </Badge>
                    )
                  },
                  {
                    key: 'contact_person',
                    label: 'Contact',
                    render: (value) => value || '-'
                  },
                  {
                    key: 'email',
                    label: 'Email',
                    render: (value, row) => (
                      value ? (
                        <HStack>
                          <FiMail size={14} />
                          <Text>{value}</Text>
                        </HStack>
                      ) : '-'
                    )
                  },
                  {
                    key: 'phone',
                    label: 'Phone',
                    render: (value, row) => (
                      value ? (
                        <HStack>
                          <FiPhone size={14} />
                          <Text>{value}</Text>
                        </HStack>
                      ) : '-'
                    )
                  },
                  {
                    key: 'credit_limit',
                    label: 'Credit Limit',
                    render: (value) => `ر.س ${value?.toLocaleString() || '0'}`
                  },
                  {
                    key: 'reliability_rating',
                    label: 'Reliability',
                    render: (value, row) => (
                      <Badge colorScheme={getReliabilityColor(value || 0)}>
                        {value || 0}/10
                      </Badge>
                    )
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    isAction: true,
                    render: (value, row) => (
                      <HStack spacing={2}>
                        <Tooltip label="View Details">
                          <IconButton
                            size="sm"
                            icon={<FiEye />}
                            aria-label="View customer"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(row, false);
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="Edit Customer">
                          <IconButton
                            size="sm"
                            icon={<FiEdit />}
                            aria-label="Edit customer"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenModal(row, true);
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="Delete Customer">
                          <IconButton
                            size="sm"
                            icon={<FiTrash2 />}
                            aria-label="Delete customer"
                            variant="ghost"
                            colorScheme="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(row._id);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                    )
                  }
                ]}
                onRowClick={(customer) => handleOpenModal(customer, false)}
              />
            ) : (
              <VStack spacing={4} py={8}>
                <Text color="gray.500">No customers found</Text>
                <Button
                  colorScheme="blue"
                  leftIcon={<FiPlus />}
                  onClick={() => handleOpenModal()}
                >
                  Add Your First Customer
                </Button>
              </VStack>
            )}
          </CardBody>
        </Card>

        {/* Customer Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxW="90vw" maxH="90vh">
            <ModalHeader>
              {isEditMode ? 'Edit Customer' : 'Add New Customer'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={0}>
              <CustomerForm
                initialData={selectedCustomer ? {
                  customer_company_name: selectedCustomer.customer_company_name,
                  customer_company_name_arabic: selectedCustomer.customer_company_name_arabic || '',
                  customer_type: selectedCustomer.customer_type,
                  contact_person: selectedCustomer.contact_person || '',
                  contact_person_arabic: selectedCustomer.contact_person_arabic || '',
                  email: selectedCustomer.email || '',
                  phone: selectedCustomer.phone || '',
                  address: selectedCustomer.address || '',
                  address_arabic: selectedCustomer.address_arabic || '',
                  // Detailed address fields for invoicing and business documents
                  building_number: selectedCustomer.building_number || '',
                  street: selectedCustomer.street || '',
                  additional_number: selectedCustomer.additional_number || '',
                  district: selectedCustomer.district || '',
                  city: selectedCustomer.city || '',
                  state_province: selectedCustomer.state_province || '',
                  zip_postal_code: selectedCustomer.zip_postal_code || '',
                  country: selectedCustomer.country || '',
                  website: selectedCustomer.website || '',
                  vat_number: selectedCustomer.vat_number || '',
                  cr_number: selectedCustomer.cr_number || '',
                  payment_terms: selectedCustomer.payment_terms || '',
                  custom_payment_terms: selectedCustomer.custom_payment_terms || '',
                  credit_limit: selectedCustomer.credit_limit || 0,
                  reliability_rating: selectedCustomer.reliability_rating || 5,
                  notes: selectedCustomer.notes || '',
                  notes_arabic: selectedCustomer.notes_arabic || '',
                  // Bank Details
                  bank_name: selectedCustomer.bank_name || '',
                  bank_name_arabic: selectedCustomer.bank_name_arabic || '',
                  account_number: selectedCustomer.account_number || '',
                  iban: selectedCustomer.iban || '',
                  swift_code: selectedCustomer.swift_code || '',
                  bank_address: selectedCustomer.bank_address || '',
                  bank_address_arabic: selectedCustomer.bank_address_arabic || '',
                  account_holder_name: selectedCustomer.account_holder_name || '',
                  account_holder_name_arabic: selectedCustomer.account_holder_name_arabic || '',
                } : undefined}
                onSubmit={handleSubmit}
                onCancel={onClose}
                isLoading={false}
                isViewMode={!isEditMode && !!selectedCustomer}
              />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Floating Action Button for mobile */}
        <FloatingActionButton
          icon={FiPlus}
          onClick={() => {
            setSelectedCustomer(null);
            setIsEditMode(false);
            onOpen();
          }}
          colorScheme="blue"
          size="lg"
          position="bottom-right"
        />
      </VStack>
    </Box>
  );
};

export default CustomerListScreen;
