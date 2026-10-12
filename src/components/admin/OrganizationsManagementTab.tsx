import React from 'react';
import {
  VStack,
  HStack,
  Heading,
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
  IconButton,
  Text,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash } from 'react-icons/fi';

interface Organization {
  _id: string;
  name: string;
  email: string;
  currency?: string;
  active_users: number;
  total_users: number;
  is_active: boolean;
  assigned_users: Array<{
    user_id: string;
    user_name: string;
    role: string;
    is_primary: boolean;
  }>;
}

interface OrganizationsManagementTabProps {
  organizations: Organization[] | undefined;
  onCreateOrganization: () => void;
  onEditOrganization: (org: Organization) => void;
  onDeleteOrganization: (orgId: string, orgName: string) => void;
  isLoading: boolean;
}

const OrganizationsManagementTab: React.FC<OrganizationsManagementTabProps> = ({
  organizations,
  onCreateOrganization,
  onEditOrganization,
  onDeleteOrganization,
  isLoading,
}) => {
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
        <Heading size="md">Organizations Management</Heading>
        <Button
          colorScheme="green"
          size="sm"
          onClick={onCreateOrganization}
          leftIcon={<FiPlus />}
        >
          Create Organization
        </Button>
      </HStack>
      
      <Card>
        <CardBody p={0}>
          <Table variant="simple">
            <Thead bg="gray.50">
              <Tr>
                <Th>Organization</Th>
                <Th>Users</Th>
                <Th>Assigned Users</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {organizations?.map((org) => (
                <Tr key={org._id}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">{org.name}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {org.email || 'No email'} • {org.currency || 'No currency'}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">
                        {org.active_users || 0} / {org.total_users || 0}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Active / Total
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={1} maxW="300px">
                      {(org.assigned_users || []).slice(0, 3).map((user) => (
                        <HStack key={user.user_id} spacing={2}>
                          <Text fontSize="sm">{user.user_name}</Text>
                          <Badge 
                            colorScheme={user.role === 'admin' ? 'red' : 'blue'} 
                            size="xs"
                          >
                            {user.role}
                          </Badge>
                          {user.is_primary && (
                            <Badge colorScheme="blue" size="xs">Primary</Badge>
                          )}
                        </HStack>
                      ))}
                      {(org.assigned_users || []).length > 3 && (
                        <Text fontSize="sm" color="gray.500">
                          +{(org.assigned_users || []).length - 3} more...
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={org.is_active ? 'green' : 'red'}>
                      {org.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        aria-label="Edit organization"
                        icon={<FiEdit />}
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                        onClick={() => onEditOrganization(org)}
                      />
                      <IconButton
                        aria-label="Delete organization"
                        icon={<FiTrash />}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => onDeleteOrganization(org._id, org.name)}
                      />
                    </HStack>
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

export default OrganizationsManagementTab;
