import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
} from '@chakra-ui/react';
import { SearchIcon, EmailIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/shared/AuthContext';
// import EmailHistory from '../components/procurement/EmailHistory'; // Temporarily disabled
import { Id } from '../../convex/_generated/dataModel';

export default function EmailManagementScreen() {
  const { selectedOrganization } = useAuth();
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>('all');

  if (!selectedOrganization) {
    return (
      <Box p={6}>
        <Text>Please select an organization to view emails.</Text>
      </Box>
    );
  }

  const emailStats = {
    total: 150,
    sent: 120,
    delivered: 95,
    failed: 5,
    pending: 20,
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <HStack>
                <EmailIcon color="blue.500" boxSize={6} />
                <Text fontSize="2xl" fontWeight="bold">
                  Email Management
                </Text>
              </HStack>
              <Text color="gray.600">
                Manage and track all procurement-related emails
              </Text>
            </VStack>
          </HStack>
        </Box>

        {/* Email Statistics */}
        <Box p={4} bg="white" borderRadius="lg" shadow="sm">
          <Text fontSize="lg" fontWeight="semibold" mb={4}>
            Email Statistics
          </Text>
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={4}>
            <Stat>
              <StatLabel>Total Emails</StatLabel>
              <StatNumber>{emailStats.total}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                12.5%
              </StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Sent</StatLabel>
              <StatNumber color="green.500">{emailStats.sent}</StatNumber>
              <StatHelpText>Successfully sent</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Delivered</StatLabel>
              <StatNumber color="blue.500">{emailStats.delivered}</StatNumber>
              <StatHelpText>Confirmed delivery</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Failed</StatLabel>
              <StatNumber color="red.500">{emailStats.failed}</StatNumber>
              <StatHelpText>Delivery failed</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Pending</StatLabel>
              <StatNumber color="yellow.500">{emailStats.pending}</StatNumber>
              <StatHelpText>Awaiting delivery</StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

        {/* Filters and Search */}
        <Box p={4} bg="white" borderRadius="lg" shadow="sm">
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Select
              value={emailTypeFilter}
              onChange={(e) => setEmailTypeFilter(e.target.value)}
              maxW="200px"
            >
              <option value="all">All Types</option>
              <option value="purchase_order">Purchase Orders</option>
              <option value="purchase_requisition">Purchase Requisitions</option>
              <option value="material_receipt">Material Receipts</option>
              <option value="general">General</option>
            </Select>
          </HStack>
        </Box>

        {/* Email Tabs */}
        <Box bg="white" borderRadius="lg" shadow="sm">
          <Tabs variant="enclosed">
            <TabList>
              <Tab>
                <HStack>
                  <EmailIcon />
                  <Text>All Emails</Text>
                  <Badge colorScheme="blue" ml={2}>
                    {emailStats.total}
                  </Badge>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Text>Purchase Orders</Text>
                  <Badge colorScheme="blue" ml={2}>
                    45
                  </Badge>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Text>Purchase Requisitions</Text>
                  <Badge colorScheme="purple" ml={2}>
                    38
                  </Badge>
                </HStack>
              </Tab>
              <Tab>
                <HStack>
                  <Text>Material Receipts</Text>
                  <Badge colorScheme="green" ml={2}>
                    22
                  </Badge>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                {/* EmailHistory temporarily disabled - emailService not implemented */}
                <Box p={6} textAlign="center">
                  <Text color="gray.500">Email functionality temporarily disabled</Text>
                </Box>
              </TabPanel>
              <TabPanel>
                {/* EmailHistory temporarily disabled - emailService not implemented */}
                <Box p={6} textAlign="center">
                  <Text color="gray.500">Email functionality temporarily disabled</Text>
                </Box>
              </TabPanel>
              <TabPanel>
                {/* EmailHistory temporarily disabled - emailService not implemented */}
                <Box p={6} textAlign="center">
                  <Text color="gray.500">Email functionality temporarily disabled</Text>
                </Box>
              </TabPanel>
              <TabPanel>
                {/* EmailHistory temporarily disabled - emailService not implemented */}
                <Box p={6} textAlign="center">
                  <Text color="gray.500">Email functionality temporarily disabled</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  );
}
