import React, { useState } from 'react';
import {
  Box, VStack, HStack, Button, Text, useColorModeValue,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, useToast, Spinner, Center,
  Stepper, Step, StepIndicator, StepStatus, StepIcon, StepNumber, StepTitle, StepDescription,
  StepSeparator, useSteps, Badge
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiEye, FiTrash2, FiUser, FiCreditCard } from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import ModularCustomerDetailsForm from '../components/ModularCustomerDetailsForm';
import ModularBankDetailsForm from '../components/ModularBankDetailsForm';

interface Customer {
  _id: Id<"customers">;
  _creationTime: number;
  customer_company_name: string;
  customer_company_name_arabic: string;
  customer_type: 'business' | 'individual';
  vat_number: string;
  address: string;
  address_arabic: string;
  city: string;
  city_arabic: string;
  country: string;
  country_arabic: string;
  contact_person: string;
  contact_person_arabic: string;
  email: string;
  phone: string;
  payment_terms: string;
  website?: string;
  notes?: string;
  // Bank details
  bank_name?: string;
  bank_name_arabic?: string;
  account_number?: string;
  iban?: string;
  swift_code?: string;
  bank_address?: string;
  bank_address_arabic?: string;
  account_holder_name?: string;
  account_holder_name_arabic?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const steps = [
  { title: 'Customer Details', description: 'Basic information' },
  { title: 'Bank Details', description: 'Banking information' },
];

const ModularCustomerRegistrationScreen: React.FC = () => {
  const { selectedOrganization, user } = useAuth();
  const toast = useToast();
  
  // State management
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [customerDetailsData, setCustomerDetailsData] = useState<any>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Modal controls
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();

  // Stepper
  const { activeStep, setActiveStep } = useSteps({
    index: currentStep,
    count: steps.length,
  });

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

  // Handle customer details form submission
  const handleCustomerDetailsSubmit = async (data: any) => {
    if (!isConvex) {
      toast({
        title: selectedCustomer && !isCreatingNew ? 'Customer updated (offline mode)' : 'Customer created (offline mode)',
        status: 'success',
        duration: 3000,
      });
      onClose();
      return;
    }
    try {
      if (selectedCustomer && !isCreatingNew) {
        // Update existing customer
        await updateCustomer({
          id: selectedCustomer._id,
          ...data,
          updated_by: user?.email || 'unknown',
        });
        toast({
          title: 'Customer updated successfully',
          status: 'success',
          duration: 3000,
        });
        onFormClose();
        setSelectedCustomer(null);
        setCurrentStep(0);
        setCustomerDetailsData(null);
      } else {
        // Store customer details and move to bank details
        setCustomerDetailsData(data);
        setCurrentStep(1);
        setActiveStep(1);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save customer details',
        status: 'error',
        duration: 5000,
      });
    }
  };

