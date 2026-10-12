import React, { useState, useCallback } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  HStack,
  VStack,
  Text,
  IconButton,
  Tooltip,
  Icon,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
} from '@chakra-ui/react';
import { FiEye, FiEdit, FiDownload, FiPrinter, FiTrash2, FiTruck, FiCopy, FiCreditCard } from 'react-icons/fi';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import TemplateSelectionModal from '../deliveryNotes/TemplateSelectionModal';
import { FormattedCurrencyDisplay } from '../FormattedCurrencyDisplay';

interface Quotation {
  _id: string;
  _creationTime: number;
  quotation_number: string;
  customer_name: string;
  customer_id: string;
  subject: string;
  status: string;
  valid_until: string;
  total_amount: number;
  currency: string;
  // Lead connection fields
  lead_id?: string;
  lead_number?: string;
  // [2025-01-11] Added - Delivery status for enhanced tracking
  delivery_status?: {
    can_create_delivery_note: boolean;
    delivery_notes_count: number;
    total_items: number;
    fully_delivered_items: number;
    partially_delivered_items: number;
    pending_items: number;
  };
}

interface QuotationTableProps {
  quotations: Quotation[];
  onView: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotationId: string) => void;
  onDownload: (quotationId: string) => Promise<void>;
  onPrint: (quotationId: string, templateId?: string | null) => Promise<void>;
  onGenerateDeliveryNote: (quotationId: string) => void;
  onCopy: (quotation: Quotation) => void;
  onConvertToInvoice?: (quotation: Quotation) => void;
  organizationId?: string;
}

