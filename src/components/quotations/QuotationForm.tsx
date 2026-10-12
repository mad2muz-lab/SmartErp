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
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FiPlus, FiTrash2, FiUpload, FiDownload, FiFolderPlus, FiList, FiHash, FiEdit3, FiEye, FiSave, FiFileText } from 'react-icons/fi';
import { Sparkles } from 'lucide-react';
import { ContractTermsWizardModal } from './ContractTermsWizardModal';
import { SaudiRiyalIcon } from '../icons/SaudiRiyalIcon';
import toast from 'react-hot-toast';
import { formatTermsToHtml, formatToNumberedList, formatToBulletList, getStandardQuotationTerms } from '../../utils/termsFormatter';
import { SmartDropdown } from '../SmartDropdown';
import { FormattedCurrencyDisplay } from '../FormattedCurrencyDisplay';
// Import Saudi Riyal Font for consistent currency display
import '@emran-alhaddad/saudi-riyal-font/index.css';
import '../../utils/procurementCurrency.css';

interface QuotationItem {
  id: string;
  serial_number?: string; // Serial number for item identification
  wbs_code?: string; // WBS number (e.g. 1.0, 1.1, 1.2)
  item_title?: string; // Title / heading for identification
  is_section_header?: boolean; // True if this row is a WBS section header
  item_name: string;
  item_id: string;
  quantity: number;
  unit?: string; // Unit field for quotation items
  unit_price: number;
  total_price: number;
  description: string;
  discount_percentage: number;
  purchase_price: number;
  markup_amount?: number; // Markup amount for this item
  // [2025-01-11] Added - VAT amount per line item for enhanced quotation management
  vat_amount?: number; // VAT amount per line item
}

interface QuotationFormData {
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  reference_number: string; // Renamed from subject
  description: string;
  status: string;
  valid_until: string;
  terms_conditions: string;
  notes: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  // New fields for enhanced quotation management
  salesperson: string;
  markup_percentage: number;
  // Lead connection fields
  lead_id?: string;
  lead_number?: string;
}

interface QuotationFormProps {
  formData: QuotationFormData;
  setFormData: (data: QuotationFormData) => void;
  quotationItems: QuotationItem[];
  setQuotationItems: (items: QuotationItem[]) => void;
  isEditMode: boolean;
  isReadOnly?: boolean; // New prop for read-only mode
  selectedOrganization: string | null;
  allCustomers: string[];
  allInventoryItems: string[];
  customerRefreshKey: number;
  inventoryRefreshKey: number;
  onCustomerSelection: (customerName: string) => Promise<void>;
  onCustomerChange: (customerName: string) => void;
  onItemChange: (itemName: string, itemIndex: number) => void;
  onInventoryItemSelection: (itemName: string) => Promise<any>;
  updateQuotationItem: (index: number, field: string, value: any) => void;
  addQuotationItem: () => void;
  addCategoryTitle?: () => void;
  convertRowType?: (index: number, toCategory: boolean) => void;
  resequenceWBS?: () => void;
  removeQuotationItem: (index: number) => void;
  updateSubtotal: () => void;
  // New functions for enhanced functionality
  onImportItems?: (file: File) => Promise<void>;
  onExportItems?: () => Promise<void>;
  onMarkupChange?: (markupPercentage: number) => void;
  checkMarkupAndNotify?: () => void;
  onSaveTerms?: (terms: string) => Promise<void>;
  // Add customer and inventory data for Arabic display
  customers?: any[];
  inventory?: any[];
  // Template export function
  onExportTemplate?: () => Promise<void>;
}

