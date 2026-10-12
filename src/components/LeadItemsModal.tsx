import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Text,
  Badge,
  Box,
  Divider,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../contexts/shared/AuthContext';
import { formatCurrencyWithDecimals } from '../utils/currencyUtils';
import toast from 'react-hot-toast';

interface LeadItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  organizationId: string;
}

const LeadItemsModal: React.FC<LeadItemsModalProps> = ({
  isOpen,
  onClose,
  leadId,
  organizationId,
}) => {
  const { organizationDetails } = useAuth();
  const orgDetails = organizationDetails as any;
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    quality: '',
    quantity: 1,
    unit_price: 0,
  });

  // If no valid lead id yet, don't render the modal body that triggers queries
  const hasValidLeadId = Boolean(leadId);

  // Fetch lead items (skip until we have a valid lead id)
  const items = useQuery(
    api.lead_items.listLeadItems,
    hasValidLeadId ? ({ lead_id: leadId as any }) : 'skip'
  );

  // Mutations
  const createItem = useMutation(api.lead_items.createLeadItem);
  const updateItem = useMutation(api.lead_items.updateLeadItem);
  const deleteItem = useMutation(api.lead_items.deleteLeadItem);

  const resetForm = () => {
    setFormData({
      item_name: '',
      description: '',
      quality: '',
      quantity: 1,
      unit_price: 0,
    });
    setIsAddingItem(false);
    setEditingItemId(null);
  };

  const handleSubmit = async () => {
    try {
      if (!hasValidLeadId) {
        toast.error('No lead selected. Please close and try again.');
        return;
      }
      if (editingItemId) {
        await updateItem({
          id: editingItemId as any,
          ...formData,
        });
        toast.success('Item updated successfully');
        resetForm(); // Close form after editing
      } else {
        await createItem({
          lead_id: leadId as any,
          organization_id: organizationId as any,
          ...formData,
        });
        toast.success('Item added successfully');
        // Don't close the form after adding - allow multiple items
        setFormData({
          item_name: '',
          description: '',
          quality: '',
          quantity: 1,
          unit_price: 0,
        });
      }
    } catch (error) {
      toast.error('Error saving item');
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItemId(item._id);
    setFormData({
      item_name: item.item_name,
      description: item.description || '',
      quality: item.quality,
      quantity: item.quantity,
      unit_price: item.unit_price,
    });
    setIsAddingItem(true);
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem({ id: itemId as any });
        toast.success('Item deleted successfully');
      } catch (error) {
        toast.error('Error deleting item');
        console.error('Error deleting item:', error);
      }
    }
  };

  const totalValue = items?.reduce((sum, item) => sum + item.total_price, 0) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Manage Lead Items</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {!hasValidLeadId ? (
            <Box p={4} textAlign="center">
              <Text color="gray.500">Preparing lead details...</Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {/* Total Value Display */}
              <Box p={4} bg="blue.50" borderRadius="md">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Total Estimated Value:</Text>
                  <Badge colorScheme="blue" fontSize="lg" p={2}>
                    <Text>
                      {formatCurrencyWithDecimals(totalValue, orgDetails?.currency || 'SAR')}
                    </Text>
                  </Badge>
                </HStack>
              </Box>

              {/* Add/Edit Item Form */}
              {isAddingItem && (
                <Box p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <VStack spacing={4}>
                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Item Name</FormLabel>
                        <Input
                          value={formData.item_name}
                          onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                          placeholder="Enter item name"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Quality</FormLabel>
                        <Input
                          value={formData.quality}
                          onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
                          placeholder="Quality specification"
                        />
                      </FormControl>
                    </HStack>

                    <FormControl>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Item description"
                        rows={2}
                      />
                    </FormControl>

                    <HStack spacing={4} w="full">
                      <FormControl isRequired>
                        <FormLabel>Quantity</FormLabel>
                        <NumberInput
                          value={formData.quantity}
                          onChange={(value) => setFormData({ ...formData, quantity: Number(value) })}
                          min={1}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Unit Price</FormLabel>
                        <NumberInput
                          value={formData.unit_price}
                          onChange={(value) => setFormData({ ...formData, unit_price: Number(value) })}
                          min={0}
                          precision={2}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </HStack>

                    <HStack spacing={4} w="full">
                      <Button
                        colorScheme="blue"
                        onClick={handleSubmit}
                        isDisabled={!formData.item_name || !formData.quality}
                      >
                        {editingItemId ? 'Update Item' : 'Add Item'}
                      </Button>
                      <Button variant="ghost" onClick={resetForm}>
                        Cancel
                      </Button>
                      {!editingItemId && (
                        <Button 
                          variant="outline" 
                          colorScheme="green"
                          onClick={() => setIsAddingItem(false)}
                        >
                          Done Adding
                        </Button>
                      )}
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Add Item Button */}
              {!isAddingItem && (
                <Button
                  leftIcon={<FiPlus />}
                  colorScheme="blue"
                  onClick={() => setIsAddingItem(true)}
                >
                  Add Item
                </Button>
              )}

              <Divider />

              {/* Items Table */}
              {items && items.length > 0 ? (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Item</Th>
                        <Th>Quality</Th>
                        <Th>Qty</Th>
                        <Th>Unit Price</Th>
                        <Th>Total</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map((item) => (
                        <Tr key={item._id}>
                          <Td>
                            <VStack align="flex-start" spacing={0}>
                              <Text fontWeight="medium">{item.item_name}</Text>
                              {item.description && (
                                <Text fontSize="xs" color="gray.500">
                                  {item.description}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme="green" variant="subtle">
                              {item.quality}
                            </Badge>
                          </Td>
                          <Td>{item.quantity}</Td>
                          <Td>
                            <Text>
                              {formatCurrencyWithDecimals(item.unit_price, item.currency || orgDetails?.currency || 'SAR')}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontWeight="bold">
                              {formatCurrencyWithDecimals(item.total_price, item.currency || orgDetails?.currency || 'SAR')}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <IconButton
                                aria-label="Edit item"
                                icon={<FiEdit />}
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(item)}
                              />
                              <IconButton
                                aria-label="Delete item"
                                icon={<FiTrash2 />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(item._id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Box p={4} textAlign="center">
                  <Text color="gray.500">No items added yet</Text>
                  <Text fontSize="sm" color="gray.400">
                    Add items to calculate the total estimated value
                  </Text>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default LeadItemsModal;
