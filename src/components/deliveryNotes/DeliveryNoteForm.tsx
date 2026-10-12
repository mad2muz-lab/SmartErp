import React, { useRef } from 'react';
import {
  VStack,
  HStack,
  Box,
  Heading,
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
  Button,
  Divider,
  useColorModeValue,
  Icon,
  Text,
  Badge,
  InputGroup,
  InputRightElement,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import { SmartDropdown } from '../SmartDropdown';
import BilingualInput from '../BilingualInput';
import { useAuth } from '../../contexts/shared/AuthContext';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

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

interface DeliveryNoteFormData {
  delivery_note_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_arabic?: string;
  quotation_id?: string;
  quotation_number?: string;
  issue_date: string;
  delivery_date: string;
  delivery_address: string;
  delivery_address_arabic: string;
  // Detailed delivery address fields for precise delivery location
  delivery_building_number?: string;
  delivery_street?: string;
  delivery_additional_number?: string;
  delivery_district?: string;
  delivery_city?: string;
  delivery_state_province?: string;
  delivery_zip_postal_code?: string;
  delivery_country?: string;
  received_by: string;
  received_by_signature: string;
  status: string;
  notes: string;
}

interface DeliveryNoteFormProps {
  formData: DeliveryNoteFormData;
  setFormData: (data: DeliveryNoteFormData) => void;
  deliveryNoteItems: DeliveryNoteItem[];
  setDeliveryNoteItems: (items: DeliveryNoteItem[]) => void;
  isEditMode: boolean;
  isReadOnly?: boolean;
  selectedOrganization: string | null;
  allCustomers: string[];
  allInventoryItems: string[];
  customerRefreshKey: number;
  inventoryRefreshKey: number;
  onCustomerSelection: (customerName: string) => Promise<void>;
  onCustomerChange: (customerName: string) => void;
  onItemChange: (itemName: string, itemIndex: number) => void;
  onInventoryItemSelection: (itemName: string) => Promise<any>;
  updateDeliveryNoteItem: (index: number, field: string, value: any) => void;
  addDeliveryNoteItem: () => void;
  removeDeliveryNoteItem: (index: number) => void;
  customers?: any[];
  inventory?: any[];
  onSave?: () => Promise<void>;
  onCancel?: () => void;
}

const DeliveryNoteForm: React.FC<DeliveryNoteFormProps> = ({
  formData,
  setFormData,
  deliveryNoteItems,
  setDeliveryNoteItems,
  isEditMode,
  isReadOnly = false,
  selectedOrganization,
  allCustomers,
  allInventoryItems,
  customerRefreshKey,
  inventoryRefreshKey,
  onCustomerSelection,
  onCustomerChange,
  onItemChange,
  onInventoryItemSelection,
  updateDeliveryNoteItem,
  addDeliveryNoteItem,
  removeDeliveryNoteItem,
  customers,
  inventory,
  onSave,
  onCancel,
}) => {
  const { organizationDetails } = useAuth();
  const toast = useToast();

  const handleInputChange = (field: keyof DeliveryNoteFormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  // Auto-generate delivery note number if empty
  const generateDeliveryNoteNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DN-${year}${month}${day}-${random}`;
  };

  // Auto-generate delivery note number on component mount if empty
  React.useEffect(() => {
    if (!formData.delivery_note_number) {
      setFormData(prev => ({
        ...prev,
        delivery_note_number: generateDeliveryNoteNumber()
      }));
    }
  }, []);


  const handleAddItem = () => {
    const newItem: DeliveryNoteItem = {
      id: Date.now().toString(),
      item_name: '',
      item_id: '',
      quantity: 1,
      unit: 'pcs', // Default unit
      delivered_quantity: 0,
      description: '',
    };
    setDeliveryNoteItems([...(deliveryNoteItems || []), newItem]);
  };



  const handleDeleteItem = (index: number) => {
    const updatedItems = (deliveryNoteItems || []).filter((_, i) => i !== index);
    setDeliveryNoteItems(updatedItems);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'yellow';
      case 'issued': return 'blue';
      case 'delivered': return 'green';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  return (
    <>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            {isEditMode ? 'Edit Delivery Note' : 'Create Delivery Note'}
          </Heading>
          <Text color="gray.600" fontSize="sm">
            {isEditMode ? 'Update delivery note details' : 'Create a new delivery note'}
          </Text>
        </Box>

        <Divider />

        {/* Basic Information */}
        <Box>
          <Heading size="md" mb={4}>Basic Information</Heading>
          <VStack spacing={4}>
            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Delivery Note Number</FormLabel>
                <Input
                  value={formData?.delivery_note_number || ''}
                  onChange={(e) => handleInputChange('delivery_note_number', e.target.value)}
                  placeholder="DN-2024-00001"
                  isReadOnly={true}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData?.status || 'delivered'}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  isDisabled={isReadOnly}
                >
                  <option value="draft">Draft</option>
                  <option value="issued">Issued</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormControl>
            </HStack>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Customer (English)</FormLabel>
                <SmartDropdown
                  placeholder="Select customer"
                  value={formData?.customer_name || ''}
                  onChange={onCustomerChange}
                  options={allCustomers}
                  type="customer"
                  organization_id={selectedOrganization || ''}
                  refreshKey={customerRefreshKey}
                  onSelection={onCustomerSelection}
                  autoFocus={false}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Customer (Arabic)</FormLabel>
                <Input
                  value={formData?.customer_name_arabic || ''}
                  onChange={(e) => handleInputChange('customer_name_arabic', e.target.value)}
                  placeholder="Customer name in Arabic"
                  isReadOnly={isReadOnly}
                  dir="rtl"
                />
              </FormControl>
            </HStack>
            
            <FormControl>
              <FormLabel>Quotation Reference</FormLabel>
              <Input
                value={formData?.quotation_number || formData?.quotation_id || ''}
                onChange={(e) => handleInputChange('quotation_id', e.target.value)}
                placeholder="Optional quotation reference"
                isReadOnly={isReadOnly}
              />
            </FormControl>

            <HStack spacing={4} w="full">
              <FormControl isRequired>
                <FormLabel>Issue Date</FormLabel>
                <Input
                  type="date"
                  value={formData?.issue_date || ''}
                  onChange={(e) => handleInputChange('issue_date', e.target.value)}
                  isReadOnly={isReadOnly}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Delivery Date</FormLabel>
                <Input
                  type="date"
                  value={formData?.delivery_date || ''}
                  onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  isReadOnly={isReadOnly}
                />
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* Delivery Information */}
        <Box>
          <Heading size="md" mb={4}>Delivery Information</Heading>
          <VStack spacing={4}>
            <HStack spacing={4} w="full" align="start">
              <FormControl isRequired>
                <FormLabel>Delivery Address (English)</FormLabel>
                <Textarea
                  value={formData?.delivery_address || ''}
                  onChange={(e) => handleInputChange('delivery_address', e.target.value)}
                  placeholder="Enter delivery address in English"
                  isReadOnly={isReadOnly}
                  rows={3}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Delivery Address (Arabic)</FormLabel>
                <Textarea
                  value={formData?.delivery_address_arabic || ''}
                  onChange={(e) => handleInputChange('delivery_address_arabic', e.target.value)}
                  placeholder="Enter delivery address in Arabic"
                  isReadOnly={isReadOnly}
                  rows={3}
                  dir="rtl"
                />
              </FormControl>
            </HStack>

            {/* Detailed Delivery Address Fields */}
            <Box w="full">
              <Text fontWeight="bold" fontSize="lg" mb={4}>Detailed Delivery Address (For Precise Location)</Text>
              
              <VStack spacing={4} align="stretch">
                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Building Number</FormLabel>
                    <Input
                      value={formData?.delivery_building_number || ''}
                      onChange={(e) => handleInputChange('delivery_building_number', e.target.value)}
                      placeholder="Building Number"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Street</FormLabel>
                    <Input
                      value={formData?.delivery_street || ''}
                      onChange={(e) => handleInputChange('delivery_street', e.target.value)}
                      placeholder="Street Name"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Additional Number</FormLabel>
                    <Input
                      value={formData?.delivery_additional_number || ''}
                      onChange={(e) => handleInputChange('delivery_additional_number', e.target.value)}
                      placeholder="Additional Number"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>District</FormLabel>
                    <Input
                      value={formData?.delivery_district || ''}
                      onChange={(e) => handleInputChange('delivery_district', e.target.value)}
                      placeholder="District"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>City</FormLabel>
                    <Input
                      value={formData?.delivery_city || ''}
                      onChange={(e) => handleInputChange('delivery_city', e.target.value)}
                      placeholder="City"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>State/Province</FormLabel>
                    <Input
                      value={formData?.delivery_state_province || ''}
                      onChange={(e) => handleInputChange('delivery_state_province', e.target.value)}
                      placeholder="State/Province"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="full">
                  <FormControl>
                    <FormLabel>Zip/Postal Code</FormLabel>
                    <Input
                      value={formData?.delivery_zip_postal_code || ''}
                      onChange={(e) => handleInputChange('delivery_zip_postal_code', e.target.value)}
                      placeholder="Zip/Postal Code"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Country</FormLabel>
                    <Input
                      value={formData?.delivery_country || ''}
                      onChange={(e) => handleInputChange('delivery_country', e.target.value)}
                      placeholder="Country"
                      isReadOnly={isReadOnly}
                    />
                  </FormControl>
                </HStack>
              </VStack>
            </Box>

            <HStack spacing={4} w="full">
              <FormControl>
                <FormLabel>Received By</FormLabel>
                <Input
                  value={formData?.received_by || ''}
                  onChange={(e) => handleInputChange('received_by', e.target.value)}
                  placeholder="Name of person receiving delivery"
                  isReadOnly={isReadOnly}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Signature/Confirmation</FormLabel>
                <Input
                  value={formData?.received_by_signature || ''}
                  onChange={(e) => handleInputChange('received_by_signature', e.target.value)}
                  placeholder="Digital signature or confirmation"
                  isReadOnly={isReadOnly}
                />
              </FormControl>
            </HStack>
          </VStack>
        </Box>

        <Divider />

        {/* Items Section */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Items</Heading>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              size="sm"
              onClick={handleAddItem}
              isDisabled={isReadOnly}
            >
              Add Item
            </Button>
          </HStack>

          {(deliveryNoteItems || []).length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No items added yet. Click "Add Item" to get started.
            </Text>
          ) : (
            <Box overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Item (English)</Th>
                    <Th>Item (Arabic)</Th>
                    <Th>Ordered Qty</Th>
                    <Th>Unit</Th>
                    <Th>Delivered Qty</Th>
                    <Th>Description</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {(deliveryNoteItems || []).map((item, index) => (
                    <Tr key={item.id}>
                      <Td>
                        <SmartDropdown
                          value={item.item_name}
                          onChange={(itemName) => onItemChange(itemName, index)}
                          onAutoCreate={async (itemName) => {
                            const newItem = await onInventoryItemSelection(itemName);
                            if (newItem) {
                              updateDeliveryNoteItem(index, 'item_id', newItem._id);
                            }
                          }}
                          placeholder="Select or add item"
                          options={allInventoryItems}
                          type="inventory_item"
                          organization_id={selectedOrganization || ''}
                          autoFocus={false}
                          isDisabled={isReadOnly}
                        />
                      </Td>
                      <Td>
                        <Input
                          value={item.item_name_arabic || ''}
                          onChange={(e) => updateDeliveryNoteItem(index, 'item_name_arabic', e.target.value)}
                          placeholder="Item name in Arabic"
                          size="sm"
                          isDisabled={isReadOnly}
                          dir="rtl"
                        />
                      </Td>
                      <Td>
                        <NumberInput
                          value={item.quantity}
                          min={1}
                          size="sm"
                          isDisabled={true} // [2025-01-11] Fixed - Make quantity read-only (ordered quantity)
                        >
                          <NumberInputField />
                        </NumberInput>
                      </Td>
                      <Td>
                        <Input
                          value={item.unit || 'pcs'}
                          onChange={(e) => updateDeliveryNoteItem(index, 'unit', e.target.value)}
                          placeholder="Unit"
                          size="sm"
                          isDisabled={isReadOnly}
                        />
                      </Td>
                      <Td>
                        <Tooltip label="Enter the quantity you want to deliver (cannot exceed ordered quantity)" placement="top">
                          <NumberInput
                            value={item.delivered_quantity}
                            onChange={(value) => updateDeliveryNoteItem(index, 'delivered_quantity', Number(value))}
                            min={0}
                            max={item.quantity} // [2025-01-11] Added - Prevent delivering more than ordered
                            size="sm"
                            isDisabled={isReadOnly}
                          >
                            <NumberInputField />
                            <NumberInputStepper>
                              <NumberIncrementStepper />
                              <NumberDecrementStepper />
                            </NumberInputStepper>
                          </NumberInput>
                        </Tooltip>
                      </Td>
                      <Td>
                        <Input
                          value={item.description}
                          onChange={(e) => updateDeliveryNoteItem(index, 'description', e.target.value)}
                          placeholder="Notes"
                          size="sm"
                          isDisabled={isReadOnly}
                        />
                      </Td>
                      <Td>
                        <IconButton
                          aria-label="Delete item"
                          icon={<FiTrash2 />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteItem(index)}
                          isDisabled={isReadOnly}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}
        </Box>

        <Divider />

        {/* Notes */}
        <Box>
          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea
              value={formData?.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or special instructions..."
              rows={3}
              isReadOnly={isReadOnly}
            />
          </FormControl>
        </Box>

        {/* Action Buttons */}
        {!isReadOnly && (
          <HStack spacing={4} justify="flex-end">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={onSave}>
              {isEditMode ? 'Update Delivery Note' : 'Create Delivery Note'}
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Item Modal */}

    </>
  );
};

export default DeliveryNoteForm;
