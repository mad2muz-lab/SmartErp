import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Checkbox,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  useColorModeValue,
  IconButton,
  Tooltip,
  InputGroup,
  InputLeftElement,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Icon,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import { PAYMENT_TERMS } from '../data/inventoryData';
import { mobilizationServiceCatalogue } from '../data/mobilizationServices';
import { SmartDropdown } from '../components/SmartDropdown';
import { getAllEntries } from '../data/customEntries';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiHome,
  FiPhone,
  FiMail,
  FiCamera,
  FiEye,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import ArabicField from '../components/ArabicField';
import BusinessCardScanner from '../components/BusinessCardScanner';
import { ExtractedData } from '../utils/ocrService';
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

const recruitmentScreeningOptions = [
  { id: 'identity', label: 'Identity and work eligibility checked' },
  { id: 'qualifications', label: 'Qualifications and work experience checked' },
  { id: 'references', label: 'Employment references checked' },
  { id: 'medical', label: 'Medical fitness process coordinated when required' },
];

const parseListField = (value: string) =>
  value.split(',').map((entry) => entry.trim()).filter(Boolean);

const SuppliersScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { selectedOrganization } = useAuth();
  const chakraToast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Form state
  const [formData, setFormData] = useState({
    supplier_type: 'general' as 'general' | 'recruitment_agency',
    name: '',
    name_arabic: '',
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
    credit_days: 0,
    credit_limit: 0,
    reliability_rating: 0,
    service_ids: [] as string[],
    recruitment_license_number: '',
    recruitment_license_country: '',
    recruitment_license_expiry: '',
    recruitment_countries: [] as string[],
    recruitment_job_categories: [] as string[],
    recruitment_screening_checks: [] as string[],
    recruitment_fee_model: '',
    recruitment_fee_amount: 0,
    recruitment_fee_currency: '',
    recruitment_replacement_days: 0,
    notes: '',
    notes_arabic: '',
  });

  // Get all entries for smart dropdowns
  const allPaymentTerms = getAllEntries('payment_terms', selectedOrganization || '', PAYMENT_TERMS);

  // Validation function
  const validateField = (field: string, value: any): string => {
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

  const isConvex = isConvexOrgId(selectedOrganization);

  // Fetch suppliers
  const rawSuppliers = useQuery(
    api.suppliers.listSuppliers,
    isConvex ? { organization_id: selectedOrganization as any } : 'skip'
  );
  const suppliers = isConvex ? rawSuppliers : [];

  // Mutations
  const createSupplier = useMutation(api.suppliers.createSupplier);
  const updateSupplier = useMutation(api.suppliers.updateSupplier);
  const deleteSupplier = useMutation(api.suppliers.deleteSupplier);

  // Handle loading and error states
  if (suppliers === undefined) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Suppliers Management</Heading>
            <Text color="gray.600">Loading suppliers...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  const handleSubmit = async () => {
    if (isViewMode) {
      onClose();
      return;
    }

    if (!selectedOrganization) {
      toast.error('Please select an organization');
      return;
    }

    if (!isConvex) {
      toast.success(isEditMode ? 'Supplier updated (offline mode)' : 'Supplier created (offline mode)');
      onClose();
      resetForm();
      return;
    }

    // Validate all fields
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Supplier name is required';
    }
    
    // Validate all fields with validation rules
    const fieldsToValidate = [
      'vat_number', 'cr_number', 'credit_days', 'building_number', 
      'additional_number', 'zip_postal_code', 'phone', 'website', 'email'
    ];
    
    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        errors[field] = error;
      }
    });

    if (formData.supplier_type === 'recruitment_agency') {
      if (!formData.recruitment_fee_model) {
        errors.recruitment_fee_model = 'Select a placement fee basis';
      } else if (formData.recruitment_fee_model !== 'no_fee') {
        if (formData.recruitment_fee_amount <= 0) {
          errors.recruitment_fee_amount = 'Enter a fee greater than zero';
        }
        if (!formData.recruitment_fee_currency) {
          errors.recruitment_fee_currency = 'Select the fee currency';
        }
      }
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix validation errors before submitting');
      return;
    }

    try {
      if (isEditMode && selectedSupplier) {
        await updateSupplier({
          id: selectedSupplier._id,
          supplier_type: formData.supplier_type,
          name: formData.name,
          name_arabic: formData.name_arabic || undefined,
          contact_person: formData.contact_person || undefined,
          contact_person_arabic: formData.contact_person_arabic || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          address_arabic: formData.address_arabic || undefined,
          // Detailed address fields
          building_number: formData.building_number || undefined,
          street: formData.street || undefined,
          additional_number: formData.additional_number || undefined,
          district: formData.district || undefined,
          city: formData.city || undefined,
          state_province: formData.state_province || undefined,
          zip_postal_code: formData.zip_postal_code || undefined,
          country: formData.country || undefined,
          website: formData.website || undefined,
          vat_number: formData.vat_number || undefined,
          cr_number: formData.cr_number || undefined,
          payment_terms: formData.payment_terms || undefined,
          credit_days: formData.credit_days > 0 ? formData.credit_days : undefined,
          credit_limit: formData.credit_limit > 0 ? formData.credit_limit : undefined,
          reliability_rating: formData.reliability_rating > 0 ? formData.reliability_rating : undefined,
          service_ids: formData.service_ids,
          recruitment_license_number: formData.recruitment_license_number,
          recruitment_license_country: formData.recruitment_license_country,
          recruitment_license_expiry: formData.recruitment_license_expiry,
          recruitment_countries: formData.recruitment_countries,
          recruitment_job_categories: formData.recruitment_job_categories,
          recruitment_screening_checks: formData.recruitment_screening_checks,
          recruitment_fee_model: formData.recruitment_fee_model,
          recruitment_fee_amount: formData.recruitment_fee_amount > 0 ? formData.recruitment_fee_amount : undefined,
          recruitment_fee_currency: formData.recruitment_fee_currency || undefined,
          recruitment_replacement_days: formData.recruitment_replacement_days,
          notes: formData.notes || undefined,
          notes_arabic: formData.notes_arabic || undefined,
        });
        toast.success('Supplier updated successfully');
      } else {
        await createSupplier({
          supplier_type: formData.supplier_type,
          name: formData.name,
          name_arabic: formData.name_arabic || undefined,
          contact_person: formData.contact_person || undefined,
          contact_person_arabic: formData.contact_person_arabic || undefined,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          address_arabic: formData.address_arabic || undefined,
          // Detailed address fields
          building_number: formData.building_number || undefined,
          street: formData.street || undefined,
          additional_number: formData.additional_number || undefined,
          district: formData.district || undefined,
          city: formData.city || undefined,
          state_province: formData.state_province || undefined,
          zip_postal_code: formData.zip_postal_code || undefined,
          country: formData.country || undefined,
          website: formData.website || undefined,
          vat_number: formData.vat_number || undefined,
          cr_number: formData.cr_number || undefined,
          payment_terms: formData.payment_terms || undefined,
          credit_days: formData.credit_days > 0 ? formData.credit_days : undefined,
          credit_limit: formData.credit_limit > 0 ? formData.credit_limit : undefined,
          reliability_rating: formData.reliability_rating > 0 ? formData.reliability_rating : undefined,
          service_ids: formData.service_ids,
          recruitment_license_number: formData.recruitment_license_number,
          recruitment_license_country: formData.recruitment_license_country,
          recruitment_license_expiry: formData.recruitment_license_expiry,
          recruitment_countries: formData.recruitment_countries,
          recruitment_job_categories: formData.recruitment_job_categories,
          recruitment_screening_checks: formData.recruitment_screening_checks,
          recruitment_fee_model: formData.recruitment_fee_model,
          recruitment_fee_amount: formData.recruitment_fee_amount > 0 ? formData.recruitment_fee_amount : undefined,
          recruitment_fee_currency: formData.recruitment_fee_currency || undefined,
          recruitment_replacement_days: formData.recruitment_replacement_days,
          notes: formData.notes || undefined,
          notes_arabic: formData.notes_arabic || undefined,
          organization_id: selectedOrganization as any,
        });
        toast.success('Supplier created successfully');
      }
      
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Error saving supplier');
    }
  };

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplier_type: supplier.supplier_type || 'general',
      name: supplier.name,
      name_arabic: supplier.name_arabic || '',
      contact_person: supplier.contact_person || '',
      contact_person_arabic: supplier.contact_person_arabic || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      address_arabic: supplier.address_arabic || '',
      // Detailed address fields
      building_number: supplier.building_number || '',
      street: supplier.street || '',
      additional_number: supplier.additional_number || '',
      district: supplier.district || '',
      city: supplier.city || '',
      state_province: supplier.state_province || '',
      zip_postal_code: supplier.zip_postal_code || '',
      country: supplier.country || '',
      website: supplier.website || '',
      vat_number: supplier.vat_number || '',
      cr_number: supplier.cr_number || '',
      payment_terms: supplier.payment_terms || '',
      credit_days: supplier.credit_days || 0,
      credit_limit: supplier.credit_limit || 0,
      reliability_rating: supplier.reliability_rating || 0,
      service_ids: supplier.service_ids || [],
      recruitment_license_number: supplier.recruitment_license_number || '',
      recruitment_license_country: supplier.recruitment_license_country || '',
      recruitment_license_expiry: supplier.recruitment_license_expiry || '',
      recruitment_countries: supplier.recruitment_countries || [],
      recruitment_job_categories: supplier.recruitment_job_categories || [],
      recruitment_screening_checks: supplier.recruitment_screening_checks || [],
      recruitment_fee_model: supplier.recruitment_fee_model || '',
      recruitment_fee_amount: supplier.recruitment_fee_amount || 0,
      recruitment_fee_currency: supplier.recruitment_fee_currency || '',
      recruitment_replacement_days: supplier.recruitment_replacement_days || 0,
      notes: supplier.notes || '',
      notes_arabic: supplier.notes_arabic || '',
    });
    setIsEditMode(true);
    setIsViewMode(false);
    onOpen();
  };

  const handleView = (supplier: any) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplier_type: supplier.supplier_type || 'general',
      name: supplier.name,
      name_arabic: supplier.name_arabic || '',
      contact_person: supplier.contact_person || '',
      contact_person_arabic: supplier.contact_person_arabic || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      address_arabic: supplier.address_arabic || '',
      // Detailed address fields
      building_number: supplier.building_number || '',
      street: supplier.street || '',
      additional_number: supplier.additional_number || '',
      district: supplier.district || '',
      city: supplier.city || '',
      state_province: supplier.state_province || '',
      zip_postal_code: supplier.zip_postal_code || '',
      country: supplier.country || '',
      website: supplier.website || '',
      vat_number: supplier.vat_number || '',
      cr_number: supplier.cr_number || '',
      payment_terms: supplier.payment_terms || '',
      credit_days: supplier.credit_days || 0,
      credit_limit: supplier.credit_limit || 0,
      reliability_rating: supplier.reliability_rating || 0,
      service_ids: supplier.service_ids || [],
      recruitment_license_number: supplier.recruitment_license_number || '',
      recruitment_license_country: supplier.recruitment_license_country || '',
      recruitment_license_expiry: supplier.recruitment_license_expiry || '',
      recruitment_countries: supplier.recruitment_countries || [],
      recruitment_job_categories: supplier.recruitment_job_categories || [],
      recruitment_screening_checks: supplier.recruitment_screening_checks || [],
      recruitment_fee_model: supplier.recruitment_fee_model || '',
      recruitment_fee_amount: supplier.recruitment_fee_amount || 0,
      recruitment_fee_currency: supplier.recruitment_fee_currency || '',
      recruitment_replacement_days: supplier.recruitment_replacement_days || 0,
      notes: supplier.notes || '',
      notes_arabic: supplier.notes_arabic || '',
    });
    setIsEditMode(false);
    setIsViewMode(true);
    onOpen();
  };

  const handleDelete = async (supplierId: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier({ id: supplierId as any });
        toast.success('Supplier deleted successfully');
      } catch (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Error deleting supplier');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      supplier_type: 'general',
      name: '',
      name_arabic: '',
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
      credit_days: 0,
      credit_limit: 0,
      reliability_rating: 0,
      service_ids: [],
      recruitment_license_number: '',
      recruitment_license_country: '',
      recruitment_license_expiry: '',
      recruitment_countries: [],
      recruitment_job_categories: [],
      recruitment_screening_checks: [],
      recruitment_fee_model: '',
      recruitment_fee_amount: 0,
      recruitment_fee_currency: '',
      recruitment_replacement_days: 0,
      notes: '',
      notes_arabic: '',
    });
    setSelectedSupplier(null);
    setIsEditMode(false);
    setIsViewMode(false);
  };

  const handleDataExtracted = (data: ExtractedData) => {
    setFormData(prev => ({
      ...prev,
      name: data.companyName || prev.name,
      contact_person: data.contactPerson || prev.contact_person,
      email: data.email || prev.email,
      phone: data.phone || prev.phone,
      website: data.website || prev.website,
      address: data.address || prev.address,
      vat_number: data.vatNumber || prev.vat_number,
      cr_number: data.crNumber || prev.cr_number,
    }));
    toast.success('Business card data extracted successfully!');
  };

  const openNewSupplierModal = (supplierType: 'general' | 'recruitment_agency') => {
    resetForm();
    setFormData((current) => ({ ...current, supplier_type: supplierType }));
    setIsEditMode(false);
    setIsViewMode(false);
    onOpen();
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers?.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getReliabilityColor = (rating: number) => {
    if (rating >= 8) return 'green';
    if (rating >= 6) return 'yellow';
    if (rating >= 4) return 'orange';
    return 'red';
  };

  const getReliabilityText = (rating: number) => {
    if (rating >= 8) return 'Excellent';
    if (rating >= 6) return 'Good';
    if (rating >= 4) return 'Fair';
    return 'Poor';
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Suppliers Management</Heading>
          <Text color="gray.600">Manage your supplier relationships and information</Text>
        </Box>

        {/* Search and Actions */}
        <HStack justify="space-between" align="center" flexWrap="wrap" spacing={3}>
          <InputGroup maxW="400px">
            <InputLeftElement>
              <Icon as={FiSearch} color="gray.400" boxSize={4} />
            </InputLeftElement>
            <Input
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <HStack spacing={3} flexWrap="wrap">
            <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={() => openNewSupplierModal('general')}>
              Add General Supplier
            </Button>
            <Button leftIcon={<FiPlus />} colorScheme="purple" onClick={() => openNewSupplierModal('recruitment_agency')}>
              Register Recruitment Agency
            </Button>
          </HStack>
        </HStack>

                {/* Suppliers Table */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            {filteredSuppliers.length === 0 ? (
              <VStack spacing={4} align="center" py={8}>
                <Text color="gray.500">No suppliers found</Text>
                <Text fontSize="sm" color="gray.400">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first supplier to get started'}
                </Text>
              </VStack>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Supplier Type</Th>
                      <Th>Contact Person</Th>
                      <Th>Email</Th>
                      <Th>Phone</Th>
                      <Th>Reliability</Th>
                      <Th>Credit Limit</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredSuppliers.map((supplier) => (
                      <Tr key={supplier._id}>
                        <Td fontWeight="medium">{supplier.name}</Td>
                        <Td>
                          <Badge colorScheme={supplier.supplier_type === 'recruitment_agency' ? 'purple' : 'blue'}>
                            {supplier.supplier_type === 'recruitment_agency' ? 'Recruitment agency' : 'General supplier'}
                          </Badge>
                        </Td>
                        <Td>{supplier.contact_person || '-'}</Td>
                        <Td>{supplier.email || '-'}</Td>
                        <Td>{supplier.phone || '-'}</Td>
                        <Td>
                          {supplier.reliability_rating ? (
                            <Badge colorScheme={getReliabilityColor(supplier.reliability_rating)} size="sm">
                              {supplier.reliability_rating}/10 - {getReliabilityText(supplier.reliability_rating)}
                            </Badge>
                          ) : (
                            <Text color="gray.400">Not rated</Text>
                          )}
                        </Td>
                        <Td>
                          {supplier.credit_limit ? (
                            <HStack spacing={1}>
                              <Icon as={FiHome} boxSize={4} color="gray.400" />
                              <Text>{supplier.credit_limit.toLocaleString()}</Text>
                            </HStack>
                          ) : (
                            <Text color="gray.400">No limit</Text>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Tooltip label="View Details">
                              <IconButton
                                aria-label="View supplier"
                                icon={<FiEye />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(supplier)}
                              />
                            </Tooltip>
                            <Tooltip label="Edit Supplier">
                              <IconButton
                                aria-label="Edit supplier"
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(supplier)}
                              />
                            </Tooltip>
                            <Tooltip label="Delete Supplier">
                              <IconButton
                                aria-label="Delete supplier"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(supplier._id)}
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Add/Edit/View Supplier Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isViewMode
                ? `${formData.supplier_type === 'recruitment_agency' ? 'Recruitment Agency' : 'General Supplier'} Details`
                : isEditMode
                  ? `Edit ${formData.supplier_type === 'recruitment_agency' ? 'Recruitment Agency' : 'General Supplier'}`
                  : formData.supplier_type === 'recruitment_agency'
                    ? 'Register Recruitment Agency'
                    : 'Add General Supplier'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <Box w="full" p={3} borderWidth="1px" borderRadius="md">
                  <Badge colorScheme={formData.supplier_type === 'recruitment_agency' ? 'purple' : 'blue'} mb={1}>
                    {formData.supplier_type === 'recruitment_agency' ? 'Recruitment agency' : 'General supplier'}
                  </Badge>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    {formData.supplier_type === 'recruitment_agency'
                      ? 'This registration captures recruitment authorization, sourcing coverage, candidate checks, and placement terms.'
                      : 'This registration captures general supplier, invoicing, payment, and mobilization service details.'}
                  </Text>
                </Box>

                <HStack justify="space-between" align="center" w="full">
                  <FormControl isRequired flex={1}>
                    <FormLabel>{formData.supplier_type === 'recruitment_agency' ? 'Agency Name' : 'Supplier Name'}</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={formData.supplier_type === 'recruitment_agency' ? 'Enter recruitment agency name' : 'Enter supplier name'}
                      isReadOnly={isViewMode}
                      bg={isViewMode ? 'gray.50' : 'white'}
                    />
                  </FormControl>
                  {!isViewMode && (
                    <Button
                      leftIcon={<FiCamera />}
                      colorScheme="blue"
                      variant="outline"
                      size="md"
                      onClick={() => setShowScanner(true)}
                      mt={6}
                    >
                      Scan Card
                    </Button>
                  )}
                </HStack>

                <ArabicField
                  label={formData.supplier_type === 'recruitment_agency' ? 'Agency Name' : 'Supplier Name'}
                  englishValue={formData.name}
                  arabicValue={formData.name_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, name_arabic: value })}
                  placeholder={formData.supplier_type === 'recruitment_agency' ? 'Enter recruitment agency name' : 'Enter supplier name'}
                  autoTranslate={true}
                  isReadOnly={isViewMode}
                />

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>{formData.supplier_type === 'recruitment_agency' ? 'Agency Representative' : 'Contact Person'}</FormLabel>
                    <Input
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Contact person name"
                      isReadOnly={isViewMode}
                      bg={isViewMode ? 'gray.50' : 'white'}
                    />
                  </FormControl>

                  <FormControl isInvalid={!!validationErrors.email}>
                    <FormLabel>{formData.supplier_type === 'recruitment_agency' ? 'Agency Email' : 'Email'}</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        const error = validateField('email', e.target.value);
                        setValidationErrors(prev => ({ ...prev, email: error }));
                      }}
                      placeholder={formData.supplier_type === 'recruitment_agency' ? 'agency@example.com' : 'supplier@example.com'}
                      isReadOnly={isViewMode}
                      bg={isViewMode ? 'gray.50' : 'white'}
                    />
                    {validationErrors.email && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.email}
                      </Text>
                    )}
                  </FormControl>
                </HStack>

                <ArabicField
                  label={formData.supplier_type === 'recruitment_agency' ? 'Agency Representative' : 'Contact Person'}
                  englishValue={formData.contact_person}
                  arabicValue={formData.contact_person_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, contact_person_arabic: value })}
                  placeholder="Contact person name"
                  autoTranslate={true}
                  isReadOnly={isViewMode}
                />

                <HStack spacing={4} w="full">
                  <FormControl isInvalid={!!validationErrors.phone}>
                    <FormLabel>{formData.supplier_type === 'recruitment_agency' ? 'Agency Phone' : 'Phone'}</FormLabel>
                    <Input
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        const error = validateField('phone', e.target.value);
                        setValidationErrors(prev => ({ ...prev, phone: error }));
                      }}
                      placeholder="Phone number (+1234567890)"
                      isReadOnly={isViewMode}
                      bg={isViewMode ? 'gray.50' : 'white'}
                    />
                    {validationErrors.phone && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.phone}
                      </Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!validationErrors.website}>
                    <FormLabel>Website</FormLabel>
                    <Input
                      value={formData.website}
                      onChange={(e) => {
                        setFormData({ ...formData, website: e.target.value });
                        const error = validateField('website', e.target.value);
                        setValidationErrors(prev => ({ ...prev, website: error }));
                      }}
                      placeholder="https://example.com"
                      isReadOnly={isViewMode}
                      bg={isViewMode ? 'gray.50' : 'white'}
                    />
                    {validationErrors.website && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.website}
                      </Text>
                    )}
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <Textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Full address"
                    rows={2}
                    isReadOnly={isViewMode}
                    bg={isViewMode ? 'gray.50' : 'white'}
                  />
                </FormControl>

                <ArabicField
                  label="Address"
                  englishValue={formData.address}
                  arabicValue={formData.address_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, address_arabic: value })}
                  placeholder="Full address"
                  isTextarea={true}
                  autoTranslate={true}
                  isReadOnly={isViewMode}
                />

                {formData.supplier_type === 'general' && (
                <>
                {/* Detailed Address Fields */}
                <Box>
                  <Text fontWeight="bold" fontSize="lg" mb={4}>Detailed Address (For Invoicing)</Text>
                  
                  <VStack spacing={4} align="stretch">
                    <HStack spacing={4} w="full">
                      <FormControl isInvalid={!!validationErrors.building_number}>
                        <FormLabel>Building Number</FormLabel>
                        <Input
                          value={formData.building_number}
                          onChange={(e) => {
                            setFormData({ ...formData, building_number: e.target.value });
                            const error = validateField('building_number', e.target.value);
                            setValidationErrors(prev => ({ ...prev, building_number: error }));
                          }}
                          placeholder="Building Number (max 4 digits)"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                        {validationErrors.building_number && (
                          <Text color="red.500" fontSize="sm" mt={1}>
                            {validationErrors.building_number}
                          </Text>
                        )}
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Street</FormLabel>
                        <Input
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          placeholder="Street Name"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                      </FormControl>
                    </HStack>

                    <HStack spacing={4} w="full">
                      <FormControl isInvalid={!!validationErrors.additional_number}>
                        <FormLabel>Additional Number</FormLabel>
                        <Input
                          value={formData.additional_number}
                          onChange={(e) => {
                            setFormData({ ...formData, additional_number: e.target.value });
                            const error = validateField('additional_number', e.target.value);
                            setValidationErrors(prev => ({ ...prev, additional_number: error }));
                          }}
                          placeholder="Additional Number (4 digits)"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                        {validationErrors.additional_number && (
                          <Text color="red.500" fontSize="sm" mt={1}>
                            {validationErrors.additional_number}
                          </Text>
                        )}
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>District</FormLabel>
                        <Input
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          placeholder="District"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                      </FormControl>
                    </HStack>

                    <HStack spacing={4} w="full">
                      <FormControl>
                        <FormLabel>City</FormLabel>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="City"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>State/Province</FormLabel>
                        <Input
                          value={formData.state_province}
                          onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                          placeholder="State/Province"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                      </FormControl>
                    </HStack>

                    <HStack spacing={4} w="full">
                      <FormControl isInvalid={!!validationErrors.zip_postal_code}>
                        <FormLabel>Zip/Postal Code</FormLabel>
                        <Input
                          value={formData.zip_postal_code}
                          onChange={(e) => {
                            setFormData({ ...formData, zip_postal_code: e.target.value });
                            const error = validateField('zip_postal_code', e.target.value);
                            setValidationErrors(prev => ({ ...prev, zip_postal_code: error }));
                          }}
                          placeholder="Zip/Postal Code (5 digits)"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                        {validationErrors.zip_postal_code && (
                          <Text color="red.500" fontSize="sm" mt={1}>
                            {validationErrors.zip_postal_code}
                          </Text>
                        )}
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Country</FormLabel>
                        <Input
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="Country"
                          isReadOnly={isViewMode}
                          bg={isViewMode ? 'gray.50' : 'white'}
                        />
                      </FormControl>
                    </HStack>
                  </VStack>
                </Box>

                <FormControl>
                  <FormLabel>Mobilization services offered</FormLabel>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    Select the services this supplier can provide. HR will only see this supplier for matching service assignments.
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {mobilizationServiceCatalogue.map((service) => (
                      <Checkbox
                        key={service.id}
                        isChecked={formData.service_ids.includes(service.id)}
                        isDisabled={isViewMode}
                        onChange={(event) => setFormData((current) => ({
                          ...current,
                          service_ids: event.target.checked
                            ? [...current.service_ids, service.id]
                            : current.service_ids.filter((id) => id !== service.id),
                        }))}
                      >
                        {service.name}
                      </Checkbox>
                    ))}
                  </VStack>
                </FormControl>
                </>
                )}

                {formData.supplier_type === 'recruitment_agency' && (
                  <Box w="full" p={4} borderWidth="1px" borderRadius="md">
                    <Heading size="sm" mb={1}>Recruitment agency orientation</Heading>
                    <Text fontSize="sm" color="gray.600" mb={4}>
                      Record the agency's authorization, candidate sourcing coverage, screening checks, and placement terms.
                    </Text>
                    <VStack spacing={4} align="stretch">
                      <Text fontWeight="semibold">Agency authorization</Text>
                      <HStack spacing={4} w="full">
                        <FormControl>
                          <FormLabel>Recruitment license / registration number</FormLabel>
                          <Input
                            value={formData.recruitment_license_number}
                            onChange={(event) => setFormData({ ...formData, recruitment_license_number: event.target.value })}
                            isReadOnly={isViewMode}
                          />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Issuing country</FormLabel>
                          <Input
                            value={formData.recruitment_license_country}
                            onChange={(event) => setFormData({ ...formData, recruitment_license_country: event.target.value })}
                            isReadOnly={isViewMode}
                          />
                        </FormControl>
                      </HStack>
                      <FormControl>
                        <FormLabel>License expiry date</FormLabel>
                        <Input
                          type="date"
                          value={formData.recruitment_license_expiry}
                          onChange={(event) => setFormData({ ...formData, recruitment_license_expiry: event.target.value })}
                          isReadOnly={isViewMode}
                        />
                      </FormControl>

                      <Text fontWeight="semibold">Candidate sourcing coverage</Text>
                      <FormControl>
                        <FormLabel>Candidate source countries</FormLabel>
                        <Input
                          value={formData.recruitment_countries.join(', ')}
                          onChange={(event) => setFormData({
                            ...formData,
                            recruitment_countries: parseListField(event.target.value),
                          })}
                          placeholder="e.g., India, Bangladesh"
                          isReadOnly={isViewMode}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>Separate entries with commas.</Text>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Job categories recruited</FormLabel>
                        <Input
                          value={formData.recruitment_job_categories.join(', ')}
                          onChange={(event) => setFormData({
                            ...formData,
                            recruitment_job_categories: parseListField(event.target.value),
                          })}
                          placeholder="e.g., Healthcare, Construction, Hospitality"
                          isReadOnly={isViewMode}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>Separate entries with commas.</Text>
                      </FormControl>

                      <Text fontWeight="semibold">Candidate checks and placement terms</Text>
                      <FormControl>
                        <FormLabel>Checks the agency confirms it performs</FormLabel>
                        <VStack align="stretch" spacing={2}>
                          {recruitmentScreeningOptions.map((check) => (
                            <Checkbox
                              key={check.id}
                              isChecked={formData.recruitment_screening_checks.includes(check.id)}
                              isDisabled={isViewMode}
                              onChange={(event) => setFormData((current) => ({
                                ...current,
                                recruitment_screening_checks: event.target.checked
                                  ? [...current.recruitment_screening_checks, check.id]
                                  : current.recruitment_screening_checks.filter((id) => id !== check.id),
                              }))}
                            >
                              {check.label}
                            </Checkbox>
                          ))}
                        </VStack>
                      </FormControl>
                      <HStack spacing={4} w="full">
                        <FormControl>
                          <FormLabel>Placement fee basis</FormLabel>
                          <Select
                            placeholder="Select fee basis"
                            value={formData.recruitment_fee_model}
                            onChange={(event) => setFormData({
                              ...formData,
                              recruitment_fee_model: event.target.value,
                              ...(event.target.value === 'no_fee'
                                ? { recruitment_fee_amount: 0, recruitment_fee_currency: '' }
                                : {}),
                            })}
                            isDisabled={isViewMode}
                          >
                            <option value="per_placement">Fixed fee per successful placement</option>
                            <option value="salary_percentage">Percentage of candidate salary</option>
                            <option value="contract_fee">Fixed fee per recruitment contract</option>
                            <option value="no_fee">No placement fee</option>
                          </Select>
                          {validationErrors.recruitment_fee_model && (
                            <Text color="red.500" fontSize="sm" mt={1}>{validationErrors.recruitment_fee_model}</Text>
                          )}
                        </FormControl>
                        <FormControl>
                          <FormLabel>Replacement guarantee (days)</FormLabel>
                          <NumberInput
                            min={0}
                            value={formData.recruitment_replacement_days}
                            onChange={(_, value) => setFormData({ ...formData, recruitment_replacement_days: value || 0 })}
                            isDisabled={isViewMode}
                          >
                            <NumberInputField placeholder="0 = none" />
                          </NumberInput>
                        </FormControl>
                      </HStack>
                      {formData.recruitment_fee_model && formData.recruitment_fee_model !== 'no_fee' && (
                        <HStack spacing={4} w="full" align="start">
                          <FormControl isRequired isInvalid={!!validationErrors.recruitment_fee_amount}>
                            <FormLabel>
                              {formData.recruitment_fee_model === 'salary_percentage'
                                ? 'Placement fee (% of candidate salary)'
                                : formData.recruitment_fee_model === 'contract_fee'
                                  ? 'Agreed fee per recruitment contract'
                                  : 'Agreed fee per candidate recruited'}
                            </FormLabel>
                            <NumberInput
                              min={0}
                              precision={2}
                              value={formData.recruitment_fee_amount || ''}
                              onChange={(_, value) => {
                                setFormData({ ...formData, recruitment_fee_amount: value || 0 });
                                setValidationErrors((current) => ({ ...current, recruitment_fee_amount: '' }));
                              }}
                              isDisabled={isViewMode}
                            >
                              <NumberInputField
                                placeholder={formData.recruitment_fee_model === 'salary_percentage' ? 'e.g., 8' : 'e.g., 2500'}
                              />
                            </NumberInput>
                            {validationErrors.recruitment_fee_amount && (
                              <Text color="red.500" fontSize="sm" mt={1}>{validationErrors.recruitment_fee_amount}</Text>
                            )}
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {formData.recruitment_fee_model === 'salary_percentage'
                                ? 'Enter the agreed percentage; select the currency used when calculating the fee.'
                                : formData.recruitment_fee_model === 'contract_fee'
                                  ? 'Agreed fee charged for each recruitment contract.'
                                  : 'Agreed rate charged for each successfully recruited candidate.'}
                            </Text>
                          </FormControl>
                          <FormControl isRequired isInvalid={!!validationErrors.recruitment_fee_currency}>
                            <FormLabel>Fee currency</FormLabel>
                            <Select
                              placeholder="Select currency"
                              value={formData.recruitment_fee_currency}
                              onChange={(event) => {
                                setFormData({ ...formData, recruitment_fee_currency: event.target.value });
                                setValidationErrors((current) => ({ ...current, recruitment_fee_currency: '' }));
                              }}
                              isDisabled={isViewMode}
                            >
                              {[
                                ['SAR', 'Saudi Riyal (SAR)'],
                                ['INR', 'Indian Rupee (INR)'],
                                ['BDT', 'Bangladeshi Taka (BDT)'],
                                ['USD', 'US Dollar (USD)'],
                                ['AED', 'UAE Dirham (AED)'],
                                ['PKR', 'Pakistani Rupee (PKR)'],
                                ['NPR', 'Nepalese Rupee (NPR)'],
                                ['LKR', 'Sri Lankan Rupee (LKR)'],
                                ['PHP', 'Philippine Peso (PHP)'],
                                ['EUR', 'Euro (EUR)'],
                                ['GBP', 'British Pound (GBP)'],
                              ].map(([code, label]) => (
                                <option key={code} value={code}>{label}</option>
                              ))}
                            </Select>
                            {validationErrors.recruitment_fee_currency && (
                              <Text color="red.500" fontSize="sm" mt={1}>{validationErrors.recruitment_fee_currency}</Text>
                            )}
                          </FormControl>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                )}

                <Text fontWeight="semibold" alignSelf="flex-start">
                  {formData.supplier_type === 'recruitment_agency' ? 'Agency tax and payment details' : 'Supplier tax and payment details'}
                </Text>
                <HStack spacing={4} w="full">
                  <FormControl isInvalid={!!validationErrors.vat_number}>
                    <FormLabel>VAT Number</FormLabel>
                    <Input
                      value={formData.vat_number}
                      onChange={(e) => {
                        setFormData({ ...formData, vat_number: e.target.value });
                        const error = validateField('vat_number', e.target.value);
                        setValidationErrors(prev => ({ ...prev, vat_number: error }));
                      }}
                      placeholder="VAT registration number (15 digits)"
                      isReadOnly={isViewMode}
                      bg={isViewMode ? 'gray.50' : 'white'}
                    />
                    {validationErrors.vat_number && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.vat_number}
                      </Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!validationErrors.cr_number}>
                    <FormLabel>CR Number</FormLabel>
                    <Input
                      value={formData.cr_number}
                      onChange={(e) => {
                        setFormData({ ...formData, cr_number: e.target.value });
                        const error = validateField('cr_number', e.target.value);
                        setValidationErrors(prev => ({ ...prev, cr_number: error }));
                      }}
                      placeholder="Commercial registration number (10 digits)"
                      isReadOnly={isViewMode}
                      bg={isViewMode ? 'gray.50' : 'white'}
                    />
                    {validationErrors.cr_number && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {validationErrors.cr_number}
                      </Text>
                    )}
                  </FormControl>
                </HStack>

                {/* Credit Days */}
                <FormControl isInvalid={!!validationErrors.credit_days}>
                  <FormLabel>Credit Days</FormLabel>
                  <NumberInput
                    value={formData.credit_days}
                    onChange={(valueString, valueNumber) => setFormData({ ...formData, credit_days: valueNumber })}
                    min={0}
                    max={365}
                    isReadOnly={isViewMode}
                    bg={isViewMode ? 'gray.50' : 'white'}
                  >
                    <NumberInputField placeholder="Enter credit days" />
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

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Payment Terms</FormLabel>
                    <SmartDropdown
                      value={formData.payment_terms}
                      onChange={(value) => setFormData({ ...formData, payment_terms: value })}
                      placeholder="Select payment terms"
                      options={allPaymentTerms}
                      type="payment_terms"
                      organization_id={selectedOrganization || ''}
                      defaultValue="Net 30"
                      isDisabled={isViewMode}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Credit Limit</FormLabel>
                    <NumberInput
                      value={formData.credit_limit}
                      onChange={(value) => setFormData({ ...formData, credit_limit: Number(value) })}
                      min={0}
                      isDisabled={isViewMode}
                    >
                      <NumberInputField placeholder="0" bg={isViewMode ? 'gray.50' : 'white'} />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Reliability Rating (1-10)</FormLabel>
                  <NumberInput
                    value={formData.reliability_rating}
                    onChange={(value) => setFormData({ ...formData, reliability_rating: Number(value) })}
                    min={1}
                    max={10}
                    isDisabled={isViewMode}
                  >
                    <NumberInputField placeholder="5" bg={isViewMode ? 'gray.50' : 'white'} />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this supplier"
                    rows={3}
                    isReadOnly={isViewMode}
                    bg={isViewMode ? 'gray.50' : 'white'}
                  />
                </FormControl>

                <ArabicField
                  label="Notes"
                  englishValue={formData.notes}
                  arabicValue={formData.notes_arabic}
                  onArabicChange={(value) => setFormData({ ...formData, notes_arabic: value })}
                  placeholder="Additional notes about this supplier"
                  isTextarea={true}
                  autoTranslate={true}
                  isReadOnly={isViewMode}
                />
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                {isViewMode ? 'Close' : 'Cancel'}
              </Button>
              {!isViewMode && (
                <Button colorScheme="blue" onClick={handleSubmit}>
                  {isEditMode ? 'Update Supplier' : 'Create Supplier'}
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Business Card Scanner Modal */}
        <BusinessCardScanner
          isOpen={showScanner}
          onClose={() => setShowScanner(false)}
          onDataExtracted={handleDataExtracted}
          title="Scan Supplier Business Card"
        />
      </VStack>
    </Box>
  );
};

export default SuppliersScreen;
