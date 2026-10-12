import * as React from 'react';
import { Box, Spinner, Center, Text, VStack, Button } from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import CorporateGovernanceModule from '../components/governance/CorporateGovernanceModule';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class GovernanceErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Governance Console Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center p={10}>
          <VStack spacing={4} maxW="md" textAlign="center">
            <Text fontWeight="bold" fontSize="lg" color="red.500">
              Corporate Governance Display Error (خطأ في تحميل الحوكمة)
            </Text>
            <Text color="gray.600" fontSize="sm">
              {this.state.error?.message || 'An error occurred while loading the Corporate Governance module.'}
            </Text>
            <Button
              colorScheme="blue"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Console (إعادة التحميل)
            </Button>
          </VStack>
        </Center>
      );
    }
    return this.props.children;
  }
}

export const CorporateGovernanceScreen: React.FC = () => {
  const { selectedOrganization, setSelectedOrganization, user, loading: authLoading, organizationDetails } = useAuth();

  // Query organizations from Convex
  const organizations = useQuery(api.organizations.listOrganizations);

  // Auto-select first organization if none is active
  React.useEffect(() => {
    if (!selectedOrganization && organizations && organizations.length > 0 && setSelectedOrganization) {
      const firstOrg = organizations[0];
      if (firstOrg && (firstOrg as any)._id) {
        setSelectedOrganization((firstOrg as any)._id);
      }
    }
  }, [selectedOrganization, organizations, setSelectedOrganization]);

  const candidateOrgId = (
    typeof selectedOrganization === 'string'
      ? selectedOrganization
      : (selectedOrganization as any)?._id || organizationDetails?._id || user?.organizationId
  ) as string | undefined;

  // Resilient fallback ID so the governance module is never blocked from opening
  const fallbackOrgId = (organizations && organizations.length > 0)
    ? (organizations[0] as any)._id
    : 'org_consortium_lead';

  const effectiveOrgId = (candidateOrgId || fallbackOrgId) as any;
  const effectiveUserId = (user?.id || (user as any)?._id || 'user_admin') as any;

  if (authLoading && !candidateOrgId && organizations === undefined) {
    return (
      <Center p={10}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading Corporate Governance Console...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <GovernanceErrorBoundary>
      <Box>
        <CorporateGovernanceModule
          organizationId={effectiveOrgId}
          userId={effectiveUserId}
        />
      </Box>
    </GovernanceErrorBoundary>
  );
};

export default CorporateGovernanceScreen;
