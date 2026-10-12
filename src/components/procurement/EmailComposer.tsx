import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  useToast,
  Select,
  Box,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import { EmailIcon, AttachmentIcon } from '@chakra-ui/icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: Id<"organizations"> | string;
  documentType: 'purchase_order' | 'purchase_requisition' | 'material_receipt';
  documentId: Id<"purchase_orders" | "purchase_requisitions" | "material_receipts">;
  documentNumber: string;
  supplierEmail?: string;
  supplierName?: string;
  pdfBlob?: Blob;
  pdfFileName?: string;
}

interface EmailTemplate {
  _id: Id<"email_templates">;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  variables: string[];
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  isOpen,
  onClose,
  organizationId,
  documentType,
  documentId,
  documentNumber,
  supplierEmail,
  supplierName,
  pdfBlob,
  pdfFileName,
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [emailData, setEmailData] = useState({
    to: supplierEmail || '',
    subject: '',
    body: '',
  });

  // Convex mutations and queries
  const createEmailRecord = useMutation(api.emailService.createEmailRecord);
  const updateEmailStatus = useMutation(api.emailService.updateEmailStatus);
  const emailTemplates = useQuery(api.emailService.getEmailTemplates, {
    organization_id: organizationId as any,
    template_type: documentType,
  });

  // Get organization details for from email
  const organization = useQuery(api.organizations.getOrganization, {
    id: organizationId as any,
  });

  // Get current user
  const { user } = useAuth();

  useEffect(() => {
    if (supplierEmail) {
      setEmailData(prev => ({ ...prev, to: supplierEmail }));
    }
  }, [supplierEmail]);

  useEffect(() => {
    if (selectedTemplate && emailTemplates) {
      const template = emailTemplates.find(t => t._id === selectedTemplate);
      if (template) {
        const processedSubject = processTemplate(template.subject, {
          documentNumber,
          supplierName: supplierName || 'Supplier',
          organizationName: organization?.name || 'Company',
        });
        const processedBody = processTemplate(template.body, {
          documentNumber,
          supplierName: supplierName || 'Supplier',
          organizationName: organization?.name || 'Company',
        });
        
        setEmailData(prev => ({
          ...prev,
          subject: processedSubject,
          body: processedBody,
        }));
      }
    }
  }, [selectedTemplate, emailTemplates, documentNumber, supplierName, organization]);