const QuotationForm: React.FC<QuotationFormProps> = ({
  formData,
  setFormData,
  quotationItems,
  setQuotationItems,
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
  updateQuotationItem,
  addQuotationItem,
  addCategoryTitle,
  convertRowType,
  resequenceWBS,
  removeQuotationItem,
  updateSubtotal,
  onImportItems,
  onExportItems,
  onMarkupChange,
  checkMarkupAndNotify,
  onSaveTerms,
  customers,
  inventory,
  onExportTemplate,
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);

  // Helper function to get customer Arabic name
  const getCustomerArabicName = (customerName: string) => {
    const customer = customers?.find(c => c.customer_company_name === customerName);
    return customer?.customer_company_name_arabic;
  };

  // Helper function to get inventory item Arabic name
  const getInventoryItemArabicName = (itemName: string) => {
    const item = inventory?.find(i => i.name === itemName);
    return item?.name_arabic;
  };

  return (
    <VStack spacing={6}>
      {/* Lead Information (if quotation was created from a lead) */}
      {formData.lead_number && (
        <Box w="full" p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
          <HStack spacing={3} align="center">
            <Badge colorScheme="blue">Created from Lead</Badge>
            <Text fontSize="sm" color="blue.700">
              <strong>Lead #{formData.lead_number}</strong>
            </Text>
            <Text fontSize="xs" color="blue.500">
              This quotation was automatically generated from the lead conversion process
            </Text>
          </HStack>
        </Box>
      )}

      {/* Lead Number Field (for manual entry when creating from lead) */}
      {!formData.lead_number && (
        <FormControl>
          <FormLabel>Lead Number (Optional)</FormLabel>
          <Input
            value={formData.lead_number || ''}
            onChange={(e) => setFormData({ ...formData, lead_number: e.target.value })}
            placeholder="Enter lead number if creating from lead"
          />
        </FormControl>
      )}

      {/* Basic Information */}
      <Box w="full">
        <Heading size="md" mb={4}>Basic Information</Heading>
        <VStack spacing={4}>
          <HStack spacing={4} w="full">
            <FormControl isRequired>
              <FormLabel>Quotation Number</FormLabel>
              <Input
                value={formData.quotation_number}
                onChange={(e) => setFormData({ ...formData, quotation_number: e.target.value })}
                placeholder="Auto-generated if empty"
                isReadOnly={isReadOnly}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                isDisabled={isReadOnly}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="delivered">Delivered</option>
              </Select>
            </FormControl>
          </HStack>

          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>Customer</FormLabel>
              <SmartDropdown
                key={`customer-dropdown-${customerRefreshKey}`}
                value={formData.customer_name}
                onChange={onCustomerChange}
                onAutoCreate={onCustomerSelection}
                placeholder="Type to search or add new customer"
                options={allCustomers}
                type="customer"
                organization_id={selectedOrganization || ''}
                isDisabled={isReadOnly}
                autoFocus={false}
              />
              {/* Arabic Customer Name Display */}
              {formData.customer_name && getCustomerArabicName(formData.customer_name) && (
                <Box mt={2} p={2} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                  <Text fontSize="sm" color="blue.700" fontFamily="'Noto Sans Arabic', 'Arial Unicode MS', sans-serif" textAlign="right" dir="rtl">
                    {getCustomerArabicName(formData.customer_name)}
                  </Text>
                </Box>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Valid Until</FormLabel>
              <Input
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                isReadOnly={isReadOnly}
              />
            </FormControl>
          </HStack>

          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>Reference #</FormLabel>
              <Input
                value={formData.reference_number}
                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                placeholder="Quotation reference number"
                isReadOnly={isReadOnly}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Salesperson</FormLabel>
              <Input
                value={formData.salesperson}
                onChange={(e) => setFormData({ ...formData, salesperson: e.target.value })}
                placeholder="Salesperson name"
                isReadOnly={isReadOnly}
              />
            </FormControl>
          </HStack>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Quotation description"
              rows={3}
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
                isDisabled={isReadOnly}
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
                isDisabled={isReadOnly}
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
                isDisabled={quotationItems.length === 0 || isReadOnly}
              >
                Export
              </Button>
            </Tooltip>
            {addCategoryTitle && (
              <Button
                leftIcon={<FiFolderPlus />}
                size="sm"
                colorScheme="teal"
                onClick={addCategoryTitle}
                isDisabled={isReadOnly}
              >
                + Add Category Title (1, 2...)
              </Button>
            )}
            <Button
              leftIcon={<FiPlus />}
              size="sm"
              colorScheme="blue"
              onClick={addQuotationItem}
              isDisabled={isReadOnly}
            >
              + Add Line Item (1.1, 1.2...)
            </Button>
            {resequenceWBS && (
              <Tooltip label="Auto-number all items into clean WBS hierarchy (1 -> 1.1, 1.2 -> 2 -> 2.1, 2.2)">
                <Button
                  leftIcon={<FiHash />}
                  size="sm"
                  variant="outline"
                  colorScheme="purple"
                  onClick={resequenceWBS}
                  isDisabled={isReadOnly || quotationItems.length === 0}
                >
                  Re-number WBS
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Check for items without markup">
              <Button
                leftIcon={<SaudiRiyalIcon />}
                size="sm"
                variant="outline"
                colorScheme="orange"
                onClick={checkMarkupAndNotify}
                isDisabled={quotationItems.length === 0}
              >
                Check Markup
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
            if (file && onImportItems) {
              onImportItems(file);
            }
            // Reset the input
            if (e.target) {
              e.target.value = '';
            }
          }}
        />
        
        {quotationItems.length === 0 ? (
          <VStack spacing={2} align="center" py={8} bg="gray.50" borderRadius="md" border="1px dashed" borderColor={borderColor}>
            <Text color="gray.600" fontWeight="medium">No items or categories added yet</Text>
            <Text fontSize="sm" color="gray.500">
              Use the "+ Add Category Title" or "+ Add Line Item" buttons above to start building your quotation.
            </Text>
            <Text fontSize="xs" color="gray.400">
              You can organize your quote into WBS sections (1, 2...) with sub-items (1.1, 1.2...), or type any custom numbering directly.
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
              <HStack spacing={4} w="full" fontSize="sm" fontWeight="medium">
                <Text flex={0.9} minW="90px" textAlign="center">Item No</Text>
                <Text flex={3} minW="200px">Description of Work</Text>
                <Text flex={0.8} minW="80px">Quantity</Text>
                <Text flex={0.8} minW="80px">Unit</Text>
                <Text flex={1.2} minW="120px">Purchase Price</Text>
                <Text flex={1.2} minW="120px">Markup Amt</Text>
                <Text flex={1.2} minW="120px">Unit Price</Text>
                <Text flex={1} minW="100px">Discount %</Text>
                <Text flex={1.2} minW="120px">Total Price</Text>
                {/* [2025-01-11] Added - VAT Amount column for enhanced quotation management */}
                <Text flex={1.2} minW="120px">VAT Amount</Text>
                <Text flex={0.8} minW="100px">Actions</Text>
              </HStack>
            </Box>
            
            {/* Items Table Body */}
            <VStack spacing={0} align="stretch">
              {quotationItems.map((item, index) => item.is_section_header ? (
                <Box
                  key={`category-${index}-${item.id || index}`}
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
                    <Box minW="90px" maxW="100px" textAlign="center">
                      <Input
                        value={item.wbs_code || item.serial_number || (index + 1).toString()}
                        onChange={(e) => {
                          updateQuotationItem(index, 'wbs_code', e.target.value);
                          updateQuotationItem(index, 'serial_number', e.target.value);
                        }}
                        isReadOnly={isReadOnly}
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
                          updateQuotationItem(index, 'item_title', e.target.value);
                          updateQuotationItem(index, 'item_name', e.target.value);
                        }}
                        placeholder="Category Title / Scope of Work (e.g. Civil & Foundation Works)"
                        size="sm"
                        fontWeight="bold"
                        color="teal.900"
                        bg="white"
                        borderColor="teal.300"
                        _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px #319795" }}
                        isDisabled={isReadOnly}
                      />
                    </FormControl>
                    <HStack minW="100px" justify="center" spacing={1}>
                      {convertRowType && (
                        <Tooltip label="Convert to Line Item (1.1, 1.2...)">
                          <IconButton
                            aria-label="Convert to Line Item"
                            icon={<FiList />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => convertRowType(index, false)}
                            isDisabled={isReadOnly}
                          />
                        </Tooltip>
                      )}
                      <IconButton
                        aria-label="Remove category"
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => removeQuotationItem(index)}
                        isDisabled={isReadOnly}
                      />
                    </HStack>
                  </HStack>
                </Box>
              ) : (
                <Box
                  key={`item-${index}-${item.id || `temp-${index}`}`}
                  w="full"
                  p={3}
                  border="1px"
                  borderColor={borderColor}
                  borderTop="none"
                  borderRadius={index === quotationItems.length - 1 ? "md" : "none"}
                  borderTopRadius="none"
                  bg="white"
                >
                  <HStack spacing={4} w="full" align="flex-start">
                    {/* Item No (WBS) - Editable! */}
                    <FormControl flex={0.9} minW="90px" maxW="100px">
                      <Input
                        value={item.wbs_code || item.serial_number || ''}
                        onChange={(e) => {
                          updateQuotationItem(index, 'wbs_code', e.target.value);
                          updateQuotationItem(index, 'serial_number', e.target.value);
                        }}
                        isReadOnly={isReadOnly}
                        placeholder="1.1"
                        size="sm"
                        bg="blue.50"
                        borderColor="blue.200"
                        fontWeight="bold"
                        textAlign="center"
                        color="blue.800"
                        _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                      />
                    </FormControl>
                    
                    {/* Item Name & Description */}
                    <FormControl flex={3} minW="200px">
                      <SmartDropdown
                        key={`item-dropdown-${index}-${item.id || `temp-${index}`}`}
                        value={item.item_name}
                        onChange={(itemName) => onItemChange(itemName, index)}
                        onAutoCreate={async (itemName) => {
                          const newItem = await onInventoryItemSelection(itemName);
                          if (newItem) {
                            updateQuotationItem(index, 'item_id', newItem._id);
                            updateQuotationItem(index, 'unit', newItem.unit || '');
                            updateQuotationItem(index, 'unit_price', newItem.selling_price || 0);
                            updateQuotationItem(index, 'purchase_price', newItem.cost_price || 0);
                          }
                        }}
                        placeholder="Type to search or add new item"
                        options={allInventoryItems}
                        type="inventory_item"
                        organization_id={selectedOrganization || ''}
                        autoFocus={false}
                        isDisabled={isReadOnly}
                      />
                      {/* Arabic Item Name Display */}
                      {item.item_name && getInventoryItemArabicName(item.item_name) && (
                        <Box mt={1} p={1} bg="green.50" borderRadius="sm" border="1px solid" borderColor="green.200">
                          <Text fontSize="xs" color="green.700" fontFamily="'Noto Sans Arabic', 'Arial Unicode MS', sans-serif" textAlign="right" dir="rtl">
                            {getInventoryItemArabicName(item.item_name)}
                          </Text>
                        </Box>
                      )}
                      {/* Scope Description Field */}
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updateQuotationItem(index, 'description', e.target.value)}
                        placeholder="Scope / specification (e.g. Subgrade preparation, compaction, vapor barrier...)"
                        size="xs"
                        mt={1}
                        bg="gray.50"
                        borderColor="gray.200"
                        _focus={{ bg: "white", borderColor: "blue.400" }}
                        isDisabled={isReadOnly}
                      />
                    </FormControl>
                    
                    {/* Quantity */}
                    <FormControl flex={0.8} minW="80px">
                      <NumberInput
                        key={`quantity-${index}-${item.id || `temp-${index}`}`}
                        value={item.quantity}
                        onChange={(value) => updateQuotationItem(index, 'quantity', Number(value))}
                        min={1}
                        size="sm"
                        isDisabled={isReadOnly}
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    {/* Unit */}
                    <FormControl flex={0.8} minW="80px">
                      <VStack spacing={1} align="stretch">
                        {/* [2025-01-11] Enhanced - Unit dropdown with predefined options and custom input support */}
                        <Select
                          value={item.unit || 'pcs'}
                          onChange={(e) => updateQuotationItem(index, 'unit', e.target.value)}
                          size="sm"
                          isDisabled={isReadOnly}
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
                        
                        {/* Custom Unit Input - Show when custom is selected or unit is not in predefined list */}
                        {(!item.unit || !['pcs', 'kg', 'g', 'liters', 'ml', 'meters', 'cm', 'mm', 'gallons', 'pounds', 'tons', 'boxes', 'pallets', 'units', 'sets', 'pairs', 'dozens', 'hours', 'days', 'months', 'years'].includes(item.unit)) && (
                          <Input
                            placeholder="Enter custom unit (e.g., cartons, bundles, etc.)"
                            value={item.unit || ''}
                            onChange={(e) => updateQuotationItem(index, 'unit', e.target.value)}
                            size="sm"
                            isDisabled={isReadOnly}
                            bg="white"
                            borderColor="blue.300"
                            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          />
                        )}
                      </VStack>
                    </FormControl>
                    
                    {/* Purchase Price */}
                    <FormControl flex={1.2} minW="120px">
                      <Input
                        key={`purchase-price-${index}-${item.id || `temp-${index}`}`}
                        value={item.purchase_price?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string, numbers, and one decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            // Store as string to preserve decimal input during typing
                            updateQuotationItem(index, 'purchase_price', value);
                          }
                        }}
                        placeholder="0.00"
                        size="sm"
                        isDisabled={isReadOnly}
                        onKeyDown={(e) => {
                          // Allow decimal point, backspace, delete, arrow keys, and numbers
                          if (e.key === '.' || e.key === 'Backspace' || e.key === 'Delete' || 
                              e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                              e.key === 'Tab' || e.key === 'Enter' ||
                              (e.key >= '0' && e.key <= '9')) {
                            // Prevent multiple decimal points
                            if (e.key === '.' && (e.target as HTMLInputElement).value.includes('.')) {
                              e.preventDefault();
                            }
                            return;
                          }
                          e.preventDefault();
                        }}
                        onBlur={(e) => {
                          // Convert to number only on blur for calculations
                          const value = parseFloat(e.target.value) || 0;
                          updateQuotationItem(index, 'purchase_price', value);
                        }}
                      />
                    </FormControl>
                    
                    {/* Markup Amount */}
                    <FormControl flex={1.2} minW="120px">
                      <Input
                        key={`markup-amount-${index}-${item.id || `temp-${index}`}`}
                        value={item.markup_amount?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty string, numbers, and one decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            // Store as string to preserve decimal input during typing
                            updateQuotationItem(index, 'markup_amount', value);
                          }
                        }}
                        placeholder="0.00"
                        bg="green.50"
                        color="green.700"
                        size="sm"
                        isDisabled={isReadOnly}
                        onKeyDown={(e) => {
                          // Allow decimal point, backspace, delete, arrow keys, and numbers
                          if (e.key === '.' || e.key === 'Backspace' || e.key === 'Delete' || 
                              e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                              e.key === 'Tab' || e.key === 'Enter' ||
                              (e.key >= '0' && e.key <= '9')) {
                            // Prevent multiple decimal points
                            if (e.key === '.' && (e.target as HTMLInputElement).value.includes('.')) {
                              e.preventDefault();
                            }
                            return;
                          }
                          e.preventDefault();
                        }}
                        onBlur={(e) => {
                          // Convert to number only on blur for calculations
                          const value = parseFloat(e.target.value) || 0;
                          updateQuotationItem(index, 'markup_amount', value);
                        }}
                      />
                      <Text fontSize="xs" color="green.600" mt={1}>
                        Markup: {((parseFloat(item.markup_amount) || 0) / (parseFloat(item.purchase_price) || 1) * 100).toFixed(1)}%
                      </Text>
                    </FormControl>
                    
                    {/* Unit Price */}
                    <FormControl flex={1.2} minW="120px">
                      <Input
                        value={((parseFloat(item.purchase_price) || 0) + (parseFloat(item.markup_amount) || 0)).toFixed(2)}
                        isReadOnly
                        bg="blue.50"
                        fontWeight="medium"
                        size="sm"
                        color="blue.700"
                      />
                      <Text fontSize="xs" color="blue.600" mt={1}>
                        Final Price
                      </Text>
                    </FormControl>
                    
                    {/* Discount % */}
                    <FormControl flex={1} minW="100px">
                      <NumberInput
                        key={`discount-${index}-${item.id || `temp-${index}`}`}
                        value={item.discount_percentage || 0}
                        onChange={(value) => {
                          const decimalValue = value === '' ? 0 : parseFloat(value);
                          updateQuotationItem(index, 'discount_percentage', isNaN(decimalValue) ? 0 : decimalValue);
                        }}
                        min={0}
                        max={100}
                        precision={2}
                        step={0.01}
                        size="sm"
                        isDisabled={isReadOnly}
                        allowMouseWheel
                        keepWithinRange={false}
                        clampValueOnBlur={false}
                      >
                        <NumberInputField 
                          placeholder="0.00"
                          onKeyDown={(e) => {
                            // Allow decimal point, backspace, delete, arrow keys, and numbers
                            if (e.key === '.' || e.key === 'Backspace' || e.key === 'Delete' || 
                                e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                                e.key === 'Tab' || e.key === 'Enter' ||
                                (e.key >= '0' && e.key <= '9')) {
                              // Prevent multiple decimal points
                              if (e.key === '.' && (e.target as HTMLInputElement).value.includes('.')) {
                                e.preventDefault();
                              }
                              return;
                            }
                            e.preventDefault();
                          }}
                          onBlur={(e) => {
                            // Ensure the value is properly formatted on blur
                            const value = parseFloat(e.target.value) || 0;
                            updateQuotationItem(index, 'discount_percentage', value);
                          }}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    
                    {/* Total Price */}
                    <FormControl flex={1.2} minW="120px">
                      <Input
                        value={(() => {
                          const unitPrice = (parseFloat(item.purchase_price) || 0) + (parseFloat(item.markup_amount) || 0);
                          const basePrice = item.quantity * unitPrice;
                          const discountAmount = (basePrice * (item.discount_percentage || 0)) / 100;
                          return (basePrice - discountAmount).toFixed(2);
                        })()}
                        isReadOnly
                        bg="gray.50"
                        fontWeight="medium"
                        size="sm"
                      />
                      {/* SAFE: Added formatted display alongside existing Input - no logic changes */}
                      <FormattedCurrencyDisplay 
                        amount={(() => {
                          const unitPrice = (parseFloat(item.purchase_price) || 0) + (parseFloat(item.markup_amount) || 0);
                          const basePrice = item.quantity * unitPrice;
                          const discountAmount = (basePrice * (item.discount_percentage || 0)) / 100;
                          return basePrice - discountAmount;
                        })()} 
                        currency={formData.currency}
                        fontSize="xs" 
                        color="purple.600" 
                        mt={1}
                      />
                    </FormControl>
                    
                    {/* [2025-01-11] Added - VAT Amount field for enhanced quotation management */}
                    <FormControl flex={1.2} minW="120px">
                      <Input
                        value={(() => {
                          const unitPrice = (parseFloat(item.purchase_price) || 0) + (parseFloat(item.markup_amount) || 0);
                          const basePrice = item.quantity * unitPrice;
                          const discountAmount = (basePrice * (item.discount_percentage || 0)) / 100;
                          const totalPrice = basePrice - discountAmount;
                          const vatAmount = (totalPrice * 15) / 100; // 15% VAT
                          return vatAmount.toFixed(2);
                        })()}
                        isReadOnly
                        bg="orange.50"
                        fontWeight="medium"
                        size="sm"
                        color="orange.700"
                      />
                      <FormattedCurrencyDisplay 
                        amount={(() => {
                          const unitPrice = (parseFloat(item.purchase_price) || 0) + (parseFloat(item.markup_amount) || 0);
                          const basePrice = item.quantity * unitPrice;
                          const discountAmount = (basePrice * (item.discount_percentage || 0)) / 100;
                          const totalPrice = basePrice - discountAmount;
                          const vatAmount = (totalPrice * 15) / 100; // 15% VAT
                          return vatAmount;
                        })()} 
                        currency={formData.currency}
                        fontSize="xs" 
                        color="orange.600" 
                        mt={1}
                      />
                    </FormControl>
                    
                    {/* Actions */}
                    <FormControl flex={0.8} minW="100px">
                      <HStack spacing={1} justify="center">
                        {convertRowType && (
                          <Tooltip label="Convert to Category Header (1, 2, 3...)">
                            <IconButton
                              aria-label="Convert to Header"
                              icon={<FiFolderPlus />}
                              size="sm"
                              variant="ghost"
                              colorScheme="teal"
                              onClick={() => convertRowType(index, true)}
                              isDisabled={isReadOnly}
                            />
                          </Tooltip>
                        )}
                        <IconButton
                          aria-label="Remove item"
                          icon={<FiTrash2 />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => removeQuotationItem(index)}
                          isDisabled={isReadOnly}
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
                isDisabled={isReadOnly}
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
              <Input
                value={formData.subtotal.toFixed(2)}
                isReadOnly
                bg="gray.50"
                fontWeight="medium"
                size="md"
              />
              {/* SAFE: Added formatted display alongside existing Input - no logic changes */}
              <FormattedCurrencyDisplay 
                amount={formData.subtotal} 
                currency={formData.currency}
                fontSize="sm" 
                color="blue.600" 
                mt={1}
              />
            </FormControl>

            <FormControl>
              <FormLabel>VAT Rate (%)</FormLabel>
              <Input
                value="15.00"
                isReadOnly
                bg="gray.50"
                fontWeight="medium"
                size="md"
              />
              <Text fontSize="xs" color="gray.500" mt={1}>
                VAT rate is fixed at 15% as per Saudi regulations
              </Text>
            </FormControl>
          </HStack>

          <HStack spacing={4} w="full">
            <FormControl>
              <FormLabel>VAT Amount</FormLabel>
              <Input
                value={((formData.subtotal * 15) / 100).toFixed(2)}
                isReadOnly
                bg="gray.50"
              />
              {/* SAFE: Added formatted display alongside existing Input - no logic changes */}
              <FormattedCurrencyDisplay 
                amount={(formData.subtotal * 15) / 100} 
                currency={formData.currency}
                fontSize="sm" 
                color="green.600" 
                mt={1}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Total Amount</FormLabel>
              <Input
                value={(formData.subtotal + (formData.subtotal * 15) / 100).toFixed(2)}
                isReadOnly
                bg="gray.50"
                fontWeight="bold"
              />
              {/* SAFE: Added formatted display alongside existing Input - no logic changes */}
              <FormattedCurrencyDisplay 
                amount={formData.subtotal + (formData.subtotal * 15) / 100} 
                currency={formData.currency}
                fontSize="sm" 
                color="red.600" 
                fontWeight="bold"
                mt={1}
              />
            </FormControl>

            <FormControl>
              <FormLabel>
                <HStack spacing={1}>
                  <SaudiRiyalIcon boxSize={4} />
                  <Text>Markup %</Text>
                  <Tooltip label="Global markup percentage. Enter a percentage to apply to all items, or it will show the weighted average of individual markup amounts.">
                    <Text fontSize="xs" color="gray.500">(?)</Text>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <NumberInput
                value={formData.markup_percentage || 0}
                onChange={(value) => {
                  const decimalValue = value === '' ? 0 : parseFloat(value);
                  const markupPercentage = isNaN(decimalValue) ? 0 : decimalValue;
                  setFormData({ ...formData, markup_percentage: markupPercentage });
                  if (onMarkupChange) {
                    onMarkupChange(markupPercentage);
                  }
                }}
                min={0}
                max={100}
                precision={2}
                step={0.01}
                isDisabled={isReadOnly}
                allowMouseWheel
                keepWithinRange={false}
                clampValueOnBlur={false}
              >
                <NumberInputField 
                  placeholder="0.00"
                  onKeyDown={(e) => {
                    // Allow decimal point, backspace, delete, arrow keys, and numbers
                    if (e.key === '.' || e.key === 'Backspace' || e.key === 'Delete' || 
                        e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
                        e.key === 'Tab' || e.key === 'Enter' ||
                        (e.key >= '0' && e.key <= '9')) {
                      // Prevent multiple decimal points
                      if (e.key === '.' && (e.target as HTMLInputElement).value.includes('.')) {
                        e.preventDefault();
                      }
                      return;
                    }
                    e.preventDefault();
                  }}
                  onBlur={(e) => {
                    // Ensure the value is properly formatted on blur
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, markup_percentage: value });
                    if (onMarkupChange) {
                      onMarkupChange(value);
                    }
                  }}
                />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </HStack>


        </VStack>
      </Box>

      <Divider />

      {/* Additional Information */}
      <Box w="full" bg={useColorModeValue('white', 'gray.800')} p={5} borderRadius="lg" borderWidth="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} shadow="sm">
        <HStack justify="space-between" mb={3} wrap="wrap">
          <Box>
            <Heading size="md" color={useColorModeValue('gray.800', 'white')}>Additional Information</Heading>
            <Text fontSize="xs" color="gray.500" mt={0.5}>
              Terms & conditions and additional notes maintain their exact structure (numbers, bullets, key-value pairs) for a standard, executive print display.
            </Text>
          </Box>
        </HStack>

        <Tabs variant="enclosed" colorScheme="blue" isLazy>
          <TabList mb={4}>
            <Tab fontSize="sm" fontWeight="500">
              <HStack spacing={1.5}>
                <Icon as={FiEdit3} />
                <span>Edit Details</span>
              </HStack>
            </Tab>
            <Tab fontSize="sm" fontWeight="500">
              <HStack spacing={1.5}>
                <Icon as={FiEye} />
                <span>Live Print & PDF Preview</span>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <VStack spacing={5} align="stretch">
                {/* Terms & Conditions */}
                <FormControl>
                  <HStack justify="space-between" mb={1.5} wrap="wrap">
                    <FormLabel mb={0} fontSize="sm" fontWeight="600">Terms & Conditions</FormLabel>
                    {!isReadOnly && (
                      <HStack spacing={1.5} wrap="wrap">
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          leftIcon={<Icon as={FiHash} />}
                          onClick={() => {
                            if (formData.terms_conditions) {
                              setFormData({ ...formData, terms_conditions: formatToNumberedList(formData.terms_conditions) });
                            }
                          }}
                          title="Format current lines as a numbered list (1, 2, 3...)"
                        >
                          1, 2, 3 List
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          leftIcon={<Icon as={FiList} />}
                          onClick={() => {
                            if (formData.terms_conditions) {
                              setFormData({ ...formData, terms_conditions: formatToBulletList(formData.terms_conditions) });
                            }
                          }}
                          title="Format current lines as bullet points (•)"
                        >
                          • Bullets
                        </Button>
                        <Button
                          size="xs"
                          variant="solid"
                          colorScheme="blue"
                          leftIcon={<Sparkles style={{ width: '13px', height: '13px' }} />}
                          onClick={() => setIsWizardOpen(true)}
                          title="Open Contract Terms & Conditions Wizard (Helper Guide)"
                        >
                          Terms Wizard
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="purple"
                          leftIcon={<Icon as={FiFileText} />}
                          onClick={() => {
                            setFormData({ ...formData, terms_conditions: getStandardQuotationTerms() });
                            toast.success('Inserted standard quotation terms');
                          }}
                          title="Insert standard trading terms template"
                        >
                          Standard Template
                        </Button>
                        {formData.terms_conditions && (
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => {
                              setFormData({ ...formData, terms_conditions: '' });
                              toast.success('Terms cleared (kept blank)');
                            }}
                            title="Clear terms and conditions (keep blank)"
                          >
                            Clear
                          </Button>
                        )}
                        {onSaveTerms && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="green"
                            leftIcon={<Icon as={FiSave} />}
                            onClick={() => {
                              if (formData.terms_conditions?.trim()) {
                                onSaveTerms(formData.terms_conditions.trim());
                                toast.success('Saved as organization default terms');
                              } else {
                                toast.error('Please enter terms before saving');
                              }
                            }}
                            title="Save current terms as default for future quotations"
                          >
                            Save as Default
                          </Button>
                        )}
                      </HStack>
                    )}
                  </HStack>
                  <Textarea
                    value={formData.terms_conditions}
                    onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                    placeholder="Enter or paste terms & conditions (e.g. 1. Validity: 30 days, 2. Payment Terms: 100% advance...)"
                    rows={5}
                    fontSize="sm"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    whiteSpace="pre-wrap"
                    dir="auto"
                    bg={useColorModeValue('white', 'gray.900')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    isReadOnly={isReadOnly}
                  />
                  <Text fontSize="2xs" color="gray.500" mt={1}>
                    Supports numbered lists (1., 2.), bullet points (•, -), key-value specifications (Key: Value), and multi-line paragraphs.
                  </Text>
                </FormControl>

                {/* Notes */}
                <FormControl>
                  <HStack justify="space-between" mb={1.5} wrap="wrap">
                    <FormLabel mb={0} fontSize="sm" fontWeight="600">Additional Notes / Special Instructions</FormLabel>
                    {!isReadOnly && (
                      <HStack spacing={1.5}>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          leftIcon={<Icon as={FiHash} />}
                          onClick={() => {
                            if (formData.notes) {
                              setFormData({ ...formData, notes: formatToNumberedList(formData.notes) });
                            }
                          }}
                        >
                          1, 2, 3 List
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="blue"
                          leftIcon={<Icon as={FiList} />}
                          onClick={() => {
                            if (formData.notes) {
                              setFormData({ ...formData, notes: formatToBulletList(formData.notes) });
                            }
                          }}
                        >
                          • Bullets
                        </Button>
                      </HStack>
                    )}
                  </HStack>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes, delivery remarks, special client instructions..."
                    rows={3}
                    fontSize="sm"
                    fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    whiteSpace="pre-wrap"
                    dir="auto"
                    bg={useColorModeValue('white', 'gray.900')}
                    borderColor={useColorModeValue('gray.300', 'gray.600')}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    isReadOnly={isReadOnly}
                  />
                </FormControl>
              </VStack>
            </TabPanel>

            <TabPanel p={0}>
              <Box p={4} bg={useColorModeValue('gray.50', 'gray.900')} borderRadius="md" border="1px dashed" borderColor={useColorModeValue('gray.300', 'gray.700')}>
                <Text fontSize="2xs" fontWeight="700" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                  Official Print & PDF Output Preview
                </Text>

                {formData.terms_conditions?.trim() ? (
                  <Box
                    mb={4}
                    p={4}
                    bg={useColorModeValue('white', 'gray.800')}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    borderLeft="4px solid"
                    borderLeftColor="blue.600"
                    shadow="xs"
                  >
                    <Text fontSize="xs" fontWeight="700" color="blue.700" textTransform="uppercase" letterSpacing="0.5px" mb={2} pb={1} borderBottom="1px solid" borderColor="gray.100">
                      Terms & Conditions
                    </Text>
                    <Box
                      fontSize="xs"
                      color={useColorModeValue('gray.700', 'gray.200')}
                      lineHeight="1.5"
                      dangerouslySetInnerHTML={{ __html: formatTermsToHtml(formData.terms_conditions) }}
                    />
                  </Box>
                ) : (
                  <Text fontSize="xs" color="gray.400" fontStyle="italic" mb={3}>
                    No terms & conditions specified.
                  </Text>
                )}

                {formData.notes?.trim() ? (
                  <Box
                    p={4}
                    bg={useColorModeValue('white', 'gray.800')}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={useColorModeValue('gray.200', 'gray.700')}
                    borderLeft="4px solid"
                    borderLeftColor="gray.600"
                    shadow="xs"
                  >
                    <Text fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="0.5px" mb={2} pb={1} borderBottom="1px solid" borderColor="gray.100">
                      Notes & Special Instructions
                    </Text>
                    <Box
                      fontSize="xs"
                      color={useColorModeValue('gray.700', 'gray.200')}
                      lineHeight="1.5"
                      dangerouslySetInnerHTML={{ __html: formatTermsToHtml(formData.notes) }}
                    />
                  </Box>
                ) : null}
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>

      {/* Contract Terms & Conditions Wizard Modal */}
      <ContractTermsWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onApply={(compiledTerms) => {
          setFormData({ ...formData, terms_conditions: compiledTerms });
          setIsWizardOpen(false);
          toast.success('Contract terms applied from wizard!');
        }}
        grandTotal={formData.total_amount || (formData.subtotal + (formData.subtotal * 15) / 100)}
        initialTerms={formData.terms_conditions}
      />
    </VStack>
  );
};

export default QuotationForm;
