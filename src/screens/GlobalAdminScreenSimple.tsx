import React from 'react';
import { Box, Heading, Text, Center, VStack } from '@chakra-ui/react';
import { useAuth } from '../contexts/shared/AuthContext';

const GlobalAdminScreenSimple: React.FC = () => {
  const { user, userOrganizations, organizationDetails, loading } = useAuth();
  
  console.log('🔧 Simple GlobalAdminScreen - User:', user?.email);
  console.log('🔧 Simple GlobalAdminScreen - Loading:', loading);
  console.log('🔧 Simple GlobalAdminScreen - UserOrgs:', userOrganizations?.length);
  
  if (loading) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Text>Loading...</Text>
        </VStack>
      </Center>
    );
  }
  
  if (!user) {
    return (
      <Center minH="100vh">
        <VStack spacing={4}>
          <Text>No user found</Text>
        </VStack>
      </Center>
    );
  }
  
  return (
    <Box maxW="full" mx="auto" p={4}>
      <Heading size="lg" mb={4} color="purple.600">
        Global Administration - SIMPLE TEST
      </Heading>
      <Text color="gray.600" mb={4}>
        This is a simple test to check if React rendering works
      </Text>
      <Box p={4} bg="green.50" borderRadius="md" border="1px solid green.200">
        <Text color="green.700">
          ✅ React is working! User: {user.email}, Role: {user.role}
        </Text>
        <Text color="green.700">
          Organizations: {userOrganizations?.length || 0}
        </Text>
        <Text color="green.700">
          Current Org: {organizationDetails?.name || 'None'}
        </Text>
      </Box>
    </Box>
  );
};

export default GlobalAdminScreenSimple;
