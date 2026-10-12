import React, { useState, useEffect } from 'react';
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
  Divider,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { getCurrencySymbol } from '../utils/currencyUtils';
import { useAuth } from '../contexts/shared/AuthContext';

interface SmartLeadConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  organizationId: string;
}

const SmartLeadConversionModal: React.FC<SmartLeadConversionModalProps> = ({
  isOpen,
  onClose,
  lead,
  organizationId,
}) => {
  const { organizationDetails } = useAuth();
  const orgDetails = organizationDetails as any;
  const toast = useToast();

  // State for conversion data
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [termsConditions, setTermsConditions] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch lead items
  const leadItems = useQuery(
    api.lead_items.listLeadItems,
    lead?._id ? { lead_id: lead._id as any } : 'skip'
  );

  // Fetch customer details if lead has a customer
  const customer = useQuery(
    api.customers.getCustomer,
    lead?.customer_id ? { id: lead.customer_id as any } : 'skip'
  );

  // Mutation
  const convertToQuotation = useMutation(api.leads.convertToQuotation);

  // Initialize dates on modal open
  useEffect(() => {
    if (isOpen && lead) {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      setIssueDate(today.toISOString().split('T')[0]);
      setExpiryDate(nextMonth.toISOString().split('T')[0]);
    }
  }, [isOpen, lead]);

  const calculateTotal = () => {
    if (!leadItems) return 0;
    return leadItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleConversion = async () => {
    try {
      // Create quotation with lead data
      const quotationId = await convertToQuotation({
        lead_id: lead._id as any,
        issue_date: issueDate,
        expiry_date: expiryDate,
        terms_conditions: termsConditions,
        notes: notes,
      });

      toast({
        title: 'Success',
        description: 'Lead successfully converted to quotation!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error converting lead to quotation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setIssueDate('');
    setExpiryDate('');
    setTermsConditions('');
    setNotes('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Convert Lead to Quotation</ModalHeader>
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
              </VStack>
            </Box>

            {/* Quotation Details */}
            <Box>
              <Text fontWeight="bold" mb={3}>Quotation Details</Text>
              <VStack spacing={4}>
                <HStack spacing={4} width="100%">
                  <Box flex={1}>
                    <Text fontSize="sm" mb={1}>Issue Date</Text>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                      }}
                    />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" mb={1}>Expiry Date</Text>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                      }}
                    />
                  </Box>
                </HStack>

                <Box width="100%">
                  <Text fontSize="sm" mb={1}>Terms & Conditions</Text>
                  <textarea
                    value={termsConditions}
                    onChange={(e) => setTermsConditions(e.target.value)}
                    placeholder="Enter terms and conditions..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      minHeight: '80px',
                      resize: 'vertical',
                    }}
                  />
                </Box>

                <Box width="100%">
                  <Text fontSize="sm" mb={1}>Additional Notes</Text>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter additional notes..."
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      minHeight: '80px',
                      resize: 'vertical',
                    }}
                  />
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* Lead Items */}
            <Box>
              <Text fontWeight="bold" mb={3}>
                Items to Convert ({leadItems?.length || 0})
              </Text>
              {leadItems && leadItems.length > 0 ? (
                <VStack spacing={2} align="stretch">
                  {leadItems.map((item, index) => (
                    <Box
                      key={item._id}
                      p={3}
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      bg="gray.50"
                    >
                      <HStack justify="space-between">
                        <VStack align="flex-start" spacing={1} flex={1}>
                          <Text fontWeight="medium">{item.item_name}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {item.description}
                          </Text>
                          <HStack spacing={4}>
                            <Badge colorScheme="blue">Qty: {item.quantity}</Badge>
                            <Badge colorScheme="green">
                              {getCurrencySymbol(orgDetails?.currency)} {item.unit_price}
                            </Badge>
                            <Badge colorScheme="purple">
                              Total: {getCurrencySymbol(orgDetails?.currency)} {item.total_price}
                            </Badge>
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Box p={6} textAlign="center" bg="gray.50" borderRadius="md">
                  <Text color="gray.500">No items found in this lead</Text>
                  <Text fontSize="sm" color="gray.400" mt={1}>
                    The quotation will be created without items
                  </Text>
                </Box>
              )}
            </Box>

            {/* Conversion Summary */}
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
                  • Total quotation value: {getCurrencySymbol(orgDetails?.currency)} {calculateTotal().toFixed(2)}
                </Text>
                <Text fontSize="sm" color="green.600">
                  • Customer: {customer?.customer_company_name || lead?.name || 'No customer assigned'}
                </Text>
                <Text fontSize="sm" color="green.600">
                  • Any scheduled reminders will be cancelled
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleConversion}
          >
            Convert to Quotation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SmartLeadConversionModal;
