import React, { useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  HStack,
  VStack,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  useColorModeValue,
  Box,
  Tooltip,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Code,
  Divider
} from '@chakra-ui/react';
import { useMutation, useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { FiMoreVertical, FiEye, FiEdit, FiTrash2, FiDownload, FiSend, FiCheckCircle, FiXCircle, FiAlertCircle, FiShield } from 'react-icons/fi';
import { useAuth } from '../../contexts/shared/AuthContext';
import { formatCurrencyDisplay } from '../../utils/invoiceCurrencyUtils';
import ProcessFlowTracker from './ProcessFlowTracker';
import ZATCAComplianceViewer from './ZATCAComplianceViewer';

interface Invoice {
  _id: Id<"invoices">;
  invoice_number: string;
  customer_name: string;
  customer_name_arabic?: string;
  invoice_date: string;
  due_date?: string;
  grand_total: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
  invoice_type: "standard" | "simplified" | "credit_note" | "debit_note";
  is_filed: boolean;
  is_validated?: boolean;
  is_submitted?: boolean;
  is_compliant?: boolean;
  zatca_reference?: string;
  zatca_submission_uuid?: string;
  zatca_qr_code?: string;
  // Process Flow References
  reference_type?: string;
  source_lead_number?: string;
  source_quotation_number?: string;
  source_delivery_note_number?: string;
  source_purchase_order_number?: string;
  created_at: string;
  updated_at: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onView?: (invoice: Invoice) => void;
  onDelete?: (invoiceId: Id<"invoices">) => void;
  onStatusChange?: (invoiceId: Id<"invoices">, status: string) => void;
  onZATCAValidation?: (invoiceId: Id<"invoices">) => void;
  onZATCASubmission?: (invoiceId: Id<"invoices">) => void;
  onDownloadPDF?: (invoiceId: Id<"invoices">) => void;
  onSendEmail?: (invoiceId: Id<"invoices">) => void;
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onEdit,
  onView,
  onDelete,
  onStatusChange,
  onZATCAValidation,
  onZATCASubmission,
  onDownloadPDF,
  onSendEmail
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isZATCAOpen, onOpen: onZATCAOpen, onClose: onZATCAClose } = useDisclosure();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Mutations
  const updateInvoiceStatus = useMutation(api.invoiceManagement.updateInvoiceStatus);
  const updateInvoice = useMutation(api.invoiceManagement.updateInvoice);
  const markInvoiceAsValidated = useMutation(api.invoiceManagement.markInvoiceAsValidated);
  
  // Actions
  const validateInvoice = useAction(api.zatca.zatcaApiIntegration.validateInvoice);
  const submitInvoice = useAction(api.zatca.zatcaApiIntegration.submitInvoice);
  const testZATCAValidation = useAction(api.zatca.testValidation.testZATCAValidation);
  const testZATCAComponents = useAction(api.zatca.testValidation.testZATCAComponents);
  const simpleTest = useAction(api.zatca.simpleTest.simpleTest);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'sent': return 'blue';
      case 'paid': return 'green';
      case 'overdue': return 'red';
      case 'cancelled': return 'red';
      case 'refunded': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <FiCheckCircle />;
      case 'overdue': return <FiAlertCircle />;
      case 'cancelled': return <FiXCircle />;
      default: return null;
    }
  };

  const getInvoiceTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'blue';
      case 'simplified': return 'green';
      case 'credit_note': return 'orange';
      case 'debit_note': return 'red';
      default: return 'gray';
    }
  };

  const getZATCAStatus = (invoice: Invoice) => {
    // Check ZATCA components completeness
    const components = {
      xml: !!invoice.zatca_ubl_xml,
      qr: !!invoice.zatca_qr_code,
      hash: !!invoice.zatca_invoice_hash,
      signature: !!invoice.zatca_digital_signature,
      reference: !!invoice.zatca_reference
    };
    
    const completedComponents = Object.values(components).filter(Boolean).length;
    const totalComponents = Object.keys(components).length;
    const completionPercentage = (completedComponents / totalComponents) * 100;
    
    
    
    if (invoice.is_submitted && invoice.zatca_reference) {
      return { 
        status: 'submitted', 
        color: 'green', 
        text: 'Submitted to ZATCA',
        components,
        completionPercentage
      };
    } else if (invoice.is_validated) {
      return { 
        status: 'validated', 
        color: 'blue', 
        text: `Validated (${completedComponents}/${totalComponents} components)`,
        components,
        completionPercentage
      };
    } else if (invoice.is_compliant === false) {
      return { 
        status: 'non-compliant', 
        color: 'red', 
        text: `Non-compliant (${completedComponents}/${totalComponents} components)`,
        components,
        completionPercentage
      };
    } else {
      return { 
        status: 'pending', 
        color: 'gray', 
        text: `Pending (${completedComponents}/${totalComponents} components)`,
        components,
        completionPercentage
      };
    }
  };

  const handleStatusChange = async (invoiceId: Id<"invoices">, newStatus: string) => {
    try {
      await updateInvoiceStatus({
        invoice_id: invoiceId,
        status: newStatus as any
      });
      
      toast({
        title: 'Success',
        description: 'Invoice status updated successfully',
        status: 'success',
      });
      
      if (onStatusChange) {
        onStatusChange(invoiceId, newStatus);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice status',
        status: 'error',
      });
    }
  };

  const handleZATCAValidation = async (invoiceId: Id<"invoices">) => {
    console.log(`🔄 Starting validation for invoice ${invoiceId}`);
    try {
      const result = await validateInvoice({
        invoice_id: invoiceId,
        environment: "sandbox"
      });
      console.log(`✅ Validation result:`, result);
      
      toast({
        title: 'Success',
        description: 'Invoice validation completed with SAGA SDK',
        status: 'success',
        duration: 5000,
      });
      
      if (onZATCAValidation) {
        onZATCAValidation(invoiceId);
      }
      
      // Don't reload the page - let Convex handle the state update
      console.log(`✅ Validation completed successfully for invoice ${invoiceId}`);
    } catch (error: any) {
      console.error(`❌ Validation failed for invoice ${invoiceId}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate invoice with SAGA SDK',
        status: 'error',
      });
    }
  };

  const handleZATCASubmission = async (invoiceId: Id<"invoices">) => {
    try {
      await submitInvoice({
        invoice_id: invoiceId,
        environment: "sandbox"
      });
      
      toast({
        title: 'Success',
        description: 'Invoice submitted to ZATCA successfully with SAGA SDK',
        status: 'success',
        duration: 5000,
      });
      
      if (onZATCASubmission) {
        onZATCASubmission(invoiceId);
      }
      
      // Don't reload the page - let Convex handle the state update
      console.log(`✅ Submission completed successfully for invoice ${invoiceId}`);
    } catch (error: any) {
      console.error(`❌ Submission failed for invoice ${invoiceId}:`, error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit invoice to ZATCA with SAGA SDK',
        status: 'error',
      });
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    onOpen();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // formatCurrency function is now imported from invoiceCurrencyUtils

  return (
    <>
      {/* Test Button */}
      <VStack spacing={2} align="start">
        <HStack spacing={2}>
        <Button 
          colorScheme="green" 
          size="sm" 
          onClick={async () => {
            console.log(`🧪 SIMPLE TEST: Testing basic function call`);
            if (invoices.length > 0) {
              const firstInvoice = invoices[0];
              console.log(`🧪 SIMPLE TEST: Invoice ID: ${firstInvoice._id}`);
              
              try {
                const result = await simpleTest({
                  invoice_id: firstInvoice._id
                });
                
                console.log(`🧪 SIMPLE TEST: Test result:`, result);
                
                if (result.success) {
                  toast({
                    title: "Simple Test Successful!",
                    description: `Basic function call is working. Invoice: ${result.invoice_id}`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                  });
                } else {
                  toast({
                    title: "Simple Test Failed",
                    description: result.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                }
                
              } catch (error) {
                console.error(`🧪 SIMPLE TEST: Test error:`, error);
                toast({
                  title: "Simple Test Error",
                  description: "An error occurred during simple testing. Check console for details.",
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
              }
            }
          }}
        >
          🧪 TEST: Simple Function
        </Button>
        
        <Button 
          colorScheme="orange" 
          size="sm" 
          onClick={async () => {
            console.log(`🧪 COMPONENT TEST: Testing individual ZATCA components`);
            if (invoices.length > 0) {
              const firstInvoice = invoices[0];
              console.log(`🧪 COMPONENT TEST: Invoice ID: ${firstInvoice._id}`);
              
              try {
                const result = await testZATCAComponents({
                  invoice_id: firstInvoice._id
                });
                
                console.log(`🧪 COMPONENT TEST: Test result:`, result);
                
                if (result.success) {
                  toast({
                    title: "ZATCA Components Test Successful!",
                    description: `All ZATCA components are working correctly. XML: ${result.results.xml_length} chars, Hash: ${result.results.hash.substring(0, 20)}..., QR: ${result.results.qr_length} chars`,
                    status: "success",
                    duration: 8000,
                    isClosable: true,
                  });
                } else {
                  toast({
                    title: "ZATCA Components Test Failed",
                    description: result.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                }
                
              } catch (error) {
                console.error(`🧪 COMPONENT TEST: Test error:`, error);
                toast({
                  title: "ZATCA Components Test Error",
                  description: "An error occurred during component testing. Check console for details.",
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
              }
            }
          }}
        >
          🧪 TEST: ZATCA Components
        </Button>
        
        <Button 
          colorScheme="blue" 
          size="sm" 
          onClick={async () => {
            console.log(`🧪 FULL VALIDATION TEST: Testing complete ZATCA validation`);
            if (invoices.length > 0) {
              const firstInvoice = invoices[0];
              console.log(`🧪 FULL VALIDATION TEST: Invoice ID: ${firstInvoice._id}`);
              console.log(`🧪 FULL VALIDATION TEST: Current validation status: ${firstInvoice.is_validated}`);
              console.log(`🧪 FULL VALIDATION TEST: ZATCA components:`, {
                xml: !!firstInvoice.zatca_ubl_xml,
                qr: !!firstInvoice.zatca_qr_code,
                hash: !!firstInvoice.zatca_invoice_hash,
                signature: !!firstInvoice.zatca_digital_signature,
                reference: !!firstInvoice.zatca_reference
              });
              
              try {
                const result = await validateInvoice({
                  invoice_id: firstInvoice._id,
                  environment: "sandbox"
                });
                console.log(`🧪 FULL VALIDATION TEST: ZATCA validation result:`, result);
                
                if (result.success) {
                  toast({
                    title: "ZATCA Validation Successful!",
                    description: `Invoice ${firstInvoice.invoice_number} has been validated with all ZATCA components.`,
                    status: "success",
                    duration: 5000,
                    isClosable: true,
                  });
                } else {
                  toast({
                    title: "ZATCA Validation Failed",
                    description: result.message,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                }
                
              } catch (error) {
                console.error(`🧪 FULL VALIDATION TEST: ZATCA validation error:`, error);
                toast({
                  title: "ZATCA Validation Error",
                  description: "An error occurred during validation. Check console for details.",
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
              }
            }
          }}
        >
          🧪 TEST: Full ZATCA Validation
        </Button>
          
        </HStack>
        
      </VStack>
      
      <TableContainer overflowX="auto" maxW="100%">
        <Table variant="simple" size="sm" minW="1200px">
          <Thead>
            <Tr>
              <Th minW="150px">Invoice #</Th>
              <Th minW="200px">Customer</Th>
              <Th minW="120px">Date</Th>
              <Th minW="120px">Due Date</Th>
              <Th minW="100px">Type</Th>
              <Th minW="120px">Amount</Th>
              <Th minW="100px">Status</Th>
              <Th minW="100px">ZATCA</Th>
              <Th minW="120px">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoices.map((invoice) => {
              const zatcaStatus = getZATCAStatus(invoice);
              return (
                <Tr key={invoice._id}>
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="sm">
                        {invoice.invoice_number}
                      </Text>
                      {invoice.zatca_reference && (
                        <Text fontSize="xs" color="gray.500">
                          ZATCA: {invoice.zatca_reference}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  
                  <Td>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm">{invoice.customer_name}</Text>
                      {invoice.customer_name_arabic && (
                        <Text fontSize="xs" color="gray.500">
                          {invoice.customer_name_arabic}
                        </Text>
                      )}
                    </VStack>
                  </Td>
                  
                  <Td>
                    <Text fontSize="sm">{formatDate(invoice.invoice_date)}</Text>
                  </Td>
                  
                  <Td>
                    <Text fontSize="sm">
                      {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                    </Text>
                  </Td>
                  
                  <Td>
                    <Badge colorScheme={getInvoiceTypeColor(invoice.invoice_type)} size="sm">
                      {invoice.invoice_type.replace('_', ' ')}
                    </Badge>
                  </Td>
                  
                  <Td>
                    <Text fontSize="sm" fontWeight="bold" className="invoice-currency-sar">
                      {formatCurrencyDisplay(invoice.grand_total, invoice.currency as any)}
                    </Text>
                  </Td>
                  
                  <Td>
                    <HStack spacing={1}>
                      <Badge 
                        colorScheme={getStatusColor(invoice.status)} 
                        size="sm"
                      >
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </Badge>
                    </HStack>
                  </Td>
                  
                  <Td>
                    <Tooltip label={zatcaStatus.text}>
                      <Badge colorScheme={zatcaStatus.color} size="sm">
                        {zatcaStatus.status}
                      </Badge>
                    </Tooltip>
                  </Td>
                  
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        size="sm"
                        variant="ghost"
                        onClick={() => {}}
                      />
                      <MenuList>
                        <MenuItem icon={<FiEye />} onClick={() => handleViewDetails(invoice)}>
                          View Details
                        </MenuItem>
                        <MenuItem 
                          icon={<FiShield />} 
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            onZATCAOpen();
                          }}
                        >
                          ZATCA Compliance
                        </MenuItem>
                        {onEdit && (
                          <MenuItem icon={<FiEdit />} onClick={() => onEdit(invoice)}>
                            Edit
                          </MenuItem>
                        )}
                        {onDownloadPDF && (
                          <MenuItem icon={<FiDownload />} onClick={() => onDownloadPDF(invoice._id)}>
                            Download PDF
                          </MenuItem>
                        )}
                        {onSendEmail && (
                          <MenuItem icon={<FiSend />} onClick={() => onSendEmail(invoice._id)}>
                            Send Email
                          </MenuItem>
                        )}
                        <Divider />
                        <MenuItem 
                          icon={<FiCheckCircle />} 
                          onClick={() => handleZATCAValidation(invoice._id)}
                          isDisabled={invoice.is_validated}
                        >
                          Validate with ZATCA {invoice.is_validated ? '(Already Validated)' : ''}
                        </MenuItem>
                        <MenuItem 
                          icon={<FiSend />} 
                          onClick={() => handleZATCASubmission(invoice._id)}
                          isDisabled={!invoice.is_validated || invoice.is_submitted}
                        >
                          Submit to ZATCA {!invoice.is_validated ? '(Not Validated)' : invoice.is_submitted ? '(Already Submitted)' : ''}
                        </MenuItem>
                        <Divider />
                        {invoice.status === 'draft' && (
                          <MenuItem onClick={() => handleStatusChange(invoice._id, 'sent')}>
                            Mark as Sent
                          </MenuItem>
                        )}
                        {invoice.status === 'sent' && (
                          <MenuItem onClick={() => handleStatusChange(invoice._id, 'paid')}>
                            Mark as Paid
                          </MenuItem>
                        )}
                        {onDelete && (
                          <MenuItem 
                            icon={<FiTrash2 />} 
                            onClick={() => onDelete(invoice._id)}
                            color="red.500"
                          >
                            Delete
                          </MenuItem>
                        )}
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Invoice Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Text>Invoice Details</Text>
              {selectedInvoice && (
                <Badge colorScheme={getStatusColor(selectedInvoice.status)}>
                  {selectedInvoice.status}
                </Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            {selectedInvoice && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" mb={2}>Invoice Information</Text>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Text fontWeight="semibold">Invoice Number:</Text>
                      <Text>{selectedInvoice.invoice_number}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="semibold">Customer:</Text>
                      <Text>{selectedInvoice.customer_name}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="semibold">Date:</Text>
                      <Text>{formatDate(selectedInvoice.invoice_date)}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="semibold">Due Date:</Text>
                      <Text>{selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : 'N/A'}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="semibold">Type:</Text>
                      <Badge colorScheme={getInvoiceTypeColor(selectedInvoice.invoice_type)}>
                        {selectedInvoice.invoice_type.replace('_', ' ')}
                      </Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="semibold">Amount:</Text>
                      <Text fontWeight="bold" className="invoice-currency-sar">{formatCurrencyDisplay(selectedInvoice.grand_total, selectedInvoice.currency as any)}</Text>
                    </HStack>
                  </VStack>
                </Box>

                {selectedInvoice.zatca_reference && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>ZATCA Information</Text>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Text fontWeight="semibold">ZATCA Reference:</Text>
                        <Code>{selectedInvoice.zatca_reference}</Code>
                      </HStack>
                      {selectedInvoice.zatca_submission_uuid && (
                        <HStack>
                          <Text fontWeight="semibold">Submission UUID:</Text>
                          <Code fontSize="xs">{selectedInvoice.zatca_submission_uuid}</Code>
                        </HStack>
                      )}
                      {selectedInvoice.zatca_qr_code && (
                        <HStack>
                          <Text fontWeight="semibold">QR Code:</Text>
                          <Code fontSize="xs">{selectedInvoice.zatca_qr_code}</Code>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                )}

                {/* Process Flow Information */}
                {(selectedInvoice.reference_type || selectedInvoice.source_quotation_number || selectedInvoice.source_lead_number) && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>Source Information</Text>
                    <VStack align="start" spacing={2}>
                      {selectedInvoice.reference_type && (
                        <HStack>
                          <Text fontWeight="semibold">Source Type:</Text>
                          <Badge colorScheme="blue" variant="subtle">
                            {selectedInvoice.reference_type}
                          </Badge>
                        </HStack>
                      )}
                      {selectedInvoice.source_lead_number && (
                        <HStack>
                          <Text fontWeight="semibold">Source Lead:</Text>
                          <Text>🎯 {selectedInvoice.source_lead_number}</Text>
                        </HStack>
                      )}
                      {selectedInvoice.source_quotation_number && (
                        <HStack>
                          <Text fontWeight="semibold">Source Quotation:</Text>
                          <Text>📋 {selectedInvoice.source_quotation_number}</Text>
                        </HStack>
                      )}
                      {selectedInvoice.source_delivery_note_number && (
                        <HStack>
                          <Text fontWeight="semibold">Source Delivery Note:</Text>
                          <Text>📦 {selectedInvoice.source_delivery_note_number}</Text>
                        </HStack>
                      )}
                      {selectedInvoice.source_purchase_order_number && (
                        <HStack>
                          <Text fontWeight="semibold">Source Purchase Order:</Text>
                          <Text>🛒 {selectedInvoice.source_purchase_order_number}</Text>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="bold" mb={2}>Timestamps</Text>
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <Text fontWeight="semibold">Created:</Text>
                      <Text>{formatDate(selectedInvoice.created_at)}</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="semibold">Updated:</Text>
                      <Text>{formatDate(selectedInvoice.updated_at)}</Text>
                    </HStack>
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ZATCA Compliance Viewer */}
      {selectedInvoice && (
        <ZATCAComplianceViewer
          invoiceId={selectedInvoice._id}
          isOpen={isZATCAOpen}
          onClose={onZATCAClose}
        />
      )}
    </>
  );
};

export default InvoiceTable;
