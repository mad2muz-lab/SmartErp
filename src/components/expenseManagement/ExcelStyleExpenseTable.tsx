import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
  Icon,
  Flex,
  Spacer,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { useAuth } from '../../contexts/shared/AuthContext';
import { SaudiRiyalSymbol } from '../SaudiRiyalSymbol';
import { 
  FiEdit, 
  FiTrash2, 
  FiPlus, 
  FiSave, 
  FiX, 
  FiFileText,
  FiDownload,
  FiFilter,
  FiSearch
} from 'react-icons/fi';

interface ExcelStyleExpenseTableProps {
  organizationId: Id<"organizations">;
}

interface EditableCellProps {
  value: any;
  type: 'text' | 'number' | 'select' | 'date';
  options?: string[];
  onChange: (value: any) => void;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  type,
  options = [],
  onChange,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}) => {
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    onSave();
  };

  const handleCancel = () => {
    setTempValue(value);
    onCancel();
  };

  if (isEditing) {
    return (
      <HStack spacing={1} w="full">
        {type === 'text' && (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            size="sm"
            autoFocus
          />
        )}
        {type === 'number' && (
          <NumberInput
            value={tempValue}
            onChange={(_, val) => setTempValue(val || 0)}
            size="sm"
            min={0}
            step={0.01}
          >
            <NumberInputField />
          </NumberInput>
        )}
        {type === 'select' && (
          <Select
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            size="sm"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        )}
        {type === 'date' && (
          <Input
            type="date"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            size="sm"
          />
        )}
        <IconButton
          aria-label="Save"
          icon={<Icon as={FiSave} />}
          size="xs"
          colorScheme="green"
          onClick={handleSave}
        />
        <IconButton
          aria-label="Cancel"
          icon={<Icon as={FiX} />}
          size="xs"
          colorScheme="red"
          onClick={handleCancel}
        />
      </HStack>
    );
  }

  return (
    <Box
      onClick={onEdit}
      cursor="pointer"
      _hover={{ bg: 'gray.50' }}
      p={1}
      borderRadius="md"
      minH="32px"
      display="flex"
      alignItems="center"
    >
      {type === 'number' && value !== undefined && (
        <>
          <SaudiRiyalSymbol />
          {value.toFixed(2)}
        </>
      )}
      {type !== 'number' && value}
    </Box>
  );
};

