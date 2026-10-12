import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface FixUserRoleProps {
  userId: Id<"user_profiles">;
}

export const FixUserRole: React.FC<FixUserRoleProps> = ({ userId }) => {
  const toast = useToast();
  const fixUserRole = useMutation(api.fixUserRole.fixUserRole);

  const handleFixUserRole = async () => {
    try {
      const result = await fixUserRole({ user_id: userId });
      
      toast({
        title: "User Role Fixed",
        description: "User role has been updated to super_admin. Please refresh the page.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error fixing user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Button
      colorScheme="blue"
      onClick={handleFixUserRole}
      size="sm"
    >
      Fix User Role (Make Super Admin)
    </Button>
  );
};
