import React, { useState, useEffect, useRef } from 'react';
import {
  Box, VStack, HStack, FormControl, FormLabel, Input, Textarea, Button, 
  Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Text, Divider, IconButton, useToast, Badge, Grid, GridItem, Card, CardBody,
  Table, Thead, Tbody, Tr, Th, Td, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, FormErrorMessage, Heading, Tooltip,
  useColorModeValue
} from '@chakra-ui/react';
import { FiDownload, FiUpload, FiPlus, FiCpu, FiFolderPlus, FiHash, FiList, FiTrash2 } from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';
import { SmartDropdown } from '../SmartDropdown';
import { getAllEntries } from '../../data/customEntries';
import { getCurrencyOptions } from '../../utils/currencyUtils';
import { AIRequisitionParserModal, ParsedRequisitionResult } from './AIRequisitionParserModal';

interface PurchaseRequisitionFormProps {
  organizationId: Id<"organizations"> | string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
}

interface RequisitionItem {
  id: string;
  item_no?: string;
  is_section_header?: boolean;
  item_title?: string;
  item_name: string;
  item_id?: string;
  inventory_id?: string;
  description: string;
  quantity: number;
  unit?: string;
  estimated_unit_price: number;
  total_estimated_price: number;
  specifications: string;
  priority: string;
  required_date: string;
}

