import * as React from 'react';
import { Box, Text, Button, VStack, HStack, Heading, useToast } from '@chakra-ui/react';
import { FiPlus, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../contexts/shared/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MaterialReceiptTable from '../components/procurement/MaterialReceiptTable';

interface MaterialReceiptListScreenProps {
  organizationId: string;
  autoOpenCreate?: boolean;
}

export default function MaterialReceiptListScreen({ organizationId, autoOpenCreate = false }: MaterialReceiptListScreenProps) {
  const { user, selectedOrganization } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const action = searchParams.get('action');
  const toast = useToast();

  if (!user) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please log in to access material receipts.</Text>
      </Box>
    );
  }

  if (!selectedOrganization) {
    return (
      <Box p={6} textAlign="center">
        <Text>Please select an organization to view material receipts.</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack spacing={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate('/procurement')}
            >
              Back to Procurement
            </Button>
            <Heading size="lg">Material Receipts</Heading>
          </HStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="purple"
            onClick={() => navigate('/procurement/receipts?action=create')}
          >
            New Material Receipt
          </Button>
        </HStack>

        {/* Material Receipt Table */}
        <MaterialReceiptTable 
          organizationId={selectedOrganization} 
          autoOpenCreate={action === 'create'} 
        />
      </VStack>
    </Box>
  );
}
