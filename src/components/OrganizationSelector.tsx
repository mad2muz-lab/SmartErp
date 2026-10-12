import React from 'react';
import {
  Box,
  Select,
  Text,
  HStack,
  Badge,
  VStack,
  Button,
  Divider,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { FiLogOut, FiBriefcase } from 'react-icons/fi';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { vendorAuthService } from '../services/vendorAuthService';

const OrganizationSelector: React.FC = () => {
  const { user, selectedOrganization, setSelectedOrganization, loading: authLoading, activeVendor } = useAuth();
  
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

  // Query all organizations from Convex as a reliable global fallback
  const allOrganizations = useQuery(api.organizations.listOrganizations);
  const toast = useToast();

  // Active vendor session display with option to switch to Main ERP
  if (activeVendor) {
    const storeName = activeVendor?.storeNameArabic || activeVendor?.storeName || 'Vendor Store';
    return (
      <Box p={3} mx={2} my={2} bg="teal.50" borderRadius="lg" border="1px solid" borderColor="teal.200">
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={0}>
              <Text fontSize="10px" textTransform="uppercase" fontWeight="bold" color="teal.600">
                Active Store / المتجر الحالي
              </Text>
              <Text fontSize="sm" fontWeight="bold" color="teal.900" noOfLines={1}>
                {storeName}
              </Text>
            </VStack>
            <Badge colorScheme="teal" variant="subtle" fontSize="10px">
              POS
            </Badge>
          </HStack>

          <Button
            size="xs"
            colorScheme="blue"
            variant="solid"
            leftIcon={<FiBriefcase />}
            onClick={() => {
              vendorAuthService.endVendorSession();
              localStorage.removeItem('trading_erp_active_vendor_session');
              const targetOrg = allOrganizations?.find((org) => org.is_active !== false) || allOrganizations?.[0];
              if (targetOrg) {
                setSelectedOrganization(targetOrg._id);
                localStorage.setItem('trading-erp-organization', targetOrg._id);
              } else {
                setSelectedOrganization('');
                localStorage.removeItem('trading-erp-organization');
              }
              window.location.reload();
            }}
          >
            Switch to Company ERP / الشركات
          </Button>
        </VStack>
      </Box>
    );
  }

  // Check if user is a standard Convex user
  const isConvexUser = Boolean(
    user?.id &&
    !activeVendor &&
    user?.role !== 'vendor' &&
    !user.id.startsWith('vendor_') &&
    !user.id.startsWith('vnd_') &&
    user.id !== 'local-demo-user'
  );

  // Get user's organization assignments directly
  const userOrganizations = useQuery(
    api.globalUserManagement.getUserOrganizationAssignments,
    isConvexUser ? { user_id: user?.id as any } : 'skip'
  );

  const switchOrganization = useMutation(api.globalUserManagement.switchUserPrimaryOrganization);
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Compute effective organizations: assignments preferred, otherwise fallback to all organizations
  const effectiveOrganizations = React.useMemo(() => {
    if (userOrganizations && userOrganizations.length > 0) {
      return userOrganizations;
    }
    if (allOrganizations && allOrganizations.length > 0) {
      return allOrganizations.map(org => ({
        organization_id: org._id,
        organization_name: org.name_arabic ? `${org.name} (${org.name_arabic})` : org.name,
        role: (user?.role || 'admin').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        is_primary: org._id === selectedOrganization,
        is_active: org.is_active ?? true,
        organization_currency: org.currency || 'SAR',
      }));
    }
    return [];
  }, [userOrganizations, allOrganizations, selectedOrganization, user?.role]);

  // Auto-select first organization if none currently selected
  React.useEffect(() => {
    if (!selectedOrganization && effectiveOrganizations.length > 0) {
      const defaultOrgId = effectiveOrganizations[0].organization_id;
      setSelectedOrganization(defaultOrgId);
      localStorage.setItem('trading-erp-organization', defaultOrgId);
    }
  }, [selectedOrganization, effectiveOrganizations, setSelectedOrganization]);

  const handleOrganizationChange = async (orgId: string) => {
    console.log('🔄 Frontend: Switching to organization:', orgId);
    setSelectedOrganization(orgId);
    localStorage.setItem('trading-erp-organization', orgId);

    if (user?.id && user.role !== 'vendor' && !user.id.startsWith('vendor_')) {
      try {
        await switchOrganization({
          user_id: user.id as any,
          organization_id: orgId as any,
        });
      } catch (error) {
        console.warn('Switch organization mutation warning:', error);
      }
    }

    toast({
      title: 'Organization Switched',
      description: 'Active organization updated successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const isLoading = userOrganizations === undefined && allOrganizations === undefined;

  if (isLoading) {
    return (
      <Box p={4}>
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" fontWeight="medium" color="gray.600">
            Loading organizations...
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
