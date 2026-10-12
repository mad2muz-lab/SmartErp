import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, FormControl, FormLabel, Input, Select,
  Button, Text, useColorModeValue, Grid, GridItem, useBreakpointValue,
  Divider, NumberInput, NumberInputField, NumberInputStepper, 
  NumberIncrementStepper, NumberDecrementStepper, Textarea
} from '@chakra-ui/react';
import { FiSave, FiArrowRight, FiGlobe, FiType } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface CustomerDetailsFormData {
  // Customer Basic Information
  customer_company_name: string;
  customer_company_name_arabic: string;
  customer_type: 'business' | 'individual';
  contact_person: string;
  contact_person_arabic: string;
  email: string;
  phone: string;
  
  // Address Information
  address: string;
  address_arabic: string;
  building_number: string;
  building_number_arabic: string;
  street: string;
  street_arabic: string;
  additional_number: string;
  additional_number_arabic: string;
  district: string;
  district_arabic: string;
  city: string;
  city_arabic: string;
  state_province: string;
  state_province_arabic: string;
  zip_postal_code: string;
  zip_postal_code_arabic: string;
  country: string;
  country_arabic: string;
  
  // Business Information
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
}

interface ModularCustomerDetailsFormProps {
  initialData?: Partial<CustomerDetailsFormData>;
  onSubmit: (data: CustomerDetailsFormData) => void;
  onCancel: () => void;
  onNext?: (data: CustomerDetailsFormData) => void;
  isLoading?: boolean;
  isViewMode?: boolean;
  showNextButton?: boolean;
}

// Simple translation function (you can replace with actual translation API)
const translateToArabic = (text: string): string => {
  if (!text.trim()) return '';
  
  // Simple mapping for common terms (replace with actual translation service)
  const translations: { [key: string]: string } = {
    'Riyadh': 'الرياض',
    'Jeddah': 'جدة',
    'Dammam': 'الدمام',
    'Saudi Arabia': 'المملكة العربية السعودية',
    'Business': 'تجاري',
    'Individual': 'فردي',
    'Net 30': 'صافي 30',
    'Net 15': 'صافي 15',
    'Net 45': 'صافي 45',
    'Net 60': 'صافي 60',
    'Cash on Delivery': 'الدفع عند التسليم',
    'Advance Payment': 'دفع مقدماً',
  };
  
  // Return translation if found, otherwise return original text
  return translations[text] || text;
};

