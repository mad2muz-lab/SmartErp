import React from 'react';
import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import ZATCAComplianceDashboard from '../components/invoices/ZATCAComplianceDashboard';

const ZATCAComplianceScreen: React.FC = () => {
  const { selectedOrganization } = useAuth();

  if (!selectedOrganization) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Heading>ZATCA Compliance Dashboard</Heading>
          <Text>Please select an organization to view compliance data.</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>ZATCA Compliance Dashboard</Heading>
          <Text color="gray.600" fontSize="lg">
            Monitor and track ZATCA e-invoicing compliance for {selectedOrganization.name}
          </Text>
        </Box>
        
        <ZATCAComplianceDashboard organizationId={selectedOrganization._id} />
      </VStack>
    </Container>
  );
};

export default ZATCAComplianceScreen;
