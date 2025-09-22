import React, { useState } from 'react';
import {
  Box, VStack, HStack, FormControl, FormLabel, Input, Select, Textarea,
  NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, Button, Text, useColorModeValue,
  Grid, GridItem, useBreakpointValue,
} from '@chakra-ui/react';
import { FiSave, FiCamera, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import ArabicField from './ArabicField';
import BusinessCardScanner from './BusinessCardScanner';
import { BusinessCardData } from '../utils/ocrService';
import { 
  validateVATNumber, 
  validateCRNumber, 
  validateCreditDays, 
  validateBuildingNumber, 
  validateAdditionalNumber, 
  validateZipCode, 
  validatePhoneNumberEnhanced,
  validateUrl,
  validateEmail
} from '../utils/inputValidation';

interface CustomerFormData {
  customer_company_name: string;
  customer_company_name_arabic: string;
  customer_type: 'business' | 'individual';
  contact_person: string;
  contact_person_arabic: string;
  email: string;
  phone: string;
  address: string;
  address_arabic: string;
  // Detailed address fields for invoicing and business documents
  building_number: string;
  street: string;
  additional_number: string;
  district: string;
  city: string;
  state_province: string;
  zip_postal_code: string;
  country: string;
  website: string;
  vat_number: string;
  cr_number: string;
  payment_terms: string;
  custom_payment_terms: string;
  credit_days: number;
  credit_limit: number;
  reliability_rating: number;
  notes: string;
  notes_arabic: string;
  // Bank Details
  bank_name: string;
  bank_name_arabic: string;
  account_number: string;
  iban: string;
  swift_code: string;
  bank_address: string;
  bank_address_arabic: string;
  account_holder_name: string;
  account_holder_name_arabic: string;
}

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isViewMode?: boolean;
}

// Mobile-optimized form field component
const MobileOptimizedField: React.FC<{
  label: string;
  children: React.ReactNode;
  isRequired?: boolean;
  helpText?: string;
}> = ({ label, children, isRequired = false, helpText }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <FormControl isRequired={isRequired}>
      <FormLabel
        fontSize={isMobile ? 'sm' : 'md'}
        fontWeight="semibold"
        mb={isMobile ? 1 : 2}
        color="gray.700"
      >
        {label}
      </FormLabel>
      <Box position="relative">
        {children}
      </Box>
      {helpText && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {helpText}
        </Text>
      )}
    </FormControl>
  );
};

// Mobile-optimized input component
const MobileOptimizedInput: React.FC<{
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric';
  autoComplete?: string;
  maxLength?: number;
}> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  inputMode,
  autoComplete,
  maxLength
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode={inputMode}
      autoComplete={autoComplete}
      maxLength={maxLength}
      fontSize={isMobile ? '16px' : 'md'} // Prevents zoom on iOS
      h={isMobile ? '48px' : '40px'}
      borderRadius="md"
      bg="white"
      border="1px"
      borderColor="gray.300"
      _focus={{
        borderColor: 'blue.500',
        boxShadow: '0 0 0 1px #3182ce',
        bg: 'white',
      }}
      _hover={{
        borderColor: 'gray.400',
      }}
      transition="all 0.2s"
    />
  );
};