  // Handle bank details form submission
  const handleBankDetailsSubmit = async (data: any) => {
    try {
      if (isCreatingNew && customerDetailsData) {
        // Create new customer with both details and bank info
        await createCustomer({
          ...customerDetailsData,
          ...data,
          organization_id: selectedOrganization as Id<"organizations">,
          created_by: user?.email || 'unknown',
        });
        toast({
          title: 'Customer created successfully',
          status: 'success',
          duration: 3000,
        });
      } else if (selectedCustomer) {
        // Update existing customer with bank details
        await updateCustomer({
          id: selectedCustomer._id,
          ...customerDetailsData,
          ...data,
          updated_by: user?.email || 'unknown',
        });
        toast({
          title: 'Customer updated successfully',
          status: 'success',
          duration: 3000,
        });
      }
      
      onFormClose();
      setSelectedCustomer(null);
      setCurrentStep(0);
      setActiveStep(0);
      setCustomerDetailsData(null);
      setIsCreatingNew(false);
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
    setCurrentStep(0);
    setActiveStep(0);
    setCustomerDetailsData(null);
    setIsCreatingNew(false);
  };

  // Handle back to customer details
  const handleBackToCustomerDetails = () => {
    setCurrentStep(0);
    setActiveStep(0);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewMode(false);
    setIsCreatingNew(false);
    setCurrentStep(0);
    setActiveStep(0);
    onFormOpen();
  };

  // Handle view customer
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewMode(true);
    setCurrentStep(0);
    setActiveStep(0);
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
    setIsCreatingNew(true);
    setCurrentStep(0);
    setActiveStep(0);
    setCustomerDetailsData(null);
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
              Customer Registration
            </Text>
            <Text fontSize="sm" color="gray.500">
              Modular customer registration with side-by-side English/Arabic fields
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
            <Box overflowX="auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: useColorModeValue('#f7fafc', '#2d3748') }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Company Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>VAT Number</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Contact Person</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>City</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Bank Info</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px' }}>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Text fontWeight="semibold">{customer.customer_company_name}</Text>
                            {customer.customer_company_name_arabic && (
                              <Badge colorScheme="green" variant="outline" fontSize="xs">
                                عربي
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.500">{customer.address}</Text>
                          {customer.address_arabic && (
                            <Text fontSize="sm" color="green.600" dir="rtl">{customer.address_arabic}</Text>
                          )}
                        </VStack>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Badge
                          colorScheme={customer.customer_type === 'business' ? 'blue' : 'green'}
                          variant="subtle"
                        >
                          {customer.customer_type}
                        </Badge>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Text fontFamily="mono" fontSize="sm">
                          {customer.vat_number}
                        </Text>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">{customer.contact_person || 'N/A'}</Text>
                          {customer.contact_person_arabic && (
                            <Text fontSize="xs" color="green.600" dir="rtl">{customer.contact_person_arabic}</Text>
                          )}
                        </VStack>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <Text fontSize="sm">{customer.email || 'N/A'}</Text>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">{customer.city}</Text>
                          {customer.city_arabic && (
                            <Text fontSize="xs" color="green.600" dir="rtl">{customer.city_arabic}</Text>
                          )}
                        </VStack>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <HStack spacing={1}>
                          {customer.bank_name && (
                            <Badge colorScheme="blue" variant="outline" fontSize="xs">
                              <FiCreditCard />
                            </Badge>
                          )}
                          {customer.iban && (
                            <Badge colorScheme="green" variant="outline" fontSize="xs">
                              IBAN
                            </Badge>
                          )}
                        </HStack>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiEye />}
                            onClick={() => handleViewCustomer(customer)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<FiEdit />}
                            onClick={() => handleEditCustomer(customer)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            leftIcon={<FiTrash2 />}
                            onClick={() => handleDeleteCustomer(customer)}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          ) : (
            <Center py={12}>
              <VStack spacing={4}>
                <Text fontSize="lg" color="gray.500">
                  No customers found
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Add your first customer with modular registration
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
      <Modal isOpen={isFormOpen} onClose={handleFormCancel} size="full">
        <ModalOverlay />
        <ModalContent maxW="100vw" maxH="100vh">
          <ModalHeader>
            <VStack align="start" spacing={2}>
              <Text>
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </Text>
              {!isViewMode && (
                <Stepper index={activeStep} colorScheme="blue" size="sm">
                  {steps.map((step, index) => (
                    <Step key={index}>
                      <StepIndicator>
                        <StepStatus
                          complete={<StepIcon />}
                          incomplete={<StepNumber />}
                          active={<StepNumber />}
                        />
                      </StepIndicator>
                      <Box flexShrink="0">
                        <StepTitle>{step.title}</StepTitle>
                        <StepDescription>{step.description}</StepDescription>
                      </Box>
                      <StepSeparator />
                    </Step>
                  ))}
                </Stepper>
              )}
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            {currentStep === 0 ? (
              <ModularCustomerDetailsForm
                initialData={selectedCustomer || {}}
                onSubmit={handleCustomerDetailsSubmit}
                onCancel={handleFormCancel}
                onNext={handleCustomerDetailsSubmit}
                isLoading={false}
                isViewMode={isViewMode}
                showNextButton={isCreatingNew}
              />
            ) : (
              <ModularBankDetailsForm
                initialData={selectedCustomer || {}}
                customerDetailsData={customerDetailsData}
                onSubmit={handleBankDetailsSubmit}
                onCancel={handleFormCancel}
                onBack={handleBackToCustomerDetails}
                isLoading={false}
                isViewMode={isViewMode}
                showBackButton={true}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Customer View Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="full">
        <ModalOverlay />
        <ModalContent maxW="100vw" maxH="100vh">
          <ModalHeader>Customer Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} overflowY="auto">
            <ModularCustomerDetailsForm
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

export default ModularCustomerRegistrationScreen;
