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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';

import LeadClosureModal from '../components/LeadClosureModal';
import LeadForm from '../components/LeadForm';
import { useLeadLogic } from '../components/useLeadLogic';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiEye,
  FiMail,
  FiPhone,
  FiCalendar,
  FiMoreVertical,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import SmartLeadConversionModal from '../components/SmartLeadConversionModal';
import { formatCurrency } from '../utils/currencyUtils';

const LeadListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { selectedOrganization, organizationDetails } = useAuth();
  const chakraToast = useToast();
  
  // Closure modal
  const { 
    isOpen: isClosureModalOpen, 
    onOpen: onClosureModalOpen, 
    onClose: onClosureModalClose 
  } = useDisclosure();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Use the modular lead logic hook
  const leadLogic = useLeadLogic(selectedOrganization);

  // Extract values from the lead logic hook
  const {
    formData,
    setFormData,
    leadItems,
    setLeadItems,
    customerRefreshKey,
    inventoryRefreshKey,
    selectedLeadForItems,
    setSelectedLeadForItems,
    leads,
    customers,
    inventory,
    allCustomers,
    allInventoryItems,
    createLead,
    updateLead,
    deleteLead,
    createLeadItem,
    createCustomer,
    createInventory,
    handleCustomerSelection,
    handleCustomerChange,
    handleInventoryItemSelection,
    handleItemChange,
    updateLeadItem,
    updateLeadItemField,
    addLeadItem,
    removeLeadItem,
    updateSubtotal,
    generateLeadNumber,
    resetForm,
  } = leadLogic;
  
  // Smart conversion modal
  const { 
    isOpen: isSmartConversionOpen, 
    onOpen: onSmartConversionOpen, 
    onClose: onSmartConversionClose 
  } = useDisclosure();

  // Convert to quotation mutation
  const convertToQuotation = useMutation(api.leads.convertToQuotation);

  // Handle conversion workflow
  const startConversionWorkflow = () => {
    onSmartConversionOpen();
  };

  const completeConversion = async (issueDate: string, expiryDate: string, terms?: string, notes?: string) => {
    if (!selectedLead?._id) return;
    
    try {
      await convertToQuotation({
        lead_id: selectedLead._id as any,
        issue_date: issueDate,
        expiry_date: expiryDate,
        terms_conditions: terms,
        notes: notes,
      });
      toast.success('Lead successfully converted to quotation!');
      onSmartConversionClose();
    } catch (error) {
      toast.error('Error converting lead to quotation');
      console.error('Error:', error);
    }
  };

  // Handle loading and error states
  if (leads === undefined) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Lead Management</Heading>
            <Text color="gray.600">Loading leads...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Show message if no organization is selected
  if (!selectedOrganization) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Lead Management</Heading>
            <Text color="gray.600">Please select an organization to view leads</Text>
          </Box>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Text color="gray.500">No organization selected</Text>
                <Text fontSize="sm" color="gray.400">Please select an organization from the dashboard to manage leads</Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    );
  }

  const handleSubmit = async () => {
    try {
      if (isEditMode && selectedLead) {
        const { lead_number, ...updateData } = formData; // Exclude lead_number from update
        await updateLead({
          id: selectedLead._id,
          ...updateData,
        } as any);
        toast.success('Lead updated successfully');
      } else {
        const leadId = await createLead({
          ...formData,
          organization_id: selectedOrganization as any,
        } as any);
        
        // Save items for the new lead
        if (leadItems.length > 0 && leadId) {
          for (const item of leadItems) {
            await createLeadItem({
              lead_id: leadId as any,
              item_name: item.item_name,
              description: item.description,
              quality: 'Standard', // Default quality for lead items
              quantity: item.quantity,
              unit_price: item.unit_price,
              organization_id: selectedOrganization as any,
            });
          }
        }
        
        toast.success('Lead created successfully');
      }
      
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Error saving lead');
      console.error('Error saving lead:', error);
    }
  };

  const handleEdit = (lead: any) => {
    if (!lead || !lead._id) {
      toast.error('Invalid lead selected');
      return;
    }

    setSelectedLead(lead);
    setIsEditMode(true);
    setSelectedLeadForItems(lead._id);
    setFormData({
      lead_number: lead.lead_number,
      name: lead.name,
      status: lead.status,
      priority: lead.priority,
      assigned_to: lead.assigned_to || '',
      customer_id: lead.customer_id || undefined,
      customer_name: lead.customer_name || '',
      subject: lead.subject || '',
      description: lead.description || '',
      currency: lead.currency || 'SAR',
      subtotal: lead.subtotal || 0,
      tax_rate: lead.tax_rate || 15,
      tax_amount: lead.tax_amount || 0,
      total_amount: lead.total_amount || 0,
      terms_conditions: lead.terms_conditions || '',
      notes: lead.notes || '',
      company: lead.company || '',
      email: lead.email || '',
      phone: lead.phone || '',
      source: lead.source || 'unknown',
      estimated_value: lead.estimated_value || 0,
    });
    onOpen();
  };

  const handleDelete = async (leadId: string) => {
    if (!leadId || leadId === '') {
      toast.error('Invalid lead ID');
      return;
    }

    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead({ id: leadId as any });
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error('Error deleting lead');
        console.error('Error deleting lead:', error);
      }
    }
  };



  const handleCloseLead = (lead: any) => {
    if (!lead || !lead._id) return;
    setSelectedLead(lead);
    onClosureModalOpen();
  };

  const openNewLeadModal = async () => {
    resetForm();
    setIsEditMode(false);
    // Pre-generate lead number for display and submission
    if (selectedOrganization) {
      try {
        const num = await generateLeadNumber();
        setFormData((prev) => ({ ...prev, lead_number: num }));
      } catch (e) {
        console.error('Failed to generate lead number', e);
      }
    }
    onOpen();
  };

  // Filter leads based on search term
  const filteredLeads = leads?.filter((lead: any) =>
    (lead.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'blue';
      case 'contacted': return 'yellow';
      case 'qualified': return 'green';
      case 'proposal': return 'purple';
      case 'negotiation': return 'orange';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Lead Management</Heading>
          <Text color="gray.600">Manage and track your sales leads</Text>
        </Box>

        {/* Search and Actions */}
        <HStack justify="space-between" align="center">
          <InputGroup maxW="400px">
            <InputLeftElement>
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={openNewLeadModal}
          >
            Add New Lead
          </Button>
        </HStack>

        {/* Leads Table */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            {filteredLeads.length === 0 ? (
              <VStack spacing={4} align="center" py={8}>
                <Text color="gray.500">No leads found</Text>
                <Text fontSize="sm" color="gray.400">
                  {searchTerm ? 'Try adjusting your search terms' : 'Create your first lead to get started'}
                </Text>
              </VStack>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Lead #</Th>
                      <Th>Name</Th>
                      <Th>Company</Th>
                      <Th>Contact</Th>
                      <Th>Status</Th>
                      <Th>Priority</Th>
                      <Th>Value</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredLeads.map((lead: any) => (
                      <Tr key={lead._id || Math.random()}>
                        <Td>
                          <Badge colorScheme="blue" variant="outline">
                            {lead.lead_number || 'N/A'}
                          </Badge>
                        </Td>
                        <Td fontWeight="medium">{lead.name || 'N/A'}</Td>
                        <Td>{lead.company || '-'}</Td>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            {lead.email && (
                              <HStack spacing={1}>
                                <Icon as={FiMail} boxSize={4} color="gray.400" />
                                <Text fontSize="sm">{lead.email}</Text>
                              </HStack>
                            )}
                            {lead.phone && (
                              <HStack spacing={1}>
                                <Icon as={FiPhone} boxSize={4} color="gray.400" />
                                <Text fontSize="sm">{lead.phone}</Text>
                              </HStack>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="flex-start" spacing={1}>
                            <Badge colorScheme={getStatusColor(lead.status || 'new')}>
                              {lead.status || 'new'}
                            </Badge>
                            {lead.reminder_scheduled && (
                              <HStack spacing={1}>
                                <Icon as={FiClock} boxSize={3} color="orange.400" />
                                <Text fontSize="xs" color="orange.600">
                                  Reminder set
                                </Text>
                              </HStack>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Badge colorScheme={getPriorityColor(lead.priority || 'medium')}>
                            {lead.priority || 'medium'}
                          </Badge>
                        </Td>
                        <Td>
                          {lead.estimated_value ? (
                            <Text>
                              <span className="currency-display-sar">
                                {formatCurrency(
                                  lead.estimated_value || 0,
                                  lead.currency || organizationDetails?.currency || 'SAR'
                                )}
                                <span className="saudi-riyal-symbol"></span>
                              </span>
                            </Text>
                          ) : (
                            '-'
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            <Tooltip label="Edit Lead">
                              <IconButton
                                aria-label="Edit lead"
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(lead)}
                                isDisabled={!lead._id}
                              />
                            </Tooltip>
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<FiMoreVertical />}
                                size="sm"
                                variant="ghost"
                                aria-label="More actions"
                              />
                              <MenuList>

                                <MenuDivider />
                                <MenuItem
                                  icon={<FiCheckCircle />}
                                  onClick={() => handleCloseLead(lead)}
                                  color="green.600"
                                  isDisabled={!selectedOrganization || !lead._id}
                                >
                                  Close Lead
                                </MenuItem>
                                <MenuItem
                                  icon={<FiFileText />}
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    startConversionWorkflow();
                                  }}
                                  color="blue.600"
                                  isDisabled={!selectedOrganization || !lead._id}
                                >
                                  Smart Convert to Quotation
                                </MenuItem>
                                <MenuItem
                                  icon={<FiTrash2 />}
                                  onClick={() => handleDelete(lead._id || '')}
                                  color="red.600"
                                  isDisabled={!selectedOrganization || !lead._id}
                                >
                                  Delete Lead
                                </MenuItem>
                              </MenuList>
                            </Menu>
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

        {/* Add/Edit Lead Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isEditMode ? 'Edit Lead' : 'Add New Lead'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <LeadForm
                formData={formData}
                setFormData={setFormData}
                leadItems={leadItems}
                setLeadItems={setLeadItems}
                isEditMode={isEditMode}
                selectedOrganization={selectedOrganization}
                allCustomers={allCustomers}
                allInventoryItems={allInventoryItems}
                customerRefreshKey={customerRefreshKey}
                inventoryRefreshKey={inventoryRefreshKey}
                onCustomerSelection={handleCustomerSelection}
                onCustomerChange={handleCustomerChange}
                onItemChange={handleItemChange}
                onInventoryItemSelection={handleInventoryItemSelection}
                updateLeadItem={updateLeadItemField}
                addLeadItem={addLeadItem}
                removeLeadItem={removeLeadItem}
                updateSubtotal={updateSubtotal}
              />
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handleSubmit}
                isDisabled={!formData.name || !selectedOrganization}
              >
                {isEditMode ? 'Update Lead' : 'Create Lead'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>



        {/* Lead Closure Modal */}
        {selectedLead && selectedLead._id && selectedOrganization && (
          <LeadClosureModal
            isOpen={isClosureModalOpen}
            onClose={onClosureModalClose}
            lead={selectedLead}
            customers={customers || []}
          />
        )}

        {/* Smart Lead Conversion Modal */}
        {selectedLead && selectedLead._id && selectedOrganization && (
          <SmartLeadConversionModal
            isOpen={isSmartConversionOpen}
            onClose={onSmartConversionClose}
            lead={selectedLead}
            organizationId={selectedOrganization}
          />
        )}
      </VStack>
    </Box>
  );
};

export default LeadListScreen;
