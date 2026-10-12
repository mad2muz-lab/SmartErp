import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import FormattedCurrencyDisplay from '../components/FormattedCurrencyDisplay';
import { 
  FiBarChart, 
  FiUsers, 
  FiFileText,
  FiAlertTriangle
} from 'react-icons/fi';

export const ProfitSharingDashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, selectedOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const isConvex = isConvexOrgId(selectedOrganization);
  const isConvexUserOrg = isConvexOrgId(user?.organizationId);

  // Queries for data
  const dashboardData = useQuery(api.profitSharing.getProfitSharingDashboard,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  const partnersSummary = useQuery(api.partners.getPartnersSummary,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  const expensesSummary = useQuery(api.companyExpenses.getCompanyExpenses,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // NEW SAFE QUERIES - READ ONLY FROM EXISTING DATA
  const quotationsForProfit = useQuery(api.profitSharing.getQuotationsForProfitCalculation,
    isConvexUserOrg ? { organization_id: user!.organizationId as any } : "skip"
  );

  const activePartners = useQuery(api.profitSharing.getActivePartners,
    isConvexUserOrg ? { organization_id: user!.organizationId as any } : "skip"
  );

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!selectedOrganization) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4} textAlign="center">
          <Icon as={FiAlertTriangle} boxSize={12} color="yellow.400" />
          <Heading size="sm" color="gray.900">No Organization Selected</Heading>
          <Text fontSize="sm" color="gray.500">
            Please select an organization to view profit sharing data.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg={cardBg} shadow="sm" borderColor={borderColor}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
          <Box py={6}>
            <HStack justifyContent="space-between" flexWrap="wrap" spacing={4}>
              <VStack align="start" spacing={1}>
                <Heading size="xl" color="gray.900">Profit Sharing</Heading>
                <Text fontSize="sm" color="gray.500">
                  Manage profit distribution and partner relationships
                </Text>
              </VStack>
              <HStack spacing={3}>
                <Button
                  onClick={() => navigate('/profit-sharing/partners')}
                  colorScheme="blue"
                  leftIcon={<Icon as={FiUsers} />}
                  size="sm"
                >
                  Manage Partners
                </Button>
                <Button
                  onClick={() => navigate('/profit-sharing/expenses')}
                  variant="outline"
                  leftIcon={<Icon as={FiFileText} />}
                  size="sm"
                >
                  Company Expenses
                </Button>
              </HStack>
            </HStack>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        <Tabs>
          <TabList>
            <Tab>
              <Icon as={FiBarChart} mr={2} />
              Overview
            </Tab>
            <Tab>
              <Icon as={FiUsers} mr={2} />
              Partners
            </Tab>
            <Tab>
              <Icon as={FiFileText} mr={2} />
              Expenses
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Profit Sharing Overview</Heading>
                
                <Card bg={cardBg}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Text color="gray.600">
                        Welcome to the Profit Sharing dashboard. Here you can manage profit distribution,
                        track partner relationships, and monitor company expenses.
                      </Text>
                      
                      <HStack spacing={4} justify="center">
                        <Button
                          onClick={() => navigate('/profit-sharing/partners')}
                          colorScheme="blue"
                          leftIcon={<Icon as={FiUsers} />}
                        >
                          Manage Partners
                        </Button>
                        <Button
                          onClick={() => navigate('/profit-sharing/expenses')}
                          variant="outline"
                          leftIcon={<Icon as={FiFileText} />}
                        >
                          Track Expenses
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* NEW SAFE DATA DISPLAY - READ ONLY FROM EXISTING DATA */}
                {quotationsForProfit && quotationsForProfit.length > 0 && (
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="md">Quotations Ready for Profit Calculation</Heading>
                        <Text color="gray.600">
                          Found {quotationsForProfit.length} delivered quotation(s) ready for profit calculation.
                        </Text>
                        
                        <Box overflowX="auto">
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Quotation #</Th>
                                <Th>Customer</Th>
                                <Th>Subtotal</Th>
                                <Th>Potential Profit</Th>
                                <Th>Saudi Sponsor</Th>
                                <Th>Status</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {quotationsForProfit.map((quotation) => (
                                <Tr key={quotation._id}>
                                  <Td>
                                    <Text fontSize="sm" fontWeight="medium">
                                      {quotation.quotation_number}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm">
                                      {quotation.customer_name || 'N/A'}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" fontWeight="medium">
                                      <FormattedCurrencyDisplay amount={quotation.subtotal} currency="SAR" />
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" fontWeight="medium" color="green.600">
                                      <FormattedCurrencyDisplay amount={quotation.potential_profit} currency="SAR" />
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" color="purple.600">
                                      <FormattedCurrencyDisplay amount={quotation.saudi_sponsor_amount} currency="SAR" />
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Badge colorScheme="green" size="sm">
                                      {quotation.status}
                                    </Badge>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {activePartners && activePartners.length > 0 && (
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        <Heading size="md">Active Partners for Profit Distribution</Heading>
                        <Text color="gray.600">
                          Found {activePartners.length} active partner(s) ready for profit distribution.
                        </Text>
                        
                        <Box overflowX="auto">
                          <Table variant="simple" size="sm">
                            <Thead>
                              <Tr>
                                <Th>Partner Name</Th>
                                <Th>Role</Th>
                                <Th>Profit %</Th>
                                <Th>Status</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {activePartners.map((partner) => (
                                <Tr key={partner._id}>
                                  <Td>
                                    <Text fontSize="sm" fontWeight="medium">
                                      {partner.name}
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Badge colorScheme="blue" size="sm">
                                      {partner.role}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    <Text fontSize="sm" fontWeight="medium">
                                      {partner.profit_percentage || 0}%
                                    </Text>
                                  </Td>
                                  <Td>
                                    <Badge colorScheme="green" size="sm">
                                      {partner.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {(!quotationsForProfit || quotationsForProfit.length === 0) && (!activePartners || activePartners.length === 0) && (
                  <Card bg={cardBg}>
                    <CardBody>
                      <VStack spacing={4} textAlign="center" py={8}>
                        <Icon as={FiBarChart} boxSize={12} color="gray.300" />
                        <VStack spacing={2}>
                          <Text fontSize="lg" fontWeight="medium" color="gray.500">
                            No Data Available Yet
                          </Text>
                          <Text fontSize="sm" color="gray.400">
                            No delivered quotations or active partners found for profit sharing calculations.
                          </Text>
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {dashboardData && (
                  <Card bg={cardBg}>
                    <CardBody>
                      <Text fontSize="lg" fontWeight="bold" mb={4}>Dashboard Summary</Text>
                      <Text color="gray.600">
                        Dashboard data loaded successfully. Features will be enhanced in future updates.
                      </Text>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={6} align="stretch">
                <HStack justifyContent="space-between">
                  <Heading size="md">Partners Management</Heading>
                  <Button
                    onClick={() => navigate('/profit-sharing/partners')}
                    colorScheme="blue"
                    leftIcon={<Icon as={FiUsers} />}
                  >
                    Go to Partners
                  </Button>
                </HStack>
                
                <Card bg={cardBg}>
                  <CardBody>
                    <Text color="gray.600">
                      Manage your business partners, investors, Saudi sponsors, and customer referrals.
                    </Text>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={6} align="stretch">
                <HStack justifyContent="space-between">
                  <Heading size="md">Company Expenses</Heading>
                  <Button
                    onClick={() => navigate('/profit-sharing/expenses')}
                    colorScheme="blue"
                    leftIcon={<Icon as={FiFileText} />}
                  >
                    Go to Expenses
                  </Button>
                </HStack>
                
                <Card bg={cardBg}>
                  <CardBody>
                    <Text color="gray.600">
                      Track and manage company expenses that can be shared among partners.
                    </Text>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  );
};