export default function PurchaseRequisitionForm({ 
  organizationId, 
  onSuccess, 
  onCancel, 
  initialData, 
  isEditing = false 
}: PurchaseRequisitionFormProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiParserOpen, setIsAiParserOpen] = useState(false);
  
  // Color mode values
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bg = useColorModeValue('white', 'gray.800');

  const handleApplyAiParsedData = (parsed: ParsedRequisitionResult) => {
    setFormData(prev => ({
      ...prev,
      department: parsed.department || prev.department,
      priority: parsed.priority || prev.priority,
      justification: parsed.justification || prev.justification,
    }));

    if (parsed.items && parsed.items.length > 0) {
      const mappedItems: RequisitionItem[] = parsed.items.map((item, index) => {
        // Attempt to match with existing inventory item
        const matchedInv = inventory?.find(inv => 
          inv.name.toLowerCase().includes(item.item_name.toLowerCase()) ||
          item.item_name.toLowerCase().includes(inv.name.toLowerCase())
        );

        const unitCost = item.estimated_unit_price || (matchedInv ? matchedInv.cost_price : 0);
        const qty = item.quantity || 1;

        return {
          id: (Date.now() + index).toString(),
          item_name: matchedInv ? matchedInv.name : item.item_name,
          inventory_id: matchedInv?._id,
          description: item.description || '',
          quantity: qty,
          estimated_unit_price: unitCost,
          total_estimated_price: qty * unitCost,
          specifications: item.specifications || (item.unit ? `Unit: ${item.unit}` : ''),
          priority: parsed.priority || 'medium',
          required_date: formData.required_date || '',
        };
      });

      setItems(mappedItems);
    }
  };
  
  // Form data
  const [formData, setFormData] = useState({
    pr_number: '',
    department: '',
    priority: 'medium',
    justification: '',
    currency: 'SAR',
    required_date: '',
    notes: '',
    add_to_inventory: false,
    requisition_date: new Date().toISOString().split('T')[0],
  });
  
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [totalEstimatedCost, setTotalEstimatedCost] = useState(0);

  // Convex queries and mutations
  const createPurchaseRequisition = useMutation(api.purchaseRequisitions.createPurchaseRequisition);
  const updatePurchaseRequisition = useMutation(api.purchaseRequisitions.updatePurchaseRequisition);
  const createPurchaseRequisitionItem = useMutation(api.purchaseRequisitionItems.createPurchaseRequisitionItem);
  const updatePurchaseRequisitionItem = useMutation(api.purchaseRequisitionItems.updatePurchaseRequisitionItem);
  const deletePurchaseRequisitionItems = useMutation(api.purchaseRequisitionItems.deletePurchaseRequisitionItems);
  const createInventory = useMutation(api.inventory.createInventory);
  const generatePRNumber = useQuery(api.purchaseRequisitions.generatePRNumber, { 
    organization_id: organizationId as any 
  });
  
  // Data queries
  const inventory = useQuery(api.inventory.listInventory, { organization_id: organizationId as any });
  
  // Load requisition items from DB when editing
  const prItemsFromDb = useQuery(
    api.purchaseRequisitionItems.listPurchaseRequisitionItems,
    initialData?._id ? { purchase_requisition_id: initialData._id as any } : 'skip'
  );

  // Helper function to get inventory item Arabic name
  const getInventoryItemArabicName = (itemName: string) => {
    const item = inventory?.find(i => i.name === itemName);
    return item?.name_arabic;
  };

  // Load initial data for editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        pr_number: initialData.pr_number || '',
        department: initialData.department || '',
        priority: initialData.priority || 'medium',
        justification: initialData.justification || '',
        currency: initialData.currency || 'SAR',
        required_date: initialData.required_date || '',
        notes: initialData.notes || '',
        add_to_inventory: false,
        requisition_date: initialData.requisition_date || new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, isEditing]);

  // Set PR number when generated
  useEffect(() => {
    if (generatePRNumber && !isEditing) {
      setFormData(prev => ({ ...prev, pr_number: generatePRNumber }));
    }
  }, [generatePRNumber, isEditing]);

  // Calculate total cost when items change (ignoring section headers)
  useEffect(() => {
    const total = items.reduce((sum, item) => item.is_section_header ? sum : sum + item.total_estimated_price, 0);
    setTotalEstimatedCost(total);
  }, [items]);

  // Load items for editing from DB query or initialData
  useEffect(() => {
    if (initialData && isEditing) {
      if (prItemsFromDb && prItemsFromDb.length > 0) {
        setItems(prItemsFromDb.map((item, index) => ({
          id: item._id,
          is_section_header: Boolean(item.is_section_header),
          item_no: item.item_no || (item.is_section_header ? `${index + 1}` : `1.${index + 1}`),
          item_title: item.item_title || (item.is_section_header ? item.item_name : ''),
          item_name: item.is_section_header ? (item.item_title || item.item_name || '') : item.item_name,
          inventory_id: item.inventory_id,
          item_id: item.inventory_id,
          description: item.description || '',
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          estimated_unit_price: item.estimated_unit_price,
          total_estimated_price: item.total_estimated_price,
          specifications: item.specifications || '',
          priority: item.priority || 'medium',
          required_date: item.required_date || '',
        })));
      } else if (initialData.items && initialData.items.length > 0) {
        setItems(initialData.items);
      }
    }
  }, [initialData, isEditing, prItemsFromDb]);

  // Helper to re-calculate clean WBS / serial numbers
  const resequenceWBS = () => {
    let majorIndex = 0;
    let subIndex = 0;
    const hasSections = items.some(i => i.is_section_header);

    const renumbered = items.map((item, overallIndex) => {
      if (item.is_section_header) {
        majorIndex += 1;
        subIndex = 0;
        const code = majorIndex.toString();
        return {
          ...item,
          item_no: code,
        };
      } else {
        if (hasSections) {
          subIndex += 1;
          const defaultMajor = majorIndex > 0 ? majorIndex : 1;
          const code = `${defaultMajor}.${subIndex}`;
          return {
            ...item,
            item_no: code,
          };
        } else {
          const code = `1.${overallIndex + 1}`;
          return {
            ...item,
            item_no: code,
          };
        }
      }
    });

    setItems(renumbered);
    toast({
      title: "WBS Re-numbered",
      description: "All section headers and line items sequenced cleanly.",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Add line item (1.1, 1.2, 2.1...)
  const addItem = () => {
    let nextWBS = '1.1';
    let majorIndex = 0;
    let subIndex = 0;
    const hasSections = items.some(i => i.is_section_header);

    if (hasSections) {
      for (const item of items) {
        if (item.is_section_header) {
          majorIndex += 1;
          subIndex = 0;
        } else {
          subIndex += 1;
        }
      }
      const activeMajor = majorIndex > 0 ? majorIndex : 1;
      nextWBS = `${activeMajor}.${subIndex + 1}`;
    } else if (items.length > 0) {
      const lastItem = items[items.length - 1];
      const lastCode = lastItem.item_no || '';
      if (lastCode.includes('.')) {
        const parts = lastCode.split('.');
        const lastMajor = parseInt(parts[0], 10) || 1;
        const lastMinor = parseInt(parts[1], 10) || items.length;
        nextWBS = `${lastMajor}.${lastMinor + 1}`;
      } else {
        nextWBS = `1.${items.length + 1}`;
      }
    } else {
      nextWBS = '1.1';
    }

    const newItem: RequisitionItem = {
      id: `item-${Date.now()}`,
      is_section_header: false,
      item_no: nextWBS,
      item_name: '',
      item_id: '',
      inventory_id: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      estimated_unit_price: 0,
      total_estimated_price: 0,
      specifications: '',
      priority: 'medium',
      required_date: ''
    };
    setItems([...items, newItem]);
  };

  // Add category / section title header (1, 2, 3...)
  const addCategoryTitle = () => {
    const sectionCount = items.filter(i => i.is_section_header).length;
    const nextMajor = (sectionCount + 1).toString();

    const newSection: RequisitionItem = {
      id: `section-${Date.now()}`,
      is_section_header: true,
      item_no: nextMajor,
      item_title: '',
      item_name: '',
      item_id: '',
      inventory_id: '',
      description: '',
      quantity: 0,
      unit: '',
      estimated_unit_price: 0,
      total_estimated_price: 0,
      specifications: 'WBS_HEADER',
      priority: 'medium',
      required_date: ''
    };
    setItems([...items, newSection]);
  };

  // Convert row type between Category Header (1, 2, 3...) and Line Item (1.1, 1.2...)
  const convertRowType = (index: number, toCategory: boolean) => {
    if (index < 0 || index >= items.length) return;
    const updated = [...items];
    const target = updated[index];
    if (toCategory) {
      updated[index] = {
        ...target,
        is_section_header: true,
        item_title: target.item_title || target.item_name || '',
        quantity: 0,
        unit: '',
        estimated_unit_price: 0,
        total_estimated_price: 0,
      };
    } else {
      updated[index] = {
        ...target,
        is_section_header: false,
        item_name: target.item_title || target.item_name || '',
        quantity: target.quantity > 0 ? target.quantity : 1,
        unit: target.unit || 'pcs',
        estimated_unit_price: target.estimated_unit_price || 0,
        total_estimated_price: (target.quantity > 0 ? target.quantity : 1) * (target.estimated_unit_price || 0),
      };
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequisitionItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Auto-calculate total price
    if (field === 'quantity' || field === 'estimated_unit_price') {
      const quantity = field === 'quantity' ? value : updatedItems[index].quantity;
      const price = field === 'estimated_unit_price' ? value : updatedItems[index].estimated_unit_price;
      updatedItems[index].total_estimated_price = quantity * price;
    }
    
    setItems(updatedItems);
  };

  const handleItemChange = async (itemName: string, index: number) => {
    updateItem(index, 'item_name', itemName);
    
    // Auto-populate fields when inventory item is selected
    const selectedInventoryItem = inventory?.find(inv => inv.name === itemName);
    if (selectedInventoryItem) {
      updateItem(index, 'inventory_id', selectedInventoryItem._id);
      updateItem(index, 'item_id', selectedInventoryItem._id);
      updateItem(index, 'unit', selectedInventoryItem.unit || 'pcs');
      updateItem(index, 'description', selectedInventoryItem.description || '');
      updateItem(index, 'estimated_unit_price', selectedInventoryItem.cost_price || 0);
      updateItem(index, 'specifications', selectedInventoryItem.notes || '');
    }
  };

  const handleInventoryItemSelection = async (itemName: string) => {
    // This would create a new inventory item in a real implementation
    // For now, we'll just return null
    return null;
  };

  const onExportTemplate = () => {
    const csvContent = "Item Name,Description,Quantity,Estimated Unit Price,Priority,Required Date,Specifications\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purchase_requisition_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const onImportItems = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      const importedItems: RequisitionItem[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',');
          const item: RequisitionItem = {
            id: `imported-${Date.now()}-${i}`,
            item_name: values[0] || '',
            item_id: '',
            inventory_id: '',
            description: values[1] || '',
            quantity: Number(values[2]) || 1,
            estimated_unit_price: Number(values[3]) || 0,
            total_estimated_price: (Number(values[2]) || 1) * (Number(values[3]) || 0),
            specifications: values[6] || '',
            priority: values[4] || 'medium',
            required_date: values[5] || ''
          };
          importedItems.push(item);
        }
      }
      
      if (importedItems.length > 0) {
        setItems(importedItems);
        toast({
          title: "Items imported successfully",
          description: `${importedItems.length} items imported from CSV`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    reader.readAsText(file);
  };

  const onExportItems = () => {
    const csvContent = [
      "Item Name,Description,Quantity,Estimated Unit Price,Priority,Required Date,Specifications,Total Price",
      ...items.map(item => [
        item.item_name,
        item.description,
        item.quantity,
        item.estimated_unit_price,
        item.priority,
        item.required_date,
        item.specifications,
        item.total_estimated_price
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchase_requisition_items_${formData.pr_number || 'export'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!formData.department || !formData.justification) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const validItems = items.filter(item => item.is_section_header ? (item.item_title || item.item_name) : (item.item_name && item.quantity > 0));
    if (items.length === 0 || validItems.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one line item or category title with valid details",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        // Update existing requisition
        await updatePurchaseRequisition({
          id: initialData._id as any,
          department: formData.department,
          priority: formData.priority,
          justification: formData.justification,
          currency: formData.currency,
          total_estimated_cost: totalEstimatedCost,
          requisition_date: formData.requisition_date,
          required_date: formData.required_date,
          notes: formData.notes,
        });

        // Update items
        for (const item of items) {
          if (item.id.startsWith('temp_') || item.id.startsWith('section-') || item.id.startsWith('item-')) {
            // New item
            await createPurchaseRequisitionItem({
              purchase_requisition_id: initialData._id as any,
              inventory_id: item.inventory_id as any,
              item_name: item.is_section_header ? (item.item_title || 'Category Header') : item.item_name,
              item_title: item.item_title,
              item_no: item.item_no,
              is_section_header: item.is_section_header,
              unit: item.unit,
              description: item.description,
              quantity: item.quantity,
              estimated_unit_price: item.estimated_unit_price,
              total_estimated_price: item.total_estimated_price,
              specifications: item.specifications,
              priority: item.priority as any,
              required_date: item.required_date,
            });
          } else {
            // Update existing item
            await updatePurchaseRequisitionItem({
              id: item.id as any,
              inventory_id: item.inventory_id as any,
              item_name: item.is_section_header ? (item.item_title || 'Category Header') : item.item_name,
              item_title: item.item_title,
              item_no: item.item_no,
              is_section_header: item.is_section_header,
              unit: item.unit,
              description: item.description,
              quantity: item.quantity,
              estimated_unit_price: item.estimated_unit_price,
              total_estimated_price: item.total_estimated_price,
              specifications: item.specifications,
              priority: item.priority as any,
              required_date: item.required_date,
            });
          }
        }
      } else {
        // Create new requisition
        const requisitionId = await createPurchaseRequisition({
          pr_number: formData.pr_number,
          organization_id: organizationId as any,
          department: formData.department,
          priority: formData.priority,
          total_estimated_cost: totalEstimatedCost,
          currency: formData.currency,
          justification: formData.justification,
          requisition_date: formData.requisition_date,
          required_date: formData.required_date,
          notes: formData.notes,
          created_by: user?.id,
        });

        // Create items
        for (const item of items) {
          await createPurchaseRequisitionItem({
            purchase_requisition_id: requisitionId,
            inventory_id: item.inventory_id as any,
            item_name: item.is_section_header ? (item.item_title || 'Category Header') : item.item_name,
            item_title: item.item_title,
            item_no: item.item_no,
            is_section_header: item.is_section_header,
            unit: item.unit,
            description: item.description,
            quantity: item.quantity,
            estimated_unit_price: item.estimated_unit_price,
            total_estimated_price: item.total_estimated_price,
            specifications: item.specifications,
            priority: item.priority as any,
            required_date: item.required_date,
          });

          // Create inventory items if checkbox is checked and item is regular item and doesn't exist in inventory
          if (!item.is_section_header && formData.add_to_inventory && !item.inventory_id && item.item_name) {
            try {
              await createInventory({
                name: item.item_name,
                description: item.description,
                category: 'General Item',
                unit: item.unit || 'pcs',
                cost_price: item.estimated_unit_price,
                selling_price: item.estimated_unit_price * 1.2, // 20% markup
                quantity: 0, // Start with 0 stock
                organization_id: organizationId as any,
                created_by: user?.id,
              });
            } catch (inventoryError) {
              console.warn(`Failed to create inventory item "${item.item_name}":`, inventoryError);
            }
          }
        }
      }

      toast({
        title: isEditing ? "Purchase Requisition Updated" : "Purchase Requisition Created",
        description: `PR-${formData.pr_number} has been ${isEditing ? 'updated' : 'created'} successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving purchase requisition:', error);
      toast({
        title: "Error",
        description: "Failed to save purchase requisition. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between" align="center">
        <Heading size="md">{isEditing ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}</Heading>
        {!isEditing && (
          <Button
            leftIcon={<FiCpu />}
            colorScheme="purple"
            variant="solid"
            size="sm"
            onClick={() => setIsAiParserOpen(true)}
            boxShadow="sm"
          >
            AI Ingest (WhatsApp / Email / Scan)
          </Button>
        )}
      </HStack>

      <AIRequisitionParserModal
        isOpen={isAiParserOpen}
        onClose={() => setIsAiParserOpen(false)}
        onApplyParsedData={handleApplyAiParsedData}
      />
      
      {/* Basic Information */}
      <Box w="full">
        <Heading size="sm" mb={4}>Basic Information</Heading>
        <VStack spacing={4}>
          <HStack spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel>Department</FormLabel>
              <SmartDropdown
                value={formData.department}
                onChange={(value) => setFormData({...formData, department: value})}
                onAutoCreate={async (value) => {
                  setFormData({...formData, department: value});
                }}
                placeholder="Select or add department"
                options={getAllEntries('department', organizationId as string, [
                  'IT Department', 'Human Resources', 'Finance', 'Marketing', 'Operations', 'Sales',
                  'Customer Service', 'Research & Development', 'Administration', 'Legal',
                  'Quality Assurance', 'Procurement', 'Logistics', 'Maintenance', 'Security'
                ])}
                type="department"
                organization_id={organizationId as string}
                autoFocus={false}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Priority</FormLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </FormControl>
          </HStack>

          <HStack spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel>Requisition Date</FormLabel>
              <Input
                type="date"
                value={formData.requisition_date}
                onChange={(e) => setFormData({...formData, requisition_date: e.target.value})}
              />
            </FormControl>
            
            <FormControl isRequired>
              <FormLabel>Required Date</FormLabel>
              <Input
                type="date"
                value={formData.required_date}
                onChange={(e) => setFormData({...formData, required_date: e.target.value})}
              />
            </FormControl>
          </HStack>

          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>Currency</FormLabel>
              <Select
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
              >
                {getCurrencyOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>PR Number</FormLabel>
              <Input value={formData.pr_number} isReadOnly bg="gray.50" />
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Requested By</FormLabel>
            <Input value={user?.email || ''} isReadOnly bg="gray.50" />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Justification</FormLabel>
            <Textarea
              value={formData.justification}
              onChange={(e) => setFormData({...formData, justification: e.target.value})}
              placeholder="Explain why this purchase is needed"
              rows={3}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Additional notes or specifications"
              rows={2}
            />
          </FormControl>
        </VStack>
      </Box>

      <Divider />

      {/* Items Section */}
      <Box w="full">
        <HStack justify="space-between" align="center" mb={4}>
          <Heading size="md">Items</Heading>
          <HStack spacing={2}>
            <Tooltip label="Download CSV Template">
              <Button
                leftIcon={<FiDownload />}
                size="sm"
                variant="outline"
                colorScheme="teal"
                onClick={onExportTemplate}
              >
                Template
              </Button>
            </Tooltip>
            <Tooltip label="Import Items from CSV/Excel">
              <Button
                leftIcon={<FiUpload />}
                size="sm"
                variant="outline"
                colorScheme="green"
                onClick={() => fileInputRef.current?.click()}
              >
                Import
              </Button>
            </Tooltip>
            <Tooltip label="Export Items to CSV">
              <Button
                leftIcon={<FiDownload />}
                size="sm"
                variant="outline"
                colorScheme="blue"
                onClick={onExportItems}
                isDisabled={items.length === 0}
              >
                Export
              </Button>
            </Tooltip>
            <Button
              leftIcon={<FiFolderPlus />}
              size="sm"
              colorScheme="teal"
              onClick={addCategoryTitle}
            >
              + Add Category Title (1, 2...)
            </Button>
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              colorScheme="blue"
              onClick={addItem}
            >
              + Add Line Item (1.1, 1.2...)
            </Button>
            <Tooltip label="Auto-number all items into clean WBS hierarchy (1 -> 1.1, 1.2 -> 2 -> 2.1, 2.2)">
              <Button
                leftIcon={<FiHash />}
                size="sm"
                variant="outline"
                colorScheme="purple"
                onClick={resequenceWBS}
                isDisabled={items.length === 0}
              >
                Re-number WBS
              </Button>
            </Tooltip>
          </HStack>
        </HStack>
        
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onImportItems(file);
            }
            // Reset the input
            if (e.target) {
              e.target.value = '';
            }
          }}
        />
        
        {items.length === 0 ? (
          <VStack spacing={4} align="center" py={8}>
            <Text color="gray.500">No items added</Text>
            <Text fontSize="sm" color="gray.400">
              Click "+ Add Category Title" or "+ Add Line Item" to start structuring your requisition.
            </Text>
            <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200" maxW="md">
              <Text fontSize="sm" color="blue.700" fontWeight="medium" mb={2}>
                Import Instructions:
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="blue.600">• Required fields: Item Name, Quantity, Estimated Unit Price</Text>
                <Text fontSize="xs" color="blue.600">• Optional fields: Description, Priority, Required Date</Text>
                <Text fontSize="xs" color="blue.600">• Total price is calculated automatically</Text>
                <Text fontSize="xs" color="blue.600">• Download template for correct format</Text>
              </VStack>
            </Box>
          </VStack>
        ) : (
          <Box w="full" overflowX="auto">
            {/* Items Table Header */}
            <Box
              w="full"
              p={3}
              bg="gray.50"
              border="1px"
              borderColor={borderColor}
              borderBottom="none"
              borderRadius="md"
              borderBottomRadius="none"
            >
              <HStack spacing={3} w="full" fontSize="sm" fontWeight="semibold" color="gray.700">
                <Text flex={0.8} minW="70px" textAlign="center">Item No</Text>
                <Text flex={3} minW="180px">Item Name & Description</Text>
                <Text flex={0.8} minW="80px">Quantity</Text>
                <Text flex={0.8} minW="80px">Unit</Text>
                <Text flex={1.2} minW="110px">Est. Unit Price</Text>
                <Text flex={1} minW="100px">Priority</Text>
                <Text flex={1.2} minW="110px">Total Price</Text>
                <Text flex={0.8} minW="80px" textAlign="center">Action</Text>
              </HStack>
            </Box>
            
            {/* Items Table Body */}
            <VStack spacing={0} align="stretch">
              {items.map((item, index) => item.is_section_header ? (
                <Box
                  key={`category-${index}-${item.id}`}
                  w="full"
                  p={3}
                  border="1px"
                  borderColor={borderColor}
                  borderTop="none"
                  bg="teal.50"
                  borderLeft="4px solid"
                  borderLeftColor="teal.500"
                >
                  <HStack spacing={4} w="full" align="center">
                    <Box minW="70px" maxW="90px" textAlign="center">
                      <Input
                        value={item.item_no || (index + 1).toString()}
                        onChange={(e) => updateItem(index, 'item_no', e.target.value)}
                        placeholder="1"
                        size="sm"
                        fontWeight="extrabold"
                        textAlign="center"
                        bg="teal.100"
                        borderColor="teal.400"
                        color="teal.900"
                        _focus={{ borderColor: "teal.600", bg: "white", boxShadow: "0 0 0 1px #319795" }}
                      />
                    </Box>
                    <FormControl flex={1}>
                      <Input
                        value={item.item_title || item.item_name || ''}
                        onChange={(e) => {
                          updateItem(index, 'item_title', e.target.value);
                          updateItem(index, 'item_name', e.target.value);
                        }}
                        placeholder="Category Title / Scope of Work (e.g. 1. Civil & Foundation Works, 2. Structural Steel)"
                        size="sm"
                        fontWeight="bold"
                        color="teal.900"
                        bg="white"
                        borderColor="teal.300"
                        _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                      />
                    </FormControl>
                    <HStack minW="100px" justify="center" spacing={1}>
                      <Tooltip label="Convert to Line Item (1.1, 1.2...)">
                        <IconButton
                          aria-label="Convert to Line Item"
                          icon={<FiList />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={() => convertRowType(index, false)}
                        />
                      </Tooltip>
                      <IconButton
                        aria-label="Remove category"
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeItem(index)}
                        isDisabled={items.length === 1}
                      />
                    </HStack>
                  </HStack>
                </Box>
              ) : (
                <Box
                  key={`item-${index}-${item.id}`}
                  w="full"
                  p={3}
                  border="1px"
                  borderColor={borderColor}
                  borderTop="none"
                  borderRadius={index === items.length - 1 ? "md" : "none"}
                  borderTopRadius="none"
                  bg="white"
                >
                  <HStack spacing={3} w="full" align="flex-start">
                    {/* Item No (WBS) */}
                    <FormControl flex={0.8} minW="70px" maxW="90px">
                      <Input
                        value={item.item_no || `1.${index + 1}`}
                        onChange={(e) => updateItem(index, 'item_no', e.target.value)}
                        placeholder="1.1"
                        size="sm"
                        bg="blue.50"
                        borderColor="blue.200"
                        fontWeight="bold"
                        textAlign="center"
                        color="blue.800"
                      />
                    </FormControl>

                    {/* Item Name & Sub-description */}
                    <FormControl flex={3} minW="180px">
                      <SmartDropdown
                        key={`item-${index}-${item.id || index}-${item.item_name}`}
                        value={item.item_name}
                        onChange={(itemName) => handleItemChange(itemName, index)}
                        onAutoCreate={async (itemName) => {
                          const newItem = await handleInventoryItemSelection(itemName);
                          if (newItem) {
                            updateItem(index, 'inventory_id', newItem._id);
                          }
                        }}
                        placeholder={inventory === undefined ? "Loading..." : "Select or type item"}
                        options={inventory?.map(inv => inv.name) || []}
                        type="inventory_item"
                        organization_id={organizationId as string}
                        autoFocus={false}
                      />
                      {/* Arabic Item Name Display */}
                      {item.item_name && getInventoryItemArabicName(item.item_name) && (
                        <Box mt={1} p={1} bg="green.50" borderRadius="sm" border="1px solid" borderColor="green.200">
                          <Text fontSize="xs" color="green.700" fontFamily="'Noto Sans Arabic', 'Arial Unicode MS', sans-serif" textAlign="right" dir="rtl">
                            {getInventoryItemArabicName(item.item_name)}
                          </Text>
                        </Box>
                      )}
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="Scope / specification (e.g. Subgrade preparation, compaction, vapor barrier...)"
                        size="xs"
                        mt={1}
                        bg="gray.50"
                        borderColor="gray.200"
                        _focus={{ bg: "white", borderColor: "blue.400" }}
                      />
                    </FormControl>
                    
                    {/* Quantity */}
                    <FormControl flex={0.8} minW="80px">
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) => updateItem(index, 'quantity', Number(value))}
                        min={1}
                        size="sm"
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>

                    {/* Unit */}
                    <FormControl flex={0.8} minW="80px">
                      <VStack spacing={1} align="stretch">
                        <Select
                          value={item.unit || 'pcs'}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          size="sm"
                        >
                          <option value="pcs">Pieces (pcs)</option>
                          <option value="kg">Kilograms (kg)</option>
                          <option value="g">Grams (g)</option>
                          <option value="liters">Liters (L)</option>
                          <option value="ml">Milliliters (ml)</option>
                          <option value="meters">Meters (m)</option>
                          <option value="cm">Centimeters (cm)</option>
                          <option value="mm">Millimeters (mm)</option>
                          <option value="gallons">Gallons (gal)</option>
                          <option value="pounds">Pounds (lbs)</option>
                          <option value="tons">Tons (t)</option>
                          <option value="boxes">Boxes</option>
                          <option value="pallets">Pallets</option>
                          <option value="units">Units</option>
                          <option value="sets">Sets</option>
                          <option value="pairs">Pairs</option>
                          <option value="dozens">Dozens</option>
                          <option value="hours">Hours (hrs)</option>
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                          <option value="years">Years</option>
                          <option value="custom">Custom...</option>
                        </Select>
                        {(!item.unit || !['pcs', 'kg', 'g', 'liters', 'ml', 'meters', 'cm', 'mm', 'gallons', 'pounds', 'tons', 'boxes', 'pallets', 'units', 'sets', 'pairs', 'dozens', 'hours', 'days', 'months', 'years'].includes(item.unit)) && (
                          <Input
                            placeholder="Custom unit"
                            value={item.unit || ''}
                            onChange={(e) => updateItem(index, 'unit', e.target.value)}
                            size="xs"
                            bg="white"
                          />
                        )}
                      </VStack>
                    </FormControl>
                    
                    {/* Estimated Unit Price */}
                    <FormControl flex={1.2} minW="110px">
                      <NumberInput
                        value={item.estimated_unit_price}
                        onChange={(value) => updateItem(index, 'estimated_unit_price', Number(value))}
                        min={0}
                        precision={2}
                        size="sm"
                      >
                        <NumberInputField />
                      </NumberInput>
                    </FormControl>
                    
                    {/* Priority */}
                    <FormControl flex={1} minW="100px">
                      <Select
                        value={item.priority}
                        onChange={(e) => updateItem(index, 'priority', e.target.value)}
                        size="sm"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </Select>
                    </FormControl>
                    
                    {/* Total Price */}
                    <FormControl flex={1.2} minW="110px">
                      <Input
                        value={`${item.total_estimated_price.toFixed(2)}`}
                        isReadOnly
                        bg="gray.50"
                        fontWeight="semibold"
                        size="sm"
                      />
                    </FormControl>
                    
                    {/* Actions */}
                    <FormControl flex={0.8} minW="80px" textAlign="center">
                      <HStack spacing={1} justify="center">
                        <Tooltip label="Convert to Category Header (1, 2, 3...)">
                          <IconButton
                            aria-label="Convert to Header"
                            icon={<FiFolderPlus />}
                            size="sm"
                            variant="ghost"
                            colorScheme="teal"
                            onClick={() => convertRowType(index, true)}
                          />
                        </Tooltip>
                        <IconButton
                          aria-label="Remove item"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          isDisabled={items.length === 1}
                        />
                      </HStack>
                    </FormControl>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Summary Section matching Quotation Financial Breakdown */}
      <Card bg={useColorModeValue('white', 'gray.800')} shadow="sm" borderWidth="1px" borderColor={borderColor}>
        <CardBody>
          <VStack spacing={3} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="md" fontWeight="bold">Requisition Estimated Commitment</Text>
              <Badge colorScheme="purple" fontSize="sm">
                {items.length} Line Items
              </Badge>
            </HStack>
            <Divider />
            <HStack justify="space-between" fontSize="sm">
              <Text color="gray.600">Subtotal (Excl. VAT):</Text>
              <Text fontWeight="semibold">{formData.currency} {totalEstimatedCost.toFixed(2)}</Text>
            </HStack>
            <HStack justify="space-between" fontSize="sm">
              <Text color="gray.600">Estimated 15% VAT:</Text>
              <Text fontWeight="semibold">{formData.currency} {(totalEstimatedCost * 0.15).toFixed(2)}</Text>
            </HStack>
            <Divider />
            <HStack justify="space-between" fontSize="lg" fontWeight="bold" color="blue.600">
              <Text>Total Estimated Budget:</Text>
              <Text>{formData.currency} {(totalEstimatedCost * 1.15).toFixed(2)}</Text>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Add to Inventory Checkbox */}
      <Card>
        <CardBody>
          <FormControl>
            <HStack>
              <input
                type="checkbox"
                id="add_to_inventory"
                checked={formData.add_to_inventory}
                onChange={(e) => setFormData({ ...formData, add_to_inventory: e.target.checked })}
                style={{ marginRight: '8px' }}
              />
              <FormLabel htmlFor="add_to_inventory" mb={0} cursor="pointer">
                Add custom items to Inventory Management when requisition is saved
              </FormLabel>
            </HStack>
          </FormControl>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <HStack justify="flex-end" spacing={4}>
        <Button onClick={onCancel} isDisabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          colorScheme="blue" 
          onClick={handleSubmit}
          isLoading={isSubmitting}
          loadingText={isEditing ? "Updating..." : "Creating..."}
        >
          {isEditing ? "Update Requisition" : "Create Requisition"}
        </Button>
      </HStack>
    </VStack>
  );
}