import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Alert,
  AlertIcon,
  Spinner,
  Center,
  Badge,
  Divider,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { FiPlus, FiSearch, FiFilter, FiTrendingUp, FiDollarSign, FiUsers } from 'react-icons/fi';
import { SmartProfitSharingCard } from './SmartProfitSharingCard';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';

interface SmartProfitSharingData {
  id: string;
  quotation_id?: string;
  quotation_number: string;
  customer_name: string;
  status: string;
  order_value: number;
  markup_percentage: number;
  total_purchase: number;
  input_vat_paid: number;
  total_sale: number;
  output_vat_received: number;
  vat_balance: number;
  saudi_sponsor_percentage: number;
  saudi_sponsor_amount: number;
  referral_percentage: number;
  referral_amount: number;
  investor_percentage: number;
  investor_amount: number;
  zakat: number;
  expenses: number;
  net_profit: number;
  partner_1_name: string;
  partner_1_amount: number;
  partner_2_name: string;
  partner_2_amount: number;
  partner_3_name: string;
  partner_3_amount: number;
  payment_status: 'Paid' | 'Due';
}

export const SmartProfitSharingDashboard: React.FC = () => {
  const { selectedOrganization } = useAuth();
  const [profitSharingData, setProfitSharingData] = useState<SmartProfitSharingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  // Fetch quotations and partners with proper organization context
  const quotations = useQuery(
    api.quotations.listQuotations,
    selectedOrganization ? { organization_id: selectedOrganization as any } : "skip"
  ) || [];
  
  const partners = useQuery(
    api.partners.getPartners,
    selectedOrganization ? { organization_id: selectedOrganization as any } : "skip"
  ) || [];
  
  const profitSharing = useQuery(
    api.profitSharing.getExcelTableData,
    selectedOrganization ? { organization_id: selectedOrganization as any } : "skip"
  ) || [];
  
  // Note: This dashboard is read-only for now
  // Mutations can be added later if needed
  
  // Initialize data from quotations
  useEffect(() => {
    if (quotations.length > 0 && profitSharing.length === 0) {
      const initialData: SmartProfitSharingData[] = quotations.map((quotation) => ({
        id: `temp_${quotation._id}`,
        quotation_id: quotation._id,
        quotation_number: quotation.quotation_number || `Q-${quotation._id.slice(-6)}`,
        customer_name: quotation.customer_name || 'Unknown Customer',
        status: quotation.status || 'Pending',
        order_value: quotation.total_value_without_vat || 0,
        markup_percentage: quotation.markup_percentage || 0,
        total_purchase: 0,
        input_vat_paid: 0,
        total_sale: 0,
        output_vat_received: 0,
        vat_balance: 0,
        saudi_sponsor_percentage: quotation.saudi_sponsor_percentage || 0,
        saudi_sponsor_amount: 0,
        referral_percentage: quotation.customer_referral_percentage || 0,
        referral_amount: 0,
        investor_percentage: quotation.investor_percentage || 0,
        investor_amount: 0,
        zakat: 0,
        expenses: 0,
        net_profit: 0,
        partner_1_name: partners.find(p => p.role === 'business_partner')?.name || 'Partner 1',
        partner_1_amount: 0,
        partner_2_name: partners.find((p, i) => p.role === 'business_partner' && i > 0)?.name || 'Partner 2',
        partner_2_amount: 0,
        partner_3_name: partners.find((p, i) => p.role === 'business_partner' && i > 1)?.name || 'Partner 3',
        partner_3_amount: 0,
        payment_status: 'Due',
      }));
      
      setProfitSharingData(initialData);
      setIsLoading(false);
    } else if (profitSharing.length > 0) {
      // Convert existing profit sharing data to new format
      const convertedData: SmartProfitSharingData[] = profitSharing.map((item) => ({
        id: item._id,
        quotation_id: item.quotation_id,
        quotation_number: item.quotation_number || `Q-${item._id.slice(-6)}`,
        customer_name: item.customer_name || 'Unknown Customer',
        status: item.status || 'Pending',
        order_value: item.total_value_without_vat || 0,
        markup_percentage: item.markup_percentage || 0,
        total_purchase: item.total_purchase || 0,
        input_vat_paid: item.input_vat_paid_total || 0,
        total_sale: item.total_sale || 0,
        output_vat_received: item.output_vat_received_total || 0,
        vat_balance: item.vat_balance_to_pay || 0,
        saudi_sponsor_percentage: item.saudi_sponsor_percentage || 0,
        saudi_sponsor_amount: item.saudi_sponsor_amount || 0,
        referral_percentage: item.customer_referral_percentage || 0,
        referral_amount: item.customer_referral_amount || 0,
        investor_percentage: item.investor_percentage || 0,
        investor_amount: item.investor_amount || 0,
        zakat: item.zakat || 0,
        expenses: item.expenses || 0,
        net_profit: item.net_profit || 0,
        partner_1_name: partners.find(p => p.role === 'business_partner')?.name || 'Partner 1',
        partner_1_amount: item.partner_1_amount || 0,
        partner_2_name: partners.find((p, i) => p.role === 'business_partner' && i > 0)?.name || 'Partner 2',
        partner_2_amount: item.partner_2_amount || 0,
        partner_3_name: partners.find((p, i) => p.role === 'business_partner' && i > 1)?.name || 'Partner 3',
        partner_3_amount: item.partner_3_amount || 0,
        payment_status: item.payment_status || 'Due',
      }));
      
      setProfitSharingData(convertedData);
      setIsLoading(false);
    }
  }, [quotations, profitSharing, partners]);
  
  // Filter data based on search and status
  const filteredData = profitSharingData.filter((item) => {
    const matchesSearch = item.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });
  
  // Calculate totals
  const totals = {
    totalOrderValue: filteredData.reduce((sum, item) => sum + item.order_value, 0),
    totalInputVAT: filteredData.reduce((sum, item) => sum + item.input_vat_paid, 0),
    totalOutputVAT: filteredData.reduce((sum, item) => sum + item.output_vat_received, 0),
    totalVATBalance: filteredData.reduce((sum, item) => sum + item.vat_balance, 0),
    totalZakat: filteredData.reduce((sum, item) => sum + item.zakat, 0),
    totalExpenses: filteredData.reduce((sum, item) => sum + item.expenses, 0),
    totalNetProfit: filteredData.reduce((sum, item) => sum + item.net_profit, 0),
    totalPartnerDistribution: filteredData.reduce((sum, item) => 
      sum + item.partner_1_amount + item.partner_2_amount + item.partner_3_amount, 0),
  };
  
  const formatCurrency = (amount: number) => 
    `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
  
  const handleUpdateData = (updatedData: SmartProfitSharingData) => {
    // Update local state only (read-only dashboard for now)
    setProfitSharingData(prev => 
      prev.map(item => item.id === updatedData.id ? updatedData : item)
    );
  };
  
  // Check if organization is selected
  if (!selectedOrganization) {
    return (
      <Center h="400px">
        <VStack spacing={4} textAlign="center">
          <Icon as={FiUsers} boxSize={12} color="gray.400" />
          <Heading size="md" color="gray.600">No Organization Selected</Heading>
          <Text color="gray.500">
            Please select an organization to view profit sharing data.
          </Text>
        </VStack>
      </Center>
    );
  }

  if (isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading Smart Profit Sharing Dashboard...</Text>
        </VStack>
      </Center>
    );
  }
  
  return (
    <Box bg={bgColor} minH="100vh" p={6}>
      <VStack spacing={6} align="stretch">
        
        {/* Header */}
        <Box>
          <Heading size="lg" color="blue.600" mb={2}>
            Smart Profit Sharing Dashboard
          </Heading>
          <Text color="gray.600">
            Intelligent profit calculation and partner distribution system
          </Text>
        </Box>
        
        {/* Summary Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <GridItem>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Order Value</StatLabel>
                  <StatNumber color="blue.600">{formatCurrency(totals.totalOrderValue)}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    {filteredData.length} quotations
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>VAT Balance</StatLabel>
                  <StatNumber color={totals.totalVATBalance >= 0 ? "green.600" : "red.600"}>
                    {formatCurrency(totals.totalVATBalance)}
                  </StatNumber>
                  <StatHelpText>
                    {totals.totalVATBalance >= 0 ? 'To Receive' : 'To Pay'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total Zakat</StatLabel>
                  <StatNumber color="yellow.600">{formatCurrency(totals.totalZakat)}</StatNumber>
                  <StatHelpText>2.5% of net profit</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
          <GridItem>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Net Profit</StatLabel>
                  <StatNumber color="green.600">{formatCurrency(totals.totalNetProfit)}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    After all deductions
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
        
        {/* Filters */}
        <Card bg={cardBg}>
          <CardBody>
            <HStack spacing={4} wrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search quotations or customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="200px"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="delivered">Delivered</option>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
              </Select>
              <Badge colorScheme="blue" fontSize="sm" p={2}>
                {filteredData.length} of {profitSharingData.length} quotations
              </Badge>
            </HStack>
          </CardBody>
        </Card>
        
        {/* Profit Sharing Cards */}
        {filteredData.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No profit sharing data found. Create quotations first to see profit calculations.
          </Alert>
        ) : (
          <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
            {filteredData.map((item) => (
              <GridItem key={item.id}>
                <SmartProfitSharingCard
                  data={item}
                  onUpdate={handleUpdateData}
                  partners={partners}
                />
              </GridItem>
            ))}
          </Grid>
        )}
        
      </VStack>
    </Box>
  );
};
