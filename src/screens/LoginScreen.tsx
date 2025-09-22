import React, { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  useToast,
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/shared/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { testEnvironmentVariables } from '../utils/envTest';
import { logConvexStatus } from '../utils/convexStatus';

const LoginScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Test environment variables on component mount
  React.useEffect(() => {
    testEnvironmentVariables();
    logConvexStatus(); // Check Convex connection status

    // Simple cleanup for fresh login experience
    sessionStorage.clear();

    // Clear any leftover auth data but preserve Google OAuth state
    const keysToClean = ['trading-erp-user', 'trading-erp-organization'];
    keysToClean.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

    console.log('✅ Login screen ready');
  }, []);

  const handleGoogleLogin = () => {
    try {
      loginWithGoogle();
    } catch (error) {
      toast({
        title: 'Google Login Error',
        description: 'Failed to initiate Google login. Please check your configuration.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '4', sm: '8' }}>
      <VStack spacing="8">
        <VStack spacing="6" textAlign="center">
          <Heading size="lg" color="blue.600">
            Trading ERP
          </Heading>
          <Text color="gray.600">
            Sign in to your account to continue
          </Text>
        </VStack>

        <Card bg={cardBg} border="1px" borderColor={borderColor} w="full">
          <CardBody>
            <VStack spacing="6">
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Secure authentication via Google OAuth
              </Text>
              
              <Button
                onClick={handleGoogleLogin}
                colorScheme="blue"
                size="lg"
                w="full"
                leftIcon={<FcGoogle />}
                isLoading={isLoading}
                _hover={{
                  bg: 'blue.600',
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg',
                }}
              >
                Continue with Google
              </Button>

              {/* Emergency reset button for auth loop issues */}
        <Button
          onClick={() => {
            console.log('🔄 Clearing all authentication data...');
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear specific auth-related keys
            localStorage.removeItem('trading-erp-user');
            localStorage.removeItem('trading-erp-organization');
            localStorage.removeItem('manual-organization');
            
            console.log('🔄 All auth data cleared, reloading page...');
            window.location.reload();
          }}
          variant="ghost"
          size="sm"
          colorScheme="red"
          w="full"
        >
          🔄 Clear Auth Data & Refresh (if stuck in login loop)
        </Button>

            </VStack>
          </CardBody>
        </Card>

        {/* Demo credentials removed for security - production environment */}
      </VStack>
    </Container>
  );
};

export default LoginScreen;
