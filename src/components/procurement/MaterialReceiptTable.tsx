import React, { useState, useEffect } from 'react';
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Button, HStack, Text, Badge, IconButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, VStack, useToast, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Spinner,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon, DownloadIcon, AddIcon } from '@chakra-ui/icons';
import { FaWhatsapp } from 'react-icons/fa';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import MaterialReceiptForm from './MaterialReceiptForm';
import { WhatsAppQCSimulatorModal } from './WhatsAppQCSimulatorModal';

interface MaterialReceiptTableProps {
  organizationId: Id<"organizations"> | string | any;
  autoOpenCreate?: boolean;
}

interface MaterialReceiptWithDetails {
  _id: Id<"material_receipts">;
  _creationTime: number;
  receipt_number: string;
  purchase_order_id: Id<"purchase_orders">;
  supplier_id: Id<"suppliers">;
  organization_id: Id<"organizations">;
  receipt_date: string;
  received_by?: string;
  delivery_note_number?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Additional details
  po_number?: string;
  supplier_name?: string;
  received_by_name?: string;
}

export default function MaterialReceiptTable({ organizationId, autoOpenCreate = false }: MaterialReceiptTableProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<MaterialReceiptWithDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Alert dialog for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState<Id<"material_receipts"> | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Auto-open create modal if requested
  useEffect(() => {
    if (autoOpenCreate) {
      setSelectedReceipt(null);
      setIsEditing(false);
      onOpen();
    }
  }, [autoOpenCreate, onOpen]);

  // Convex queries and mutations
  console.log('🔍 MaterialReceiptTable - organizationId:', organizationId);
  
  const materialReceipts = useQuery(api.materialReceipts.listMaterialReceipts, { 
    organization_id: organizationId?._id || organizationId as any 
  });
  
  // Temporarily commented out to avoid userProfiles error
  // const userProfiles = useQuery(api.userProfiles.listUserProfiles, { 
  //   organizationId: organizationId as any 
  // });
  const userProfiles = null; // Temporary fix
  
  const deleteMaterialReceipt = useMutation(api.materialReceipts.deleteMaterialReceipt);
  const deleteMaterialReceiptItems = useMutation(api.materialReceiptItems.deleteMaterialReceiptItems);
  
  // Status management mutations
  const markPartiallyReceived = useMutation(api.materialReceipts.markPartiallyReceived);
  const completeMaterialReceipt = useMutation(api.materialReceipts.completeMaterialReceipt);

  // Combine receipts with additional details
  const receiptsWithDetails: MaterialReceiptWithDetails[] = React.useMemo(() => {
    if (!materialReceipts) return [];

    return materialReceipts.map(receipt => {
      return {
        ...receipt,
        received_by_name: receipt.received_by || 'Not specified',
      };
    });
  }, [materialReceipts]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'received':
        return 'blue';
      case 'inspected':
        return 'yellow';
      case 'accepted':
        return 'green';
      case 'rejected':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleEdit = (receipt: MaterialReceiptWithDetails) => {
    setSelectedReceipt(receipt);
    setIsEditing(true);
    onOpen();
  };

  const handleView = (receipt: MaterialReceiptWithDetails) => {
    setSelectedReceipt(receipt);
    setIsEditing(false);
    onOpen();
  };

  const handleDelete = (receiptId: Id<"material_receipts"> | string) => {
    setReceiptToDelete(receiptId as Id<"material_receipts">);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!receiptToDelete) return;

    try {
      // Delete associated items first
      await deleteMaterialReceiptItems({ material_receipt_id: receiptToDelete as any });

      // Delete the receipt
      await deleteMaterialReceipt({ id: receiptToDelete as any });

      toast({
        title: 'Material Receipt Deleted',
        description: 'The material receipt and its items have been successfully deleted.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setDeleteDialogOpen(false);
      setReceiptToDelete(null);
    } catch (error) {
      console.error('Error deleting material receipt:', error);
      toast({
        title: 'Error',
        description: `Failed to delete material receipt: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFormSuccess = () => {
    onClose();
    setSelectedReceipt(null);
    setIsEditing(false);
  };

  const handleFormCancel = () => {
    onClose();
    setSelectedReceipt(null);
    setIsEditing(false);
  };

  // Status management functions
  const handleMarkPartiallyReceived = async (receipt: MaterialReceiptWithDetails) => {
    try {
      await markPartiallyReceived({
        id: receipt._id
      });
      toast({
        title: 'Success',
        description: 'Material receipt marked as partially received',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark material receipt as partially received',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleComplete = async (receipt: MaterialReceiptWithDetails) => {
    try {
      await completeMaterialReceipt({
        id: receipt._id
      });
      toast({
        title: 'Success',
        description: 'Material receipt completed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete material receipt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (!organizationId) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">Please select an organization to view material receipts.</Text>
      </Box>
    );
  }

  if (materialReceipts === undefined) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Loading material receipts...</Text>
      </Box>
    );
  }

  if (materialReceipts === null) {
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500">Error loading material receipts. Please try again.</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Material Receipts
        </Text>
        <HStack spacing={3}>
          <Button
            colorScheme="green"
            leftIcon={<FaWhatsapp />}
            onClick={() => setIsWhatsAppOpen(true)}
          >
            WhatsApp Site QC Bot
          </Button>
          <Button colorScheme="blue" leftIcon={<AddIcon />} onClick={() => {
            setSelectedReceipt(null);
            setIsEditing(false);
            onOpen();
          }}>
            Create Material Receipt
          </Button>
        </HStack>
      </HStack>

      <WhatsAppQCSimulatorModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        organizationId={organizationId}
      />

      {/* Table */}
      <Box bg="white" borderRadius="lg" shadow="md" overflow="hidden">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>MR Number</Th>
              <Th>Purchase Order</Th>
              <Th>Supplier</Th>
              <Th>Truck / Waybill</Th>
              <Th>Receipt Date</Th>
              <Th>Received By</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {receiptsWithDetails.length === 0 ? (
              <Tr>
                <Td colSpan={8} textAlign="center" py={8}>
                  <Text color="gray.500">No material receipts found.</Text>
                </Td>
              </Tr>
            ) : (
              receiptsWithDetails.map((receipt: any) => (
                <Tr key={receipt._id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <Text fontWeight="semibold">{receipt.receipt_number}</Text>
                  </Td>
                  <Td>
                    <Text>{receipt.po_number || 'PO-' + receipt.purchase_order_id.slice(-6)}</Text>
                  </Td>
                  <Td>
                    <Text>{receipt.supplier_name || 'Supplier-' + receipt.supplier_id.slice(-6)}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme="purple" variant="outline" fontSize="xs">
                      {receipt.truck_number || receipt.delivery_note_number || 'Standard Fleet'}
                    </Badge>
                  </Td>
                  <Td>
                    <Text>{new Date(receipt.receipt_date).toLocaleDateString()}</Text>
                  </Td>
                  <Td>
                    <Text fontSize="xs">{receipt.received_by_name}</Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(receipt.status)}>
                      {receipt.status.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1} wrap="wrap">
                      {/* Status Management Buttons */}
                      {receipt.status === 'received' && (
                        <Button
                          size="xs"
                          colorScheme="orange"
                          onClick={() => handleMarkPartiallyReceived(receipt)}
                          title="Mark as Partially Received"
                        >
                          Partial
                        </Button>
                      )}
                      {(receipt.status === 'received' || receipt.status === 'partially_received') && (
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => handleComplete(receipt)}
                          title="Complete Receipt"
                        >
                          Complete
                        </Button>
                      )}
                      
                      {/* Standard Action Buttons */}
                      <IconButton
                        aria-label="View"
                        icon={<ViewIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(receipt)}
                      />
                      <IconButton
                        aria-label="Edit"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(receipt)}
                        isDisabled={receipt.status === 'completed'}
                      />
                      <IconButton
                        aria-label="Download"
                        icon={<DownloadIcon />}
                        size="sm"
                        variant="ghost"
                        isDisabled // PDF generation not yet implemented
                      />
                      <IconButton
                        aria-label="Delete"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(receipt._id)}
                        isDisabled={receipt.status === 'completed'}
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
            {isEditing ? 'Edit Material Receipt' : 'Create Material Receipt'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <MaterialReceiptForm
              organizationId={organizationId}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              initialData={selectedReceipt}
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
              Delete Material Receipt
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this material receipt? This action cannot be undone.
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
    </Box>
  );
}
