import React, { useState } from 'react';
import {
  Box, VStack, HStack, FormControl, FormLabel, Input, Select,
  Button, Text, useColorModeValue, Grid, GridItem, useBreakpointValue,
  Divider, Collapse, IconButton, useDisclosure
} from '@chakra-ui/react';
import { FiSave, FiChevronDown, FiChevronUp, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface SimplifiedCustomerFormData {
  // ESSENTIAL FIELDS (Mandatory for ZATCA Compliance)
  customer_company_name: string;
  customer_type: 'business' | 'individual';
  vat_number: string;
  address: string;
  city: string;
  country: string;
  
  // HIGHLY RECOMMENDED FIELDS
  contact_person: string;
  email: string;
  phone: string;
  payment_terms: string;
  
  // OPTIONAL FIELDS (Can be added later)
  website?: string;
  notes?: string;
}

interface SimplifiedCustomerFormProps {
  initialData?: Partial<SimplifiedCustomerFormData>;
  onSubmit: (data: SimplifiedCustomerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isViewMode?: boolean;
}

const SimplifiedCustomerForm: React.FC<SimplifiedCustomerFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
  isViewMode = false
}) => {
  const [formData, setFormData] = useState<SimplifiedCustomerFormData>({
    customer_company_name: initialData.customer_company_name || '',
    customer_type: initialData.customer_type || 'business',
    vat_number: initialData.vat_number || '',
    address: initialData.address || '',
    city: initialData.city || '',
    country: initialData.country || 'Saudi Arabia',
    contact_person: initialData.contact_person || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    payment_terms: initialData.payment_terms || 'Net 30',
    website: initialData.website || '',
    notes: initialData.notes || '',
  });

  const { isOpen: showOptional, onToggle: toggleOptional } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mandatory fields
    if (!formData.customer_company_name.trim()) {
      toast.error('Company name is required');
      return;
    }
    
    if (!formData.vat_number.trim()) {
      toast.error('VAT number is required for ZATCA compliance');
      return;
    }
    
    if (!formData.address.trim()) {
      toast.error('Address is required for ZATCA compliance');
      return;
    }
    
    if (!formData.city.trim()) {
      toast.error('City is required for ZATCA compliance');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: keyof SimplifiedCustomerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      p={6}
      maxW="800px"
      mx="auto"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="gray.700" mb={2}>
            {isViewMode ? 'Customer Details' : 'Register New Customer'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {isViewMode 
              ? 'View customer information' 
              : 'Essential information for quotations and ZATCA-compliant invoices'
            }
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            
            {/* ESSENTIAL INFORMATION SECTION */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="blue.600" mb={4}>
                📋 Essential Information
              </Text>
              <Text fontSize="sm" color="gray.600" mb={4}>
                Required for ZATCA compliance and invoice generation
              </Text>
              
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Company/Individual Name *
                    </FormLabel>
                    <Input
                      value={formData.customer_company_name}
                      onChange={(e) => handleInputChange('customer_company_name', e.target.value)}
                      placeholder="Enter company or individual name"
                      isDisabled={isViewMode}
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </FormControl>
                </GridItem>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Customer Type *
                  </FormLabel>
                  <Select
                    value={formData.customer_type}
                    onChange={(e) => handleInputChange('customer_type', e.target.value as 'business' | 'individual')}
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    <option value="business">Business</option>
                    <option value="individual">Individual</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    VAT Number *
                  </FormLabel>
                  <Input
                    value={formData.vat_number}
                    onChange={(e) => handleInputChange('vat_number', e.target.value)}
                    placeholder="e.g., 300000000000003"
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Required for ZATCA compliance
                  </Text>
                </FormControl>

                <GridItem colSpan={{ base: 1, md: 2 }}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">
                      Address *
                    </FormLabel>
                    <Input
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter complete address"
                      isDisabled={isViewMode}
                      size={isMobile ? 'sm' : 'md'}
                    />
                  </FormControl>
                </GridItem>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    City *
                  </FormLabel>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="e.g., Riyadh"
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Country *
                  </FormLabel>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="e.g., Saudi Arabia"
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  />
                </FormControl>
              </Grid>
            </Box>

            <Divider />

            {/* CONTACT INFORMATION SECTION */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="green.600" mb={4}>
                📞 Contact Information
              </Text>
              <Text fontSize="sm" color="gray.600" mb={4}>
                Recommended for business operations
              </Text>
              
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Contact Person
                  </FormLabel>
                  <Input
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange('contact_person', e.target.value)}
                    placeholder="e.g., John Smith"
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Email
                  </FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="e.g., contact@company.com"
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Phone
                  </FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="e.g., +966 50 123 4567"
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Payment Terms
                  </FormLabel>
                  <Select
                    value={formData.payment_terms}
                    onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                    isDisabled={isViewMode}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                    <option value="Advance Payment">Advance Payment</option>
                  </Select>
                </FormControl>
              </Grid>
            </Box>

            {/* OPTIONAL INFORMATION SECTION */}
            <Box>
              <HStack justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="semibold" color="gray.600">
                  📝 Additional Information
                </Text>
                <IconButton
                  aria-label={showOptional ? 'Hide optional fields' : 'Show optional fields'}
                  icon={showOptional ? <FiChevronUp /> : <FiChevronDown />}
                  onClick={toggleOptional}
                  size="sm"
                  variant="ghost"
                  isDisabled={isViewMode}
                />
              </HStack>
              
              <Collapse in={showOptional} animateOpacity>
                <Box mt={4}>
                  <Text fontSize="sm" color="gray.600" mb={4}>
                    Optional fields that can be added later
                  </Text>
                  
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                    <FormControl>
                      <FormLabel fontSize="sm" fontWeight="semibold">
                        Website
                      </FormLabel>
                      <Input
                        value={formData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="e.g., https://company.com"
                        isDisabled={isViewMode}
                        size={isMobile ? 'sm' : 'md'}
                      />
                    </FormControl>

                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="semibold">
                          Notes
                        </FormLabel>
                        <Input
                          value={formData.notes || ''}
                          onChange={(e) => handleInputChange('notes', e.target.value)}
                          placeholder="Any additional notes about this customer"
                          isDisabled={isViewMode}
                          size={isMobile ? 'sm' : 'md'}
                        />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Box>
              </Collapse>
            </Box>

            {/* ACTION BUTTONS */}
            {!isViewMode && (
              <HStack spacing={4} justify="flex-end" pt={4}>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  isDisabled={isLoading}
                  size={isMobile ? 'sm' : 'md'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  colorScheme="blue"
                  leftIcon={<FiSave />}
                  isLoading={isLoading}
                  loadingText="Saving..."
                  size={isMobile ? 'sm' : 'md'}
                >
                  {initialData.customer_company_name ? 'Update Customer' : 'Create Customer'}
                </Button>
              </HStack>
            )}
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default SimplifiedCustomerForm;
