import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

interface Props {
  children: ReactNode;
  /** When this value changes (e.g. route path), a previously caught error is cleared. */
  resetKey?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="gray.50"
        >
          <VStack spacing={6} maxW="md" textAlign="center">
            <Heading size="lg" color="red.500">
              Something went wrong
            </Heading>
            <Text color="gray.600">
              We're sorry, but something unexpected happened. Please try refreshing the page.
            </Text>
            {this.state.error && (
              <Box
                p={4}
                bg="red.50"
                borderRadius="md"
                border="1px"
                borderColor="red.200"
                maxW="full"
                overflow="auto"
              >
                <Text fontSize="sm" color="red.700" fontFamily="mono">
                  {this.state.error.message}
                </Text>
              </Box>
            )}
            <Button
              colorScheme="blue"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