const ModularCustomerDetailsForm: React.FC<ModularCustomerDetailsFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  onNext,
  isLoading = false,
  isViewMode = false,
  showNextButton = false
}) => {
  const [formData, setFormData] = useState<CustomerDetailsFormData>({
    customer_company_name: initialData.customer_company_name || '',
    customer_company_name_arabic: initialData.customer_company_name_arabic || '',
    customer_type: initialData.customer_type || 'business',
    contact_person: initialData.contact_person || '',
    contact_person_arabic: initialData.contact_person_arabic || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    address: initialData.address || '',
    address_arabic: initialData.address_arabic || '',
    building_number: initialData.building_number || '',
    building_number_arabic: initialData.building_number_arabic || '',
    street: initialData.street || '',
    street_arabic: initialData.street_arabic || '',
    additional_number: initialData.additional_number || '',
    additional_number_arabic: initialData.additional_number_arabic || '',
    district: initialData.district || '',
    district_arabic: initialData.district_arabic || '',
    city: initialData.city || '',
    city_arabic: initialData.city_arabic || '',
    state_province: initialData.state_province || '',
    state_province_arabic: initialData.state_province_arabic || '',
    zip_postal_code: initialData.zip_postal_code || '',
    zip_postal_code_arabic: initialData.zip_postal_code_arabic || '',
    country: initialData.country || 'Saudi Arabia',
    country_arabic: initialData.country_arabic || 'المملكة العربية السعودية',
    website: initialData.website || '',
    vat_number: initialData.vat_number || '',
    cr_number: initialData.cr_number || '',
    payment_terms: initialData.payment_terms || 'Net 30',
    custom_payment_terms: initialData.custom_payment_terms || '',
    credit_days: initialData.credit_days || 0,
    credit_limit: initialData.credit_limit || 0,
    reliability_rating: initialData.reliability_rating || 5,
    notes: initialData.notes || '',
    notes_arabic: initialData.notes_arabic || '',
  });

  const isMobile = useBreakpointValue({ base: true, md: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const leftBg = useColorModeValue('blue.50', 'blue.900');
  const rightBg = useColorModeValue('green.50', 'green.900');

  // Auto-translate English to Arabic when English fields change
  useEffect(() => {
    const englishFields = [
      'customer_company_name', 'contact_person', 'address', 'building_number',
      'street', 'additional_number', 'district', 'city', 'state_province',
      'zip_postal_code', 'country', 'notes'
    ];

    englishFields.forEach(field => {
      const englishValue = formData[field as keyof CustomerDetailsFormData] as string;
      const arabicField = `${field}_arabic` as keyof CustomerDetailsFormData;
      
      // Only auto-translate if Arabic field is empty (user hasn't manually entered Arabic)
      if (englishValue && !formData[arabicField]) {
        const translation = translateToArabic(englishValue);
        if (translation !== englishValue) {
          setFormData(prev => ({ ...prev, [arabicField]: translation }));
        }
      }
    });
  }, [formData.customer_company_name, formData.contact_person, formData.address, 
      formData.building_number, formData.street, formData.additional_number, 
      formData.district, formData.city, formData.state_province, 
      formData.zip_postal_code, formData.country, formData.notes]);

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

  const handleNext = () => {
    if (onNext) {
      onNext(formData);
    }
  };

  const handleInputChange = (field: keyof CustomerDetailsFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const FieldRow: React.FC<{
    label: string;
    labelArabic: string;
    field: keyof CustomerDetailsFormData;
    fieldArabic: keyof CustomerDetailsFormData;
    type?: 'text' | 'email' | 'number' | 'select' | 'textarea';
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
        ) : type === 'number' ? (
          <NumberInput
            value={formData[field] as number}
            onChange={(_, value) => handleInputChange(field, value)}
            isDisabled={isViewMode}
            size="sm"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        ) : type === 'textarea' ? (
          <Textarea
            value={formData[field] as string}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            isDisabled={isViewMode}
            size="sm"
            rows={3}
          />
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
        {type === 'textarea' ? (
          <Textarea
            value={formData[fieldArabic] as string}
            onChange={(e) => handleInputChange(fieldArabic, e.target.value)}
            placeholder={placeholderArabic}
            isDisabled={isViewMode}
            size="sm"
            rows={3}
            dir="rtl"
          />
        ) : (
          <Input
            type={type}
            value={formData[fieldArabic] as string}
            onChange={(e) => handleInputChange(fieldArabic, e.target.value)}
            placeholder={placeholderArabic}
            isDisabled={isViewMode}
            size="sm"
            dir="rtl"
          />
        )}
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
            {isViewMode ? 'Customer Details' : 'Customer Information'}
          </Text>
          <Text fontSize="sm" color="gray.500">
            {isViewMode 
              ? 'View customer information' 
              : 'Enter customer details - English on left, Arabic on right (auto-translates)'
            }
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6} align="stretch">
            
            {/* Basic Information Section */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="blue.600" mb={4}>
                📋 Basic Information
              </Text>
              
              <FieldRow
                label="Company/Individual Name"
                labelArabic="اسم الشركة/الفرد"
                field="customer_company_name"
                fieldArabic="customer_company_name_arabic"
                placeholder="Enter company or individual name"
                placeholderArabic="أدخل اسم الشركة أو الفرد"
                isRequired
              />

              <FieldRow
                label="Customer Type"
                labelArabic="نوع العميل"
                field="customer_type"
                fieldArabic="customer_type"
                type="select"
                options={[
                  { value: 'business', label: 'Business' },
                  { value: 'individual', label: 'Individual' }
                ]}
                isRequired
              />

              <FieldRow
                label="Contact Person"
                labelArabic="اسم الشخص المسؤول"
                field="contact_person"
                fieldArabic="contact_person_arabic"
                placeholder="Enter contact person name"
                placeholderArabic="أدخل اسم الشخص المسؤول"
              />

              <FieldRow
                label="Email"
                labelArabic="البريد الإلكتروني"
                field="email"
                fieldArabic="email"
                type="email"
                placeholder="Enter email address"
                placeholderArabic="أدخل عنوان البريد الإلكتروني"
              />

              <FieldRow
                label="Phone"
                labelArabic="رقم الهاتف"
                field="phone"
                fieldArabic="phone"
                placeholder="Enter phone number"
                placeholderArabic="أدخل رقم الهاتف"
              />
            </Box>

            <Divider />

            {/* Address Information Section */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="blue.600" mb={4}>
                🏠 Address Information
              </Text>
              
              <FieldRow
                label="Address"
                labelArabic="العنوان"
                field="address"
                fieldArabic="address_arabic"
                placeholder="Enter complete address"
                placeholderArabic="أدخل العنوان الكامل"
                isRequired
              />

              <FieldRow
                label="Building Number"
                labelArabic="رقم المبنى"
                field="building_number"
                fieldArabic="building_number_arabic"
                placeholder="Enter building number"
                placeholderArabic="أدخل رقم المبنى"
              />

              <FieldRow
                label="Street"
                labelArabic="الشارع"
                field="street"
                fieldArabic="street_arabic"
                placeholder="Enter street name"
                placeholderArabic="أدخل اسم الشارع"
              />

              <FieldRow
                label="Additional Number"
                labelArabic="الرقم الإضافي"
                field="additional_number"
                fieldArabic="additional_number_arabic"
                placeholder="Enter additional number"
                placeholderArabic="أدخل الرقم الإضافي"
              />

              <FieldRow
                label="District"
                labelArabic="الحي"
                field="district"
                fieldArabic="district_arabic"
                placeholder="Enter district"
                placeholderArabic="أدخل الحي"
              />

              <FieldRow
                label="City"
                labelArabic="المدينة"
                field="city"
                fieldArabic="city_arabic"
                placeholder="Enter city"
                placeholderArabic="أدخل المدينة"
                isRequired
              />

              <FieldRow
                label="State/Province"
                labelArabic="المنطقة/المحافظة"
                field="state_province"
                fieldArabic="state_province_arabic"
                placeholder="Enter state or province"
                placeholderArabic="أدخل المنطقة أو المحافظة"
              />

              <FieldRow
                label="ZIP/Postal Code"
                labelArabic="الرمز البريدي"
                field="zip_postal_code"
                fieldArabic="zip_postal_code_arabic"
                placeholder="Enter ZIP or postal code"
                placeholderArabic="أدخل الرمز البريدي"
              />

              <FieldRow
                label="Country"
                labelArabic="البلد"
                field="country"
                fieldArabic="country_arabic"
                placeholder="Enter country"
                placeholderArabic="أدخل البلد"
                isRequired
              />
            </Box>

            <Divider />

            {/* Business Information Section */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" color="blue.600" mb={4}>
                🏢 Business Information
              </Text>
              
              <FieldRow
                label="Website"
                labelArabic="الموقع الإلكتروني"
                field="website"
                fieldArabic="website"
                placeholder="Enter website URL"
                placeholderArabic="أدخل رابط الموقع الإلكتروني"
              />

              <FieldRow
                label="VAT Number"
                labelArabic="رقم ضريبة القيمة المضافة"
                field="vat_number"
                fieldArabic="vat_number"
                placeholder="Enter VAT number (15 digits)"
                placeholderArabic="أدخل رقم ضريبة القيمة المضافة"
                isRequired
              />

              <FieldRow
                label="CR Number"
                labelArabic="رقم السجل التجاري"
                field="cr_number"
                fieldArabic="cr_number"
                placeholder="Enter CR number (10 digits)"
                placeholderArabic="أدخل رقم السجل التجاري"
              />

              <FieldRow
                label="Payment Terms"
                labelArabic="شروط الدفع"
                field="payment_terms"
                fieldArabic="payment_terms"
                type="select"
                options={[
                  { value: 'Net 15', label: 'Net 15' },
                  { value: 'Net 30', label: 'Net 30' },
                  { value: 'Net 45', label: 'Net 45' },
                  { value: 'Net 60', label: 'Net 60' },
                  { value: 'Cash on Delivery', label: 'Cash on Delivery' },
                  { value: 'Advance Payment', label: 'Advance Payment' }
                ]}
              />

              <FieldRow
                label="Custom Payment Terms"
                labelArabic="شروط الدفع المخصصة"
                field="custom_payment_terms"
                fieldArabic="custom_payment_terms"
                placeholder="Enter custom payment terms"
                placeholderArabic="أدخل شروط الدفع المخصصة"
              />

              <FieldRow
                label="Credit Days"
                labelArabic="أيام الائتمان"
                field="credit_days"
                fieldArabic="credit_days"
                type="number"
                placeholder="Enter credit days"
                placeholderArabic="أدخل أيام الائتمان"
              />

              <FieldRow
                label="Credit Limit (\uE900)"
                labelArabic="حد الائتمان (ريال)"
                field="credit_limit"
                fieldArabic="credit_limit"
                type="number"
                placeholder="Enter credit limit"
                placeholderArabic="أدخل حد الائتمان"
              />

              <FieldRow
                label="Reliability Rating"
                labelArabic="تقييم الموثوقية"
                field="reliability_rating"
                fieldArabic="reliability_rating"
                type="select"
                options={[
                  { value: '1', label: '1 - Poor' },
                  { value: '2', label: '2 - Below Average' },
                  { value: '3', label: '3 - Average' },
                  { value: '4', label: '4 - Good' },
                  { value: '5', label: '5 - Excellent' }
                ]}
              />

              <FieldRow
                label="Notes"
                labelArabic="ملاحظات"
                field="notes"
                fieldArabic="notes_arabic"
                type="textarea"
                placeholder="Enter any additional notes"
                placeholderArabic="أدخل أي ملاحظات إضافية"
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
                {showNextButton && onNext && (
                  <Button
                    rightIcon={<FiArrowRight />}
                    colorScheme="green"
                    onClick={handleNext}
                    isDisabled={isLoading}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    Next: Bank Details
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
                  {initialData.customer_company_name ? 'Update Customer' : 'Save Customer Details'}
                </Button>
              </HStack>
            )}
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default ModularCustomerDetailsForm;
