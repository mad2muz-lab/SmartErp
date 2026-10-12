import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  VStack,
  Spinner,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Container,
  Button,
} from '@chakra-ui/react';
import { googleAuthService } from '../utils/googleAuth';
import { useAuth } from '../contexts/shared/AuthContext';

const AuthCallbackScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleGoogleAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processed, setProcessed] = useState(false);
  // Global flag to prevent multiple auth callback processing across component instances
  const globalProcessingFlag = useRef('auth-callback-processing');

  useEffect(() => {
    // Strict check: if already processed at any level, don't process again
    if (processed) {
      console.log('🔄 This component instance has already processed, skipping...');
      return;
    }

    // Check global processing flag (other component instances)
    const isProcessing = sessionStorage.getItem(globalProcessingFlag.current);
    if (isProcessing) {
      console.log('🔄 Another auth callback is already in progress, skipping...');
      // Don't set loading to false - let the other instance handle it
      return;
    }

    // Check if user is already authenticated (fresh check)
    const storedUser = localStorage.getItem('trading-erp-user');
    if (storedUser) {
      console.log('🏠 User already authenticated, redirecting...');
      setLoading(false);
      navigate('/', { replace: true });
      return;
    }

    // Mark as processing globally
    sessionStorage.setItem(globalProcessingFlag.current, 'true');
    setProcessed(true); // Mark this component instance as processed

    const processCallback = async () => {
      try {

        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (!code && !error) {
          // No code or error means this might be a navigation without OAuth
          console.log('🔄 No OAuth code found, skipping processing');
          setLoading(false);
          return;
        }

        if (error) {
          setError(`Authentication failed: ${error}`);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('No authorization code received');
          setLoading(false);
          return;
        }

        // Handle the OAuth callback
        console.log('📞 Calling googleAuthService.handleCallback...');
        const googleUser = await googleAuthService.handleCallback(code);
        
        // Pass to auth context to create/login user
        console.log('👤 Calling handleGoogleAuth...');
        await handleGoogleAuth(googleUser);

        // Wait for auth state to be updated before navigating
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check if user was set (meaning they are approved)
        const storedUser = localStorage.getItem('trading-erp-user');
        if (storedUser) {
          console.log('🏠 User is approved, redirecting to dashboard...');
          // Clear global processing flag before navigation
          sessionStorage.removeItem(globalProcessingFlag.current);
          navigate('/', { replace: true });
        } else {
          console.log('⏳ User requires approval, should be on pending approval page');
          // Clear global processing flag
          sessionStorage.removeItem(globalProcessingFlag.current);
          // Don't navigate - handleGoogleAuth should have already navigated
        }
        
      } catch (err) {
        console.error('Auth callback error:', err);

        // Handle specific error cases
        if (err instanceof Error && err.message.includes('OAuth callback already in progress')) {
          console.log('🔄 OAuth callback already in progress, waiting...');
          // Wait a bit and check if authentication completed
          setTimeout(() => {
            const storedUser = localStorage.getItem('trading-erp-user');
            if (storedUser) {
              console.log('🏠 Authentication completed, redirecting...');
              navigate('/', { replace: true });
            } else {
              setError('Authentication is still in progress. Please refresh the page.');
              setLoading(false);
            }
          }, 2000);
        } else {
          setError(err instanceof Error ? err.message : 'Authentication failed');
          setLoading(false);
        }

        // Clear global processing flag on error
        sessionStorage.removeItem(globalProcessingFlag.current);
      }
    };

    processCallback();

    // Cleanup function to reset global flag when component unmounts
    return () => {
      sessionStorage.removeItem(globalProcessingFlag.current);
    };
  }, []); // Empty dependency array to run only once

  if (loading) {
    return (
      <Container maxW="md" py="20">
        <VStack spacing="6" textAlign="center">
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" color="gray.600">
            Completing authentication...
          </Text>
          <Text fontSize="sm" color="gray.500">
            Please wait while we sign you in
          </Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="md" py="20">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription mt="2">
              {error}
            </AlertDescription>
          </Box>
        </Alert>
        <VStack mt="6" spacing="4">
          <Button colorScheme="blue" onClick={() => navigate('/login')}>
            Return to Login
          </Button>
        </VStack>
      </Container>
    );
  }

  return null;
};

export default AuthCallbackScreen;
