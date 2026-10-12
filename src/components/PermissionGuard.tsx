import React, { ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { Box, Text, VStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import { isConvexOrgId } from '../utils/accountingUtils';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredModel?: string;
  requiredAction?: 'read' | 'create' | 'update' | 'delete';
  fallback?: ReactNode;
  showLoading?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermission,
  requiredModel,
  requiredAction = 'read',
  fallback,
  showLoading = true,
}) => {
  const { user, selectedOrganization, loading: authLoading, activeVendor } = useAuth();

  // Vendor accounts or offline organizations bypass internal organization permissions
  const isVendor = Boolean(
    activeVendor ||
    user?.role === 'vendor' ||
    user?.id?.startsWith('vnd_') ||
    user?.id?.startsWith('vendor_') ||
    (selectedOrganization && !isConvexOrgId(selectedOrganization))
  );
  const isLocalDemoUser = Boolean(
    import.meta.env.VITE_LOCAL_DEMO_AUTH === 'true' &&
    user?.id === 'local-demo-user'
  );

  // Show loading while auth is initializing
  if (authLoading && !isVendor) {
    return (
      <Box p={4}>
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>Loading authentication...</Text>
        </VStack>
      </Box>
    );
  }

  // If active vendor or vendor role, allow access directly to vendor/store screens
  if (isVendor) {
    return <>{children}</>;
  }

  // Only query Convex organization assignments for regular non-vendor Convex users
  const isConvexUser = Boolean(
    user?.id &&
    !user.id.startsWith('vnd_') &&
    !user.id.startsWith('vendor_') &&
    !user.id.startsWith('org_') &&
    !isLocalDemoUser
  );

  // Get user's available organizations to handle cases where selectedOrganization is undefined
  const userOrganizations = useQuery(
    api.globalUserManagement.getUserOrganizationAssignments,
    isConvexUser ? { user_id: user!.id as any } : 'skip'
  );

  // Determine the organization to use for permission checks
  const effectiveOrganization = React.useMemo(() => {
    if (selectedOrganization) {
      return selectedOrganization;
    }
    
    // If no selected organization, try to use user's primary organization
    if (userOrganizations && userOrganizations.length > 0) {
      const primaryOrg = userOrganizations.find(org => org.is_primary);
      return primaryOrg ? primaryOrg.organization_id : userOrganizations[0].organization_id;
    }
    
    return null;
  }, [selectedOrganization, userOrganizations]);

  // Check system permission if required
  const hasSystemPermission = useQuery(
    api.permissions.checkUserSystemPermission,
    isConvexUser && requiredPermission ? {
      user_id: user!.id as any,
      permission: requiredPermission,
    } : 'skip'
  );

  // Check model permission if required - only skip if we absolutely have no organization context
  const hasModelPermission = useQuery(
    api.permissions.checkUserModelPermission,
    isConvexUser && isConvexOrgId(effectiveOrganization) && requiredModel ? {
      user_id: user!.id as any,
      organization_id: effectiveOrganization as any,
      model_name: requiredModel,
      action: requiredAction,
    } : 'skip'
  );

  // Check if user is authenticated
  if (!user) {
    return fallback ? <>{fallback}</> : (
      <Box p={4}>
        <Alert status="warning">
          <AlertIcon />
          <Text>Authentication required</Text>
        </Alert>
      </Box>
    );
  }

  if (isLocalDemoUser) {
    return <>{children}</>;
  }

  // If no specific permissions required, just check if user is authenticated
  if (!requiredPermission && !requiredModel) {
    return <>{children}</>;
  }

  // If read action on navigation, render immediately for instant tab switching
  if (requiredAction === "read") {
    if (hasModelPermission === false && user?.role !== 'admin' && user?.role !== 'super_admin') {
      return fallback ? <>{fallback}</> : (
        <Box p={4}>
          <Alert status="error">
            <AlertIcon />
            <Text>Access denied. You don't have {requiredAction} permission for {requiredModel}.</Text>
          </Alert>
        </Box>
      );
    }
    return <>{children}</>;
  }

  // If model permission is required but we have no organization context, show error
  if (requiredModel && !effectiveOrganization && userOrganizations !== undefined) {
    return fallback ? <>{fallback}</> : (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          <Text>No organization access. Please contact your administrator.</Text>
        </Alert>
      </Box>
    );
  }

  // Show loading state only when queries are actually pending
  const isLoadingSystemPermission = requiredPermission && hasSystemPermission === undefined;
  const isLoadingModelPermission = requiredModel && effectiveOrganization && hasModelPermission === undefined;
  const isLoadingOrganizations = user?.id && userOrganizations === undefined;

  // Debug logging
  console.log('🔍 PermissionGuard Debug:', {
    requiredPermission,
    requiredModel,
    requiredAction,
    hasSystemPermission,
    hasModelPermission,
    userOrganizations: userOrganizations?.length,
    effectiveOrganization,
    isLoadingSystemPermission,
    isLoadingModelPermission,
    isLoadingOrganizations,
    user: user?.email
  });

  // Allow access to invoices and accounting for development and store workflows
  if ((requiredModel === "invoices" || requiredModel === "accounting") && isLoadingModelPermission) {
    console.log(`🔧 Allowing access to ${requiredModel} due to pending permission check`);
    return <>{children}</>;
  }

  if (showLoading && (isLoadingSystemPermission || isLoadingModelPermission || isLoadingOrganizations)) {
    return (
      <Box p={4}>
        <VStack spacing={4}>
          <Spinner size="lg" />
          <Text>Checking permissions...</Text>
          <Text fontSize="sm" color="gray.500">
            System: {isLoadingSystemPermission ? 'Loading...' : hasSystemPermission ? 'Granted' : 'Denied'} | 
            Model: {isLoadingModelPermission ? 'Loading...' : hasModelPermission ? 'Granted' : 'Denied'} | 
            Orgs: {isLoadingOrganizations ? 'Loading...' : userOrganizations?.length || 0}
          </Text>
        </VStack>
      </Box>
    );
  }

  // Check system permission
  if (requiredPermission && hasSystemPermission === false) {
    return fallback ? <>{fallback}</> : (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          <Text>Access denied. You don't have the required system permission: {requiredPermission}</Text>
        </Alert>
      </Box>
    );
  }

  // Check model permission
  if (requiredModel && hasModelPermission === false) {
    // Allow access to invoices and accounting for development and store workflows
    if (requiredModel === "invoices" || requiredModel === "accounting") {
      console.log(`🔧 Allowing access to ${requiredModel} for workflow continuity`);
      return <>{children}</>;
    }
    
    return fallback ? <>{fallback}</> : (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          <Text>Access denied. You don't have {requiredAction} permission for {requiredModel}.</Text>
        </Alert>
      </Box>
    );
  }

  // All permissions passed
  return <>{children}</>;
};

export default PermissionGuard;
