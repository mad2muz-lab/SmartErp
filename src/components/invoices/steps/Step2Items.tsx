import React, { useState } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Button,
  Text,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Badge,
  Box,
  Divider,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  Tooltip
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiUpload, FiDownload, FiSearch } from 'react-icons/fi';
import { SaudiRiyalIcon } from '../../icons/SaudiRiyalIcon';
import { formatCurrencyDisplay } from '../../../utils/invoiceCurrencyUtils';
import { SmartDropdown } from '../../SmartDropdown';
import { useAuth } from '../../../contexts/shared/AuthContext';
import { isConvexOrgId } from '../../../utils/accountingUtils';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

interface InvoiceItem {
  id: string;
  serial_number?: string;
  item_name: string;
  item_id: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total_price: number;
  description: string;
  discount_percentage: number;
  purchase_price: number;
  markup_amount?: number;
  vat_amount?: number;
  vat_rate: number;
  supply_type: string;
  supply_type_arabic: string;
  is_zero_rated: boolean;
  is_exempt: boolean;
  inventory_id?: string;
  sku?: string;
  inventory_name?: string;
  notes?: string;
}

interface InvoiceFormData {
  customer_id: string;
  customer_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  description: string;
  terms_conditions: string;
  notes: string;
  items: InvoiceItem[];
  currency: string;
  markup_percentage: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: string;
}

interface Step2ItemsProps {
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
}

