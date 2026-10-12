import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Container,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiClock, FiMail, FiArrowLeft } from 'react-icons/fi';
import { sanitizeUserState, clearSecurityCache } from '../utils/clearCache';

interface LocationState {
  message?: string;
  email?: string;
  name?: string;
  status?: string;
}

const PendingApprovalScreen: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // CRITICAL SECURITY FIX: Force fresh content and clear any cached messages
  React.useEffect(() => {
    // Clear security cache to prevent stale data
    clearSecurityCache();
    
    // Force page refresh if no state is provided (prevents stale data)
    if (!state || !state.message) {
      console.log('🔄 No state provided, redirecting to login to prevent stale data');
      navigate('/login', { replace: true });
      return;
    }
    
    // Sanitize the state to remove any sensitive information
    const sanitizedState = sanitizeUserState(state);
    console.log('🔍 PendingApprovalScreen sanitized state:', sanitizedState);
    
    // If the sanitized state is different, update the URL state
    if (JSON.stringify(sanitizedState) !== JSON.stringify(state)) {
      navigate(location.pathname, { 
        state: sanitizedState,
        replace: true 
      });
    }
  }, [state, navigate, location.pathname]);

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <Container maxW="md" py="20">
      <VStack spacing="8" textAlign="center">
        {/* Header */}
        <VStack spacing="4">
          <Box
            p="4"
            borderRadius="full"
            bg="orange.100"
            color="orange.600"
          >
            <Icon as={FiClock} boxSize="8" />
          </Box>
          <Heading size="lg" color="gray.700">
            {state?.status === "rejected" 
              ? "Account Request Rejected" 
              : state?.status === "approved_but_no_organization" 
              ? "Awaiting Organization Assignment" 
              : "Account Pending Approval"}
          </Heading>
        </VStack>

        {/* Main Content */}
        <Card bg={cardBg} border="1px" borderColor={borderColor} w="full">
          <CardBody>
            <VStack spacing="6">
              <Alert status={state?.status === "rejected" ? "error" : "warning"} borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>
                    {state?.status === "rejected" 
                      ? "Access Request Rejected" 
                      : "Access Request Submitted!"}
                  </AlertTitle>
                  <AlertDescription mt="2">
                    {state?.message || "Your account is pending approval."}
                  </AlertDescription>
                </Box>
              </Alert>

              {state?.name && (
                <VStack spacing="2">
                  <Text fontWeight="semibold" color="gray.700">
                    Welcome, {state.name}!
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Email: {state.email}
                  </Text>
                </VStack>
              )}

              <VStack spacing="4" textAlign="left" w="full">
                <Box p="4" bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                  <VStack spacing="3" align="start">
                    <HStack>
                      <Icon as={FiMail} color="blue.600" />
                      <Text fontWeight="semibold" color="blue.700">
                        What happens next?
                      </Text>
                    </HStack>
                    <VStack spacing="2" align="start" pl="6">
                      {state?.status === "rejected" ? (
                        <>
                          <Text fontSize="sm" color="red.600">
                            ❌ Step 1: Account approval - <strong>REJECTED</strong>
                          </Text>
                          <Text fontSize="sm" color="red.600">
                            • Your account request has been denied
                          </Text>
                          <Text fontSize="sm" color="red.600">
                            • You cannot access the system with this account
                          </Text>
                          <Text fontSize="sm" color="red.600">
                            • Contact administrator if you believe this is an error
                          </Text>
                        </>
                      ) : state?.status === "approved_but_no_organization" ? (
                        <>
                          <Text fontSize="sm" color="blue.600">
                            ✅ Step 1: Account approval - <strong>COMPLETED</strong>
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            ⏳ Step 2: Waiting for organization assignment and permissions
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            • You will be assigned to an organization
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            • Your role and permissions will be configured
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            • You'll receive system access once assignment is complete
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text fontSize="sm" color="blue.600">
                            ⏳ Step 1: Your request has been submitted for approval
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            • Your request will be reviewed and access will be granted
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            • Once approved, you'll be assigned to an organization
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            • Your role and permissions will be configured
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            • Final step: You'll receive full system access
                          </Text>
                        </>
                      )}
                    </VStack>
                  </VStack>
                </Box>

                <Box p="4" bg="gray.50" borderRadius="md" border="1px solid" borderColor="gray.200">
                  <VStack spacing="2" align="start">
                    <Text fontWeight="semibold" color="gray.700">
                      Need immediate access?
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Contact support for faster approval.
                    </Text>
                  </VStack>
                </Box>
              </VStack>

              <Button
                onClick={handleBackToLogin}
                variant="outline"
                leftIcon={<FiArrowLeft />}
                w="full"
              >
                Back to Login
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Footer */}
        <VStack spacing="2">
          <Text fontSize="sm" color="gray.500">
            Trading ERP System
          </Text>
          <Text fontSize="xs" color="gray.400">
            Secure access management for your business
          </Text>
        </VStack>
      </VStack>
    </Container>
  );
};

export default PendingApprovalScreen;
