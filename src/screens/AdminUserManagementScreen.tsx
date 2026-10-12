import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Select,
  FormControl,
  FormLabel,
  Textarea,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { FiCheck, FiX, FiUsers, FiClock, FiEdit, FiTrash2 } from 'react-icons/fi';

const AdminUserManagementScreen: React.FC = () => {
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [selectedRole, setSelectedRole] = useState('user');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { isOpen: isApprovalOpen, onOpen: onApprovalOpen, onClose: onApprovalClose } = useDisclosure();
  const { isOpen: isUserEditOpen, onOpen: onUserEditOpen, onClose: onUserEditClose } = useDisclosure();
  
  const toast = useToast();

  // Fetch data
  const pendingApprovals = useQuery(api.userManagement.listPendingApprovals);
  const allUsers = useQuery(api.userManagement.listAllUsersGlobal);
  const organizations = useQuery(api.organizations.listOrganizations);

  // Mutations
  const approveUser = useMutation(api.userManagement.approveUser);
  const rejectUser = useMutation(api.userManagement.rejectUser);
  const updateUserAccess = useMutation(api.userManagement.updateUserAccess);

  const handleApprovalAction = (approval: any, action: 'approve' | 'reject') => {
    setSelectedApproval(approval);
    setApprovalAction(action);
    setSelectedRole('user');
    setRejectionReason('');
    onApprovalOpen();
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    onUserEditOpen();
  };

  const processApproval = async () => {
    if (!selectedApproval) return;

    try {
      if (approvalAction === 'approve') {
        const permissions = getPermissionsForRole(selectedRole);
        const defaultOrgId = organizations?.[0]?._id;
        
        if (!defaultOrgId) {
          throw new Error('No organization available for assignment');
        }

        await approveUser({
          approval_id: selectedApproval._id,
          approved_by: 'admin', // You can get this from current user context
          organization_id: defaultOrgId,
          role: selectedRole,
          permissions,
        });

        toast({
          title: 'User Approved',
          description: `${selectedApproval.email} has been approved successfully.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        await rejectUser({
          approval_id: selectedApproval._id,
          rejected_by: 'admin',
          reason: rejectionReason,
        });

        toast({
          title: 'User Rejected',
          description: `${selectedApproval.email} has been rejected.`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }

      onApprovalClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process approval',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      const permissions = getPermissionsForRole(selectedRole);
      
      await updateUserAccess({
        user_id: selectedUser._id,
        role: selectedRole,
        permissions,
        is_active: selectedUser.is_active,
        organization_id: selectedUser.organization_id,
      });

      toast({
        title: 'User Updated',
        description: `User access has been updated successfully.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onUserEditClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getPermissionsForRole = (role: string): string[] => {
    switch (role) {
      case 'super_admin':
        return ['read', 'write', 'delete', 'approve', 'manage_users', 'manage_system'];
      case 'admin':
        return ['read', 'write', 'delete', 'approve', 'manage_users'];
      case 'manager':
        return ['read', 'write', 'approve'];
      case 'user':
        return ['read', 'write'];
      case 'viewer':
        return ['read'];
      default:
        return ['read'];
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'purple';
      case 'admin': return 'red';
      case 'manager': return 'orange';
      case 'user': return 'blue';
      case 'viewer': return 'gray';
      default: return 'gray';
    }
  };

  if (!pendingApprovals || !allUsers) {
    return (
      <Center minH="400px">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box p="6">
      <VStack spacing="6" align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing="1">
            <Heading size="lg">User Management</Heading>
            <Text color="gray.600">Manage user access and approvals</Text>
          </VStack>
        </HStack>

        {/* Tabs for different views */}
        <Tabs>
          <TabList>
            <Tab>
              <HStack>
                <FiClock />
                <Text>Pending Approvals ({pendingApprovals.length})</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack>
                <FiUsers />
                <Text>All Users ({allUsers.length})</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Pending Approvals Tab */}
            <TabPanel px="0">
              {pendingApprovals.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  No pending approvals at this time.
                </Alert>
              ) : (
                <Card>
                  <CardBody p="0">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>User</Th>
                          <Th>Email</Th>
                          <Th>Requested</Th>
                          <Th>Role</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pendingApprovals.map((approval) => (
                          <Tr key={approval._id}>
                            <Td>
                              <VStack align="start" spacing="1">
                                <Text fontWeight="semibold">
                                  {approval.first_name} {approval.last_name}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>{approval.email}</Td>
                            <Td>
                              <Text fontSize="sm" color="gray.600">
                                {new Date(approval.requested_at).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getRoleBadgeColor(approval.role)}>
                                {approval.role}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing="2">
                                <Tooltip label="Approve User">
                                  <IconButton
                                    aria-label="Approve"
                                    icon={<FiCheck />}
                                    colorScheme="green"
                                    size="sm"
                                    onClick={() => handleApprovalAction(approval, 'approve')}
                                  />
                                </Tooltip>
                                <Tooltip label="Reject User">
                                  <IconButton
                                    aria-label="Reject"
                                    icon={<FiX />}
                                    colorScheme="red"
                                    size="sm"
                                    onClick={() => handleApprovalAction(approval, 'reject')}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              )}
            </TabPanel>

            {/* All Users Tab */}
            <TabPanel px="0">
              <Card>
                <CardBody p="0">
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>User</Th>
                        <Th>Email</Th>
                        <Th>Role</Th>
                        <Th>Status</Th>
                        <Th>Last Login</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {allUsers.map((user) => (
                        <Tr key={user._id}>
                          <Td>
                            <VStack align="start" spacing="1">
                              <Text fontWeight="semibold">
                                {user.name || `${user.given_name} ${user.family_name}`}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>{user.email}</Td>
                          <Td>
                            <Badge colorScheme={getRoleBadgeColor(user.role)}>
                              {user.role}
                            </Badge>
                          </Td>
                          <Td>
                            <Badge colorScheme={user.is_active ? 'green' : 'red'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color="gray.600">
                              {user.last_login 
                                ? new Date(user.last_login).toLocaleDateString()
                                : 'Never'
                              }
                            </Text>
                          </Td>
                          <Td>
                            <Tooltip label="Edit User">
                              <IconButton
                                aria-label="Edit"
                                icon={<FiEdit />}
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              />
                            </Tooltip>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Approval Modal */}
      <Modal isOpen={isApprovalOpen} onClose={onApprovalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {approvalAction === 'approve' ? 'Approve User' : 'Reject User'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing="4">
              {selectedApproval && (
                <Alert status={approvalAction === 'approve' ? 'success' : 'warning'}>
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="semibold">
                      {selectedApproval.first_name} {selectedApproval.last_name}
                    </Text>
                    <Text fontSize="sm">{selectedApproval.email}</Text>
                  </Box>
                </Alert>
              )}

              {approvalAction === 'approve' ? (
                <FormControl>
                  <FormLabel>Assign Role</FormLabel>
                  <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                    <option value="viewer">Viewer - Read Only</option>
                    <option value="user">User - Read & Write</option>
                    <option value="manager">Manager - Read, Write & Approve</option>
                    <option value="admin">Admin - Full Access</option>
                  </Select>
                </FormControl>
              ) : (
                <FormControl>
                  <FormLabel>Rejection Reason (Optional)</FormLabel>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onApprovalClose}>
              Cancel
            </Button>
            <Button
              colorScheme={approvalAction === 'approve' ? 'green' : 'red'}
              onClick={processApproval}
            >
              {approvalAction === 'approve' ? 'Approve User' : 'Reject User'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={isUserEditOpen} onClose={onUserEditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit User Access</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing="4">
              {selectedUser && (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <Text fontWeight="semibold">
                      {selectedUser.name || `${selectedUser.given_name} ${selectedUser.family_name}`}
                    </Text>
                    <Text fontSize="sm">{selectedUser.email}</Text>
                  </Box>
                </Alert>
              )}

              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                  <option value="viewer">Viewer - Read Only</option>
                  <option value="user">User - Read & Write</option>
                  <option value="manager">Manager - Read, Write & Approve</option>
                  <option value="admin">Admin - Full Access</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onUserEditClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={updateUser}>
              Update User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminUserManagementScreen;