const Step2Items: React.FC<Step2ItemsProps> = ({
  formData,
  setFormData
}) => {
  const { selectedOrganization } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const isConvexOrg = isConvexOrgId(selectedOrganization);

  // Fetch inventory items
  const inventory = useQuery(api.inventory.listInventory, 
    isConvexOrg ? { organization_id: selectedOrganization as any } : "skip"
  );

  const units = [
    { value: 'pcs', label: 'Piece' },
    { value: 'kg', label: 'Kilogram' },
    { value: 'm', label: 'Meter' },
    { value: 'm²', label: 'Square Meter' },
    { value: 'm³', label: 'Cubic Meter' },
    { value: 'l', label: 'Liter' },
    { value: 'hrs', label: 'Hour' },
    { value: 'days', label: 'Day' }
  ];

  // Get all inventory items for dropdown
  const allInventoryItems = inventory?.map(item => item.name) || [];

  // Helper function to get Arabic name from inventory
  const getInventoryItemArabicName = (itemName: string) => {
    const item = inventory?.find(i => i.name === itemName);
    return item?.name_arabic || '';
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      serial_number: (formData.items.length + 1).toString(),
      item_name: '',
      item_id: '',
      quantity: 1,
      unit: 'pcs',
      unit_price: 0,
      total_price: 0,
      description: '',
      discount_percentage: 0,
      purchase_price: 0,
      markup_amount: 0,
      vat_amount: 0,
      vat_rate: 15,
      supply_type: 'goods',
      supply_type_arabic: 'بضائع',
      is_zero_rated: false,
      is_exempt: false,
      inventory_name: '',
      notes: ''
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Recalculate totals if relevant fields changed
          if (['quantity', 'unit_price', 'discount_percentage', 'purchase_price', 'markup_amount'].includes(field)) {
            // Recalculate unit price if purchase price or markup changed
            if (['purchase_price', 'markup_amount'].includes(field)) {
              updatedItem.unit_price = (updatedItem.purchase_price || 0) + (updatedItem.markup_amount || 0);
            }
            
            const taxableAmount = updatedItem.quantity * updatedItem.unit_price * (1 - updatedItem.discount_percentage / 100);
            updatedItem.vat_amount = taxableAmount * (updatedItem.vat_rate / 100);
            updatedItem.total_price = taxableAmount + updatedItem.vat_amount;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  // Handle item selection from dropdown
  const handleItemChange = (itemName: string, itemIndex: number) => {
    const englishName = itemName.includes(' | ') ? itemName.split(' | ')[0] : itemName;
    const existingItem = inventory?.find(i => i.name === englishName);
    
    if (existingItem) {
      const updatedItems = [...formData.items];
      const purchasePrice = existingItem.cost_price || 0;
      const markupAmount = 0;
      const unitPrice = purchasePrice + markupAmount;
      
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        item_name: englishName,
        item_id: existingItem._id,
        unit: existingItem.unit || 'pcs',
        purchase_price: purchasePrice,
        markup_amount: markupAmount,
        unit_price: unitPrice,
        total_price: unitPrice * updatedItems[itemIndex].quantity,
        description: englishName,
        inventory_name: englishName
      };
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    } else {
      updateItem(formData.items[itemIndex].id, 'item_name', englishName);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="lg" fontWeight="bold" color="blue.600">
        Step 2: Items & Pricing
      </Text>
      
      {/* Action Buttons */}
      <HStack justify="flex-end" spacing={2}>
        <Button size="sm" variant="outline" leftIcon={<FiDownload />}>
          Template
        </Button>
        <Button size="sm" variant="outline" leftIcon={<FiUpload />}>
          Import
        </Button>
        <Button size="sm" variant="outline" leftIcon={<FiDownload />}>
          Export
        </Button>
        <Button
          colorScheme="blue"
          onClick={addItem}
          leftIcon={<FiPlus />}
        >
          Add Row
        </Button>
        <Button size="sm" colorScheme="orange" leftIcon={<SaudiRiyalIcon />}>
          Check Markup
        </Button>
      </HStack>

      {/* Items Section */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="md" fontWeight="semibold">Items</Text>
            
            {formData.items.length > 0 ? (
              <TableContainer overflowX="auto" maxW="100%">
                <Table size="sm" variant="simple" minW="1400px">
                  <Thead>
                    <Tr>
                      <Th minW="80px">Serial No.</Th>
                      <Th minW="200px">Item Name</Th>
                      <Th minW="100px">Quantity</Th>
                      <Th minW="100px">Unit</Th>
                      <Th minW="120px">Purchase Price</Th>
                      <Th minW="120px">Markup Amt</Th>
                      <Th minW="120px">Unit Price</Th>
                      <Th minW="100px">Discount %</Th>
                      <Th minW="120px">Total Price</Th>
                      <Th minW="120px">VAT Amount</Th>
                      <Th minW="80px">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {formData.items.map((item, index) => (
                      <Tr key={item.id}>
                        <Td>
                          <Input
                            value={item.serial_number || (index + 1).toString()}
                            onChange={(e) => updateItem(item.id, 'serial_number', e.target.value)}
                            size="sm"
                            w="100%"
                            textAlign="center"
                          />
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <SmartDropdown
                              value={item.item_name}
                              onChange={(itemName) => handleItemChange(itemName, index)}
                              placeholder="Select or add"
                              options={allInventoryItems}
                              type="inventory_item"
                              organization_id={selectedOrganization || ''}
                              autoFocus={false}
                            />
                            {item.item_name && getInventoryItemArabicName(item.item_name) && (
                              <Box p={1} bg="green.50" borderRadius="sm" border="1px solid" borderColor="green.200">
                                <Text fontSize="xs" color="green.700" fontFamily="'Noto Sans Arabic', 'Arial Unicode MS', sans-serif" textAlign="right" dir="rtl">
                                  {getInventoryItemArabicName(item.item_name)}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <NumberInput
                            value={item.quantity}
                            onChange={(_, value) => updateItem(item.id, 'quantity', value)}
                            min={0.01}
                            step={0.01}
                            size="sm"
                            w="100%"
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <Select
                            value={item.unit || 'pcs'}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            size="sm"
                            w="100%"
                          >
                            {units.map(unit => (
                              <option key={unit.value} value={unit.value}>
                                {unit.label}
                              </option>
                            ))}
                          </Select>
                        </Td>
                        <Td>
                          <VStack spacing={1}>
                            <NumberInput
                              value={item.purchase_price || 0}
                              onChange={(_, value) => updateItem(item.id, 'purchase_price', value)}
                              min={0}
                              step={0.01}
                              size="sm"
                              w="100%"
                            >
                              <NumberInputField />
                            </NumberInput>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack spacing={1}>
                            <NumberInput
                              value={item.markup_amount || 0}
                              onChange={(_, value) => updateItem(item.id, 'markup_amount', value)}
                              min={0}
                              step={0.01}
                              size="sm"
                              w="100%"
                            >
                              <NumberInputField />
                            </NumberInput>
                            <Text fontSize="xs" color="gray.500">
                              Markup: {item.purchase_price ? ((item.markup_amount || 0) / item.purchase_price * 100).toFixed(1) : 0}%
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack spacing={1}>
                            <NumberInput
                              value={item.unit_price || 0}
                              onChange={(_, value) => updateItem(item.id, 'unit_price', value)}
                              min={0}
                              step={0.01}
                              size="sm"
                              w="100%"
                            >
                              <NumberInputField />
                            </NumberInput>
                            <Text fontSize="xs" color="gray.500">
                              Final Price
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <NumberInput
                            value={item.discount_percentage || 0}
                            onChange={(_, value) => updateItem(item.id, 'discount_percentage', value)}
                            min={0}
                            max={100}
                            step={1}
                            size="sm"
                            w="100%"
                          >
                            <NumberInputField />
                          </NumberInput>
                        </Td>
                        <Td>
                          <VStack spacing={1}>
                            <Text fontSize="sm" fontWeight="bold" className="invoice-currency-sar">
                              {formatCurrencyDisplay(item.total_price || 0, formData.currency as any)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatCurrencyDisplay(item.total_price || 0, formData.currency as any)}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack spacing={1}>
                            <Text fontSize="sm" fontWeight="bold" className="invoice-currency-sar">
                              {formatCurrencyDisplay(item.vat_amount || 0, formData.currency as any)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {formatCurrencyDisplay(item.vat_amount || 0, formData.currency as any)}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <IconButton
                            aria-label="Remove item"
                            icon={<FiTrash2 />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => removeItem(item.id)}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500" fontSize="lg">
                  No items added yet
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Click "Add Row" to add items to your invoice
                </Text>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default Step2Items;