  const processTemplate = (template: string, variables: Record<string, string>) => {
    let processed = template;
    Object.entries(variables).forEach(([key, value]) => {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return processed;
  };

  const handleSendEmail = async () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!user?._id) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create email record in database
      const emailId = await createEmailRecord({
        organization_id: organizationId as any,
        from_email: organization?.email || 'noreply@company.com',
        to_email: emailData.to,
        subject: emailData.subject,
        body: emailData.body,
        email_type: documentType,
        related_document_id: documentId as any,
        related_document_type: documentType,
        created_by: user._id,
      });

      // In a real implementation, you would send the email here
      // For now, we'll simulate email sending
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update email status to sent
      await updateEmailStatus({
        email_id: emailId,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      toast({
        title: 'Email Sent Successfully',
        description: `Email sent to ${emailData.to}`,
        status: 'success',
        duration: 5000,
      });

      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send email. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEmailData(prev => ({ ...prev, [field]: value }));
  };

  const defaultTemplates = {
    purchase_order: {
      subject: 'Purchase Order {{documentNumber}} - {{organizationName}}',
      body: `Dear {{supplierName}},

Please find attached Purchase Order {{documentNumber}} for your review and processing.

Key Details:
- Purchase Order Number: {{documentNumber}}
- Company: {{organizationName}}

Please confirm receipt of this purchase order and provide an estimated delivery date.

If you have any questions or need clarification, please don't hesitate to contact us.

Best regards,
{{organizationName}} Procurement Team`,
    },
    purchase_requisition: {
      subject: 'Purchase Requisition {{documentNumber}} - {{organizationName}}',
      body: `Dear {{supplierName}},

Please find attached Purchase Requisition {{documentNumber}} for your review and quotation.

Key Details:
- Purchase Requisition Number: {{documentNumber}}
- Company: {{organizationName}}

Please provide your quotation based on the specifications in the attached document.

Best regards,
{{organizationName}} Procurement Team`,
    },
    material_receipt: {
      subject: 'Material Receipt {{documentNumber}} - {{organizationName}}',
      body: `Dear {{supplierName}},

Please find attached Material Receipt {{documentNumber}} confirming the receipt of materials.

Key Details:
- Material Receipt Number: {{documentNumber}}
- Company: {{organizationName}}

Please review and confirm the receipt details.

Best regards,
{{organizationName}} Procurement Team`,
    },
  };

  const useDefaultTemplate = () => {
    const template = defaultTemplates[documentType];
    if (template) {
      const processedSubject = processTemplate(template.subject, {
        documentNumber,
        supplierName: supplierName || 'Supplier',
        organizationName: organization?.name || 'Company',
      });
      const processedBody = processTemplate(template.body, {
        documentNumber,
        supplierName: supplierName || 'Supplier',
        organizationName: organization?.name || 'Company',
      });
      
      setEmailData(prev => ({
        ...prev,
        subject: processedSubject,
        body: processedBody,
      }));
      setSelectedTemplate('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <EmailIcon color="blue.500" />
            <Text>Send Email</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Document Info */}
            <Box p={3} bg="blue.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Document Information
              </Text>
              <HStack justify="space-between">
                <Text fontSize="sm">Document Type:</Text>
                <Badge colorScheme="blue">{documentType.replace('_', ' ').toUpperCase()}</Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Document Number:</Text>
                <Text fontSize="sm" fontWeight="semibold">{documentNumber}</Text>
              </HStack>
              {supplierName && (
                <HStack justify="space-between">
                  <Text fontSize="sm">Supplier:</Text>
                  <Text fontSize="sm" fontWeight="semibold">{supplierName}</Text>
                </HStack>
              )}
            </Box>

            <Divider />

            {/* Template Selection */}
            <FormControl>
              <FormLabel fontSize="sm">Email Template</FormLabel>
              <HStack spacing={2}>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  placeholder="Select a template"
                  size="sm"
                >
                  {emailTemplates?.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </Select>
                <Button size="sm" onClick={useDefaultTemplate} variant="outline">
                  Use Default
                </Button>
              </HStack>
            </FormControl>

            {/* Email Form */}
            <FormControl isRequired>
              <FormLabel fontSize="sm">To</FormLabel>
              <Input
                value={emailData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                placeholder="recipient@example.com"
                size="sm"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">Subject</FormLabel>
              <Input
                value={emailData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Email subject"
                size="sm"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm">Message</FormLabel>
              <Textarea
                value={emailData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="Email message"
                rows={8}
                size="sm"
              />
            </FormControl>

            {/* Attachment Info */}
            {pdfBlob && pdfFileName && (
              <Box p={3} bg="green.50" borderRadius="md">
                <HStack>
                  <AttachmentIcon color="green.500" />
                  <Text fontSize="sm" fontWeight="semibold">
                    Attachment: {pdfFileName}
                  </Text>
                </HStack>
              </Box>
            )}

            {/* Email Preview */}
            <Box p={3} bg="gray.50" borderRadius="md">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Email Preview
              </Text>
              <Text fontSize="xs" color="gray.600" mb={1}>
                <strong>From:</strong> {organization?.email || 'noreply@company.com'}
              </Text>
              <Text fontSize="xs" color="gray.600" mb={1}>
                <strong>To:</strong> {emailData.to}
              </Text>
              <Text fontSize="xs" color="gray.600" mb={1}>
                <strong>Subject:</strong> {emailData.subject}
              </Text>
              <Divider my={2} />
              <Text fontSize="xs" color="gray.600" whiteSpace="pre-wrap">
                {emailData.body}
              </Text>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSendEmail}
              isLoading={isLoading}
              loadingText="Sending..."
              leftIcon={<EmailIcon />}
            >
              Send Email
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmailComposer;
