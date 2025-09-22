import React, { useEffect } from 'react';
import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Input,
  Text,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Box,
  Badge,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tooltip,
  Button
} from '@chakra-ui/react';
import { FiDollarSign } from 'react-icons/fi';
import { formatCurrencyDisplay } from '../../../utils/invoiceCurrencyUtils';

interface InvoiceItem {
  id: string;
  description: string;
  description_arabic: string;
  quantity: number;
  unit: string;
  unit_price: number;
  discount_percentage: number;
  vat_rate: number;
  supply_type: string;
  supply_type_arabic: string;
  is_zero_rated: boolean;
  is_exempt: boolean;
  inventory_id?: string;
  sku?: string;
  purchase_price?: number;
  markup_amount?: number;
  inventory_name?: string;
  notes?: string;
  total_price?: number;
  vat_amount?: number;
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

interface Step3FinancialProps {
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
}

const Step3Financial: React.FC<Step3FinancialProps> = ({
  formData,
  setFormData
}) => {
  const currencies = [
    { value: 'SAR', label: 'Saudi Riyal (ر.س)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'GBP', label: 'British Pound (£)' },
    { value: 'CAD', label: 'Canadian Dollar (C$)' }
  ];

  // Calculate totals whenever items change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => {
      const itemTotal = item.total_price || (item.quantity * item.unit_price);
      return sum + itemTotal;
    }, 0);

    const vatAmount = formData.items.reduce((sum, item) => {
      const itemVat = item.vat_amount || 0;
      return sum + itemVat;
    }, 0);

    const totalAmount = subtotal + vatAmount;

    // Calculate markup percentage
    let totalPurchaseAmount = 0;
    let totalMarkupAmount = 0;
    
    formData.items.forEach(item => {
      const purchaseAmount = (item.purchase_price || 0) * item.quantity;
      const markupAmount = (item.markup_amount || 0) * item.quantity;
      totalPurchaseAmount += purchaseAmount;
      totalMarkupAmount += markupAmount;
    });
    
