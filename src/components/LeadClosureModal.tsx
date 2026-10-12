import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Badge,
} from '@chakra-ui/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';

interface LeadClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  customers: any[];
}

const LeadClosureModal: React.FC<LeadClosureModalProps> = ({
  isOpen,
  onClose,
  lead,
  customers,
}) => {
  const { organizationDetails } = useAuth();
  const orgDetails = organizationDetails as any;
  const [closureType, setClosureType] = useState<'quotation' | 'lost' | 'closed'>('quotation');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [notes, setNotes] = useState('');

  const toast = useToast();

  // Fetch customer details if lead has a customer
  const customer = useQuery(
    api.customers.getCustomer,
    lead?.customer_id ? { id: lead.customer_id as any } : 'skip'
  );

  // Fetch lead items for summary
  const leadItems = useQuery(
    api.lead_items.listLeadItems,
    lead?._id ? { lead_id: lead._id as any } : 'skip'
  );

  // Mutations
  const closeLead = useMutation(api.leads.closeLead);
  const convertToQuotation = useMutation(api.leads.convertToQuotation);

  // Set default dates
  React.useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      setIssueDate(today.toISOString().split('T')[0]);
      setExpiryDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const calculateTotal = () => {
    if (!leadItems) return 0;
    return leadItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleSubmit = async () => {
    try {
      if (closureType === 'quotation') {
        // Create quotation with lead data
        const quotationId = await convertToQuotation({
          lead_id: lead._id,
          issue_date: issueDate,
          expiry_date: expiryDate,
          terms_conditions: termsConditions,
          notes: notes,
        });
        
        toast({
          title: 'Success',
          description: 'Lead converted to quotation successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        console.log('Created quotation with ID:', quotationId);
      } else {
        await closeLead({
          id: lead._id,
          closure_type: closureType,
        });
        
        toast({
          title: 'Success',
          description: `Lead marked as ${closureType}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error closing lead',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error closing lead:', error);
    }
  };

  const getClosureTypeColor = (type: string) => {
    switch (type) {
      case 'quotation': return 'green';
      case 'lost': return 'red';
      case 'closed': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Close Lead</ModalHeader>
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Lead Information */}
            <Box p={4} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
              <VStack align="flex-start" spacing={2}>
                <Text fontWeight="bold" color="blue.800">Lead Information</Text>
                <Text fontSize="sm" color="blue.700">
                  <strong>Lead Number:</strong> {lead?.lead_number}
                </Text>
                <Text fontSize="sm" color="blue.700">
                  <strong>Customer:</strong> {customer?.customer_company_name || lead?.name || 'No customer assigned'}
                </Text>
                <Text fontSize="sm" color="blue.700">
                  <strong>Company:</strong> {lead?.company || 'N/A'}
                </Text>
                <Text fontSize="sm" color="blue.700">
                  <strong>Description:</strong> {lead?.description || 'No description'}
                </Text>
                {leadItems && leadItems.length > 0 && (
                  <Text fontSize="sm" color="blue.700">
                    <strong>Items:</strong> {leadItems.length} items (Total: {orgDetails?.currency} {calculateTotal().toFixed(2)})
                  </Text>
                )}
              </VStack>
            </Box>

            {/* Closure Type Selection */}
            <Box>
              <Text fontWeight="bold" mb={3}>Closure Type</Text>
              <RadioGroup value={closureType} onChange={(value: any) => setClosureType(value)}>
                <Stack direction="column">
                  <Radio value="quotation" colorScheme="green">
                    <HStack>
                      <Text>Convert to Quotation</Text>
                      <Badge colorScheme="green">Recommended</Badge>
                    </HStack>
                  </Radio>
                  <Radio value="lost" colorScheme="red">
                    <Text>Mark as Lost</Text>
                  </Radio>
                  <Radio value="closed" colorScheme="gray">
                    <Text>Mark as Closed</Text>
                  </Radio>
                </Stack>
              </RadioGroup>
            </Box>

            {/* Quotation Details (only show if converting to quotation) */}
            {closureType === 'quotation' && (
              <Box>
                <Text fontWeight="bold" mb={3}>Quotation Details</Text>
                <VStack spacing={4}>
                  <HStack spacing={4} width="100%">
                    <FormControl>
                      <FormLabel fontSize="sm">Issue Date</FormLabel>
                      <Input
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel fontSize="sm">Expiry Date</FormLabel>
                      <Input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </FormControl>
                  </HStack>

                  <FormControl>
                    <FormLabel fontSize="sm">Terms & Conditions</FormLabel>
                    <Textarea
                      value={termsConditions}
                      onChange={(e) => setTermsConditions(e.target.value)}
                      placeholder="Enter terms and conditions..."
                      rows={3}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Additional Notes</FormLabel>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter additional notes..."
                      rows={3}
                    />
                  </FormControl>
                </VStack>
              </Box>
            )}

            {/* Conversion Summary */}
            {closureType === 'quotation' && (
              <Box p={4} bg="green.50" borderRadius="md" border="1px solid" borderColor="green.200">
                <VStack align="flex-start" spacing={2}>
                  <Text fontWeight="bold" color="green.800">Conversion Summary</Text>
                  <Text fontSize="sm" color="green.700">
                    This lead will be marked as <strong>QUOTATION</strong>
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    • A new quotation will be created with {leadItems?.length || 0} items
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    • Total quotation value: {orgDetails?.currency} {calculateTotal().toFixed(2)}
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    • Customer: {customer?.customer_company_name || lead?.name || 'No customer assigned'}
                  </Text>
                  <Text fontSize="sm" color="green.600">
                    • Any scheduled reminders will be cancelled
                  </Text>
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme={getClosureTypeColor(closureType)}
            onClick={handleSubmit}
          >
            {closureType === 'quotation' ? 'Convert to Quotation' : `Mark as ${closureType.toUpperCase()}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LeadClosureModal;
