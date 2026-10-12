import React, { useCallback } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Badge,
  HStack,
  Text,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Box,
  Divider,
  Button,
  useToast,
} from '@chakra-ui/react';
import { ViewIcon, EditIcon, DeleteIcon, DownloadIcon } from '@chakra-ui/icons';
import { FiPrinter, FiCreditCard } from 'react-icons/fi';
import { useMutation, useQuery, useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import TemplateSelectionModal from './TemplateSelectionModal';


interface DeliveryNote {
  _id: string;
  delivery_note_number: string;
  customer_name: string;
  issue_date: string;
  delivery_date: string;
  status: string;
  created_at: string;
}

interface DeliveryNoteTableProps {
  deliveryNotes: DeliveryNote[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onConvertToInvoice?: (deliveryNote: DeliveryNote) => void;
}

const DeliveryNoteTable: React.FC<DeliveryNoteTableProps> = ({
  deliveryNotes,
  onView,
  onEdit,
  onDelete,
  onRefresh,
  onConvertToInvoice,
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isTemplateModalOpen, onOpen: onTemplateModalOpen, onClose: onTemplateModalClose } = useDisclosure();
  const [selectedDeliveryNote, setSelectedDeliveryNote] = React.useState<DeliveryNote | null>(null);
  const [selectedDeliveryNoteItems, setSelectedDeliveryNoteItems] = React.useState<any[]>([]);
  const [pendingPrintDeliveryNoteId, setPendingPrintDeliveryNoteId] = React.useState<string | null>(null);
  const { user, organizationDetails, loading: authLoading } = useAuth();
  
  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Delivery Notes</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }
  const client = useConvex();
  const toast = useToast();

  const deleteDeliveryNote = useMutation(api.deliveryNotes.deleteDeliveryNote);

  const handleView = async (deliveryNote: DeliveryNote) => {
    setSelectedDeliveryNote(deliveryNote);
    
    // Load items for the selected delivery note
    try {
      const items = await client.query(api.deliveryNotes.getDeliveryNoteItems, { 
        delivery_note_id: deliveryNote._id as any 
      });
      setSelectedDeliveryNoteItems(items);
    } catch (error) {
      console.error('Error loading delivery note items:', error);
      setSelectedDeliveryNoteItems([]);
    }
    
    onOpen();
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        status: 'error',
      });
      return;
    }

    try {
      await deleteDeliveryNote({ id: id as any });
      toast({
        title: 'Success',
        description: 'Delivery note deleted successfully',
        status: 'success',
      });
      onRefresh();
    } catch (error) {
      console.error('Error deleting delivery note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete delivery note',
        status: 'error',
      });
    }
  };

  const handlePrintPDF = async (deliveryNoteId: string) => {
    // Show template selection modal first
    setPendingPrintDeliveryNoteId(deliveryNoteId);
    onTemplateModalOpen();
  };

  const handleTemplateSelected = useCallback(async (templateId: string | null) => {
    if (!pendingPrintDeliveryNoteId) {
      console.warn('No pending delivery note ID for template selection');
      return;
    }

    toast({ title: 'Generating PDF for print...', status: 'info', duration: 2000 });
    try {
      const pdfData = await client.query(api.deliveryNotes.getDeliveryNoteForPDF, { delivery_note_id: pendingPrintDeliveryNoteId as any });

      // Convert logo storage ID to full URL if it exists (same as download function)
      let logoUrl = pdfData.organization.logo_url;
      if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('http')) {
        try {
          const fullLogoUrl = await client.action(api.fileUpload.getFileUrl, {
            fileId: logoUrl
          });
          logoUrl = fullLogoUrl;
        } catch (error) {
          console.warn('Failed to get logo URL:', error);
          logoUrl = ''; // Clear logo if URL retrieval fails
        }
      }

      // Call the PDF generator function (EXACT SAME as download function)
      const result = await client.action(api.pdfGenerator.generateDeliveryNotePDF, {
        deliveryNoteData: {
          _id: pdfData.delivery_note._id,
          delivery_note_number: pdfData.delivery_note.delivery_note_number,
          customer_id: pdfData.delivery_note.customer_id,
          customer_name: pdfData.delivery_note.customer_name,
          customer_name_arabic: pdfData.delivery_note.customer_name_arabic,
          issue_date: pdfData.delivery_note.issue_date,
          delivery_date: pdfData.delivery_note.delivery_date,
          delivery_address: pdfData.delivery_note.delivery_address,
          delivery_address_arabic: pdfData.delivery_note.delivery_address_arabic,
          received_by: pdfData.delivery_note.received_by,
          received_by_signature: pdfData.delivery_note.received_by_signature,
          status: pdfData.delivery_note.status,
          notes: pdfData.delivery_note.notes,
          items: pdfData.items.map(item => ({
            delivered_quantity: item.delivered_quantity,
            inventory_name: item.inventory_name,
            inventory_name_arabic: item.inventory_name_arabic,
            notes: item.notes,
            quantity: item.quantity,
            unit: item.unit
          }))
        },
        orgData: {
          name: pdfData.organization.name,
          name_arabic: pdfData.organization.name_arabic,
          address: pdfData.organization.address,
          address_arabic: pdfData.organization.address_arabic,
          vat_number: pdfData.organization.vat_number || '',
          vat_number_arabic: pdfData.organization.vat_number_arabic || '',
          cr_number: pdfData.organization.cr_number,
          email: pdfData.organization.email,
          phone: pdfData.organization.phone,
          website: pdfData.organization.website,
          logo_url: logoUrl,
          header_config: pdfData.organization.header_display_config,
          footer_config: pdfData.organization.footer_display_config
        },
        action: "print"  // Only difference from download is the action
      });

      if (result.success && result.htmlContent) {
        // Create a new window for printing with proper URL to avoid about:blank
        const printWindow = window.open('about:blank', '_blank', 'width=800,height=600');
        if (printWindow) {
          // Clear any existing content and write our HTML
          printWindow.document.open();
          printWindow.document.write(result.htmlContent);
          printWindow.document.close();
          printWindow.focus();

          // Wait for content to load and fonts to render
          setTimeout(() => {
            printWindow.print();
            // Don't close immediately to allow user to print manually if needed
            setTimeout(() => {
              if (!printWindow.closed) {
                printWindow.close();
              }
            }, 2000);
          }, 1500); // Increased timeout for better font loading
        }
        toast({ title: 'PDF sent to printer', status: 'success' });
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF for print:', error);
      toast({ title: 'Failed to generate PDF', status: 'error' });
    } finally {
      setPendingPrintDeliveryNoteId(null);
    }
  }, [pendingPrintDeliveryNoteId, toast]);

  const handleDownloadPDF = async (deliveryNoteId: string) => {
    toast({ title: 'Generating PDF for download...', status: 'info', duration: 2000 });
    try {
      const pdfData = await client.query(api.deliveryNotes.getDeliveryNoteForPDF, { delivery_note_id: deliveryNoteId as any });

      // Convert logo storage ID to full URL if it exists (same as print function)
      let logoUrl = pdfData.organization.logo_url;
      if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('http')) {
        try {
          const fullLogoUrl = await client.action(api.fileUpload.getFileUrl, {
            fileId: logoUrl
          });
          logoUrl = fullLogoUrl;
        } catch (error) {
          console.warn('Failed to get logo URL:', error);
          logoUrl = ''; // Clear logo if URL retrieval fails
        }
      }

      // Call the new PDF generator function
      const result = await client.action(api.pdfGenerator.generateDeliveryNotePDF, {
        deliveryNoteData: {
          _id: pdfData.delivery_note._id,
          delivery_note_number: pdfData.delivery_note.delivery_note_number,
          customer_id: pdfData.delivery_note.customer_id,
          customer_name: pdfData.delivery_note.customer_name,
          customer_name_arabic: pdfData.delivery_note.customer_name_arabic,
          issue_date: pdfData.delivery_note.issue_date,
          delivery_date: pdfData.delivery_note.delivery_date,
          delivery_address: pdfData.delivery_note.delivery_address,
          delivery_address_arabic: pdfData.delivery_note.delivery_address_arabic,
          received_by: pdfData.delivery_note.received_by,
          received_by_signature: pdfData.delivery_note.received_by_signature,
          status: pdfData.delivery_note.status,
          notes: pdfData.delivery_note.notes,
          items: pdfData.items.map(item => ({
            delivered_quantity: item.delivered_quantity,
            inventory_name: item.inventory_name,
            inventory_name_arabic: item.inventory_name_arabic,
            notes: item.notes,
            quantity: item.quantity,
            unit: item.unit
          }))
        },
        orgData: {
          name: pdfData.organization.name,
          name_arabic: pdfData.organization.name_arabic,
          address: pdfData.organization.address,
          address_arabic: pdfData.organization.address_arabic,
          vat_number: pdfData.organization.vat_number || '',
          vat_number_arabic: pdfData.organization.vat_number_arabic || '',
          cr_number: pdfData.organization.cr_number,
          email: pdfData.organization.email,
          phone: pdfData.organization.phone,
          website: pdfData.organization.website,
          logo_url: logoUrl, // Use the converted full URL
          header_config: pdfData.organization.header_display_config || pdfData.organization.header_config,
          footer_config: pdfData.organization.footer_display_config || pdfData.organization.footer_config
        },
        action: "print"
      });

      if (result.success && result.htmlContent) {
        // Convert HTML to PDF and download
        const { jsPDF } = await import('jspdf');
        const html2canvas = (await import('html2canvas')).default;
        
        // Create a temporary container for the HTML
        const container = document.createElement('div');
        container.innerHTML = result.htmlContent;
        container.style.position = 'absolute';
        container.style.top = '-10000px';
        container.style.width = '794px'; // A4 width
        document.body.appendChild(container);
        
        // Wait for fonts and images to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Convert HTML to canvas with better image handling
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: 794,
          height: 1123,
          backgroundColor: '#ffffff',
          imageTimeout: 15000, // Increase timeout for image loading
          logging: false,
          letterRendering: true
        });
        
        // Remove temporary container
        document.body.removeChild(container);
        
        // Create PDF and download
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png', 1.0);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`delivery-note-${pdfData.delivery_note.delivery_note_number}.pdf`);
        
        toast({ title: 'PDF downloaded successfully', status: 'success' });
      } else {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF for download:', error);
      toast({ title: 'Failed to generate PDF', status: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'yellow';
      case 'issued': return 'blue';
      case 'delivered': return 'green';
      case 'completed': return 'green';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th>Delivery Note #</Th>
            <Th>Customer</Th>
            <Th>Issue Date</Th>
            <Th>Delivery Date</Th>
            <Th>Status</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {deliveryNotes.map((deliveryNote) => (
            <Tr key={deliveryNote._id}>
              <Td>
                <Text fontWeight="medium">{deliveryNote.delivery_note_number}</Text>
              </Td>
              <Td>{deliveryNote.customer_name}</Td>
              <Td>{formatDate(deliveryNote.issue_date)}</Td>
              <Td>{formatDate(deliveryNote.delivery_date)}</Td>
              <Td>
                <Badge colorScheme={getStatusColor(deliveryNote.status)}>
                  {deliveryNote.status}
                </Badge>
              </Td>
              <Td>
                <HStack spacing={1}>
                  <IconButton
                    aria-label="View delivery note"
                    icon={<ViewIcon />}
                    size="sm"
                    onClick={() => handleView(deliveryNote)}
                  />
                  <IconButton
                    aria-label="Edit delivery note"
                    icon={<EditIcon />}
                    size="sm"
                    onClick={() => onEdit(deliveryNote._id)}
                  />
                  <IconButton
                    aria-label="Download PDF"
                    icon={<DownloadIcon />}
                    size="sm"
                    onClick={() => handleDownloadPDF(deliveryNote._id)}
                  />
                  <IconButton
                    aria-label="Print PDF"
                    icon={<FiPrinter />}
                    size="sm"
                    onClick={() => handlePrintPDF(deliveryNote._id)}
                  />
                  {onConvertToInvoice && (
                    <IconButton
                      aria-label="Convert to Invoice"
                      icon={<FiCreditCard />}
                      size="sm"
                      colorScheme="green"
                      onClick={() => onConvertToInvoice(deliveryNote)}
                    />
                  )}
                  <IconButton
                    aria-label="Delete delivery note"
                    icon={<DeleteIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(deliveryNote._id)}
                  />
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* View Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Delivery Note Details - {selectedDeliveryNote?.delivery_note_number}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDeliveryNote && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Delivery Note Number:</Text>
                  <Text>{selectedDeliveryNote.delivery_note_number}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Customer:</Text>
                  <Text>{selectedDeliveryNote.customer_name}</Text>
                </Box>

                <HStack spacing={4}>
                  <Box flex={1}>
                    <Text fontWeight="bold">Issue Date:</Text>
                    <Text>{formatDate(selectedDeliveryNote.issue_date)}</Text>
                  </Box>
                  <Box flex={1}>
                    <Text fontWeight="bold">Delivery Date:</Text>
                    <Text>{formatDate(selectedDeliveryNote.delivery_date)}</Text>
                  </Box>
                </HStack>

                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={getStatusColor(selectedDeliveryNote.status)}>
                    {selectedDeliveryNote.status}
                  </Badge>
                </Box>

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>Items:</Text>
                  {selectedDeliveryNoteItems && selectedDeliveryNoteItems.length > 0 ? (
                    <Box>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Item</Th>
                            <Th>Quantity</Th>
                            <Th>Delivered Qty</Th>
                            <Th>Notes</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedDeliveryNoteItems.map((item, index) => (
                            <Tr key={index}>
                              <Td>
                                <VStack align="start" spacing={1}>
                                  <Text>{item.inventory_name}</Text>
                                  {item.inventory_name_arabic && (
                                    <Text fontSize="sm" color="gray.600" dir="rtl">
                                      {item.inventory_name_arabic}
                                    </Text>
                                  )}
                                </VStack>
                              </Td>
                              <Td>{item.quantity}</Td>
                              <Td>{item.delivered_quantity || 0}</Td>
                              <Td>{item.notes || '-'}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Text color="gray.500">No items found</Text>
                  )}
                </Box>

                <HStack justify="space-between">
                  <Button
                    leftIcon={<EditIcon />}
                    colorScheme="blue"
                    onClick={() => {
                      onClose();
                      onEdit(selectedDeliveryNote._id);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    leftIcon={<DownloadIcon />}
                    onClick={() => handleDownloadPDF(selectedDeliveryNote._id)}
                  >
                    Download PDF
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={onTemplateModalClose}
        onTemplateSelected={handleTemplateSelected}
        organizationId={organizationDetails?._id}
        templateType="delivery_note"
      />

    </>
  );
};

export default DeliveryNoteTable;
