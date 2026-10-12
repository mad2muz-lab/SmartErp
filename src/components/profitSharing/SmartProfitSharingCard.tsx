import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Badge,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Input,
  Select,
  Button,
  useColorModeValue,
  Progress,
  Alert,
  AlertIcon,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { FiDollarSign, FiPercent, FiTrendingUp, FiUsers, FiActivity } from 'react-icons/fi';

interface SmartProfitSharingData {
  id: string;
  quotation_id?: string;
  quotation_number: string;
  customer_name: string;
  status: string;
  
  // Input Data
  order_value: number;
  markup_percentage: number;
  
  // Calculated Input VAT
  total_purchase: number;
  input_vat_paid: number;
  
  // Output Data (from quotation)
  total_sale: number;
  output_vat_received: number;
  
  // VAT Balance
  vat_balance: number;
  
  // Deductions
  saudi_sponsor_percentage: number;
  saudi_sponsor_amount: number;
  referral_percentage: number;
  referral_amount: number;
  investor_percentage: number;
  investor_amount: number;
  
  // Zakat
  zakat: number;
  
  // Expenses
  expenses: number;
  
  // Final Calculations
  net_profit: number;
  
  // Partner Distribution
  partner_1_name: string;
  partner_1_amount: number;
  partner_2_name: string;
  partner_2_amount: number;
  partner_3_name: string;
  partner_3_amount: number;
  
  payment_status: 'Paid' | 'Due';
}

interface SmartProfitSharingCardProps {
  data: SmartProfitSharingData;
  onUpdate: (data: SmartProfitSharingData) => void;
  partners?: Array<{ name: string; role: string; profit_percentage: number }>;
}

