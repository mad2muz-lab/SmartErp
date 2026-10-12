import React, { useState, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Image,
  Button,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import { ORGANIZATION_INDUSTRIES, FIELD_LABELS } from '../../../data/organizationData';

interface OrganizationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  initialData?: any;
  isLoading?: boolean;
}

const OrganizationFormModal: React.FC<OrganizationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}) => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orgForm, setOrgForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    currency: initialData?.currency || 'SAR',
    vat_rate: initialData?.vat_rate || '15',
    timezone: initialData?.timezone || 'UTC',
    language: initialData?.language || 'en',
    name_arabic: initialData?.name_arabic || '',
    industry: initialData?.industry || [],
    address_arabic: initialData?.address_arabic || '',
    // Detailed address fields for invoicing and business documents
    building_number: initialData?.building_number || '',
    street: initialData?.street || '',
    additional_number: initialData?.additional_number || '',
    district: initialData?.district || '',
    city: initialData?.city || '',
    state_province: initialData?.state_province || '',
    zip_postal_code: initialData?.zip_postal_code || '',
    country: initialData?.country || '',
    vat_number: initialData?.vat_number || '',
    vat_number_arabic: initialData?.vat_number_arabic || '',
    cr_number: initialData?.cr_number || '',
    cr_number_arabic: initialData?.cr_number_arabic || '',
    website: initialData?.website || '',
    logo_url: initialData?.logo_url || '',
    header_display_config: initialData?.header_display_config || {
      logo: true,
      name: true,
      name_arabic: false,
      email: true,
      phone: true,
      address: true,
      address_arabic: false,
      website: false,
      vat_number: true,
      vat_number_arabic: false,
      cr_number: false,
      cr_number_arabic: false,
      industry: false,
    },
    footer_display_config: initialData?.footer_display_config || {
      logo: false,
      name: false,
      name_arabic: false,
      email: false,
      phone: false,
      address: false,
      address_arabic: false,
      website: false,
      vat_number: false,
      vat_number_arabic: false,
      cr_number: false,
      cr_number_arabic: false,
      industry: false,
    },
  });

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    onSubmit({ ...orgForm, logoFile });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Organization Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Basic Information */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Basic Information</Text>
              
              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Organization Name</FormLabel>
                  <Input
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Organization Name (Arabic)</FormLabel>
                  <Input
                    value={orgForm.name_arabic}
                    onChange={(e) => setOrgForm({ ...orgForm, name_arabic: e.target.value })}
                    placeholder="اسم المنظمة"
                    dir="rtl"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={orgForm.email}
                    onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={orgForm.phone}
                    onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                    placeholder="+966501234567"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Website</FormLabel>
                  <Input
                    value={orgForm.website}
                    onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                    placeholder="https://www.company.com"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Industry</FormLabel>
                  <Select
                    value={orgForm.industry[0] || ''}
                    onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value ? [e.target.value] : [] })}
                  >
                    <option value="">Select Industry</option>
                    {ORGANIZATION_INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  placeholder="Enter organization address"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Address (Arabic)</FormLabel>
                <Textarea
                  value={orgForm.address_arabic}
                  onChange={(e) => setOrgForm({ ...orgForm, address_arabic: e.target.value })}
                  placeholder="عنوان المنظمة"
                  dir="rtl"
                />
              </FormControl>
            </VStack>

            {/* Detailed Address Fields */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Detailed Address (For Invoicing)</Text>
              
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Building Number</FormLabel>
                  <Input
                    value={orgForm.building_number}
                    onChange={(e) => setOrgForm({ ...orgForm, building_number: e.target.value })}
                    placeholder="Building Number"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Street</FormLabel>
                  <Input
                    value={orgForm.street}
                    onChange={(e) => setOrgForm({ ...orgForm, street: e.target.value })}
                    placeholder="Street Name"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Additional Number</FormLabel>
                  <Input
                    value={orgForm.additional_number}
                    onChange={(e) => setOrgForm({ ...orgForm, additional_number: e.target.value })}
                    placeholder="Additional Number"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>District</FormLabel>
                  <Input
                    value={orgForm.district}
                    onChange={(e) => setOrgForm({ ...orgForm, district: e.target.value })}
                    placeholder="District"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>City</FormLabel>
                  <Input
                    value={orgForm.city}
                    onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                    placeholder="City"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>State/Province</FormLabel>
                  <Input
                    value={orgForm.state_province}
                    onChange={(e) => setOrgForm({ ...orgForm, state_province: e.target.value })}
                    placeholder="State/Province"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Zip/Postal Code</FormLabel>
                  <Input
                    value={orgForm.zip_postal_code}
                    onChange={(e) => setOrgForm({ ...orgForm, zip_postal_code: e.target.value })}
                    placeholder="Zip/Postal Code"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>Country</FormLabel>
                  <Input
                    value={orgForm.country}
                    onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })}
                    placeholder="Country"
                  />
                </FormControl>
              </HStack>
            </VStack>

            {/* Business Information */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Business Information</Text>
              
              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={orgForm.currency}
                    onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                  >
                    <option value="SAR">{'\uE900'} (Saudi Riyal)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>VAT Rate (%)</FormLabel>
                  <NumberInput
                    value={orgForm.vat_rate}
                    onChange={(value) => setOrgForm({ ...orgForm, vat_rate: value })}
                    min={0}
                    max={100}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>VAT Number</FormLabel>
                  <Input
                    value={orgForm.vat_number}
                    onChange={(e) => setOrgForm({ ...orgForm, vat_number: e.target.value })}
                    placeholder="VAT Number"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>VAT Number (Arabic)</FormLabel>
                  <Input
                    value={orgForm.vat_number_arabic}
                    onChange={(e) => setOrgForm({ ...orgForm, vat_number_arabic: e.target.value })}
                    placeholder="الرقم الضريبي"
                    dir="rtl"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>CR Number</FormLabel>
                  <Input
                    value={orgForm.cr_number}
                    onChange={(e) => setOrgForm({ ...orgForm, cr_number: e.target.value })}
                    placeholder="Commercial Registration Number"
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>CR Number (Arabic)</FormLabel>
                  <Input
                    value={orgForm.cr_number_arabic}
                    onChange={(e) => setOrgForm({ ...orgForm, cr_number_arabic: e.target.value })}
                    placeholder="رقم السجل التجاري"
                    dir="rtl"
                  />
                </FormControl>
              </HStack>
            </VStack>

            {/* Logo Upload */}
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Organization Logo</Text>
              
              <HStack spacing={4}>
                <Button
                  leftIcon={<FiUpload />}
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  Upload Logo
                </Button>
                
                {logoPreview && (
                  <Image
                    src={logoPreview}
                    alt="Logo Preview"
                    boxSize="60px"
                    objectFit="contain"
                    borderRadius="md"
                  />
                )}
              </HStack>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={4}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isLoading}
              loadingText="Saving"
            >
              Save Changes
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default OrganizationFormModal;
