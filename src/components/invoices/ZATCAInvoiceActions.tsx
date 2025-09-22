import React, { useState } from 'react';
import {
  HStack,
  Button,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
} from '@chakra-ui/react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import {
  FiPrinter,
  FiDownload,
  FiShield,
  FiUpload,
  FiMaximize2,
  FiEdit3,
  FiKey,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiEye,
  FiSettings,
  FiRefreshCw,
  FiCode,
} from 'react-icons/fi';
import XMLViewerModal from './XMLViewerModal';
import ZATCAComplianceDashboard from './ZATCAComplianceDashboard';
import OneClickZATCACompliance from './OneClickZATCACompliance';

interface ZATCAInvoiceActionsProps {
  invoice: any;
  onRefresh?: () => void;
}

const ZATCAInvoiceActions: React.FC<ZATCAInvoiceActionsProps> = ({
  invoice,
  onRefresh
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isXMLViewerOpen, onOpen: onXMLViewerOpen, onClose: onXMLViewerClose } = useDisclosure();
  const { isOpen: isDashboardOpen, onOpen: onDashboardOpen, onClose: onDashboardClose } = useDisclosure();
  const [showOneClick, setShowOneClick] = useState(false);

  // TODO: Replace with actual ZATCA actions when functions are deployed
  // const generateZATCAPDF = useAction(api.invoiceManagement.generateZATCAInvoicePDF);
  // const getComplianceCSID = useAction(api.zatca.zatcaSdkIntegration.getZATCAComplianceCSID);
  // const validateInvoice = useAction(api.zatca.zatcaSdkIntegration.validateInvoiceWithZATCA);
  // const submitInvoice = useAction(api.zatca.zatcaSdkIntegration.submitInvoiceToZATCA);
  // const generateCertificate = useAction(api.zatca.zatcaSdkIntegration.generateDigitalCertificate);
  // const generateOTP = useAction(api.zatca.zatcaSdkIntegration.generateZATCAOTP);
  // const resetInvoiceForTesting = useAction(api.zatca.zatcaSdkIntegration.resetInvoiceForTesting);
  
  // Temporary fallback functions until ZATCA functions are deployed
  const generateZATCAPDF = null;
  const getComplianceCSID = null;
  const validateInvoice = null;
  const submitInvoice = null;
  const generateCertificate = null;
  const generateOTP = null;
  const resetInvoiceForTesting = null;

  const handleGetComplianceCSID = async () => {
    toast({
      title: "ZATCA Compliance CSID Not Available",
      description: "ZATCA compliance CSID functionality is temporarily unavailable. The function is not yet deployed to the backend.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  const handleZATCAPrint = async () => {
    try {
      setIsProcessing(true);
      setSelectedAction('print');
      onOpen();
      
      // Use ZATCA-compliant PDF generation
      const result = await generateZATCAPDF({
        invoice_id: invoice._id,
        action: "print"
      });
      
      // Open new window for printing
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.html);
        printWindow.document.close();
        printWindow.print();
      }
      
      toast({
        title: "ZATCA Invoice Generated",
        description: "ZATCA-compliant invoice opened for printing",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleZATCADownload = async () => {
    try {
      setIsProcessing(true);
      setSelectedAction('download');
      onOpen();
      
      // Use ZATCA-compliant PDF generation
      const result = await generateZATCAPDF({
        invoice_id: invoice._id,
        action: "download"
      });
      
      // Create and download HTML file
      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ZATCA-Invoice-${invoice.invoice_number}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "ZATCA Invoice Downloaded",
        description: "ZATCA-compliant invoice downloaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleValidateInvoice = async () => {
    toast({
      title: "ZATCA Validation Not Available",
      description: "ZATCA invoice validation functionality is temporarily unavailable. The function is not yet deployed to the backend.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  const handleSubmitInvoice = async () => {
    toast({
      title: "ZATCA Submission Not Available",
      description: "ZATCA invoice submission functionality is temporarily unavailable. The function is not yet deployed to the backend.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  const handleGenerateCertificate = async () => {
    toast({
      title: "Digital Certificate Generation Not Available",
      description: "ZATCA digital certificate generation functionality is temporarily unavailable. The function is not yet deployed to the backend.",
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  const handleGenerateQRCode = async () => {
    try {
      setIsProcessing(true);
      
      // Placeholder implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "QR Code Generated",
        description: "QR code has been generated for the simplified invoice (placeholder)",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      if (onRefresh) onRefresh();
    } catch (error) {
      toast({
        title: "QR Code Generation Failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetForTesting = async () => {
    try {
      setIsProcessing(true);
      setSelectedAction('reset');
      onOpen();
      
      // Reset invoice for testing
      const result = await resetInvoiceForTesting({
        invoice_id: invoice._id
      });
      
      toast({
        title: "Invoice Reset for Testing",
        description: "Invoice has been reset to validatable state. You can now test validation and submission.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const getStatusBadge = () => {
    // Check if invoice has been submitted to ZATCA
    if (invoice.is_submitted && invoice.zatca_reference) {
      return (
        <Badge colorScheme="green">
          <FiCheckCircle style={{ marginRight: '4px', display: 'inline' }} />
          Submitted to ZATCA
        </Badge>
      );
    } else if (invoice.is_validated) {
      return (
        <Badge colorScheme="blue">
          <FiShield style={{ marginRight: '4px', display: 'inline' }} />
          Validated - Ready to Submit
        </Badge>
      );
    } else if (invoice.is_compliant || (invoice.qr_code && invoice.digital_signature) || 
               (invoice.zatca_csid && invoice.zatca_certificate && invoice.zatca_xml && invoice.digital_signature)) {
      return (
        <Badge colorScheme="yellow">
          <FiUpload style={{ marginRight: '4px', display: 'inline' }} />
          Compliant - Validate First
        </Badge>
      );
    } else {
      return (
        <Badge colorScheme="red">
          <FiXCircle style={{ marginRight: '4px', display: 'inline' }} />
          Not Compliant
        </Badge>
      );
    }
  };

  const getZATCAFieldsStatus = () => {
    const fields = [];
    
    if (invoice.digital_signature) {
      fields.push({ icon: FiEdit3, label: "Digital Signature", color: "green" });
    }
    
    if (invoice.qr_code) {
      fields.push({ icon: FiMaximize2, label: "QR Code", color: "purple" });
    }
    
    if (invoice.invoice_hash) {
      fields.push({ icon: FiKey, label: "Hash", color: "blue" });
    }
    
    if (invoice.zatca_reference) {
      fields.push({ icon: FiCheckCircle, label: "ZATCA Reference", color: "orange" });
    }
    
    return fields;
  };

  return (
    <>
      <HStack spacing={2}>
        {/* ZATCA Status Badge */}
        {getStatusBadge()}
        
        {/* ZATCA Fields Status */}
        {getZATCAFieldsStatus().map((field, index) => (
          <Badge key={index} colorScheme={field.color} size="sm">
            <field.icon style={{ marginRight: '4px' }} />
            {field.label}
          </Badge>
        ))}
        
        {/* One-Click ZATCA Compliance - Primary Action */}
        <OneClickZATCACompliance 
          invoice={invoice}
          onSuccess={() => {
            toast({
              title: "ZATCA Compliance Complete!",
              description: "Invoice is now fully compliant and ready for submission",
              status: "success",
              duration: 5000,
              isClosable: true,
            });
            onRefresh?.();
          }}
          onError={(error) => {
            toast({
              title: "ZATCA Compliance Failed",
              description: error,
              status: "error",
              duration: 8000,
              isClosable: true,
            });
          }}
        />

        {/* Additional Actions Menu */}
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<FiSettings />}
            size="sm"
            colorScheme="gray"
            variant="outline"
          >
            More Actions
          </MenuButton>
          <MenuList>
            {/* Quick Actions */}
            <MenuItem
              icon={<FiPrinter />}
              onClick={handleZATCAPrint}
              isDisabled={isProcessing}
            >
              Print ZATCA Invoice
            </MenuItem>
            <MenuItem
              icon={<FiDownload />}
              onClick={handleZATCADownload}
              isDisabled={isProcessing}
            >
              Download ZATCA Invoice
            </MenuItem>
            
            <MenuDivider />
            
            {/* Advanced Options */}
            <MenuItem
              icon={<FiShield />}
              onClick={onDashboardOpen}
              color="blue.600"
            >
              ZATCA Compliance Dashboard
            </MenuItem>
            <MenuItem
              icon={<FiCode />}
              onClick={onXMLViewerOpen}
              color="purple.500"
            >
              View XML Records
            </MenuItem>
            
            <MenuDivider />
            
            {/* Development/Testing */}
            <MenuItem
              icon={<FiRefreshCw />}
              onClick={handleResetForTesting}
              color="orange.500"
            >
              Reset for Testing
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>

      {/* Processing Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Processing ZATCA Invoice</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                {selectedAction === 'compliance' && 'Getting ZATCA compliance CSID from sandbox...'}
                {selectedAction === 'print' && 'Generating ZATCA-compliant invoice for printing...'}
                {selectedAction === 'download' && 'Generating ZATCA-compliant invoice for download...'}
                {selectedAction === 'validate' && 'Validating invoice with ZATCA sandbox...'}
                {selectedAction === 'submit' && 'Submitting invoice to ZATCA sandbox...'}
                {selectedAction === 'certificate' && 'Generating digital certificate...'}
              </Text>
              
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>ZATCA Compliance</AlertTitle>
                  <AlertDescription>
                    This invoice includes all required ZATCA elements:
                    <br />• UBL 2.1 XML structure
                    <br />• Bilingual content (Arabic/English)
                    <br />• Digital signature
                    <br />• QR code (for simplified invoices)
                    <br />• Complete business details
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} isDisabled={isProcessing}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* XML Viewer Modal */}
      <XMLViewerModal
        isOpen={isXMLViewerOpen}
        onClose={onXMLViewerClose}
        invoiceId={invoice._id}
      />

      {/* ZATCA Compliance Dashboard */}
      <ZATCAComplianceDashboard
        isOpen={isDashboardOpen}
        onClose={onDashboardClose}
        invoice={invoice}
      />
    </>
  );
};

export default ZATCAInvoiceActions;
