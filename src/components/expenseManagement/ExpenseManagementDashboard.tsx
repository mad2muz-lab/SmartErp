import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  useColorModeValue,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';
import { SaudiRiyalSymbol } from '../SaudiRiyalSymbol';
import { ExcelStyleExpenseTable } from './ExcelStyleExpenseTable';
import { 
  FiDollarSign, 
  FiTrendingUp, 
  FiUsers, 
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiBarChart,
  FiFileText
} from 'react-icons/fi';

interface ExpenseManagementDashboardProps {
  organizationId: Id<"organizations">;
}

export const ExpenseManagementDashboard: React.FC<ExpenseManagementDashboardProps> = ({
  organizationId,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get expense summary data - temporarily disabled to prevent server errors
  const expenseSummary = null; // useQuery(api.companyExpenses.getExpensesSummary, {
    // organization_id: organizationId,
  // });

  // Get partner balances - temporarily disabled to prevent server errors
  const partnerBalances = null; // useQuery(api.companyExpenses.getPartnerBalances, {
    // organization_id: organizationId,
  // });

  // Get recent expenses
  const recentExpenses = useQuery(api.companyExpenses.getCompanyExpenses, {
    organization_id: organizationId,
    limit: 5,
  });

  // Calculate basic statistics from recent expenses as fallback
  const basicStats = React.useMemo(() => {
    if (!recentExpenses?.items) return null;
    
    const expenses = recentExpenses.items;
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const paidExpenses = expenses.filter(e => e.status === 'Paid');
    const dueExpenses = expenses.filter(e => e.status === 'Due' || e.status === 'Pending');
    const totalPaid = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalDue = dueExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      total_expenses: totalExpenses,
      total_count: expenses.length,
      total_paid_amount: totalPaid,
      total_due_amount: totalDue,
      shared_count: expenses.filter(e => e.is_shared).length,
    };
  }, [recentExpenses]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Due': return 'red';
      case 'Pending': return 'yellow';
      case 'Approved': return 'blue';
      default: return 'gray';
    }
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'registration': return 'blue';
      case 'office_rent': return 'green';
      case 'utilities': return 'yellow';
      case 'marketing': return 'purple';
      case 'Office Supplies': return 'orange';
      case 'other': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Box>
      {/* Header */}
      <VStack spacing={6} align="stretch">
        <HStack justifyContent="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="xl" color="gray.900">Expense Management</Heading>
            <Text fontSize="sm" color="gray.500">
              Professional expense tracking and partner allocation system
            </Text>
          </VStack>
          <HStack spacing={3}>
            <Button leftIcon={<Icon as={FiFileText} />} colorScheme="blue" size="sm">
              Generate Report
            </Button>
            <Button leftIcon={<Icon as={FiBarChart} />} variant="outline" size="sm">
              Analytics
            </Button>
          </HStack>
        </HStack>

        {/* Key Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Total Expenses</StatLabel>
                <StatNumber>
                  <SaudiRiyalSymbol />
                  {basicStats?.total_expenses?.toFixed(2) || '0.00'}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {basicStats?.total_count || 0} transactions
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Amount Due</StatLabel>
                <StatNumber color="red.500">
                  <SaudiRiyalSymbol />
                  {basicStats?.total_due_amount?.toFixed(2) || '0.00'}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiAlertTriangle} color="red.500" mr={1} />
                  Outstanding payments
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Amount Paid</StatLabel>
                <StatNumber color="green.500">
                  <SaudiRiyalSymbol />
                  {basicStats?.total_paid_amount?.toFixed(2) || '0.00'}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiCheckCircle} color="green.500" mr={1} />
                  Settled expenses
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg}>
            <CardBody>
              <Stat>
                <StatLabel>Shared Expenses</StatLabel>
                <StatNumber>
                  {basicStats?.shared_count || 0}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FiUsers} color="blue.500" mr={1} />
                  Partner shared
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Partner Balances - Simplified */}
        <Card bg={cardBg}>
          <CardHeader>
            <Heading size="md">Partner Balances</Heading>
          </CardHeader>
          <CardBody>
            <Text color="gray.500" textAlign="center" py={4}>
              Partner balance tracking will be available when advanced queries are enabled
            </Text>
          </CardBody>
        </Card>

        {/* Main Content Tabs */}
        <Tabs index={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab>Expense Table</Tab>
            <Tab>Recent Activity</Tab>
            <Tab>Analytics</Tab>
          </TabList>

          <TabPanels>
            {/* Excel-style Expense Table */}
            <TabPanel px={0}>
              <ExcelStyleExpenseTable organizationId={organizationId} />
            </TabPanel>

            {/* Recent Activity */}
            <TabPanel>
              <Card bg={cardBg}>
                <CardHeader>
                  <Heading size="md">Recent Expenses</Heading>
                </CardHeader>
                <CardBody>
                  {recentExpenses && recentExpenses.length > 0 ? (
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Description</Th>
                          <Th>Type</Th>
                          <Th>Amount</Th>
                          <Th>Date</Th>
                          <Th>Status</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {recentExpenses.map((expense) => (
                          <Tr key={expense._id}>
                            <Td>
                              <Text fontWeight="medium">{expense.description}</Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getExpenseTypeColor(expense.expense_type)}>
                                {expense.expense_type}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontWeight="medium">
                                <SaudiRiyalSymbol />
                                {expense.amount.toFixed(2)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" color="gray.500">
                                {new Date(expense.expense_date).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(expense.status || 'Due')}>
                                {expense.status || 'Due'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <VStack spacing={4} py={8}>
                      <Icon as={FiFileText} boxSize={12} color="gray.300" />
                      <VStack spacing={2} textAlign="center">
                        <Text fontSize="lg" fontWeight="medium" color="gray.500">
                          No Recent Expenses
                        </Text>
                        <Text fontSize="sm" color="gray.400">
                          Create your first expense to start tracking
                        </Text>
                      </VStack>
                    </VStack>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Analytics */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Expenses by Type</Heading>
                  </CardHeader>
                  <CardBody>
                    <Text color="gray.500" textAlign="center">
                      Analytics will be available when advanced queries are enabled
                    </Text>
                  </CardBody>
                </Card>

                <Card bg={cardBg}>
                  <CardHeader>
                    <Heading size="md">Expense Status Overview</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiCheckCircle} color="green.500" />
                          <Text fontSize="sm">Paid Expenses</Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {basicStats?.total_paid_amount?.toFixed(2) || '0.00'} SAR
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiAlertTriangle} color="red.500" />
                          <Text fontSize="sm">Due Expenses</Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {basicStats?.total_due_amount?.toFixed(2) || '0.00'} SAR
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <HStack>
                          <Icon as={FiClock} color="yellow.500" />
                          <Text fontSize="sm">Pending Expenses</Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="medium">
                          {recentExpenses?.items?.filter(e => e.status === 'Pending').length || 0}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};
