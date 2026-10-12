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
  Checkbox,
  useDisclosure,
  useToast,
  useColorModeValue,
  Icon,
  IconButton,
  Tooltip,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/shared/AuthContext';
import { isConvexOrgId } from '../utils/accountingUtils';
import { SaudiRiyalSymbol } from '../components/SaudiRiyalSymbol';
import { 
  FiPlus,
  FiEdit,
  FiTrash2,
  FiFileText,
  FiAlertTriangle,
  FiBarChart,
  FiArrowLeft,
  FiMessageSquare
} from 'react-icons/fi';
import { WhatsAppExpenseBotDrawer } from '../components/expenses/WhatsAppExpenseBotDrawer';

interface Expense {
  _id: Id<"company_expenses">;
  expense_type: 'registration' | 'office_rent' | 'utilities' | 'marketing' | 'other';
  description: string;
  description_arabic?: string;
  amount: number;
  currency: string;
  expense_date: string;
  category?: string;
  receipt_url?: string;
  is_shared: boolean;
  shared_percentage?: number;
  created_at: string;
}

export const CompanyExpensesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, selectedOrganization } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWhatsAppBot, setShowWhatsAppBot] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    expense_type: 'other' as const,
    description: '',
    description_arabic: '',
    amount: 0,
    currency: 'SAR',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    receipt_url: '',
    is_shared: false,
    shared_percentage: 100,
  });

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const isConvex = isConvexOrgId(selectedOrganization);

  // Get expenses data
  const expenses = useQuery(api.companyExpenses.getCompanyExpenses,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // Get expenses summary
  const expensesSummary = useQuery(api.companyExpenses.getExpensesSummary,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // Mutations
  const createExpense = useMutation(api.companyExpenses.createExpense);
  const updateExpense = useMutation(api.companyExpenses.updateExpense);
  const deleteExpense = useMutation(api.companyExpenses.deleteExpense);

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'blue';
      case 'office_rent':
        return 'green';
      case 'utilities':
        return 'yellow';
      case 'marketing':
        return 'purple';
      case 'other':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'registration':
        return 'Registration';
      case 'office_rent':
        return 'Office Rent';
      case 'utilities':
        return 'Utilities';
      case 'marketing':
        return 'Marketing';
      case 'other':
        return 'Other';
      default:
        return type;
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrganization || !user) return;

    try {
      await createExpense({
        organization_id: selectedOrganization as any,
        expense_type: formData.expense_type,
        description: formData.description,
        description_arabic: formData.description_arabic || undefined,
        amount: formData.amount,
        currency: formData.currency,
        expense_date: formData.expense_date,
        category: formData.category || undefined,
        receipt_url: formData.receipt_url || undefined,
        is_shared: formData.is_shared,
        shared_percentage: formData.is_shared ? formData.shared_percentage : undefined,
        created_by: user.id,
      });

      setShowCreateModal(false);
      resetForm();
      toast({
        title: 'Expense Created',
        description: 'Company expense has been created successfully.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: 'Error',
        description: 'Error creating expense. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense || !user) return;

    try {
      const result = await updateExpense({
        expense_id: selectedExpense._id,
        expense_type: formData.expense_type,
        description: formData.description,
        description_arabic: formData.description_arabic || undefined,
        amount: formData.amount,
        currency: formData.currency,
        expense_date: formData.expense_date,
        category: formData.category || undefined,
        receipt_url: formData.receipt_url || undefined,
        is_shared: formData.is_shared,
        shared_percentage: formData.is_shared ? formData.shared_percentage : undefined,
        updated_by: user.id,
      });

      if (result.success) {
        setShowEditModal(false);
        setSelectedExpense(null);
        resetForm();
        toast({
          title: 'Expense Updated',
          description: 'Company expense has been updated successfully.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Error',
        description: 'Error updating expense. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!user) return;

    if (window.confirm(`Are you sure you want to delete this expense: ${expense.description}?`)) {
      try {
        const result = await deleteExpense({
          expense_id: expense._id,
          deleted_by: user.id,
        });

        if (result.success) {
          toast({
            title: 'Expense Deleted',
            description: result.message,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Error',
            description: result.message,
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        toast({
          title: 'Error',
          description: 'Error deleting expense. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      expense_type: 'other',
      description: '',
      description_arabic: '',
      amount: 0,
      currency: 'SAR',
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      receipt_url: '',
      is_shared: false,
      shared_percentage: 100,
    });
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
    setShowEditModal(false);
    onOpen();
  };

  const openEditModal = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      expense_type: expense.expense_type,
      description: expense.description,
      description_arabic: expense.description_arabic || '',
      amount: expense.amount,
      currency: expense.currency,
      expense_date: expense.expense_date,
      category: expense.category || '',
      receipt_url: expense.receipt_url || '',
      is_shared: expense.is_shared,
      shared_percentage: expense.shared_percentage || 100,
    });
    setShowCreateModal(false);
    setShowEditModal(true);
    onOpen();
  };

  const handleModalClose = () => {
    onClose();
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedExpense(null);
    resetForm();
  };

  if (!selectedOrganization) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4} textAlign="center">
          <Icon as={FiAlertTriangle} boxSize={12} color="yellow.400" />
          <Heading size="sm" color="gray.900">No Organization Selected</Heading>
          <Text fontSize="sm" color="gray.500">
            Please select an organization to manage expenses.
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
                  <Heading size="xl" color="gray.900">Company Expenses</Heading>
                  <Text fontSize="sm" color="gray.500">
                    Track and manage business expenses and partner sharing
                  </Text>
                </VStack>
              </HStack>
              <HStack spacing={2}>
                <Button
                  onClick={() => setShowWhatsAppBot(true)}
                  colorScheme="whatsapp"
                  bg="#25D366"
                  _hover={{ bg: "#20bd5a" }}
                  color="white"
                  leftIcon={<Icon as={FiMessageSquare} />}
                  size="md"
                  borderRadius="xl"
                  fontWeight="bold"
                  shadow="md"
                >
                  🤖 WhatsApp Expense Bot
                </Button>
                <Button
                  onClick={handleCreate}
                  colorScheme="blue"
                  leftIcon={<Icon as={FiPlus} />}
                  size="md"
                  borderRadius="xl"
                >
                  Add Expense
                </Button>
              </HStack>
            </HStack>
          </Box>
        </Box>
      </Box>

      {/* Content */}
      <Box maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        <VStack spacing={6} align="stretch">
          {/* Quick Action WhatsApp Bot Banner */}
          <Box
            bg="linear-gradient(135deg, #075E54 0%, #128C7E 100%)"
            p={5}
            borderRadius="2xl"
            color="white"
            shadow="lg"
          >
            <HStack justifyContent="space-between" flexWrap="wrap" spacing={4}>
              <HStack spacing={4}>
                <Box p={3} bg="whiteAlpha.200" borderRadius="xl">
                  <Icon as={FiMessageSquare} boxSize={8} color="#25D366" />
                </Box>
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Heading size="md">WhatsApp AI Expense & Receipt Assistant</Heading>
                    <Badge colorScheme="whatsapp" fontSize="0.75rem" px={2} py={0.5} borderRadius="md">
                      ACTIVE AI BOT
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="whiteAlpha.900" maxW="650px">
                    Snap or upload invoices to auto-detect COA heads (5000 series), book government attestations (COC / Labor Office), or pre-book Travel Cash Advances (Asset 1230) with automated approval routing and Journal Vouchers.
                  </Text>
                </VStack>
              </HStack>
              <HStack spacing={3}>
                <Button
                  size="lg"
                  bg="#25D366"
                  color="white"
                  _hover={{ bg: "#20bd5a" }}
                  leftIcon={<Icon as={FiMessageSquare} />}
                  fontWeight="bold"
                  shadow="md"
                  onClick={() => setShowWhatsAppBot(true)}
                >
                  Open WhatsApp Bot 💬
                </Button>
              </HStack>
            </HStack>
          </Box>

          {/* Summary Cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={5}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <HStack>
                    <Icon as={FiFileText} boxSize={6} color="red.400" />
                    <VStack align="start" spacing={0}>
                      <StatLabel fontSize="sm" color="gray.500">Total Expenses</StatLabel>
                      <StatNumber fontSize="lg" color="gray.900">
                        <SaudiRiyalSymbol />
                        {expensesSummary ? formatCurrency(expensesSummary.total_expenses) : '0'}
                      </StatNumber>
                    </VStack>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <HStack>
                    <Icon as={FiBarChart} boxSize={6} color="blue.400" />
                    <VStack align="start" spacing={0}>
                      <StatLabel fontSize="sm" color="gray.500">Shared Expenses</StatLabel>
                      <StatNumber fontSize="lg" color="gray.900">
                        <SaudiRiyalSymbol />
                        {expensesSummary ? formatCurrency(expensesSummary.shared_expenses) : '0'}
                      </StatNumber>
                    </VStack>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>

            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <HStack>
                    <Icon as={FiFileText} boxSize={6} color="green.400" />
                    <VStack align="start" spacing={0}>
                      <StatLabel fontSize="sm" color="gray.500">Private Expenses</StatLabel>
                      <StatNumber fontSize="lg" color="gray.900">
                        <SaudiRiyalSymbol />
                        {expensesSummary ? formatCurrency(expensesSummary.private_expenses) : '0'}
                      </StatNumber>
                    </VStack>
                  </HStack>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Expenses Table */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Expenses List</Heading>
                
                {expenses?.items && expenses.items.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Type</Th>
                          <Th>Description</Th>
                          <Th>Amount</Th>
                          <Th>Date</Th>
                          <Th>Shared</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {expenses.items.map((expense) => (
                          <Tr key={expense._id}>
                            <Td>
                              <Badge colorScheme={getExpenseTypeColor(expense.expense_type)}>
                                {getExpenseTypeLabel(expense.expense_type)}
                              </Badge>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{expense.description}</Text>
                                {expense.description_arabic && (
                                  <Text fontSize="sm" color="gray.500" dir="rtl">
                                    {expense.description_arabic}
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontWeight="medium">
                                <SaudiRiyalSymbol />
                                {formatCurrency(expense.amount)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" color="gray.500">
                                {new Date(expense.expense_date).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={1}>
                                <Badge colorScheme={expense.is_shared ? 'blue' : 'gray'}>
                                  {expense.is_shared ? 'Yes' : 'No'}
                                </Badge>
                                {expense.is_shared && expense.shared_percentage && (
                                  <Text fontSize="xs" color="gray.500">
                                    {expense.shared_percentage}%
                                  </Text>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Tooltip label="Edit Expense">
                                  <IconButton
                                    aria-label="Edit expense"
                                    icon={<Icon as={FiEdit} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="blue"
                                    onClick={() => openEditModal(expense)}
                                  />
                                </Tooltip>
                                <Tooltip label="Delete Expense">
                                  <IconButton
                                    aria-label="Delete expense"
                                    icon={<Icon as={FiTrash2} />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDeleteExpense(expense)}
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
                    <Icon as={FiFileText} boxSize={12} color="gray.300" />
                    <VStack spacing={2} textAlign="center">
                      <Text fontSize="lg" fontWeight="medium" color="gray.500">
                        No Expenses Yet
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Create your first expense to start tracking
                      </Text>
                    </VStack>
                    <Button
                      onClick={handleCreate}
                      colorScheme="blue"
                      leftIcon={<Icon as={FiPlus} />}
                    >
                      Add First Expense
                    </Button>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Box>

      {/* Create/Edit Expense Modal */}
      <Modal isOpen={isOpen} onClose={handleModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={showCreateModal ? handleCreateExpense : handleUpdateExpense}>
            <ModalHeader pb={1}>
              <HStack justifyContent="space-between" pr={6}>
                <Text>{showCreateModal ? 'Register New Expense' : 'Edit Expense'}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            
            <ModalBody>
              <VStack spacing={4}>
                {showCreateModal && (
                  <Box
                    w="full"
                    p={3.5}
                    bg="green.50"
                    borderColor="green.200"
                    borderWidth="1px"
                    borderRadius="xl"
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack spacing={3}>
                        <Icon as={FiMessageSquare} color="#25D366" boxSize={6} />
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" fontSize="sm" color="green.900">
                            Prefer WhatsApp AI Bot?
                          </Text>
                          <Text fontSize="xs" color="green.700">
                            Snap receipt photo to auto-categorize, handle attestations, or pre-book cash advances.
                          </Text>
                        </VStack>
                      </HStack>
                      <Button
                        size="sm"
                        colorScheme="whatsapp"
                        bg="#25D366"
                        _hover={{ bg: "#20bd5a" }}
                        onClick={() => {
                          handleModalClose();
                          setShowWhatsAppBot(true);
                        }}
                      >
                        Launch Bot
                      </Button>
                    </HStack>
                  </Box>
                )}

                <FormControl isRequired>
                  <FormLabel>Expense Type</FormLabel>
                  <Select
                    value={formData.expense_type}
                    onChange={(e) => setFormData({ ...formData, expense_type: e.target.value as any })}
                  >
                    <option value="registration">Registration</option>
                    <option value="office_rent">Office Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Expense description"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description (Arabic)</FormLabel>
                  <Input
                    value={formData.description_arabic}
                    onChange={(e) => setFormData({ ...formData, description_arabic: e.target.value })}
                    placeholder="وصف المصروف"
                    dir="rtl"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Amount</FormLabel>
                  <NumberInput
                    value={formData.amount}
                    onChange={(_, valueAsNumber) => 
                      setFormData({ ...formData, amount: valueAsNumber || 0 })
                    }
                    min={0}
                    step={0.01}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Currency</FormLabel>
                  <Select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="SAR">{'\uE900'} Saudi Riyal</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Expense Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Category</FormLabel>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Expense category"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Receipt URL</FormLabel>
                  <Input
                    type="url"
                    value={formData.receipt_url}
                    onChange={(e) => setFormData({ ...formData, receipt_url: e.target.value })}
                    placeholder="https://example.com/receipt.pdf"
                  />
                </FormControl>

                <FormControl>
                  <Checkbox
                    isChecked={formData.is_shared}
                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                  >
                    Share this expense among partners
                  </Checkbox>
                </FormControl>

                {formData.is_shared && (
                  <FormControl isRequired>
                    <FormLabel>Shared Percentage (%)</FormLabel>
                    <NumberInput
                      value={formData.shared_percentage}
                      onChange={(_, valueAsNumber) => 
                        setFormData({ ...formData, shared_percentage: valueAsNumber || 100 })
                      }
                      min={1}
                      max={100}
                    >
                      <NumberInputField />
                    </NumberInput>
                  </FormControl>
                )}
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleModalClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" type="submit">
                {showCreateModal ? 'Create Expense' : 'Update Expense'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* WhatsApp Expense Bot Drawer */}
      <WhatsAppExpenseBotDrawer
        isOpen={showWhatsAppBot}
        onClose={() => setShowWhatsAppBot(false)}
        organizationId={selectedOrganization}
        currentUser={user}
      />

      {/* Floating WhatsApp Action Pill */}
      <Box
        position="fixed"
        bottom="28px"
        right="28px"
        zIndex={100}
      >
        <Button
          onClick={() => setShowWhatsAppBot(true)}
          bg="#25D366"
          _hover={{ bg: "#20bd5a", transform: "scale(1.05)" }}
          _active={{ transform: "scale(0.98)" }}
          color="white"
          size="lg"
          height="54px"
          px={6}
          borderRadius="full"
          shadow="2xl"
          fontWeight="bold"
          fontSize="md"
          leftIcon={<Icon as={FiMessageSquare} boxSize={5} />}
          transition="all 0.2s"
        >
          WhatsApp Expense Bot
        </Button>
      </Box>
    </Box>
  );
};