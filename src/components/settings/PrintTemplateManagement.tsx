import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Switch,
  Select,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Flex,
  Spacer,
  Tooltip,
  Checkbox,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCopy,
  FiEye,
  FiStar,
  FiSettings,
  FiFileText,
} from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';

// Default configurations
const DEFAULT_HEADER_CONFIG = {
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
  // Custom header/footer image fields
  company_header_image: false,
  company_footer_image: false,
};

const DEFAULT_FOOTER_CONFIG = {
  logo: false,
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
  // Custom header/footer image fields
  company_header_image: false,
  company_footer_image: false,
};

interface PrintTemplate {
  _id: Id<"print_templates">;
  name: string;
  description?: string;
  template_type: string;
  organization_id: Id<"organizations">;
  is_default: boolean;
  is_active: boolean;
  header_config?: any;
  footer_config?: any;
  custom_styles?: any;
  custom_content?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

const PrintTemplateManagement: React.FC = () => {
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const { selectedOrganization, loading: authLoading } = useAuth();
  const toast = useToast();

  // ALL HOOKS AT THE TOP - NO CONDITIONAL RETURNS BEFORE HOOKS
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();

  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    template_type: 'delivery_note',
    is_default: false,
    is_active: true,
    header_config: DEFAULT_HEADER_CONFIG,
    footer_config: DEFAULT_FOOTER_CONFIG,
    custom_styles: {
      primary_color: '#333333',
      secondary_color: '#666666',
      font_family: 'Arial, sans-serif',
      font_size: '14px',
      border_style: 'solid',
      border_width: '1px',
      header_height: '100px',
      footer_height: '80px',
    },
    custom_content: {
      header_text: '',
      header_text_arabic: '',
      footer_text: '',
      footer_text_arabic: '',
      watermark_text: '',
      watermark_text_arabic: '',
    },
  });

  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PrintTemplate | null>(null);
  const [currentTemplateType, setCurrentTemplateType] = useState<string>('delivery_note');

  // Show ALL templates regardless of type for better visibility
  const allTemplates = useQuery(
    api.printTemplates.listTemplates,
    selectedOrganization ? {
      organization_id: selectedOrganization as any
      // Removed template_type filter to show ALL templates
    } : 'skip'
  );

  // Show ALL templates for display - user wants to see everything
  const templates = allTemplates || [];


  // Mutations
  const createTemplate = useMutation(api.printTemplates.createTemplate);
  const updateTemplate = useMutation(api.printTemplates.updateTemplate);
  const deleteTemplate = useMutation(api.printTemplates.deleteTemplate);
  const duplicateTemplate = useMutation(api.printTemplates.duplicateTemplate);
  const setDefaultTemplate = useMutation(api.printTemplates.setDefaultTemplate);
  const createDefaultTemplates = useMutation(api.printTemplates.createDefaultTemplates);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Print Template Management</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Show loading state while templates are being fetched
  if (templates === undefined) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Print Template Management</Heading>
            <Text color="gray.600">Loading templates...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Handle error state
  if (templates === null) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Print Template Management</Heading>
            <Text color="red.500">Error loading templates. Please try again.</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  if (!selectedOrganization) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Print Template Management</Heading>
            <Text color="gray.600">Please select an organization to manage print templates.</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Event handlers
  const handleCreateTemplate = async () => {
    if (!selectedOrganization) return;

    try {
      await createTemplate({
        name: templateForm.name,
        description: templateForm.description,
        template_type: templateForm.template_type,
        organization_id: selectedOrganization as any,
        is_default: templateForm.is_default,
        is_active: templateForm.is_active,
        header_config: templateForm.header_config,
        footer_config: templateForm.footer_config,
        custom_styles: templateForm.custom_styles,
        custom_content: templateForm.custom_content,
      });

      toast({
        title: 'Template created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onCreateClose();
      setTemplateForm({
        name: '',
        description: '',
        template_type: currentTemplateType,
        is_default: false,
        is_active: true,
        header_config: DEFAULT_HEADER_CONFIG,
        footer_config: DEFAULT_FOOTER_CONFIG,
        custom_styles: {
          primary_color: '#333333',
          secondary_color: '#666666',
          font_family: 'Arial, sans-serif',
          font_size: '14px',
          border_style: 'solid',
          border_width: '1px',
          header_height: '100px',
          footer_height: '80px',
        },
        custom_content: {
          header_text: '',
          header_text_arabic: '',
          footer_text: '',
          footer_text_arabic: '',
          watermark_text: '',
          watermark_text_arabic: '',
        },
      });
    } catch (error) {
      toast({
        title: 'Error creating template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEditTemplate = (template: PrintTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      template_type: template.template_type,
      is_default: template.is_default,
      is_active: template.is_active,
      header_config: { ...DEFAULT_HEADER_CONFIG, ...(template.header_config || {}) },
      footer_config: { ...DEFAULT_FOOTER_CONFIG, ...(template.footer_config || {}) },
      custom_styles: template.custom_styles || {
        primary_color: '#333333',
        secondary_color: '#666666',
        font_family: 'Arial, sans-serif',
        font_size: '14px',
        border_style: 'solid',
        border_width: '1px',
        header_height: '100px',
        footer_height: '80px',
      },
      custom_content: template.custom_content || {
        header_text: '',
        header_text_arabic: '',
        footer_text: '',
        footer_text_arabic: '',
        watermark_text: '',
        watermark_text_arabic: '',
      },
    });
    onEditOpen();
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await updateTemplate({
        template_id: editingTemplate._id,
        name: templateForm.name,
        description: templateForm.description,
        is_default: templateForm.is_default,
        is_active: templateForm.is_active,
        header_config: templateForm.header_config,
        footer_config: templateForm.footer_config,
        custom_styles: templateForm.custom_styles,
        custom_content: templateForm.custom_content,
      });

      toast({
        title: 'Template updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onEditClose();
      setEditingTemplate(null);
    } catch (error) {
      toast({
        title: 'Error updating template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTemplate = async (templateId: Id<"print_templates">) => {
    try {
      await deleteTemplate({ template_id: templateId });
      toast({
        title: 'Template deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDuplicateTemplate = async (template: PrintTemplate) => {
    try {
      await duplicateTemplate({ 
        template_id: template._id,
        new_name: `${template.name} (Copy)`
      });
      toast({
        title: 'Template duplicated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error duplicating template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSetDefaultTemplate = async (templateId: Id<"print_templates">) => {
    try {
      await setDefaultTemplate({ template_id: templateId });
      toast({
        title: 'Default template updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error setting default template',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCreateDefaultTemplates = async () => {
    if (!selectedOrganization) return;

    try {
      await createDefaultTemplates({ organization_id: selectedOrganization as any });
      toast({
        title: 'Default templates created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error creating default templates',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handlePreviewTemplate = (template: PrintTemplate) => {
    setPreviewTemplate(template);
    onPreviewOpen();
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Print Template Management</Heading>
          <Text color="gray.600">
            Manage print templates for delivery notes and other documents
          </Text>
        </Box>

        <HStack spacing={3}>
          {(!templates || templates.length === 0) && (
            <Button
              leftIcon={<FiSettings />}
              colorScheme="blue"
              variant="outline"
              onClick={handleCreateDefaultTemplates}
            >
              Create Default Templates
            </Button>
          )}
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            + Create Template
          </Button>
        </HStack>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Print Templates</Heading>
          </CardHeader>
          <CardBody>
            {!templates ? (
              <Text>Loading templates...</Text>
            ) : templates.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>No Templates Found</AlertTitle>
                <AlertDescription>
                  Create your first print template or generate default templates to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Status</Th>
                    <Th>Default</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {templates.map((template) => (
                    <Tr key={template._id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{template.name}</Text>
                          {template.description && (
                            <Text fontSize="sm" color="gray.600">
                              {template.description}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" variant="subtle">
                          {template.template_type.replace('_', ' ')}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={template.is_active ? 'green' : 'red'} variant="subtle">
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        {template.is_default ? (
                          <IconButton
                            aria-label="Default template"
                            icon={<FiStar />}
                            colorScheme="yellow"
                            variant="solid"
                            size="sm"
                          />
                        ) : (
                          <IconButton
                            aria-label="Set as default"
                            icon={<FiStar />}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultTemplate(template._id)}
                          />
                        )}
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Tooltip label="Preview">
                            <IconButton
                              aria-label="Preview template"
                              icon={<FiEye />}
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewTemplate(template)}
                            />
                          </Tooltip>
                          <Tooltip label="Edit">
                            <IconButton
                              aria-label="Edit template"
                              icon={<FiEdit />}
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTemplate(template)}
                            />
                          </Tooltip>
                          <Tooltip label="Duplicate">
                            <IconButton
                              aria-label="Duplicate template"
                              icon={<FiCopy />}
                              size="sm"
                              variant="outline"
                              onClick={() => handleDuplicateTemplate(template)}
                            />
                          </Tooltip>
                          <Tooltip label="Delete">
                            <IconButton
                              aria-label="Delete template"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => handleDeleteTemplate(template._id)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Create Template Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Template Name</FormLabel>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Enter template description"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Template Type</FormLabel>
                <Select
                  value={currentTemplateType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setCurrentTemplateType(newType);
                    setTemplateForm({ ...templateForm, template_type: newType });
                  }}
                >
                  <option value="delivery_note">Delivery Note</option>
                  <option value="quotation">Quotation</option>
                  <option value="invoice">Invoice</option>
                </Select>
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Set as Default</FormLabel>
                  <Switch
                    isChecked={templateForm.is_default}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Active</FormLabel>
                  <Switch
                    isChecked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                  />
                </FormControl>
              </HStack>

              {/* Header Configuration Section */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Header Configuration</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Select which information to display in the header:
                </Text>
                {console.log('DEBUG: templateForm.header_config:', templateForm.header_config)}
                {console.log('DEBUG: typeof templateForm.header_config:', typeof templateForm.header_config)}
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <Checkbox
                      isChecked={!!templateForm.header_config?.company_header_image}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, company_header_image: e.target.checked }
                      })}
                    >
                      🎯 HEADER IMAGE TEST
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.logo}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, logo: e.target.checked }
                      })}
                    >
                      Organization Logo
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.name}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, name: e.target.checked }
                      })}
                    >
                      Company Name (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.name_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, name_arabic: e.target.checked }
                      })}
                    >
                      Company Name (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.email}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, email: e.target.checked }
                      })}
                    >
                      Email Address
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.phone}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, phone: e.target.checked }
                      })}
                    >
                      Phone Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.address}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, address: e.target.checked }
                      })}
                    >
                      Address (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.address_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, address_arabic: e.target.checked }
                      })}
                    >
                      Address (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.vat_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, vat_number: e.target.checked }
                      })}
                    >
                      VAT Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.vat_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, vat_number_arabic: e.target.checked }
                      })}
                    >
                      VAT Number (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.cr_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, cr_number: e.target.checked }
                      })}
                    >
                      Commercial Registration
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.cr_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, cr_number_arabic: e.target.checked }
                      })}
                    >
                      Commercial Registration (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.website}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, website: e.target.checked }
                      })}
                    >
                      Website
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.industry}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, industry: e.target.checked }
                      })}
                    >
                      Industry
                    </Checkbox>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Footer Configuration Section */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Footer Configuration</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Select which information to display in the footer:
                </Text>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.logo}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, logo: e.target.checked }
                      })}
                    >
                      Organization Logo
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.name}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, name: e.target.checked }
                      })}
                    >
                      Company Name (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.name_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, name_arabic: e.target.checked }
                      })}
                    >
                      Company Name (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.email}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, email: e.target.checked }
                      })}
                    >
                      Email Address
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.phone}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, phone: e.target.checked }
                      })}
                    >
                      Phone Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.address}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, address: e.target.checked }
                      })}
                    >
                      Address (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.address_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, address_arabic: e.target.checked }
                      })}
                    >
                      Address (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.vat_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, vat_number: e.target.checked }
                      })}
                    >
                      VAT Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.vat_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, vat_number_arabic: e.target.checked }
                      })}
                    >
                      VAT Number (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.cr_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, cr_number: e.target.checked }
                      })}
                    >
                      Commercial Registration
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.cr_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, cr_number_arabic: e.target.checked }
                      })}
                    >
                      Commercial Registration (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.website}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, website: e.target.checked }
                      })}
                    >
                      Website
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.industry}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, industry: e.target.checked }
                      })}
                    >
                      Industry
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.company_footer_image || false}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, company_footer_image: e.target.checked }
                      })}
                    >
                      Custom Footer Image
                    </Checkbox>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Custom Styles Section */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Custom Styling</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Customize the appearance and layout of your templates:
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>Font Family</FormLabel>
                    <Select
                      value={templateForm.custom_styles.font_family}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, font_family: e.target.value }
                      })}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="'Noto Sans Arabic', Arial, sans-serif">Arabic Font</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Font Size</FormLabel>
                    <Select
                      value={templateForm.custom_styles.font_size}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, font_size: e.target.value }
                      })}
                    >
                      <option value="10px">Small (10px)</option>
                      <option value="12px">Medium (12px)</option>
                      <option value="14px">Large (14px)</option>
                      <option value="16px">Extra Large (16px)</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Primary Color</FormLabel>
                    <Input
                      type="color"
                      value={templateForm.custom_styles.primary_color}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, primary_color: e.target.value }
                      })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Secondary Color</FormLabel>
                    <Input
                      type="color"
                      value={templateForm.custom_styles.secondary_color}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, secondary_color: e.target.value }
                      })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Border Style</FormLabel>
                    <Select
                      value={templateForm.custom_styles.border_style}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, border_style: e.target.value }
                      })}
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                      <option value="double">Double</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Border Width</FormLabel>
                    <Select
                      value={templateForm.custom_styles.border_width}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, border_width: e.target.value }
                      })}
                    >
                      <option value="1px">Thin (1px)</option>
                      <option value="2px">Medium (2px)</option>
                      <option value="3px">Thick (3px)</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Header Height</FormLabel>
                    <Select
                      value={templateForm.custom_styles.header_height}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, header_height: e.target.value }
                      })}
                    >
                      <option value="80px">Small (80px)</option>
                      <option value="100px">Medium (100px)</option>
                      <option value="120px">Large (120px)</option>
                      <option value="150px">Extra Large (150px)</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Footer Height</FormLabel>
                    <Select
                      value={templateForm.custom_styles.footer_height}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, footer_height: e.target.value }
                      })}
                    >
                      <option value="60px">Small (60px)</option>
                      <option value="80px">Medium (80px)</option>
                      <option value="100px">Large (100px)</option>
                      <option value="120px">Extra Large (120px)</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Custom Content Section */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Custom Content</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Add custom text content for headers, footers, and watermarks:
                </Text>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Header Text (English)</FormLabel>
                    <Input
                      value={templateForm.custom_content.header_text}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, header_text: e.target.value }
                      })}
                      placeholder="Custom header text in English"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Header Text (Arabic)</FormLabel>
                    <Input
                      value={templateForm.custom_content.header_text_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, header_text_arabic: e.target.value }
                      })}
                      placeholder="نص رأس مخصص باللغة العربية"
                      dir="rtl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Footer Text (English)</FormLabel>
                    <Input
                      value={templateForm.custom_content.footer_text}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, footer_text: e.target.value }
                      })}
                      placeholder="Custom footer text in English"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Footer Text (Arabic)</FormLabel>
                    <Input
                      value={templateForm.custom_content.footer_text_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, footer_text_arabic: e.target.value }
                      })}
                      placeholder="نص تذييل مخصص باللغة العربية"
                      dir="rtl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Watermark Text (English)</FormLabel>
                    <Input
                      value={templateForm.custom_content.watermark_text}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, watermark_text: e.target.value }
                      })}
                      placeholder="Watermark text in English"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Watermark Text (Arabic)</FormLabel>
                    <Input
                      value={templateForm.custom_content.watermark_text_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, watermark_text_arabic: e.target.value }
                      })}
                      placeholder="نص العلامة المائية باللغة العربية"
                      dir="rtl"
                    />
                  </FormControl>
                </VStack>
              </Box>

              <HStack spacing={3} justify="flex-end">
                <Button variant="outline" onClick={onCreateClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleCreateTemplate}>
                  Create Template
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Template Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Template</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Template Name</FormLabel>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Enter template name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Enter template description"
                />
              </FormControl>

              <HStack spacing={4}>
                <FormControl>
                  <FormLabel>Set as Default</FormLabel>
                  <Switch
                    isChecked={templateForm.is_default}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Active</FormLabel>
                  <Switch
                    isChecked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                  />
                </FormControl>
              </HStack>

              {/* Header Configuration Section - Edit Modal */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Header Configuration</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Select which information to display in the header:
                </Text>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <Checkbox
                      isChecked={!!templateForm.header_config?.company_header_image}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, company_header_image: e.target.checked }
                      })}
                    >
                      ✅ CUSTOM HEADER IMAGE
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.logo}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, logo: e.target.checked }
                      })}
                    >
                      Organization Logo
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.name}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, name: e.target.checked }
                      })}
                    >
                      Company Name (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.name_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, name_arabic: e.target.checked }
                      })}
                    >
                      Company Name (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.email}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, email: e.target.checked }
                      })}
                    >
                      Email Address
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.phone}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, phone: e.target.checked }
                      })}
                    >
                      Phone Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.address}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, address: e.target.checked }
                      })}
                    >
                      Address (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.address_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, address_arabic: e.target.checked }
                      })}
                    >
                      Address (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.vat_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, vat_number: e.target.checked }
                      })}
                    >
                      VAT Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.vat_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, vat_number_arabic: e.target.checked }
                      })}
                    >
                      VAT Number (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.cr_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, cr_number: e.target.checked }
                      })}
                    >
                      Commercial Registration
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.cr_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, cr_number_arabic: e.target.checked }
                      })}
                    >
                      Commercial Registration (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.website}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, website: e.target.checked }
                      })}
                    >
                      Website
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.header_config.industry}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        header_config: { ...templateForm.header_config, industry: e.target.checked }
                      })}
                    >
                      Industry
                    </Checkbox>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Footer Configuration Section - Edit Modal */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Footer Configuration</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Select which information to display in the footer:
                </Text>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.logo}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, logo: e.target.checked }
                      })}
                    >
                      Organization Logo
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.name}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, name: e.target.checked }
                      })}
                    >
                      Company Name (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.name_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, name_arabic: e.target.checked }
                      })}
                    >
                      Company Name (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.email}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, email: e.target.checked }
                      })}
                    >
                      Email Address
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.phone}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, phone: e.target.checked }
                      })}
                    >
                      Phone Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.address}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, address: e.target.checked }
                      })}
                    >
                      Address (English)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.address_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, address_arabic: e.target.checked }
                      })}
                    >
                      Address (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.vat_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, vat_number: e.target.checked }
                      })}
                    >
                      VAT Number
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.vat_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, vat_number_arabic: e.target.checked }
                      })}
                    >
                      VAT Number (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.cr_number}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, cr_number: e.target.checked }
                      })}
                    >
                      Commercial Registration
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.cr_number_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, cr_number_arabic: e.target.checked }
                      })}
                    >
                      Commercial Registration (Arabic)
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.website}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, website: e.target.checked }
                      })}
                    >
                      Website
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.industry}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, industry: e.target.checked }
                      })}
                    >
                      Industry
                    </Checkbox>
                  </FormControl>
                  <FormControl>
                    <Checkbox
                      isChecked={templateForm.footer_config.company_footer_image || false}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        footer_config: { ...templateForm.footer_config, company_footer_image: e.target.checked }
                      })}
                    >
                      Custom Footer Image
                    </Checkbox>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Custom Styles Section - Edit Modal */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Custom Styling</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Customize the appearance and layout of your templates:
                </Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel>Font Family</FormLabel>
                    <Select
                      value={templateForm.custom_styles.font_family}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, font_family: e.target.value }
                      })}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                      <option value="'Noto Sans Arabic', Arial, sans-serif">Arabic Font</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Font Size</FormLabel>
                    <Select
                      value={templateForm.custom_styles.font_size}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, font_size: e.target.value }
                      })}
                    >
                      <option value="10px">Small (10px)</option>
                      <option value="12px">Medium (12px)</option>
                      <option value="14px">Large (14px)</option>
                      <option value="16px">Extra Large (16px)</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Primary Color</FormLabel>
                    <Input
                      type="color"
                      value={templateForm.custom_styles.primary_color}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, primary_color: e.target.value }
                      })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Secondary Color</FormLabel>
                    <Input
                      type="color"
                      value={templateForm.custom_styles.secondary_color}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, secondary_color: e.target.value }
                      })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Border Style</FormLabel>
                    <Select
                      value={templateForm.custom_styles.border_style}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, border_style: e.target.value }
                      })}
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                      <option value="double">Double</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Border Width</FormLabel>
                    <Select
                      value={templateForm.custom_styles.border_width}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, border_width: e.target.value }
                      })}
                    >
                      <option value="1px">Thin (1px)</option>
                      <option value="2px">Medium (2px)</option>
                      <option value="3px">Thick (3px)</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Header Height</FormLabel>
                    <Select
                      value={templateForm.custom_styles.header_height}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, header_height: e.target.value }
                      })}
                    >
                      <option value="80px">Small (80px)</option>
                      <option value="100px">Medium (100px)</option>
                      <option value="120px">Large (120px)</option>
                      <option value="150px">Extra Large (150px)</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Footer Height</FormLabel>
                    <Select
                      value={templateForm.custom_styles.footer_height}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_styles: { ...templateForm.custom_styles, footer_height: e.target.value }
                      })}
                    >
                      <option value="60px">Small (60px)</option>
                      <option value="80px">Medium (80px)</option>
                      <option value="100px">Large (100px)</option>
                      <option value="120px">Extra Large (120px)</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              </Box>

              {/* Custom Content Section - Edit Modal */}
              <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                <Heading size="md" mb={3}>Custom Content</Heading>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Add custom text content for headers, footers, and watermarks:
                </Text>
                <VStack spacing={4} align="stretch">
                  <FormControl>
                    <FormLabel>Header Text (English)</FormLabel>
                    <Input
                      value={templateForm.custom_content.header_text}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, header_text: e.target.value }
                      })}
                      placeholder="Custom header text in English"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Header Text (Arabic)</FormLabel>
                    <Input
                      value={templateForm.custom_content.header_text_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, header_text_arabic: e.target.value }
                      })}
                      placeholder="نص رأس مخصص باللغة العربية"
                      dir="rtl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Footer Text (English)</FormLabel>
                    <Input
                      value={templateForm.custom_content.footer_text}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, footer_text: e.target.value }
                      })}
                      placeholder="Custom footer text in English"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Footer Text (Arabic)</FormLabel>
                    <Input
                      value={templateForm.custom_content.footer_text_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, footer_text_arabic: e.target.value }
                      })}
                      placeholder="نص تذييل مخصص باللغة العربية"
                      dir="rtl"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Watermark Text (English)</FormLabel>
                    <Input
                      value={templateForm.custom_content.watermark_text}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, watermark_text: e.target.value }
                      })}
                      placeholder="Watermark text in English"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Watermark Text (Arabic)</FormLabel>
                    <Input
                      value={templateForm.custom_content.watermark_text_arabic}
                      onChange={(e) => setTemplateForm({
                        ...templateForm,
                        custom_content: { ...templateForm.custom_content, watermark_text_arabic: e.target.value }
                      })}
                      placeholder="نص العلامة المائية باللغة العربية"
                      dir="rtl"
                    />
                  </FormControl>
                </VStack>
              </Box>

              <HStack spacing={3} justify="flex-end">
                <Button variant="outline" onClick={onEditClose}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleUpdateTemplate}>
                  Update Template
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Preview Template Modal */}
      <Modal isOpen={isPreviewOpen} onClose={onPreviewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Template Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {previewTemplate && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Heading size="md">{previewTemplate.name}</Heading>
                  {previewTemplate.description && (
                    <Text color="gray.600">{previewTemplate.description}</Text>
                  )}
                </Box>
                <Divider />
                <Box>
                  <Text fontWeight="medium">Template Configuration:</Text>
                  <VStack align="start" spacing={2} mt={2}>
                    <Text>Type: {previewTemplate.template_type}</Text>
                    <Text>Status: {previewTemplate.is_active ? 'Active' : 'Inactive'}</Text>
                    <Text>Default: {previewTemplate.is_default ? 'Yes' : 'No'}</Text>
                  </VStack>
                </Box>
                <Button variant="outline" onClick={onPreviewClose}>
                  Close
                </Button>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PrintTemplateManagement;