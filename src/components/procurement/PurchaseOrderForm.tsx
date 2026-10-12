import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  HStack,
  Text,
  Divider,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  Card,
  CardBody,
  Tooltip,
  useColorModeValue,
  Grid,
  GridItem,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Heading,
} from '@chakra-ui/react';
import { FiPlus, FiFolderPlus, FiHash, FiList, FiTrash2, FiDownload, FiRefreshCw } from 'react-icons/fi';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { SmartDropdown } from '../SmartDropdown';
import FormattedCurrencyDisplay from '../FormattedCurrencyDisplay';

interface PurchaseOrderFormProps {
  organizationId: Id<"organizations"> | string;
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any;
  isEditing?: boolean;
  autoOpenPrPicker?: boolean;
}

interface PurchaseOrderItem {
  id?: string;
  inventory_id?: Id<"inventory">;
  is_section_header?: boolean;
  item_no?: string;
  item_title?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  discount_percentage?: number;
  discount_amount?: number;
  total_price: number;
  notes?: string;
}

export default function PurchaseOrderForm({
  organizationId,
  onSuccess,
  onCancel,
  initialData,
  isEditing = false,
  autoOpenPrPicker = false,
}: PurchaseOrderFormProps) {
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sectionBg = useColorModeValue('blue.50', 'blue.900');
  const tableHeaderBg = useColorModeValue('gray.50', 'gray.800');

  // Modal disclosure for PR Picker
  const {
    isOpen: isPrModalOpen,
    onOpen: onOpenPrModal,
    onClose: onClosePrModal,
  } = useDisclosure();

  // Auto-open PR modal if requested from parent
  useEffect(() => {
    if (autoOpenPrPicker && !isEditing) {
      onOpenPrModal();
    }
  }, [autoOpenPrPicker, isEditing, onOpenPrModal]);

  // Convex mutations and queries
  const createPurchaseOrder = useMutation(api.purchaseOrders.createPurchaseOrder);
  const updatePurchaseOrder = useMutation(api.purchaseOrders.updatePurchaseOrder);
  const createPurchaseOrderItem = useMutation(api.purchaseOrderItems.createPurchaseOrderItem);
  const deletePurchaseOrderItems = useMutation(api.purchaseOrderItems.deletePurchaseOrderItems);
  const convertToPurchaseOrder = useMutation(api.purchaseRequisitions.convertToPurchaseOrder);
  const generatePONumber = useQuery(api.purchaseOrders.generatePONumber, { organization_id: organizationId as any });

  // Data queries
  const suppliers = useQuery(api.suppliers.listSuppliers, { organization_id: organizationId as any });
  const inventory = useQuery(api.inventory.listInventory, { organization_id: organizationId as any });
  const purchaseRequisitions = useQuery(api.purchaseRequisitions.listPurchaseRequisitions, { organization_id: organizationId as any });

  // State for PR selection
  const [selectedPrId, setSelectedPrId] = useState<string>('');
  const prItemsFromDb = useQuery(
    api.purchaseRequisitionItems.listPurchaseRequisitionItems,
    selectedPrId ? { purchase_requisition_id: selectedPrId as any } : 'skip'
  );

  // Existing items when editing
  const existingPoItems = useQuery(
    api.purchaseOrderItems.listPurchaseOrderItems,
    initialData?._id ? { purchase_order_id: initialData._id as any } : 'skip'
  );

  // Form state
  const [formData, setFormData] = useState({
    po_number: '',
    supplier_id: '' as Id<"suppliers">,
    issue_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    currency: 'SAR',
    project_name: '',
    supplier_quotation_ref: '',
    subtotal: 0,
    discount_amount: 0,
    tax_rate: 15,
    tax_amount: 0,
    total_amount: 0,
    status: 'draft' as any,
    payment_terms: '',
    delivery_address: '',
    terms_conditions: '',
    notes: '',
    source_pr_id: undefined as Id<"purchase_requisitions"> | undefined,
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([
    {
      id: `item-${Date.now()}`,
      is_section_header: false,
      item_no: '1.1',
      item_name: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      total_price: 0,
    }
  ]);

  // Initialize form with PO number
  useEffect(() => {
    if (generatePONumber && !isEditing && !formData.po_number) {
      setFormData(prev => ({ ...prev, po_number: generatePONumber }));
    }
  }, [generatePONumber, isEditing, formData.po_number]);

  // Initialize with existing data if editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        po_number: initialData.po_number || '',
        supplier_id: initialData.supplier_id || '',
        issue_date: initialData.issue_date || new Date().toISOString().split('T')[0],
        expected_delivery_date: initialData.expected_delivery_date || '',
        currency: initialData.currency || 'SAR',
        project_name: initialData.project_name || '',
        supplier_quotation_ref: initialData.supplier_quotation_ref || '',
        subtotal: initialData.subtotal || 0,
        discount_amount: initialData.discount_amount || 0,
        tax_rate: initialData.tax_rate ?? 15,
        tax_amount: initialData.tax_amount || 0,
        total_amount: initialData.total_amount || 0,
        status: initialData.status || 'draft',
        payment_terms: initialData.payment_terms || '',
        delivery_address: initialData.delivery_address || '',
        terms_conditions: initialData.terms_conditions || '',
        notes: initialData.notes || '',
        source_pr_id: initialData.source_pr_id,
      });
    }
  }, [initialData, isEditing]);

  // Load existing items when editing
  useEffect(() => {
    if (initialData && isEditing && existingPoItems && existingPoItems.length > 0) {
      setItems(existingPoItems.map(item => ({
        id: item._id,
        inventory_id: item.inventory_id,
        is_section_header: (item as any).is_section_header || false,
        item_no: (item as any).item_no || '1.1',
        item_title: (item as any).item_title || '',
        item_name: item.item_name || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        unit: (item as any).unit || 'pcs',
        unit_price: item.unit_price || 0,
        discount_percentage: item.discount_percentage,
        discount_amount: item.discount_amount,
        total_price: item.total_price || 0,
        notes: item.notes || '',
      })));
    }
  }, [initialData, isEditing, existingPoItems]);

  // Calculate totals when items change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => item.is_section_header ? sum : sum + (item.total_price || 0), 0);
    const taxAmount = Math.max(0, (subtotal - formData.discount_amount) * (formData.tax_rate / 100));
    const totalAmount = Math.max(0, subtotal - formData.discount_amount + taxAmount);

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    }));
  }, [items, formData.discount_amount, formData.tax_rate]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSupplierChange = (supplierId: string) => {
    const selectedSupplier = suppliers?.find((supplier) => supplier._id === supplierId);
    setFormData((previous) => ({
      ...previous,
      supplier_id: supplierId as Id<"suppliers">,
      ...(selectedSupplier?.supplier_type === 'recruitment_agency' && selectedSupplier.recruitment_fee_currency
        ? { currency: selectedSupplier.recruitment_fee_currency }
        : {}),
    }));

    const recruitmentFeeItemName = 'Recruitment service - candidate placement';
    const hasFixedPlacementRate =
      selectedSupplier?.supplier_type === 'recruitment_agency' &&
      selectedSupplier.recruitment_fee_model === 'per_placement' &&
      typeof selectedSupplier.recruitment_fee_amount === 'number' &&
      selectedSupplier.recruitment_fee_amount > 0;

    setItems((currentItems) => {
      const withoutGeneratedFee = currentItems.filter((item) => item.item_name !== recruitmentFeeItemName);

      if (!hasFixedPlacementRate || !selectedSupplier) {
        if (withoutGeneratedFee.length === 0) {
          return [{
            id: `item-${Date.now()}`,
            is_section_header: false,
            item_no: '1.1',
            item_name: '',
            description: '',
            quantity: 1,
            unit: 'pcs',
            unit_price: 0,
            total_price: 0,
          }];
        }
        return withoutGeneratedFee;
      }

      const baseItems = withoutGeneratedFee.length === 1 && !withoutGeneratedFee[0].item_name.trim()
        ? []
        : withoutGeneratedFee;
      const quantity = 1;
      const unitPrice = selectedSupplier.recruitment_fee_amount;

      return [
        ...baseItems,
        {
          id: `recruitment-fee-${Date.now()}`,
          is_section_header: false,
          item_no: `${baseItems.length + 1}.1`,
          item_name: recruitmentFeeItemName,
          description: `Default agency rate: ${unitPrice} ${selectedSupplier.recruitment_fee_currency} per successful candidate placement. Edit the candidate quantity and unit price as needed.`,
          quantity,
          unit: 'candidates',
          unit_price: unitPrice,
          total_price: quantity * unitPrice,
        },
      ];
    });

    if (
      selectedSupplier?.supplier_type === 'recruitment_agency' &&
      selectedSupplier.recruitment_fee_model === 'salary_percentage'
    ) {
      toast({
        title: 'Recruitment percentage rate',
        description: 'The agency rate is a percentage. Enter the agreed per-candidate amount in the editable purchase order unit price.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Helper function to get inventory item Arabic name
  const getInventoryItemArabicName = (itemName: string) => {
    const item = inventory?.find(i => i.name.toLowerCase() === (itemName || '').toLowerCase());
    return item?.name_arabic;
  };

  // Resequence WBS
  const resequenceWBS = () => {
    let majorIndex = 0;
    let subIndex = 0;
    const hasSections = items.some(i => i.is_section_header);

    const renumbered = items.map((item, overallIndex) => {
      if (item.is_section_header) {
        majorIndex += 1;
        subIndex = 0;
        return {
          ...item,
          item_no: majorIndex.toString(),
        };
      } else {
        if (hasSections) {
          subIndex += 1;
          const defaultMajor = majorIndex > 0 ? majorIndex : 1;
          return {
            ...item,
            item_no: `${defaultMajor}.${subIndex}`,
          };
        } else {
          return {
            ...item,
            item_no: `1.${overallIndex + 1}`,
          };
        }
      }
    });

    setItems(renumbered);
    toast({
      title: "WBS Re-numbered",
      description: "Line items re-sequenced cleanly.",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Add line item (1.1, 1.2...)
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
    }

    const newItem: PurchaseOrderItem = {
      id: `item-${Date.now()}`,
      is_section_header: false,
      item_no: nextWBS,
      item_name: '',
      description: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      discount_percentage: 0,
      discount_amount: 0,
      total_price: 0,
    };
    setItems(prev => [...prev, newItem]);
  };

  // Add category title header (1, 2, 3...)
  const addCategoryTitle = () => {
    const sectionCount = items.filter(i => i.is_section_header).length;
    const nextMajor = (sectionCount + 1).toString();

    const newSection: PurchaseOrderItem = {
      id: `section-${Date.now()}`,
      is_section_header: true,
      item_no: nextMajor,
      item_title: '',
      item_name: '',
      description: '',
      quantity: 0,
      unit: '',
      unit_price: 0,
      discount_percentage: 0,
      discount_amount: 0,
      total_price: 0,
    };
    setItems(prev => [...prev, newSection]);
  };

  // Convert row type between Category Header and Line Item
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
        unit_price: 0,
        total_price: 0,
      };
    } else {
      updated[index] = {
        ...target,
        is_section_header: false,
        item_name: target.item_title || target.item_name || '',
        quantity: target.quantity > 0 ? target.quantity : 1,
        unit: target.unit || 'pcs',
        unit_price: target.unit_price || 0,
        total_price: (target.quantity > 0 ? target.quantity : 1) * (target.unit_price || 0),
      };
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    } else {
      toast({
        title: 'Validation Error',
        description: 'At least one line item is required',
        status: 'warning',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  // Update item field
  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    // Auto-calculate total price
    if (field === 'quantity' || field === 'unit_price' || field === 'discount_amount' || field === 'discount_percentage') {
      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const price = field === 'unit_price' ? Number(value) : item.unit_price;
      const discount = field === 'discount_amount' ? Number(value) : (item.discount_amount || 0);
      item.total_price = Math.max(0, (qty * price) - discount);
    }

    updated[index] = item;
    setItems(updated);
  };

  // Quick inventory match
  const handleInventorySelect = (index: number, inventoryId: string) => {
    if (!inventoryId) return;
    const selected = inventory?.find(inv => inv._id === inventoryId);
    if (!selected) return;

    const updated = [...items];
    const current = updated[index];
    const unitPrice = selected.cost_price || current.unit_price || 0;
    const qty = current.quantity || 1;

    updated[index] = {
      ...current,
      inventory_id: selected._id,
      item_name: selected.name,
      description: selected.description || current.description || '',
      unit: selected.unit || current.unit || 'pcs',
      unit_price: unitPrice,
      total_price: qty * unitPrice,
    };
    setItems(updated);
  };

  // SmartDropdown item change handler
  const handleItemChange = (itemName: string, index: number) => {
    updateItem(index, 'item_name', itemName);

    // Auto-populate when matching inventory item exists
    const matched = inventory?.find(inv => inv.name.toLowerCase() === (itemName || '').toLowerCase());
    if (matched) {
      updateItem(index, 'inventory_id', matched._id);
      updateItem(index, 'unit', matched.unit || 'pcs');
      if (matched.description) updateItem(index, 'description', matched.description);
      if (matched.cost_price) {
        updateItem(index, 'unit_price', matched.cost_price);
        const qty = items[index]?.quantity || 1;
        updateItem(index, 'total_price', qty * matched.cost_price);
      }
    }
  };

  const handleInventoryItemSelection = async (itemName: string) => {
    return null;
  };

  // Handle PR Import
  const handleSelectPr = (prId: string) => {
    setSelectedPrId(prId);
    if (!prId) return;
    const pr = purchaseRequisitions?.find(p => p._id === prId);
    if (pr) {
      setFormData(prev => ({
        ...prev,
        currency: pr.currency || prev.currency,
        notes: prev.notes ? `${prev.notes}\nRef PR: ${pr.pr_number}` : `Requisition: ${pr.pr_number}${pr.department ? ` (${pr.department})` : ''} - Justification: ${pr.justification || ''}`,
        source_pr_id: pr._id as any,
      }));
    }
  };

  // Apply items when prItemsFromDb loads
  useEffect(() => {
    if (selectedPrId && prItemsFromDb && prItemsFromDb.length > 0) {
      const imported: PurchaseOrderItem[] = prItemsFromDb.map((item, idx) => ({
        id: `pr-${item._id}-${idx}`,
        is_section_header: item.is_section_header || false,
        item_no: item.item_no || (item.is_section_header ? `${idx + 1}` : `1.${idx + 1}`),
        item_title: item.item_title || (item.is_section_header ? item.item_name : ''),
        item_name: item.is_section_header ? (item.item_title || item.item_name || '') : item.item_name,
        inventory_id: item.inventory_id,
        description: item.description || '',
        quantity: item.is_section_header ? 0 : (item.quantity || 1),
        unit: item.unit || 'pcs',
        unit_price: item.is_section_header ? 0 : (item.estimated_unit_price || 0),
        discount_percentage: 0,
        discount_amount: 0,
        total_price: item.is_section_header ? 0 : ((item.quantity || 1) * (item.estimated_unit_price || 0)),
        notes: item.specifications || '',
      }));
      setItems(imported);
      toast({
        title: 'PR Items Imported',
        description: `Successfully loaded ${imported.length} items from requisition.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [selectedPrId, prItemsFromDb]);

  // Handle Form Submit
  const handleSubmit = async () => {
    if (!formData.supplier_id) {
      toast({
        title: 'Validation Error',
        description: 'Please select a supplier',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const nonHeaderItems = items.filter(i => !i.is_section_header && i.item_name.trim());
    if (nonHeaderItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one line item with an item name',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      let purchaseOrderId: Id<"purchase_orders">;

      if (isEditing && initialData?._id) {
        await updatePurchaseOrder({
          id: initialData._id,
          ...formData,
        });
        purchaseOrderId = initialData._id;

        // Cleanly delete previous items and recreate updated set
        await deletePurchaseOrderItems({ purchase_order_id: initialData._id });
      } else {
        purchaseOrderId = await createPurchaseOrder({
          ...formData,
          supplier_id: formData.supplier_id as Id<"suppliers">,
          organization_id: organizationId as any,
        });
      }

      // Create line items
      for (const item of items) {
        const itemQty = item.is_section_header ? 0 : (item.quantity || 0);
        const itemPrice = item.is_section_header ? 0 : (item.unit_price || 0);
        await createPurchaseOrderItem({
          purchase_order_id: purchaseOrderId,
          inventory_id: item.inventory_id,
          item_name: item.is_section_header ? (item.item_title || item.item_name || 'Section Header') : item.item_name,
          description: item.description,
          quantity: itemQty,
          unit: item.unit,
          unit_price: itemPrice,
          discount_percentage: item.discount_percentage,
          discount_amount: item.discount_amount,
          total_price: item.is_section_header ? 0 : (item.total_price || 0),
          notes: item.notes,
          is_section_header: item.is_section_header,
          item_no: item.item_no,
          item_title: item.item_title,
        });
      }

      // Mark PR as converted if linked
      if (formData.source_pr_id && !isEditing) {
        try {
          await convertToPurchaseOrder({
            id: formData.source_pr_id,
            converted_to_po: purchaseOrderId,
          });
        } catch (e) {
          console.warn('Could not update source PR status:', e);
        }
      }

      toast({
        title: 'Success',
        description: `Purchase Order ${isEditing ? 'updated' : 'created'} successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save purchase order',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const eligiblePRs = purchaseRequisitions?.filter(pr => pr.status === 'approved' || pr.status === 'draft' || pr.status === 'submitted') || [];

  return (
    <Box p={6} bg="white" borderRadius="lg" shadow="sm">
      <VStack spacing={6} align="stretch">
        
        {/* Always-Visible PR Import Banner (Works for 0 PRs and populated PRs) */}
        {!isEditing && (
          <Card variant="outline" bg={sectionBg} borderColor="blue.200">
            <CardBody py={3} px={4}>
              <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={3}>
                <Box>
                  <HStack>
                    <Badge colorScheme="blue" fontSize="xs">Workflow Shortcut</Badge>
                    <Text fontWeight="semibold" fontSize="sm" color="blue.800">
                      Import from Purchase Requisition (PR)
                    </Text>
                    {eligiblePRs.length > 0 && (
                      <Badge colorScheme="green" fontSize="xs">
                        {eligiblePRs.length} Available
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="xs" color="gray.600" mt={0.5}>
                    Select an approved requisition to auto-fill line items, scope of work, and project notes.
                  </Text>
                </Box>
                <HStack spacing={2} w={{ base: 'full', md: 'auto' }}>
                  <Button
                    size="sm"
                    leftIcon={<FiDownload />}
                    colorScheme="teal"
                    onClick={onOpenPrModal}
                  >
                    Select Requisition {eligiblePRs.length > 0 ? `(${eligiblePRs.length})` : ''}
                  </Button>
                  {eligiblePRs.length > 0 && (
                    <Select
                      size="sm"
                      bg="white"
                      placeholder="-- Or quick choose --"
                      value={selectedPrId}
                      onChange={(e) => handleSelectPr(e.target.value)}
                      maxW="260px"
                    >
                      {eligiblePRs.map((pr) => (
                        <option key={pr._id} value={pr._id}>
                          {pr.pr_number} - {pr.department} ({pr.status})
                        </option>
                      ))}
                    </Select>
                  )}
                </HStack>
              </Flex>
            </CardBody>
          </Card>
        )}

        {/* Basic Information */}
        <Box>
          <Text fontSize="lg" fontWeight="semibold" mb={4} color="gray.800">
            Order Information
          </Text>
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">PO Number</FormLabel>
              <Input
                size="sm"
                value={formData.po_number}
                onChange={(e) => handleInputChange('po_number', e.target.value)}
                placeholder="PO-2026-00001"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">Supplier</FormLabel>
              <Select
                size="sm"
                value={formData.supplier_id}
                onChange={(e) => handleSupplierChange(e.target.value)}
                placeholder="Select supplier"
              >
                {suppliers?.map((supplier) => (
                  <option key={supplier._id} value={supplier._id}>
                    {supplier.name} {supplier.name_arabic ? `(${supplier.name_arabic})` : ''}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Currency</FormLabel>
              <Select
                size="sm"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
              >
                <option value="SAR">{'\uE900'} Saudi Riyal</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="NPR">NPR - Nepalese Rupee</option>
                <option value="LKR">LKR - Sri Lankan Rupee</option>
                <option value="PHP">PHP - Philippine Peso</option>
                <option value="GBP">GBP - British Pound</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">Issue Date</FormLabel>
              <Input
                size="sm"
                type="date"
                value={formData.issue_date}
                onChange={(e) => handleInputChange('issue_date', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Expected Delivery Date</FormLabel>
              <Input
                size="sm"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => handleInputChange('expected_delivery_date', e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Project Name</FormLabel>
              <Input
                size="sm"
                value={formData.project_name}
                onChange={(e) => handleInputChange('project_name', e.target.value)}
                placeholder="e.g. Shoaiba Power Plant"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Supplier Quotation Ref</FormLabel>
              <Input
                size="sm"
                value={formData.supplier_quotation_ref}
                onChange={(e) => handleInputChange('supplier_quotation_ref', e.target.value)}
                placeholder="e.g. QT-2026-992"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Payment Terms</FormLabel>
              <Input
                size="sm"
                value={formData.payment_terms}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                placeholder="e.g., 100% Advance / Net 30 Days"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Delivery Site / Address</FormLabel>
              <Input
                size="sm"
                value={formData.delivery_address}
                onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                placeholder="Job site or warehouse address"
              />
            </FormControl>
          </Grid>
        </Box>

        <Divider />

        {/* Standardized Items Section with WBS (Identical to Quotations & Requisitions) */}
        <Box w="full">
          <HStack justify="space-between" align="center" mb={4} wrap="wrap" gap={2}>
            <Box>
              <Heading size="md">Items ({items.filter(i => !i.is_section_header).length} line items)</Heading>
              <Text fontSize="xs" color="gray.500">
                WBS hierarchical structure identical to Purchase Requisitions & Quotations.
              </Text>
            </Box>
            <HStack spacing={2}>
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

          {items.length === 0 ? (
            <VStack spacing={4} align="center" py={8}>
              <Text color="gray.500">No items added</Text>
              <Text fontSize="sm" color="gray.400">
                Click "+ Add Category Title" or "+ Add Line Item" to start structuring your purchase order.
              </Text>
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
                  <Text flex={1.2} minW="110px">Editable Unit Price ({formData.currency})</Text>
                  <Text flex={1.2} minW="110px">Total Price ({formData.currency})</Text>
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
                              updateItem(index, 'inventory_id', (newItem as any)._id);
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
                          min={0.01}
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
                            <option value="candidates">Candidates</option>
                            <option value="sets">Sets</option>
                            <option value="pairs">Pairs</option>
                            <option value="dozens">Dozens</option>
                            <option value="hours">Hours (hrs)</option>
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                            <option value="years">Years</option>
                            <option value="custom">Custom...</option>
                          </Select>
                          {(!item.unit || !['pcs', 'kg', 'g', 'liters', 'ml', 'meters', 'cm', 'mm', 'gallons', 'pounds', 'tons', 'boxes', 'pallets', 'units', 'candidates', 'sets', 'pairs', 'dozens', 'hours', 'days', 'months', 'years'].includes(item.unit)) && (
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
                      
                      {/* Unit Price */}
                      <FormControl flex={1.2} minW="110px">
                        <NumberInput
                          value={item.unit_price}
                          onChange={(value) => updateItem(index, 'unit_price', Number(value))}
                          min={0}
                          precision={2}
                          size="sm"
                        >
                          <NumberInputField />
                        </NumberInput>
                      </FormControl>
                      
                      {/* Total Price */}
                      <FormControl flex={1.2} minW="110px">
                        <Input
                          value={`${(item.total_price || 0).toFixed(2)}`}
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
                            variant="ghost"
                            colorScheme="red"
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

        {/* Totals & Financials */}
        <Grid templateColumns={{ base: '1fr', md: '1fr 340px' }} gap={6} pt={2}>
          {/* Terms & Notes */}
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm">Terms & Conditions</FormLabel>
              <Textarea
                size="sm"
                value={formData.terms_conditions}
                onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                placeholder="Payment terms, delivery deadlines, warranty, liquidated damages..."
                rows={3}
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Internal Notes / Instructions</FormLabel>
              <Textarea
                size="sm"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Internal notes, PR references, inspection requirements..."
                rows={2}
              />
            </FormControl>
          </VStack>

          {/* Pricing Summary Card */}
          <Card variant="outline" bg={tableHeaderBg}>
            <CardBody p={4}>
              <Text fontWeight="semibold" fontSize="md" mb={3} color="gray.800">
                Financial Summary
              </Text>
              <VStack spacing={2} align="stretch" fontSize="sm">
                <HStack justify="space-between">
                  <Text color="gray.600">Subtotal:</Text>
                  <Text fontWeight="medium">{formData.subtotal.toFixed(2)} {formData.currency}</Text>
                </HStack>

                <HStack justify="space-between">
                  <Text color="gray.600">Discount Amount:</Text>
                  <NumberInput
                    size="xs"
                    w="110px"
                    min={0}
                    max={formData.subtotal}
                    value={formData.discount_amount}
                    onChange={(_, val) => handleInputChange('discount_amount', isNaN(val) ? 0 : val)}
                  >
                    <NumberInputField textAlign="right" />
                  </NumberInput>
                </HStack>

                <HStack justify="space-between">
                  <Text color="gray.600">VAT Rate (%):</Text>
                  <NumberInput
                    size="xs"
                    w="110px"
                    min={0}
                    max={100}
                    value={formData.tax_rate}
                    onChange={(_, val) => handleInputChange('tax_rate', isNaN(val) ? 0 : val)}
                  >
                    <NumberInputField textAlign="right" />
                  </NumberInput>
                </HStack>

                <HStack justify="space-between">
                  <Text color="gray.600">VAT Amount ({formData.tax_rate}%):</Text>
                  <Text fontWeight="medium">{formData.tax_amount.toFixed(2)} {formData.currency}</Text>
                </HStack>

                <Divider my={1} />

                <HStack justify="space-between" fontSize="md" fontWeight="bold">
                  <Text color="gray.800">Grand Total:</Text>
                  <Text color="blue.600">{formData.total_amount.toFixed(2)} {formData.currency}</Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <HStack justify="flex-end" spacing={4} pt={4} borderTopWidth="1px" borderColor={borderColor}>
          <Button onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button colorScheme="blue" size="sm" onClick={handleSubmit}>
            {isEditing ? 'Update Purchase Order' : 'Create Purchase Order'}
          </Button>
        </HStack>

      </VStack>

      {/* Modal for Selecting PR to Import */}
      <Modal isOpen={isPrModalOpen} onClose={onClosePrModal} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <FiDownload />
              <Text>Import from Purchase Requisition</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Choose an approved or pending requisition to auto-fill items and project details into this Purchase Order.
              </Text>

              {purchaseRequisitions === undefined ? (
                <Box py={6} textAlign="center">
                  <Text color="gray.500">Loading purchase requisitions...</Text>
                </Box>
              ) : eligiblePRs.length === 0 ? (
                <Box p={6} textAlign="center" bg="gray.50" borderRadius="md" border="1px dashed" borderColor="gray.300">
                  <Text fontWeight="semibold" color="gray.700" mb={1}>
                    No Requisitions Available
                  </Text>
                  <Text fontSize="xs" color="gray.500" mb={4}>
                    There are currently no requisitions in your organization eligible for import.
                  </Text>
                  <Button size="sm" colorScheme="blue" variant="outline" onClick={onClosePrModal}>
                    Continue Creating PO Manually
                  </Button>
                </Box>
              ) : (
                <VStack spacing={2} align="stretch" maxH="380px" overflowY="auto">
                  {eligiblePRs.map((pr) => (
                    <Box
                      key={pr._id}
                      p={3}
                      borderWidth="1px"
                      borderColor={selectedPrId === pr._id ? "blue.400" : "gray.200"}
                      bg={selectedPrId === pr._id ? "blue.50" : "white"}
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: selectedPrId === pr._id ? "blue.50" : "gray.50" }}
                      onClick={() => {
                        handleSelectPr(pr._id);
                        onClosePrModal();
                      }}
                    >
                      <Flex justify="space-between" align="center">
                        <Box>
                          <HStack spacing={2}>
                            <Text fontWeight="bold" fontSize="sm" color="blue.700">
                              {pr.pr_number}
                            </Text>
                            <Badge
                              colorScheme={
                                pr.status === 'approved' ? 'green' :
                                pr.status === 'submitted' ? 'orange' : 'gray'
                              }
                              fontSize="2xs"
                            >
                              {pr.status}
                            </Badge>
                            {pr.priority && (
                              <Badge colorScheme={pr.priority === 'urgent' ? 'red' : 'purple'} fontSize="2xs">
                                {pr.priority}
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="gray.600" mt={1}>
                            Department: <b>{pr.department || 'N/A'}</b> {pr.requisition_date ? `• Date: ${pr.requisition_date}` : ''}
                          </Text>
                          {pr.justification && (
                            <Text fontSize="2xs" color="gray.500" noOfLines={1} mt={0.5}>
                              Justification: {pr.justification}
                            </Text>
                          )}
                        </Box>
                        <VStack align="flex-end" spacing={1}>
                          <Text fontWeight="bold" fontSize="sm" color="gray.800">
                            <FormattedCurrencyDisplay amount={pr.total_estimated_cost || 0} currency={pr.currency || 'SAR'} />
                          </Text>
                          <Button size="xs" colorScheme="blue" variant="solid">
                            Select & Import
                          </Button>
                        </VStack>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
