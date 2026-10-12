import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Card,
  CardBody,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  ModalCloseButton,
  Icon,
  Heading
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiDownload, FiPrinter } from 'react-icons/fi';
import { useAuth } from '../contexts/shared/AuthContext';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Import modular components
import { useQuotationLogic } from '../components/quotations/useQuotationLogic';
import QuotationForm from '../components/quotations/QuotationForm';
import QuotationTable from '../components/quotations/QuotationTable';
import DeliveryNoteForm from '../components/deliveryNotes/DeliveryNoteForm'; // Added import for DeliveryNoteForm

const QuotationListScreen: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [useNewTemplate, setUseNewTemplate] = useState(false); // Toggle for new template
  
  // [2025-01-11] Added - Convex instance for direct queries in update logic
  const convex = useConvex();

  // Delivery note form state
  const [isDeliveryNoteModalOpen, setIsDeliveryNoteModalOpen] = useState(false);
  const [deliveryNoteFormData, setDeliveryNoteFormData] = useState<any>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, selectedOrganization, loading: authLoading } = useAuth();
  const client = useConvex();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Quotation Management</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Pass auth data to the hook to avoid context timing issues
  const quotationLogic = useQuotationLogic(selectedOrganization, { user, loading: authLoading });

  // Show loading if quotationLogic is not ready
  if (!quotationLogic) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Quotation Management</Heading>
            <Text color="gray.600">Loading quotation data...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Extract values from the quotation logic hook
  const {
    formData,
    setFormData,
    quotationItems,
    setQuotationItems,
    customerRefreshKey,
    inventoryRefreshKey,
    selectedQuotationForItems,
    setSelectedQuotationForItems,
    quotations,
    customers,
    inventory,
    allCustomers,
    allInventoryItems,
    createQuotation,
    updateQuotation,
    deleteQuotation,
    createQuotationItem,
    createQuotationItemEnhanced,
    // [2025-01-11] Added - New functions for updating quotation items in database
    updateQuotationItemDB,
    deleteQuotationItemDB,
    createCustomer,
    createInventory,
    handleCustomerSelection,
    handleCustomerChange,
    handleInventoryItemSelection,
    handleItemChange,
    updateQuotationItem,
    addQuotationItem,
    addCategoryTitle,
    convertRowType,
    resequenceWBS,
    removeQuotationItem,
    updateSubtotal,
    generateQuotationNumber,
    resetForm,
    generatePDF,
    // New enhanced functionality
    handleImportItems,
    handleExportItems,
    handleMarkupChange,
    saveTermsToOrganization,
    handleExportTemplate,
  } = quotationLogic;

  // Handle loading and error states
  if (quotations === undefined) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Quotation Management</Heading>
            <Text color="gray.600">Loading quotations...</Text>
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
            <Heading size="lg" mb={2}>Quotation Management</Heading>
            <Text color="gray.600">Please select an organization to view quotations</Text>
          </Box>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={4} align="center">
                <Text color="gray.500">No organization selected</Text>
                <Text fontSize="sm" color="gray.400">Please select an organization from the dashboard to manage quotations</Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>
    );
  }

  // Filter quotations based on search term
  const filteredQuotations = quotations?.filter((quotation: any) =>
    quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.customer_name) {
        toast.error('Please select or enter a customer name');
        return;
      }

      // If we have customer_name but no customer_id, try to find or create the customer
      if (!formData.customer_id && formData.customer_name) {
        const existingCustomer = customers?.find(c => 
          c.customer_company_name.toLowerCase() === formData.customer_name.toLowerCase()
        );
        
        if (existingCustomer) {
          // Customer exists, use it
          setFormData(prev => ({
            ...prev,
            customer_id: existingCustomer._id
          }));
          formData.customer_id = existingCustomer._id;
        } else {
          // Customer doesn't exist, create it
          try {
            const newCustomerId = await createCustomer({
              customer_company_name: formData.customer_name,
              customer_type: 'business',
              organization_id: selectedOrganization as any,
              email: '',
              phone: '',
              address: '',
              contact_person: '',
            });
            
            // Update form data with the new customer
            setFormData(prev => ({
              ...prev,
              customer_id: newCustomerId
            }));
            formData.customer_id = newCustomerId;
            
            // Force refresh of customer dropdown
            // Note: setCustomerRefreshKey is not available from the hook, so we'll handle this differently
            // The dropdown will refresh when the component re-renders
            
            toast.success(`Customer "${formData.customer_name}" created successfully`);
          } catch (error) {
            console.error('Error creating customer during submission:', error);
            toast.error(`Error creating customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return;
          }
        }
      }

      // Calculate totals
      const taxAmount = (formData.subtotal * formData.tax_rate) / 100;
      const totalAmount = formData.subtotal + taxAmount;

      const quotationData = {
        ...formData,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      };
      
      // Remove customer_name and description from quotationData as they're not in the schema
      // tax_rate is now included as it's required by the database schema
      const { customer_name, description, ...quotationDataWithoutExtraFields } = quotationData;

      if (isEditMode && selectedQuotation) {
        // Only send updatable fields with actual values - filter out empty strings and undefined
        const updateData: any = {
          id: selectedQuotation._id,
        };
        
        // Only add fields that have actual values (allow empty string for text fields so clears/updates persist)
        if (formData.status !== undefined && formData.status !== null) updateData.status = formData.status;
        if (formData.valid_until !== undefined && formData.valid_until !== null) updateData.valid_until = formData.valid_until;
        if (formData.terms_conditions !== undefined && formData.terms_conditions !== null) updateData.terms_conditions = formData.terms_conditions;
        if (formData.notes !== undefined && formData.notes !== null) updateData.notes = formData.notes;
        if (formData.subtotal !== undefined && formData.subtotal !== null) updateData.subtotal = formData.subtotal;
        if (formData.tax_rate !== undefined && formData.tax_rate !== null) updateData.tax_rate = Math.round(formData.tax_rate);
        if (taxAmount !== undefined && taxAmount !== null) updateData.tax_amount = taxAmount;
        if (totalAmount !== undefined && totalAmount !== null) updateData.total_amount = totalAmount;
        if (formData.currency && formData.currency.trim() !== '') updateData.currency = formData.currency;
        if (formData.reference_number !== undefined && formData.reference_number !== null) updateData.reference_number = formData.reference_number;
        if (formData.salesperson !== undefined && formData.salesperson !== null) updateData.salesperson = formData.salesperson;
        if (formData.markup_percentage !== undefined && formData.markup_percentage !== null) updateData.markup_percentage = formData.markup_percentage;
        if (formData.customer_name && formData.customer_name.trim() !== '') updateData.customer_name = formData.customer_name;
        if (formData.description !== undefined && formData.description !== null) updateData.description = formData.description;

        // Remove undefined values
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });

        // Debug logging
        console.log('Sending update data to Convex:', updateData);
        console.log('Form data:', formData);

        // [2025-01-11] Preserved - Original update without handling quotation items
        /*
        await updateQuotation(updateData);
        toast.success('Quotation updated successfully');
        */
        
        // [2025-01-11] Fixed - Update quotation and handle quotation items
        await updateQuotation(updateData);
        
        // Update quotation items - first get existing items
        const existingItems = await convex.query(api.quotations.getQuotationItems, { 
          quotation_id: selectedQuotation._id 
        });
        
        // Create a map of existing items by _id for safe lookup without collisions
        const existingItemsMap = new Map<string, any>(
          existingItems.map((item: any) => [item._id, item])
        );
        
        // Update or create quotation items
        for (const item of quotationItems) {
          if (item.is_section_header) {
            // Category/Section Title row
            const existingHeader = (item.id && existingItemsMap.has(item.id))
              ? existingItemsMap.get(item.id)
              : existingItems.find(ex => ex._id === item.id);
            if (existingHeader) {
              await updateQuotationItemDB({
                id: existingHeader._id,
                inventory_name: item.item_title || item.item_name || '',
                quantity: 0,
                unit: '',
                unit_price: 0,
                discount_percentage: 0,
                discount_amount: 0,
                total_price: 0,
                vat_amount: 0,
                notes: item.description || '',
                purchase_price: 0,
                markup_amount: 0,
                wbs_code: item.wbs_code || item.serial_number,
                item_title: item.item_title || item.item_name || '',
                is_section_header: true,
              });
              existingItemsMap.delete(existingHeader._id);
            } else {
              await createQuotationItemEnhanced({
                quotation_id: selectedQuotation._id,
                inventory_name: item.item_title || item.item_name || '',
                quantity: 0,
                unit: '',
                unit_price: 0,
                discount_percentage: 0,
                discount_amount: 0,
                total_price: 0,
                vat_amount: 0,
                notes: item.description || '',
                purchase_price: 0,
                markup_amount: 0,
                wbs_code: item.wbs_code || item.serial_number,
                item_title: item.item_title || item.item_name || '',
                is_section_header: true,
              });
            }
          } else if (item.item_name && item.quantity > 0) {
            let inventoryId = item.item_id;
            
            // If no item_id but we have item_name, try to find the inventory item
            if (!inventoryId && item.item_name) {
              const existingInventoryItem = inventory?.find(i => i.name.toLowerCase() === item.item_name.toLowerCase());
              if (existingInventoryItem) {
                inventoryId = existingInventoryItem._id;
              }
            }
            
            // Match existing item by item.id, inventory_id, or wbs_code
            let existingItem = (item.id && existingItemsMap.has(item.id)) ? existingItemsMap.get(item.id) : null;
            if (!existingItem && inventoryId) {
              existingItem = Array.from(existingItemsMap.values()).find(ex => ex.inventory_id === inventoryId);
            }
            if (!existingItem && item.wbs_code) {
              existingItem = Array.from(existingItemsMap.values()).find(ex => ex.wbs_code === item.wbs_code);
            }
            
            if (existingItem) {
              // Update existing quotation item
              await updateQuotationItemDB({
                id: existingItem._id,
                inventory_id: inventoryId as any,
                inventory_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit || 'pcs', // Include unit field with proper fallback
                unit_price: item.unit_price,
                discount_percentage: item.discount_percentage,
                discount_amount: (item.unit_price * item.quantity * (item.discount_percentage || 0)) / 100,
                total_price: item.total_price,
                // [2025-01-11] Added - Include vat_amount when updating quotation items
                vat_amount: item.vat_amount || ((item.total_price * 15) / 100),
                notes: item.description,
                purchase_price: item.purchase_price,
                markup_amount: item.markup_amount,
                wbs_code: item.wbs_code || item.serial_number,
                item_title: item.item_title,
                is_section_header: false,
              });
              existingItemsMap.delete(existingItem._id);
            } else {
              // Create new quotation item
              await createQuotationItemEnhanced({
                quotation_id: selectedQuotation._id,
                inventory_id: inventoryId as any,
                inventory_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit || 'pcs', // Include unit field with proper fallback
                unit_price: item.unit_price,
                discount_percentage: item.discount_percentage,
                discount_amount: (item.unit_price * item.quantity * (item.discount_percentage || 0)) / 100,
                total_price: item.total_price,
                // [2025-01-11] Added - Include vat_amount when creating quotation items
                vat_amount: item.vat_amount || ((item.total_price * 15) / 100),
                notes: item.description,
                purchase_price: item.purchase_price,
                markup_amount: item.markup_amount,
                wbs_code: item.wbs_code || item.serial_number,
                item_title: item.item_title,
                is_section_header: false,
              });
            }
          }
        }
        
        // Delete any remaining items that weren't in the updated list
        for (const [_, remainingItem] of existingItemsMap) {
          await deleteQuotationItemDB({ id: remainingItem._id });
        }
        
        toast.success('Quotation updated successfully');
      } else {
        // Create the quotation first
        const quotationId = await createQuotation({
          ...quotationDataWithoutExtraFields,
          organization_id: selectedOrganization as any,
          // New fields for enhanced quotation management
          reference_number: formData.reference_number,
          salesperson: formData.salesperson,
          markup_percentage: formData.markup_percentage,
          // Include lead connection if present (when quotation is created from a lead)
          lead_id: formData.lead_id as any,
          lead_number: formData.lead_number,
        });
        
        // Then create quotation items - ensure inventory items exist first
        for (const item of quotationItems) {
          if (item.is_section_header) {
            // Category/Section Title row
            await createQuotationItemEnhanced({
              quotation_id: quotationId,
              inventory_name: item.item_title || item.item_name || '',
              quantity: 0,
              unit: '',
              unit_price: 0,
              discount_percentage: 0,
              discount_amount: 0,
              total_price: 0,
              vat_amount: 0,
              notes: item.description || '',
              purchase_price: 0,
              markup_amount: 0,
              wbs_code: item.wbs_code || item.serial_number,
              item_title: item.item_title || item.item_name || '',
              is_section_header: true,
            });
          } else if (item.item_name && item.quantity > 0) {
            let inventoryId = item.item_id;
            
            // If no item_id but we have item_name, try to find or create the inventory item
            if (!inventoryId && item.item_name) {
              const existingItem = inventory?.find(i => i.name.toLowerCase() === item.item_name.toLowerCase());
              
              if (existingItem) {
                inventoryId = existingItem._id;
              } else {
                // Create new inventory item
                try {
                  inventoryId = await createInventory({
                    name: item.item_name,
                    sku: `SKU-${Date.now()}`,
                    category: 'General Item',
                    unit: item.unit || 'pcs', // Use unit from quotation item, fallback to pcs
                    cost_price: 0,
                    selling_price: item.unit_price || 0,
                    quantity: 0,
                    organization_id: selectedOrganization as any,
                  });
                  
                  toast.success(`Inventory item "${item.item_name}" created successfully`);
                } catch (error) {
                  console.error('Error creating inventory item during submission:', error);
                  toast.error(`Error creating inventory item "${item.item_name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
                  continue; // Skip this item if creation failed
                }
              }
            }
            
            // Create quotation item if we have a valid inventory ID
            if (inventoryId) {
              await createQuotationItemEnhanced({
                quotation_id: quotationId,
                inventory_id: inventoryId as any,
                inventory_name: item.item_name,
                quantity: item.quantity,
                unit: item.unit || '', // Include unit field
                unit_price: item.unit_price,
                discount_percentage: item.discount_percentage,
                discount_amount: (item.unit_price * item.quantity * (item.discount_percentage || 0)) / 100,
                total_price: item.total_price,
                // [2025-01-11] Added - Include vat_amount when creating quotation items
                vat_amount: item.vat_amount || ((item.total_price * 15) / 100),
                notes: item.description,
                purchase_price: item.purchase_price,
                markup_amount: item.markup_amount, // Include markup_amount
                wbs_code: item.wbs_code || item.serial_number,
                item_title: item.item_title,
                is_section_header: false,
              });
            }
          }
        }
        
        toast.success('Quotation created successfully');
      }
      
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Error saving quotation');
      console.error('Error saving quotation:', error);
    }
  };

  const handleView = async (quotation: any) => {
    let activeQuotation = quotation;
    try {
      const freshDoc = await convex.query(api.quotations.getQuotation, { id: quotation._id as any });
      if (freshDoc) {
        activeQuotation = { ...quotation, ...freshDoc };
      }
    } catch (err) {
      console.warn('Could not fetch fresh quotation for view:', err);
    }

    setSelectedQuotation(activeQuotation);
    setIsEditMode(false); // View mode - read only
    
    // Set the quotation ID to load items
    setSelectedQuotationForItems(activeQuotation._id);
    
    // Get customer name from customer ID
    let customerName = activeQuotation.customer_name || '';
    if (activeQuotation.customer_id && customers) {
      const customer = customers.find(c => c._id === activeQuotation.customer_id);
      if (customer) {
        customerName = customer.customer_company_name;
      }
    }
    
    setFormData({
      quotation_number: activeQuotation.quotation_number,
      customer_id: activeQuotation.customer_id || '',
      customer_name: customerName,
      reference_number: activeQuotation.reference_number || activeQuotation.subject || '', // Support both old and new field names
      description: activeQuotation.description || '',
      status: activeQuotation.status,
      valid_until: activeQuotation.valid_until || '',
      terms_conditions: activeQuotation.terms_conditions || '',
      notes: activeQuotation.notes || '',
      subtotal: activeQuotation.subtotal || 0,
      tax_rate: activeQuotation.tax_rate || 0,
      tax_amount: activeQuotation.tax_amount || 0,
      total_amount: activeQuotation.total_amount || 0,
      currency: activeQuotation.currency || 'SAR',
      // New fields for enhanced quotation management
      salesperson: activeQuotation.salesperson || '',
      markup_percentage: activeQuotation.markup_percentage || 0,
      // Include lead information if present
      lead_id: activeQuotation.lead_id,
      lead_number: activeQuotation.lead_number,
    });
    
    onOpen();
  };

  const handleEdit = async (quotation: any) => {
    let activeQuotation = quotation;
    try {
      const freshDoc = await convex.query(api.quotations.getQuotation, { id: quotation._id as any });
      if (freshDoc) {
        activeQuotation = { ...quotation, ...freshDoc };
      }
    } catch (err) {
      console.warn('Could not fetch fresh quotation for edit:', err);
    }

    setSelectedQuotation(activeQuotation);
    setIsEditMode(true); // Edit mode - editable
    
    // Set the quotation ID to load items
    setSelectedQuotationForItems(activeQuotation._id);
    
    // Load existing quotation items when editing
    try {
      const existingItems = await convex.query(api.quotations.getQuotationItems, { 
        quotation_id: activeQuotation._id 
      });
      
      // Convert existing items to the form format
      const formItems = existingItems.map((item: any, idx: number) => ({
        id: item._id,
        serial_number: item.wbs_code || (idx + 1).toString(),
        wbs_code: item.wbs_code || `${idx + 1}.0`,
        item_title: item.item_title || '',
        is_section_header: Boolean(item.is_section_header),
        item_name: item.item_name || item.inventory_name || '',
        item_id: item.inventory_id,
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        unit_price: item.unit_price || 0,
        total_price: item.total_price || 0,
        description: item.notes || '',
        discount_percentage: item.discount_percentage || 0,
        purchase_price: item.purchase_price || 0,
        markup_amount: item.markup_amount || 0,
      }));
      
      setQuotationItems(formItems);
    } catch (error) {
      console.error('Error loading quotation items:', error);
      toast.error('Failed to load quotation items');
    }
    
    // Get customer name from customer ID
    let customerName = activeQuotation.customer_name || '';
    if (activeQuotation.customer_id && customers) {
      const customer = customers.find(c => c._id === activeQuotation.customer_id);
      if (customer) {
        customerName = customer.customer_company_name;
      }
    }
    
    setFormData({
      quotation_number: activeQuotation.quotation_number,
      customer_id: activeQuotation.customer_id || '',
      customer_name: customerName,
      reference_number: activeQuotation.reference_number || activeQuotation.subject || '', // Support both old and new field names
      description: activeQuotation.description || '',
      status: activeQuotation.status,
      valid_until: activeQuotation.valid_until || '',
      terms_conditions: activeQuotation.terms_conditions || '',
      notes: activeQuotation.notes || '',
      subtotal: activeQuotation.subtotal || 0,
      tax_rate: activeQuotation.tax_rate || 0,
      tax_amount: activeQuotation.tax_amount || 0,
      total_amount: activeQuotation.total_amount || 0,
      currency: activeQuotation.currency || 'SAR',
      // New fields for enhanced quotation management
      salesperson: activeQuotation.salesperson || '',
      markup_percentage: activeQuotation.markup_percentage || 0,
      // Include lead information if present
      lead_id: activeQuotation.lead_id,
      lead_number: activeQuotation.lead_number,
    });
    
    onOpen();
  };

  const handleDelete = async (quotationId: string) => {
    if (window.confirm('Are you sure you want to delete this quotation?')) {
      try {
        await deleteQuotation({ id: quotationId as any });
        toast.success('Quotation deleted successfully');
      } catch (error) {
        toast.error('Error deleting quotation');
        console.error('Error deleting quotation:', error);
      }
    }
  };

  const openNewQuotationModal = () => {
    resetForm();
    setIsEditMode(false);
    // Auto-generate quotation number
    setFormData((prev: any) => ({
      ...prev,
      quotation_number: generateQuotationNumber(),
      currency: 'SAR',
      tax_rate: 15,
    }));
    onOpen();
  };

  const handleCopyQuotation = async (quotation: any) => {
    try {
      toast.loading('Loading quotation data for copying...', { id: 'copy-quotation' });
      
      // Get quotation details directly from database
      const quotationDetails = await client.query(api.quotations.getQuotation, { id: quotation._id as any });
      if (!quotationDetails) {
        toast.dismiss('copy-quotation');
        toast.error('Quotation not found');
        return;
      }
//this is to test only
      // Get quotation items directly from database
      const quotationItems = await client.query(api.quotations.getQuotationItems, { quotation_id: quotation._id as any });
      
      // Get customer details
      const customer = await client.query(api.customers.getCustomer, { id: quotationDetails.customer_id as any });
      if (!customer) {
        toast.dismiss('copy-quotation');
        toast.error('Customer not found');
        return;
      }

      // [2025-01-11] Preserved - Original conversion without unit field
      /*
      const formItems = quotationItems.map((item: any, index: number) => ({
        id: `item-${index}`,
        item_name: item.item_name || 'Unknown Item',
        item_name_arabic: item.item_name_arabic || '',
        item_id: item.inventory_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        total_price: item.total_price,
        description: item.notes || '',
        purchase_price: item.purchase_price || 0,
      }));
      */
      
      // [2025-01-11] Fixed - Include unit and WBS fields in copy function
      const formItems = quotationItems.map((item: any, index: number) => ({
        id: `item-${index}`,
        serial_number: item.wbs_code || (index + 1).toString(),
        wbs_code: item.wbs_code,
        item_title: item.item_title || '',
        is_section_header: Boolean(item.is_section_header),
        item_name: item.item_name || (item.is_section_header ? (item.item_title || '') : 'Unknown Item'),
        item_name_arabic: item.item_name_arabic || '',
        item_id: item.inventory_id,
        quantity: item.quantity,
        unit: item.unit || '', // Include unit field for proper copying
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0,
        total_price: item.total_price,
        description: item.notes || '',
        purchase_price: item.purchase_price || 0,
        markup_amount: item.markup_amount || 0, // Include markup for copying
        vat_amount: item.vat_amount || ((item.total_price * 15) / 100),
      }));

      // Pre-fill form with copied data and generate new quotation number
      const newQuotationNumber = generateQuotationNumber();
      
      setFormData({
        quotation_number: newQuotationNumber, // Auto-generated new number
        customer_id: quotationDetails.customer_id || '',
        customer_name: customer.customer_company_name || 'Unknown Customer',
        reference_number: quotationDetails.reference_number || '',
        description: quotationDetails.description || '',
        status: 'draft', // Reset to draft for new quotation
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        terms_conditions: quotationDetails.terms_conditions || '',
        notes: quotationDetails.notes || '',
        subtotal: quotationDetails.subtotal || 0,
        tax_rate: quotationDetails.tax_rate || 15,
        tax_amount: quotationDetails.tax_amount || 0,
        total_amount: quotationDetails.total_amount || 0,
        currency: quotationDetails.currency || 'SAR',
        // New fields for enhanced quotation management
        salesperson: quotationDetails.salesperson || '',
        markup_percentage: quotationDetails.markup_percentage || 0,
        // Clear lead information for copied quotation
        lead_id: undefined,
        lead_number: undefined,
      });

      // Set the quotation items
      setQuotationItems(formItems);
      
      // Reset edit mode and selected quotation
      setIsEditMode(false);
      setSelectedQuotation(null);
      
      // Open the modal
      onOpen();
      
      toast.dismiss('copy-quotation');
      toast.success('Quotation copied successfully. Please review and create the new quotation.');
      
    } catch (error: any) {
      console.error('Error copying quotation:', error);
      toast.dismiss('copy-quotation');
      toast.error(`Failed to copy quotation: ${error.message || 'Unknown error'}`);
    }
  };

  const handleGenerateDeliveryNote = async (quotationId: string) => {
    try {
      toast.loading('Loading quotation data...', { id: 'delivery-note-generation' });
      
      // [2025-01-11] Enhanced - Check delivery status instead of just existence
      const deliveryStatus = await client.query(api.quotations.getQuotationDeliveryStatus, { 
        quotation_id: quotationId as any 
      });
      
      if (!deliveryStatus.can_create_delivery_note) {
        toast.dismiss('delivery-note-generation');
        toast.error('Cannot create delivery note: All items have been fully delivered');
        return;
      }
      
      // Show delivery status information
      const statusMessage = `Delivery Status: ${deliveryStatus.pending_items} pending, ${deliveryStatus.partially_delivered_items} partial, ${deliveryStatus.fully_delivered_items} complete. ${deliveryStatus.delivery_notes_count} delivery note(s) exist.`;
      console.log(statusMessage);
      
      // Get quotation details directly from database
      const quotation = await client.query(api.quotations.getQuotation, { id: quotationId as any });
      if (!quotation) {
        toast.dismiss('delivery-note-generation');
        toast.error('Quotation not found');
        return;
      }

      // Get quotation items directly from database
      const quotationItems = await client.query(api.quotations.getQuotationItems, { quotation_id: quotationId as any });
      if (!quotationItems || quotationItems.length === 0) {
        toast.dismiss('delivery-note-generation');
        toast.error('Cannot generate delivery note: No items found in quotation');
        return;
      }

      // Get customer details
      const customer = await client.query(api.customers.getCustomer, { id: quotation.customer_id as any });
      if (!customer) {
        toast.dismiss('delivery-note-generation');
        toast.error('Customer not found');
        return;
      }

      // [2025-01-11] Enhanced - Convert quotation items to delivery note items with remaining quantities
      const deliveryNoteItems = deliveryStatus.items
        .filter((statusItem: any) => statusItem.can_deliver) // Only include items that can be delivered
        .map((statusItem: any, index: number) => {
          const originalItem = quotationItems.find((item: any) => item._id === statusItem.item_id);
          return {
            id: `item-${index}`,
            item_name: statusItem.inventory_name,
            item_name_arabic: originalItem?.item_name_arabic || '',
            item_id: originalItem?.inventory_id,
            quantity: statusItem.ordered_quantity, // [2025-01-11] Fixed - quantity should be the ordered quantity
            unit: statusItem.unit || 'pcs',
            delivered_quantity: statusItem.remaining_quantity, // [2025-01-11] Fixed - delivered_quantity should be the remaining quantity (what can be delivered)
            description: originalItem?.notes || '',
            // [2025-01-11] Added - Store original quantities for reference
            original_ordered: statusItem.ordered_quantity,
            original_delivered: statusItem.delivered_quantity,
            // [2025-01-11] Added - Store quotation item ID for backend tracking
            quotation_item_id: statusItem.item_id,
          };
        });

      // Populate delivery note form data
      const formData = {
        quotation_id: quotationId,
        quotation_number: quotation.quotation_number, // Add quotation number
        customer_id: quotation.customer_id,
        customer_name: customer.customer_company_name || 'Unknown Customer',
        customer_name_arabic: customer.customer_company_name_arabic || '',
        issue_date: new Date().toISOString().split('T')[0], // Today's date for issue date
        delivery_date: new Date().toISOString().split('T')[0], // Today's date
        delivery_address: customer.address || '',
        delivery_address_arabic: customer.address_arabic || '',
        received_by: '',
        received_by_signature: '',
        notes: `Generated from quotation: ${quotation.quotation_number}`,
        status: 'delivered', // Set status to delivered instead of draft
        deliveryNoteItems: deliveryNoteItems, // Pass converted items
      };

      // Set the form data and open the modal
      setDeliveryNoteFormData(formData);
      setIsDeliveryNoteModalOpen(true);
      toast.dismiss('delivery-note-generation');
      toast.success('Delivery note form populated with quotation data. Please review and create.');
      
    } catch (error: any) {
      console.error('Error loading quotation data:', error);
      toast.dismiss('delivery-note-generation');
      toast.error(`Failed to load quotation data: ${error.message || 'Unknown error'}`);
    }
  };

  const handleConvertToInvoice = async (quotation: any) => {
    try {
      toast.loading('Converting quotation to invoice...', { id: 'convert-to-invoice' });
      
      // Check if quotation is in a valid state for conversion
      if (quotation.status === 'cancelled' || quotation.status === 'expired') {
        toast.dismiss('convert-to-invoice');
        toast.error('Cannot convert cancelled or expired quotation to invoice');
        return;
      }

      // Get quotation details and items
      const quotationDetails = await client.query(api.quotations.getQuotation, { id: quotation._id });
      if (!quotationDetails) {
        toast.dismiss('convert-to-invoice');
        toast.error('Quotation not found');
        return;
      }

      const quotationItems = await client.query(api.quotations.getQuotationItems, { quotation_id: quotation._id });
      if (!quotationItems || quotationItems.length === 0) {
        toast.dismiss('convert-to-invoice');
        toast.error('Cannot convert quotation: No items found');
        return;
      }

      // Navigate to invoice creation with quotation data
      const invoiceUrl = `/invoices?action=create&quotation_id=${quotation._id}`;
      window.location.href = invoiceUrl;
      
      toast.dismiss('convert-to-invoice');
      toast.success('Redirecting to invoice creation...');
      
    } catch (error: any) {
      console.error('Error converting quotation to invoice:', error);
      toast.dismiss('convert-to-invoice');
      toast.error(`Failed to convert quotation: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>Quotation Management</Heading>
          <Text color="gray.600">Create and manage customer quotations</Text>
        </Box>

        {/* Search and Actions */}
        <HStack justify="space-between" align="center">
          <InputGroup maxW="400px">
            <InputLeftElement>
              <Icon as={FiSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          <HStack spacing={4}>
            {/* New Template Toggle */}
            <Button
              size="sm"
              variant={useNewTemplate ? "solid" : "outline"}
              colorScheme={useNewTemplate ? "green" : "gray"}
              onClick={() => setUseNewTemplate(!useNewTemplate)}
            >
              {useNewTemplate ? "✓ New Template" : "New Template"}
            </Button>
            
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={openNewQuotationModal}
            >
              Create Quotation
            </Button>
          </HStack>
        </HStack>

        {/* Quotations Table */}
        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <QuotationTable
              quotations={filteredQuotations}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDownload={(quotationId) => generatePDF(quotationId, 'download', useNewTemplate)}
              onPrint={(quotationId, templateId) => generatePDF(quotationId, 'print', useNewTemplate, templateId)}
              onGenerateDeliveryNote={handleGenerateDeliveryNote}
              onCopy={handleCopyQuotation}
              onConvertToInvoice={handleConvertToInvoice}
              organizationId={selectedOrganization}
            />
          </CardBody>
        </Card>

        {/* Add/Edit Quotation Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="full">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {isEditMode ? 'Edit Quotation' : selectedQuotation ? 'View Quotation' : 'Create New Quotation'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody p={6} maxH="90vh" overflowY="auto">
              <QuotationForm
                formData={formData}
                setFormData={setFormData}
                quotationItems={quotationItems}
                setQuotationItems={setQuotationItems}
                isEditMode={isEditMode}
                isReadOnly={!isEditMode && selectedQuotation} // Read-only when viewing existing quotation
                selectedOrganization={selectedOrganization}
                allCustomers={allCustomers}
                allInventoryItems={allInventoryItems}
                customerRefreshKey={customerRefreshKey}
                inventoryRefreshKey={inventoryRefreshKey}
                onCustomerSelection={handleCustomerSelection}
                onCustomerChange={handleCustomerChange}
                onItemChange={handleItemChange}
                onInventoryItemSelection={handleInventoryItemSelection}
                updateQuotationItem={updateQuotationItem}
                addQuotationItem={addQuotationItem}
                addCategoryTitle={addCategoryTitle}
                convertRowType={convertRowType}
                resequenceWBS={resequenceWBS}
                removeQuotationItem={removeQuotationItem}
                updateSubtotal={updateSubtotal}
                onImportItems={handleImportItems}
                onExportItems={handleExportItems}
                onMarkupChange={handleMarkupChange}
                onSaveTerms={saveTermsToOrganization}
                onExportTemplate={handleExportTemplate}
                customers={customers}
                inventory={inventory}
              />
            </ModalBody>

            <ModalFooter>
              <HStack spacing={2}>
                <Button variant="ghost" onClick={onClose}>
                  {selectedQuotation && !isEditMode ? 'Close' : 'Cancel'}
                </Button>
                {selectedQuotation && (
                  <>
                    <Button
                      leftIcon={<FiDownload />}
                      colorScheme="green"
                      variant="outline"
                      onClick={async () => await generatePDF(selectedQuotation._id, 'download', useNewTemplate)}
                    >
                      Download PDF
                    </Button>
                    <Button
                      leftIcon={<FiPrinter />}
                      colorScheme="blue"
                      variant="outline"
                      onClick={async () => await generatePDF(selectedQuotation._id, 'print', useNewTemplate)}
                    >
                      Print
                    </Button>
                  </>
                )}
                {!(!isEditMode && selectedQuotation) && (
                  <Button colorScheme="blue" onClick={handleSubmit}>
                    {isEditMode ? 'Update Quotation' : 'Create Quotation'}
                  </Button>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Delivery Note Form Modal */}
        <Modal isOpen={isDeliveryNoteModalOpen} onClose={() => setIsDeliveryNoteModalOpen(false)} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Create Delivery Note from Quotation
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {deliveryNoteFormData && (
                <DeliveryNoteForm
                  formData={deliveryNoteFormData}
                  setFormData={setDeliveryNoteFormData}
                  deliveryNoteItems={deliveryNoteFormData.deliveryNoteItems || []}
                  setDeliveryNoteItems={(items) => setDeliveryNoteFormData(prev => ({ ...prev, deliveryNoteItems: items }))}
                  isEditMode={false}
                  selectedOrganization={selectedOrganization}
                  allCustomers={[]}
                  allInventoryItems={[]}
                  customerRefreshKey={0}
                  inventoryRefreshKey={0}
                  onCustomerSelection={async () => {}}
                  onCustomerChange={() => {}}
                  onItemChange={() => {}}
                  onInventoryItemSelection={async () => {}}
                  updateDeliveryNoteItem={(index, field, value) => {
                    const updatedItems = [...(deliveryNoteFormData.deliveryNoteItems || [])];
                    updatedItems[index] = { ...updatedItems[index], [field]: value };
                    setDeliveryNoteFormData(prev => ({ ...prev, deliveryNoteItems: updatedItems }));
                  }}
                  addDeliveryNoteItem={() => {
                    const newItem = {
                      id: `item-${Date.now()}`,
                      item_name: '',
                      item_name_arabic: '',
                      item_id: '',
                      quantity: 1,
                      delivered_quantity: 0,
                      description: '',
                    };
                    setDeliveryNoteFormData(prev => ({ 
                      ...prev, 
                      deliveryNoteItems: [...(prev.deliveryNoteItems || []), newItem] 
                    }));
                  }}
                  removeDeliveryNoteItem={(index) => {
                    const updatedItems = (deliveryNoteFormData.deliveryNoteItems || []).filter((_, i) => i !== index);
                    setDeliveryNoteFormData(prev => ({ ...prev, deliveryNoteItems: updatedItems }));
                  }}
                  customers={customers}
                  inventory={inventory}
                  onCancel={() => setIsDeliveryNoteModalOpen(false)}
                  onSave={async () => {
                    try {
                      // [2025-01-11] Enhanced - Create delivery note with specific delivery items for partial delivery
                      const deliveryItems = (deliveryNoteFormData.deliveryNoteItems || []).map((item: any) => ({
                        quotation_item_id: item.quotation_item_id,
                        quantity_to_deliver: item.delivered_quantity || 0, // [2025-01-11] Fixed - Use delivered_quantity (what user actually wants to deliver)
                      }));
                      
                      // [2025-01-11] Debug - Log delivery items for debugging
                      console.log('Delivery Note Items from Form:', deliveryNoteFormData.deliveryNoteItems);
                      console.log('Delivery Items for Backend:', deliveryItems);
                      
                      const deliveryNoteId = await client.mutation(api.deliveryNotes.createDeliveryNoteFromQuotation, {
                        quotation_id: deliveryNoteFormData.quotation_id as any,
                        delivery_date: deliveryNoteFormData.delivery_date,
                        delivery_address: deliveryNoteFormData.delivery_address,
                        delivery_address_arabic: deliveryNoteFormData.delivery_address_arabic,
                        received_by: deliveryNoteFormData.received_by,
                        received_by_signature: deliveryNoteFormData.received_by_signature,
                        notes: deliveryNoteFormData.notes,
                        created_by: user?.email || '',
                        status: deliveryNoteFormData.status || 'delivered',
                        // [2025-01-11] Added - Pass specific delivery items for partial delivery
                        delivery_items: deliveryItems,
                      });

                      if (deliveryNoteId) {
                        toast.success('Delivery note created successfully!');
                        setIsDeliveryNoteModalOpen(false);
                        // Optionally redirect to delivery notes page
                        if (window.confirm('Delivery note created successfully! Would you like to view it?')) {
                          window.location.href = `/delivery-notes`;
                        }
                      }
                    } catch (error: any) {
                      console.error('Error creating delivery note:', error);
                      toast.error(`Failed to create delivery note: ${error.message || 'Unknown error'}`);
                    }
                  }}
                />
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

      </VStack>
    </Box>
  );
};

export default QuotationListScreen;
