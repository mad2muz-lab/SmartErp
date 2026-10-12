import React, { useState } from 'react';
import {
  Box, VStack, HStack, Button, Text, useColorModeValue,
  Table, Thead, Tbody, Tr, Th, Td, Badge, IconButton,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, useToast, Spinner, Center
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiEye, FiTrash2 } from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import SimplifiedCustomerForm from '../components/SimplifiedCustomerForm';

interface Customer {
  _id: Id<"customers">;
  _creationTime: number;
  customer_company_name: string;
  customer_type: 'business' | 'individual';
  vat_number: string;
  address: string;
  city: string;
  country: string;
  contact_person: string;
  email: string;
  phone: string;
  payment_terms: string;
  website?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SimplifiedCustomerListScreen: React.FC = () => {
  const { selectedOrganization, user } = useAuth();
  const toast = useToast();
  
  // State management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Modal controls
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  const isConvex = isConvexOrgId(selectedOrganization);

  // Queries
  const rawCustomers = useQuery(
    api.simplifiedCustomers.listCustomers,
    isConvex ? { organization_id: selectedOrganization as Id<"organizations"> } : "skip"
  );
  const customers = isConvex ? rawCustomers : [];

  // Mutations
  const createCustomer = useMutation(api.simplifiedCustomers.createCustomer);
  const updateCustomer = useMutation(api.simplifiedCustomers.updateCustomer);
  const deleteCustomer = useMutation(api.simplifiedCustomers.deleteCustomer);

  // Loading state
  const isLoading = customers === undefined;

  // Handle form submission
  const handleFormSubmit = async (formData: any) => {
    if (!isConvex) {
      toast({
        title: selectedCustomer ? 'Customer updated (offline mode)' : 'Customer created (offline mode)',
        status: 'success',
        duration: 3000,
      });
      onFormClose();
      return;
    }
    try {
      if (selectedCustomer) {
        // Update existing customer
        await updateCustomer({
          id: selectedCustomer._id,
          ...formData,
          updated_by: user?.email || 'unknown',
        });
        toast({
          title: 'Customer updated successfully',
          status: 'success',
          duration: 3000,
        });
      } else {
        // Create new customer
        await createCustomer({
          ...formData,
          organization_id: selectedOrganization as Id<"organizations">,
          created_by: user?.email || 'unknown',
        });
        toast({
          title: 'Customer created successfully',
          status: 'success',
          duration: 3000,
        });
      }
      
      onFormClose();
      setSelectedCustomer(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save customer',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    onFormClose();
    setSelectedCustomer(null);
    setIsViewMode(false);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewMode(false);
    onFormOpen();
  };

  // Handle view customer
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewMode(true);
    onViewOpen();
  };

  // Handle delete customer
  const handleDeleteCustomer = async (customer: Customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.customer_company_name}?`)) {
      try {
        await deleteCustomer({
          id: customer._id,
          deleted_by: user?.email || 'unknown',
        });
        toast({
          title: 'Customer deleted successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete customer',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  // Handle new customer
  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setIsViewMode(false);
    onFormOpen();
  };

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="lg" color="blue.500" />
          <Text color="gray.500">Loading customers...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="gray.700">
              Customers
            </Text>
            <Text fontSize="sm" color="gray.500">
              Manage your customers for quotations and ZATCA-compliant invoices
            </Text>
          </Box>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleNewCustomer}
            size="md"
          >
            Add Customer
          </Button>
        </HStack>

        {/* Customers Table */}
        <Box
          bg={bgColor}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          {customers && customers.length > 0 ? (
            <Table variant="simple">
              <Thead bg={useColorModeValue('gray.50', 'gray.700')}>
                <Tr>
                  <Th>Company Name</Th>
                  <Th>Type</Th>
                  <Th>VAT Number</Th>
                  <Th>Contact Person</Th>
                  <Th>Email</Th>
                  <Th>City</Th>
                  <Th>Payment Terms</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {customers.map((customer) => (
                  <Tr key={customer._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="semibold">{customer.customer_company_name}</Text>
                        <Text fontSize="sm" color="gray.500">{customer.address}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={customer.customer_type === 'business' ? 'blue' : 'green'}
                        variant="subtle"
                      >
                        {customer.customer_type}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontFamily="mono" fontSize="sm">
                        {customer.vat_number}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{customer.contact_person || 'N/A'}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{customer.email || 'N/A'}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{customer.city}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{customer.payment_terms}</Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="View customer"
                          icon={<FiEye />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCustomer(customer)}
                        />
                        <IconButton
                          aria-label="Edit customer"
                          icon={<FiEdit />}
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditCustomer(customer)}
                        />
                        <IconButton
                          aria-label="Delete customer"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDeleteCustomer(customer)}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Center py={12}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  No customers found
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Add your first customer to start creating quotations and invoices
                </Text>
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  variant="outline"
                  onClick={handleNewCustomer}
                >
                  Add Customer
                </Button>
              </VStack>
            </Center>
          )}
        </Box>
      </VStack>

      {/* Customer Form Modal */}
      <Modal isOpen={isFormOpen} onClose={handleFormCancel} size="xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>
            {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SimplifiedCustomerForm
              initialData={selectedCustomer || {}}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={false}
              isViewMode={false}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Customer View Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent maxW="900px">
          <ModalHeader>Customer Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <SimplifiedCustomerForm
              initialData={selectedCustomer || {}}
              onSubmit={() => {}}
              onCancel={onViewClose}
              isLoading={false}
              isViewMode={true}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default SimplifiedCustomerListScreen;
