import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardBody,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Alert,
  AlertIcon,
  Center,
  Flex,
  useToast,
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
  NumberInput,
  NumberInputField,
  useDisclosure,
} from '@chakra-ui/react';
import { useGovernance } from './GovernanceContext';
import { Id } from '../../../convex/_generated/dataModel';
import {
  FiCheckCircle,
  FiPlus,
  FiArrowRight,
  FiRefreshCw,
} from 'react-icons/fi';
import { SaudiRiyalIcon } from '../icons/SaudiRiyalIcon';

interface BilateralSettlementTerminalProps {
  organizationId: Id<"organizations">;
  userId: Id<"user_profiles">;
}

export const BilateralSettlementTerminal: React.FC<BilateralSettlementTerminalProps> = ({
  organizationId,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();
  const txModal = useDisclosure();

  // Local Governance Store
  const {
    projects,
    consortiumOrganizations,
    bilateralTransactions,
    recordBilateralTransaction,
    executeBilateralDischarge,
  } = useGovernance();

  // Selected counterparty
  const [partnerOrgId, setPartnerOrgId] = useState<string>(
    consortiumOrganizations[1] ? consortiumOrganizations[1]._id : 'org_heavy'
  );

  // Filter transactions between user company and partner
  const unsettledTx = (bilateralTransactions || []).filter((tx) => !tx.is_settled);
  const transactionsAtoB = unsettledTx.filter((t) => t.debtor === 'Your Company');
  const transactionsBtoA = unsettledTx.filter((t) => t.debtor === 'Partner Company');

  const grossAtoB = transactionsAtoB.reduce((sum, t) => sum + t.total_amount, 0);
  const grossBtoA = transactionsBtoA.reduce((sum, t) => sum + t.total_amount, 0);
  const netPayable = Math.abs(grossAtoB - grossBtoA);
  const netPayerOrgId = grossAtoB > grossBtoA ? organizationId : partnerOrgId;

  const bilateralData = {
    gross_a_to_b: grossAtoB,
    gross_b_to_a: grossBtoA,
    net_payable_amount: netPayable,
    net_payer_org_id: netPayerOrgId,
    transactions_a_to_b: transactionsAtoB,
    transactions_b_to_a: transactionsBtoA,
  };

  // New Transaction Form State
  const [txForm, setTxForm] = useState({
    project_id: (projects && projects[0] ? projects[0]._id : 'prj_1') as any,
    debtor_org_id: organizationId,
    creditor_org_id: organizationId,
    transaction_type: 'site_fuel_dispensed' as any,
    amount_excl_vat: 25000,
    description: 'Bulk Diesel fuel dispensed from site bowser (تعبئة ديزل من تانكي الموقع)',
  });

  const formatSAR = (amount: number) => {
    return `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 2 }).format(amount)} \uE900`;
  };

  const handleExecuteDischarge = () => {
    try {
      const res = executeBilateralDischarge();
      toast({
        title: 'Settlement Discharged (تم تنفيذ المقاصة والتصفية)',
        description: `Cleared ${res.clearedCount} transactions. Net payable: ${formatSAR(res.netPayable)} paid by ${res.payer}`,
        status: 'success',
        duration: 6000,
      });
    } catch (err: any) {
      toast({
        title: 'Settlement Error',
        description: err.message,
        status: 'error',
      });
    }
  };

  const handleCreateTransaction = () => {
    try {
      const isYouDebtor = txForm.debtor_org_id === organizationId;
      recordBilateralTransaction({
        debtor: isYouDebtor ? 'Your Company' : 'Partner Company',
        creditor: isYouDebtor ? 'Partner Company' : 'Your Company',
        transaction_type: txForm.transaction_type,
        amount_excl_vat: txForm.amount_excl_vat,
        total_amount: txForm.amount_excl_vat * 1.15,
        description: txForm.description,
      });

      toast({ title: 'Contra-Charge Logged (تم قيد الخصمية)', description: 'Added to bilateral netting pool.', status: 'success' });
      txModal.onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    }
  };

  return (
    <Box p={6} maxW="1600px" mx="auto">
      {/* Header with Bilingual Labels */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <HStack spacing={3}>
            <SaudiRiyalIcon boxSize="28px" color="teal.500" />
            <Box>
              <HStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold">
                  Mutual Balance Clear-Off & Bilateral Netting
                </Text>
                <Badge colorScheme="teal" variant="subtle" fontSize="sm">
                  المقاصة الثنائية وتصفية الحسابات
                </Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm">
                Reconciles mutual contractor obligations (crane hire vs. diesel contra-charges vs. camp housing) into a single net discharge.
              </Text>
            </Box>
          </HStack>
        </Box>
        <HStack>
          <Button leftIcon={<FiPlus />} colorScheme="teal" onClick={txModal.onOpen} isDisabled={!partnerOrgId}>
            Log Contra-Charge (قيد خصمية / مصاريف مشتركة)
          </Button>
        </HStack>
      </Flex>

      {/* Partner Organization Selector */}
      <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} p={4} mb={6}>
        <HStack spacing={4} flexWrap="wrap">
          <Text fontWeight="semibold" fontSize="sm" minW="220px">
            Select Partner Contractor to Reconcile (اختر الشريك للمقاصة):
          </Text>
          <Select
            placeholder="Choose Partner Contractor..."
            maxW="450px"
            value={partnerOrgId}
            onChange={(e) => setPartnerOrgId(e.target.value)}
          >
            {consortiumOrganizations
              ?.filter((o) => o._id !== 'org_main')
              .map((org) => (
                <option key={org._id} value={org._id}>
                  {org.name} ({org.commercial_registration_number || 'Partner'})
                </option>
              ))}
          </Select>
        </HStack>
      </Card>

      {partnerOrgId ? (
        <VStack spacing={6} align="stretch">
          {/* The Net Calculation Bar */}
          <Card bg={useColorModeValue('teal.50', 'teal.900')} borderWidth="1px" borderColor="teal.300" shadow="md">
            <CardBody>
              <Grid templateColumns={{ base: '1fr', md: '1fr auto 1fr auto 1fr' }} gap={4} alignItems="center">
                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">
                    Your Company Owes Partner (المستحق للشريك علينا)
                  </Text>
                  <Text fontSize="2xl" fontWeight="extrabold" color="red.600">
                    {formatSAR(bilateralData.gross_a_to_b)}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {bilateralData.transactions_a_to_b.length} Unsettled Invoices (فواتير غير مسواة)
                  </Text>
                </Box>

                <Text fontSize="2xl" fontWeight="bold" color="gray.400" textAlign="center">
                  −
                </Text>

                <Box textAlign="center">
                  <Text fontSize="xs" color="gray.600" textTransform="uppercase" fontWeight="bold">
                    Partner Owes Your Company (الخصميات المستحقة لنا على الشريك)
                  </Text>
                  <Text fontSize="2xl" fontWeight="extrabold" color="green.600">
                    {formatSAR(bilateralData.gross_b_to_a)}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {bilateralData.transactions_b_to_a.length} Contra-Charges / Credits (خصميات ديزل ومعدات)
                  </Text>
                </Box>

                <Text fontSize="2xl" fontWeight="bold" color="gray.400" textAlign="center">
                  =
                </Text>

                <Box textAlign="center" bg={cardBg} p={3} rounded="lg" borderWidth="1.5px" borderColor="teal.400">
                  <Text fontSize="xs" color="teal.700" textTransform="uppercase" fontWeight="bold">
                    Net Final Discharge Balance (الرصيد الصافي النهائي للتسوية)
                  </Text>
                  <Text fontSize="2xl" fontWeight="extrabold" color="teal.600">
                    {formatSAR(bilateralData.net_payable_amount)}
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color="gray.600">
                    {bilateralData.net_payer_org_id === organizationId ? 'YOU PAY PARTNER (ندفع للشريك)' : 'PARTNER PAYS YOU (الشريك يدفع لنا)'}
                  </Text>
                </Box>
              </Grid>

              <Divider my={4} />

              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <HStack>
                  <FiCheckCircle color="#319795" size={18} />
                  <Text fontSize="xs" color="gray.700">
                    Discharging nets all underlying invoices to <span className="icon-saudi_riyal" /> 0 and clears inter-company contra-charges with zero bank friction.
                  </Text>
                </HStack>
                <Button
                  colorScheme="teal"
                  size="md"
                  onClick={handleExecuteDischarge}
                  isDisabled={bilateralData.transactions_a_to_b.length === 0 && bilateralData.transactions_b_to_a.length === 0}
                >
                  Execute Bilateral Netting (تنفيذ المقاصة وتصفية الرصيد)
                </Button>
              </Flex>
            </CardBody>
          </Card>

          {/* Two Column Detailed Breakdown */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
            {/* Left Column: A owes B */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={2}>
                <Text fontSize="md" fontWeight="bold" color="red.600">
                  Services Received - Payables to Partner (المستحقات للشريك)
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Equipment hire, mobilization, and subcontractor services provided by partner.
                </Text>
              </CardHeader>
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                    <Tr>
                      <Th>Code (الرمز)</Th>
                      <Th>Description (الوصف)</Th>
                      <Th>Category (النوع)</Th>
                      <Th textAlign="right">Total Incl VAT (المبلغ)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {bilateralData.transactions_a_to_b.map((tx) => (
                      <Tr key={tx._id}>
                        <Td fontFamily="mono" fontSize="xs">
                          {tx.transaction_code}
                        </Td>
                        <Td fontSize="xs">{tx.description}</Td>
                        <Td>
                          <Badge size="sm">{tx.transaction_type}</Badge>
                        </Td>
                        <Td textAlign="right" fontWeight="bold" fontSize="xs">
                          {formatSAR(tx.total_amount)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>

            {/* Right Column: B owes A */}
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor}>
              <CardHeader pb={2}>
                <Text fontSize="md" fontWeight="bold" color="green.600">
                  Contra-Charges & Deductions - Receivables (الخصميات المستحقة لنا)
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Site diesel fuel dispensed, camp accommodation, HSE safety fines, and materials supplied by Company A.
                </Text>
              </CardHeader>
              <CardBody p={0}>
                <Table variant="simple" size="sm">
                  <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                    <Tr>
                      <Th>Code (الرمز)</Th>
                      <Th>Description (الوصف)</Th>
                      <Th>Category (النوع)</Th>
                      <Th textAlign="right">Total Incl VAT (المبلغ)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {bilateralData.transactions_b_to_a.map((tx) => (
                      <Tr key={tx._id}>
                        <Td fontFamily="mono" fontSize="xs">
                          {tx.transaction_code}
                        </Td>
                        <Td fontSize="xs">{tx.description}</Td>
                        <Td>
                          <Badge size="sm" colorScheme="teal">
                            {tx.transaction_type}
                          </Badge>
                        </Td>
                        <Td textAlign="right" fontWeight="bold" fontSize="xs">
                          {formatSAR(tx.total_amount)}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </Grid>
        </VStack>
      ) : (
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} p={10} textAlign="center">
          <Text fontWeight="medium" color="gray.600" mb={2}>
            Please select a Partner Contractor above to open the reconciliation ledger.
          </Text>
          <Text fontSize="xs" color="gray.500">
            The system will compare both companies' un-cleared invoices, diesel logs, and contra-charges in real time.
          </Text>
        </Card>
      )}

      {/* MODAL: LOG CONTRA-CHARGE */}
      <Modal isOpen={txModal.isOpen} onClose={txModal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Log Inter-Company Contra-Charge (قيد خصمية / نفقة متبادلة)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Project (المشروع)</FormLabel>
                <Select
                  value={txForm.project_id}
                  onChange={(e) => setTxForm({ ...txForm, project_id: e.target.value as any })}
                >
                  {projects?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Who Pays? (من المدين بالتكلفة؟)</FormLabel>
                <Select
                  value={txForm.debtor_org_id}
                  onChange={(e) => setTxForm({ ...txForm, debtor_org_id: e.target.value as any })}
                >
                  <option value={organizationId}>Your Company (علينا للشريك)</option>
                  <option value={partnerOrgId}>Partner Company (على الشريك لنا)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Cost Category (نوع النفقة أو الخصمية)</FormLabel>
                <Select
                  value={txForm.transaction_type}
                  onChange={(e) => setTxForm({ ...txForm, transaction_type: e.target.value as any })}
                >
                  <option value="site_fuel_dispensed">Site Diesel / Fuel Dispensed (وقود وديزل موقع)</option>
                  <option value="material_recharge">Material Supply Rebar/Concrete (توريد مواد وحديد)</option>
                  <option value="equipment_hire">Heavy Machinery / Crane Hire (إيجار رافعات ومعدات)</option>
                  <option value="camp_accommodation">Camp Housing & Catering (سكن وإعاشة عمال)</option>
                  <option value="safety_fine_deduction">HSE Violation / Penalty Contra (خصمية مخالفات سلامة)</option>
                  <option value="management_fee">Management / Governance Fee (رسوم إدارة وإشراف)</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Amount Excl. VAT in <span className="icon-saudi_riyal" /> (المبلغ بدون ضريبة)</FormLabel>
                <NumberInput
                  value={txForm.amount_excl_vat}
                  onChange={(_, val) => setTxForm({ ...txForm, amount_excl_vat: val || 0 })}
                >
                  <NumberInputField />
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Description / Slip Reference (الوصف ورقم السند)</FormLabel>
                <Input
                  value={txForm.description}
                  onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                />
              </FormControl>

              <Button colorScheme="teal" w="full" onClick={handleCreateTransaction}>
                Record into Bilateral Ledger (قيد في دفتر المقاصة)
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default BilateralSettlementTerminal;
