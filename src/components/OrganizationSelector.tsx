import React from 'react';
import {
  Box,
  Select,
  Text,
  HStack,
  Badge,
  VStack,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';

const OrganizationSelector: React.FC = () => {
  const { user, selectedOrganization, setSelectedOrganization, loading: authLoading } = useAuth();
  
  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box p={4}>
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            Loading authentication...
          </Text>
        </VStack>
      </Box>
    );
  }
  const toast = useToast();
  
  // Get user's organization assignments directly (reliable function)
  const userOrganizations = useQuery(
    api.globalUserManagement.getUserOrganizationAssignments,
    user?.id ? { user_id: user.id as any } : 'skip'
  );
  
  // Debug logging
  console.log('🔍 OrganizationSelector Debug:', {
    user: user ? { id: user.id, email: user.email } : null,
    userOrganizations: userOrganizations ? userOrganizations.length : 'loading',
    queryCalled: user?.id || user?.email ? 'YES' : 'NO'
  });

  // Handle errors gracefully
  if (userOrganizations === null) {
    return (
      <Box p={4}>
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            Error loading permissions
          </Text>
          <Text fontSize="xs" color="gray.500">
            Please refresh the page
          </Text>
        </VStack>
      </Box>
    );
  }
  
  const switchOrganization = useMutation(api.globalUserManagement.switchUserPrimaryOrganization);
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleOrganizationChange = async (orgId: string) => {
    if (!user?.id) return;
    
    console.log('🔄 Frontend: Switching to organization:', orgId, 'for user:', user.id);
    
    try {
      // Switch organization context in the backend
      const result = await switchOrganization({
        user_id: user.id as any,
        organization_id: orgId as any,
      });
      
      console.log('🔄 Frontend: Switch result:', result);
      
      if (result.success) {
        setSelectedOrganization(orgId);
        
        // Update user context with new organization info
        if (result.new_context) {
          // Update user state with new context
          // This will trigger a re-render with new permissions
        }
        
        toast({
          title: 'Organization Switched',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to switch organization',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Use organization assignments directly
  const effectiveOrganizations = userOrganizations || [];
  const isLoading = userOrganizations === undefined;

  if (isLoading) {
    return (
      <Box p={4}>
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            Loading permissions...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (!effectiveOrganizations || effectiveOrganizations.length === 0) {
    return (
      <Box p={4}>
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            No Organization Access
          </Text>
          <Text fontSize="xs" color="gray.500">
            Contact administrator for organization access
          </Text>
        </VStack>
      </Box>
    );
  }

  // Show organization count if user has multiple organizations
  const hasMultipleOrgs = effectiveOrganizations.length > 1;

  return (
    <Box p={4}>
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            Active Organization
          </Text>
          {hasMultipleOrgs && (
            <Badge colorScheme="blue" size="sm">
              {effectiveOrganizations.length} Organizations
            </Badge>
          )}
        </HStack>
        
        <Select
          size="sm"
          value={selectedOrganization || ''}
          onChange={(e) => handleOrganizationChange(e.target.value)}
          bg={cardBg}
          borderColor={borderColor}
        >
          {effectiveOrganizations.map((org) => (
            <option key={org.organization_id} value={org.organization_id}>
              {org.organization_name} {org.is_primary ? '(Primary)' : ''} - {org.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </Select>

        {selectedOrganization && (
          <Box>
            {(() => {
              const currentOrg = effectiveOrganizations.find(org => org.organization_id === selectedOrganization);
              if (!currentOrg) return null;
              
              return (
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.500">Role:</Text>
                    <Badge colorScheme="blue" size="sm">
                      {currentOrg.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.500">Currency:</Text>
                    <Badge colorScheme="green" size="sm">
                      {currentOrg.organization_currency || 'Not Set'}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.500">Status:</Text>
                    <Badge 
                      colorScheme={currentOrg.is_active ? 'green' : 'red'} 
                      size="sm"
                    >
                      {currentOrg.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </HStack>
                  {currentOrg.is_primary && (
                    <Badge colorScheme="purple" size="sm" textAlign="center">
                      Primary Organization
                    </Badge>
                  )}
                </VStack>
              );
            })()}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default OrganizationSelector;
