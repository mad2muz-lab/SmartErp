import React, { useState, useRef } from 'react';
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
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Checkbox,
  IconButton,
  useDisclosure,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Divider,
  Textarea,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2, FiSettings } from 'react-icons/fi';
import { useAuth } from '../contexts/shared/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface ApprovalLevel {
  level: number;
  role: string;
  user_id?: string;
  is_required: boolean;
  can_delegate: boolean;
}

interface WorkflowFormData {
  name: string;
  document_type: string;
  min_amount: number | undefined;
  max_amount: number | undefined;
  approval_levels: ApprovalLevel[];
}

export default function ApprovalWorkflowConfigScreen() {
  const { selectedOrganization, organizationDetails } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    document_type: 'purchase_requisition',
    min_amount: undefined,
    max_amount: undefined,
    approval_levels: [],
  });

  // Debug logging
  console.log('🔍 ApprovalWorkflowConfigScreen - selectedOrganization:', selectedOrganization);
  console.log('🔍 ApprovalWorkflowConfigScreen - organization ID:', selectedOrganization);
  console.log('🔍 ApprovalWorkflowConfigScreen - organization type:', typeof selectedOrganization);
  console.log('🔍 ApprovalWorkflowConfigScreen - organizationDetails:', organizationDetails);

  // Queries - Temporarily disabled - approvalWorkflows and userProfiles not implemented
  // const workflows = useQuery(api.approvalWorkflows.listApprovalWorkflows, 
  //   selectedOrganization ? {
  //     organization_id: selectedOrganization as any,
  //   } : "skip"
  // );

  // const users = useQuery(api.userProfiles.listUserProfiles,
  //   selectedOrganization ? {
  //     organizationId: selectedOrganization as any,
  //   } : "skip"
  // );
  
  const workflows = null; // Temporary fix
  const users = null; // Temporary fix

  // Debug query parameters
  console.log('🔍 ApprovalWorkflowConfigScreen - Query parameters:');
  console.log('  - workflows params:', selectedOrganization ? {
    organization_id: selectedOrganization,
  } : "skip");
  console.log('  - users params:', selectedOrganization ? {
    organizationId: selectedOrganization,
  } : "skip");

  // Debug query results
  console.log('🔍 ApprovalWorkflowConfigScreen - workflows:', workflows);
  console.log('🔍 ApprovalWorkflowConfigScreen - users:', users);
  console.log('🔍 ApprovalWorkflowConfigScreen - workflows type:', typeof workflows);
  console.log('🔍 ApprovalWorkflowConfigScreen - users type:', typeof users);

  // Mutations - Temporarily disabled - approvalWorkflows not implemented
  // const createWorkflow = useMutation(api.approvalWorkflows.createApprovalWorkflow);
  // const updateWorkflow = useMutation(api.approvalWorkflows.updateApprovalWorkflow);
  // const deleteWorkflow = useMutation(api.approvalWorkflows.deleteApprovalWorkflow);
  
  const createWorkflow = null; // Temporary fix
  const updateWorkflow = null; // Temporary fix
  const deleteWorkflow = null; // Temporary fix

  const handleSubmit = async () => {
    if (!selectedOrganization) return;

    try {
      if (editingWorkflow) {
        await updateWorkflow({
          workflow_id: editingWorkflow._id,
          name: formData.name,
          document_type: formData.document_type,
          min_amount: formData.min_amount,
          max_amount: formData.max_amount,
          approval_levels: formData.approval_levels,
        });
        toast({
          title: 'Workflow Updated',
          description: 'Approval workflow has been updated successfully.',
          status: 'success',
        });
      } else {
                 await createWorkflow({
           organization_id: selectedOrganization as any,
          name: formData.name,
          document_type: formData.document_type,
          min_amount: formData.min_amount,
          max_amount: formData.max_amount,
          approval_levels: formData.approval_levels,
        });
        toast({
          title: 'Workflow Created',
          description: 'New approval workflow has been created successfully.',
          status: 'success',
        });
      }
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save workflow. Please try again.',
        status: 'error',
      });
    }
  };

  const handleEdit = (workflow: any) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      document_type: workflow.document_type,
      min_amount: workflow.min_amount,
      max_amount: workflow.max_amount,
      approval_levels: workflow.approval_levels,
    });
    onOpen();
  };

  const handleDelete = async (workflowId: string) => {
    try {
      await deleteWorkflow({ workflow_id: workflowId as any });
      toast({
        title: 'Workflow Deleted',
        description: 'Approval workflow has been deleted successfully.',
        status: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workflow. Please try again.',
        status: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      document_type: 'purchase_requisition',
      min_amount: undefined,
      max_amount: undefined,
      approval_levels: [],
    });
    setEditingWorkflow(null);
  };

  const addApprovalLevel = () => {
    const newLevel: ApprovalLevel = {
      level: formData.approval_levels.length + 1,
      role: '',
      is_required: true,
      can_delegate: false,
    };
    setFormData({
      ...formData,
      approval_levels: [...formData.approval_levels, newLevel],
    });
  };

  const updateApprovalLevel = (index: number, field: keyof ApprovalLevel, value: any) => {
    const updatedLevels = [...formData.approval_levels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setFormData({ ...formData, approval_levels: updatedLevels });
  };

  const removeApprovalLevel = (index: number) => {
    const updatedLevels = formData.approval_levels.filter((_, i) => i !== index);
    // Reorder levels
    const reorderedLevels = updatedLevels.map((level, i) => ({
      ...level,
      level: i + 1,
    }));
    setFormData({ ...formData, approval_levels: reorderedLevels });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'green' : 'red';
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === 'purchase_requisition' ? 'Purchase Requisition' : 'Purchase Order';
  };

  const getAmountRange = (workflow: any) => {
    if (workflow.min_amount && workflow.max_amount) {
      return `$${workflow.min_amount.toLocaleString()} - $${workflow.max_amount.toLocaleString()}`;
    } else if (workflow.min_amount) {
      return `$${workflow.min_amount.toLocaleString()}+`;
    } else if (workflow.max_amount) {
      return `Up to $${workflow.max_amount.toLocaleString()}`;
    }
    return 'Any amount';
  };

  if (!selectedOrganization || !organizationDetails) {
    console.log('🔍 ApprovalWorkflowConfigScreen - No organization selected');
    return (
      <Box p={6}>
        <Text>Loading organization data...</Text>
        <Text fontSize="sm" color="gray.500" mt={2}>
          Organization: {organizationDetails ? 'Loaded' : 'Loading...'}
        </Text>
      </Box>
    );
  }

  // Check if queries are still loading (undefined) or have loaded (array or null)
  const isLoading = workflows === undefined || users === undefined;
  
  if (isLoading) {
    console.log('🔍 ApprovalWorkflowConfigScreen - Loading data...', { workflows, users });
    return (
      <Box p={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }
  
  // Force render even if no data
  console.log('🔍 ApprovalWorkflowConfigScreen - Data loaded, rendering...', { 
    workflows: workflows || [], 
    users: users || [] 
  });

    console.log('🔍 ApprovalWorkflowConfigScreen - Rendering main component');
   
  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <HStack>
              <FiSettings size={24} color="#3182CE" />
              <Text fontSize="2xl" fontWeight="bold">
                Approval Workflow Configuration
              </Text>
            </HStack>
            <Text color="gray.600">
              Configure approval chains for purchase requisitions and orders
            </Text>
          </VStack>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={() => {
              resetForm();
              onOpen();
            }}
          >
            Create Workflow
          </Button>
        </HStack>
        
        {/* Debug Info */}
        <Alert status="info">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">Debug Information:</Text>
            <Text fontSize="sm">Organization: {selectedOrganization?.name || 'Not loaded'}</Text>
            <Text fontSize="sm">Workflows: {workflows?.length || 0}</Text>
            <Text fontSize="sm">Users: {users?.length || 0}</Text>
          </VStack>
        </Alert>

        <Card>
          <CardHeader>
            <Heading size="md">Approval Workflows</Heading>
          </CardHeader>
          <CardBody>
            {workflows && workflows.length > 0 ? (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Document Type</Th>
                    <Th>Amount Range</Th>
                    <Th>Approval Levels</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {workflows.map((workflow) => (
                    <Tr key={workflow._id}>
                      <Td fontWeight="medium">{workflow.name}</Td>
                      <Td>{getDocumentTypeLabel(workflow.document_type)}</Td>
                      <Td>{getAmountRange(workflow)}</Td>
                      <Td>
                        <Badge colorScheme="blue">
                          {workflow.approval_levels.length} levels
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(workflow.is_active)}>
                          {workflow.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="Edit workflow"
                            icon={<FiEdit />}
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(workflow)}
                          />
                          <DeleteWorkflowButton
                            workflowId={workflow._id}
                            workflowName={workflow.name}
                            onDelete={handleDelete}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            ) : (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No approval workflows configured yet.</Text>
                <Text color="gray.400" fontSize="sm">
                  Create your first workflow to get started.
                </Text>
              </Box>
            )}
          </CardBody>
        </Card>

        {/* Create/Edit Workflow Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              {editingWorkflow ? 'Edit Approval Workflow' : 'Create Approval Workflow'}
            </ModalHeader>
            <ModalBody>
              <VStack spacing={4}>
                                 <FormControl isRequired>
                   <FormLabel>Workflow Name</FormLabel>
                   <Input
                     id="workflow-name"
                     name="workflow-name"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     placeholder="e.g., High Value Purchase Approval"
                   />
                 </FormControl>

                                 <FormControl isRequired>
                   <FormLabel>Document Type</FormLabel>
                   <Select
                     id="document-type"
                     name="document-type"
                     value={formData.document_type}
                     onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                   >
                     <option value="purchase_requisition">Purchase Requisition</option>
                     <option value="purchase_order">Purchase Order</option>
                   </Select>
                 </FormControl>

                <HStack spacing={4} width="100%">
                                     <FormControl>
                     <FormLabel>Minimum Amount</FormLabel>
                     <NumberInput
                       value={formData.min_amount || ''}
                       onChange={(_, value) => setFormData({ ...formData, min_amount: value })}
                     >
                       <NumberInputField id="min-amount" name="min-amount" placeholder="0" />
                       <NumberInputStepper>
                         <NumberIncrementStepper />
                         <NumberDecrementStepper />
                       </NumberInputStepper>
                     </NumberInput>
                   </FormControl>

                                     <FormControl>
                     <FormLabel>Maximum Amount</FormLabel>
                     <NumberInput
                       value={formData.max_amount || ''}
                       onChange={(_, value) => setFormData({ ...formData, max_amount: value })}
                     >
                       <NumberInputField id="max-amount" name="max-amount" placeholder="No limit" />
                       <NumberInputStepper>
                         <NumberIncrementStepper />
                         <NumberDecrementStepper />
                       </NumberInputStepper>
                     </NumberInput>
                   </FormControl>
                </HStack>

                <Divider />

                <HStack justify="space-between" width="100%">
                  <Text fontWeight="medium">Approval Levels</Text>
                  <Button size="sm" leftIcon={<FiPlus />} onClick={addApprovalLevel}>
                    Add Level
                  </Button>
                </HStack>

                <VStack spacing={3} width="100%">
                  {formData.approval_levels.map((level, index) => (
                    <Card key={index} width="100%">
                      <CardBody>
                        <VStack spacing={3}>
                          <HStack justify="space-between" width="100%">
                            <Text fontWeight="medium">Level {level.level}</Text>
                            <IconButton
                              aria-label="Remove level"
                              icon={<FiTrash2 />}
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => removeApprovalLevel(index)}
                            />
                          </HStack>

                          <HStack spacing={4} width="100%">
                                                         <FormControl isRequired>
                               <FormLabel>Role</FormLabel>
                               <Select
                                 id={`role-level-${index}`}
                                 name={`role-level-${index}`}
                                 value={level.role}
                                 onChange={(e) => updateApprovalLevel(index, 'role', e.target.value)}
                               >
                                 <option value="">Select role</option>
                                 <option value="department_head">Department Head</option>
                                 <option value="manager">Manager</option>
                                 <option value="finance">Finance</option>
                                 <option value="director">Director</option>
                                 <option value="ceo">CEO</option>
                               </Select>
                             </FormControl>

                                                         <FormControl>
                               <FormLabel>Specific User (Optional)</FormLabel>
                               <Select
                                 id={`user-level-${index}`}
                                 name={`user-level-${index}`}
                                 value={level.user_id || ''}
                                 onChange={(e) => updateApprovalLevel(index, 'user_id', e.target.value || undefined)}
                               >
                                 <option value="">Any user with role</option>
                                 {users?.map((user) => (
                                   <option key={user._id} value={user._id}>
                                     {user.first_name} {user.last_name}
                                   </option>
                                 ))}
                               </Select>
                             </FormControl>
                          </HStack>

                                                     <HStack spacing={4} width="100%">
                             <Checkbox
                               id={`required-level-${index}`}
                               name={`required-level-${index}`}
                               isChecked={level.is_required}
                               onChange={(e) => updateApprovalLevel(index, 'is_required', e.target.checked)}
                             >
                               Required approval
                             </Checkbox>
                             <Checkbox
                               id={`delegate-level-${index}`}
                               name={`delegate-level-${index}`}
                               isChecked={level.can_delegate}
                               onChange={(e) => updateApprovalLevel(index, 'can_delegate', e.target.checked)}
                             >
                               Can delegate
                             </Checkbox>
                           </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isDisabled={!formData.name || formData.approval_levels.length === 0}
              >
                {editingWorkflow ? 'Update' : 'Create'} Workflow
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Box>
  );
}

// Delete Confirmation Component
function DeleteWorkflowButton({ workflowId, workflowName, onDelete }: {
  workflowId: string;
  workflowName: string;
  onDelete: (id: string) => void;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <IconButton
        aria-label="Delete workflow"
        icon={<FiTrash2 />}
        size="sm"
        variant="ghost"
        colorScheme="red"
        onClick={onOpen}
      />
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Approval Workflow
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{workflowName}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={() => {
                onDelete(workflowId);
                onClose();
              }} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
