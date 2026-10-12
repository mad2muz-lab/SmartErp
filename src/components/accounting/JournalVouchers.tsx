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
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Flex,
  Grid,
  SimpleGrid,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { formatCurrency as formatCurrencyText } from '../../utils/currencyUtils';
import { useAuth } from '../../contexts/shared/AuthContext';
import '../../utils/procurementCurrency.css';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiSearch,
  FiEye,
  FiCheck,
  FiX,
  FiFileText,
  FiZap,
  FiSliders,
  FiArrowRight,
  FiRepeat,
  FiLayers
} from 'react-icons/fi';

import { isConvexOrgId, DEFAULT_CHART_OF_ACCOUNTS, DEFAULT_JOURNAL_VOUCHERS } from '../../utils/accountingUtils';

interface JournalVouchersProps {
  organizationId: any;
  userId: any;
  triggerAction?: { action?: string; timestamp: number } | null;
}

interface JournalEntry {
  account_id: string;
  account_name?: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
}

interface JournalVoucherItem {
  _id: any;
  voucher_number: string;
  voucher_date: string;
  reference_number?: string;
  description: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  total_amount?: number;
  total_debit?: number;
  total_credit?: number;
  entries: JournalEntry[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string;
}

interface VoucherFormData {
  voucher_number: string;
  voucher_date: string;
  reference_number: string;
  description: string;
  entries: JournalEntry[];
}

const JournalVouchers: React.FC<JournalVouchersProps> = ({ 
  organizationId, 
  userId,
  triggerAction
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingVoucher, setEditingVoucher] = useState<any | null>(null);
  const { selectedOrganization } = useAuth();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const isConvex = isConvexOrgId(organizationId);

  // Form state
  const [formData, setFormData] = useState<VoucherFormData>({
    voucher_number: '',
    voucher_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    description: '',
    entries: [
      { account_id: 'acc_1120', debit_amount: 1000, credit_amount: 0, description: 'Debit Entry' },
      { account_id: 'acc_3000', debit_amount: 0, credit_amount: 1000, description: 'Credit Entry' }
    ],
  });

  const storageKey = `trading_erp_vouchers_${organizationId || 'default'}`;

  // Local fallback vouchers state
  const [localVouchers, setLocalVouchers] = useState<JournalVoucherItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_JOURNAL_VOUCHERS));
      return DEFAULT_JOURNAL_VOUCHERS as JournalVoucherItem[];
    } catch {
      return DEFAULT_JOURNAL_VOUCHERS as JournalVoucherItem[];
    }
  });

  // Fetch data safely
  const vouchers = useQuery(
    api.accounting.journalVouchers.listJournalVouchers,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  const accounts = useQuery(
    api.accounting.chartOfAccounts.listAccounts,
    isConvex ? { organization_id: organizationId } : "skip"
  );

  const effectiveAccounts = (accounts && accounts.length > 0) ? accounts : DEFAULT_CHART_OF_ACCOUNTS;
  const effectiveVouchers: JournalVoucherItem[] = (vouchers && vouchers.length > 0) ? vouchers : localVouchers;

  // Dual-Mode Experience: Smart Guided Mode vs. Advanced Double-Entry Mode
  const [entryMode, setEntryMode] = useState<'smart' | 'advanced'>('smart');

  // Smart Plain-English Mode State
  const [smartAction, setSmartAction] = useState<string>('transfer');
  const [smartAmount, setSmartAmount] = useState<number>(1000);
  const [smartSourceId, setSmartSourceId] = useState<string>('acc_1120'); // Bank Operational Account
  const [smartTargetId, setSmartTargetId] = useState<string>('acc_1110'); // Cash in Hand / Till
  const [smartAssetId, setSmartAssetId] = useState<string>('acc_1500'); // Store Equipment / Fixed Asset
  const [smartCustomNotes, setSmartCustomNotes] = useState<string>('');

  // Synchronize Smart Form fields into canonical balanced entries & description
  const syncSmartEntries = (
    action: string,
    amount: number,
    sourceId: string,
    targetId: string,
    assetId: string,
    notes: string
  ) => {
    let newEntries: JournalEntry[] = [];
    let autoDesc = '';

    const sourceAcc = effectiveAccounts.find(a => a._id === sourceId);
    const targetAcc = effectiveAccounts.find(a => a._id === targetId);
    const assetAcc = effectiveAccounts.find(a => a._id === assetId);

    switch (action) {
      case 'transfer':
        newEntries = [
          {
            account_id: targetId,
            account_name: targetAcc?.account_name || 'Destination Account',
            debit_amount: amount,
            credit_amount: 0,
            description: `Transfer in to ${targetAcc?.account_name?.split('(')[0].trim() || 'destination'}`
          },
          {
            account_id: sourceId,
            account_name: sourceAcc?.account_name || 'Source Account',
            debit_amount: 0,
            credit_amount: amount,
            description: `Transfer out from ${sourceAcc?.account_name?.split('(')[0].trim() || 'source'}`
          }
        ];
        autoDesc = notes || `Fund transfer from ${sourceAcc?.account_name?.split('(')[0].trim() || 'source'} to ${targetAcc?.account_name?.split('(')[0].trim() || 'destination'}`;
        break;

      case 'depreciation':
        newEntries = [
          {
            account_id: 'acc_5250',
            account_name: 'Depreciation & Amortization Expense',
            debit_amount: amount,
            credit_amount: 0,
            description: `Depreciation expense on ${assetAcc?.account_name?.split('(')[0].trim() || 'asset'}`
          },
          {
            account_id: 'acc_1520',
            account_name: 'Accumulated Depreciation',
            debit_amount: 0,
            credit_amount: amount,
            description: `Accumulated depreciation reserve for ${assetAcc?.account_name?.split('(')[0].trim() || 'asset'}`
          }
        ];
        autoDesc = notes || `Periodic asset depreciation for ${assetAcc?.account_name?.split('(')[0].trim() || 'fixed assets'}`;
        break;

      case 'owner_invest':
        newEntries = [
          {
            account_id: targetId,
            account_name: targetAcc?.account_name || 'Bank/Cash',
            debit_amount: amount,
            credit_amount: 0,
            description: 'Capital injected into company account'
          },
          {
            account_id: 'acc_3000',
            account_name: "Owner's Equity & Capital",
            debit_amount: 0,
            credit_amount: amount,
            description: 'Owner / partner capital contribution'
          }
        ];
        autoDesc = notes || `Owner capital contribution deposited into ${targetAcc?.account_name?.split('(')[0].trim() || 'account'}`;
        break;

      case 'owner_draw':
        newEntries = [
          {
            account_id: 'acc_3100',
            account_name: 'Owner Drawings & Distributions',
            debit_amount: amount,
            credit_amount: 0,
            description: 'Owner personal withdrawal / drawing'
          },
          {
            account_id: sourceId,
            account_name: sourceAcc?.account_name || 'Bank/Cash',
            debit_amount: 0,
            credit_amount: amount,
            description: 'Disbursement from company account'
          }
        ];
        autoDesc = notes || `Owner personal drawing from ${sourceAcc?.account_name?.split('(')[0].trim() || 'account'}`;
        break;

      case 'adjustment':
      default:
        newEntries = [
          {
            account_id: targetId,
            account_name: targetAcc?.account_name || 'Target Account',
            debit_amount: amount,
            credit_amount: 0,
            description: `Adjustment debit to ${targetAcc?.account_name?.split('(')[0].trim() || 'target'}`
          },
          {
            account_id: sourceId,
            account_name: sourceAcc?.account_name || 'Source Account',
            debit_amount: 0,
            credit_amount: amount,
            description: `Adjustment credit from ${sourceAcc?.account_name?.split('(')[0].trim() || 'source'}`
          }
        ];
        autoDesc = notes || `General ledger adjustment between ${targetAcc?.account_name?.split('(')[0].trim() || 'target'} and ${sourceAcc?.account_name?.split('(')[0].trim() || 'source'}`;
        break;
    }

    setFormData(prev => ({
      ...prev,
      description: autoDesc,
      entries: newEntries
    }));
  };

  // Mutations
  const createVoucher = useMutation(api.accounting.journalVouchers.createJournalVoucher);
  const updateVoucher = useMutation(api.accounting.journalVouchers.updateJournalVoucher);
  const deleteVoucher = useMutation(api.accounting.journalVouchers.deleteJournalVoucher);
  const postVoucher = useMutation(api.accounting.journalVouchers.postJournalVoucher);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const switchBg = useColorModeValue('blue.50', 'gray.700');
  const summaryBoxBg = useColorModeValue('green.50', 'gray.700');
  const summaryBorderColor = useColorModeValue('green.200', 'green.700');
  const summaryTextColor = useColorModeValue('green.800', 'green.200');
  const summaryDividerColor = useColorModeValue('green.300', 'green.600');

  const statusColors = {
    DRAFT: 'gray',
    POSTED: 'green',
    CANCELLED: 'red',
  };

  const filteredVouchers = effectiveVouchers.filter(voucher => {
    const matchesSearch = voucher.voucher_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || voucher.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const addEntry = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { account_id: '', debit_amount: 0, credit_amount: 0, description: '' }],
    });
  };

  const removeEntry = (index: number) => {
    if (formData.entries.length > 1) {
      const newEntries = formData.entries.filter((_, i) => i !== index);
      setFormData({ ...formData, entries: newEntries });
    }
  };

  const updateEntry = (index: number, field: keyof JournalEntry, value: any) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setFormData({ ...formData, entries: newEntries });
  };

  const calculateTotals = () => {
    const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debit_amount || 0), 0);
    const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.credit_amount || 0), 0);
    return { totalDebit, totalCredit };
  };

  const isBalanced = () => {
    const { totalDebit, totalCredit } = calculateTotals();
    return Math.abs(totalDebit - totalCredit) < 0.01;
  };

  const handleCreateVoucher = async () => {
    if (!isBalanced()) {
      toast({
        title: 'Journal entry not balanced',
        description: 'Total debits must equal total credits',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      if (isConvex) {
        await createVoucher({
          organization_id: organizationId,
          voucher_number: formData.voucher_number,
          voucher_date: formData.voucher_date,
          reference_number: formData.reference_number,
          description: formData.description,
          entries: formData.entries,
          created_by: userId,
        });
      } else {
        const nextNum = localVouchers.length + 1;
        const autoNumber = formData.voucher_number || `JV-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;
        const total = formData.entries.reduce((sum, e) => sum + (e.debit_amount || 0), 0);
        
        // Enrich entry account names if available
        const enrichedEntries = formData.entries.map(entry => {
          const matchedAcc = effectiveAccounts.find(a => a._id === entry.account_id);
          return {
            ...entry,
            account_name: matchedAcc ? matchedAcc.account_name : entry.description || 'Account'
          };
        });

        const newVoucher: JournalVoucherItem = {
          _id: `jv_${Date.now()}`,
          voucher_number: autoNumber,
          voucher_date: formData.voucher_date,
          reference_number: formData.reference_number || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
          description: formData.description,
          status: 'POSTED',
          total_amount: total,
          entries: enrichedEntries,
          created_by: userId || 'Local User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          organization_id: organizationId || 'default'
        };

        const updated = [newVoucher, ...localVouchers];
        setLocalVouchers(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      toast({
        title: 'Journal voucher created successfully',
        status: 'success',
        duration: 3000,
      });

      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: 'Error creating journal voucher',
        description: 'Please check all required fields',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleUpdateVoucher = async () => {
    if (!editingVoucher) return;

    if (!isBalanced()) {
      toast({
        title: 'Journal entry not balanced',
        description: 'Total debits must equal total credits',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    try {
      if (isConvex) {
        await updateVoucher({
          voucher_id: editingVoucher,
          voucher_number: formData.voucher_number,
          voucher_date: formData.voucher_date,
          reference_number: formData.reference_number,
          description: formData.description,
          entries: formData.entries,
          updated_by: userId,
        });
      } else {
        const total = formData.entries.reduce((sum, e) => sum + (e.debit_amount || 0), 0);
        const enrichedEntries = formData.entries.map(entry => {
          const matchedAcc = effectiveAccounts.find(a => a._id === entry.account_id);
          return {
            ...entry,
            account_name: matchedAcc ? matchedAcc.account_name : entry.description || 'Account'
          };
        });

        const updated = localVouchers.map(v => {
          if (v._id === editingVoucher) {
            return {
              ...v,
              voucher_number: formData.voucher_number || v.voucher_number,
              voucher_date: formData.voucher_date,
              reference_number: formData.reference_number,
              description: formData.description,
              entries: enrichedEntries,
              total_amount: total,
              updated_at: new Date().toISOString()
            };
          }
          return v;
        });

        setLocalVouchers(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
      }

      toast({
        title: 'Journal voucher updated successfully',
        status: 'success',
        duration: 3000,
      });

      resetForm();
      setEditingVoucher(null);
      onClose();
    } catch (error) {
      toast({
        title: 'Error updating journal voucher',
        description: 'Please check all required fields',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleDeleteVoucher = async (voucherId: any) => {
    if (window.confirm('Are you sure you want to delete this journal voucher?')) {
      try {
        if (isConvex) {
          await deleteVoucher({
            voucher_id: voucherId,
          });
        } else {
          const updated = localVouchers.filter(v => v._id !== voucherId);
          setLocalVouchers(updated);
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }

        toast({
          title: 'Journal voucher deleted successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: 'Error deleting journal voucher',
          description: 'Voucher may have been posted',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const handlePostVoucher = async (voucherId: any) => {
    if (window.confirm('Are you sure you want to post this journal voucher? This action cannot be undone.')) {
      try {
        if (isConvex) {
          await postVoucher({
            voucher_id: voucherId,
            posted_by: userId,
          });
        } else {
          const updated = localVouchers.map(v => {
            if (v._id === voucherId) {
              return { ...v, status: 'POSTED' as const, updated_at: new Date().toISOString() };
            }
            return v;
          });
          setLocalVouchers(updated);
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }

        toast({
          title: 'Journal voucher posted successfully',
          status: 'success',
          duration: 3000,
        });
      } catch (error) {
        toast({
          title: 'Error posting journal voucher',
          description: 'Please check the voucher details',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const handleEditVoucher = (voucher: any) => {
    setEditingVoucher(voucher._id);
    setEntryMode('advanced');
    setFormData({
      voucher_number: voucher.voucher_number,
      voucher_date: voucher.voucher_date,
      reference_number: voucher.reference_number || '',
      description: voucher.description,
      entries: voucher.entries || [{ account_id: '', debit_amount: 0, credit_amount: 0, description: '' }],
    });
    onOpen();
  };

  const resetForm = () => {
    setEditingVoucher(null);
    setEntryMode('smart');
    setSmartAction('transfer');
    setSmartAmount(1000);
    setSmartSourceId('acc_1120');
    setSmartTargetId('acc_1110');
    setSmartAssetId('acc_1500');
    setSmartCustomNotes('');

    const initialSource = effectiveAccounts.find(a => a._id === 'acc_1120');
    const initialTarget = effectiveAccounts.find(a => a._id === 'acc_1110');

    setFormData({
      voucher_number: '',
      voucher_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      description: 'Fund transfer from Bank Operational Account to Cash in Hand',
      entries: [
        {
          account_id: 'acc_1110',
          account_name: initialTarget?.account_name || 'Cash in Hand / Till',
          debit_amount: 1000,
          credit_amount: 0,
          description: 'Transfer in to Cash in Hand'
        },
        {
          account_id: 'acc_1120',
          account_name: initialSource?.account_name || 'Bank Operational Account',
          debit_amount: 0,
          credit_amount: 1000,
          description: 'Transfer out from Bank Operational Account'
        }
      ],
    });
  };

  React.useEffect(() => {
    if (triggerAction?.action === 'new') {
      resetForm();
      onOpen();
    }
  }, [triggerAction?.timestamp]);

  const formatCurrency = (amount: number) => {
    return (
      <span className="procurement-currency-sar">
        {formatCurrencyText(amount, 'SAR')}
      </span>
    );
  };

  if (isConvex && !vouchers) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading journal vouchers...</Text>
        </VStack>
      </Center>
    );
  }

  const { totalDebit, totalCredit } = calculateTotals();

  return (
    <Box p={6}>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Text fontSize="2xl" fontWeight="bold">
            Journal Vouchers
          </Text>
          <Text color="gray.600" fontSize="sm">
            Create and manage manual journal entries
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
          New Journal Entry
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
                placeholder="Search vouchers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
            <Select
              maxW="200px"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Vouchers Table */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="semibold">
              Journal Vouchers ({filteredVouchers.length})
            </Text>
            <Badge colorScheme="blue">
              {effectiveVouchers.filter(v => v.status === 'POSTED').length} Posted
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>Voucher #</Th>
                <Th>Date</Th>
                <Th>Description</Th>
                <Th>Total Debit</Th>
                <Th>Total Credit</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredVouchers.map((voucher) => (
                <Tr key={voucher._id}>
                  <Td fontWeight="medium">{voucher.voucher_number}</Td>
                  <Td>{new Date(voucher.voucher_date).toLocaleDateString()}</Td>
                  <Td>{voucher.description}</Td>
                  <Td color="red.500">
                    {formatCurrency(voucher.total_debit ?? (voucher.entries?.reduce((s, e) => s + (e.debit_amount || 0), 0) || voucher.total_amount || 0))}
                  </Td>
                  <Td color="green.500">
                    {formatCurrency(voucher.total_credit ?? (voucher.entries?.reduce((s, e) => s + (e.credit_amount || 0), 0) || voucher.total_amount || 0))}
                  </Td>
                  <Td>
                    <Badge colorScheme={statusColors[voucher.status as keyof typeof statusColors]}>
                      {voucher.status}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={<FiEye />}
                        aria-label="View voucher"
                      />
                      {voucher.status === 'DRAFT' && (
                        <>
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={<FiEdit2 />}
                            onClick={() => handleEditVoucher(voucher)}
                            aria-label="Edit voucher"
                          />
                          <IconButton
                            size="sm"
                            variant="ghost"
                            icon={<FiCheck />}
                            onClick={() => handlePostVoucher(voucher._id)}
                            aria-label="Post voucher"
                            colorScheme="green"
                          />
                        </>
                      )}
                      {voucher.status === 'DRAFT' && (
                        <IconButton
                          size="sm"
                          variant="ghost"
                          icon={<FiTrash2 />}
                          onClick={() => handleDeleteVoucher(voucher._id)}
                          aria-label="Delete voucher"
                          colorScheme="red"
                        />
                      )}
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {filteredVouchers.length === 0 && (
            <Center h="200px">
              <VStack spacing={4}>
                <FiFileText size={48} color="gray" />
                <Text color="gray.600">No journal vouchers found</Text>
                <Text color="gray.500" fontSize="sm">
                  Try adjusting your search criteria or create a new journal entry
                </Text>
              </VStack>
            </Center>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Voucher Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>
            {editingVoucher ? 'Edit Journal Voucher' : 'Create New Journal Voucher'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={5} align="stretch">
              {/* Mode Toggle Switcher */}
              <HStack 
                spacing={3} 
                p={2} 
                bg={switchBg} 
                borderRadius="xl" 
                justify="center"
              >
                <Button
                  size="sm"
                  leftIcon={<FiZap />}
                  colorScheme={entryMode === 'smart' ? 'blue' : 'gray'}
                  variant={entryMode === 'smart' ? 'solid' : 'ghost'}
                  onClick={() => {
                    setEntryMode('smart');
                    syncSmartEntries(smartAction, smartAmount, smartSourceId, smartTargetId, smartAssetId, smartCustomNotes);
                  }}
                  borderRadius="lg"
                >
                  Smart Plain-English Mode
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FiSliders />}
                  colorScheme={entryMode === 'advanced' ? 'blue' : 'gray'}
                  variant={entryMode === 'advanced' ? 'solid' : 'ghost'}
                  onClick={() => setEntryMode('advanced')}
                  borderRadius="lg"
                >
                  Advanced Double-Entry (Debit / Credit)
                </Button>
              </HStack>

              {/* Common Header Fields */}
              <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Voucher Number</FormLabel>
                  <Input
                    size="sm"
                    value={formData.voucher_number}
                    onChange={(e) => setFormData({ ...formData, voucher_number: e.target.value })}
                    placeholder="Auto-generated if empty"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Voucher Date</FormLabel>
                  <Input
                    size="sm"
                    type="date"
                    value={formData.voucher_date}
                    onChange={(e) => setFormData({ ...formData, voucher_date: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Reference Number</FormLabel>
                  <Input
                    size="sm"
                    value={formData.reference_number}
                    onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                    placeholder="Optional reference / check #"
                  />
                </FormControl>
              </Grid>

              {/* SMART PLAIN-ENGLISH MODE */}
              {entryMode === 'smart' && (
                <VStack spacing={5} align="stretch" p={5} border="1px" borderColor={borderColor} borderRadius="xl" bg={cardBg}>
                  <FormControl isRequired>
                    <FormLabel fontWeight="bold" color="blue.600">
                      What would you like to record?
                    </FormLabel>
                    <Select
                      value={smartAction}
                      onChange={(e) => {
                        const newAct = e.target.value;
                        setSmartAction(newAct);
                        syncSmartEntries(newAct, smartAmount, smartSourceId, smartTargetId, smartAssetId, smartCustomNotes);
                      }}
                      fontWeight="medium"
                    >
                      <option value="transfer">🔄 Transfer Funds Between Accounts (Bank to Cash / Bank to Bank)</option>
                      <option value="depreciation">📉 Record Asset Depreciation (Wear & Tear on Equipment / Vehicles)</option>
                      <option value="owner_invest">💰 Owner Capital Investment (Deposit personal funds into company)</option>
                      <option value="owner_draw">💸 Owner Personal Withdrawal (Withdraw personal drawing / profit)</option>
                      <option value="adjustment">⚖️ General Account Adjustment (Allocate expense / adjust accounts)</option>
                    </Select>
                  </FormControl>

                  {/* Form fields based on selected action */}
                  {smartAction === 'transfer' && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Transfer From (Source Account)</FormLabel>
                        <Select
                          size="sm"
                          value={smartSourceId}
                          onChange={(e) => {
                            setSmartSourceId(e.target.value);
                            syncSmartEntries(smartAction, smartAmount, e.target.value, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          {effectiveAccounts.filter(a => a.account_category === 'CURRENT_ASSET' || a.account_type === 'ASSET').map(a => (
                            <option key={a._id} value={a._id}>{a.account_code} - {a.account_name}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Transfer To (Destination Account)</FormLabel>
                        <Select
                          size="sm"
                          value={smartTargetId}
                          onChange={(e) => {
                            setSmartTargetId(e.target.value);
                            syncSmartEntries(smartAction, smartAmount, smartSourceId, e.target.value, smartAssetId, smartCustomNotes);
                          }}
                        >
                          {effectiveAccounts.filter(a => a.account_category === 'CURRENT_ASSET' || a.account_type === 'ASSET').map(a => (
                            <option key={a._id} value={a._id}>{a.account_code} - {a.account_name}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Transfer Amount (<span className="icon-saudi_riyal" />)</FormLabel>
                        <NumberInput
                          size="sm"
                          value={smartAmount}
                          min={1}
                          precision={2}
                          onChange={(_, val) => {
                            const num = val || 0;
                            setSmartAmount(num);
                            syncSmartEntries(smartAction, num, smartSourceId, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </Grid>
                  )}

                  {smartAction === 'depreciation' && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Fixed Asset Being Depreciated</FormLabel>
                        <Select
                          size="sm"
                          value={smartAssetId}
                          onChange={(e) => {
                            setSmartAssetId(e.target.value);
                            syncSmartEntries(smartAction, smartAmount, smartSourceId, smartTargetId, e.target.value, smartCustomNotes);
                          }}
                        >
                          {effectiveAccounts.filter(a => a.account_category === 'FIXED_ASSET' || a.account_type === 'ASSET').map(a => (
                            <option key={a._id} value={a._id}>{a.account_code} - {a.account_name}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Depreciation Amount (<span className="icon-saudi_riyal" />)</FormLabel>
                        <NumberInput
                          size="sm"
                          value={smartAmount}
                          min={1}
                          precision={2}
                          onChange={(_, val) => {
                            const num = val || 0;
                            setSmartAmount(num);
                            syncSmartEntries(smartAction, num, smartSourceId, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </Grid>
                  )}

                  {smartAction === 'owner_invest' && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Deposit Into Company Account</FormLabel>
                        <Select
                          size="sm"
                          value={smartTargetId}
                          onChange={(e) => {
                            setSmartTargetId(e.target.value);
                            syncSmartEntries(smartAction, smartAmount, smartSourceId, e.target.value, smartAssetId, smartCustomNotes);
                          }}
                        >
                          {effectiveAccounts.filter(a => a.account_category === 'CURRENT_ASSET' || a.account_type === 'ASSET').map(a => (
                            <option key={a._id} value={a._id}>{a.account_code} - {a.account_name}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Invested Amount (<span className="icon-saudi_riyal" />)</FormLabel>
                        <NumberInput
                          size="sm"
                          value={smartAmount}
                          min={1}
                          precision={2}
                          onChange={(_, val) => {
                            const num = val || 0;
                            setSmartAmount(num);
                            syncSmartEntries(smartAction, num, smartSourceId, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </Grid>
                  )}

                  {smartAction === 'owner_draw' && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Withdraw From Company Account</FormLabel>
                        <Select
                          size="sm"
                          value={smartSourceId}
                          onChange={(e) => {
                            setSmartSourceId(e.target.value);
                            syncSmartEntries(smartAction, smartAmount, e.target.value, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          {effectiveAccounts.filter(a => a.account_category === 'CURRENT_ASSET' || a.account_type === 'ASSET').map(a => (
                            <option key={a._id} value={a._id}>{a.account_code} - {a.account_name}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Withdrawn Amount (<span className="icon-saudi_riyal" />)</FormLabel>
                        <NumberInput
                          size="sm"
                          value={smartAmount}
                          min={1}
                          precision={2}
                          onChange={(_, val) => {
                            const num = val || 0;
                            setSmartAmount(num);
                            syncSmartEntries(smartAction, num, smartSourceId, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </Grid>
                  )}

                  {smartAction === 'adjustment' && (
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Target / Adjusted Account</FormLabel>
                        <Select
                          size="sm"
                          value={smartTargetId}
                          onChange={(e) => {
                            setSmartTargetId(e.target.value);
                            syncSmartEntries(smartAction, smartAmount, smartSourceId, e.target.value, smartAssetId, smartCustomNotes);
                          }}
                        >
                          {effectiveAccounts.map(a => (
                            <option key={a._id} value={a._id}>{a.account_code} - {a.account_name}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Offset / Source Account</FormLabel>
                        <Select
                          size="sm"
                          value={smartSourceId}
                          onChange={(e) => {
                            setSmartSourceId(e.target.value);
                            syncSmartEntries(smartAction, smartAmount, e.target.value, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          {effectiveAccounts.map(a => (
                            <option key={a._id} value={a._id}>{a.account_code} - {a.account_name}</option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Adjustment Amount (<span className="icon-saudi_riyal" />)</FormLabel>
                        <NumberInput
                          size="sm"
                          value={smartAmount}
                          min={1}
                          precision={2}
                          onChange={(_, val) => {
                            const num = val || 0;
                            setSmartAmount(num);
                            syncSmartEntries(smartAction, num, smartSourceId, smartTargetId, smartAssetId, smartCustomNotes);
                          }}
                        >
                          <NumberInputField />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </Grid>
                  )}

                  <FormControl>
                    <FormLabel fontSize="sm">Notes / Memo (Optional)</FormLabel>
                    <Input
                      size="sm"
                      placeholder="Add an optional memo or note"
                      value={smartCustomNotes}
                      onChange={(e) => {
                        setSmartCustomNotes(e.target.value);
                        syncSmartEntries(smartAction, smartAmount, smartSourceId, smartTargetId, smartAssetId, e.target.value);
                      }}
                    />
                  </FormControl>

                  {/* Plain-English Live Summary Card */}
                  <Box p={4} bg={summaryBoxBg} borderRadius="lg" border="1px" borderColor={summaryBorderColor}>
                    <HStack spacing={2} mb={1}>
                      <Badge colorScheme="green" fontSize="xs">Plain-English Summary</Badge>
                      <Badge colorScheme="blue" fontSize="xs">Automatically Balanced</Badge>
                    </HStack>
                    <Text fontSize="sm" fontWeight="semibold" color={summaryTextColor}>
                      {formData.description || 'Valid journal entry configured'}
                    </Text>
                    <Divider my={2} borderColor={summaryDividerColor} />
                    <HStack justify="space-between" fontSize="xs" color="gray.600">
                      <Text>
                        <strong>Total Amount:</strong> {formatCurrency(smartAmount)}
                      </Text>
                      <Text color="green.600" fontWeight="bold">
                        Double-Entry Status: Balanced (Debit = Credit = {formatCurrency(smartAmount)})
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              )}

              {/* ADVANCED CLASSIC DOUBLE-ENTRY MODE */}
              {entryMode === 'advanced' && (
                <VStack spacing={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Description</FormLabel>
                    <Textarea
                      size="sm"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the journal entry"
                    />
                  </FormControl>

                  {/* Journal Entries */}
                  <Box w="full">
                    <HStack justify="space-between" mb={3}>
                      <Text fontSize="md" fontWeight="semibold">
                        Journal Ledger Rows
                      </Text>
                      <Button
                        leftIcon={<FiPlus />}
                        size="xs"
                        colorScheme="blue"
                        variant="outline"
                        onClick={addEntry}
                      >
                        Add Entry
                      </Button>
                    </HStack>

                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Account</Th>
                          <Th>Description</Th>
                          <Th>Debit Amount</Th>
                          <Th>Credit Amount</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {formData.entries.map((entry, index) => (
                          <Tr key={index}>
                            <Td>
                              <Select
                                size="sm"
                                value={entry.account_id}
                                onChange={(e) => updateEntry(index, 'account_id', e.target.value)}
                                placeholder="Select account"
                              >
                                {effectiveAccounts.map((account) => (
                                  <option key={account._id} value={account._id}>
                                    {account.account_code} - {account.account_name}
                                  </option>
                                ))}
                              </Select>
                            </Td>
                            <Td>
                              <Input
                                size="sm"
                                value={entry.description}
                                onChange={(e) => updateEntry(index, 'description', e.target.value)}
                                placeholder="Entry description"
                              />
                            </Td>
                            <Td>
                              <NumberInput
                                size="sm"
                                value={entry.debit_amount}
                                onChange={(_, value) => updateEntry(index, 'debit_amount', value || 0)}
                                min={0}
                                precision={2}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </Td>
                            <Td>
                              <NumberInput
                                size="sm"
                                value={entry.credit_amount}
                                onChange={(_, value) => updateEntry(index, 'credit_amount', value || 0)}
                                min={0}
                                precision={2}
                              >
                                <NumberInputField />
                                <NumberInputStepper>
                                  <NumberIncrementStepper />
                                  <NumberDecrementStepper />
                                </NumberInputStepper>
                              </NumberInput>
                            </Td>
                            <Td>
                              {formData.entries.length > 1 && (
                                <IconButton
                                  size="xs"
                                  variant="ghost"
                                  icon={<FiTrash2 />}
                                  onClick={() => removeEntry(index)}
                                  aria-label="Remove entry"
                                  colorScheme="red"
                                />
                              )}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>

                    {/* Totals */}
                    <Divider my={3} />
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" fontSize="sm">Totals:</Text>
                      <HStack spacing={6} fontSize="sm">
                        <Text color="red.500" fontWeight="bold">
                          Debit: {formatCurrency(totalDebit)}
                        </Text>
                        <Text color="green.500" fontWeight="bold">
                          Credit: {formatCurrency(totalCredit)}
                        </Text>
                        <Text 
                          color={isBalanced() ? "green.500" : "red.500"} 
                          fontWeight="bold"
                        >
                          Difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                        </Text>
                      </HStack>
                    </Flex>

                    {!isBalanced() && (
                      <Alert status="error" mt={3} borderRadius="md" size="sm">
                        <AlertIcon />
                        <AlertDescription fontSize="xs">
                          Total debits must equal total credits. Current difference: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                        </AlertDescription>
                      </Alert>
                    )}
                  </Box>
                </VStack>
              )}

              <HStack spacing={4} w="full">
                <Button
                  colorScheme="blue"
                  onClick={editingVoucher ? handleUpdateVoucher : handleCreateVoucher}
                  flex={1}
                  isDisabled={!isBalanced()}
                >
                  {editingVoucher ? 'Update Voucher' : (entryMode === 'smart' ? 'Post Journal Entry' : 'Create Voucher')}
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

export default JournalVouchers;
