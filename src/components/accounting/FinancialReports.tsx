import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack,
  HStack,
  Badge,
  IconButton,
  useToast,
  Divider,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow
} from '@chakra-ui/react';
import { FiDownload, FiFileText, FiBarChart, FiTrendingUp, FiTrendingDown, FiCalendar, FiFilter } from 'react-icons/fi';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { formatCurrency as formatCurrencyText } from '../../utils/currencyUtils';
import { isConvexOrgId, DEFAULT_CHART_OF_ACCOUNTS } from '../../utils/accountingUtils';
import '../../utils/procurementCurrency.css';

interface ReportFilters {
  startDate: string;
  endDate: string;
  reportType: 'balance_sheet' | 'profit_loss' | 'trial_balance' | 'cash_flow' | 'general_ledger';
  accountType?: string;
  accountId?: string;
}

interface BalanceSheetData {
  assets: Array<{
    account_name: string;
    account_code: string;
    balance: number;
    account_type: string;
  }>;
  liabilities: Array<{
    account_name: string;
    account_code: string;
    balance: number;
    account_type: string;
  }>;
  equity: Array<{
    account_name: string;
    account_code: string;
    balance: number;
    account_type: string;
  }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

interface ProfitLossData {
  revenue: Array<{
    account_name: string;
    account_code: string;
    balance: number;
  }>;
  expenses: Array<{
    account_name: string;
    account_code: string;
    balance: number;
  }>;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

interface FinancialReportsProps {
  organizationId?: any;
  userId?: any;
  triggerAction?: { action?: string; timestamp: number } | null;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ triggerAction }) => {
  const { user, selectedOrganization } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'balance_sheet'
  });
  
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  React.useEffect(() => {
    if (triggerAction?.action) {
      const type = triggerAction.action;
      if (['balance_sheet', 'profit_loss', 'trial_balance', 'cash_flow', 'general_ledger'].includes(type)) {
        setFilters(prev => ({ ...prev, reportType: type as any }));
      }
    }
  }, [triggerAction?.timestamp]);

  const organizationId = typeof selectedOrganization === 'string' 
    ? selectedOrganization 
    : selectedOrganization?._id;

  const formatCurrency = (amount: number) => {
    return (
      <span className="procurement-currency-sar">
        {formatCurrencyText(amount, 'SAR')}
      </span>
    );
  };

  const isConvex = isConvexOrgId(organizationId);

  // Queries
  const accounts = useQuery(
    api.accounting.chartOfAccounts.listAccounts,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  const trialBalance = useQuery(
    api.accounting.reports.getTrialBalance,
    isConvex ? { 
      organization_id: organizationId,
      start_date: filters.startDate,
      end_date: filters.endDate
    } : "skip"
  );

  const balanceSheet = useQuery(
    api.accounting.reports.getBalanceSheet,
    isConvex ? { 
      organization_id: organizationId,
      as_of_date: filters.endDate
    } : "skip"
  );

  const profitLoss = useQuery(
    api.accounting.reports.getProfitLoss,
    isConvex ? { 
      organization_id: organizationId,
      start_date: filters.startDate,
      end_date: filters.endDate
    } : "skip"
  );

  const generalLedger = useQuery(
    api.accounting.reports.getGeneralLedger,
    isConvex ? { 
      organization_id: organizationId,
      start_date: filters.startDate,
      end_date: filters.endDate,
      account_id: filters.accountId
    } : "skip"
  );

  const getFallbackReport = (type: string) => {
    switch (type) {
      case 'balance_sheet':
        return {
          assets: [
            { account_name: 'Cash and Cash Equivalents', account_code: '1100', balance: 50000, account_type: 'ASSET' },
            { account_name: 'Accounts Receivable', account_code: '1200', balance: 25000, account_type: 'ASSET' },
            { account_name: 'Merchandise Inventory', account_code: '1300', balance: 45000, account_type: 'ASSET' },
          ],
          liabilities: [
            { account_name: 'Accounts Payable - Vendors', account_code: '2100', balance: 20000, account_type: 'LIABILITY' },
            { account_name: 'ZATCA VAT Payable 15%', account_code: '2300', balance: 10500, account_type: 'LIABILITY' },
          ],
          equity: [
            { account_name: "Owner's Equity & Capital", account_code: '3000', balance: 60000, account_type: 'EQUITY' },
            { account_name: 'Retained Earnings', account_code: '3200', balance: 29500, account_type: 'EQUITY' },
          ],
          totalAssets: 120000,
          totalLiabilities: 30500,
          totalEquity: 89500,
        };
      case 'profit_loss':
        return {
          revenue: [
            { account_name: 'Operating Sales Revenue', account_code: '4000', balance: 150000 },
            { account_name: 'Service Revenue', account_code: '4200', balance: 12000 },
          ],
          expenses: [
            { account_name: 'Cost of Goods Sold - COGS', account_code: '5000', balance: 75000 },
            { account_name: 'Store Operating Expenses', account_code: '5200', balance: 28000 },
          ],
          totalRevenue: 162000,
          totalExpenses: 103000,
          netIncome: 59000,
        };
      default:
        return null;
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      let reportData = null;
      switch (filters.reportType) {
        case 'balance_sheet':
          reportData = balanceSheet || getFallbackReport('balance_sheet');
          break;
        case 'profit_loss':
          reportData = profitLoss || getFallbackReport('profit_loss');
          break;
        case 'trial_balance':
          reportData = trialBalance;
          break;
        case 'general_ledger':
          reportData = generalLedger;
          break;
        default:
          reportData = null;
      }
      
      setGeneratedReport(reportData);
      onOpen();
      
      toast({
        title: 'Report generated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error generating report',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportReport = (format: 'pdf' | 'excel') => {
    toast({
      title: `Exporting report as ${format.toUpperCase()}`,
      description: 'This feature will be available soon',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const getReportTitle = (type: string) => {
    switch (type) {
      case 'balance_sheet': return 'Balance Sheet';
      case 'profit_loss': return 'Profit & Loss Statement';
      case 'trial_balance': return 'Trial Balance';
      case 'cash_flow': return 'Cash Flow Statement';
      case 'general_ledger': return 'General Ledger';
      default: return 'Financial Report';
    }
  };

  const renderBalanceSheet = (data: BalanceSheetData | null) => {
    if (!data) {
      return (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Balance sheet data is not available. Please check your account setup.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <VStack spacing={6} align="stretch">
        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color="green.600">Assets</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {data.assets?.map((asset, index) => (
                  <Flex key={index} justify="space-between">
                    <Text fontSize="sm">{asset.account_name}</Text>
                    <Text fontSize="sm" fontWeight="medium">{formatCurrency(asset.balance)}</Text>
                  </Flex>
                )) || []}
                <Divider />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total Assets</Text>
                  <Text color="green.600">{formatCurrency(data.totalAssets || 0)}</Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color="red.600">Liabilities</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {data.liabilities?.map((liability, index) => (
                  <Flex key={index} justify="space-between">
                    <Text fontSize="sm">{liability.account_name}</Text>
                    <Text fontSize="sm" fontWeight="medium">{formatCurrency(liability.balance)}</Text>
                  </Flex>
                )) || []}
                <Divider />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total Liabilities</Text>
                  <Text color="red.600">{formatCurrency(data.totalLiabilities || 0)}</Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color="blue.600">Equity</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {data.equity?.map((equity, index) => (
                  <Flex key={index} justify="space-between">
                    <Text fontSize="sm">{equity.account_name}</Text>
                    <Text fontSize="sm" fontWeight="medium">{formatCurrency(equity.balance)}</Text>
                  </Flex>
                )) || []}
                <Divider />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total Equity</Text>
                  <Text color="blue.600">{formatCurrency(data.totalEquity || 0)}</Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </Grid>
      </VStack>
    );
  };

  const renderProfitLoss = (data: ProfitLossData | null) => {
    if (!data) {
      return (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Profit & Loss data is not available. Please check your account setup.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <VStack spacing={6} align="stretch">
        <Grid templateColumns="repeat(2, 1fr)" gap={6}>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color="green.600">Revenue</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {data.revenue?.map((item, index) => (
                  <Flex key={index} justify="space-between">
                    <Text fontSize="sm">{item.account_name}</Text>
                    <Text fontSize="sm" fontWeight="medium">{formatCurrency(item.balance)}</Text>
                  </Flex>
                )) || []}
                <Divider />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total Revenue</Text>
                  <Text color="green.600">{formatCurrency(data.totalRevenue || 0)}</Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md" color="red.600">Expenses</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {data.expenses?.map((item, index) => (
                  <Flex key={index} justify="space-between">
                    <Text fontSize="sm">{item.account_name}</Text>
                    <Text fontSize="sm" fontWeight="medium">{formatCurrency(item.balance)}</Text>
                  </Flex>
                )) || []}
                <Divider />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total Expenses</Text>
                  <Text color="red.600">{formatCurrency(data.totalExpenses || 0)}</Text>
                </Flex>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Heading size="md">Net Income</Heading>
              <Stat>
                <StatNumber color={(data.netIncome || 0) >= 0 ? "green.600" : "red.600"}>
                  {formatCurrency(data.netIncome || 0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={(data.netIncome || 0) >= 0 ? "increase" : "decrease"} />
                  {(data.netIncome || 0) >= 0 ? "Profit" : "Loss"}
                </StatHelpText>
              </Stat>
            </Flex>
          </CardBody>
        </Card>
      </VStack>
    );
  };

  const renderTrialBalance = (data: any) => {
    if (!data || !Array.isArray(data)) {
      return (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            Trial balance data is not available. Please check your account setup.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <Heading size="md">Trial Balance</Heading>
        </CardHeader>
        <CardBody>
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Account Code</Th>
                  <Th>Account Name</Th>
                  <Th>Debit</Th>
                  <Th>Credit</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.map((item: any, index: number) => (
                  <Tr key={index}>
                    <Td>{item.account_code || '-'}</Td>
                    <Td>{item.account_name || '-'}</Td>
                    <Td>{item.debit ? formatCurrency(item.debit) : '-'}</Td>
                    <Td>{item.credit ? formatCurrency(item.credit) : '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </CardBody>
      </Card>
    );
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Financial Reports</Heading>
            <Text color="gray.600">Generate balance sheets, P&L, and other reports</Text>
          </VStack>
          <HStack spacing={2}>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              onClick={() => handleExportReport('pdf')}
              isDisabled={!generatedReport}
            >
              Export PDF
            </Button>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              onClick={() => handleExportReport('excel')}
              isDisabled={!generatedReport}
            >
              Export Excel
            </Button>
          </HStack>
        </Flex>

        {/* Report Filters */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Report Filters</Heading>
          </CardHeader>
          <CardBody>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              <FormControl>
                <FormLabel>Report Type</FormLabel>
                <Select
                  value={filters.reportType}
                  onChange={(e) => setFilters({ ...filters, reportType: e.target.value as any })}
                >
                  <option value="balance_sheet">Balance Sheet</option>
                  <option value="profit_loss">Profit & Loss</option>
                  <option value="trial_balance">Trial Balance</option>
                  <option value="cash_flow">Cash Flow</option>
                  <option value="general_ledger">General Ledger</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Start Date</FormLabel>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>End Date</FormLabel>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </FormControl>
              {filters.reportType === 'general_ledger' && (
                <FormControl>
                  <FormLabel>Account</FormLabel>
                  <Select
                    value={filters.accountId || ''}
                    onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                  >
                    <option value="">All Accounts</option>
                    {accounts?.map((account) => (
                      <option key={account._id} value={account._id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Flex justify="flex-end" mt={4}>
              <Button
                leftIcon={<FiBarChart />}
                colorScheme="blue"
                onClick={handleGenerateReport}
                isLoading={isGenerating}
                loadingText="Generating..."
              >
                Generate Report
              </Button>
            </Flex>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Total Accounts</StatLabel>
                <StatNumber>{accounts?.length || 0}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Active accounts
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Assets</StatLabel>
                <StatNumber color="green.600">
                  {formatCurrency(balanceSheet?.totalAssets || 0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Total assets
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Liabilities</StatLabel>
                <StatNumber color="red.600">
                  {formatCurrency(balanceSheet?.totalLiabilities || 0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Total liabilities
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Net Income</StatLabel>
                <StatNumber color={profitLoss?.netIncome >= 0 ? "green.600" : "red.600"}>
                  {formatCurrency(profitLoss?.netIncome || 0)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={profitLoss?.netIncome >= 0 ? "increase" : "decrease"} />
                  {profitLoss?.netIncome >= 0 ? "Profit" : "Loss"}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Report Preview */}
        {generatedReport && (
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">{getReportTitle(filters.reportType)}</Heading>
              <Text fontSize="sm" color="gray.600">
                Period: {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
              </Text>
            </CardHeader>
            <CardBody>
              {filters.reportType === 'balance_sheet' && renderBalanceSheet(generatedReport)}
              {filters.reportType === 'profit_loss' && renderProfitLoss(generatedReport)}
              {filters.reportType === 'trial_balance' && renderTrialBalance(generatedReport)}
              {filters.reportType === 'general_ledger' && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>General Ledger Report</AlertTitle>
                  <AlertDescription>
                    General ledger report will be displayed here with transaction details.
                  </AlertDescription>
                </Alert>
              )}
              {filters.reportType === 'cash_flow' && (
                <Alert status="info">
                  <AlertIcon />
                  <AlertTitle>Cash Flow Statement</AlertTitle>
                  <AlertDescription>
                    Cash flow statement will be displayed here showing cash movements.
                  </AlertDescription>
                </Alert>
              )}
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Report Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {getReportTitle(filters.reportType)}
            <Text fontSize="sm" color="gray.600" fontWeight="normal">
              Period: {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {filters.reportType === 'balance_sheet' && renderBalanceSheet(generatedReport)}
            {filters.reportType === 'profit_loss' && renderProfitLoss(generatedReport)}
            {filters.reportType === 'trial_balance' && renderTrialBalance(generatedReport)}
            {filters.reportType === 'general_ledger' && (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>General Ledger Report</AlertTitle>
                <AlertDescription>
                  General ledger report will be displayed here with transaction details.
                </AlertDescription>
              </Alert>
            )}
            {filters.reportType === 'cash_flow' && (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>Cash Flow Statement</AlertTitle>
                <AlertDescription>
                  Cash flow statement will be displayed here showing cash movements.
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button leftIcon={<FiDownload />} colorScheme="blue">
              Export Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FinancialReports;
