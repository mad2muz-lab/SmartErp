import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  VStack,
  HStack,
  Text,
  Alert,
  AlertIcon,
  useDisclosure,
  useToast,
  Spinner,
  Badge,
  Box,
  Divider,
} from '@chakra-ui/react';
import { FiSend, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/shared/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ApprovalRequestButtonProps {
  documentType: 'purchase_requisition' | 'purchase_order';
  documentId: string;
  amount: number;
  isDisabled?: boolean;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function ApprovalRequestButton({
  documentType,
  documentId,
  amount,
  isDisabled = false,
  variant = 'solid',
  size = 'md',
}: ApprovalRequestButtonProps) {
  const { selectedOrganization, organizationDetails, user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries - Temporarily disabled until approval workflows are implemented
  const workflow = null;
  const existingRequests = null;

  // Mutations - Temporarily disabled until approval workflows are implemented
  const createApprovalRequest = null;

  const handleSubmitApproval = async () => {
    // Temporarily disabled until approval workflows are implemented
    toast({
      title: 'Feature Not Available',
      description: 'Approval workflows are not yet implemented.',
      status: 'info',
    });
    onClose();
  };

  const getDocumentTypeLabel = (type: string) => {
    return type === 'purchase_requisition' ? 'Purchase Requisition' : 'Purchase Order';
  };

  const getAmountDisplay = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getWorkflowInfo = () => {
    if (!workflow) return null;

    const levels = workflow.approval_levels;
    const levelInfo = levels.map((level, index) => (
      <HStack key={index} justify="space-between" width="100%">
        <Text fontSize="sm">Level {level.level}:</Text>
        <Badge colorScheme="blue">{level.role}</Badge>
      </HStack>
    ));

    return (
      <VStack spacing={2} align="stretch">
        <Text fontWeight="medium">Approval Workflow: {workflow.name}</Text>
        <Text fontSize="sm" color="gray.600">
          {levels.length} approval level{levels.length !== 1 ? 's' : ''} required
        </Text>
        <Divider />
        {levelInfo}
      </VStack>
    );
  };

  const getExistingRequestStatus = () => {
    if (!existingRequests || existingRequests.length === 0) return null;

    const latestRequest = existingRequests[0];
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'yellow';
        case 'approved': return 'green';
        case 'rejected': return 'red';
        case 'cancelled': return 'gray';
        default: return 'gray';
      }
    };

    return (
      <Alert status="info">
        <AlertIcon />
        <VStack align="start" spacing={1}>
          <Text fontWeight="medium">Existing Approval Request</Text>
          <HStack>
            <Badge colorScheme={getStatusColor(latestRequest.status)}>
              {latestRequest.status}
            </Badge>
            <Text fontSize="sm">
              Level {latestRequest.current_level} of {latestRequest.total_levels}
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            Created: {new Date(latestRequest.created_at).toLocaleDateString()}
          </Text>
        </VStack>
      </Alert>
    );
  };

  const hasExistingRequest = existingRequests && existingRequests.length > 0;
  const isButtonDisabled = isDisabled || hasExistingRequest || !workflow;

  return (
    <>
      <Button
        leftIcon={<FiSend />}
        colorScheme="blue"
        variant={variant}
        size={size}
        onClick={onOpen}
        isDisabled={isButtonDisabled}
        title={
          !workflow ? 'No approval workflow configured for this amount' :
          hasExistingRequest ? 'Approval request already submitted' :
          'Submit for approval'
        }
      >
        Submit for Approval
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit Approval Request</ModalHeader>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="medium">
                    {getDocumentTypeLabel(documentType)} - {documentId}
                  </Text>
                  <Text fontSize="sm">
                    Amount: {getAmountDisplay(amount)}
                  </Text>
                </VStack>
              </Alert>

              {getExistingRequestStatus()}

              {!workflow ? (
                <Alert status="warning">
                  <AlertIcon />
                  <Text>
                    No approval workflow is configured for {getDocumentTypeLabel(documentType)}s with amount {getAmountDisplay(amount)}.
                    Please contact your administrator to set up an approval workflow.
                  </Text>
                </Alert>
              ) : (
                <Box>
                  <Text fontWeight="medium" mb={3}>Approval Process:</Text>
                  {getWorkflowInfo()}
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmitApproval}
              isDisabled={!workflow || hasExistingRequest || isSubmitting}
              leftIcon={isSubmitting ? <Spinner size="sm" /> : <FiSend />}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Approval Request'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
