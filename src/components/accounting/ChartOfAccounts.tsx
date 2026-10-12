import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Card,
  CardHeader,
  CardBody,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiEye,
  FiEyeOff,
  FiFolder
} from 'react-icons/fi';

import { isConvexOrgId, DEFAULT_CHART_OF_ACCOUNTS } from '../../utils/accountingUtils';

interface ChartOfAccountsProps {
  organizationId: any;
  userId: any;
}

interface AccountFormData {
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  parent_account_id?: string;
  description?: string;
  is_active: boolean;
}

const ChartOfAccounts: React.FC<ChartOfAccountsProps> = ({ 
  organizationId, 
  userId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState('all');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const isConvex = isConvexOrgId(organizationId);

  // Form state
  const [formData, setFormData] = useState<AccountFormData>({
    account_code: '',
    account_name: '',
    account_type: '',
    account_category: '',
    parent_account_id: '',
    description: '',
    is_active: true,
  });

  // Local fallback accounts state
  const [localAccounts, setLocalAccounts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`trading_erp_accounts_${organizationId || 'default'}`);
      return saved ? JSON.parse(saved) : DEFAULT_CHART_OF_ACCOUNTS;
    } catch {
      return DEFAULT_CHART_OF_ACCOUNTS;
    }
  });

  // Fetch accounts from Convex when available
  const accounts = useQuery(
    api.accounting.chartOfAccounts.listAccounts,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  const effectiveAccounts = (accounts && accounts.length > 0) ? accounts : localAccounts;

  // Mutations
  const createAccount = useMutation(api.accounting.chartOfAccounts.createAccount);
  const updateAccount = useMutation(api.accounting.chartOfAccounts.updateAccount);
  const deleteAccount = useMutation(api.accounting.chartOfAccounts.deleteAccount);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const accountTypes = [
    { value: 'ASSET', label: 'Assets', color: 'blue' },
    { value: 'LIABILITY', label: 'Liabilities', color: 'red' },
    { value: 'EQUITY', label: 'Equity', color: 'green' },
    { value: 'REVENUE', label: 'Revenue', color: 'purple' },
    { value: 'EXPENSE', label: 'Expenses', color: 'orange' },
  ];

  const accountCategories = {
    ASSET: ['CURRENT_ASSET', 'FIXED_ASSET', 'INTANGIBLE_ASSET'],
    LIABILITY: ['CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'],
    EQUITY: ['OWNERS_EQUITY', 'RETAINED_EARNINGS'],
    REVENUE: ['OPERATING_REVENUE', 'NON_OPERATING_REVENUE'],
    EXPENSE: ['OPERATING_EXPENSE', 'NON_OPERATING_EXPENSE'],
  };

  const filteredAccounts = effectiveAccounts.filter(account => {
    const matchesSearch = account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.account_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedAccountType === 'all' || account.account_type === selectedAccountType;
    return matchesSearch && matchesType;
  });

  const handleCreateAccount = async () => {
    try {
      if (isConvex) {
        await createAccount({
          organization_id: organizationId,
          account_code: formData.account_code,
          account_name: formData.account_name,
          account_type: formData.account_type as any,
          account_category: formData.account_category as any,
          parent_account_id: formData.parent_account_id ? formData.parent_account_id as Id<"chart_of_accounts"> : undefined,
          description: formData.description,
          is_active: formData.is_active,
          created_by: userId,
        });
      } else {
        const newAccount = {
          _id: `acc_${Date.now()}`,
          account_code: formData.account_code,
          account_name: formData.account_name,
          account_type: formData.account_type,
          account_category: formData.account_category,
          parent_account_id: formData.parent_account_id || undefined,
          description: formData.description,
          is_active: formData.is_active,
          is_system_account: false,
        };
        const updated = [...localAccounts, newAccount];
        setLocalAccounts(updated);
        localStorage.setItem(`trading_erp_accounts_${organizationId || 'default'}`, JSON.stringify(updated));
      }

      toast({
        title: 'Account created successfully',
        status: 'success',
        duration: 3000,
      });

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error creating account',
        description: 'Please check all required fields',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;

    try {
      if (isConvex) {
        await updateAccount({
          account_id: editingAccount as Id<"chart_of_accounts">,
          account_code: formData.account_code,
          account_name: formData.account_name,
          account_type: formData.account_type as any,
          account_category: formData.account_category as any,
          parent_account_id: formData.parent_account_id ? formData.parent_account_id as Id<"chart_of_accounts"> : undefined,
          description: formData.description,
          is_active: formData.is_active,
          updated_by: userId,
        });
      } else {
        const updated = localAccounts.map(acc => {
          if (acc._id === editingAccount) {
            return {
              ...acc,
              account_code: formData.account_code,
              account_name: formData.account_name,
              account_type: formData.account_type,
              account_category: formData.account_category,
              parent_account_id: formData.parent_account_id || undefined,
              description: formData.description,
              is_active: formData.is_active,
            };
          }
          return acc;
        });
        setLocalAccounts(updated);
        localStorage.setItem(`trading_erp_accounts_${organizationId || 'default'}`, JSON.stringify(updated));
      }

      toast({
        title: 'Account updated successfully',
        status: 'success',
        duration: 3000,
      });

      resetForm();
      setEditingAccount(null);
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating account',
        description: 'Please check all required fields',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteAccount = async (accountId: any) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        if (isConvex) {
          await deleteAccount({
            account_id: accountId,
          });
        } else {
          const updated = localAccounts.filter(acc => acc._id !== accountId);
          setLocalAccounts(updated);
          localStorage.setItem(`trading_erp_accounts_${organizationId || 'default'}`, JSON.stringify(updated));
        }

        toast({
          title: 'Account deleted successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: 'Error deleting account',
          description: 'Account may have dependent transactions',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const handleEditAccount = (account: any) => {
    setEditingAccount(account._id);
    setFormData({
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      account_category: account.account_category,
      parent_account_id: account.parent_account_id || '',
      description: account.description || '',
      is_active: account.is_active,
    });
    onOpen();
  };

  const resetForm = () => {
    setFormData({
      account_code: '',
      account_name: '',
      account_type: '',
      account_category: '',
      parent_account_id: '',
      description: '',
      is_active: true,
    });
    setEditingAccount(null);
  };

  const toggleAccountExpansion = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const getAccountTypeColor = (type: string) => {
    const typeConfig = accountTypes.find(t => t.value === type);
    return typeConfig?.color || 'gray';
  };

  const getAccountTypeLabel = (type: string) => {
    const typeConfig = accountTypes.find(t => t.value === type);
    return typeConfig?.label || type;
  };

  if (!effectiveAccounts || effectiveAccounts.length === 0) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading chart of accounts...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="2xl" fontWeight="bold">
            Chart of Accounts
          </Text>
          <Text color="gray.600" fontSize="sm">
            Manage your organization's chart of accounts
          </Text>
        </VStack>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          onClick={() => {
            resetForm();
            onOpen();
          }}
        >
          Add Account
        </Button>
      </HStack>

      {/* Filters */}
      <Card bg={cardBg} borderColor={borderColor} mb={6}>
        <CardBody>
          <HStack spacing={4}>
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Select
              maxW="200px"
              value={selectedAccountType}
              onChange={(e) => setSelectedAccountType(e.target.value)}
            >
              <option value="all">All Types</option>
              {accountTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Accounts Table */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="semibold">
              Accounts ({filteredAccounts.length})
            </Text>
            <Badge colorScheme="blue">
              {effectiveAccounts.filter((a: any) => a.is_active).length} Active
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Account Name</Th>
                <Th>Type</Th>
                <Th>Category</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredAccounts.map((account) => (
                <Tr key={account._id}>
                  <Td fontWeight="medium">{account.account_code}</Td>
                  <Td>
                    <HStack spacing={2}>
                      {account.parent_account_id && (
                        <IconButton
                          size="xs"
                          variant="ghost"
                          icon={expandedAccounts.has(account._id) ? <FiFolder /> : <FiFolder />}
                          onClick={() => toggleAccountExpansion(account._id)}
                        />
                      )}
                      <Text>{account.account_name}</Text>
                    </HStack>
                  </Td>
                  <Td>
                    <Badge colorScheme={getAccountTypeColor(account.account_type)}>
                      {getAccountTypeLabel(account.account_type)}
                    </Badge>
                  </Td>
                  <Td>{account.account_category}</Td>
                  <Td>
                    <Badge colorScheme={account.is_active ? 'green' : 'red'}>
                      {account.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FiEdit2 />}
                        onClick={() => handleEditAccount(account)}
                        aria-label="Edit account"
                      />
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FiTrash2 />}
                        onClick={() => handleDeleteAccount(account._id)}
                        aria-label="Delete account"
                        colorScheme="red"
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {filteredAccounts.length === 0 && (
            <Center h="200px">
              <VStack spacing={4}>
                <FiFolder size={48} color="gray" />
                <Text color="gray.600">No accounts found</Text>
                <Text color="gray.500" fontSize="sm">
                  Try adjusting your search criteria or add a new account
                </Text>
              </VStack>
            </Center>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Account Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingAccount ? 'Edit Account' : 'Create New Account'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Account Code</FormLabel>
                <Input
                  value={formData.account_code}
                  onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                  placeholder="e.g., 1000, 2000"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Account Name</FormLabel>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="e.g., Cash in Hand, Accounts Receivable"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Account Type</FormLabel>
                <Select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value, account_category: '' })}
                >
                  <option value="">Select account type</option>
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {formData.account_type && (
                <FormControl isRequired>
                  <FormLabel>Account Category</FormLabel>
                  <Select
                    value={formData.account_category}
                    onChange={(e) => setFormData({ ...formData, account_category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {accountCategories[formData.account_type as keyof typeof accountCategories]?.map((category) => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Parent Account (Optional)</FormLabel>
                <Select
                  value={formData.parent_account_id}
                  onChange={(e) => setFormData({ ...formData, parent_account_id: e.target.value })}
                >
                  <option value="">No parent account</option>
                  {effectiveAccounts
                    .filter((acc: any) => acc.account_type === formData.account_type && acc._id !== editingAccount)
                    .map((account: any) => (
                      <option key={account._id} value={account._id}>
                        {account.account_code} - {account.account_name}
                      </option>
                    ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this account"
                />
              </FormControl>

              <HStack spacing={4} w="full">
                <Button
                  colorScheme="blue"
                  onClick={editingAccount ? handleUpdateAccount : handleCreateAccount}
                  flex={1}
                >
                  {editingAccount ? 'Update Account' : 'Create Account'}
                </Button>
                <Button variant="outline" onClick={onClose} flex={1}>
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ChartOfAccounts;
