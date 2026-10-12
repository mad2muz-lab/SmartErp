import * as React from 'react';
import {
  Box, Grid, Card, CardBody, VStack, HStack, Text, Button,
  Icon, useColorModeValue, Stat, StatLabel, StatNumber, StatHelpText,
  Heading, Divider
} from '@chakra-ui/react';
import { useAuth } from '../contexts/shared/AuthContext';
import { formatCurrencyDisplay } from '../utils/currencyUtils';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiCheckCircle,
  FiBarChart,
  FiArrowLeft
} from 'react-icons/fi';

export default function ProcurementAnalyticsScreen() {
  const { user, selectedOrganization } = useAuth();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please log in to access procurement analytics.</Text>
      </Box>
    );
  }

  if (!selectedOrganization) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please select an organization to view procurement analytics.</Text>
      </Box>
    );
  }

  const analyticsData = [
    {
      title: 'Total Spend',
      value: formatCurrencyDisplay(0),
      change: '+0%',
      trend: 'up',
      icon: FiBarChart,
      color: 'green'
    },
    {
      title: 'Average Order Value',
      value: formatCurrencyDisplay(0),
      change: '+0%',
      trend: 'up',
      icon: FiTrendingUp,
      color: 'blue'
    },
    {
      title: 'Processing Time',
      value: '0 days',
      change: '-0%',
      trend: 'down',
      icon: FiClock,
      color: 'orange'
    },
    {
      title: 'Approval Rate',
      value: '0%',
      change: '+0%',
      trend: 'up',
      icon: FiCheckCircle,
      color: 'green'
    }
  ];

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => {
                console.log('🔍 DEBUG: Back to Procurement clicked from Procurement Analytics');
                // Force hard navigation to ensure page actually changes
                window.location.href = '/procurement';
              }}
              size="sm"
            >
              Back to Procurement
            </Button>
            <Heading size="lg">Procurement Analytics</Heading>
          </HStack>
        </HStack>
        <Text color="gray.600">Business intelligence and performance insights for procurement activities</Text>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          {analyticsData.map((item, index) => (
            <Card key={index} bg={cardBg} border="1px" borderColor={borderColor}>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <Icon as={item.icon} color={`${item.color}.500`} boxSize={5} />
                    <Text fontSize="sm" color="gray.500">{item.change}</Text>
                  </HStack>
                  <Stat>
                    <StatLabel fontSize="sm">{item.title}</StatLabel>
                    <StatNumber fontSize="xl" className={item.title === 'Total Spend' || item.title === 'Average Order Value' ? 'procurement-currency-sar' : ''}>{item.value}</StatNumber>
                    <StatHelpText>
                      <Icon 
                        as={item.trend === 'up' ? FiTrendingUp : FiTrendingDown} 
                        color={`${item.color}.500`} 
                        mr={1} 
                      />
                      {item.change} from last month
                    </StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        <Card bg={cardBg} border="1px" borderColor={borderColor}>
          <CardBody>
            <Heading size="md" mb={4}>Performance Overview</Heading>
            <Text color="gray.500" textAlign="center" py={8}>
              Analytics data will be displayed here once procurement activities are created.
            </Text>
          </CardBody>
        </Card>

        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Heading size="md" mb={4}>Spend Analysis</Heading>
              <Text color="gray.500" textAlign="center" py={8}>
                Spend analysis charts will be displayed here.
              </Text>
            </CardBody>
          </Card>

          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <Heading size="md" mb={4}>Supplier Performance</Heading>
              <Text color="gray.500" textAlign="center" py={8}>
                Supplier performance metrics will be displayed here.
              </Text>
            </CardBody>
          </Card>
        </Grid>
      </VStack>
    </Box>
  );
}