export const ExcelStyleExpenseTable: React.FC<ExcelStyleExpenseTableProps> = ({
  organizationId,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  
  const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // State for adding new expense row
  const [isAddingNewRow, setIsAddingNewRow] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    expense_type: 'other' as const,
    amount: 0,
    currency: 'SAR',
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    status: 'Due' as const,
    receipt_url: '',
    is_shared: true, // Default to shared
    shared_percentage: 100,
    paid_by_partner_id: '' as any,
    approval_status: 'Pending' as const,
    invoice_details: '',
    remarks: '',
  });

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get expenses with partner allocations (with error handling)
  // Temporarily disable this query to prevent server errors
  const expensesData = null; // useQuery(api.companyExpenses.getExpensesWithAllocations, 
    // organizationId ? { organization_id: organizationId, limit: 100 } : "skip"
  // );
  
  // Fallback to regular expenses if needed
  const fallbackExpenses = useQuery(api.companyExpenses.getCompanyExpenses, 
    organizationId ? { organization_id: organizationId, limit: 100 } : "skip"
  );

  // Get only business partners for allocation (not sponsors, investors, or referrals)
  const partners = useQuery(api.partners.getPartners, {
    organization_id: organizationId,
    role: "business_partner", // Only get business partners
    is_active: true, // Only active partners
  });

  // Mutations
  const updateExpense = useMutation(api.companyExpenses.updateExpense);
  const deleteExpense = useMutation(api.companyExpenses.deleteExpense);
  const createExpense = useMutation(api.companyExpenses.createExpense);

  // Filter and search expenses
  const filteredExpenses = useMemo(() => {
    // Use fallback expenses data
    const expensesList = fallbackExpenses?.items || [];
    
    return expensesList.filter((expense) => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.expense_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || expense.expense_type === filterType;
      const matchesStatus = filterStatus === 'all' || expense.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [fallbackExpenses?.items, searchTerm, filterType, filterStatus]);

  const handleCellEdit = (rowIndex: number, column: string) => {
    setEditingCell({ row: rowIndex, col: column });
  };

  const handleCellSave = async (rowIndex: number, column: string, value: any) => {
    const expense = filteredExpenses[rowIndex];
    if (!expense) return;

    try {
      await updateExpense({
        expense_id: expense._id,
        [column]: value,
        updated_by: user?.id || '',
      });

      toast({
        title: 'Expense updated',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error updating expense',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    }

    setEditingCell(null);
  };

  const handleCellCancel = () => {
    setEditingCell(null);
  };

  const handleCreateExpense = async () => {
    if (!newExpense.description || newExpense.amount <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in description and amount',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      // Calculate partner allocations if expense is shared
      const partnerAllocations = [];
      if (newExpense.is_shared && partners && partners.length > 0) {
        const equalShare = newExpense.amount / partners.length;
        
        for (const partner of partners) {
          const isPaidBy = partner._id === newExpense.paid_by_partner_id;
          partnerAllocations.push({
            partner_id: partner._id,
            allocated_amount: equalShare,
            // If this partner paid, they have no due. Others have due until status is "Paid"
            paid_amount: isPaidBy ? equalShare : 0,
            status: isPaidBy ? "Paid" : (newExpense.status === "Paid" ? "Paid" : "Due")
          });
        }
      }

      await createExpense({
        organization_id: organizationId,
        description: newExpense.description,
        expense_type: newExpense.expense_type,
        amount: newExpense.amount,
        currency: newExpense.currency,
        expense_date: newExpense.expense_date,
        category: newExpense.category,
        status: newExpense.status,
        receipt_url: newExpense.receipt_url,
        is_shared: newExpense.is_shared,
        shared_percentage: newExpense.shared_percentage,
        paid_by_partner_id: newExpense.paid_by_partner_id || undefined,
        approval_status: newExpense.approval_status,
        invoice_details: newExpense.invoice_details,
        remarks: newExpense.remarks,
        partner_allocations: partnerAllocations,
        created_by: user?.id || '',
      });

      toast({
        title: 'Expense Created',
        description: 'New expense has been added successfully',
        status: 'success',
        duration: 3000,
      });

      // Reset form and exit adding mode
      setNewExpense({
        description: '',
        expense_type: 'other',
        amount: 0,
        currency: 'SAR',
        expense_date: new Date().toISOString().split('T')[0],
        category: '',
        status: 'Due',
        receipt_url: '',
        is_shared: true,
        shared_percentage: 100,
        paid_by_partner_id: '',
        approval_status: 'Pending',
        invoice_details: '',
        remarks: '',
      });
      setIsAddingNewRow(false);
    } catch (error) {
      toast({
        title: 'Error Creating Expense',
        description: 'Please try again',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'green';
      case 'Due': return 'red';
      case 'Pending': return 'yellow';
      case 'Approved': return 'blue';
      default: return 'gray';
    }
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case 'registration': return 'blue';
      case 'office_rent': return 'green';
      case 'utilities': return 'yellow';
      case 'marketing': return 'purple';
      case 'Office Supplies': return 'orange';
      case 'other': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <Box>
      {/* Toolbar */}
      <Flex mb={4} gap={4} align="center" wrap="wrap">
        <HStack spacing={2}>
          <Icon as={FiSearch} />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="sm"
            w="200px"
          />
        </HStack>
        
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          size="sm"
          w="150px"
        >
          <option value="all">All Types</option>
          <option value="registration">Registration</option>
          <option value="office_rent">Office Rent</option>
          <option value="utilities">Utilities</option>
          <option value="marketing">Marketing</option>
          <option value="Office Supplies">Office Supplies</option>
          <option value="other">Other</option>
        </Select>

        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="sm"
          w="120px"
        >
          <option value="all">All Status</option>
          <option value="Due">Due</option>
          <option value="Paid">Paid</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
        </Select>

        <Spacer />

        <HStack spacing={2}>
          <Button 
            size="sm" 
            leftIcon={<Icon as={FiPlus} />} 
            colorScheme="blue" 
            onClick={() => setIsAddingNewRow(true)}
          >
            Add Expense
          </Button>
          <Button size="sm" leftIcon={<Icon as={FiDownload} />} variant="outline">
            Export
          </Button>
        </HStack>
      </Flex>

      {/* Loading State */}
      {!fallbackExpenses ? (
        <Box p={8} textAlign="center">
          <Text>Loading expenses...</Text>
        </Box>
      ) : (
        <>

      {/* Excel-style Table */}
      <Box overflowX="auto" border="1px" borderColor={borderColor} borderRadius="md">
        <Table size="sm" variant="simple">
          <Thead bg={cardBg}>
            <Tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Currency</Th>
              <Th>Expense Date</Th>
              <Th>Paid By</Th>
              <Th>Invoice Details</Th>
              <Th>Remarks</Th>
              <Th>Receipt URL</Th>
              {(partners as any)?.map((partner: any) => (
                <Th key={partner._id} textAlign="center">
                  {partner.name}
                </Th>
              ))}
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {/* New Expense Row */}
            {isAddingNewRow && (
              <Tr bg="blue.50" border="2px" borderColor="blue.200">
                <Td>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Enter description"
                    size="sm"
                    autoFocus
                  />
                </Td>
                <Td>
                  <Select
                    value={newExpense.expense_type}
                    onChange={(e) => setNewExpense({ ...newExpense, expense_type: e.target.value as any })}
                    size="sm"
                  >
                    <option value="registration">Registration</option>
                    <option value="office_rent">Office Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="marketing">Marketing</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="other">Other</option>
                  </Select>
                </Td>
                <Td>
                  <NumberInput
                    value={newExpense.amount}
                    onChange={(_, val) => setNewExpense({ ...newExpense, amount: val || 0 })}
                    size="sm"
                    min={0}
                    step={0.01}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Td>
                <Td>
                  <Select
                    value={newExpense.currency}
                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                    size="sm"
                  >
                    <option value="SAR">SAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </Select>
                </Td>
                <Td>
                  <Input
                    type="date"
                    value={newExpense.expense_date}
                    onChange={(e) => setNewExpense({ ...newExpense, expense_date: e.target.value })}
                    size="sm"
                  />
                </Td>
                <Td>
                  <Select
                    value={newExpense.paid_by_partner_id}
                    onChange={(e) => setNewExpense({ ...newExpense, paid_by_partner_id: e.target.value })}
                    size="sm"
                    placeholder="Select partner"
                  >
                    <option value="">Select Partner</option>
                    {partners?.map((partner) => (
                      <option key={partner._id} value={partner._id}>
                        {partner.name}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td>
                  <Input
                    value={newExpense.invoice_details}
                    onChange={(e) => setNewExpense({ ...newExpense, invoice_details: e.target.value })}
                    placeholder="Invoice details"
                    size="sm"
                  />
                </Td>
                <Td>
                  <Input
                    value={newExpense.remarks}
                    onChange={(e) => setNewExpense({ ...newExpense, remarks: e.target.value })}
                    placeholder="Remarks"
                    size="sm"
                  />
                </Td>
                <Td>
                  <Input
                    value={newExpense.receipt_url}
                    onChange={(e) => setNewExpense({ ...newExpense, receipt_url: e.target.value })}
                    placeholder="Receipt URL"
                    size="sm"
                  />
                </Td>
                {/* Partner allocation columns */}
                {partners?.map((partner) => {
                  const equalShare = newExpense.amount / (partners?.length || 1);
                  const isPaidBy = partner._id === newExpense.paid_by_partner_id;
                  return (
                    <Td key={partner._id} textAlign="center">
                      <VStack spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          <SaudiRiyalSymbol />
                          {equalShare.toFixed(2)}
                        </Text>
                        <Badge 
                          size="sm" 
                          colorScheme={isPaidBy ? "green" : (newExpense.status === "Paid" ? "green" : "red")}
                        >
                          {isPaidBy ? "Paid" : (newExpense.status === "Paid" ? "Paid" : "Due")}
                        </Badge>
                      </VStack>
                    </Td>
                  );
                })}
                <Td>
                  <Select
                    value={newExpense.status}
                    onChange={(e) => setNewExpense({ ...newExpense, status: e.target.value as any })}
                    size="sm"
                  >
                    <option value="Due">Due</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </Select>
                </Td>
                <Td>
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="Save"
                      icon={<Icon as={FiSave} />}
                      size="xs"
                      colorScheme="green"
                      onClick={handleCreateExpense}
                    />
                    <IconButton
                      aria-label="Cancel"
                      icon={<Icon as={FiX} />}
                      size="xs"
                      colorScheme="red"
                      onClick={() => {
                        setIsAddingNewRow(false);
                        setNewExpense({
                          description: '',
                          expense_type: 'other',
                          amount: 0,
                          currency: 'SAR',
                          expense_date: new Date().toISOString().split('T')[0],
                          category: '',
                          status: 'Due',
                          receipt_url: '',
                          is_shared: true,
                          shared_percentage: 100,
                          paid_by_partner_id: '',
                          approval_status: 'Pending',
                          invoice_details: '',
                          remarks: '',
                        });
                      }}
                    />
                  </HStack>
                </Td>
              </Tr>
            )}
            
            {filteredExpenses.map((expense, rowIndex) => (
              <Tr key={expense._id} _hover={{ bg: 'gray.50' }}>
                <Td>
                  <EditableCell
                    value={expense.description}
                    type="text"
                    onChange={(value) => handleCellSave(rowIndex, 'description', value)}
                    isEditing={editingCell?.row === rowIndex && editingCell?.col === 'description'}
                    onEdit={() => handleCellEdit(rowIndex, 'description')}
                    onSave={() => handleCellSave(rowIndex, 'description', editingCell?.row === rowIndex ? 'description' : '')}
                    onCancel={handleCellCancel}
                  />
                </Td>
                
                <Td>
                  <Badge colorScheme={getExpenseTypeColor(expense.expense_type)}>
                    {expense.expense_type}
                  </Badge>
                </Td>
                
                <Td>
                  <EditableCell
                    value={expense.amount}
                    type="number"
                    onChange={(value) => handleCellSave(rowIndex, 'amount', value)}
                    isEditing={editingCell?.row === rowIndex && editingCell?.col === 'amount'}
                    onEdit={() => handleCellEdit(rowIndex, 'amount')}
                    onSave={() => handleCellSave(rowIndex, 'amount', editingCell?.row === rowIndex ? 'amount' : '')}
                    onCancel={handleCellCancel}
                  />
                </Td>
                
                <Td>
                  <Text fontSize="sm">{expense.currency || 'SAR'}</Text>
                </Td>
                
                <Td>
                  <EditableCell
                    value={expense.expense_date}
                    type="date"
                    onChange={(value) => handleCellSave(rowIndex, 'expense_date', value)}
                    isEditing={editingCell?.row === rowIndex && editingCell?.col === 'expense_date'}
                    onEdit={() => handleCellEdit(rowIndex, 'expense_date')}
                    onSave={() => handleCellSave(rowIndex, 'expense_date', editingCell?.row === rowIndex ? 'expense_date' : '')}
                    onCancel={handleCellCancel}
                  />
                </Td>
                
                <Td>
                  <EditableCell
                    value={(expense as any).paid_by_partner_id ? 
                      partners?.find(p => p._id === (expense as any).paid_by_partner_id)?.name || 'Unknown Partner' :
                      (expense as any).paid_by_name || 'Not specified'
                    }
                    type="select"
                    options={['Not specified', ...(partners?.map(p => p.name) || [])]}
                    onChange={(value) => {
                      const partner = partners?.find(p => p.name === value);
                      handleCellSave(rowIndex, 'paid_by_partner_id', partner?._id || '');
                    }}
                    isEditing={editingCell?.row === rowIndex && editingCell?.col === 'paid_by_partner_id'}
                    onEdit={() => handleCellEdit(rowIndex, 'paid_by_partner_id')}
                    onSave={() => handleCellSave(rowIndex, 'paid_by_partner_id', editingCell?.row === rowIndex ? 'paid_by_partner_id' : '')}
                    onCancel={handleCellCancel}
                  />
                </Td>
                
                <Td>
                  <EditableCell
                    value={(expense as any).invoice_details || ''}
                    type="text"
                    onChange={(value) => handleCellSave(rowIndex, 'invoice_details', value)}
                    isEditing={editingCell?.row === rowIndex && editingCell?.col === 'invoice_details'}
                    onEdit={() => handleCellEdit(rowIndex, 'invoice_details')}
                    onSave={() => handleCellSave(rowIndex, 'invoice_details', editingCell?.row === rowIndex ? 'invoice_details' : '')}
                    onCancel={handleCellCancel}
                  />
                </Td>
                
                <Td>
                  <EditableCell
                    value={(expense as any).remarks || ''}
                    type="text"
                    onChange={(value) => handleCellSave(rowIndex, 'remarks', value)}
                    isEditing={editingCell?.row === rowIndex && editingCell?.col === 'remarks'}
                    onEdit={() => handleCellEdit(rowIndex, 'remarks')}
                    onSave={() => handleCellSave(rowIndex, 'remarks', editingCell?.row === rowIndex ? 'remarks' : '')}
                    onCancel={handleCellCancel}
                  />
                </Td>
                
                <Td>
                  {expense.receipt_url ? (
                    <Button
                      as="a"
                      href={expense.receipt_url}
                      target="_blank"
                      size="xs"
                      leftIcon={<Icon as={FiFileText} />}
                      colorScheme="blue"
                      variant="link"
                    >
                      View
                    </Button>
                  ) : (
                    <Text fontSize="sm" color="gray.500">No receipt</Text>
                  )}
                </Td>
                
                {/* Partner allocation columns with proper distribution logic */}
                {partners?.map((partner) => {
                  const equalShare = expense.amount / (partners?.length || 1);
                  const isPaidBy = partner._id === (expense as any).paid_by_partner_id;
                  const isExpensePaid = expense.status === "Paid";
                  
                  return (
                    <Td key={partner._id} textAlign="center">
                      <VStack spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          <SaudiRiyalSymbol />
                          {equalShare.toFixed(2)}
                        </Text>
                        <Badge 
                          size="sm" 
                          colorScheme={
                            isPaidBy ? "green" : 
                            isExpensePaid ? "green" : 
                            "red"
                          }
                        >
                          {isPaidBy ? "Paid" : 
                           isExpensePaid ? "Paid" : 
                           "Due"}
                        </Badge>
                      </VStack>
                    </Td>
                  );
                })}
                
                <Td>
                  <Badge colorScheme={getStatusColor(expense.status || 'Due')}>
                    {expense.status || 'Due'}
                  </Badge>
                </Td>
                
                <Td>
                  <HStack spacing={1}>
                    <Tooltip label="Edit Expense">
                      <IconButton
                        aria-label="Edit"
                        icon={<Icon as={FiEdit} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="blue"
                      />
                    </Tooltip>
                    <Tooltip label="Delete Expense">
                      <IconButton
                        aria-label="Delete"
                        icon={<Icon as={FiTrash2} />}
                        size="xs"
                        variant="ghost"
                        colorScheme="red"
                      />
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Summary Row */}
      <Box mt={4} p={4} bg={cardBg} borderRadius="md" border="1px" borderColor={borderColor}>
        <Flex justify="space-between" align="center">
          <Text fontWeight="medium">
            Total Expenses: {filteredExpenses.length}
          </Text>
          <Text fontWeight="medium">
            Total Amount: <SaudiRiyalSymbol />
            {filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
          </Text>
        </Flex>
      </Box>
        </>
      )}

    </Box>
  );
};