    const markupPercentage = totalPurchaseAmount > 0 ? (totalMarkupAmount / totalPurchaseAmount) * 100 : 0;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      vat_amount: vatAmount,
      total_amount: totalAmount,
      markup_percentage: markupPercentage
    }));
  }, [formData.items, setFormData]);

  const handleInputChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyMarkupPercentage = () => {
    const markupPercentage = formData.markup_percentage;
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const purchasePrice = item.purchase_price || 0;
        const markupAmount = purchasePrice * (markupPercentage / 100);
        const unitPrice = purchasePrice + markupAmount;
        
        // Recalculate totals
        const taxableAmount = item.quantity * unitPrice * (1 - item.discount_percentage / 100);
        const vatAmount = taxableAmount * (item.vat_rate / 100);
        const totalPrice = taxableAmount + vatAmount;
        
        return {
          ...item,
          markup_amount: markupAmount,
          unit_price: unitPrice,
          vat_amount: vatAmount,
          total_price: totalPrice
        };
      })
    }));
  };

  const calculateMarkupTotals = () => {
    if (formData.items.length === 0) return { totalMarkupAmount: 0, totalPurchaseAmount: 0, markupPercentage: 0 };
    
    let totalPurchaseAmount = 0;
    let totalMarkupAmount = 0;
    
    formData.items.forEach(item => {
      const purchaseAmount = (item.purchase_price || 0) * item.quantity;
      const markupAmount = (item.markup_amount || 0) * item.quantity;
      totalPurchaseAmount += purchaseAmount;
      totalMarkupAmount += markupAmount;
    });
    
    const markupPercentage = totalPurchaseAmount > 0 ? (totalMarkupAmount / totalPurchaseAmount) * 100 : 0;
    
    return { totalMarkupAmount, totalPurchaseAmount, markupPercentage };
  };

  const { totalMarkupAmount, totalPurchaseAmount, markupPercentage } = calculateMarkupTotals();

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="lg" fontWeight="bold" color="blue.600">
        Step 3: Financial Information
      </Text>
      
      <Card>
        <CardBody>
          <VStack spacing={6} align="stretch">
            {/* Currency Selection */}
            <FormControl>
              <FormLabel>Currency</FormLabel>
              <Select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                size="lg"
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </Select>
            </FormControl>

            {/* Financial Summary */}
            <Box>
              <Text fontSize="md" fontWeight="semibold" mb={4}>
                Financial Summary
              </Text>
              
              <VStack spacing={4} align="stretch">
                {/* Purchase Amount */}
                <HStack justify="space-between">
                  <Text fontWeight="medium">Purchase Amount:</Text>
                  <VStack align="end" spacing={0}>
                    <Input
                      value={totalPurchaseAmount.toFixed(2)}
                      isReadOnly
                      size="sm"
                      w={32}
                      textAlign="right"
                    />
                    <Text fontSize="xs" className="invoice-currency-sar">
                      {formatCurrencyDisplay(totalPurchaseAmount, formData.currency as any)}
                    </Text>
                  </VStack>
                </HStack>

                {/* Markup Amount */}
                <HStack justify="space-between">
                  <Text fontWeight="medium">Markup Amount:</Text>
                  <VStack align="end" spacing={0}>
                    <Input
                      value={totalMarkupAmount.toFixed(2)}
                      isReadOnly
                      size="sm"
                      w={32}
                      textAlign="right"
                    />
                    <Text fontSize="xs" className="invoice-currency-sar">
                      {formatCurrencyDisplay(totalMarkupAmount, formData.currency as any)}
                    </Text>
                  </VStack>
                </HStack>

                {/* Subtotal */}
                <HStack justify="space-between">
                  <Text fontWeight="medium">Subtotal:</Text>
                  <VStack align="end" spacing={0}>
                    <Input
                      value={formData.subtotal.toFixed(2)}
                      isReadOnly
                      size="sm"
                      w={32}
                      textAlign="right"
                    />
                    <Text fontSize="xs" className="invoice-currency-sar">
                      {formatCurrencyDisplay(formData.subtotal, formData.currency as any)}
                    </Text>
                  </VStack>
                </HStack>

                {/* VAT Rate */}
                <HStack justify="space-between">
                  <Text fontWeight="medium">VAT Rate:</Text>
                  <Badge colorScheme="blue" fontSize="sm">
                    {formData.vat_rate}%
                  </Badge>
                </HStack>

                {/* VAT Amount */}
                <HStack justify="space-between">
                  <Text fontWeight="medium">VAT Amount:</Text>
                  <VStack align="end" spacing={0}>
                    <Input
                      value={formData.vat_amount.toFixed(2)}
                      isReadOnly
                      size="sm"
                      w={32}
                      textAlign="right"
                    />
                    <Text fontSize="xs" className="invoice-currency-sar">
                      {formatCurrencyDisplay(formData.vat_amount, formData.currency as any)}
                    </Text>
                  </VStack>
                </HStack>

                <Divider />

                {/* Total Amount */}
                <HStack justify="space-between">
                  <Text fontWeight="bold" fontSize="lg">Total Amount:</Text>
                  <VStack align="end" spacing={0}>
                    <Input
                      value={formData.total_amount.toFixed(2)}
                      isReadOnly
                      size="md"
                      w={36}
                      textAlign="right"
                      fontWeight="bold"
                      bg="blue.50"
                    />
                    <Text fontSize="sm" fontWeight="bold" className="invoice-currency-sar">
                      {formatCurrencyDisplay(formData.total_amount, formData.currency as any)}
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Markup Percentage */}
            <FormControl>
              <FormLabel>
                <HStack>
                  <Text>Markup Percentage</Text>
                  <Tooltip label="Set markup percentage to apply to all items">
                    <Box>
                      <FiDollarSign />
                    </Box>
                  </Tooltip>
                </HStack>
              </FormLabel>
              <VStack spacing={3} align="stretch">
                <HStack spacing={4}>
                  <NumberInput
                    value={formData.markup_percentage}
                    onChange={(_, value) => handleInputChange('markup_percentage', value)}
                    min={0}
                    max={1000}
                    step={0.1}
                    precision={2}
                    w={32}
                    size="lg"
                  >
                    <NumberInputField textAlign="right" fontWeight="bold" />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Button
                    colorScheme="blue"
                    onClick={applyMarkupPercentage}
                    size="lg"
                    isDisabled={formData.items.length === 0}
                  >
                    Apply Markup
                  </Button>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Set markup percentage and click "Apply Markup" to update all items
                </Text>
              </VStack>
            </FormControl>

            {/* Items Summary */}
            {formData.items.length > 0 && (
              <Box>
                <Text fontSize="md" fontWeight="semibold" mb={3}>
                  Items Summary ({formData.items.length} items)
                </Text>
                
                <VStack spacing={2} align="stretch">
                  {formData.items.map((item, index) => (
                    <HStack key={item.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {index + 1}. {item.description}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {item.quantity} {item.unit} × {formatCurrencyDisplay(item.unit_price, formData.currency as any)}
                        </Text>
                        <Text fontSize="xs" color="blue.600">
                          Purchase: {formatCurrencyDisplay(item.purchase_price || 0, formData.currency as any)} | 
                          Markup: {formatCurrencyDisplay(item.markup_amount || 0, formData.currency as any)} 
                          ({item.purchase_price ? ((item.markup_amount || 0) / item.purchase_price * 100).toFixed(1) : 0}%)
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Text fontSize="sm" fontWeight="bold" className="invoice-currency-sar">
                          {formatCurrencyDisplay(item.total_price || 0, formData.currency as any)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          VAT: {formatCurrencyDisplay(item.vat_amount || 0, formData.currency as any)}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default Step3Financial;