// Mobile-optimized keyboard component
const MobileKeyboardInput: React.FC<{
  type: 'text' | 'email' | 'phone' | 'number' | 'url';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  maxLength?: number;
}> = ({ type, placeholder, value, onChange, autoComplete, maxLength }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  const getInputMode = () => {
    switch (type) {
      case 'email': return 'email';
      case 'phone': return 'tel';
      case 'number': return 'numeric';
      case 'url': return 'url';
      default: return 'text';
    }
  };

  const getKeyboardType = () => {
    switch (type) {
      case 'email': return 'email-address';
      case 'phone': return 'phone-pad';
      case 'number': return 'numeric';
      case 'url': return 'url';
      default: return 'default';
    }
  };

  return (
    <Input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      inputMode={getInputMode()}
      autoComplete={autoComplete}
      maxLength={maxLength}
      fontSize={isMobile ? '16px' : 'md'} // Prevents zoom on iOS
      h={isMobile ? '48px' : '40px'}
      borderRadius="md"
      bg="white"
      border="1px"
      borderColor="gray.300"
      _focus={{
        borderColor: 'blue.500',
        boxShadow: '0 0 0 1px #3182ce',
        bg: 'white',
      }}
      _hover={{
        borderColor: 'gray.400',
      }}
      transition="all 0.2s"
      // Add mobile-specific attributes
      autoCapitalize={type === 'text' ? 'words' : 'none'}
      autoCorrect={type === 'text' ? 'on' : 'off'}
      spellCheck={type === 'text'}
      // Add data attributes for mobile optimization
      data-keyboard-type={getKeyboardType()}
    />
  );
};

