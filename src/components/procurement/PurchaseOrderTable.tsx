import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  HStack,
  Text,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon, DownloadIcon, EmailIcon } from '@chakra-ui/icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderPDFButton from './PurchaseOrderPDFButton';
// import EmailButton from './EmailButton'; // Temporarily disabled
import PurchaseOrderPDF from './PurchaseOrderPDF';

interface PurchaseOrderTableProps {
  organizationId: Id<"organizations"> | string;
  autoOpenCreate?: boolean;
}

interface PurchaseOrderWithSupplier {
  _id: Id<"purchase_orders">;
  _creationTime: number;
  po_number: string;
  supplier_id: Id<"suppliers">;
  supplier_name?: string;
  organization_id: Id<"organizations">;
  issue_date: string;
  expected_delivery_date: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  tax_rate?: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  payment_terms?: string;
  delivery_address?: string;
  notes?: string;
  approved_by?: string;
  authorized_by?: string;
  approved_at?: string;
  authorized_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export default function PurchaseOrderTable({ organizationId, autoOpenCreate = false }: PurchaseOrderTableProps) {
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrderWithSupplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [autoOpenPrPicker, setAutoOpenPrPicker] = useState(false);
  
  // Alert dialog for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState<Id<"purchase_orders"> | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Auto-open create modal if requested
  useEffect(() => {
    if (autoOpenCreate) {
      setSelectedPurchaseOrder(null);
      setIsEditing(false);
      onOpen();
    }
  }, [autoOpenCreate, onOpen]);

  // Convex queries and mutations
  console.log('🔍 PurchaseOrderTable - organizationId:', organizationId);
  
  // Add error handling for the query
  const purchaseOrders = useQuery(api.purchaseOrders.listPurchaseOrders, { 
    organization_id: organizationId as any 
  });
  
  const suppliers = useQuery(api.suppliers.listSuppliers, { 
    organization_id: organizationId as any 
  });
  
  const deletePurchaseOrder = useMutation(api.purchaseOrders.deletePurchaseOrder);
  const deletePurchaseOrderItems = useMutation(api.purchaseOrderItems.deletePurchaseOrderItems);
  
  // Status management mutations
  const sendPurchaseOrder = useMutation(api.purchaseOrders.sendPurchaseOrder);
  const confirmPurchaseOrder = useMutation(api.purchaseOrders.confirmPurchaseOrder);
  const markPurchaseOrderReceived = useMutation(api.purchaseOrders.markPurchaseOrderReceived);
  const completePurchaseOrder = useMutation(api.purchaseOrders.completePurchaseOrder);
  const cancelPurchaseOrder = useMutation(api.purchaseOrders.cancelPurchaseOrder);
  
  // Get organization details for PDF
  const organization = useQuery(api.organizations.getOrganization, { 
    id: organizationId as any 
  });

  // Combine purchase orders with supplier names
  const purchaseOrdersWithSuppliers: PurchaseOrderWithSupplier[] = React.useMemo(() => {
    if (!purchaseOrders || !suppliers) return [];
    
    return purchaseOrders.map(po => {
      const supplier = suppliers.find(s => s._id === po.supplier_id);
      return {
        ...po,
        supplier_name: supplier?.name || 'Unknown Supplier',
      };
    });
  }, [purchaseOrders, suppliers]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'gray';
      case 'sent':
        return 'blue';
      case 'confirmed':
        return 'yellow';
      case 'received':
        return 'green';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleEdit = (purchaseOrder: PurchaseOrderWithSupplier) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsEditing(true);
    onOpen();
  };

  const handleView = (purchaseOrder: PurchaseOrderWithSupplier) => {
    setSelectedPurchaseOrder(purchaseOrder);
    setIsEditing(false);
    onOpen();
  };

  const handleDelete = (purchaseOrderId: Id<"purchase_orders"> | string) => {
    setPurchaseOrderToDelete(purchaseOrderId as Id<"purchase_orders">);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!purchaseOrderToDelete) return;

    try {
      // Delete associated items first
      await deletePurchaseOrderItems({ purchase_order_id: purchaseOrderToDelete as any });
      
      // Delete the purchase order
      await deletePurchaseOrder({ id: purchaseOrderToDelete as any });

      toast({
        title: 'Success',
        description: 'Purchase Order deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete purchase order',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
    }
  };

  const handleFormSuccess = () => {
    onClose();
    setSelectedPurchaseOrder(null);
    setIsEditing(false);
  };

  // Status management functions
  const handleSend = async (po: PurchaseOrderWithSupplier) => {
    try {
      await sendPurchaseOrder({
        id: po._id,
        sent_by: user?.email || 'unknown_user'
      });
      toast({
        title: 'Success',
        description: 'Purchase order sent to supplier',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send purchase order',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleConfirm = async (po: PurchaseOrderWithSupplier) => {
    try {
      await confirmPurchaseOrder({
        id: po._id,
        confirmed_by: user?.email || 'unknown_user'
      });
      toast({
        title: 'Success',
        description: 'Purchase order confirmed by supplier',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm purchase order',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleMarkReceived = async (po: PurchaseOrderWithSupplier) => {
    try {
      await markPurchaseOrderReceived({
        id: po._id
      });
      toast({
        title: 'Success',
        description: 'Purchase order marked as received',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark purchase order as received',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleComplete = async (po: PurchaseOrderWithSupplier) => {
    try {
      await completePurchaseOrder({
        id: po._id
      });
      toast({
        title: 'Success',
        description: 'Purchase order completed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete purchase order',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCancel = async (po: PurchaseOrderWithSupplier) => {
    if (!confirm('Are you sure you want to cancel this purchase order?')) return;
    
    try {
      await cancelPurchaseOrder({
        id: po._id
      });
      toast({
        title: 'Success',
        description: 'Purchase order cancelled',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel purchase order',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFormCancel = () => {
    onClose();
    setSelectedPurchaseOrder(null);
    setIsEditing(false);
  };

  const getPOItems = async (poId: Id<"purchase_orders">) => {
    try {
      const items = await api.purchaseOrderItems.listPurchaseOrderItems.query({
        purchase_order_id: poId as any
      });
      return items || [];
    } catch (error) {
      console.error('Error fetching PO items:', error);
      return [];
    }
  };

  const handleDownloadPDF = async (po: PurchaseOrderWithSupplier) => {
    try {
      const items = await getPOItems(po._id);
      const supplier = suppliers?.find(s => s._id === po.supplier_id);
      
      // Create PDF document
      const pdfDocument = (
        <PurchaseOrderPDF
          purchaseOrder={po}
          items={items}
          supplier={supplier}
          organization={organization}
        />
      );

      // Trigger download
      const fileName = `${po.po_number}_PurchaseOrder.pdf`;
      
      // The PDFDownloadButton will handle the actual download
      return { pdfDocument, fileName };
    } catch (error) {
      console.error('Error preparing PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to prepare PDF for download',
        status: 'error',
        duration: 3000,
      });
      return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  if (purchaseOrders === undefined) {
    return (
      <Box p={6} textAlign="center">
        <Text>Loading purchase orders...</Text>
      </Box>
    );
  }

  if (purchaseOrders === null) {
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500">Error loading purchase orders. Please try again.</Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Purchase Orders
        </Text>
        <HStack spacing={3}>
          <Button
            leftIcon={<DownloadIcon />}
            variant="outline"
            colorScheme="teal"
            onClick={() => {
              setSelectedPurchaseOrder(null);
              setIsEditing(false);
              setAutoOpenPrPicker(true);
              onOpen();
            }}
          >
            Import from Purchase Requisition
          </Button>
          <Button
            colorScheme="blue"
            onClick={() => {
              setSelectedPurchaseOrder(null);
              setIsEditing(false);
              setAutoOpenPrPicker(false);
              onOpen();
            }}
          >
            Create Purchase Order
          </Button>
        </HStack>
      </HStack>

      {/* Table */}
      <Box bg="white" borderRadius="lg" shadow="md" overflow="hidden">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>PO Number</Th>
              <Th>Supplier</Th>
              <Th>Issue Date</Th>
              <Th>Expected Delivery</Th>
              <Th>Total Amount</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {purchaseOrdersWithSuppliers.length === 0 ? (
              <Tr>
                <Td colSpan={7} textAlign="center" py={8}>
                  <Text color="gray.500">No purchase orders found</Text>
                </Td>
              </Tr>
            ) : (
              purchaseOrdersWithSuppliers.map((po) => (
                <Tr key={po._id} _hover={{ bg: 'gray.50' }}>
                  <Td>
                    <Text fontWeight="semibold">{po.po_number}</Text>
                  </Td>
                  <Td>
                    <Text>{po.supplier_name}</Text>
                  </Td>
                  <Td>
                    <Text>{formatDate(po.issue_date)}</Text>
                  </Td>
                  <Td>
                    <Text>{formatDate(po.expected_delivery_date)}</Text>
                  </Td>
                  <Td>
                    <Text fontWeight="semibold">
                      {formatCurrency(po.total_amount, po.currency)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(po.status)}>
                      {po.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1} wrap="wrap">
                      {/* Status Management Buttons */}
                      {po.status === 'draft' && (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => handleSend(po)}
                          title="Send to Supplier"
                        >
                          Send
                        </Button>
                      )}
                      {po.status === 'sent' && (
                        <Button
                          size="xs"
                          colorScheme="green"
                          onClick={() => handleConfirm(po)}
                          title="Confirm with Supplier"
                        >
                          Confirm
                        </Button>
                      )}
                      {po.status === 'confirmed' && (
                        <Button
                          size="xs"
                          colorScheme="orange"
                          onClick={() => handleMarkReceived(po)}
                          title="Mark as Received"
                        >
                          Received
                        </Button>
                      )}
                      {po.status === 'received' && (
                        <Button
                          size="xs"
                          colorScheme="purple"
                          onClick={() => handleComplete(po)}
                          title="Complete Order"
                        >
                          Complete
                        </Button>
                      )}
                      {(po.status === 'draft' || po.status === 'sent' || po.status === 'confirmed') && (
                        <Button
                          size="xs"
                          colorScheme="red"
                          onClick={() => handleCancel(po)}
                          title="Cancel Order"
                        >
                          Cancel
                        </Button>
                      )}
                      
                      {/* Standard Action Buttons */}
                      <IconButton
                        aria-label="View purchase order"
                        icon={<ViewIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleView(po)}
                      />
                      <IconButton
                        aria-label="Edit purchase order"
                        icon={<EditIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(po)}
                        isDisabled={po.status !== 'draft'}
                      />
                      <PurchaseOrderPDFButton
                        purchaseOrder={po}
                        supplier={suppliers?.find(s => s._id === po.supplier_id)}
                        organization={organization}
                        size="sm"
                        variant="ghost"
                        aria-label="Download PDF"
                      />
                                             {/* EmailButton temporarily disabled - emailService not implemented
                       <EmailButton
                         organizationId={organizationId}
                         documentType="purchase_order"
                         documentId={po._id}
                         documentNumber={po.po_number}
                         supplierEmail={suppliers?.find(s => s._id === po.supplier_id)?.email}
                         supplierName={suppliers?.find(s => s._id === po.supplier_id)?.name}
                         pdfComponent={PurchaseOrderPDF}
                         pdfProps={{
                           purchaseOrder: po,
                           items: [], // Will be fetched by EmailButton
                           supplier: suppliers?.find(s => s._id === po.supplier_id),
                           organization: organization,
                         }}
                         fileName={`PO_${po.po_number}.pdf`}
                         size="sm"
                         variant="ghost"
                         aria-label="Send Email"
                       />
                       */}
                      <IconButton
                        aria-label="Delete purchase order"
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleDelete(po._id)}
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
            {isEditing ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <PurchaseOrderForm
              organizationId={organizationId}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              initialData={selectedPurchaseOrder}
              isEditing={isEditing}
              autoOpenPrPicker={autoOpenPrPicker}
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
              Delete Purchase Order
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete this purchase order? This action cannot be undone.
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
