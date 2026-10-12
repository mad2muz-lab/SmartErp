import React from 'react';
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
} from '@chakra-ui/react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { SmartDropdown } from './SmartDropdown';

interface LeadItem {
  id: string;
  item_name: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  description: string;
}

interface LeadFormData {
  lead_number: string;
  name: string;
  status: string;
  priority: string;
  assigned_to: string;
  
  // Quotation-like fields
  customer_id: string;
  customer_name: string;
  subject: string;
  description: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  terms_conditions: string;
  notes: string;
  
  // Legacy fields for backward compatibility
  company: string;
  email: string;
  phone: string;
  source: string;
  estimated_value: number;
}

interface LeadFormProps {
  formData: LeadFormData;
  setFormData: (data: LeadFormData) => void;
  leadItems: LeadItem[];
  setLeadItems: (items: LeadItem[]) => void;
  isEditMode: boolean;
  selectedOrganization: string | null;
  allCustomers: string[];
  allInventoryItems: string[];
  customerRefreshKey: number;
  inventoryRefreshKey: number;
  onCustomerSelection: (customerName: string) => Promise<void>;
  onCustomerChange: (customerName: string) => void;
  onItemChange: (itemName: string, itemIndex: number) => void;
  onInventoryItemSelection: (itemName: string) => Promise<any>;
  updateLeadItem: (index: number, field: string, value: any) => void;
  addLeadItem: () => void;
  removeLeadItem: (index: number) => void;
  updateSubtotal: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({
  formData,
  setFormData,
  leadItems,
  setLeadItems,
  isEditMode,
  selectedOrganization,
  allCustomers,
  allInventoryItems,
  customerRefreshKey,
  inventoryRefreshKey,
  onCustomerSelection,
  onCustomerChange,
  onItemChange,
  onInventoryItemSelection,
  updateLeadItem,
  addLeadItem,
  removeLeadItem,
  updateSubtotal,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <VStack spacing={6}>
      {/* Essential Lead Information */}
      <Box w="full">
        <Heading size="md" mb={4}>Lead Information</Heading>
        <VStack spacing={4}>
          <HStack spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel>Lead Number</FormLabel>
              <Input
                value={formData.lead_number}
                onChange={(e) => setFormData({ ...formData, lead_number: e.target.value })}
                placeholder="Auto-generated if empty"
                isReadOnly={!isEditMode}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Lead Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter lead name"
              />
            </FormControl>
          </HStack>

          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed">Closed</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Priority</FormLabel>
              <Select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Assigned To</FormLabel>
              <Input
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                placeholder="Assign to user"
              />
            </FormControl>
          </HStack>
        </VStack>
      </Box>

      <Divider />

      {/* Customer & Subject Information */}
      <Box w="full">
        <Heading size="md" mb={4}>Customer & Subject</Heading>
        <VStack spacing={4}>
          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>Customer</FormLabel>
              <SmartDropdown
                key={`customer-dropdown-${customerRefreshKey}`}
                value={formData.customer_name}
                onChange={onCustomerChange}
                onAutoCreate={onCustomerSelection}
                placeholder="Select or add customer"
                options={allCustomers}
                type="customer"
                organization_id={selectedOrganization || ''}
                autoFocus={false}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Subject</FormLabel>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Lead subject"
              />
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Lead description"
              rows={3}
            />
          </FormControl>
        </VStack>
      </Box>

      <Divider />

      {/* Items Section */}
      <Box w="full">
        <HStack justify="space-between" align="center" mb={4}>
          <Heading size="md">Items & Products</Heading>
          <Button
            leftIcon={<FiPlus />}
            size="sm"
            colorScheme="blue"
            onClick={addLeadItem}
          >
            Add Item
          </Button>
        </HStack>
        
        {leadItems.length === 0 ? (
          <VStack spacing={4} align="center" py={8}>
            <Text color="gray.500">No items added</Text>
            <Text fontSize="sm" color="gray.400">
              Click "Add Item" to start adding items to this lead
            </Text>
          </VStack>
        ) : (
          <VStack spacing={4}>
            {leadItems.map((item, index) => (
              <Box
                key={item.id}
                w="full"
                p={4}
                border="1px"
                borderColor={borderColor}
                borderRadius="md"
              >
                <HStack justify="space-between" align="center" mb={3}>
                  <Text fontWeight="medium">Item {index + 1}</Text>
                  <Button
                    aria-label="Remove item"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => removeLeadItem(index)}
                  />
                </HStack>
                
                <VStack spacing={3}>
                  <HStack spacing={4} w="full">
                    <FormControl flex={2}>
                      <FormLabel>Item Name</FormLabel>
                      <SmartDropdown
                        key={`item-${index}-${item.item_name}-${inventoryRefreshKey}`}
                        value={item.item_name}
                        onChange={(itemName) => onItemChange(itemName, index)}
                        onAutoCreate={async (itemName) => {
                          const newItem = await onInventoryItemSelection(itemName);
                          if (newItem) {
                            updateLeadItem(index, 'item_id', newItem._id);
                            updateLeadItem(index, 'unit_price', newItem.selling_price || 0);
                          }
                        }}
                        placeholder="Select or add item"
                        autoFocus={false}
                        options={allInventoryItems}
                        type="inventory_item"
                        organization_id={selectedOrganization || ''}
                      />
                    </FormControl>
                    
                    <FormControl flex={1}>
                      <FormLabel>Quantity</FormLabel>
                      <NumberInput
                        value={item.quantity}
                        onChange={(value) => updateLeadItem(index, 'quantity', Number(value))}
                        min={1}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl flex={1}>
                      <FormLabel>Unit Price</FormLabel>
                      <NumberInput
                        value={item.unit_price}
                        onChange={(value) => updateLeadItem(index, 'unit_price', Number(value))}
                        min={0}
                        precision={2}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    <FormControl flex={1}>
                      <FormLabel>Total Price</FormLabel>
                      <Input
                        value={item.total_price.toFixed(2)}
                        isReadOnly
                        bg="gray.50"
                        fontWeight="medium"
                      />
                    </FormControl>
                  </HStack>
                  
                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Input
                      value={item.description}
                      onChange={(e) => updateLeadItem(index, 'description', e.target.value)}
                      placeholder="Item description (optional)"
                    />
                  </FormControl>
                </VStack>
              </Box>
            ))}
          </VStack>
        )}
      </Box>

      <Divider />

      {/* Financial Information */}
      <Box w="full">
        <Heading size="md" mb={4}>Financial Information</Heading>
        <VStack spacing={4}>
          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>Currency</FormLabel>
              <Select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="SAR">{'\uE900'} Saudi Riyal</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="GBP">GBP (British Pound)</option>
                <option value="CAD">CAD (Canadian Dollar)</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Subtotal</FormLabel>
              <NumberInput
                value={formData.subtotal}
                onChange={(value) => setFormData({ ...formData, subtotal: Number(value) })}
                min={0}
                precision={2}
              >
                <NumberInputField placeholder="0.00" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <FormControl>
              <FormLabel>VAT Rate (%)</FormLabel>
              <NumberInput
                value={formData.tax_rate}
                onChange={(value) => setFormData({ ...formData, tax_rate: Number(value) })}
                min={0}
                max={100}
                precision={2}
              >
                <NumberInputField placeholder="15.00" />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </HStack>

          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>VAT Amount</FormLabel>
              <Input
                value={((formData.subtotal * formData.tax_rate) / 100).toFixed(2)}
                isReadOnly
                bg="gray.50"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Total Amount</FormLabel>
              <Input
                value={(formData.subtotal + (formData.subtotal * formData.tax_rate) / 100).toFixed(2)}
                isReadOnly
                bg="gray.50"
                fontWeight="bold"
              />
            </FormControl>
          </HStack>
        </VStack>
      </Box>

      <Divider />

      {/* Additional Information */}
      <Box w="full">
        <Heading size="md" mb={4}>Additional Information</Heading>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel>Terms & Conditions</FormLabel>
            <Textarea
              value={formData.terms_conditions}
              onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
              placeholder="Terms and conditions for this lead"
              rows={4}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Notes</FormLabel>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
              rows={3}
            />
          </FormControl>
        </VStack>
      </Box>
    </VStack>
  );
};

export default LeadForm;
