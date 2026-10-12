import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter } from 'react-icons/fi';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import DeliveryNoteTable from '../components/deliveryNotes/DeliveryNoteTable';
import DeliveryNoteForm from '../components/deliveryNotes/DeliveryNoteForm';
import MobileTable from '../components/MobileTable';
import { useMediaQuery } from '@chakra-ui/react';

interface DeliveryNoteFormData {
  delivery_note_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_arabic?: string;
  quotation_id?: string;
  issue_date: string;
  delivery_date: string;
  delivery_address: string;
  delivery_address_arabic: string;
  received_by: string;
  received_by_signature: string;
  status: string;
  notes: string;
}

interface DeliveryNoteItem {
  id: string;
  item_name: string;
  item_name_arabic?: string;
  item_id: string;
  quantity: number;
  unit?: string; // Unit field for delivery note items
  delivered_quantity: number;
  description: string;
}

const DeliveryNoteListScreen: React.FC = () => {
  const { user, organizationDetails, loading: authLoading } = useAuth();
  
  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Delivery Notes</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }
  const client = useConvex();
  const toast = useToast();
  const [isLargerThan768] = useMediaQuery('(min-width: 768px)');

  // Check for quotation parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const quotationId = urlParams.get('quotation');
    if (quotationId) {
      // Auto-generate delivery note from quotation
      handleGenerateFromQuotation(quotationId);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Modal states
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isFromQuotationOpen, onOpen: onFromQuotationOpen, onClose: onFromQuotationClose } = useDisclosure();

  // Form states
  const [formData, setFormData] = useState<DeliveryNoteFormData>({
    delivery_note_number: '',
    customer_id: '',
    customer_name: '',
    customer_name_arabic: '',
    quotation_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date().toISOString().split('T')[0],
    delivery_address: '',
    delivery_address_arabic: '',
    received_by: '',
    received_by_signature: '',
    status: 'delivered',
    notes: '',
  });

  const [deliveryNoteItems, setDeliveryNoteItems] = useState<DeliveryNoteItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string>('');

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerRefreshKey, setCustomerRefreshKey] = useState(0);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);

  // Convex mutations
  const createDeliveryNote = useMutation(api.deliveryNotes.createDeliveryNote);
  const createDeliveryNoteFromQuotation = useMutation(api.deliveryNotes.createDeliveryNoteFromQuotation);
  const updateDeliveryNote = useMutation(api.deliveryNotes.updateDeliveryNote);
  const deleteDeliveryNote = useMutation(api.deliveryNotes.deleteDeliveryNote);
  const addDeliveryNoteItem = useMutation(api.deliveryNotes.addDeliveryNoteItem);

  // Convex queries
  const isConvex = isConvexOrgId(organizationDetails?._id);

  const deliveryNotes = useQuery(
    api.deliveryNotes.listDeliveryNotes,
    isConvex ? { organization_id: organizationDetails!._id } : 'skip'
  );
  const customers = useQuery(
    api.customers.listCustomers,
    isConvex ? { organization_id: organizationDetails!._id } : 'skip'
  );
  const inventory = useQuery(
    api.inventory.listInventory,
    isConvex ? { organization_id: organizationDetails!._id } : 'skip'
  );
  const quotations = useQuery(
    api.quotations.listQuotations,
    isConvex ? { organization_id: organizationDetails!._id } : 'skip'
  );

  // Filtered data
  const filteredDeliveryNotes = deliveryNotes?.filter(note => {
    const matchesSearch = note.delivery_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const allCustomers = customers?.map(c => c.customer_company_name || 'Unknown Customer') || [];
  const allInventoryItems = inventory?.map(item => item.name) || [];

  // Generate delivery note number
  const generateDeliveryNoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DN-${year}${month}${day}-${random}`;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      delivery_note_number: generateDeliveryNoteNumber(),
      customer_id: '',
      customer_name: '',
      customer_name_arabic: '',
      quotation_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date().toISOString().split('T')[0],
      delivery_address: '',
      delivery_address_arabic: '',
      received_by: '',
      received_by_signature: '',
      status: 'delivered',
      notes: '',
    });
    setDeliveryNoteItems([]);
    setIsEditMode(false);
    setEditingId('');
  };

  // Handle form submission
  const handleSave = async () => {
    if (!organizationDetails || !user) {
      toast({
        title: 'Error',
        description: 'Organization or user not found',
        status: 'error',
      });
      return;
    }

    if (!formData.customer_name) {
      toast({
        title: 'Error',
        description: 'Please select a customer',
        status: 'error',
      });
      return;
    }

    if (deliveryNoteItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item',
        status: 'error',
      });
      return;
    }

    try {
      const customer = customers?.find(c => 
        (c.customer_company_name || c.name) === formData.customer_name
      );

      if (!customer) {
        toast({
          title: 'Error',
          description: 'Selected customer not found',
          status: 'error',
        });
        return;
      }

      let deliveryNoteId: string;

      if (isEditMode) {
        // Update existing delivery note
        await updateDeliveryNote({
          id: editingId as any,
          customer_id: customer._id,
          delivery_date: formData.delivery_date,
          delivery_address: formData.delivery_address,
          delivery_address_arabic: formData.delivery_address_arabic,
          received_by: formData.received_by,
          received_by_signature: formData.received_by_signature,
          status: formData.status,
          notes: formData.notes,
        });
        deliveryNoteId = editingId;
        
        // Delete existing items before adding new ones
        const existingItems = await client.query(api.deliveryNotes.getDeliveryNoteItems, { delivery_note_id: editingId as any });
        for (const item of existingItems) {
          await client.mutation(api.deliveryNotes.deleteDeliveryNoteItem, { id: item._id });
        }
      } else {
        // Create new delivery note
        deliveryNoteId = await createDeliveryNote({
          customer_id: customer._id,
          organization_id: organizationDetails._id,
          issue_date: formData.issue_date,
          delivery_date: formData.delivery_date,
          delivery_address: formData.delivery_address,
          delivery_address_arabic: formData.delivery_address_arabic,
          received_by: formData.received_by,
          received_by_signature: formData.received_by_signature,
          status: formData.status,
          notes: formData.notes,
          created_by: user.email || '',
        });
      }

      // Add items
      for (const item of deliveryNoteItems) {
        // Skip items with empty inventory_id
        if (!item.item_id || item.item_id.trim() === '') {
          continue;
        }
        
        await addDeliveryNoteItem({
          delivery_note_id: deliveryNoteId as any,
          inventory_id: item.item_id as any,
          quantity: item.quantity,
          unit: item.unit || 'pcs', // [2025-01-11] Fixed - Include unit field from delivery note item
          delivered_quantity: item.delivered_quantity,
          notes: item.description,
        });
      }

      toast({
        title: 'Success',
        description: `Delivery note ${isEditMode ? 'updated' : 'created'} successfully`,
        status: 'success',
      });

      handleClose();
    } catch (error: any) {
      console.error('Error saving delivery note:', error);
      const errorMessage = error.message.includes('Invalid delivery note number')
        ? 'Failed to generate a valid delivery note number. Please try again.'
        : `Failed to ${isEditMode ? 'update' : 'create'} delivery note: ${error.message || 'Unknown error'}`;
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
      });
    }
  };

  // Handle automatic generation from quotation
  const handleGenerateFromQuotation = async (quotationId: string) => {
    try {
      const quotationFromList = quotations?.find(q => q._id === quotationId);
      if (!quotationFromList) {
        toast({
          title: 'Error',
          description: 'Quotation not found',
          status: 'error',
        });
        return;
      }

      const customer = customers?.find(c => c._id === quotationFromList.customer_id);
      if (!customer) {
        toast({
          title: 'Error',
          description: 'Customer not found',
          status: 'error',
        });
        return;
      }

      // Get quotation details
      const quotation = await client.query(api.quotations.getQuotation, { id: quotationId as any });
      if (!quotation) {
        throw new Error('Quotation not found');
      }

      // Get quotation items
      const quotationItems = await client.query(api.quotations.getQuotationItems, { quotation_id: quotationId as any });
      
      // Pre-fill form data with quotation information
      setFormData({
        delivery_note_number: '', // Will be auto-generated
        customer_id: quotation.customer_id,
        customer_name: quotation.customer_name || '',
        quotation_id: quotationId,
        issue_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0], // Today's date as default
        delivery_address: customer.address || '',
        delivery_address_arabic: customer.address_arabic || '',
        received_by: '',
        received_by_signature: '',
        status: 'draft',
        notes: `Generated from quotation: ${quotation.quotation_number}`,
      });

      // Convert quotation items to delivery note items (without pricing)
      const items: DeliveryNoteItem[] = quotationItems.map((item, index) => ({
        id: index.toString(),
        item_name: item.item_name,
        item_id: item.item_id,
        quantity: item.quantity,
        delivered_quantity: item.quantity, // Pre-fill with same quantity
        description: item.description || '',
      }));

      setDeliveryNoteItems(items);
      setIsEditMode(false);
      setEditingId('');
      onFormOpen();
      onFromQuotationClose();
    } catch (error) {
      console.error('Error generating from quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate delivery note from quotation',
        status: 'error',
      });
    }
  };

  // Handle form close
  const handleClose = () => {
    setFormData({
      delivery_note_number: '',
      customer_id: '',
      customer_name: '',
      quotation_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      delivery_address: '',
      delivery_address_arabic: '',
      received_by: '',
      received_by_signature: '',
      status: 'draft',
      notes: '',
    });
    setDeliveryNoteItems([]);
    setIsEditMode(false);
    setEditingId('');
    onFormClose();
  };

  // Handle new delivery note
  const handleNewDeliveryNote = () => {
    setFormData(prev => ({
      ...prev,
              delivery_note_number: generateDeliveryNoteNumber(),
    }));
    setIsEditMode(false);
    setEditingId('');
    onFormOpen();
  };

  // Handle edit delivery note
  const handleEdit = async (id: string) => {
    try {
      const deliveryNote = await client.query(api.deliveryNotes.getDeliveryNote, { id: id as any });
      if (!deliveryNote) {
        toast({
          title: 'Error',
          description: 'Delivery note not found',
          status: 'error',
        });
        return;
      }

      const customer = customers?.find(c => c._id === deliveryNote.customer_id);
      if (!customer) {
        toast({
          title: 'Error',
          description: 'Customer not found',
          status: 'error',
        });
        return;
      }

      setFormData({
        delivery_note_number: deliveryNote.delivery_note_number,
        customer_id: deliveryNote.customer_id,
        customer_name: customer.customer_company_name || customer.name || 'Unknown Customer',
        customer_name_arabic: customer.customer_company_name_arabic || '',
        quotation_id: deliveryNote.quotation_id || '',
        issue_date: deliveryNote.issue_date,
        delivery_date: deliveryNote.delivery_date,
        delivery_address: deliveryNote.delivery_address,
        delivery_address_arabic: deliveryNote.delivery_address_arabic || '',
        received_by: deliveryNote.received_by || '',
        received_by_signature: deliveryNote.received_by_signature || '',
        status: deliveryNote.status,
        notes: deliveryNote.notes || '',
      });

      // Load items
      const items = await client.query(api.deliveryNotes.getDeliveryNoteItems, { delivery_note_id: id as any });
      const deliveryItems: DeliveryNoteItem[] = items.map((item, index) => ({
        id: index.toString(),
        item_name: item.inventory_name,
        item_name_arabic: item.inventory_name_arabic || '',
        item_id: item.inventory_id,
        quantity: item.quantity,
        unit: item.unit || 'pcs', // [2025-01-11] Fixed - Include unit field from database
        delivered_quantity: item.delivered_quantity || 0,
        description: item.notes || '',
      }));

      setDeliveryNoteItems(deliveryItems);
      setIsEditMode(true);
      setEditingId(id);
      onFormOpen();
    } catch (error) {
      console.error('Error loading delivery note:', error);
      toast({
        title: 'Error',
        description: 'Failed to load delivery note',
        status: 'error',
      });
    }
  };

  // Handle delete delivery note
  const handleDelete = async (id: string) => {
    try {
      await deleteDeliveryNote({ id: id as any });
      toast({
        title: 'Success',
        description: 'Delivery note deleted successfully',
        status: 'success',
      });
    } catch (error) {
      console.error('Error deleting delivery note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete delivery note',
        status: 'error',
      });
    }
  };

  // Handle view delivery note
  const handleView = (id: string) => {
    // This will be handled by the table component
  };

  // Handle convert delivery note to invoice
  const handleConvertToInvoice = async (deliveryNote: any) => {
    try {
      toast({
        title: 'Converting to Invoice',
        description: 'Redirecting to invoice creation...',
        status: 'info',
        duration: 2000,
      });

      // Navigate to invoice creation with delivery note data
      const invoiceUrl = `/invoices?action=create&delivery_note_id=${deliveryNote._id}`;
      window.location.href = invoiceUrl;
      
    } catch (error: any) {
      console.error('Error converting delivery note to invoice:', error);
      toast({
        title: 'Error',
        description: `Failed to convert delivery note: ${error.message || 'Unknown error'}`,
        status: 'error',
      });
    }
  };

  // Refresh data
  const handleRefresh = () => {
    setCustomerRefreshKey(prev => prev + 1);
    setInventoryRefreshKey(prev => prev + 1);
  };

  // Customer selection handlers
  const handleCustomerSelection = async (customerName: string) => {
    const customer = customers?.find(c => 
      (c.customer_company_name || c.name) === customerName
    );
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer._id,
        customer_name: customerName,
        customer_name_arabic: customer.customer_company_name_arabic || '',
        delivery_address: customer.address || '',
        delivery_address_arabic: customer.address_arabic || '',
      }));
    }
  };

  const handleCustomerChange = (customerName: string) => {
    setFormData(prev => ({
      ...prev,
      customer_name: customerName,
    }));
  };

  // Item handlers
  const handleItemChange = (itemName: string, itemIndex: number) => {
    const updatedItems = [...deliveryNoteItems];
    const item = inventory?.find(i => i.name === itemName);
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      item_name: itemName,
      item_name_arabic: item?.name_arabic || '',
      item_id: item?._id || '',
    };
    setDeliveryNoteItems(updatedItems);
  };

  const handleInventoryItemSelection = async (itemName: string) => {
    const item = inventory?.find(i => i.name === itemName);
    return item;
  };

  const updateDeliveryNoteItem = (index: number, field: string, value: any) => {
    const updatedItems = [...deliveryNoteItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setDeliveryNoteItems(updatedItems);
  };

  const addNewDeliveryNoteItem = () => {
    const newItem: DeliveryNoteItem = {
      id: Date.now().toString(),
      item_name: '',
      item_name_arabic: '',
      item_id: '',
      quantity: 0,
      delivered_quantity: 0,
      description: '',
    };
    setDeliveryNoteItems([...deliveryNoteItems, newItem]);
  };

  const removeDeliveryNoteItem = (index: number) => {
    const updatedItems = deliveryNoteItems.filter((_, i) => i !== index);
    setDeliveryNoteItems(updatedItems);
  };

  if (!organizationDetails) {
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>Organization Required</AlertTitle>
        <AlertDescription>Please select an organization to view delivery notes.</AlertDescription>
      </Alert>
    );
  }

  return (
    <VStack spacing={6} align="stretch" p={6}>
      {/* Header */}
      <Box>
        <Heading size="lg" mb={2}>Delivery Notes</Heading>
        <Text color="gray.600">Manage delivery notes and shipping documents</Text>
      </Box>

      {/* Actions */}
      <HStack spacing={4} justify="space-between" flexWrap="wrap">
        <HStack spacing={4}>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={handleNewDeliveryNote}
          >
            New Delivery Note
          </Button>
          <Button
            variant="outline"
            onClick={onFromQuotationOpen}
          >
            Generate from Quotation
          </Button>
        </HStack>

        <HStack spacing={4}>
          <InputGroup maxW="300px">
            <InputLeftElement>
              <FiSearch />
            </InputLeftElement>
            <Input
              placeholder="Search delivery notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="150px"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
          </Select>
        </HStack>
      </HStack>

      {/* Delivery Notes Table */}
      {isLargerThan768 ? (
        <DeliveryNoteTable
          deliveryNotes={filteredDeliveryNotes}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={handleRefresh}
          onConvertToInvoice={handleConvertToInvoice}
        />
      ) : (
        <MobileTable
          data={filteredDeliveryNotes}
          columns={[
            { key: 'delivery_note_number', label: 'Number' },
            { key: 'customer_name', label: 'Customer' },
            { key: 'status', label: 'Status' },
            { key: 'delivery_date', label: 'Delivery Date' },
          ]}
        />
      )}

      {/* New/Edit Delivery Note Modal */}
      <Modal isOpen={isFormOpen} onClose={handleClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>
            {isEditMode ? 'Edit Delivery Note' : 'Create Delivery Note'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <DeliveryNoteForm
              formData={formData}
              setFormData={setFormData}
              deliveryNoteItems={deliveryNoteItems}
              setDeliveryNoteItems={setDeliveryNoteItems}
              isEditMode={isEditMode}
              selectedOrganization={organizationDetails._id}
              allCustomers={allCustomers}
              allInventoryItems={allInventoryItems}
              customerRefreshKey={customerRefreshKey}
              inventoryRefreshKey={inventoryRefreshKey}
              onCustomerSelection={handleCustomerSelection}
              onCustomerChange={handleCustomerChange}
              onItemChange={handleItemChange}
              onInventoryItemSelection={handleInventoryItemSelection}
              updateDeliveryNoteItem={updateDeliveryNoteItem}
              addDeliveryNoteItem={addNewDeliveryNoteItem}
              removeDeliveryNoteItem={removeDeliveryNoteItem}
              customers={customers}
              inventory={inventory}
              onSave={handleSave}
              onCancel={handleClose}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Generate from Quotation Modal */}
      <Modal isOpen={isFromQuotationOpen} onClose={onFromQuotationClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate Delivery Note from Quotation</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Select a quotation to generate a delivery note from:</Text>
              <Select
                placeholder="Choose quotation..."
                onChange={(e) => {
                  if (e.target.value) {
                    handleGenerateFromQuotation(e.target.value);
                  }
                }}
              >
                {quotations?.map((quotation) => (
                  <option key={quotation._id} value={quotation._id}>
                    {quotation.quotation_number} - {quotation.customer_name}
                  </option>
                ))}
              </Select>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default DeliveryNoteListScreen;
