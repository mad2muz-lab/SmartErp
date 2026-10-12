import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Textarea,
  useDisclosure,
  useToast,
  useColorModeValue,
  Icon,
  IconButton,
  Tooltip,
  SimpleGrid,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import { 
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUsers,
  FiAlertTriangle,
  FiCheckCircle,
  FiArrowLeft
} from 'react-icons/fi';

interface Partner {
  _id: Id<"partners">;
  name: string;
  name_arabic?: string;
  email: string;
  phone?: string;
  role: 'business_partner' | 'investor' | 'saudi_sponsor' | 'customer_referral';
  profit_percentage: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export const PartnersManagementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, selectedOrganization } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_arabic: '',
    email: '',
    phone: '',
    role: 'business_partner' as const,
    profit_percentage: 0,
    notes: '',
  });

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const isConvex = isConvexOrgId(selectedOrganization);

  // Get partners data
  const partners = useQuery(api.partners.getPartners,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // Get partners summary
  const partnersSummary = useQuery(api.partners.getPartnersSummary,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // Mutations
  const createPartner = useMutation(api.partners.createPartner);
  const updatePartner = useMutation(api.partners.updatePartner);
  const deletePartner = useMutation(api.partners.deletePartner);

  const resetForm = () => {
    setFormData({
      name: '',
      name_arabic: '',
      email: '',
      phone: '',
      role: 'business_partner',
      profit_percentage: 0,
      notes: '',
    });
  };

  const handleCreate = () => {
    setIsEditMode(false);
    resetForm();
    onOpen();
  };

  const handleEdit = (partner: Partner) => {
    setIsEditMode(true);
    setSelectedPartner(partner);
    setFormData({
      name: partner.name,
      name_arabic: partner.name_arabic || '',
      email: partner.email,
      phone: partner.phone || '',
      role: partner.role,
      profit_percentage: partner.profit_percentage,
      notes: partner.notes || '',
    });
    onOpen();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrganization || !user) return;

    try {
      if (isEditMode && selectedPartner) {
        await updatePartner({
          partner_id: selectedPartner._id,
          name: formData.name,
          name_arabic: formData.name_arabic || undefined,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          profit_percentage: formData.profit_percentage,
          notes: formData.notes || undefined,
          updated_by: user.id,
        });
        toast({
          title: 'Partner Updated',
          description: 'Partner has been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await createPartner({
          organization_id: selectedOrganization as any,
          name: formData.name,
          name_arabic: formData.name_arabic || undefined,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          profit_percentage: formData.profit_percentage,
          notes: formData.notes || undefined,
          created_by: user.id,
        });
        toast({
          title: 'Partner Created',
          description: 'New partner has been created successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (partner: Partner) => {
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to delete ${partner.name}?`)) {
      try {
        await deletePartner({
          partner_id: partner._id,
          deleted_by: user.id,
        });
        toast({
          title: 'Partner Deleted',
          description: 'Partner has been deleted successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete partner. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'business_partner':
        return 'blue';
      case 'investor':
        return 'green';
      case 'saudi_sponsor':
        return 'purple';
      case 'customer_referral':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'business_partner':
        return 'Business Partner';
      case 'investor':
        return 'Investor';
      case 'saudi_sponsor':
        return 'Saudi Sponsor';
      case 'customer_referral':
        return 'Customer Referral';
      default:
        return role;
    }
  };

  if (!selectedOrganization) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4} textAlign="center">
          <Icon as={FiAlertTriangle} boxSize={12} color="yellow.400" />
          <Heading size="sm" color="gray.900">No Organization Selected</Heading>
          <Text fontSize="sm" color="gray.500">
            Please select an organization to manage partners.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg={cardBg} shadow="sm" borderColor={borderColor}>
        <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }}>
          <Box py={6}>
            <HStack justifyContent="space-between" flexWrap="wrap" spacing={4}>
              <HStack spacing={4}>
                <IconButton
                  aria-label="Back to dashboard"
                  icon={<Icon as={FiArrowLeft} />}
                  variant="ghost"
                  onClick={() => navigate('/profit-sharing')}
                />
                <VStack align="start" spacing={1}>
                  <Heading size="xl" color="gray.900">Partners Management</Heading>
                  <Text fontSize="sm" color="gray.500">
                    Manage business partners and profit sharing
                  </Text>
                </VStack>
              </HStack>
              <Button
                onClick={handleCreate}
                colorScheme="blue"
                leftIcon={<Icon as={FiPlus} />}
                size="sm"
              >
                Add Partner
              </Button>
            </HStack>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        <VStack spacing={6} align="stretch">
          {/* Summary Cards */}
          {partnersSummary && (
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <Card bg={cardBg}>
                <CardBody>
                  <HStack>
                    <Icon as={FiUsers} boxSize={6} color="blue.400" />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.500">Total Partners</Text>
                      <Text fontSize="2xl" fontWeight="bold">{partners?.length || 0}</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
              
              <Card bg={cardBg}>
                <CardBody>
                  <HStack>
                    <Icon as={FiCheckCircle} boxSize={6} color="green.400" />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.500">Active Partners</Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {partners?.filter(p => p.is_active).length || 0}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>

              <Card bg={cardBg}>
                <CardBody>
                  <HStack>
                    <Icon as={FiAlertTriangle} boxSize={6} color="orange.400" />
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.500">Roles</Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {new Set(partners?.map(p => p.role)).size || 0}
                      </Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}

          {/* Partners Table */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Partners List</Heading>
                
                {partners && partners.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Name</Th>
                          <Th>Role</Th>
                          <Th>Email</Th>
                          <Th>Profit %</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {partners.map((partner) => (
                          <Tr key={partner._id}>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{partner.name}</Text>
                                {partner.name_arabic && (
                                  <Text fontSize="sm" color="gray.500" dir="rtl">
                                    {partner.name_arabic}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Badge colorScheme={getRoleBadgeColor(partner.role)}>
                                {getRoleLabel(partner.role)}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{partner.email}</Text>
                            </Td>
                            <Td>
                              <Text fontWeight="medium">{partner.profit_percentage}%</Text>
                            </Td>
                            <Td>
                              <Badge colorScheme={partner.is_active ? 'green' : 'red'}>
                                {partner.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Tooltip label="Edit Partner">
                                  <IconButton
                                    aria-label="Edit partner"
                                    icon={<Icon as={FiEdit} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => handleEdit(partner)}
                                  />
                                </Tooltip>
                                <Tooltip label="Delete Partner">
                                  <IconButton
                                    aria-label="Delete partner"
                                    icon={<Icon as={FiTrash2} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDelete(partner)}
                                  />
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <VStack spacing={4} py={8}>
                    <Icon as={FiUsers} boxSize={12} color="gray.300" />
                    <VStack spacing={2} textAlign="center">
                      <Text fontSize="lg" fontWeight="medium" color="gray.500">
                        No Partners Yet
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Create your first partner to start managing profit sharing
                      </Text>
                    </VStack>
                    <Button
                      onClick={handleCreate}
                      colorScheme="blue"
                      leftIcon={<Icon as={FiPlus} />}
                    >
                      Add First Partner
                    </Button>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader>
              {isEditMode ? 'Edit Partner' : 'Add New Partner'}
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Partner name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Name (Arabic)</FormLabel>
                  <Input
                    value={formData.name_arabic}
                    onChange={(e) => setFormData({ ...formData, name_arabic: e.target.value })}
                    placeholder="اسم الشريك"
                    dir="rtl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="partner@example.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+966 50 123 4567"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Role</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    <option value="business_partner">Business Partner</option>
                    <option value="investor">Investor</option>
                    <option value="saudi_sponsor">Saudi Sponsor</option>
                    <option value="customer_referral">Customer Referral</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Profit Percentage (%)</FormLabel>
                  <NumberInput
                    value={formData.profit_percentage}
                    onChange={(_, valueAsNumber) => 
                      setFormData({ ...formData, profit_percentage: valueAsNumber || 0 })
                    }
                    min={0}
                    max={100}
                    step={0.1}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about this partner"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit">
                {isEditMode ? 'Update Partner' : 'Create Partner'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};