import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  useDisclosure,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  IconButton,
  Tooltip,
  Flex,
} from '@chakra-ui/react';
import { FiCheck, FiX, FiUser, FiClock, FiEye, FiMail } from 'react-icons/fi';
import { useAuth } from '../contexts/shared/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function ApprovalDashboardScreen() {
  const { selectedOrganization, organizationDetails, user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [action, setAction] = useState<'approve' | 'reject' | 'delegate'>('approve');
  const [comments, setComments] = useState('');
  const [delegatedTo, setDelegatedTo] = useState('');

  // Debug logging
  console.log('🔍 ApprovalDashboardScreen - selectedOrganization:', selectedOrganization);
  console.log('🔍 ApprovalDashboardScreen - user:', user);
  console.log('🔍 ApprovalDashboardScreen - organization ID:', selectedOrganization);
  console.log('🔍 ApprovalDashboardScreen - user ID:', user?.id);
  console.log('🔍 ApprovalDashboardScreen - organization type:', typeof selectedOrganization);
  console.log('🔍 ApprovalDashboardScreen - organizationDetails:', organizationDetails);

    // Queries
  const pendingApprovals = useQuery(api.approvalWorkflows.getPendingApprovalsForUser, 
    selectedOrganization && user?._id ? {
      organization_id: selectedOrganization as any,
      user_id: user._id as any,
      user_roles: user?.role ? [user.role] : [],
    } : "skip"
  );

  // Temporarily disabled - approvalWorkflows and userProfiles not implemented
  // const allApprovalRequests = useQuery(api.approvalWorkflows.listApprovalRequests, 
  //   selectedOrganization ? {
  //     organization_id: selectedOrganization as any,
  //   } : "skip"
  // );

  // const users = useQuery(api.userProfiles.listUserProfiles, 
  //   selectedOrganization ? {
  //     organizationId: selectedOrganization as any,
  //   } : "skip"
  // );
   
  // Test query to see if backend is working
  // const testQuery = useQuery(api.approvalWorkflows.listApprovalWorkflows, 
  //   selectedOrganization ? {
  //     organization_id: selectedOrganization as any,
  //   } : "skip"
  // );
  
  const allApprovalRequests = null; // Temporary fix
  const users = null; // Temporary fix
  const testQuery = null; // Temporary fix

  // Debug query parameters
  console.log('🔍 ApprovalDashboardScreen - Query parameters:');
  console.log('  - pendingApprovals params:', selectedOrganization && user?.id ? {
    organization_id: selectedOrganization,
    user_id: user.id,
    user_roles: user?.role ? [user.role] : [],
  } : "skip");
  console.log('  - allApprovalRequests params:', selectedOrganization ? {
    organization_id: selectedOrganization,
  } : "skip");
  console.log('  - users params:', selectedOrganization ? {
    organizationId: selectedOrganization,
  } : "skip");
  
  // Test if organization ID is valid
  console.log('🔍 ApprovalDashboardScreen - Organization ID test:', {
    hasOrganization: !!selectedOrganization,
    organizationId: selectedOrganization,
    organizationIdType: typeof selectedOrganization,
    isValidId: selectedOrganization && selectedOrganization.length > 0
  });

  // Debug query results
  console.log('🔍 ApprovalDashboardScreen - pendingApprovals:', pendingApprovals);
  console.log('🔍 ApprovalDashboardScreen - allApprovalRequests:', allApprovalRequests);
  console.log('🔍 ApprovalDashboardScreen - users:', users);
  console.log('🔍 ApprovalDashboardScreen - testQuery:', testQuery);
  console.log('🔍 ApprovalDashboardScreen - pendingApprovals type:', typeof pendingApprovals);
  console.log('🔍 ApprovalDashboardScreen - allApprovalRequests type:', typeof allApprovalRequests);
  console.log('🔍 ApprovalDashboardScreen - users type:', typeof users);
  console.log('🔍 ApprovalDashboardScreen - testQuery type:', typeof testQuery);

  // Mutations - Temporarily disabled - approvalWorkflows not implemented
  // const approveRequest = useMutation(api.approvalWorkflows.approveRequest);
  // const rejectRequest = useMutation(api.approvalWorkflows.rejectRequest);
  // const delegateApproval = useMutation(api.approvalWorkflows.delegateApproval);
  
  const approveRequest = null; // Temporary fix
  const rejectRequest = null; // Temporary fix
  const delegateApproval = null; // Temporary fix

  const handleAction = async () => {
    if (!selectedRequest || !user?.id) return;

    try {
      if (action === 'approve') {
        await approveRequest({
          approval_request_id: selectedRequest._id,
          approver_id: user.id as any,
          approver_role: user.role || 'approver',
          comments,
        });
        toast({
          title: 'Request Approved',
          description: 'The approval request has been approved successfully.',
          status: 'success',
        });
      } else if (action === 'reject') {
        await rejectRequest({
          approval_request_id: selectedRequest._id,
          approver_id: user.id as any,
          approver_role: user.role || 'approver',
          comments,
        });
        toast({
          title: 'Request Rejected',
          description: 'The approval request has been rejected.',
          status: 'warning',
        });
      } else if (action === 'delegate') {
        await delegateApproval({
          approval_request_id: selectedRequest._id,
          approver_id: user.id as any,
          approver_role: user.role || 'approver',
          delegated_to: delegatedTo as any,
          comments,
        });
        toast({
          title: 'Request Delegated',
          description: 'The approval request has been delegated successfully.',
          status: 'info',
        });
      }
      onClose();
      setComments('');
      setDelegatedTo('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process approval action. Please try again.',
        status: 'error',
      });
    }
  };

  const openActionModal = (request: any, actionType: 'approve' | 'reject' | 'delegate') => {
    setSelectedRequest(request);
    setAction(actionType);
    setComments('');
    setDelegatedTo('');
    onOpen();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'cancelled': return 'gray';
      default: return 'gray';
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === 'purchase_requisition' ? 'Purchase Requisition' : 'Purchase Order';
  };

  const getAmountDisplay = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProgressPercentage = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const getPendingCount = () => {
    return (pendingApprovals || [])?.length || 0;
  };

  const getTotalCount = () => {
    return (allApprovalRequests || [])?.length || 0;
  };

  const getApprovedCount = () => {
    return (allApprovalRequests || [])?.filter(req => req.status === 'approved').length || 0;
  };

  const getRejectedCount = () => {
    return (allApprovalRequests || [])?.filter(req => req.status === 'rejected').length || 0;
  };

  if (!selectedOrganization || !organizationDetails || !user) {
    console.log('🔍 ApprovalDashboardScreen - No organization or user');
    return (
      <Box p={6}>
        <Text>Loading organization and user data...</Text>
        <Text fontSize="sm" color="gray.500" mt={2}>
          Organization: {organizationDetails ? 'Loaded' : 'Loading...'} | 
          User: {user ? 'Loaded' : 'Loading...'}
        </Text>
      </Box>
    );
  }

  // Check if queries are still loading (undefined) or have loaded (array or null)
  const isLoading = pendingApprovals === undefined || allApprovalRequests === undefined || users === undefined || testQuery === undefined;
  
  if (isLoading) {
    console.log('🔍 ApprovalDashboardScreen - Loading data...', { pendingApprovals, allApprovalRequests, users });
    return (
      <Box p={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }
  
  // Force render even if no data
  console.log('🔍 ApprovalDashboardScreen - Data loaded, rendering...', { 
    pendingApprovals: pendingApprovals || [], 
    allApprovalRequests: allApprovalRequests || [], 
    users: users || [] 
  });

    console.log('🔍 ApprovalDashboardScreen - Rendering main component');
   
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <HStack>
              <FiClock size={24} color="#3182CE" />
              <Text fontSize="2xl" fontWeight="bold">
                Approval Dashboard
              </Text>
            </HStack>
            <Text color="gray.600">
              Manage and process approval requests
            </Text>
          </VStack>
        </HStack>
        
        {/* Debug Info */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">Debug Information:</Text>
            <Text fontSize="sm">Organization: {selectedOrganization?.name || 'Not loaded'}</Text>
            <Text fontSize="sm">User: {user?.firstName || 'Not loaded'}</Text>
            <Text fontSize="sm">Pending Approvals: {pendingApprovals?.length || 0}</Text>
            <Text fontSize="sm">All Requests: {allApprovalRequests?.length || 0}</Text>
            <Text fontSize="sm">Users: {users?.length || 0}</Text>
            <Text fontSize="sm">Test Query: {testQuery?.length || 0}</Text>
            <Text fontSize="sm">Organization ID: {selectedOrganization || 'None'}</Text>
            <Text fontSize="sm">User ID: {user?.id || 'None'}</Text>
          </VStack>
        </Alert>

        {/* Statistics */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pending Approvals</StatLabel>
                <StatNumber color="orange.500">{getPendingCount()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Requires your attention
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Requests</StatLabel>
                <StatNumber>{getTotalCount()}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Approved</StatLabel>
                <StatNumber color="green.500">{getApprovedCount()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  Successfully processed
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Rejected</StatLabel>
                <StatNumber color="red.500">{getRejectedCount()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  Declined requests
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>Pending Approvals</Tab>
            <Tab>All Requests</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Pending Approvals</Heading>
                </CardHeader>
                <CardBody>
                                     {(pendingApprovals || []).length > 0 ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Document</Th>
                          <Th>Requester</Th>
                          <Th>Amount</Th>
                          <Th>Progress</Th>
                          <Th>Created</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                                                 {(pendingApprovals || []).map((request) => (
                          <Tr key={request._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">
                                  {getDocumentTypeLabel(request.document_type)}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  ID: {request.document_id}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <HStack>
                                <FiUser size={16} />
                                <Text>{request.requester_id}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Text fontWeight="medium">
                                {getAmountDisplay(request.amount)}
                              </Text>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm">
                                  Level {request.current_level} of {request.total_levels}
                                </Text>
                                <Box width="100px" bg="gray.200" borderRadius="full" h="8px">
                                  <Box
                                    bg="blue.500"
                                    h="8px"
                                    borderRadius="full"
                                    width={`${getProgressPercentage(request.current_level, request.total_levels)}%`}
                                  />
                                </Box>
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {new Date(request.created_at).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Tooltip label="View Details">
                                  <IconButton
                                    aria-label="View details"
                                    icon={<FiEye />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      onOpen();
                                    }}
                                  />
                                </Tooltip>
                                <Button
                                  leftIcon={<FiCheck />}
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => openActionModal(request, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  leftIcon={<FiX />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => openActionModal(request, 'reject')}
                                >
                                  Reject
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">No pending approvals at the moment.</Text>
                      <Text color="gray.400" fontSize="sm">
                        You're all caught up!
                      </Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">All Approval Requests</Heading>
                </CardHeader>
                <CardBody>
                                     {(allApprovalRequests || []).length > 0 ? (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Document</Th>
                          <Th>Requester</Th>
                          <Th>Amount</Th>
                          <Th>Status</Th>
                          <Th>Progress</Th>
                          <Th>Created</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                                                 {(allApprovalRequests || []).map((request) => (
                          <Tr key={request._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">
                                  {getDocumentTypeLabel(request.document_type)}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                  ID: {request.document_id}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <HStack>
                                <FiUser size={16} />
                                <Text>{request.requester_id}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Text fontWeight="medium">
                                {getAmountDisplay(request.amount)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm">
                                  Level {request.current_level} of {request.total_levels}
                                </Text>
                                <Box width="100px" bg="gray.200" borderRadius="full" h="8px">
                                  <Box
                                    bg={request.status === 'approved' ? 'green.500' : 
                                        request.status === 'rejected' ? 'red.500' : 'blue.500'}
                                    h="8px"
                                    borderRadius="full"
                                    width={`${getProgressPercentage(request.current_level, request.total_levels)}%`}
                                  />
                                </Box>
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {new Date(request.created_at).toLocaleDateString()}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  ) : (
                    <Box textAlign="center" py={8}>
                      <Text color="gray.500">No approval requests found.</Text>
                    </Box>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Action Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {action === 'approve' && 'Approve Request'}
              {action === 'reject' && 'Reject Request'}
              {action === 'delegate' && 'Delegate Request'}
            </ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                {selectedRequest && (
                  <Alert status="info">
                    <AlertIcon />
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {getDocumentTypeLabel(selectedRequest.document_type)} - {selectedRequest.document_id}
                      </Text>
                      <Text fontSize="sm">
                        Amount: {getAmountDisplay(selectedRequest.amount)}
                      </Text>
                      <Text fontSize="sm">
                        Level {selectedRequest.current_level} of {selectedRequest.total_levels}
                      </Text>
                    </VStack>
                  </Alert>
                )}

                                 {action === 'delegate' && (
                   <FormControl isRequired>
                     <FormLabel>Delegate To</FormLabel>
                     <Select
                       id="delegate-to"
                       name="delegate-to"
                       value={delegatedTo}
                       onChange={(e) => setDelegatedTo(e.target.value)}
                       placeholder="Select user to delegate to"
                     >
                                               {(users || [])?.map((user) => (
                         <option key={user._id} value={user._id}>
                           {user.first_name} {user.last_name} ({user.role})
                         </option>
                       ))}
                     </Select>
                   </FormControl>
                 )}

                                 <FormControl>
                   <FormLabel>Comments (Optional)</FormLabel>
                   <Textarea
                     id="approval-comments"
                     name="approval-comments"
                     value={comments}
                     onChange={(e) => setComments(e.target.value)}
                     placeholder={`Add comments for ${action}...`}
                     rows={3}
                   />
                 </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme={
                  action === 'approve' ? 'green' :
                  action === 'reject' ? 'red' : 'blue'
                }
                onClick={handleAction}
                isDisabled={action === 'delegate' && !delegatedTo}
              >
                {action === 'approve' && 'Approve'}
                {action === 'reject' && 'Reject'}
                {action === 'delegate' && 'Delegate'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}
