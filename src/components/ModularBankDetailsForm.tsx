import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, FormControl, FormLabel, Input, Select,
  Button, Text, useColorModeValue, Grid, GridItem, useBreakpointValue,
  Divider
} from '@chakra-ui/react';
import { FiSave, FiArrowLeft, FiGlobe, FiType, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface BankDetailsFormData {
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

interface ModularBankDetailsFormProps {
  initialData?: Partial<BankDetailsFormData>;
  customerDetailsData?: any; // Data from previous form
  onSubmit: (data: BankDetailsFormData) => void;
  onCancel: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  isViewMode?: boolean;
  showBackButton?: boolean;
}

// Simple translation function for bank-related terms
const translateToArabic = (text: string): string => {
  if (!text.trim()) return '';
  
  const translations: { [key: string]: string } = {
    'Al Rajhi Bank': 'مصرف الراجحي',
    'Saudi National Bank': 'البنك الأهلي السعودي',
    'Riyad Bank': 'بنك الرياض',
    'Saudi British Bank': 'البنك السعودي البريطاني',
    'Banque Saudi Fransi': 'البنك السعودي الفرنسي',
    'Arab National Bank': 'البنك العربي الوطني',
    'Saudi Investment Bank': 'البنك السعودي للاستثمار',
    'Bank AlJazira': 'بنك الجزيرة',
    'Saudi Hollandi Bank': 'البنك السعودي الهولندي',
    'Gulf International Bank': 'بنك الخليج الدولي',
    'Account Holder': 'صاحب الحساب',
    'Bank Address': 'عنوان البنك',
  };
  
  return translations[text] || text;
};

const ModularBankDetailsForm: React.FC<ModularBankDetailsFormProps> = ({
  initialData = {},
  customerDetailsData,
  onSubmit,
  onCancel,
  onBack,
  isLoading = false,
  isViewMode = false,
  showBackButton = false
}) => {
  const [formData, setFormData] = useState<BankDetailsFormData>({
    bank_name: initialData.bank_name || '',
    bank_name_arabic: initialData.bank_name_arabic || '',
    account_number: initialData.account_number || '',
    iban: initialData.iban || '',
    swift_code: initialData.swift_code || '',
    bank_address: initialData.bank_address || '',
    bank_address_arabic: initialData.bank_address_arabic || '',
    account_holder_name: initialData.account_holder_name || '',
    account_holder_name_arabic: initialData.account_holder_name_arabic || '',
  });

  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Auto-translate English to Arabic when English fields change
  useEffect(() => {
    const englishFields = ['bank_name', 'bank_address', 'account_holder_name'];

    englishFields.forEach(field => {
      const englishValue = formData[field as keyof BankDetailsFormData] as string;
      const arabicField = `${field}_arabic` as keyof BankDetailsFormData;
      
      // Only auto-translate if Arabic field is empty (user hasn't manually entered Arabic)
      if (englishValue && !formData[arabicField]) {
        const translation = translateToArabic(englishValue);
        if (translation !== englishValue) {
          setFormData(prev => ({ ...prev, [arabicField]: translation }));
        }
      }
    });
  }, [formData.bank_name, formData.bank_address, formData.account_holder_name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleInputChange = (field: keyof BankDetailsFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const FieldRow: React.FC<{
    label: string;
    labelArabic: string;
    field: keyof BankDetailsFormData;
    fieldArabic: keyof BankDetailsFormData;
    type?: 'text' | 'select';
    options?: { value: string; label: string }[];
    placeholder?: string;
    placeholderArabic?: string;
    isRequired?: boolean;
  }> = ({ label, labelArabic, field, fieldArabic, type = 'text', options, placeholder, placeholderArabic, isRequired = false }) => (
    <Grid templateColumns="1fr 1fr" gap={4} mb={4}>
      {/* English Field */}
      <FormControl isRequired={isRequired}>
        <FormLabel fontSize="sm" fontWeight="semibold" color="blue.700">
          <HStack spacing={2}>
            <FiGlobe />
            <Text>{label}</Text>
          </HStack>
        </FormLabel>
        {type === 'select' ? (
          <Select
            value={formData[field] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            isDisabled={isViewMode}
            size="sm"
          >
            {options?.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        ) : (
          <Input
            type={type}
            value={formData[field] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            isDisabled={isViewMode}
            size="sm"
          />
        )}
      </FormControl>

      {/* Arabic Field */}
      <FormControl>
        <FormLabel fontSize="sm" fontWeight="semibold" color="green.700">
          <HStack spacing={2}>
            <FiType />
            <Text>{labelArabic}</Text>
          </HStack>
        </FormLabel>
        <Input
          type={type}
          value={formData[fieldArabic] as string}
          onChange={(e) => handleInputChange(fieldArabic, e.target.value)}
          placeholder={placeholderArabic}
          isDisabled={isViewMode}
          size="sm"
          dir="rtl"
        />
      </FormControl>
    </Grid>
  );

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      border="1px"
      borderColor={borderColor}
      p={6}
      maxW="1400px"
      mx="auto"
    >
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" color="gray.700" mb={2}>
            {isViewMode ? 'Bank Details' : 'Bank Information'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {isViewMode 
              ? 'View bank information' 
              : 'Enter bank details - English on left, Arabic on right (auto-translates)'
            }
          </Text>
          {customerDetailsData && (
            <Text fontSize="xs" color="blue.600" mt={2}>
              Customer: {customerDetailsData.customer_company_name}
            </Text>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            
            {/* Bank Information Section */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="blue.600" mb={4}>
                <HStack spacing={2}>
                  <FiCreditCard />
                  <Text>Bank Details</Text>
                </HStack>
              </Text>
              
              <FieldRow
                label="Bank Name"
                labelArabic="اسم البنك"
                field="bank_name"
                fieldArabic="bank_name_arabic"
                type="select"
                options={[
                  { value: 'Al Rajhi Bank', label: 'Al Rajhi Bank' },
                  { value: 'Saudi National Bank', label: 'Saudi National Bank' },
                  { value: 'Riyad Bank', label: 'Riyad Bank' },
                  { value: 'Saudi British Bank', label: 'Saudi British Bank' },
                  { value: 'Banque Saudi Fransi', label: 'Banque Saudi Fransi' },
                  { value: 'Arab National Bank', label: 'Arab National Bank' },
                  { value: 'Saudi Investment Bank', label: 'Saudi Investment Bank' },
                  { value: 'Bank AlJazira', label: 'Bank AlJazira' },
                  { value: 'Saudi Hollandi Bank', label: 'Saudi Hollandi Bank' },
                  { value: 'Gulf International Bank', label: 'Gulf International Bank' },
                  { value: 'Other', label: 'Other' }
                ]}
                placeholder="Select bank"
                placeholderArabic="اختر البنك"
              />

              <FieldRow
                label="Account Number"
                labelArabic="رقم الحساب"
                field="account_number"
                fieldArabic="account_number"
                placeholder="Enter account number"
                placeholderArabic="أدخل رقم الحساب"
              />

              <FieldRow
                label="IBAN"
                labelArabic="رقم الآيبان"
                field="iban"
                fieldArabic="iban"
                placeholder="Enter IBAN (SA + 22 digits)"
                placeholderArabic="أدخل رقم الآيبان"
              />

              <FieldRow
                label="SWIFT Code"
                labelArabic="رمز السويفت"
                field="swift_code"
                fieldArabic="swift_code"
                placeholder="Enter SWIFT code"
                placeholderArabic="أدخل رمز السويفت"
              />

              <FieldRow
                label="Bank Address"
                labelArabic="عنوان البنك"
                field="bank_address"
                fieldArabic="bank_address_arabic"
                placeholder="Enter bank address"
                placeholderArabic="أدخل عنوان البنك"
              />

              <FieldRow
                label="Account Holder Name"
                labelArabic="اسم صاحب الحساب"
                field="account_holder_name"
                fieldArabic="account_holder_name_arabic"
                placeholder="Enter account holder name"
                placeholderArabic="أدخل اسم صاحب الحساب"
              />
            </Box>

            {/* Action Buttons */}
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
                {showBackButton && onBack && (
                  <Button
                    leftIcon={<FiArrowLeft />}
                    variant="outline"
                    onClick={handleBack}
                    isDisabled={isLoading}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    Back: Customer Details
                  </Button>
                )}
                <Button
                  type="submit"
                  colorScheme="blue"
                  leftIcon={<FiSave />}
                  isLoading={isLoading}
                  loadingText="Saving..."
                  size={isMobile ? 'sm' : 'md'}
                >
                  {initialData.bank_name ? 'Update Bank Details' : 'Save Bank Details'}
                </Button>
              </HStack>
            )}
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default ModularBankDetailsForm;
