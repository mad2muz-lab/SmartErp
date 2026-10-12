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
  Spinner,
  Card,
  CardBody,
  useColorModeValue,
  Divider,
  Image,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tooltip,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { 
  FiCheckCircle, 
  FiClock, 
  FiEye, 
  FiDollarSign, 
  FiFileText, 
  FiShield, 
  FiCheck,
  FiInbox,
  FiZap,
} from 'react-icons/fi';

interface AccountingReviewBinProps {
  organizationId: string;
}

export const AccountingReviewBin: React.FC<AccountingReviewBinProps> = ({ organizationId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Modal for viewing receipt image
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Modal for editing/posting voucher
  const { isOpen: isPostOpen, onOpen: onPostOpen, onClose: onPostClose } = useDisclosure();
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  // Form state for posting
  const [selectedAccountCode, setSelectedAccountCode] = useState<string>('5210');
  const [selectedAccountName, setSelectedAccountName] = useState<string>('Travel & Fuel');
  const [selectedCreditCode, setSelectedCreditCode] = useState<string>('1010');
  const [postNotes, setPostNotes] = useState<string>('');
  const [isPosting, setIsPosting] = useState<boolean>(false);

  // Query manager-approved expenses awaiting accounting classification
  const pendingExpenses = useQuery(
    api.whatsappApprovals.listAccountingReviewExpenses,
    organizationId ? { organization_id: organizationId as any } : 'skip'
  );

  // Query Chart of Accounts
  const chartOfAccounts = useQuery(
    api.accounting.chartOfAccounts.getChartOfAccounts,
    organizationId ? { organization_id: organizationId as any } : 'skip'
  );

  // Mutation to post to GL
  const postExpenseToGL = useMutation(api.whatsappApprovals.postExpenseToGeneralLedger);

  const handleOpenReview = (expense: any) => {
    setSelectedExpense(expense);
    // Parse recommended code from category e.g. "[5210] Travel & Fuel (5210)"
    const match = expense.category?.match(/\[(\d{4})\]\s*([^,\n]+)/);
    if (match) {
      setSelectedAccountCode(match[1]);
      setSelectedAccountName(match[2].trim());
    } else {
      setSelectedAccountCode('5210');
      setSelectedAccountName('Travel & Fuel');
    }

    // Default credit account based on payment source
    if (expense.payment_source === 'personal_reimbursement') {
      setSelectedCreditCode('2010'); // Employee Reimbursement Payable
    } else {
      setSelectedCreditCode('1010'); // Petty Cash / Cash on Hand
    }
    setPostNotes('');
    onPostOpen();
  };

  const handlePostVoucher = async () => {
    if (!selectedExpense) return;
    setIsPosting(true);
    try {
      const res = await postExpenseToGL({
        expense_id: selectedExpense._id,
        confirmed_account_code: selectedAccountCode,
        confirmed_account_name: selectedAccountName,
        confirmed_credit_account_code: selectedCreditCode,
        accountant_name: user?.name || 'Senior Accountant',
        notes: postNotes,
      });

      toast({
        title: 'Voucher Posted to General Ledger',
        description: res.message,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      onPostClose();
    } catch (err: any) {
      toast({
        title: 'Posting Failed',
        description: err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsPosting(false);
    }
  };

  if (!pendingExpenses) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="xl" color="blue.500" />
        <Text mt={3} color="gray.500">Loading Accounting Review Bin...</Text>
      </Box>
    );
  }

  const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Available expense accounts from chart of accounts (or fallback list)
  const expenseAccounts = chartOfAccounts
    ? chartOfAccounts.filter((a: any) => a.account_type === 'EXPENSE' || a.account_code.startsWith('5'))
    : [
        { account_code: '5210', account_name: 'Travel & Fuel' },
        { account_code: '5200', account_name: 'Administrative Expenses' },
        { account_code: '5220', account_name: 'Office Supplies' },
        { account_code: '5230', account_name: 'Site Maintenance' },
        { account_code: '5240', account_name: 'Client Hospitality' },
        { account_code: '5260', account_name: 'Government & Attestation Fees' },
      ];

  return (
    <Box>
      {/* Header Stat Strip */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" textTransform="uppercase">Awaiting Audit</StatLabel>
              <StatNumber color="orange.500">{pendingExpenses.length}</StatNumber>
              <StatHelpText>Manager-approved WhatsApp claims</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" textTransform="uppercase">Total SAR to Post</StatLabel>
              <StatNumber color="green.600">SAR {totalPendingAmount.toFixed(2)}</StatNumber>
              <StatHelpText>Awaiting Journal Voucher creation</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <Stat>
              <StatLabel fontSize="xs" color="gray.500" textTransform="uppercase">Separation of Duties</StatLabel>
              <HStack mt={1} spacing={2}>
                <Badge colorScheme="green" px={2} py={1} borderRadius="md">Stage 1: Manager Approved</Badge>
                <Badge colorScheme="purple" px={2} py={1} borderRadius="md">Stage 2: Finance Audit</Badge>
              </HStack>
              <StatHelpText mt={1}>Accountant confirms Chart of Accounts head</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Review Bin Table */}
      {pendingExpenses.length === 0 ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" p={8} textAlign="center">
          <VStack spacing={3}>
            <Box p={4} bg="green.50" color="green.600" borderRadius="full">
              <FiCheckCircle size={32} />
            </Box>
            <Text fontSize="lg" fontWeight="bold">Accounting Review Bin is Clear!</Text>
            <Text color="gray.500" maxW="md">
              All manager-approved WhatsApp expense claims have been classified and posted to the General Ledger.
            </Text>
          </VStack>
        </Card>
      ) : (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" overflow="hidden">
          <Box p={4} borderBottomWidth="1px" borderColor={borderColor} bg={useColorModeValue('gray.50', 'gray.900')}>
            <HStack justify="space-between">
              <HStack spacing={2}>
                <FiInbox size={18} color="#3182ce" />
                <Text fontWeight="bold" fontSize="md">Pending Review Queue</Text>
                <Badge colorScheme="orange">{pendingExpenses.length} Claims</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Review receipt image, verify 15% VAT, and assign the official Chart of Accounts head.
              </Text>
            </HStack>
          </Box>

          <Table variant="simple" size="sm">
            <Thead bg={useColorModeValue('gray.100', 'gray.800')}>
              <Tr>
                <Th>Receipt</Th>
                <Th>Vendor / Description</Th>
                <Th>Claimant</Th>
                <Th>Payment Source</Th>
                <Th>Amount (SAR)</Th>
                <Th>Manager Sign-off</Th>
                <Th>AI Suggested Head</Th>
                <Th textAlign="right">Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {pendingExpenses.map((expense) => {
                const isPersonal = expense.payment_source === 'personal_reimbursement';
                return (
                  <Tr key={expense._id} _hover={{ bg: useColorModeValue('gray.50', 'gray.750') }}>
                    <Td>
                      {expense.receipt_url ? (
                        <Image
                          src={expense.receipt_url}
                          alt="Receipt"
                          boxSize="40px"
                          objectFit="cover"
                          borderRadius="md"
                          cursor="pointer"
                          border="1px solid"
                          borderColor="gray.300"
                          onClick={() => {
                            setSelectedReceiptUrl(expense.receipt_url || null);
                            onImageOpen();
                          }}
                        />
                      ) : (
                        <Badge colorScheme="gray">No Photo</Badge>
                      )}
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="semibold" fontSize="sm">{expense.description}</Text>
                        <Text fontSize="xs" color="gray.500">{expense.expense_date}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{expense.created_by}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={isPersonal ? 'purple' : 'teal'} fontSize="xs">
                        {isPersonal ? '👤 Personal Reimbursement' : '🏢 Company Petty Cash'}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" color="blue.600">SAR {expense.amount.toFixed(2)}</Text>
                        {expense.vat_amount ? (
                          <Text fontSize="10px" color="gray.500">VAT: SAR {expense.vat_amount.toFixed(2)}</Text>
                        ) : null}
                      </VStack>
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <FiCheck size={12} color="#38a169" />
                        <Text fontSize="xs" color="green.600" fontWeight="medium">
                          {expense.manager_approved_by || 'Manager Approved'}
                        </Text>
                      </HStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        {expense.category || '[5210] Travel & Fuel'}
                      </Badge>
                    </Td>
                    <Td textAlign="right">
                      <Button
                        size="xs"
                        colorScheme="green"
                        leftIcon={<FiZap size={12} />}
                        onClick={() => handleOpenReview(expense)}
                      >
                        Audit & Post #JV
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Modal: Receipt Photo Viewer */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Receipt Scanned Document</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} textAlign="center">
            {selectedReceiptUrl && (
              <Image
                src={selectedReceiptUrl}
                alt="Enlarged Receipt"
                maxH="75vh"
                mx="auto"
                borderRadius="md"
                boxShadow="md"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal: Accountant Audit & GL Voucher Posting */}
      <Modal isOpen={isPostOpen} onClose={onPostClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FiShield color="#3182ce" />
              <Text>Accountant Audit & GL Voucher Posting</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedExpense && (
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md" py={2}>
                  <AlertIcon />
                  <Box fontSize="xs">
                    <Text fontWeight="bold">Manager Approval Verified</Text>
                    Approved by {selectedExpense.manager_approved_by || 'Reporting Manager'} on{' '}
                    {selectedExpense.manager_approved_at?.split('T')[0] || selectedExpense.expense_date}.
                  </Box>
                </Alert>

                <HStack justify="space-between" bg={useColorModeValue('gray.50', 'gray.700')} p={3} borderRadius="md">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="gray.500">Transaction</Text>
                    <Text fontWeight="bold">{selectedExpense.description}</Text>
                  </VStack>
                  <VStack align="end" spacing={0}>
                    <Text fontSize="xs" color="gray.500">Claim Amount</Text>
                    <Text fontWeight="extrabold" fontSize="lg" color="green.600">
                      SAR {selectedExpense.amount.toFixed(2)}
                    </Text>
                  </VStack>
                </HStack>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Debit Account (Confirmed Chart of Accounts Head):
                  </FormLabel>
                  <Select
                    value={selectedAccountCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedAccountCode(code);
                      const acc = expenseAccounts.find((a: any) => a.account_code === code);
                      if (acc) setSelectedAccountName(acc.account_name);
                    }}
                    fontWeight="semibold"
                  >
                    {expenseAccounts.map((acc: any) => (
                      <option key={acc.account_code} value={acc.account_code}>
                        [{acc.account_code}] {acc.account_name}
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Confirm or adjust the expense head. Once posted, the Continuous Learning Bot Memory will automatically adopt this classification for future invoices.
                  </Text>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="semibold">
                    Credit Account (Payment Source / Settlement):
                  </FormLabel>
                  <Select
                    value={selectedCreditCode}
                    onChange={(e) => setSelectedCreditCode(e.target.value)}
                  >
                    <option value="1010">[1010] Petty Cash / Cash in Hand</option>
                    <option value="1020">[1020] Corporate Bank Account</option>
                    <option value="2010">[2010] Accrued Expenses / Employee Reimbursement Payable</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm">Accountant Audit Notes / Remarks:</FormLabel>
                  <Textarea
                    placeholder="e.g. ZATCA Tax invoice inspected, 15% input VAT claimed, authorized for payment..."
                    value={postNotes}
                    onChange={(e) => setPostNotes(e.target.value)}
                    size="sm"
                    rows={2}
                  />
                </FormControl>

                <Divider />

                <HStack justify="space-between">
                  <Button variant="ghost" onClick={onPostClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="green"
                    leftIcon={<FiCheckCircle />}
                    onClick={handlePostVoucher}
                    isLoading={isPosting}
                    loadingText="Posting Journal Voucher..."
                  >
                    Post to General Ledger (#JV)
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AccountingReviewBin;
