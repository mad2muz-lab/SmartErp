import React, { useState, useEffect } from 'react';
import {
  Box, VStack, HStack, FormControl, FormLabel, Input, Textarea, Button, 
  Select, NumberInput, NumberInputField, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper,
  Text, Divider, IconButton, useToast, Badge, Grid, GridItem, Card, CardBody,
  Table, Thead, Tbody, Tr, Th, Td, useDisclosure, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalBody, ModalCloseButton, FormErrorMessage, Alert, AlertIcon
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';

interface MaterialReceiptFormProps {
  organizationId: Id<"organizations"> | string | any;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  isEditing?: boolean;
}

interface ReceiptItem {
  id: string;
  purchase_order_item_id: Id<"purchase_order_items">;
  item_name: string;
  quantity_ordered: number;
  quantity_received: number;
  quantity_accepted: number;
  quantity_rejected: number;
  rejection_reason: string;
  notes: string;
}

export default function MaterialReceiptForm({ 
  organizationId, 
  onSuccess, 
  onCancel, 
  initialData, 
  isEditing = false 
}: MaterialReceiptFormProps) {
  const toast = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    receipt_number: '',
    purchase_order_id: '',
    supplier_id: '',
    receipt_date: new Date().toISOString().split('T')[0],
    delivery_note_number: '',
    status: 'received',
    notes: '',
  });
  
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [selectedPO, setSelectedPO] = useState<any>(null);

  // Convex queries and mutations
  const createMaterialReceipt = useMutation(api.materialReceipts.createMaterialReceipt);
  const updateMaterialReceipt = useMutation(api.materialReceipts.updateMaterialReceipt);
  const createMaterialReceiptItem = useMutation(api.materialReceiptItems.createMaterialReceiptItem);
  const updateMaterialReceiptItem = useMutation(api.materialReceiptItems.updateMaterialReceiptItem);
  const deleteMaterialReceiptItems = useMutation(api.materialReceiptItems.deleteMaterialReceiptItems);
  const generateMRNumber = useQuery(api.materialReceipts.generateMRNumber, { 
    organization_id: organizationId?._id || organizationId as any 
  });
  
  // Data queries
  const purchaseOrders = useQuery(api.purchaseOrders.listPurchaseOrders, { 
    organization_id: organizationId?._id || organizationId as any 
  });
  const suppliers = useQuery(api.suppliers.listSuppliers, { 
    organization_id: organizationId?._id || organizationId as any 
  });

  // Load initial data for editing
  useEffect(() => {
    if (initialData && isEditing) {
      setFormData({
        receipt_number: initialData.receipt_number || '',
        purchase_order_id: initialData.purchase_order_id || '',
        supplier_id: initialData.supplier_id || '',
        receipt_date: initialData.receipt_date || new Date().toISOString().split('T')[0],
        delivery_note_number: initialData.delivery_note_number || '',
        status: initialData.status || 'received',
        notes: initialData.notes || '',
      });
      // Load items will be handled separately
    }
  }, [initialData, isEditing]);

  // Set MR number when generated
  useEffect(() => {
    if (generateMRNumber && !isEditing) {
      setFormData(prev => ({ ...prev, receipt_number: generateMRNumber }));
    }
  }, [generateMRNumber, isEditing]);

  // Load PO items when PO is selected
  useEffect(() => {
    if (formData.purchase_order_id && !isEditing) {
      const selectedPurchaseOrder = purchaseOrders?.find(po => po._id === formData.purchase_order_id);
      if (selectedPurchaseOrder) {
        setSelectedPO(selectedPurchaseOrder);
        setFormData(prev => ({ ...prev, supplier_id: selectedPurchaseOrder.supplier_id }));
      }
    }
  }, [formData.purchase_order_id, purchaseOrders, isEditing]);

  const handlePOChange = (poId: string) => {
    setFormData(prev => ({ ...prev, purchase_order_id: poId }));
    setItems([]); // Clear items when PO changes
  };

  const loadPOItems = async () => {
    if (!formData.purchase_order_id) return;

    try {
      const poItems = await api.purchaseOrderItems.listPurchaseOrderItems.query({
        purchase_order_id: formData.purchase_order_id as any
      });

      const receiptItems: ReceiptItem[] = poItems.map(item => ({
        id: `temp_${Date.now()}_${item._id}`,
        purchase_order_item_id: item._id,
        item_name: item.item_name,
        quantity_ordered: item.quantity,
        quantity_received: item.quantity, // Default to ordered quantity
        quantity_accepted: item.quantity, // Default to ordered quantity
        quantity_rejected: 0,
        rejection_reason: '',
        notes: '',
      }));

      setItems(receiptItems);
    } catch (error) {
      console.error('Error loading PO items:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase order items.',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Auto-calculate accepted quantity
        if (field === 'quantity_received' || field === 'quantity_rejected') {
          const received = field === 'quantity_received' ? value : item.quantity_received;
          const rejected = field === 'quantity_rejected' ? value : item.quantity_rejected;
          updatedItem.quantity_accepted = Math.max(0, received - rejected);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (!formData.receipt_number || !formData.purchase_order_id || items.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and ensure items are loaded.',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialData) {
        // Update existing receipt
        await updateMaterialReceipt({
          id: initialData._id as any,
          receipt_date: formData.receipt_date,
          delivery_note_number: formData.delivery_note_number,
          status: formData.status,
          notes: formData.notes,
        });

        // Update items
        for (const item of items) {
          if (item.id.startsWith('temp_')) {
            // New item
            await createMaterialReceiptItem({
              material_receipt_id: initialData._id as any,
              purchase_order_item_id: item.purchase_order_item_id,
              quantity_ordered: item.quantity_ordered,
              quantity_received: item.quantity_received,
              quantity_accepted: item.quantity_accepted,
              quantity_rejected: item.quantity_rejected,
              rejection_reason: item.rejection_reason,
              notes: item.notes,
            });
          } else {
            // Existing item
            await updateMaterialReceiptItem({
              id: item.id as any,
              quantity_received: item.quantity_received,
              quantity_accepted: item.quantity_accepted,
              quantity_rejected: item.quantity_rejected,
              rejection_reason: item.rejection_reason,
              notes: item.notes,
            });
          }
        }
      } else {
        // Create new receipt
        const receiptId = await createMaterialReceipt({
          receipt_number: formData.receipt_number,
          purchase_order_id: formData.purchase_order_id as any,
          supplier_id: formData.supplier_id as any,
          organization_id: organizationId?._id || organizationId as any,
          receipt_date: formData.receipt_date,
          received_by: user?.id as any,
          delivery_note_number: formData.delivery_note_number,
          status: formData.status,
          notes: formData.notes,
        });

        // Create items
        for (const item of items) {
          await createMaterialReceiptItem({
            material_receipt_id: receiptId,
            purchase_order_item_id: item.purchase_order_item_id,
            quantity_ordered: item.quantity_ordered,
            quantity_received: item.quantity_received,
            quantity_accepted: item.quantity_accepted,
            quantity_rejected: item.quantity_rejected,
            rejection_reason: item.rejection_reason,
            notes: item.notes,
          });
        }
      }

      toast({
        title: 'Success',
        description: `Material Receipt ${isEditing ? 'updated' : 'created'} successfully!`,
        status: 'success',
        duration: 3000,
      });
      onSuccess();
    } catch (error) {
      console.error('Error saving material receipt:', error);
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} material receipt: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received': return 'blue';
      case 'inspected': return 'yellow';
      case 'accepted': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Header Information */}
        <Card>
          <CardBody>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>MR Number</FormLabel>
                  <Input
                    value={formData.receipt_number}
                    onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                    placeholder="Auto-generated"
                    isReadOnly={!isEditing}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Purchase Order</FormLabel>
                  <Select
                    value={formData.purchase_order_id}
                    onChange={(e) => handlePOChange(e.target.value)}
                    isDisabled={isEditing}
                    placeholder="Select Purchase Order"
                  >
                    {purchaseOrders?.map((po) => (
                      <option key={po._id} value={po._id}>
                        {po.po_number} - {po.status}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Supplier</FormLabel>
                  <Input
                    value={suppliers?.find(s => s._id === formData.supplier_id)?.name || ''}
                    isReadOnly
                    bg="gray.50"
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Receipt Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.receipt_date}
                    onChange={(e) => setFormData({ ...formData, receipt_date: e.target.value })}
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl>
                  <FormLabel>Delivery Note Number</FormLabel>
                  <Input
                    value={formData.delivery_note_number}
                    onChange={(e) => setFormData({ ...formData, delivery_note_number: e.target.value })}
                    placeholder="Supplier's delivery note number"
                  />
                </FormControl>
              </GridItem>
              <GridItem>
                <FormControl isRequired>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="received">Received</option>
                    <option value="inspected">Inspected</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </Select>
                </FormControl>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* PO Information Alert */}
        {selectedPO && (
          <Alert status="info">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="semibold">Purchase Order: {selectedPO.po_number}</Text>
              <Text fontSize="sm">Expected Delivery: {selectedPO.expected_delivery_date}</Text>
              <Text fontSize="sm">Total Amount: {selectedPO.currency} {selectedPO.total_amount.toFixed(2)}</Text>
            </VStack>
          </Alert>
        )}

        {/* Load PO Items Button */}
        {formData.purchase_order_id && !isEditing && items.length === 0 && (
          <Card>
            <CardBody>
              <VStack spacing={4}>
                <Text>Click the button below to load items from the selected Purchase Order:</Text>
                <Button colorScheme="blue" onClick={loadPOItems}>
                  Load Purchase Order Items
                </Button>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Items Section */}
        {items.length > 0 && (
          <Card>
            <CardBody>
              <Text fontSize="lg" fontWeight="bold" mb={4}>Received Items</Text>
              
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Item Name</Th>
                      <Th>Ordered</Th>
                      <Th>Received</Th>
                      <Th>Accepted</Th>
                      <Th>Rejected</Th>
                      <Th>Rejection Reason</Th>
                      <Th>Notes</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {items.map((item) => (
                      <Tr key={item.id}>
                        <Td>
                          <Text fontWeight="semibold">{item.item_name}</Text>
                        </Td>
                        <Td>
                          <Text>{item.quantity_ordered}</Text>
                        </Td>
                        <Td>
                          <NumberInput
                            value={item.quantity_received}
                            onChange={(_, value) => updateItem(item.id, 'quantity_received', value)}
                            min={0}
                            max={item.quantity_ordered}
                            size="sm"
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <NumberInput
                            value={item.quantity_accepted}
                            onChange={(_, value) => updateItem(item.id, 'quantity_accepted', value)}
                            min={0}
                            max={item.quantity_received}
                            size="sm"
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <NumberInput
                            value={item.quantity_rejected}
                            onChange={(_, value) => updateItem(item.id, 'quantity_rejected', value)}
                            min={0}
                            max={item.quantity_received}
                            size="sm"
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <Input
                            value={item.rejection_reason}
                            onChange={(e) => updateItem(item.id, 'rejection_reason', e.target.value)}
                            placeholder="Reason for rejection"
                            size="sm"
                          />
                        </Td>
                        <Td>
                          <Input
                            value={item.notes}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                            placeholder="Additional notes"
                            size="sm"
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            </CardBody>
          </Card>
        )}

        {/* Summary Section */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <HStack justify="space-between" w="full">
                <Text fontSize="lg" fontWeight="bold">Summary</Text>
                <Badge colorScheme={getStatusColor(formData.status)} fontSize="md">
                  Status: {formData.status.toUpperCase()}
                </Badge>
              </HStack>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the receipt..."
                  rows={3}
                />
              </FormControl>
            </VStack>
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
            loadingText={isEditing ? 'Updating...' : 'Creating...'}
            isDisabled={items.length === 0}
          >
            {isEditing ? 'Update Material Receipt' : 'Create Material Receipt'}
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
