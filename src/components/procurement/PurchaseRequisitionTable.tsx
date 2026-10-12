import React, { useState, useEffect } from 'react';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Button, HStack, Text, Badge, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Spinner, Alert, AlertIcon, FormControl, FormLabel, Input, Select, NumberInput, NumberInputField,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon, DownloadIcon, AddIcon, ArrowForwardIcon, EmailIcon } from '@chakra-ui/icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/shared/AuthContext';
import PurchaseRequisitionForm from './PurchaseRequisitionForm';
import PurchaseRequisitionPDFButton from './PurchaseRequisitionPDFButton';
// import EmailButton from './EmailButton'; // Temporarily disabled
import PurchaseRequisitionPDF from './PurchaseRequisitionPDF';

interface PurchaseRequisitionTableProps {
  organizationId: Id<"organizations"> | string;
  autoOpenCreate?: boolean;
}

interface PurchaseRequisitionWithRequester {
  _id: Id<"purchase_requisitions">;
  _creationTime: number;
  pr_number: string;
  organization_id: Id<"organizations">;
  department: string;
  priority: string;
  status: string;
  total_estimated_cost: number;
  currency: string;
  justification: string;
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  converted_to_po?: Id<"purchase_orders">;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export default function PurchaseRequisitionTable({ organizationId, autoOpenCreate = false }: PurchaseRequisitionTableProps) {
  console.log('🔍 DEBUG: PurchaseRequisitionTable component rendering');
  console.log('🔍 DEBUG: organizationId:', organizationId);
  console.log('🔍 DEBUG: autoOpenCreate:', autoOpenCreate);
  
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isConvertOpen, onOpen: onConvertOpen, onClose: onConvertClose } = useDisclosure();
  const [selectedRequisition, setSelectedRequisition] = useState<PurchaseRequisitionWithRequester | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Alert dialog for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requisitionToDelete, setRequisitionToDelete] = useState<Id<"purchase_requisitions"> | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Auto-open create modal if requested
  useEffect(() => {
    console.log('🔍 DEBUG: PurchaseRequisitionTable - autoOpenCreate effect');
    console.log('🔍 DEBUG: autoOpenCreate:', autoOpenCreate);
    if (autoOpenCreate) {
      console.log('🔍 DEBUG: Opening create modal');
      setSelectedRequisition(null);
      setIsEditing(false);
      onOpen();
    }
  }, [autoOpenCreate, onOpen]);

  // Convex queries and mutations
  console.log('🔍 PurchaseRequisitionTable - organizationId:', organizationId);
  
  const purchaseRequisitions = useQuery(api.purchaseRequisitions.listPurchaseRequisitions, { 
    organization_id: organizationId as any 
  });
  
  console.log('🔍 DEBUG: purchaseRequisitions query result:', purchaseRequisitions);
  
  // Temporarily commented out to debug
  // const userProfiles = useQuery(api.userProfiles.listUserProfiles, { 
  //   organizationId: organizationId as any 
  // });
  const userProfiles = null; // Temporary fix
  
  const deletePurchaseRequisition = useMutation(api.purchaseRequisitions.deletePurchaseRequisition);
  const deletePurchaseRequisitionItems = useMutation(api.purchaseRequisitionItems.deletePurchaseRequisitionItems);
  const updatePurchaseRequisition = useMutation(api.purchaseRequisitions.updatePurchaseRequisition);
  const createPurchaseOrder = useMutation(api.purchaseOrders.createPurchaseOrder);
  const createPurchaseOrderItem = useMutation(api.purchaseOrderItems.createPurchaseOrderItem);
  
  // Status management mutations
  const submitPurchaseRequisition = useMutation(api.purchaseRequisitions.submitPurchaseRequisition);
  const approvePurchaseRequisition = useMutation(api.purchaseRequisitions.approvePurchaseRequisition);
  const rejectPurchaseRequisition = useMutation(api.purchaseRequisitions.rejectPurchaseRequisition);
  const convertToPurchaseOrder = useMutation(api.purchaseRequisitions.convertToPurchaseOrder);
  const listPurchaseRequisitionItems = useQuery(api.purchaseRequisitionItems.listPurchaseRequisitionItems, 
    selectedRequisition ? { purchase_requisition_id: selectedRequisition._id as any } : 'skip'
  );
  const suppliers = useQuery(api.suppliers.listSuppliers, { organization_id: organizationId as any });
  
  // State for PO Conversion customizations
  const [convertSupplierId, setConvertSupplierId] = useState<string>('');
  const [convertDeliveryDate, setConvertDeliveryDate] = useState<string>('');
  const [convertEditableItems, setConvertEditableItems] = useState<any[]>([]);

  // Initialize editable items when PR items load
  useEffect(() => {
    if (listPurchaseRequisitionItems && listPurchaseRequisitionItems.length > 0) {
      setConvertEditableItems(listPurchaseRequisitionItems.map(item => ({
        ...item,
        quantity: item.quantity,
        estimated_unit_price: item.estimated_unit_price,
      })));
    }
  }, [listPurchaseRequisitionItems]);

  // Set default delivery date (+7 days) when opening convert modal
  useEffect(() => {
    if (isConvertOpen) {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      setConvertDeliveryDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [isConvertOpen]);

  // Get organization details for PDF
  const organization = useQuery(api.organizations.getOrganization, { 
    id: organizationId as any 
  });

  // Combine requisitions with requester names
  const requisitionsWithRequesters: PurchaseRequisitionWithRequester[] = React.useMemo(() => {
    if (!purchaseRequisitions) return [];

    return purchaseRequisitions.map(pr => {
      return {
        ...pr,
      };
    });
  }, [purchaseRequisitions]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'gray';
      case 'submitted':
        return 'blue';
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'converted_to_po':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low':
        return 'gray';
      case 'medium':
        return 'yellow';
      case 'high':
        return 'orange';
      case 'urgent':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleEdit = (requisition: PurchaseRequisitionWithRequester) => {
    setSelectedRequisition(requisition);
    setIsEditing(true);
    onOpen();
  };

  const handleView = (requisition: PurchaseRequisitionWithRequester) => {
    setSelectedRequisition(requisition);
    setIsEditing(false);
    onOpen();
  };

  const handleDelete = (requisitionId: Id<"purchase_requisitions"> | string) => {
    setRequisitionToDelete(requisitionId as Id<"purchase_requisitions">);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!requisitionToDelete) return;

    try {
      // Delete associated items first
      await deletePurchaseRequisitionItems({ purchase_requisition_id: requisitionToDelete as any });

      // Delete the requisition
      await deletePurchaseRequisition({ id: requisitionToDelete as any });

      toast({
        title: 'Purchase Requisition Deleted',
        description: 'The purchase requisition and its items have been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setDeleteDialogOpen(false);
      setRequisitionToDelete(null);
    } catch (error) {
      console.error('Error deleting purchase requisition:', error);
      toast({
        title: 'Error',
        description: `Failed to delete purchase requisition: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFormSuccess = () => {
    onClose();
    setSelectedRequisition(null);
    setIsEditing(false);
  };

  const handleFormCancel = () => {
    onClose();
    setSelectedRequisition(null);
    setIsEditing(false);
  };

  const convertToPO = (pr: PurchaseRequisitionWithRequester) => {
    setSelectedRequisition(pr);
    onConvertOpen();
  };

  // Status management functions
  const handleSubmit = async (pr: PurchaseRequisitionWithRequester) => {
    try {
      await submitPurchaseRequisition({
        id: pr._id,
        submitted_by: user?.email || 'unknown_user'
      });
      toast({
        title: 'Success',
        description: 'Purchase requisition submitted for approval',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit purchase requisition',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleApprove = async (pr: PurchaseRequisitionWithRequester) => {
    try {
      await approvePurchaseRequisition({
        id: pr._id,
        approved_by: user?.email || 'unknown_user'
      });
      toast({
        title: 'Success',
        description: 'Purchase requisition approved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve purchase requisition',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleReject = async (pr: PurchaseRequisitionWithRequester) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
      await rejectPurchaseRequisition({
        id: pr._id,
        rejected_by: user?.email || 'unknown_user',
        rejection_reason: reason
      });
      toast({
        title: 'Success',
        description: 'Purchase requisition rejected',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject purchase requisition',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleConvertToPO = async () => {
    if (!selectedRequisition) return;

    if (!convertSupplierId) {
      toast({
        title: 'Supplier Required',
        description: 'Please select a supplier for this purchase order.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      const itemsToConvert = convertEditableItems.length > 0 ? convertEditableItems : (listPurchaseRequisitionItems || []);
      const subtotal = itemsToConvert.reduce((sum, item) => sum + ((item.quantity || 0) * (item.estimated_unit_price || 0)), 0);
      const taxAmount = subtotal * 0.15;
      const totalAmount = subtotal + taxAmount;

      // Create the purchase order
      const poId = await createPurchaseOrder({
        po_number: '', // Auto-generated
        supplier_id: convertSupplierId as any,
        organization_id: organizationId as any,
        issue_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: convertDeliveryDate || undefined,
        currency: selectedRequisition.currency || 'SAR',
        subtotal: subtotal,
        discount_amount: 0,
        tax_rate: 15,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: `Converted from PR ${selectedRequisition.pr_number}. Justification: ${selectedRequisition.justification || ''}`,
        source_pr_id: selectedRequisition._id as any,
      });

      // Copy PR items to PO items
      for (const prItem of itemsToConvert) {
        const itemQty = prItem.is_section_header ? 0 : (prItem.quantity || 1);
        const itemPrice = prItem.is_section_header ? 0 : (prItem.estimated_unit_price || 0);
        await createPurchaseOrderItem({
          purchase_order_id: poId,
          inventory_id: prItem.inventory_id,
          item_name: prItem.item_name || prItem.item_title || 'Section Header',
          description: prItem.description,
          quantity: itemQty,
          unit: prItem.unit,
          unit_price: itemPrice,
          discount_percentage: 0,
          discount_amount: 0,
          total_price: itemQty * itemPrice,
          notes: prItem.specifications,
          is_section_header: prItem.is_section_header,
          item_no: prItem.item_no,
          item_title: prItem.item_title,
        });
      }

      // Update PR status to converted
      await updatePurchaseRequisition({
        id: selectedRequisition._id as any,
        status: 'converted_to_po',
        notes: `Converted to PO: ${poId}`,
      });

      toast({
        title: 'Success',
        description: `Requisition ${selectedRequisition.pr_number} successfully converted to Purchase Order!`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onConvertClose();
      setSelectedRequisition(null);
      
      // Navigate to the newly created PO
      navigate(`/procurement/orders?action=edit&id=${poId}`);
    } catch (error) {
      console.error('Error converting PR to PO:', error);
      toast({
        title: 'Error',
        description: `Failed to convert PR to PO: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };



  console.log('🔍 DEBUG: purchaseRequisitions loading state:', purchaseRequisitions === undefined ? 'loading' : 'loaded');
  
  // Show loading state but still allow modal to open
  if (purchaseRequisitions === undefined) {
    console.log('🔍 DEBUG: Showing loading spinner - purchaseRequisitions is undefined');
    return (
      <Box>
        {/* Header */}
        <HStack justify="space-between" mb={6}>
          <Text fontSize="2xl" fontWeight="bold">
            Purchase Requisitions
          </Text>
          <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={() => {
            setSelectedRequisition(null);
            setIsEditing(false);
            onOpen();
          }}>
            Create Purchase Requisition
          </Button>
        </HStack>

        {/* Loading State */}
        <Box p={6} textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4}>Loading purchase requisitions...</Text>
        </Box>

        {/* Form Modal - Allow to open even while loading */}
        <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
          <ModalOverlay />
          <ModalContent maxW="90vw">
            <ModalHeader>
              {isEditing ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <PurchaseRequisitionForm
                organizationId={organizationId}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                initialData={selectedRequisition}
                isEditing={isEditing}
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    );
  }

  if (purchaseRequisitions === null) {
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500">Error loading purchase requisitions. Please try again.</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Purchase Requisitions
        </Text>
        <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={() => {
          setSelectedRequisition(null);
          setIsEditing(false);
          onOpen();
        }}>
          Create Purchase Requisition
        </Button>
      </HStack>

      {/* Table */}
      <Box bg="white" borderRadius="lg" shadow="md" overflow="hidden">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>PR Number</Th>
              <Th>Department</Th>
              <Th>Priority</Th>
              <Th>Total Cost</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {requisitionsWithRequesters.length === 0 ? (
              <Tr>
                <Td colSpan={6} textAlign="center" py={8}>
                  <Text color="gray.500">No purchase requisitions found.</Text>
                </Td>
              </Tr>
            ) : (
              requisitionsWithRequesters.map((pr) => (
                <Tr key={pr._id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <Text fontWeight="semibold">{pr.pr_number}</Text>
                  </Td>
                  <Td>
                    <Text>{pr.department}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getPriorityColor(pr.priority)}>
                      {pr.priority}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontWeight="semibold">
                      {pr.currency} {pr.total_estimated_cost.toFixed(2)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(pr.status)}>
                      {pr.status.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1} wrap="wrap">
                      {/* Status Management Buttons */}
                      {pr.status === 'draft' && (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => handleSubmit(pr)}
                          title="Submit for Approval"
                        >
                          Submit
                        </Button>
                      )}
                      {pr.status === 'submitted' && (
                        <>
                          <Button
                            size="xs"
                            colorScheme="green"
                            onClick={() => handleApprove(pr)}
                            title="Approve Requisition"
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            onClick={() => handleReject(pr)}
                            title="Reject Requisition"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {pr.status === 'approved' && (
                        <Button
                          size="xs"
                          colorScheme="purple"
                          onClick={() => convertToPO(pr)}
                          title="Convert to Purchase Order"
                        >
                          Convert to PO
                        </Button>
                      )}
                      
                      {/* Standard Action Buttons */}
                      <IconButton
                        aria-label="View"
                        icon={<ViewIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(pr)}
                      />
                      <IconButton
                        aria-label="Edit"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(pr)}
                        isDisabled={pr.status !== 'draft'}
                      />
                      <PurchaseRequisitionPDFButton
                        purchaseRequisition={pr}
                        organization={organization}
                        size="sm"
                        variant="ghost"
                        aria-label="Download PDF"
                      />
                                             {/* EmailButton temporarily disabled - emailService not implemented
                       <EmailButton
                         organizationId={organizationId}
                         documentType="purchase_requisition"
                         documentId={pr._id}
                         documentNumber={pr.pr_number}
                         supplierEmail={pr.created_by || ''} // For PR, we might send to internal users
                         supplierName={pr.created_by || 'Internal User'}
                         pdfComponent={PurchaseRequisitionPDF}
                         pdfProps={{
                           purchaseRequisition: pr,
                           items: [], // Will be fetched by EmailButton
                           organization: organization,
                         }}
                         fileName={`PR_${pr.pr_number}.pdf`}
                         size="sm"
                         variant="ghost"
                         aria-label="Send Email"
                       />
                       */}
                      <IconButton
                        aria-label="Delete"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(pr._id)}
                        isDisabled={pr.status !== 'draft'}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Form Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>
            {isEditing ? 'Edit Purchase Requisition' : 'Create Purchase Requisition'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <PurchaseRequisitionForm
              organizationId={organizationId}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              initialData={selectedRequisition}
              isEditing={isEditing}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Purchase Requisition
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this purchase requisition? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Convert to PO Modal */}
      <Modal isOpen={isConvertOpen} onClose={onConvertClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Convert to Purchase Order</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRequisition && (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="blue.50" borderRadius="md">
                  <Text fontWeight="semibold" mb={2}>Purchase Requisition Details:</Text>
                  <VStack spacing={2} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">PR Number:</Text>
                      <Text fontWeight="semibold">{selectedRequisition.pr_number}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">Department:</Text>
                      <Text>{selectedRequisition.department || '-'}</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">Priority:</Text>
                      <Badge colorScheme={getPriorityColor(selectedRequisition.priority)}>
                        {selectedRequisition.priority}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">Total Cost:</Text>
                      <Text fontWeight="semibold">
                        {selectedRequisition.currency} {selectedRequisition.total_estimated_cost.toFixed(2)}
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                
                {/* Supplier & Delivery Date Selection */}
                <HStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">Target Supplier</FormLabel>
                    <Select
                      placeholder="Select Supplier"
                      size="sm"
                      value={convertSupplierId}
                      onChange={(e) => setConvertSupplierId(e.target.value)}
                    >
                      {suppliers && suppliers.length > 0 ? (
                        suppliers.map((s: any) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <option value="temp_supplier">General Trading Supplier</option>
                      )}
                    </Select>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="semibold">Tentative Delivery Date</FormLabel>
                    <Input
                      type="date"
                      size="sm"
                      value={convertDeliveryDate}
                      onChange={(e) => setConvertDeliveryDate(e.target.value)}
                    />
                  </FormControl>
                </HStack>

                {/* PR Items Customization Table */}
                <Box>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="semibold" fontSize="sm">
                      Review / Adjust Quantities for PO ({convertEditableItems.length} items):
                    </Text>
                  </HStack>

                  <Box maxH="220px" overflowY="auto" border="1px" borderColor="gray.200" borderRadius="md">
                    <Table size="sm" variant="simple">
                      <Thead bg="gray.100">
                        <Tr>
                          <Th>Item Name</Th>
                          <Th w="100px">PO Qty</Th>
                          <Th w="120px">Unit Price</Th>
                          <Th w="100px">Subtotal</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {convertEditableItems.map((item, idx) => (
                          <Tr key={idx}>
                            <Td fontWeight="medium" fontSize="xs">
                              {item.item_name}
                            </Td>
                            <Td>
                              <NumberInput
                                size="xs"
                                min={0.01}
                                value={item.quantity}
                                onChange={(_, val) => {
                                  const updated = [...convertEditableItems];
                                  updated[idx].quantity = val || 1;
                                  setConvertEditableItems(updated);
                                }}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td>
                              <NumberInput
                                size="xs"
                                min={0}
                                precision={2}
                                value={item.estimated_unit_price}
                                onChange={(_, val) => {
                                  const updated = [...convertEditableItems];
                                  updated[idx].estimated_unit_price = val || 0;
                                  setConvertEditableItems(updated);
                                }}
                              >
                                <NumberInputField />
                              </NumberInput>
                            </Td>
                            <Td fontSize="xs" fontWeight="semibold">
                              {((item.quantity || 0) * (item.estimated_unit_price || 0)).toFixed(2)}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>

                <Alert status="info" borderRadius="md" py={2}>
                  <AlertIcon />
                  <VStack align="start" spacing={0} fontSize="xs">
                    <Text fontWeight="semibold">Auto-Trigger Setup:</Text>
                    <Text>
                      The tentative delivery date will trigger an automated WhatsApp delivery notification to the assigned Site QC / Warehouse engineer on that day.
                    </Text>
                  </VStack>
                </Alert>

                <HStack justify="flex-end" spacing={3}>
                  <Button size="sm" onClick={onConvertClose}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    isDisabled={!convertSupplierId}
                    onClick={handleConvertToPO}
                  >
                    Generate Purchase Order
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
