import React from 'react';
import {
  Box,
  VStack,
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
} from '@chakra-ui/react';
import { EmailIcon, ViewIcon, DeleteIcon } from '@chakra-ui/icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface EmailHistoryProps {
  organizationId: Id<"organizations"> | string;
  documentId?: Id<"purchase_orders" | "purchase_requisitions" | "material_receipts">;
  documentType?: 'purchase_order' | 'purchase_requisition' | 'material_receipt';
  limit?: number;
}

const EmailHistory: React.FC<EmailHistoryProps> = ({
  organizationId,
  documentId,
  documentType,
  limit = 10,
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedEmail, setSelectedEmail] = React.useState<any>(null);

  // Convex queries and mutations
  const emails = useQuery(
    documentId 
      ? api.emailService.getEmailsForDocument
      : api.emailService.listEmails,
    documentId 
      ? {
          organization_id: organizationId as any,
          document_id: documentId as any,
          document_type: documentType!,
        }
      : {
          organization_id: organizationId as any,
          email_type: documentType,
          limit,
        }
  );

  const deleteEmail = useMutation(api.emailService.deleteEmail);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'green';
      case 'delivered':
        return 'blue';
      case 'failed':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getEmailTypeColor = (type: string) => {
    switch (type) {
      case 'purchase_order':
        return 'blue';
      case 'purchase_requisition':
        return 'purple';
      case 'material_receipt':
        return 'green';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleViewEmail = (email: any) => {
    setSelectedEmail(email);
    onOpen();
  };

  const handleDeleteEmail = async (emailId: Id<"emails">) => {
    try {
      await deleteEmail({ email_id: emailId });
      toast({
        title: 'Email Deleted',
        description: 'Email record has been deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error deleting email:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete email record',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (!emails || emails.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <VStack spacing={2}>
          <EmailIcon color="gray.400" boxSize={8} />
          <Text color="gray.500" fontSize="sm">
            No emails found
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <>
      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead>
            <Tr>
              <Th>Type</Th>
              <Th>To</Th>
              <Th>Subject</Th>
              <Th>Status</Th>
              <Th>Sent Date</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {emails.map((email) => (
              <Tr key={email._id}>
                <Td>
                  <Badge colorScheme={getEmailTypeColor(email.email_type)}>
                    {email.email_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </Td>
                <Td>
                  <Text fontSize="sm" noOfLines={1}>
                    {email.to_email}
                  </Text>
                </Td>
                <Td>
                  <Text fontSize="sm" noOfLines={1} maxW="200px">
                    {email.subject}
                  </Text>
                </Td>
                <Td>
                  <Badge colorScheme={getStatusColor(email.status)}>
                    {email.status.toUpperCase()}
                  </Badge>
                </Td>
                <Td>
                  <Text fontSize="sm">
                    {email.sent_at ? formatDate(email.sent_at) : '-'}
                  </Text>
                </Td>
                <Td>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="View Email"
                      icon={<ViewIcon />}
                      size="xs"
                      variant="ghost"
                      onClick={() => handleViewEmail(email)}
                    />
                    <IconButton
                      aria-label="Delete Email"
                      icon={<DeleteIcon />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDeleteEmail(email._id)}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Email Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Email Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEmail && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                    From:
                  </Text>
                  <Text>{selectedEmail.from_email}</Text>
                </Box>

                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                    To:
                  </Text>
                  <Text>{selectedEmail.to_email}</Text>
                </Box>

                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                    Subject:
                  </Text>
                  <Text>{selectedEmail.subject}</Text>
                </Box>

                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                    Status:
                  </Text>
                  <Badge colorScheme={getStatusColor(selectedEmail.status)}>
                    {selectedEmail.status.toUpperCase()}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                    Sent Date:
                  </Text>
                  <Text>
                    {selectedEmail.sent_at 
                      ? formatDate(selectedEmail.sent_at) 
                      : 'Not sent yet'
                    }
                  </Text>
                </Box>

                {selectedEmail.delivered_at && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                      Delivered Date:
                    </Text>
                    <Text>{formatDate(selectedEmail.delivered_at)}</Text>
                  </Box>
                )}

                {selectedEmail.error_message && (
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                      Error Message:
                    </Text>
                    <Text color="red.500" fontSize="sm">
                      {selectedEmail.error_message}
                    </Text>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="semibold" fontSize="sm" color="gray.600">
                    Message:
                  </Text>
                  <Box 
                    p={3} 
                    bg="gray.50" 
                    borderRadius="md" 
                    maxH="200px" 
                    overflowY="auto"
                  >
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                      {selectedEmail.body}
                    </Text>
                  </Box>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EmailHistory;
