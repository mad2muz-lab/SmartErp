import React from 'react';
import {
  VStack,
  HStack,
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
  Badge,
  Divider,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
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

interface Step4ReviewProps {
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
}

const Step4Review: React.FC<Step4ReviewProps> = ({
  formData,
  setFormData
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'sent': return 'blue';
      case 'paid': return 'green';
      case 'overdue': return 'red';
      default: return 'gray';
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Text fontSize="lg" fontWeight="bold" color="blue.600">
        Step 4: Review & Submit
      </Text>
      
      {/* Invoice Summary */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="md" fontWeight="semibold">Invoice Summary</Text>
            
            <HStack spacing={8} wrap="wrap">
              <Stat>
                <StatLabel>Invoice Number</StatLabel>
                <StatNumber fontSize="lg">{formData.invoice_number}</StatNumber>
              </Stat>
              
              <Stat>
                <StatLabel>Customer</StatLabel>
                <StatNumber fontSize="lg">{formData.customer_name}</StatNumber>
              </Stat>
              
              <Stat>
                <StatLabel>Status</StatLabel>
                <StatNumber>
                  <Badge colorScheme={getStatusColor(formData.status)} size="lg">
                    {formData.status.toUpperCase()}
                  </Badge>
                </StatNumber>
              </Stat>
              
              <Stat>
                <StatLabel>Currency</StatLabel>
                <StatNumber fontSize="lg">{formData.currency}</StatNumber>
              </Stat>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="md" fontWeight="semibold">Invoice Details</Text>
            
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Invoice Date:</Text>
                <Text>{formatDate(formData.invoice_date)}</Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Due Date:</Text>
                <Text>{formatDate(formData.due_date)}</Text>
              </HStack>
              
              
              {formData.description && (
                <HStack justify="space-between" align="start">
                  <Text fontWeight="medium">Description:</Text>
                  <Text textAlign="right" maxW="60%">{formData.description}</Text>
                </HStack>
              )}
              
              {formData.terms_conditions && (
                <HStack justify="space-between" align="start">
                  <Text fontWeight="medium">Terms & Conditions:</Text>
                  <Text textAlign="right" maxW="60%">{formData.terms_conditions}</Text>
                </HStack>
              )}
              
              {formData.notes && (
                <HStack justify="space-between" align="start">
                  <Text fontWeight="medium">Notes:</Text>
                  <Text textAlign="right" maxW="60%">{formData.notes}</Text>
                </HStack>
              )}
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Items Review */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="md" fontWeight="semibold">
              Invoice Items ({formData.items.length} items)
            </Text>
            
            <TableContainer overflowX="auto" maxW="100%">
              <Table size="sm" variant="simple" minW="1000px">
                <Thead>
                  <Tr>
                    <Th minW="60px">#</Th>
                    <Th minW="200px">Description</Th>
                    <Th minW="80px">Qty</Th>
                    <Th minW="80px">Unit</Th>
                    <Th minW="120px">Unit Price</Th>
                    <Th minW="100px">Discount</Th>
                    <Th minW="100px">VAT Rate</Th>
                    <Th minW="120px">Total</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {formData.items.map((item, index) => (
                    <Tr key={item.id}>
                      <Td>{index + 1}</Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="medium">
                            {item.description}
                          </Text>
                          {item.description_arabic && (
                            <Text fontSize="xs" color="gray.500">
                              {item.description_arabic}
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>{item.quantity}</Td>
                      <Td>{item.unit}</Td>
                      <Td className="invoice-currency-sar">
                        {formatCurrencyDisplay(item.unit_price, formData.currency as any)}
                      </Td>
                      <Td>{item.discount_percentage}%</Td>
                      <Td>
                        <Badge colorScheme="blue" size="sm">
                          {item.vat_rate}%
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontWeight="bold" className="invoice-currency-sar">
                          {formatCurrencyDisplay(item.total_price || 0, formData.currency as any)}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </VStack>
        </CardBody>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontSize="md" fontWeight="semibold">Financial Summary</Text>
            
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Subtotal:</Text>
                <Text fontSize="lg" fontWeight="bold" className="invoice-currency-sar">
                  {formatCurrencyDisplay(formData.subtotal, formData.currency as any)}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">VAT ({formData.vat_rate}%):</Text>
                <Text fontSize="lg" fontWeight="bold" className="invoice-currency-sar">
                  {formatCurrencyDisplay(formData.vat_amount, formData.currency as any)}
                </Text>
              </HStack>
              
              <Divider />
              
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="bold">Total Amount:</Text>
                <Text fontSize="xl" fontWeight="bold" className="invoice-currency-sar">
                  {formatCurrencyDisplay(formData.total_amount, formData.currency as any)}
                </Text>
              </HStack>
              
              <HStack justify="space-between">
                <Text fontWeight="medium">Markup Percentage:</Text>
                <Text fontSize="lg" fontWeight="bold">
                  {formData.markup_percentage.toFixed(2)}%
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Confirmation Alert */}
      <Alert status="info">
        <AlertIcon />
        <Box>
          <AlertTitle>Ready to Create Invoice!</AlertTitle>
          <AlertDescription>
            Please review all the information above carefully. Once you click "Create Invoice", 
            the invoice will be created and cannot be undone.
          </AlertDescription>
        </Box>
      </Alert>
    </VStack>
  );
};

export default Step4Review;
