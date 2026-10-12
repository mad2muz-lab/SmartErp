// Cache-busting comment: Updated to use existing userManagement.updateUserAccess mutation
import React, { useState } from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface FixUserStatusProps {
  userId: Id<"user_profiles">;
  userEmail: string;
}

export const FixUserStatus: React.FC<FixUserStatusProps> = ({ userId, userEmail }) => {
  const [isFixing, setIsFixing] = useState(false);
  const toast = useToast();
  const updateUserAccess = useMutation(api.userManagement.updateUserAccess);
  
  console.log('🔧 FixUserStatus component loaded with updateUserAccess mutation');

  const handleFixUserStatus = async () => {
    try {
      setIsFixing(true);
      
      console.log('🔧 Fixing user status:', {
        user_id: userId,
        email: userEmail,
        role: 'super_admin',
        is_active: true
      });
      
      const result = await updateUserAccess({
        user_id: userId,
        role: 'super_admin',
        permissions: ['read', 'write', 'delete', 'admin', 'super_admin'],
        is_active: true,
        organization_id: 'k1765vvn46nnjw50rpp4r79q3h7svym9' as Id<"organizations"> // Default organization
      });
      
      if (result.success) {
        console.log('✅ User status fixed successfully');
        toast({
          title: 'User Status Fixed',
          description: result.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Reload the page to refresh all data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to fix user status');
      }
    } catch (error) {
      console.error('Fix user status error:', error);
      toast({
        title: 'Fix Failed',
        description: error.message || 'Failed to fix user status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Button
      colorScheme="green"
      size="sm"
      onClick={handleFixUserStatus}
      isLoading={isFixing}
      loadingText="Fixing..."
    >
      Fix User Status
    </Button>
  );
};
