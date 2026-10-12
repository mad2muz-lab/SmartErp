import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  useColorModeValue,
  Button,
  Spinner,
  Alert,
  AlertIcon,
  useDisclosure,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import OrganizationSelector from '../OrganizationSelector';
import OrganizationFormModal from './modals/OrganizationFormModal';
import DisplayConfigurationPanel from './DisplayConfigurationPanel';
import { FiPlus, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

const OrganizationManagement: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { selectedOrganization } = useAuth();
  const { 
    isOpen: isOrgModalOpen, 
    onOpen: onOrgModalOpen, 
    onClose: onOrgModalClose 
  } = useDisclosure();
  const [isLoading, setIsLoading] = useState(false);

  const [newOrgForm, setNewOrgForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currency: 'SAR',
    vat_rate: '15',
    timezone: 'Asia/Riyadh',
    language: 'en',
    vat_number: '',
    slug: '',
    profit_sharing_enabled: false,
    profit_sharing_percentage: '0',
  });

  // Fetch data
  const organizations = useQuery(api.organizations.listOrganizations);
  const currentOrganization = useQuery(
    api.organizations.getOrganization,
    selectedOrganization ? { id: selectedOrganization as any } : 'skip'
  );

  // File upload actions
  const uploadFile = useAction(api.fileUpload.uploadFile);
  const getFileUrl = useAction(api.fileUpload.getFileUrl);

  // Mutations
  const updateOrganization = useMutation(api.organizations.updateOrganization);
  const setDefaultOrganization = useMutation(api.organizations.setDefaultOrganization);
  const createOrganization = useMutation(api.organizations.createOrganization);

  // Populate organization form when data is loaded
  React.useEffect(() => {
    if (currentOrganization) {
      // Clear logo preview first when organization changes
      setLogoPreview('');
      setLogoFile(null);
      
      setOrgForm({
        name: currentOrganization.name || '',
        email: currentOrganization.email || '',
        phone: currentOrganization.phone || '',
        address: currentOrganization.address || '',
        currency: currentOrganization.currency || 'SAR',
        vat_rate: currentOrganization.vat_rate || '15',
        timezone: currentOrganization.timezone || 'UTC',
        language: currentOrganization.language || 'en',
        // New fields
        name_arabic: currentOrganization.name_arabic || '',
        industry: currentOrganization.industry || [],
        address_arabic: currentOrganization.address_arabic || '',
        vat_number: currentOrganization.vat_number || '',
        vat_number_arabic: currentOrganization.vat_number_arabic || '',
        cr_number: currentOrganization.cr_number || '',
        cr_number_arabic: currentOrganization.cr_number_arabic || '',
        website: currentOrganization.website || '',
        logo_url: currentOrganization.logo_url || '',
        header_display_config: currentOrganization.header_display_config || DEFAULT_DISPLAY_CONFIG,
        footer_display_config: currentOrganization.footer_display_config || DEFAULT_DISPLAY_CONFIG,
      });
      
      // Load logo preview if logo_url exists
      if (currentOrganization.logo_url) {
        console.log('Loading logo for organization:', {
          organizationId: selectedOrganization,
          logoUrl: currentOrganization.logo_url
        });
        
        setIsLoadingLogo(true);
        getFileUrl({ fileId: currentOrganization.logo_url }).then((url) => {
          if (url) {
            console.log('Logo URL retrieved successfully:', url);
            setLogoPreview(url);
          } else {
            console.log('No logo URL returned from storage');
            setLogoPreview('');
          }
        }).catch((error) => {
          console.error('Error loading logo:', error);
          setLogoPreview('');
        }).finally(() => {
          setIsLoadingLogo(false);
        });
      } else {
        console.log('No logo URL found for organization');
        setLogoPreview('');
        setIsLoadingLogo(false);
      }
    }
  }, [currentOrganization, getFileUrl]);

  const handleLogoUpload = async (file: File) => {
    try {
      setIsUploadingLogo(true);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Upload file to Convex storage
      const fileId = await uploadFile({
        file: arrayBuffer,
        fileName: file.name,
        contentType: file.type,
      });
      
      // Get the URL for the uploaded file
      const fileUrl = await getFileUrl({ fileId });
      
      if (fileUrl && selectedOrganization) {
        // Update local form state
        setOrgForm({ ...orgForm, logo_url: fileId });
        setLogoPreview(fileUrl);
        
        // Save to database immediately
        await updateOrganization({
          id: selectedOrganization as any,
          logo_url: fileId,
        });
        
        toast.success('Logo uploaded and saved successfully');
        console.log('Logo saved to database:', { fileId, organizationId: selectedOrganization });
      } else {
        toast.error('Failed to get logo URL or no organization selected');
      }
    } catch (error) {
      toast.error('Failed to upload logo');
      console.error(error);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleOrgSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      if (selectedOrganization) {
        await updateOrganization({
          id: selectedOrganization as any,
          ...formData,
        });
        toast.success('Organization settings updated');
      }
    } catch (error) {
      toast.error('Failed to update organization settings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewOrgSubmit = async () => {
    try {
      const newOrgId = await createOrganization({
        ...newOrgForm,
      });
      toast.success('New organization created successfully');
      onOrgModalClose();
      setNewOrgForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        currency: 'SAR',
        vat_rate: '15',
        timezone: 'Asia/Riyadh',
        language: 'en',
        vat_number: '',
        slug: '',
        profit_sharing_enabled: false,
        profit_sharing_percentage: '0',
      });
      console.log('New organization created:', newOrgId);
    } catch (error) {
      toast.error('Failed to create new organization');
      console.error(error);
    }
  };

  // Function to fix organization name if it's "new"
  const fixOrganizationName = async () => {
    if (!currentOrganization || currentOrganization.name !== 'new') return;
    
    try {
      await updateOrganization({
        id: selectedOrganization as any,
        name: 'My Trading Company',
        email: 'contact@mytrading.com',
        phone: '+966501234567',
        address: 'Riyadh, Saudi Arabia',
        currency: 'SAR',
        vat_number: '123456789',
        vat_rate: '15',
        timezone: 'Asia/Riyadh',
        language: 'en',
        profit_sharing_enabled: false,
        profit_sharing_percentage: '0',
      });
      toast.success('Organization name fixed successfully');
    } catch (error) {
      toast.error('Failed to fix organization name');
      console.error(error);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Box>
          <Heading size="md">Organization Management</Heading>
          <Text color="gray.600">Manage organizations and switch between them</Text>
        </Box>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={onOrgModalOpen}
        >
          Add New Organization
        </Button>
      </HStack>

      {/* Organization Selector */}
      <Card bg={cardBg} border="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4}>
            <OrganizationSelector />
            
            {/* Set as Default Button */}
            {selectedOrganization && currentOrganization && (
              <HStack justify="space-between" w="full">
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Default Organization
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {currentOrganization.is_default ? 'This is your default organization' : 'Set this as your default organization'}
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  colorScheme={currentOrganization.is_default ? "green" : "blue"}
                  variant={currentOrganization.is_default ? "solid" : "outline"}
                  onClick={async () => {
                    try {
                      await setDefaultOrganization({ id: selectedOrganization as any });
                      toast.success('Default organization updated successfully');
                    } catch (error) {
                      toast.error('Failed to set default organization');
                      console.error(error);
                    }
                  }}
                  isDisabled={currentOrganization.is_default}
                >
                  {currentOrganization.is_default ? 'Default' : 'Set as Default'}
                </Button>
              </HStack>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Organization Settings Form */}
      {selectedOrganization && (
        <>
          {/* Fix Organization Name Alert */}
          {currentOrganization && currentOrganization.name === 'new' && (
            <Alert status="warning">
              <AlertIcon />
              <VStack align="start" spacing={2} flex={1}>
                <Text fontWeight="bold">Organization Name Issue</Text>
                <Text fontSize="sm">
                  Your organization is named "new". Click the button below to set a proper name.
                </Text>
                <Button
                  size="sm"
                  colorScheme="orange"
                  onClick={fixOrganizationName}
                >
                  Fix Organization Name
                </Button>
              </VStack>
            </Alert>
          )}
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md">Organization Settings</Heading>
                  <Text color="gray.600">Configure your organization details</Text>
                </Box>
                
                {/* Basic Information */}
                <VStack spacing={4} align="stretch">
                  <Heading size="sm">Basic Information</Heading>
                  
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Organization Name (English)</FormLabel>
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
                        placeholder="اسم المؤسسة"
                        dir="rtl"
                      />
                    </FormControl>
                  </HStack>

                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={orgForm.email}
                        onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })}
                        placeholder="Enter email"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Phone</FormLabel>
                      <Input
                        value={orgForm.phone}
                        onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </FormControl>
                  </HStack>

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
                      <FormLabel>Industry</FormLabel>
                      <VStack spacing={2} align="stretch">
                        <HStack justify="space-between" w="full">
                          <Text fontSize="xs" color="gray.500">
                            Select one or more industries
                          </Text>
                          {orgForm.industry.length > 0 && (
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => setOrgForm({ ...orgForm, industry: [] })}
                            >
                              Clear All
                            </Button>
                          )}
                        </HStack>
                        <VStack spacing={2} align="stretch" maxH="200px" overflowY="auto" border="1px" borderColor="gray.200" borderRadius="md" p={2}>
                          {ORGANIZATION_INDUSTRIES.map((industry) => (
                            <HStack key={industry} justify="space-between">
                              <Text fontSize="sm">{industry}</Text>
                              <Switch
                                size="sm"
                                isChecked={orgForm.industry.includes(industry)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setOrgForm({
                                      ...orgForm,
                                      industry: [...orgForm.industry, industry]
                                    });
                                  } else {
                                    setOrgForm({
                                      ...orgForm,
                                      industry: orgForm.industry.filter(i => i !== industry)
                                    });
                                  }
                                }}
                              />
                            </HStack>
                          ))}
                        </VStack>
                        {orgForm.industry.length > 0 && (
                          <Text fontSize="xs" color="blue.500" mt={1}>
                            Selected: {orgForm.industry.join(', ')}
                          </Text>
                        )}
                      </VStack>
                    </FormControl>
                  </HStack>

                  <HStack spacing={4}>
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
                    <FormControl>
                      <FormLabel>Timezone</FormLabel>
                      <Select
                        value={orgForm.timezone}
                        onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                      >
                        <option value="Asia/Riyadh">Asia/Riyadh (Saudi Arabia)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York</option>
                        <option value="Europe/London">Europe/London</option>
                      </Select>
                    </FormControl>
                  </HStack>

                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Website URL</FormLabel>
                      <Input
                        value={orgForm.website || ''}
                        onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })}
                        placeholder="https://www.example.com"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Organization Logo</FormLabel>
                      <VStack spacing={3} align="stretch">
                        {/* Logo Preview */}
                        {logoPreview && (
                          <Box
                            border="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={2}
                            textAlign="center"
                          >
                            <Image
                              src={logoPreview}
                              alt="Organization Logo"
                              maxH="100px"
                              maxW="200px"
                              objectFit="contain"
                              mx="auto"
                              onError={() => {
                                console.error('Failed to load logo image');
                                setLogoPreview('');
                                toast.error('Failed to load logo image');
                              }}
                            />
                            <Text fontSize="xs" color="gray.500" mt={2}>
                              Current Logo
                            </Text>
                          </Box>
                        )}
                        
                        {/* Show when logo exists in database but preview failed */}
                        {!logoPreview && orgForm.logo_url && !isLoadingLogo && (
                          <Box
                            border="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={2}
                            textAlign="center"
                          >
                            <Text fontSize="sm" color="gray.500">
                              Logo exists but failed to load
                            </Text>
                            <Button
                              size="xs"
                              variant="outline"
                              mt={2}
                              onClick={() => {
                                // Retry loading the logo
                                if (orgForm.logo_url) {
                                  setIsLoadingLogo(true);
                                  getFileUrl({ fileId: orgForm.logo_url }).then((url) => {
                                    if (url) {
                                      setLogoPreview(url);
                                    }
                                  }).catch((error) => {
                                    console.error('Error retrying logo load:', error);
                                  }).finally(() => {
                                    setIsLoadingLogo(false);
                                  });
                                }
                              }}
                            >
                              Retry Load
                            </Button>
                          </Box>
                        )}
                        
                        {/* File Input with different labels */}
                        <VStack spacing={2} align="stretch">
                          <Text fontSize="sm" color="gray.600">
                            {logoPreview ? 'Change Logo' : 'Upload Logo'}
                          </Text>
                          <Input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLogoFile(file);
                                await handleLogoUpload(file);
                              }
                            }}
                            isDisabled={isUploadingLogo}
                            style={{ display: 'none' }}
                          />
                          
                          {/* Upload Button - Show when no logo */}
                          {!logoPreview && !isLoadingLogo && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => {
                                if (fileInputRef.current) {
                                  fileInputRef.current.click();
                                }
                              }}
                              leftIcon={<FiUpload />}
                            >
                              Upload Logo
                            </Button>
                          )}
                        </VStack>
                        
                        {/* Upload/Loading Status */}
                        {(isUploadingLogo || isLoadingLogo) && (
                          <HStack spacing={2}>
                            <Spinner size="sm" />
                            <Text fontSize="sm" color="blue.500">
                              {isUploadingLogo ? 'Uploading logo...' : 'Loading logo...'}
                            </Text>
                          </HStack>
                        )}
                        
                        {/* Action Buttons */}
                        <HStack spacing={2}>
                          {logoPreview && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="red"
                              onClick={async () => {
                                try {
                                  if (selectedOrganization) {
                                    // Clear from database
                                    await updateOrganization({
                                      id: selectedOrganization as any,
                                      logo_url: '',
                                    });
                                  }
                                  
                                  // Clear local state
                                  setOrgForm({ ...orgForm, logo_url: '' });
                                  setLogoPreview('');
                                  setLogoFile(null);
                                  
                                  toast.success('Logo removed successfully');
                                } catch (error) {
                                  toast.error('Failed to remove logo');
                                  console.error(error);
                                }
                              }}
                            >
                              Remove Logo
                            </Button>
                          )}
                          
                          {logoPreview && (
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => {
                                // Trigger file input click
                                if (fileInputRef.current) {
                                  fileInputRef.current.click();
                                }
                              }}
                            >
                              Change Logo
                            </Button>
                          )}
                        </HStack>
                      </VStack>
                    </FormControl>
                  </HStack>
                </VStack>

                {/* Address Information */}
                <VStack spacing={4} align="stretch">
                  <Heading size="sm">Address Information</Heading>
                  
                  <FormControl>
                    <FormLabel>Address (English)</FormLabel>
                    <Textarea
                      value={orgForm.address}
                      onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Address (Arabic)</FormLabel>
                    <Textarea
                      value={orgForm.address_arabic}
                      onChange={(e) => setOrgForm({ ...orgForm, address_arabic: e.target.value })}
                      placeholder="العنوان"
                      dir="rtl"
                    />
                  </FormControl>
                </VStack>

                {/* Tax & Registration Information */}
                <VStack spacing={4} align="stretch">
                  <Heading size="sm">Tax & Registration Information</Heading>
                  
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>VAT Number (English)</FormLabel>
                      <Input
                        value={orgForm.vat_number || ''}
                        onChange={(e) => setOrgForm({ ...orgForm, vat_number: e.target.value })}
                        placeholder="Enter VAT number"
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
                      <FormLabel>CR Number (English)</FormLabel>
                      <Input
                        value={orgForm.cr_number}
                        onChange={(e) => setOrgForm({ ...orgForm, cr_number: e.target.value })}
                        placeholder="Enter CR number"
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

                {/* Header/Footer Display Configuration */}
                <VStack spacing={4} align="stretch">
                  <Heading size="sm">Quotation Template Configuration</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Select which fields to display in quotation headers and footers
                  </Text>
                  
                  <HStack spacing={8} align="start">
                    {/* Header Configuration */}
                    <VStack spacing={3} align="stretch" flex={1}>
                      <Heading size="xs" color="blue.600">Header Display</Heading>
                      {Object.entries(FIELD_LABELS).map(([key, label]) => (
                        <HStack key={key} justify="space-between">
                          <Text fontSize="sm">{label}</Text>
                          <Switch
                            size="sm"
                            isChecked={orgForm.header_display_config[key as keyof typeof orgForm.header_display_config]}
                            onChange={(e) => setOrgForm({
                              ...orgForm,
                              header_display_config: {
                                ...orgForm.header_display_config,
                                [key]: e.target.checked
                              }
                            })}
                          />
                        </HStack>
                      ))}
                    </VStack>

                    {/* Footer Configuration */}
                    <VStack spacing={3} align="stretch" flex={1}>
                      <Heading size="xs" color="green.600">Footer Display</Heading>
                      {Object.entries(FIELD_LABELS).map(([key, label]) => (
                        <HStack key={key} justify="space-between">
                          <Text fontSize="sm">{label}</Text>
                          <Switch
                            size="sm"
                            isChecked={orgForm.footer_display_config[key as keyof typeof orgForm.footer_display_config]}
                            onChange={(e) => setOrgForm({
                              ...orgForm,
                              footer_display_config: {
                                ...orgForm.footer_display_config,
                                [key]: e.target.checked
                              }
                            })}
                          />
                        </HStack>
                      ))}
                    </VStack>
                  </HStack>
                </VStack>

                <Button
                  leftIcon={<FiSave />}
                  colorScheme="blue"
                  onClick={handleOrgSubmit}
                >
                  Save Organization Settings
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </>
      )}

      {/* Organization Creation Modal */}
      <Modal isOpen={isOrgModalOpen} onClose={onOrgModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Organization</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Organization Name</FormLabel>
                  <Input
                    value={newOrgForm.name}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, name: e.target.value })}
                    placeholder="Enter organization name"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={newOrgForm.email}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={newOrgForm.phone}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={newOrgForm.currency}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, currency: e.target.value })}
                  >
                    <option value="SAR">{'\uE900'} (Saudi Riyal)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Address</FormLabel>
                <Textarea
                  value={newOrgForm.address}
                  onChange={(e) => setNewOrgForm({ ...newOrgForm, address: e.target.value })}
                  placeholder="Enter address"
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>VAT Rate (%)</FormLabel>
                  <Input
                    type="number"
                    value={newOrgForm.vat_rate}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, vat_rate: e.target.value })}
                    placeholder="15"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Timezone</FormLabel>
                  <Select
                    value={newOrgForm.timezone}
                    onChange={(e) => setNewOrgForm({ ...newOrgForm, timezone: e.target.value })}
                  >
                    <option value="Asia/Riyadh">Asia/Riyadh (Saudi Arabia)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </Select>
                </FormControl>
              </HStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onOrgModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleNewOrgSubmit}
              isDisabled={!newOrgForm.name || !newOrgForm.email}
            >
              Create Organization
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default OrganizationManagement;