const QuotationTable: React.FC<QuotationTableProps> = ({
  quotations,
  onView,
  onEdit,
  onDelete,
  onDownload,
  onPrint,
  onGenerateDeliveryNote,
  onCopy,
  onConvertToInvoice,
  organizationId,
}) => {
  // Template selection state
  const [selectedQuotationForTemplate, setSelectedQuotationForTemplate] = useState<Quotation | null>(null);
  const { isOpen: isTemplateModalOpen, onOpen: onTemplateModalOpen, onClose: onTemplateModalClose } = useDisclosure();

  // Template selection handlers
  const handlePrintWithTemplate = useCallback((quotation: Quotation) => {
    console.log('Print button clicked for quotation:', quotation._id);
    console.log('Setting selected quotation:', quotation._id);
    setSelectedQuotationForTemplate(quotation);
    console.log('Calling onTemplateModalOpen');
    onTemplateModalOpen();
    console.log('Template modal should now be open, isTemplateModalOpen:', isTemplateModalOpen);
  }, [onTemplateModalOpen]);

  const handleTemplateSelected = useCallback(async (templateId: string | null) => {
    console.log('Template selected:', templateId);
    console.log('Selected quotation:', selectedQuotationForTemplate?._id);

    if (!selectedQuotationForTemplate) {
      console.log('No quotation selected, closing modal');
      onTemplateModalClose();
      return;
    }

    try {
      console.log('Calling onPrint with quotation ID and templateId');
      // Pass quotation ID to the print function for template-aware PDF generation
      await onPrint(selectedQuotationForTemplate._id, templateId);
      console.log('PDF generation completed');
    } catch (error) {
      console.error('Error generating PDF with template:', error);
    } finally {
      setSelectedQuotationForTemplate(null);
      onTemplateModalClose();
    }
  }, [selectedQuotationForTemplate, onPrint, onTemplateModalClose]);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'sent': return 'blue';
      case 'accepted': return 'green';
      case 'rejected': return 'red';
      case 'expired': return 'orange';
      case 'delivered': return 'purple';
      default: return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };


  if (quotations.length === 0) {
    return (
      <VStack spacing={4} align="center" py={8}>
        <Text color="gray.500">No quotations found</Text>
        <Text fontSize="sm" color="gray.400">
          Create your first quotation to get started
        </Text>
      </VStack>
    );
  }

  return (
    <>
      <Box overflowX="auto">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Quotation #</Th>
              <Th>Customer</Th>
              <Th>Source</Th>
              <Th>Quotation Date</Th>
              <Th>Status</Th>
              <Th>Valid Until</Th>
              <Th>Total Amount</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {quotations.map((quotation) => (
              <Tr key={quotation._id}>
                <Td fontWeight="medium">{quotation.quotation_number}</Td>
                <Td>
                  <VStack align="flex-start" spacing={1}>
                    <Text fontWeight="medium">{quotation.customer_name}</Text>
                  </VStack>
                </Td>
                <Td>
                  {quotation.lead_number ? (
                    <VStack align="flex-start" spacing={1}>
                      <Badge colorScheme="blue" size="sm">
                        From Lead
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        {quotation.lead_number}
                      </Text>
                    </VStack>
                  ) : (
                    <Badge colorScheme="gray" size="sm">
                      Direct
                    </Badge>
                  )}
                </Td>
                <Td>{formatDate(new Date(quotation._creationTime).toISOString())}</Td>
                <Td>
                  <VStack spacing={1} align="start">
                    <Badge colorScheme={getStatusColor(quotation.status)}>
                      {quotation.status}
                    </Badge>
                    {/* [2025-01-11] Added - Delivery status indicator */}
                    {quotation.delivery_status && (
                      <Badge 
                        colorScheme={quotation.delivery_status.can_create_delivery_note ? "green" : "gray"}
                        size="sm"
                        variant="outline"
                      >
                        {quotation.delivery_status.delivery_notes_count > 0 
                          ? `${quotation.delivery_status.delivery_notes_count} DN(s)`
                          : "No Delivery"
                        }
                      </Badge>
                    )}
                  </VStack>
                </Td>
                <Td>{formatDate(quotation.valid_until)}</Td>
                <Td>
                  <FormattedCurrencyDisplay 
                    amount={quotation.total_amount} 
                    currency={quotation.currency}
                    fontSize="sm" 
                    color="blue.600" 
                    fontWeight="medium"
                  />
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Tooltip label="View Quotation">
                      <IconButton
                        aria-label="View quotation"
                        icon={<FiEye />}
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(quotation)}
                      />
                    </Tooltip>
                    <Tooltip label="Edit Quotation">
                      <IconButton
                        aria-label="Edit quotation"
                        icon={<FiEdit />}
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(quotation)}
                      />
                    </Tooltip>
                                      <Tooltip label="Download PDF">
                    <IconButton
                      aria-label="Download PDF"
                      icon={<FiDownload />}
                      size="sm"
                      variant="ghost"
                      colorScheme="green"
                      onClick={async () => await onDownload(quotation._id)}
                    />
                  </Tooltip>
                    <Tooltip label="Print Quotation">
                      <IconButton
                        aria-label="Print Quotation"
                        icon={<FiPrinter />}
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => handlePrintWithTemplate(quotation)}
                      />
                    </Tooltip>
                    <Tooltip label="Copy Quotation">
                      <IconButton
                        aria-label="Copy quotation"
                        icon={<FiCopy />}
                        size="sm"
                        variant="ghost"
                        colorScheme="orange"
                        onClick={() => onCopy(quotation)}
                      />
                    </Tooltip>
                    <Tooltip label="Generate Delivery Note">
                      <IconButton
                        aria-label="Generate Delivery Note"
                        icon={<FiTruck />}
                        size="sm"
                        variant="ghost"
                        colorScheme="purple"
                        onClick={() => onGenerateDeliveryNote(quotation._id)}
                      />
                    </Tooltip>
                    {onConvertToInvoice && (
                      <Tooltip label="Convert to Invoice">
                        <IconButton
                          aria-label="Convert to Invoice"
                          icon={<FiCreditCard />}
                          size="sm"
                          variant="ghost"
                          colorScheme="green"
                          onClick={() => onConvertToInvoice(quotation)}
                        />
                      </Tooltip>
                    )}
                    <Tooltip label="Delete Quotation">
                      <IconButton
                        aria-label="Delete quotation"
                        icon={<FiTrash2 />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => onDelete(quotation._id)}
                      />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={onTemplateModalClose}
        onTemplateSelected={handleTemplateSelected}
        organizationId={organizationId}
        templateType="quotation"
      />
    </>
  );
};

export default QuotationTable;