export const SmartProfitSharingCard: React.FC<SmartProfitSharingCardProps> = ({
  data,
  onUpdate,
  partners = []
}) => {
  const [localData, setLocalData] = useState<SmartProfitSharingData>(data);
  const [isEditing, setIsEditing] = useState(false);
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  
  // Smart Calculation Engine
  const calculateAll = (inputData: SmartProfitSharingData): SmartProfitSharingData => {
    const calculated = { ...inputData };
    
    // Step 1: Calculate Input VAT and Total Purchase
    const markupMultiplier = 1 + (calculated.markup_percentage / 100);
    calculated.total_purchase = Math.round((calculated.order_value / markupMultiplier) * 100) / 100;
    calculated.input_vat_paid = Math.round((calculated.total_purchase * 0.15) * 100) / 100;
    
    // Step 2: Calculate Output VAT and Total Sale
    calculated.output_vat_received = Math.round((calculated.order_value * 0.15) * 100) / 100;
    calculated.total_sale = Math.round((calculated.order_value + calculated.output_vat_received) * 100) / 100;
    
    // Step 3: Calculate VAT Balance
    calculated.vat_balance = Math.round((calculated.output_vat_received - calculated.input_vat_paid) * 100) / 100;
    
    // Step 4: Calculate Deductions
    calculated.saudi_sponsor_amount = Math.round((calculated.order_value * calculated.saudi_sponsor_percentage / 100) * 100) / 100;
    calculated.referral_amount = Math.round((calculated.order_value * calculated.referral_percentage / 100) * 100) / 100;
    calculated.investor_amount = Math.round((calculated.order_value * calculated.investor_percentage / 100) * 100) / 100;
    
    // Step 5: Calculate Profit
    const profit = Math.round((calculated.order_value - calculated.total_purchase) * 100) / 100;
    
    // Step 6: Calculate Zakat (2.5% of profit after deductions)
    const profitAfterDeductions = profit - calculated.saudi_sponsor_amount - calculated.referral_amount - calculated.investor_amount;
    calculated.zakat = Math.round((profitAfterDeductions * 0.025) * 100) / 100;
    
    // Step 7: Calculate Net Profit
    calculated.net_profit = Math.round((profitAfterDeductions - calculated.zakat - calculated.expenses) * 100) / 100;
    
    // Step 8: Calculate Partner Distribution (Equal split)
    const activePartners = partners.filter(p => p.role === 'business_partner').length || 3;
    const partnerShare = Math.round((calculated.net_profit / activePartners) * 100) / 100;
    
    calculated.partner_1_amount = partnerShare;
    calculated.partner_2_amount = activePartners > 1 ? partnerShare : 0;
    calculated.partner_3_amount = activePartners > 2 ? partnerShare : 0;
    
    return calculated;
  };
  
  // Update local data and trigger calculations
  const updateField = (field: keyof SmartProfitSharingData, value: any) => {
    const updated = { ...localData, [field]: value };
    const calculated = calculateAll(updated);
    setLocalData(calculated);
    onUpdate(calculated);
  };
  
  // Auto-calculate when data changes
  useEffect(() => {
    const calculated = calculateAll(localData);
    setLocalData(calculated);
  }, [localData.order_value, localData.markup_percentage, localData.expenses]);
  
  const formatCurrency = (amount: number) => 
    `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'green';
      case 'due': return 'red';
      case 'delivered': return 'blue';
      default: return 'gray';
    }
  };
  
  return (
    <Card bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="lg" shadow="md">
      <CardHeader pb={2}>
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="md" color="blue.600">
              {localData.quotation_number || 'New Quotation'}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              {localData.customer_name}
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Badge colorScheme={getStatusColor(localData.status)} size="lg">
              {localData.status}
            </Badge>
            <Badge colorScheme={localData.payment_status === 'Paid' ? 'green' : 'red'} size="lg">
              {localData.payment_status}
            </Badge>
            <Button
              size="sm"
              colorScheme={isEditing ? 'red' : 'blue'}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Save' : 'Edit'}
            </Button>
          </HStack>
        </HStack>
      </CardHeader>
      
      <CardBody pt={0}>
        <VStack spacing={6} align="stretch">
          
          {/* Input Section */}
          <Box>
            <HStack mb={3}>
              <Icon as={FiDollarSign} color="orange.500" />
              <Heading size="sm" color="orange.600">Input VAT & Purchase</Heading>
            </HStack>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Order Value</Text>
                  {isEditing ? (
                    <NumberInput
                      value={localData.order_value}
                      onChange={(_, value) => updateField('order_value', value || 0)}
                      size="sm"
                      precision={2}
                    >
                      <NumberInputField bg={inputBg} />
                    </NumberInput>
                  ) : (
                    <Text fontWeight="medium" color="blue.600">
                      {formatCurrency(localData.order_value)}
                    </Text>
                  )}
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Markup %</Text>
                  {isEditing ? (
                    <NumberInput
                      value={localData.markup_percentage}
                      onChange={(_, value) => updateField('markup_percentage', value || 0)}
                      size="sm"
                      precision={2}
                    >
                      <NumberInputField bg={inputBg} />
                    </NumberInput>
                  ) : (
                    <Text fontWeight="medium" color="blue.600">
                      {localData.markup_percentage}%
                    </Text>
                  )}
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Total Purchase</Text>
                  <Text fontWeight="medium" color="orange.600">
                    {formatCurrency(localData.total_purchase)}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Input VAT Paid</Text>
                  <Text fontWeight="medium" color="orange.600">
                    {formatCurrency(localData.input_vat_paid)}
                  </Text>
                </VStack>
              </GridItem>
            </Grid>
          </Box>
          
          <Divider />
          
          {/* Output Section */}
          <Box>
            <HStack mb={3}>
              <Icon as={FiTrendingUp} color="blue.500" />
              <Heading size="sm" color="blue.600">Output VAT & Sales</Heading>
            </HStack>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Total Sale</Text>
                  <Text fontWeight="medium" color="blue.600">
                    {formatCurrency(localData.total_sale)}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Output VAT Received</Text>
                  <Text fontWeight="medium" color="blue.600">
                    {formatCurrency(localData.output_vat_received)}
                  </Text>
                </VStack>
              </GridItem>
            </Grid>
          </Box>
          
          <Divider />
          
          {/* VAT Balance */}
          <Box>
            <HStack mb={3}>
              <Icon as={FiActivity} color="green.500" />
              <Heading size="sm" color="green.600">VAT Balance</Heading>
            </HStack>
            <Box textAlign="center" p={4} bg={localData.vat_balance >= 0 ? 'green.50' : 'red.50'} borderRadius="md">
              <Text fontSize="lg" fontWeight="bold" color={localData.vat_balance >= 0 ? 'green.600' : 'red.600'}>
                {formatCurrency(localData.vat_balance)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {localData.vat_balance >= 0 ? 'To Receive' : 'To Pay'}
              </Text>
            </Box>
          </Box>
          
          <Divider />
          
          {/* Deductions Section */}
          <Box>
            <HStack mb={3}>
              <Icon as={FiPercent} color="purple.500" />
              <Heading size="sm" color="purple.600">Deductions</Heading>
            </HStack>
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Saudi Sponsor ({localData.saudi_sponsor_percentage}%)</Text>
                  <Text fontWeight="medium" color="purple.600">
                    {formatCurrency(localData.saudi_sponsor_amount)}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Referral ({localData.referral_percentage}%)</Text>
                  <Text fontWeight="medium" color="purple.600">
                    {formatCurrency(localData.referral_amount)}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Investor ({localData.investor_percentage}%)</Text>
                  <Text fontWeight="medium" color="purple.600">
                    {formatCurrency(localData.investor_amount)}
                  </Text>
                </VStack>
              </GridItem>
            </Grid>
          </Box>
          
          <Divider />
          
          {/* Zakat & Expenses */}
          <Box>
            <HStack mb={3}>
              <Icon as={FiActivity} color="yellow.500" />
              <Heading size="sm" color="yellow.600">Zakat & Expenses</Heading>
            </HStack>
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Zakat (2.5%)</Text>
                  <Text fontWeight="medium" color="yellow.600">
                    {formatCurrency(localData.zakat)}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">Expenses</Text>
                  {isEditing ? (
                    <NumberInput
                      value={localData.expenses}
                      onChange={(_, value) => updateField('expenses', value || 0)}
                      size="sm"
                      precision={2}
                    >
                      <NumberInputField bg={inputBg} />
                    </NumberInput>
                  ) : (
                    <Text fontWeight="medium" color="yellow.600">
                      {formatCurrency(localData.expenses)}
                    </Text>
                  )}
                </VStack>
              </GridItem>
            </Grid>
          </Box>
          
          <Divider />
          
          {/* Net Profit */}
          <Box textAlign="center" p={4} bg="green.50" borderRadius="md">
            <Text fontSize="xs" color="gray.500" mb={1}>Net Profit</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.600">
              {formatCurrency(localData.net_profit)}
            </Text>
          </Box>
          
          <Divider />
          
          {/* Partner Distribution */}
          <Box>
            <HStack mb={3}>
              <Icon as={FiUsers} color="teal.500" />
              <Heading size="sm" color="teal.600">Partner Distribution</Heading>
            </HStack>
            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">{localData.partner_1_name || 'Partner 1'}</Text>
                  <Text fontWeight="medium" color="teal.600">
                    {formatCurrency(localData.partner_1_amount)}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">{localData.partner_2_name || 'Partner 2'}</Text>
                  <Text fontWeight="medium" color="teal.600">
                    {formatCurrency(localData.partner_2_amount)}
                  </Text>
                </VStack>
              </GridItem>
              <GridItem>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xs" color="gray.500">{localData.partner_3_name || 'Partner 3'}</Text>
                  <Text fontWeight="medium" color="teal.600">
                    {formatCurrency(localData.partner_3_amount)}
                  </Text>
                </VStack>
              </GridItem>
            </Grid>
          </Box>
          
        </VStack>
      </CardBody>
    </Card>
  );
};
