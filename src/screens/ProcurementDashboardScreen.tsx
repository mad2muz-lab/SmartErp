import * as React from 'react';
import {
  Box, Grid, Card, CardBody, VStack, HStack, Text, Button, 
  Icon, useColorModeValue, Badge, Stat, StatLabel, StatNumber, StatHelpText,
  Heading, Divider
} from '@chakra-ui/react';
import { useAuth } from '../contexts/shared/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrencyDisplay } from '../utils/currencyUtils';
import {
  FiFileText,
  FiShoppingCart,
  FiPackage,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiBarChart
} from 'react-icons/fi';

export default function ProcurementDashboardScreen() {
  const { user, selectedOrganization } = useAuth();
  const navigate = useNavigate();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please log in to access procurement.</Text>
      </Box>
    );
  }

  if (!selectedOrganization) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please select an organization to view procurement.</Text>
      </Box>
    );
  }

  const quickActions = [
    {
      title: 'New Purchase Requisition',
      description: 'Create internal purchase request',
      icon: FiFileText,
      color: 'blue',
      action: () => {
        console.log('🔍 DEBUG: Navigating to /procurement/requisitions?action=create');
        window.location.href = '/procurement/requisitions?action=create';
      },
    },
    {
      title: 'New Purchase Order',
      description: 'Create supplier purchase order',
      icon: FiShoppingCart,
      color: 'green',
      action: () => {
        console.log('🔍 DEBUG: Navigating to /procurement/orders?action=create');
        window.location.href = '/procurement/orders?action=create';
      },
    },
    {
      title: 'New Material Receipt',
      description: 'Record received materials',
      icon: FiPackage,
      color: 'purple',
      action: () => {
        console.log('🔍 DEBUG: Navigating to /procurement/receipts?action=create');
        window.location.href = '/procurement/receipts?action=create';
      },
    },
    {
      title: 'View Pending Approvals',
      description: 'Review items requiring approval',
      icon: FiClock,
      color: 'orange',
      action: () => {
        console.log('🔍 DEBUG: Navigating to /procurement/pending-approvals');
        window.location.href = '/procurement/pending-approvals';
      },
    },
    {
      title: 'View Recent Activity',
      description: 'Check latest procurement activities',
      icon: FiTrendingUp,
      color: 'purple',
      action: () => {
        console.log('🔍 DEBUG: Navigating to /procurement');
        window.location.href = '/procurement';
      },
    },
    {
      title: 'Procurement Analytics',
      description: 'Business intelligence and performance insights',
      icon: FiBarChart,
      color: 'indigo',
      action: () => {
        console.log('🔍 DEBUG: Navigating to /procurement/analytics');
        window.location.href = '/procurement/analytics';
      },
    }
  ];

  const procurementModules = [
    {
      title: 'Purchase Requisitions',
      description: 'Create and manage internal purchase requests',
      icon: FiFileText,
      color: 'blue',
      path: '/procurement/requisitions',
      stats: { total: 0, pending: 0, approved: 0 },
      features: [
        'Create internal purchase requests',
        'Department approval workflow',
        'Priority-based processing',
        'Convert to Purchase Orders'
      ]
    },
    {
      title: 'Purchase Orders',
      description: 'Manage supplier purchase orders and contracts',
      icon: FiShoppingCart,
      color: 'green',
      path: '/procurement/orders',
      stats: { total: 0, active: 0, completed: 0 },
      features: [
        'Create supplier purchase orders',
        'Multi-item management',
        'Approval and authorization',
        'PDF generation'
      ]
    },
    {
      title: 'Material Receipts',
      description: 'Track received materials and quality control',
      icon: FiPackage,
      color: 'purple',
      path: '/procurement/receipts',
      stats: { total: 0, pending: 0, completed: 0 },
      features: [
        'Receive delivered materials',
        'Quality inspection tracking',
        'Inventory updates',
        'Supplier performance'
      ]
    }
  ];

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="lg" mb={2}>Procurement Dashboard</Heading>
          <Text color="gray.600">Manage all procurement activities from purchase requests to material receipts</Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Total Purchase Requisitions</StatLabel>
                <StatNumber>0</StatNumber>
                <StatHelpText>
                  <Badge colorScheme="blue" mr={2}>0 Pending</Badge>
                  <Badge colorScheme="green">0 Approved</Badge>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Total Purchase Orders</StatLabel>
                <StatNumber>0</StatNumber>
                <StatHelpText>
                  <Badge colorScheme="green" mr={2}>0 Active</Badge>
                  <Badge colorScheme="blue">0 Completed</Badge>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Total Procurement Value</StatLabel>
                <StatNumber className="procurement-currency-sar">{formatCurrencyDisplay(0)}</StatNumber>
                <StatHelpText>
                  <Icon as={FiBarChart} color="green.500" mr={1} />
                  Total value of all POs
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Pending Approvals</StatLabel>
                <StatNumber>0</StatNumber>
                <StatHelpText>
                  <Icon as={FiClock} color="orange.500" mr={1} />
                  Require attention
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Quick Actions</Heading>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="lg"
                  height="auto"
                  p={4}
                  onClick={action.action}
                  _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
                  transition="all 0.2s"
                >
                  <VStack spacing={2}>
                    <Icon as={action.icon} color={`${action.color}.500`} boxSize={6} />
                    <Text fontWeight="semibold" fontSize="sm">{action.title}</Text>
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      {action.description}
                    </Text>
                  </VStack>
                </Button>
              ))}
            </Grid>
          </CardBody>
        </Card>

        <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap={6}>
          {procurementModules.map((module, index) => (
            <Card key={index} bg={cardBg} border="1px" borderColor={borderColor} h="full">
              <CardBody>
                <VStack spacing={4} align="stretch" h="full">
                  <HStack>
                    <Icon as={module.icon} color={`${module.color}.500`} boxSize={6} />
                    <Box flex={1}>
                      <Heading size="md">{module.title}</Heading>
                      <Text fontSize="sm" color="gray.500">{module.description}</Text>
                    </Box>
                  </HStack>

                  <HStack justify="space-between">
                    <Stat>
                      <StatLabel fontSize="xs">Total</StatLabel>
                      <StatNumber fontSize="lg">{module.stats.total}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Active</StatLabel>
                      <StatNumber fontSize="lg">{module.stats.pending || module.stats.active}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel fontSize="xs">Completed</StatLabel>
                      <StatNumber fontSize="lg">{module.stats.approved || module.stats.completed}</StatNumber>
                    </Stat>
                  </HStack>

                  <Divider />

                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="semibold" mb={2}>Key Features:</Text>
                    <VStack spacing={1} align="stretch">
                      {module.features.map((feature, featureIndex) => (
                        <HStack key={featureIndex} spacing={2}>
                          <Icon as={FiCheckCircle} color="green.500" boxSize={3} />
                          <Text fontSize="xs">{feature}</Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  <Button
                    colorScheme={module.color}
                    variant="solid"
                    onClick={() => navigate(module.path)}
                    size="sm"
                  >
                    Manage {module.title}
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Recent Activity</Heading>
            <Text color="gray.500" textAlign="center" py={4}>
              No recent activity. Create your first purchase requisition or order to get started.
            </Text>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}
