import React from 'react';
import {
  VStack,
  HStack,
  Input,
  Button,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Avatar,
  IconButton,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiPlus, FiShield, FiStar, FiEdit, FiTrash, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface User {
  _id: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  role: string;
  is_global_admin?: boolean;
  is_active?: boolean;
  organization_assignments: Array<{
    organization_id: string;
    organization_name: string;
    role: string;
  }>;
  primary_organization_id?: string;
  primary_organization_name?: string;
}

interface UsersManagementTabProps {
  users: User[] | undefined;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onCreateUser: () => void;
  onInitializePermissions: () => void;
  onFixSuperAdminContext: () => void;
  onPromoteToGlobalAdmin: () => void;
  onUserAssignment: (user: User, action: 'assign' | 'edit' | 'remove', assignment?: any) => void;
  onMakeSuperAdmin: (email: string) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string, email: string) => void;
  onGrantPermissions: (user: User) => void;
  onDisableUser: (userId: string, email: string) => void;
  onEnableUser: (userId: string, email: string) => void;
  isLoading: boolean;
  isInitializingPermissions: boolean;
  isFixingSuperAdmin: boolean;
  showPromoteButton: boolean;
  currentUserEmail?: string;
}

const UsersManagementTab: React.FC<UsersManagementTabProps> = ({
  users,
  searchTerm,
  onSearchChange,
  onCreateUser,
  onInitializePermissions,
  onFixSuperAdminContext,
  onPromoteToGlobalAdmin,
  onUserAssignment,
  onMakeSuperAdmin,
  onEditUser,
  onDeleteUser,
  onGrantPermissions,
  onDisableUser,
  onEnableUser,
  isLoading,
  isInitializingPermissions,
  isFixingSuperAdmin,
  showPromoteButton,
  currentUserEmail,
}) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'super_admin': return 'purple';
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'user': return 'green';
      case 'viewer': return 'gray';
      default: return 'gray';
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Input
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          maxW="400px"
        />
        <HStack spacing={4}>
          <Button
            colorScheme="blue"
            size="sm"
            onClick={onCreateUser}
            leftIcon={<FiPlus />}
          >
            Create User
          </Button>
          <Button
            colorScheme="green"
            size="sm"
            onClick={onInitializePermissions}
            leftIcon={<FiShield />}
            isLoading={isInitializingPermissions}
          >
            Initialize Permissions
          </Button>
          <Button
            colorScheme="purple"
            size="sm"
            onClick={onFixSuperAdminContext}
            leftIcon={<FiStar />}
            isLoading={isFixingSuperAdmin}
          >
            Fix Super Admin Context
          </Button>
          {showPromoteButton && (
            <Button
              colorScheme="purple"
              size="sm"
              onClick={onPromoteToGlobalAdmin}
              leftIcon={<FiShield />}
            >
              Promote to Global Admin
            </Button>
          )}
          <Text fontSize="sm" color="gray.500">
            {users?.length} users found
          </Text>
        </HStack>
      </HStack>

      <Card>
        <CardBody p={0}>
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>User</Th>
                <Th>Primary Organization</Th>
                <Th>All Assignments</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users?.map((user) => (
                <Tr key={user._id}>
                  <Td>
                    <HStack>
                      <Avatar 
                        size="sm" 
                        name={`${user.given_name} ${user.family_name}`}
                        src={user.picture}
                      />
                      <VStack align="start" spacing={0}>
                        <HStack>
                          <Text fontWeight="medium">
                            {user.given_name} {user.family_name}
                          </Text>
                          {user.is_global_admin && (
                            <Badge colorScheme="purple" size="sm">
                              Global Admin
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm" color="gray.500">
                          {user.email}
                        </Text>
                      </VStack>
                    </HStack>
                  </Td>
                  <Td>
                    {user.primary_organization_name ? (
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{user.primary_organization_name}</Text>
                        <Badge colorScheme={getRoleBadgeColor(user.role)} size="sm">
                          {formatRole(user.role)}
                        </Badge>
                      </VStack>
                    ) : (
                      <Text color="gray.400" fontStyle="italic">No primary org</Text>
                    )}
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1}>
                      {(user.organization_assignments || []).map((assignment) => (
                        <HStack key={assignment.organization_id} spacing={2}>
                          <Text fontSize="sm">{assignment.organization_name}</Text>
                          <Badge 
                            colorScheme={getRoleBadgeColor(assignment.role)} 
                            size="xs"
                          >
                            {formatRole(assignment.role)}
                          </Badge>
                          {assignment.organization_id === user.primary_organization_id && (
                            <Badge colorScheme="blue" size="xs">Primary</Badge>
                          )}
                          <IconButton
                            aria-label="Edit assignment"
                            icon={<FiEdit />}
                            size="xs"
                            variant="ghost"
                            onClick={() => onUserAssignment(user, 'edit', assignment)}
                          />
                          <IconButton
                            aria-label="Remove assignment"
                            icon={<FiTrash />}
                            size="xs"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => {
                              onUserAssignment(user, 'remove', assignment);
                            }}
                          />
                        </HStack>
                      ))}
                      {(!user.organization_assignments || user.organization_assignments.length === 0) && (
                        <Text fontSize="sm" color="gray.400" fontStyle="italic">
                          No assignments
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={
                      user.role === 'rejected' ? 'red' : 
                      user.is_active ? 'green' : 'orange'
                    }>
                      {user.role === 'rejected' ? 'REJECTED' : 
                       user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <VStack spacing={1} align="start">
                      <HStack spacing={2}>
                        <Button
                          leftIcon={<FiPlus />}
                          size="sm"
                          variant="outline"
                          onClick={() => onUserAssignment(user, 'assign')}
                        >
                          Assign to Org
                        </Button>
                        <Button
                          leftIcon={<FiShield />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => onGrantPermissions(user)}
                        >
                          Grant Permissions
                        </Button>
                        <IconButton
                          aria-label="Edit user"
                          icon={<FiEdit />}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => onEditUser(user)}
                        />
                        <IconButton
                          aria-label="Delete user"
                          icon={<FiTrash />}
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => onDeleteUser(user._id, user.email)}
                        />
                      </HStack>
                      {user.role !== 'super_admin' && (
                        <Button
                          leftIcon={<FiShield />}
                          size="sm"
                          variant="outline"
                          colorScheme="purple"
                          onClick={() => onMakeSuperAdmin(user.email)}
                        >
                          Make Super Admin
                        </Button>
                      )}
                      {user.is_active ? (
                        <Button
                          leftIcon={<FiXCircle />}
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => onDisableUser(user._id, user.email)}
                        >
                          Disable User
                        </Button>
                      ) : (
                        <Button
                          leftIcon={<FiCheckCircle />}
                          size="sm"
                          variant="outline"
                          colorScheme="green"
                          onClick={() => onEnableUser(user._id, user.email)}
                        >
                          Enable User
                        </Button>
                      )}
                    </VStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default UsersManagementTab;
