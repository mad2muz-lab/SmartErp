import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Button,
  useToast,
  Grid,
  GridItem,
  Divider,
  Text,
  Badge,
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
  useColorModeValue,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Box
} from '@chakra-ui/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { FiPlus, FiTrash2, FiEdit } from 'react-icons/fi';
import { useAuth } from '../../contexts/shared/AuthContext';
import { isConvexOrgId } from '../../utils/accountingUtils';
import FormattedCurrencyDisplay from '../FormattedCurrencyDisplay';
// import SaudiRiyalDisplay from '../SaudiRiyalDisplay';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: any;
  quotations?: any[];
}

interface InvoiceItem {
  item_number: number;
  description: string;
  description_arabic: string;
  quantity: number;
  unit: string; // Add missing unit field
  unit_price: number;
  discount_amount: number;
  discount_percentage: number;
  taxable_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  supply_type: string;
  source?: 'quotation' | 'manual'; // Track item source
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  isOpen,
  onClose,
  invoice,
  quotations = []
}) => {
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_type: 'standard' as 'standard' | 'simplified' | 'credit_note' | 'debit_note',
    invoice_date: new Date().toISOString().split('T')[0],
    supply_date: new Date().toISOString().split('T')[0], // Default to invoice date
    due_date: '',
    customer_id: '',
    customer_name: '',
    customer_name_arabic: '',
    customer_vat_number: '',
    customer_address: '',
    customer_address_arabic: '',
    subtotal: 0,
    total_discount: 0,
    total_vat: 0,
    grand_total: 0,
    currency: 'SAR',
    payment_terms: 'Payment due within 30 days',
    delivery_terms: 'FOB Destination',
    notes: '',
    notes_arabic: '',
    tax_treatment: '',
    tax_treatment_arabic: '',
    is_reverse_charge: false,
    is_self_accounting: false,
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    quotation_id: ''
  });

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { selectedOrganization, organizationDetails, user } = useAuth();
  const toast = useToast();

  const rawOrgId = typeof selectedOrganization === 'string'
    ? selectedOrganization
    : (selectedOrganization?._id || user?.organizationId);
  const isConvexOrg = isConvexOrgId(rawOrgId);

  // Fetch customers safely
  const customers = useQuery(api.customers.listCustomers, 
    isConvexOrg ? { organization_id: rawOrgId as Id<"organizations"> } : "skip"
  );

  // Note: VAT number auto-population is working correctly

  // Fetch inventory items safely
  const inventoryItems = useQuery(api.inventory.listInventory, 
    isConvexOrg ? { organization_id: rawOrgId as Id<"organizations"> } : "skip"
  );

  // Get quotation items query (will be called dynamically)
  const getQuotationItems = useQuery(api.quotations.getQuotationItems, 
    selectedQuotation && isConvexOrg ? { quotation_id: selectedQuotation as any } : "skip"
  );

  // Create/Update invoice mutation using ZATCA-compliant functions
  const createInvoice = useMutation(api.invoiceManagement.createInvoice);
  const updateInvoice = useMutation(api.invoiceManagement.updateInvoiceStatus);

  // Note: VAT compliance is built into the invoice management system

  useEffect(() => {
    if (invoice) {
      // Edit mode - populate form with existing invoice data
      setFormData({
        invoice_number: invoice.invoice_number || '',
        invoice_type: invoice.invoice_type || 'standard',
        invoice_date: invoice.invoice_date ? invoice.invoice_date.split('T')[0] : '',
        supply_date: invoice.supply_date ? invoice.supply_date.split('T')[0] : new Date().toISOString().split('T')[0],
        due_date: invoice.due_date ? invoice.due_date.split('T')[0] : '',
        customer_id: invoice.customer_id || '',
        customer_name: invoice.customer_name || '',
        customer_name_arabic: invoice.customer_name_arabic || '',
        customer_vat_number: invoice.customer_vat_number || '',
        customer_address: invoice.customer_address || '',
        customer_address_arabic: invoice.customer_address_arabic || '',
        subtotal: invoice.subtotal || 0,
        total_discount: invoice.total_discount || 0,
        total_vat: invoice.total_vat || 0,
        grand_total: invoice.grand_total || 0,
        currency: invoice.currency || 'SAR',
        payment_terms: invoice.payment_terms || 'Payment due within 30 days',
        delivery_terms: invoice.delivery_terms || 'FOB Destination',
        notes: invoice.notes || '',
        notes_arabic: invoice.notes_arabic || '',
        tax_treatment: invoice.tax_treatment || '',
        tax_treatment_arabic: invoice.tax_treatment_arabic || '',
        is_reverse_charge: invoice.is_reverse_charge || false,
        is_self_accounting: invoice.is_self_accounting || false,
        status: invoice.status || 'draft'
      });
    } else {
      // Create mode - set defaults
      setFormData(prev => ({
        ...prev,
        invoice_number: generateInvoiceNumber(),
        currency: organizationDetails?.currency || 'SAR'
      }));
    }
  }, [invoice, organizationDetails]);

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers?.find(c => c._id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId,
        customer_name: customer.customer_company_name || customer.customer_name || '',
        customer_name_arabic: customer.customer_company_name_arabic || '',
        customer_vat_number: customer.vat_number || '',
        customer_address: customer.address || '',
        customer_address_arabic: customer.address_arabic || ''
      }));
    }
  };

  const handleQuotationChange = async (quotationId: string) => {
    if (quotationId) {
      const quotation = quotations.find(q => q._id === quotationId);
      if (quotation) {
        // Populate customer from quotation
        handleCustomerChange(quotation.customer_id);
        
        // Set due date (30 days from invoice date)
        const dueDate = new Date(formData.invoice_date);
        dueDate.setDate(dueDate.getDate() + 30);
        setFormData(prev => ({
          ...prev,
          due_date: dueDate.toISOString().split('T')[0],
          quotation_id: quotationId
        }));

        // Set selected quotation to trigger the query
        setSelectedQuotation(quotationId);
      }
    } else {
      // Clear quotation items when no quotation is selected
      setInvoiceItems([]);
      setSelectedQuotation('');
      setFormData(prev => ({
        ...prev,
        quotation_id: ''
      }));
    }
  };

  // Effect to load quotation items when selectedQuotation changes
  React.useEffect(() => {
    if (getQuotationItems && getQuotationItems.length > 0) {
      // Convert quotation items to invoice item format (filter out non-billable section headers)
      const convertedItems: InvoiceItem[] = getQuotationItems
        .filter((item: any) => !item.is_section_header && (item.quantity > 0 || item.unit_price > 0))
        .map((item: any, index: number) => ({
          item_number: index + 1,
          description: item.wbs_code 
            ? `[${item.wbs_code}] ${item.item_name || item.item_title || 'Item'}` 
            : (item.item_name || item.item_title || 'Item'),
          description_arabic: item.item_name_arabic || item.item_name || 'عنصر',
          quantity: item.quantity,
          unit: item.unit || 'pcs',
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          discount_percentage: item.discount_percentage || 0,
          taxable_amount: item.total_price - (item.discount_amount || 0),
          vat_rate: 15, // Default VAT rate
          vat_amount: item.vat_amount || ((item.total_price - (item.discount_amount || 0)) * 0.15),
          total_amount: (item.total_price - (item.discount_amount || 0)) + (item.vat_amount || ((item.total_price - (item.discount_amount || 0)) * 0.15)),
          supply_type: 'standard',
          source: 'quotation' // Mark as quotation item
        }));

      // Load quotation items into the form
      setInvoiceItems(convertedItems);
      calculateTotals(convertedItems);

      // Find the quotation to get its number for the toast
      const quotation = quotations.find(q => q._id === selectedQuotation);
      if (quotation) {
        toast({
          title: "Quotation Items Loaded",
          description: `Loaded ${convertedItems.length} items from quotation ${quotation.quotation_number}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [getQuotationItems, selectedQuotation, quotations, toast]);

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      item_number: invoiceItems.length + 1,
      description: '',
      description_arabic: '',
      quantity: 1,
      unit: 'pcs', // Default unit for manual items
      unit_price: 0,
      discount_amount: 0,
      discount_percentage: 0,
      taxable_amount: 0,
      vat_rate: 15,
      vat_amount: 0,
      total_amount: 0,
      supply_type: 'standard',
      source: 'manual' // Mark as manually added item
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amounts
    const item = updatedItems[index];
    const lineTotal = item.unit_price * item.quantity;
    
    // Calculate discount amount from percentage if percentage is provided
    if (item.discount_percentage && item.discount_percentage > 0) {
      item.discount_amount = (lineTotal * item.discount_percentage) / 100;
    }
    
    item.taxable_amount = lineTotal - (item.discount_amount || 0);
    item.vat_amount = (item.taxable_amount * item.vat_rate) / 100;
    item.total_amount = item.taxable_amount + item.vat_amount;
    
    setInvoiceItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const removeInvoiceItem = (index: number) => {
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    // Renumber items
    updatedItems.forEach((item, i) => {
      item.item_number = i + 1;
    });
    setInvoiceItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.taxable_amount, 0);
    const totalDiscount = items.reduce((sum, item) => sum + item.discount_amount, 0);
    const totalVat = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const grandTotal = subtotal + totalVat;

    setFormData(prev => ({
      ...prev,
      subtotal,
      total_discount: totalDiscount,
      total_vat: totalVat,
      grand_total: grandTotal
    }));
  };

  const handleSubmit = async () => {
    if (!selectedOrganization) {
      toast({
        title: "Error",
        description: "Please select an organization",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!formData.customer_id) {
      toast({
        title: "Error",
        description: "Please select a customer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (invoiceItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate required fields
    if (!formData.payment_terms || !formData.delivery_terms) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Payment Terms, Delivery Terms)",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const invoiceData = {
        ...formData,
        organization_id: selectedOrganization,
        created_by: user?.email || 'system' // Use actual user email
        // Note: created_at and updated_at are handled by the backend
      };

      if (invoice) {
        // Update existing invoice
        await updateInvoice({
          invoice_id: invoice._id,
          status: invoiceData.status
        });
        toast({
          title: "Invoice Updated",
          description: "Invoice has been updated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new invoice
        console.log('Creating invoice with data:', {
          ...invoiceData,
          items: invoiceItems.map(item => {
            // Remove frontend-only calculated fields
            const { 
              item_number, 
              taxable_amount, 
              vat_amount, 
              total_amount,
              discount_amount, // Remove discount_amount as it's not accepted by deployed backend
              source, // Remove source field as it's frontend-only
              ...itemForBackend 
            } = item;
            return itemForBackend;
          })
        });

        const result = await createInvoice({
          // Only send fields that the backend validator expects
          organization_id: invoiceData.organization_id,
          quotation_id: invoiceData.quotation_id,
          reference_type: "standalone", // Set as standalone invoice
          invoice_type: invoiceData.invoice_type,
          customer_id: invoiceData.customer_id,
          invoice_date: invoiceData.invoice_date,
          supply_date: invoiceData.supply_date,
          due_date: invoiceData.due_date,
          payment_terms: invoiceData.payment_terms,
          delivery_terms: invoiceData.delivery_terms,
          notes: invoiceData.notes,
          notes_arabic: invoiceData.notes_arabic,
          is_reverse_charge: invoiceData.is_reverse_charge,
          is_self_accounting: invoiceData.is_self_accounting,
          tax_treatment: invoiceData.tax_treatment,
          tax_treatment_arabic: invoiceData.tax_treatment_arabic,
          created_by: invoiceData.created_by,
          // Add required fields for deployed version
          currency: "SAR",
          customer_address: formData.customer_address || "Default Address",
          customer_name: formData.customer_name || "Default Customer",
          customer_name_arabic: formData.customer_name_arabic || "عميل افتراضي",
          grand_total: invoiceItems.reduce((sum, item) => sum + (item.total_amount || 0), 0),
          subtotal: invoiceItems.reduce((sum, item) => sum + (item.taxable_amount || 0), 0),
          total_vat: invoiceItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0),
          vat_rate: 15.0,
          status: "draft",
          items: invoiceItems.map(item => {
            // Remove frontend-only calculated fields
            const { 
              item_number, 
              taxable_amount, 
              vat_amount, 
              total_amount,
              discount_amount, // Remove discount_amount as it's not accepted by deployed backend
              source, // Remove source field as it's frontend-only
              ...itemForBackend 
            } = item;
            return itemForBackend;
          })
        });

        console.log('Invoice creation result:', result);

        // Handle both success object and direct ID response
        if (result.success || (typeof result === 'string' && result.length > 0)) {
          toast({
            title: "Invoice Created",
            description: "Invoice has been created successfully",
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } else {
          throw new Error(result.message || 'Failed to create invoice');
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save invoice",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Using SaudiRiyalDisplay component for proper currency formatting

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay />
      <ModalContent maxH="95vh" maxW="95vw" w="95vw" overflowY="auto">
        <ModalHeader>
          {invoice ? 'Edit Invoice' : 'Create New Invoice'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody p={8}>
          <VStack spacing={8} align="stretch">
            {/* Invoice Header */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
              <FormControl>
                <FormLabel>Invoice Number</FormLabel>
                <Input
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="Auto-generated"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Invoice Type</FormLabel>
                <Select
                  value={formData.invoice_type}
                  onChange={(e) => setFormData({ ...formData, invoice_type: e.target.value as any })}
                >
                  <option value="standard">Standard Invoice</option>
                  <option value="simplified">Simplified Invoice</option>
                  <option value="credit_note">Credit Note</option>
                  <option value="debit_note">Debit Note</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Status</FormLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </FormControl>
            </Grid>

            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
              <FormControl>
                <FormLabel>Invoice Date</FormLabel>
                <Input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Supply Date</FormLabel>
                <Input
                  type="date"
                  value={formData.supply_date}
                  onChange={(e) => setFormData({ ...formData, supply_date: e.target.value })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Due Date</FormLabel>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </FormControl>
            </Grid>

            {/* Customer Selection */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
              <FormControl>
                <FormLabel>Customer</FormLabel>
                <Select
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  placeholder="Select customer"
                >
                  {customers?.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.customer_company_name || customer.customer_name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Create from Quotation</FormLabel>
                <Select
                  value={selectedQuotation}
                  onChange={(e) => handleQuotationChange(e.target.value)}
                  placeholder="Select quotation (optional)"
                >
                  {quotations.map((quotation) => (
                    <option key={quotation._id} value={quotation._id}>
                      {quotation.quotation_number} - {quotation.customer_name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Customer Details */}
            {formData.customer_name && (
              <Card>
                <CardBody>
                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="bold">Customer Details</Text>
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
                      <FormControl>
                        <FormLabel>Customer Name (Arabic)</FormLabel>
                        <Input
                          value={formData.customer_name_arabic}
                          onChange={(e) => setFormData({ ...formData, customer_name_arabic: e.target.value })}
                          placeholder="اسم العميل بالعربية"
                          dir="rtl"
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>VAT Number</FormLabel>
                        <Input
                          value={formData.customer_vat_number}
                          onChange={(e) => setFormData({ ...formData, customer_vat_number: e.target.value })}
                          placeholder="VAT number"
                        />
                      </FormControl>
                    </Grid>

                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                      <FormControl>
                        <FormLabel>Address (Arabic)</FormLabel>
                        <Textarea
                          value={formData.customer_address_arabic}
                          onChange={(e) => setFormData({ ...formData, customer_address_arabic: e.target.value })}
                          placeholder="العنوان بالعربية"
                          dir="rtl"
                          rows={2}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel>Reverse Charge</FormLabel>
                        <Select
                          value={formData.is_reverse_charge.toString()}
                          onChange={(e) => setFormData({ ...formData, is_reverse_charge: e.target.value === 'true' })}
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </Select>
                      </FormControl>
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>
            )}

            <Divider />

            {/* Invoice Items */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontWeight="bold">Invoice Items</Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  leftIcon={<FiPlus />}
                  onClick={addInvoiceItem}
                >
                  Add Item
                </Button>
              </HStack>

              {invoiceItems.length > 0 ? (
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>#</Th>
                        <Th>Source</Th>
                        <Th>Description</Th>
                        <Th>Qty</Th>
                        <Th>Unit</Th>
                        <Th>Unit Price</Th>
                        <Th>Discount</Th>
                        <Th>VAT %</Th>
                        <Th>Total</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {invoiceItems.map((item, index) => (
                        <Tr key={index}>
                          <Td>{item.item_number}</Td>
                          <Td>
                            <Badge 
                              colorScheme={item.source === 'quotation' ? 'blue' : 'green'} 
                              size="sm"
                            >
                              {item.source === 'quotation' ? 'From Quote' : 'Manual'}
                            </Badge>
                          </Td>
                          <Td>
                            <VStack align="stretch" spacing={1}>
                              <Input
                                size="sm"
                                value={item.description}
                                onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                                placeholder="Item description"
                              />
                              <Input
                                size="sm"
                                value={item.description_arabic}
                                onChange={(e) => updateInvoiceItem(index, 'description_arabic', e.target.value)}
                                placeholder="الوصف بالعربية"
                                dir="rtl"
                              />
                            </VStack>
                          </Td>
                          <Td>
                            <NumberInput
                              size="sm"
                              value={item.quantity}
                              onChange={(value) => updateInvoiceItem(index, 'quantity', Number(value))}
                              min={0}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </Td>
                          <Td>
                            <Input
                              size="sm"
                              value={item.unit}
                              onChange={(e) => updateInvoiceItem(index, 'unit', e.target.value)}
                              placeholder="pcs"
                              width="60px"
                            />
                          </Td>
                          <Td>
                            <NumberInput
                              size="sm"
                              value={item.unit_price}
                              onChange={(value) => updateInvoiceItem(index, 'unit_price', Number(value))}
                              min={0}
                              precision={2}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </Td>
                          <Td>
                            <VStack spacing={1}>
                              <NumberInput
                                size="sm"
                                value={item.discount_percentage}
                                onChange={(value) => updateInvoiceItem(index, 'discount_percentage', Number(value))}
                                min={0}
                                max={100}
                                precision={2}
                              >
                                <NumberInputField placeholder="%" />
                              </NumberInput>
                              <Text fontSize="xs" color="gray.500">
                                {item.discount_amount ? <FormattedCurrencyDisplay amount={item.discount_amount} currency={organizationDetails?.currency || 'SAR'} /> : ''}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <NumberInput
                              size="sm"
                              value={item.vat_rate}
                              onChange={(value) => updateInvoiceItem(index, 'vat_rate', Number(value))}
                              min={0}
                              max={100}
                              precision={2}
                            >
                              <NumberInputField />
                            </NumberInput>
                          </Td>
                          <Td fontWeight="medium">
                            <Text color="green.600" fontWeight="bold">
                              <FormattedCurrencyDisplay amount={item.total_amount || 0} currency={organizationDetails?.currency || 'SAR'} />
                            </Text>
                          </Td>
                          <Td>
                            <IconButton
                              aria-label="Remove item"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeInvoiceItem(index)}
                            />
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Text color="gray.500" textAlign="center" py={4}>
                  No items added. Click "Add Item" to start.
                </Text>
              )}
            </Box>

            <Divider />

            {/* Summary */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={8}>
              <Box>
                <Text fontWeight="bold" mb={4} fontSize="lg">Terms & Notes</Text>
                <VStack align="stretch" spacing={4}>
                  <FormControl>
                    <FormLabel>Payment Terms</FormLabel>
                    <Input
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Delivery Terms</FormLabel>
                    <Input
                      value={formData.delivery_terms}
                      onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes</FormLabel>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Notes (Arabic)</FormLabel>
                    <Textarea
                      value={formData.notes_arabic}
                      onChange={(e) => setFormData({ ...formData, notes_arabic: e.target.value })}
                      placeholder="ملاحظات بالعربية"
                      dir="rtl"
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tax Treatment (if not standard 15%)</FormLabel>
                    <Input
                      value={formData.tax_treatment || ''}
                      onChange={(e) => setFormData({ ...formData, tax_treatment: e.target.value })}
                      placeholder="e.g., Zero-rated, Exempt, etc."
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Tax Treatment (Arabic)</FormLabel>
                    <Input
                      value={formData.tax_treatment_arabic || ''}
                      onChange={(e) => setFormData({ ...formData, tax_treatment_arabic: e.target.value })}
                      placeholder="المعاملة الضريبية بالعربية"
                      dir="rtl"
                    />
                  </FormControl>
                </VStack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={4} fontSize="lg">Invoice Summary</Text>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Text>Subtotal:</Text>
                    <Text color="green.600" fontWeight="bold">
                      <FormattedCurrencyDisplay amount={formData.subtotal || 0} currency={organizationDetails?.currency || 'SAR'} />
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Total Discount:</Text>
                    <Text color="red.500">
                      -<FormattedCurrencyDisplay amount={formData.total_discount || 0} currency={organizationDetails?.currency || 'SAR'} />
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Total VAT:</Text>
                    <Text color="blue.600" fontWeight="bold">
                      <FormattedCurrencyDisplay amount={formData.total_vat || 0} currency={organizationDetails?.currency || 'SAR'} />
                    </Text>
                  </HStack>
                  <Divider />
                  <HStack justify="space-between" fontWeight="bold">
                    <Text>Grand Total:</Text>
                    <Text color="green.600" fontSize="lg" fontWeight="bold">
                      <FormattedCurrencyDisplay amount={formData.grand_total || 0} currency={organizationDetails?.currency || 'SAR'} />
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </Grid>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={isLoading}
            >
              {invoice ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InvoiceForm;