// Mobile form section component for better organization
const MobileFormSection: React.FC<{
  title: string;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}> = ({ title, children, isExpanded = true, onToggle }) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (!isMobile) {
    return (
      <Box>
        <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.700">
          {title}
        </Text>
        {children}
      </Box>
    );
  }

  return (
    <Box border="1px" borderColor="gray.200" borderRadius="lg" overflow="hidden">
      <Button
        w="100%"
        variant="ghost"
        justifyContent="space-between"
        py={3}
        px={4}
        onClick={onToggle}
        fontSize="md"
        fontWeight="semibold"
        color="gray.700"
        _hover={{ bg: 'gray.50' }}
        rightIcon={isExpanded ? <FiChevronUp /> : <FiChevronDown />}
      >
        {title}
      </Button>
      {isExpanded && (
        <Box p={4} bg="gray.50" borderTop="1px" borderColor="gray.200">
          {children}
        </Box>
      )}
    </Box>
  );
};

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isViewMode = false,
}) => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [showScanner, setShowScanner] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<CustomerFormData>({
    customer_company_name: '',
    customer_company_name_arabic: '',
    customer_type: 'business',
    contact_person: '',
    contact_person_arabic: '',
    email: '',
    phone: '',
    address: '',
    address_arabic: '',
    // Detailed address fields for invoicing and business documents
    building_number: '',
    street: '',
    additional_number: '',
    district: '',
    city: '',
    state_province: '',
    zip_postal_code: '',
    country: '',
    website: '',
    vat_number: '',
    cr_number: '',
    payment_terms: '',
    custom_payment_terms: '',
    credit_days: 0,
    credit_limit: 0,
    reliability_rating: 5,
    notes: '',
    notes_arabic: '',
    // Bank Details
    bank_name: '',
    bank_name_arabic: '',
    account_number: '',
    iban: '',
    swift_code: '',
    bank_address: '',
    bank_address_arabic: '',
    account_holder_name: '',
    account_holder_name_arabic: '',
    ...initialData,
  });

  const [showCustomPaymentTerms, setShowCustomPaymentTerms] = useState(false);

  const validateField = (field: keyof CustomerFormData, value: any): string => {
    switch (field) {
      case 'vat_number':
        return validateVATNumber(value).errors[0] || '';
      case 'cr_number':
        return validateCRNumber(value).errors[0] || '';
      case 'credit_days':
        return validateCreditDays(value).errors[0] || '';
      case 'building_number':
        return validateBuildingNumber(value).errors[0] || '';
      case 'additional_number':
        return validateAdditionalNumber(value).errors[0] || '';
      case 'zip_postal_code':
        return validateZipCode(value).errors[0] || '';
      case 'phone':
        return validatePhoneNumberEnhanced(value).errors[0] || '';
      case 'website':
        return validateUrl(value).errors[0] || '';
      case 'email':
        return validateEmail(value).errors[0] || '';
      default:
        return '';
    }
  };

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Validate field in real-time
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error,
    }));
  };

  const handleSubmit = () => {
    if (isViewMode) {
      onCancel();
      return;
    }
    
    // Validate all fields
    const errors: Record<string, string> = {};
    
    if (!formData.customer_company_name.trim()) {
      errors.customer_company_name = 'Customer/Company Name is required';
    }
    
    // Validate all fields with validation rules
    const fieldsToValidate: (keyof CustomerFormData)[] = [
      'vat_number', 'cr_number', 'credit_days', 'building_number', 
      'additional_number', 'zip_postal_code', 'phone', 'website', 'email'
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        errors[field] = error;
      }
    });
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix validation errors before submitting');
      return;
    }
    
    onSubmit(formData);
  };

  const handleDataExtracted = (data: BusinessCardData) => {
    setFormData(prev => ({
      ...prev,
      customer_company_name: data.companyName || prev.customer_company_name,
      contact_person: data.contactPerson || prev.contact_person,
      email: data.email || prev.email,
      phone: data.mobile || prev.phone, // Use mobile as primary phone
      website: data.website || prev.website,
      address: data.address || prev.address,
      vat_number: data.vatNumber || prev.vat_number,
      cr_number: data.crNumber || prev.cr_number,
    }));
    toast.success('Business card data extracted successfully!');
  };

  const paymentTermsOptions = [
    'Cash on Delivery',
    'Due on Invoice',
    '50% Advance and 50% upon Delivery',
    'Custom',
  ];

  const reliabilityOptions = [
    { value: 1, label: '1 - Very Poor' },
    { value: 2, label: '2 - Poor' },
    { value: 3, label: '3 - Fair' },
    { value: 4, label: '4 - Below Average' },
    { value: 5, label: '5 - Average' },
    { value: 6, label: '6 - Above Average' },
    { value: 7, label: '7 - Good' },
    { value: 8, label: '8 - Very Good' },
    { value: 9, label: '9 - Excellent' },
    { value: 10, label: '10 - Outstanding' },
  ];

  return (
    <Box maxH="calc(100vh - 200px)" overflowY="auto" p={{ base: 2, md: 4 }}>
      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Text fontSize={{ base: 'lg', md: 'lg' }} fontWeight="bold">
              {isViewMode ? 'Customer Details' : 'Customer Information'}
            </Text>
            {!isViewMode && (
              <Button
                leftIcon={<FiCamera />}
                colorScheme="blue"
                variant="outline"
                size={{ base: 'sm', md: 'md' }}
                onClick={() => setShowScanner(true)}
              >
                Scan Business Card
              </Button>
            )}
          </HStack>
          <Text fontSize={{ base: 'sm', md: 'sm' }} color="gray.600">
            {isViewMode ? 'View customer information below.' : 'Fill in the customer details. Only Customer/Company Name is required.'}
          </Text>
        </Box>

        {/* Main Form Grid */}
        <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={{ base: 4, md: 6 }}>
          {/* Left Column */}
          <VStack spacing={{ base: 4, md: 4 }} align="stretch">
            {/* Customer/Company Name - Required */}
            <FormControl isRequired>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Customer/Company Name *
              </FormLabel>
              <Input
                value={formData.customer_company_name}
                onChange={(e) => handleInputChange('customer_company_name', e.target.value)}
                placeholder="Enter customer or company name"
                dir="auto"
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
              />
            </FormControl>

            {/* Customer/Company Name - Arabic */}
            <ArabicField
              label="Customer/Company Name"
              englishValue={formData.customer_company_name}
              arabicValue={formData.customer_company_name_arabic}
              onArabicChange={(value) => handleInputChange('customer_company_name_arabic', value)}
              placeholder="Enter customer or company name"
              autoTranslate={true}
              isReadOnly={isViewMode}
            />

            {/* Customer Type */}
            <FormControl>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Customer Type
              </FormLabel>
              <Select
                value={formData.customer_type}
                onChange={(e) => handleInputChange('customer_type', e.target.value)}
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isDisabled={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
              >
                <option value="business">Business</option>
                <option value="individual">Individual</option>
              </Select>
            </FormControl>

            {/* Contact Person */}
            <FormControl>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Contact Person
              </FormLabel>
              <Input
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Enter contact person name"
                dir="auto"
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
              />
            </FormControl>

            {/* Contact Person - Arabic */}
            <ArabicField
              label="Contact Person"
              englishValue={formData.contact_person}
              arabicValue={formData.contact_person_arabic}
              onArabicChange={(value) => handleInputChange('contact_person_arabic', value)}
              placeholder="Enter contact person name"
              autoTranslate={true}
              isReadOnly={isViewMode}
            />

            {/* Email */}
            <FormControl isInvalid={!!validationErrors.email}>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Email
              </FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
              />
              {validationErrors.email && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {validationErrors.email}
                </Text>
              )}
            </FormControl>

            {/* Phone */}
            <FormControl isInvalid={!!validationErrors.phone}>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Phone
              </FormLabel>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter phone number (+1234567890)"
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
              />
              {validationErrors.phone && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {validationErrors.phone}
                </Text>
              )}
            </FormControl>

            {/* Website */}
            <FormControl isInvalid={!!validationErrors.website}>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Website
              </FormLabel>
              <Input
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="Enter website URL (https://example.com)"
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
              />
              {validationErrors.website && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {validationErrors.website}
                </Text>
              )}
            </FormControl>
          </VStack>

          {/* Right Column */}
          <VStack spacing={{ base: 4, md: 4 }} align="stretch">
            {/* VAT Number */}
            <FormControl isInvalid={!!validationErrors.vat_number}>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                VAT Number
              </FormLabel>
              <Input
                value={formData.vat_number}
                onChange={(e) => handleInputChange('vat_number', e.target.value)}
                placeholder="Enter VAT number (15 digits)"
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
                maxLength={15}
              />
              {validationErrors.vat_number && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {validationErrors.vat_number}
                </Text>
              )}
            </FormControl>

            {/* CR Number */}
            <FormControl isInvalid={!!validationErrors.cr_number}>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                CR Number
              </FormLabel>
              <Input
                value={formData.cr_number}
                onChange={(e) => handleInputChange('cr_number', e.target.value)}
                placeholder="Enter CR number (10 digits)"
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
                maxLength={10}
              />
              {validationErrors.cr_number && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {validationErrors.cr_number}
                </Text>
              )}
            </FormControl>

            {/* Credit Days */}
            <FormControl isInvalid={!!validationErrors.credit_days}>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Credit Days
              </FormLabel>
              <NumberInput
                value={formData.credit_days}
                onChange={(valueString, valueNumber) => handleInputChange('credit_days', valueNumber)}
                min={0}
                max={365}
                size={{ base: 'lg', md: 'md' }}
                isReadOnly={isViewMode}
                bg={isViewMode ? 'gray.50' : 'white'}
              >
                <NumberInputField
                  placeholder="Enter credit days"
                  fontSize={{ base: 'md', md: 'sm' }}
                  minH={{ base: '48px', md: 'auto' }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              {validationErrors.credit_days && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {validationErrors.credit_days}
                </Text>
              )}
            </FormControl>

            {/* Payment Terms */}
            <FormControl>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Payment Terms
              </FormLabel>
              <VStack spacing={2} align="stretch">
                <Select
                  value={formData.payment_terms}
                  onChange={(e) => {
                    handleInputChange('payment_terms', e.target.value);
                    setShowCustomPaymentTerms(e.target.value === 'Custom');
                  }}
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                >
                  <option value="">Select payment terms</option>
                  {paymentTermsOptions.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </Select>
                
                {showCustomPaymentTerms && (
                  <Input
                    value={formData.custom_payment_terms}
                    onChange={(e) => handleInputChange('custom_payment_terms', e.target.value)}
                    placeholder="Enter custom payment terms"
                    dir="auto"
                    size={{ base: 'lg', md: 'md' }}
                    minH={{ base: '48px', md: 'auto' }}
                    fontSize={{ base: 'md', md: 'sm' }}
                  />
                )}
              </VStack>
            </FormControl>

            {/* Credit Limit */}
            <FormControl>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Credit Limit (ر.س)
              </FormLabel>
              <NumberInput
                value={formData.credit_limit}
                onChange={(value) => handleInputChange('credit_limit', Number(value))}
                min={0}
                size={{ base: 'lg', md: 'md' }}
              >
                <NumberInputField 
                  placeholder="Enter credit limit" 
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            {/* Reliability Rating */}
            <FormControl>
              <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                Reliability Rating
              </FormLabel>
              <Select
                value={formData.reliability_rating}
                onChange={(e) => handleInputChange('reliability_rating', Number(e.target.value))}
                size={{ base: 'lg', md: 'md' }}
                minH={{ base: '48px', md: 'auto' }}
                fontSize={{ base: 'md', md: 'sm' }}
              >
                {reliabilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
          </VStack>
        </Grid>

        {/* Full Width Fields */}
        <VStack spacing={{ base: 4, md: 4 }} align="stretch">
          {/* Address */}
          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
              Address
            </FormLabel>
            <Textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter complete address"
              rows={4}
              dir="auto"
              size={{ base: 'lg', md: 'md' }}
              minH={{ base: '120px', md: '80px' }}
              fontSize={{ base: 'md', md: 'sm' }}
            />
          </FormControl>

          {/* Address - Arabic */}
          <ArabicField
            label="Address"
            englishValue={formData.address}
            arabicValue={formData.address_arabic}
            onArabicChange={(value) => handleInputChange('address_arabic', value)}
            placeholder="Enter complete address"
            isTextarea={true}
            autoTranslate={true}
          />

          {/* Detailed Address Fields */}
          <Box>
            <Text fontWeight="bold" fontSize="lg" mb={4}>Detailed Address (For Invoicing)</Text>
            
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <FormControl isInvalid={!!validationErrors.building_number}>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  Building Number
                </FormLabel>
                <Input
                  value={formData.building_number}
                  onChange={(e) => handleInputChange('building_number', e.target.value)}
                  placeholder="Building Number (1-4 digits)"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                  maxLength={4}
                />
                {validationErrors.building_number && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {validationErrors.building_number}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  Street
                </FormLabel>
                <Input
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Street Name"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                />
              </FormControl>

              <FormControl isInvalid={!!validationErrors.additional_number}>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  Additional Number
                </FormLabel>
                <Input
                  value={formData.additional_number}
                  onChange={(e) => handleInputChange('additional_number', e.target.value)}
                  placeholder="Additional Number (4 digits)"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                  maxLength={4}
                />
                {validationErrors.additional_number && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {validationErrors.additional_number}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  District
                </FormLabel>
                <Input
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  placeholder="District"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  City
                </FormLabel>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  State/Province
                </FormLabel>
                <Input
                  value={formData.state_province}
                  onChange={(e) => handleInputChange('state_province', e.target.value)}
                  placeholder="State/Province"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                />
              </FormControl>

              <FormControl isInvalid={!!validationErrors.zip_postal_code}>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  Zip/Postal Code
                </FormLabel>
                <Input
                  value={formData.zip_postal_code}
                  onChange={(e) => handleInputChange('zip_postal_code', e.target.value)}
                  placeholder="Zip/Postal Code (5 digits)"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                  maxLength={5}
                />
                {validationErrors.zip_postal_code && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {validationErrors.zip_postal_code}
                  </Text>
                )}
              </FormControl>

              <FormControl>
                <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
                  Country
                </FormLabel>
                <Input
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  placeholder="Country"
                  size={{ base: 'lg', md: 'md' }}
                  minH={{ base: '48px', md: 'auto' }}
                  fontSize={{ base: 'md', md: 'sm' }}
                />
              </FormControl>
            </Grid>
          </Box>

          {/* Notes */}
          <FormControl>
            <FormLabel fontSize={{ base: 'sm', md: 'md' }} mb={{ base: 2, md: 1 }}>
              Notes
            </FormLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter additional notes"
              rows={4}
              dir="auto"
              size={{ base: 'lg', md: 'md' }}
              minH={{ base: '120px', md: '80px' }}
              fontSize={{ base: 'md', md: 'sm' }}
            />
          </FormControl>

          {/* Bank Details Section */}
          <Box>
            <Text fontSize="lg" fontWeight="bold" mb={4} color="blue.600">
              Bank Details
            </Text>
            
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              {/* Bank Name */}
              <ArabicField
                label="Bank Name"
                englishValue={formData.bank_name}
                arabicValue={formData.bank_name_arabic}
                onEnglishChange={(value) => handleInputChange('bank_name', value)}
                onArabicChange={(value) => handleInputChange('bank_name_arabic', value)}
                placeholder="Enter bank name"
                autoTranslate={true}
              />

              {/* Account Number */}
              <MobileOptimizedField label="Account Number">
                <MobileOptimizedInput
                  value={formData.account_number}
                  onChange={(value) => handleInputChange('account_number', value)}
                  placeholder="Enter account number"
                />
              </MobileOptimizedField>

              {/* IBAN */}
              <MobileOptimizedField label="IBAN">
                <MobileOptimizedInput
                  value={formData.iban}
                  onChange={(value) => handleInputChange('iban', value)}
                  placeholder="Enter IBAN"
                />
              </MobileOptimizedField>

              {/* SWIFT Code */}
              <MobileOptimizedField label="SWIFT Code">
                <MobileOptimizedInput
                  value={formData.swift_code}
                  onChange={(value) => handleInputChange('swift_code', value)}
                  placeholder="Enter SWIFT code"
                />
              </MobileOptimizedField>

              {/* Account Holder Name */}
              <ArabicField
                label="Account Holder Name"
                englishValue={formData.account_holder_name}
                arabicValue={formData.account_holder_name_arabic}
                onEnglishChange={(value) => handleInputChange('account_holder_name', value)}
                onArabicChange={(value) => handleInputChange('account_holder_name_arabic', value)}
                placeholder="Enter account holder name"
                autoTranslate={true}
              />

              {/* Bank Address */}
              <ArabicField
                label="Bank Address"
                englishValue={formData.bank_address}
                arabicValue={formData.bank_address_arabic}
                onEnglishChange={(value) => handleInputChange('bank_address', value)}
                onArabicChange={(value) => handleInputChange('bank_address_arabic', value)}
                placeholder="Enter bank address"
                isTextarea={true}
                autoTranslate={true}
              />
            </Grid>
          </Box>

          {/* Notes - Arabic */}
          <ArabicField
            label="Notes"
            englishValue={formData.notes}
            arabicValue={formData.notes_arabic}
            onArabicChange={(value) => handleInputChange('notes_arabic', value)}
            placeholder="Enter additional notes"
            isTextarea={true}
            autoTranslate={true}
          />
        </VStack>

        {/* Action Buttons */}
        <HStack justify="flex-end" spacing={{ base: 3, md: 4 }} pt={{ base: 4, md: 4 }}>
          <Button 
            variant="ghost" 
            onClick={onCancel}
            size={{ base: 'lg', md: 'md' }}
            minH={{ base: '48px', md: 'auto' }}
            fontSize={{ base: 'md', md: 'sm' }}
          >
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button
              colorScheme="blue"
              leftIcon={<FiSave />}
              onClick={handleSubmit}
              isLoading={isLoading}
              size={{ base: 'lg', md: 'md' }}
              minH={{ base: '48px', md: 'auto' }}
              fontSize={{ base: 'md', md: 'sm' }}
              fontWeight="semibold"
            >
              Save Customer
            </Button>
          )}
        </HStack>
      </VStack>

      {/* Business Card Scanner Modal */}
      <BusinessCardScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onDataExtracted={handleDataExtracted}
        title="Scan Customer Business Card"
      />
    </Box>
  );
};

export default CustomerForm;
