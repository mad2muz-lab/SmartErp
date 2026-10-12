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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Tag,
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
  Switch,
  Textarea,
  useDisclosure,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { useGovernance } from './GovernanceContext';
import { Id } from '../../../convex/_generated/dataModel';
import {
  FiShield,
  FiFileText,
  FiCreditCard,
  FiLayers,
  FiAlertTriangle,
  FiCheckCircle,
  FiLock,
  FiPlus,
  FiAward,
  FiBell,
  FiXCircle,
} from 'react-icons/fi';

interface GovernanceDashboardProps {
  organizationId: Id<"organizations">;
  userId: Id<"user_profiles">;
}

export const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({
  organizationId,
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const toast = useToast();

  // Governance Local Reactive Store
  const {
    sanadNotes,
    nafithAlerts,
    borrowingFacilities,
    brandPassports,
    projects,
    collaborations,
    createSanadNote,
    dischargeSanadNote,
    logNafithAlert,
    resolveNafithAlert,
    createBorrowingFacility,
    grantBrandPassport,
  } = useGovernance();

  const promissoryNotes = sanadNotes;

  // Modals
  const sanadModal = useDisclosure();
  const nafithModal = useDisclosure();
  const facilityModal = useDisclosure();
  const passportModal = useDisclosure();

  // New Nafith Alert Form State
  const [nafithForm, setNafithForm] = useState({
    notice_number: 'NAF-2026-9941',
    creditor_name: 'Saudi Ready-Mix Concrete Co.',
    creditor_cr: '1010294819',
    amount: 350000,
    project_id: (projects && projects[0] ? projects[0]._id : 'prj_1'),
    is_authorized: true,
    counter_indemnity_ref: 'SM-2026-005',
    notes: 'Batching plant credit delivery for Project Foundation pour',
  });

  // New Sanad Form State
  const [sanadForm, setSanadForm] = useState({
    project_id: (projects && projects[0] ? projects[0]._id : 'prj_1') as any,
    beneficiary_org_id: organizationId,
    creditor_name: '',
    creditor_cr: '',
    amount: 100000,
    due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    purpose: 'Material Supplier Payment Guarantee (سند لأمر للمورد)',
    counter_secured: true,
    counter_security_details: 'Signed Partner Backup Guarantee (Sanad Mudhaad / سند مضاد)',
  });

  // New Facility Form State
  const [facilityForm, setFacilityForm] = useState({
    beneficiary_org_id: organizationId,
    lender_name: 'Saudi National Bank (SNB / البنك الأهلي السعودي)',
    facility_type: 'invoice_factoring' as any,
    approved_limit: 1000000,
    finance_cost_rate: 4.5,
    expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    counter_indemnity_verified: true,
  });

  // New Passport Form State
  const [passportForm, setPassportForm] = useState({
    authorized_org_id: organizationId,
    credential_type: 'Project Permission Pass (تصريح استخدام السجل التجاري)',
    certificate_reference: 'CR-1010-884219',
    allowed_tender_scope: 'Exclusively for Project Bidding. Strictly No Borrowing. (للمناقصة والتنفيذ فقط ويمنع الاقتراض)',
    valid_to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    allows_borrowing: false,
  });

  const formatSAR = (amount: number) => {
    return `${new Intl.NumberFormat('en-SA', { maximumFractionDigits: 0 }).format(amount)} \uE900`;
  };

  const handleCreateSanad = async () => {
    if (!sanadForm.creditor_name) {
      toast({
        title: 'Validation Error',
        description: 'Please specify the creditor / vendor.',
        status: 'warning',
      });
      return;
    }

    try {
      const selectedProj = projects.find((p) => p._id === sanadForm.project_id || p.id === sanadForm.project_id);
      createSanadNote({
        project_id: sanadForm.project_id,
        project_name: selectedProj ? selectedProj.name : 'Riyadh Logistics Park Phase 2',
        creditor_name: sanadForm.creditor_name,
        creditor_cr: sanadForm.creditor_cr || undefined,
        amount: sanadForm.amount,
        due_date: sanadForm.due_date,
        purpose: sanadForm.purpose,
        counter_secured: sanadForm.counter_secured,
        counter_security_details: sanadForm.counter_security_details,
      });

      toast({
        title: 'Payment Guarantee Registered (تم إصدار سند لأمر)',
        description: 'Registered into vault with counter-indemnity protection.',
        status: 'success',
      });
      sanadModal.onClose();
    } catch (err: any) {
      toast({
        title: 'Error Issuing Sanad',
        description: err.message,
        status: 'error',
      });
    }
  };

  const handleLogNafithNotice = () => {
    try {
      const selectedProj = projects.find((p) => p._id === nafithForm.project_id || p.id === nafithForm.project_id);
      logNafithAlert({
        notice_number: nafithForm.notice_number,
        creditor_name: nafithForm.creditor_name,
        creditor_cr: nafithForm.creditor_cr,
        amount: nafithForm.amount,
        project_id: nafithForm.project_id,
        project_name: selectedProj ? selectedProj.name : 'Riyadh Logistics Park Phase 2',
        is_authorized: nafithForm.is_authorized,
        notes: nafithForm.notes,
        counter_indemnity_ref: nafithForm.counter_indemnity_ref,
      });

      if (nafithForm.is_authorized) {
        toast({
          title: 'Nafith Notice Registered (تم قيد إشعار نافذ)',
          description: `${formatSAR(nafithForm.amount)} \uE900 recorded. Counter-indemnity linked and milestone funds reserved.`,
          status: 'success',
        });
      } else {
        toast({
          title: '🚨 Rogue PO Alert Logged (تحذير أمر شراء غير مصرح)',
          description: 'Marked as UNAUTHORIZED. Do NOT approve on Nafith mobile app!',
          status: 'error',
          duration: 8000,
        });
      }
      nafithModal.onClose();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    }
  };

  const handleDischargeSanad = async (noteId: string) => {
    try {
      dischargeSanadNote(noteId);
      toast({
        title: 'Guarantee Discharged (تم تسوية وإلغاء السند)',
        description: 'Note successfully marked as closed and removed from active liability pool.',
        status: 'success',
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    }
  };

  // Live Calculated KPIs
  const activeNotes = (sanadNotes || []).filter((n) => n.status === 'active');
  const activeSanadExposure = activeNotes.reduce((sum, n) => sum + (n.amount || 0), 0);
  const activeNotesCount = activeNotes.length;
  const securedNotesCount = activeNotes.filter((n) => n.counter_secured).length;
  const counterSecuredPct = activeNotesCount > 0 ? Math.round((securedNotesCount / activeNotesCount) * 100) : 100;

  const activeFacs = (borrowingFacilities || []).filter((f) => f.status === 'active');
  const totalApprovedLimit = activeFacs.reduce((sum, f) => sum + (f.approved_limit || 0), 0);
  const totalDrawn = activeFacs.reduce((sum, f) => sum + (f.drawn_amount || 0), 0);

  const activeKpis = {
    sanad_exposure: {
      total_active_sar: activeSanadExposure,
      active_notes_count: activeNotesCount,
      counter_secured_pct: counterSecuredPct,
    },
    borrowing_shield: {
      approved_limit_sar: totalApprovedLimit,
      drawn_balance_sar: totalDrawn,
      headroom_available_sar: Math.max(0, totalApprovedLimit - totalDrawn),
    },
    brand_passports: {
      active_passports_count: (brandPassports || []).filter((p) => p.status === 'active').length,
    },
    projects_and_consortiums: {
      active_projects_count: (projects || []).filter((p) => p.status === 'active').length,
      active_collaborations_count: (collaborations || []).filter((c) => c.status === 'active').length,
    },
  };

  return (
    <Box p={6} maxW="1600px" mx="auto">
      {/* Top Banner with Dual Language Labels */}
      <Flex justify="space-between" align="center" mb={6} flexWrap="wrap" gap={4}>
        <Box>
          <HStack spacing={3}>
            <FiShield size={28} color="#2B6CB0" />
            <Box>
              <HStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold">
                  Executive Console & Guarantees Vault
                </Text>
                <Badge colorScheme="blue" variant="subtle" fontSize="sm">
                  لوحة الحوكمة والضمانات
                </Badge>
              </HStack>
              <Text color="gray.500" fontSize="sm">
                Monitors Promissory Notes (Sanad Amr / سند لأمر), Nafith alerts, bank priority debt, and CR permission passes.
              </Text>
            </Box>
          </HStack>
        </Box>

        {/* Action Buttons with Explanatory Tooltips */}
        <HStack spacing={2.5} flexWrap="wrap">
          <Tooltip hasArrow label="Log a legal notice or court claim from the Ministry of Justice Nafith platform to prevent account freezing">
            <Button
              leftIcon={<FiBell />}
              colorScheme="orange"
              variant="solid"
              onClick={nafithModal.onOpen}
            >
              Log Nafith Notice (إشعار منصة نافذ)
            </Button>
          </Tooltip>

          <Tooltip hasArrow label="Issue an official Promissory Note (Sanad Amr) locked with a back-to-back partner counter-guarantee">
            <Button
              leftIcon={<FiPlus />}
              colorScheme="red"
              variant="solid"
              onClick={sanadModal.onOpen}
            >
              Issue Guarantee (سند لأمر)
            </Button>
          </Tooltip>

          <Tooltip hasArrow label="Register bank financing lines and setup the Senior Priority-1 repayment waterfall">
            <Button
              leftIcon={<FiLock />}
              colorScheme="blue"
              variant="outline"
              onClick={facilityModal.onOpen}
            >
              Credit Facility (تسهيلات بنكية)
            </Button>
          </Tooltip>

          <Tooltip hasArrow label="Issue a time-bound CR tender authorization pass with strict liability cap to an executing partner">
            <Button
              leftIcon={<FiAward />}
              colorScheme="purple"
              variant="outline"
              onClick={passportModal.onOpen}
            >
              Permission Pass (تصريح السجل)
            </Button>
          </Tooltip>
        </HStack>
      </Flex>

      {/* TRIPWIRE 2: LIVE NAFITH NOTICES MONITOR */}
      {nafithAlerts && nafithAlerts.length > 0 && (
        <Card bg={useColorModeValue('orange.50', 'gray.800')} borderWidth="1.5px" borderColor="orange.300" mb={6} shadow="sm">
          <CardBody py={3.5} px={4}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack spacing={3}>
                <Icon as={FiBell} color="orange.600" boxSize={5} />
                <Box>
                  <HStack spacing={2}>
                    <Text fontWeight="bold" fontSize="sm" color="orange.900">
                      National Enforcement Portal Alert (منصة نافذ - إشعار سند دائن)
                    </Text>
                    <Badge colorScheme="orange" fontSize="10px">
                      ACTIVE TRIPWIRE
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="orange.700">
                    Latest Notice: <strong>{nafithAlerts[0].creditor_name}</strong> requested a Sanad Amr for <strong>{formatSAR(nafithAlerts[0].amount)}</strong> (#{nafithAlerts[0].notice_number})
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={2}>
                {nafithAlerts[0].is_authorized ? (
                  <Badge colorScheme="green" px={2} py={1} rounded="md">
                    🛡️ Partner Backup Guarantee Attached (سند مضاد موثق)
                  </Badge>
                ) : (
                  <Badge colorScheme="red" px={2} py={1} rounded="md">
                    🚨 UNAUTHORIZED ROGUE PO (أمر شراء غير مصرح)
                  </Badge>
                )}
                {nafithAlerts[0].status === 'pending_review' && (
                  <Button
                    size="xs"
                    colorScheme="red"
                    variant="solid"
                    onClick={() => resolveNafithAlert(nafithAlerts[0]._id, 'reject')}
                  >
                    Reject on Nafith (رفض الطلب)
                  </Button>
                )}
              </HStack>
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* KPI Exposure Summary Cards with Dual Language */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={5} mb={8}>
        {/* KPI 1: Payment Guarantee Risk (Sanad Amr) */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
          <CardBody>
            <HStack justify="space-between" align="start">
              <Stat>
                <StatLabel color="gray.500" fontWeight="medium">
                  Guarantees Pool (سند لأمر فعال)
                </StatLabel>
                <StatNumber fontSize="2xl" color={activeKpis.sanad_exposure.total_active_sar > 0 ? "red.600" : "green.600"}>
                  {formatSAR(activeKpis.sanad_exposure.total_active_sar)}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {activeKpis.sanad_exposure.active_notes_count} Notes • {activeKpis.sanad_exposure.counter_secured_pct}% Backup Secured (سند مضاد)
                </StatHelpText>
              </Stat>
              <Box p={3} bg="red.50" rounded="lg">
                <FiAlertTriangle color="#E53E3E" size={24} />
              </Box>
            </HStack>
            <Progress
              value={activeKpis.sanad_exposure.counter_secured_pct}
              colorScheme="green"
              size="xs"
              rounded="full"
              mt={2}
            />
          </CardBody>
        </Card>

        {/* KPI 2: Borrowing Shield & Priority 1 Debt */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
          <CardBody>
            <HStack justify="space-between" align="start">
              <Stat>
                <StatLabel color="gray.500" fontWeight="medium">
                  Bank Debt (تسهيلات بنكية مستغلة)
                </StatLabel>
                <StatNumber fontSize="2xl" color="orange.600">
                  {formatSAR(activeKpis.borrowing_shield.drawn_balance_sar)}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  Limit: {formatSAR(activeKpis.borrowing_shield.approved_limit_sar)} • Priority-1 Waterfall
                </StatHelpText>
              </Stat>
              <Box p={3} bg="orange.50" rounded="lg">
                <FiCreditCard color="#DD6B20" size={24} />
              </Box>
            </HStack>
            <Progress
              value={
                activeKpis.borrowing_shield.approved_limit_sar > 0
                  ? (activeKpis.borrowing_shield.drawn_balance_sar / activeKpis.borrowing_shield.approved_limit_sar) * 100
                  : 0
              }
              colorScheme="orange"
              size="xs"
              rounded="full"
              mt={2}
            />
          </CardBody>
        </Card>

        {/* KPI 3: Projects & Collaborations */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
          <CardBody>
            <HStack justify="space-between" align="start">
              <Stat>
                <StatLabel color="gray.500" fontWeight="medium">
                  Projects & JVs (المشاريع والتحالفات)
                </StatLabel>
                <StatNumber fontSize="2xl" color="blue.600">
                  {activeKpis.projects_and_consortiums.active_projects_count}
                </StatNumber>
                <StatHelpText fontSize="xs">
                  {activeKpis.projects_and_consortiums.active_collaborations_count} Scopes • 0% Fee & % Models
                </StatHelpText>
              </Stat>
              <Box p={3} bg="blue.50" rounded="lg">
                <FiLayers color="#3182CE" size={24} />
              </Box>
            </HStack>
          </CardBody>
        </Card>

        {/* KPI 4: Brand Passports */}
        <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
          <CardBody>
            <HStack justify="space-between" align="start">
              <Stat>
                <StatLabel color="gray.500" fontWeight="medium">
                  Permission Passes (تصاريح السجل)
                </StatLabel>
                <StatNumber fontSize="2xl" color="purple.600">
                  {activeKpis.brand_passports.active_passports_count} Active
                </StatNumber>
                <StatHelpText fontSize="xs">
                  Strict "No Borrowing" Enforced (يمنع الاقتراض)
                </StatHelpText>
              </Stat>
              <Box p={3} bg="purple.50" rounded="lg">
                <FiAward color="#805AD5" size={24} />
              </Box>
            </HStack>
          </CardBody>
        </Card>
      </Grid>

      {/* Main Governance Sections Tabs with Dual Language */}
      <Tabs variant="enclosed" colorScheme="blue" isLazy>
        <TabList mb={4}>
          <Tab fontWeight="bold" fontSize="xs">
            📜 Payment Guarantees (Sanad Amr / سند لأمر)
          </Tab>
          <Tab fontWeight="bold" fontSize="xs">
            🏦 Priority-1 Bank Debt (تسهيلات بنكية وأولوية السداد)
          </Tab>
          <Tab fontWeight="bold" fontSize="xs">
            🛡️ Project Permission Passes (تصاريح السجل التجاري)
          </Tab>
          <Tab fontWeight="bold" fontSize="xs">
            🏗️ Projects & 0% Fee Scopes (اتفاقيات الشراكة والمشاريع)
          </Tab>
        </TabList>

        <TabPanels>
          {/* TAB 1: SANAD AMR VAULT */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardHeader>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <Box>
                    <HStack spacing={2}>
                      <Text fontSize="md" fontWeight="bold">
                        Payment Guarantees Register (سجل سندات لأمر والضمانات التنفيذية)
                      </Text>
                      <Badge colorScheme="red" variant="subtle" fontSize="10px">
                        NAFITH INTEGRATION
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      Tracks every executive guarantee issued under Company A's CR. Enforces Partner Backup Guarantee (Sanad Mudhaad / سند مضاد).
                    </Text>
                  </Box>
                  <Button size="sm" colorScheme="red" leftIcon={<FiPlus />} onClick={sanadModal.onOpen}>
                    Issue Guarantee (إصدار سند)
                  </Button>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody p={0}>
                {promissoryNotes && promissoryNotes.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                      <Tr>
                        <Th>Note # (رقم السند)</Th>
                        <Th>Creditor / Vendor (المورد / الدائن)</Th>
                        <Th>Amount (المبلغ)</Th>
                        <Th>Due Date (الاستحقاق)</Th>
                        <Th>Days Left</Th>
                        <Th>Backup Guarantee (السند المضاد)</Th>
                        <Th>Status (الحالة)</Th>
                        <Th textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {promissoryNotes.map((note) => (
                        <Tr key={note._id}>
                          <Td fontWeight="bold" color="blue.600" fontFamily="mono" fontSize="xs">
                            {note.note_number}
                          </Td>
                          <Td>
                            <Text fontWeight="medium" fontSize="xs">{note.creditor_name}</Text>
                            <Text fontSize="10px" color="gray.500">
                              {note.purpose}
                            </Text>
                          </Td>
                          <Td fontWeight="bold" fontSize="xs">{formatSAR(note.amount)}</Td>
                          <Td fontSize="xs">{note.due_date}</Td>
                          <Td>
                            {note.status === 'active' ? (
                              <Tag
                                colorScheme={
                                  note.is_overdue ? 'red' : note.is_critical ? 'orange' : 'green'
                                }
                                size="sm"
                              >
                                {note.is_overdue
                                  ? `${Math.abs(note.days_remaining)}d Overdue!`
                                  : `${note.days_remaining}d Left`}
                              </Tag>
                            ) : (
                              <Tag size="sm" colorScheme="gray">
                                Closed (مسوى)
                              </Tag>
                            )}
                          </Td>
                          <Td>
                            {note.counter_secured ? (
                              <Badge colorScheme="green" fontSize="10px">
                                <HStack spacing={1}>
                                  <FiCheckCircle size={10} />
                                  <Text>Secured (سند مضاد)</Text>
                                </HStack>
                              </Badge>
                            ) : (
                              <Badge colorScheme="red" fontSize="10px">
                                <HStack spacing={1}>
                                  <FiAlertTriangle size={10} />
                                  <Text>Unsecured (بدون سند مضاد)</Text>
                                </HStack>
                              </Badge>
                            )}
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={
                                note.status === 'active'
                                  ? 'blue'
                                  : note.status === 'discharged'
                                  ? 'green'
                                  : 'red'
                              }
                              fontSize="10px"
                            >
                              {note.status.toUpperCase()}
                            </Badge>
                          </Td>
                          <Td textAlign="right">
                            {note.status === 'active' && (
                              <Button
                                size="xs"
                                colorScheme="green"
                                variant="outline"
                                onClick={() => handleDischargeSanad(note._id)}
                              >
                                Discharge (تصفية وإلغاء)
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Box p={8} textAlign="center">
                    <FiShield size={40} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
                    <Text fontWeight="medium" color="gray.600">
                      No Payment Guarantees recorded yet
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* TAB 2: BORROWING FACILITIES & SENIOR WATERFALL */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardHeader>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <Box>
                    <HStack spacing={2}>
                      <Text fontSize="md" fontWeight="bold">
                        Credit Facilities & Senior Debt Waterfall (التسهيلات البنكية وأولوية السداد الأولى)
                      </Text>
                      <Badge colorScheme="orange" variant="subtle" fontSize="10px">
                        PRIORITY-1 WATERFALL
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      Enforces Senior Priority 1 debt repayment: Client milestone receipts automatically pay off bank debt before any partner payout.
                    </Text>
                  </Box>
                  <Button size="sm" colorScheme="blue" leftIcon={<FiPlus />} onClick={facilityModal.onOpen}>
                    New Facility (تسهيل بنكي جديد)
                  </Button>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody>
                {borrowingFacilities && borrowingFacilities.length > 0 ? (
                  <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                    {borrowingFacilities.map((fac) => (
                      <Card key={fac._id} borderWidth="1px" borderColor={borderColor} p={4} shadow="none">
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <FiCreditCard size={20} color="#DD6B20" />
                            <Text fontWeight="bold" fontSize="sm">{fac.lender_name}</Text>
                          </HStack>
                          <Badge colorScheme="blue" fontSize="10px">{fac.facility_type}</Badge>
                        </HStack>
                        <Divider my={2} />
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.500">
                            Approved Limit (الحد المعتمد):
                          </Text>
                          <Text fontSize="xs" fontWeight="bold">
                            {formatSAR(fac.approved_limit)}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.500">
                            Drawn Balance (الرصيد المستغل):
                          </Text>
                          <Text fontSize="xs" fontWeight="bold" color="orange.600">
                            {formatSAR(fac.drawn_amount)}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="xs" color="gray.500">
                            Finance Cost Rate (تكلفة التمويل):
                          </Text>
                          <Text fontSize="xs" fontWeight="bold">
                            {fac.finance_cost_rate}% (Borne by Beneficiary Partner)
                          </Text>
                        </HStack>
                        <Progress
                          value={fac.approved_limit > 0 ? (fac.drawn_amount / fac.approved_limit) * 100 : 0}
                          colorScheme="orange"
                          size="sm"
                          rounded="md"
                        />
                        <HStack justify="space-between" mt={3}>
                          <Tag size="sm" colorScheme="green" fontSize="10px">
                            Priority 1 Waterfall (أولوية سداد أولى)
                          </Tag>
                          <Text fontSize="xs" color="gray.400">
                            Expires: {fac.expiry_date}
                          </Text>
                        </HStack>
                      </Card>
                    ))}
                  </Grid>
                ) : (
                  <Box p={8} textAlign="center">
                    <FiCreditCard size={40} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
                    <Text fontWeight="medium" color="gray.600">
                      No credit or borrowing facilities registered
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* TAB 3: BRAND PASSPORTS */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardHeader>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <Box>
                    <HStack spacing={2}>
                      <Text fontSize="md" fontWeight="bold">
                        Project Permission Passes (تصاريح استخدام السجل التجاري والاعتمادات)
                      </Text>
                      <Badge colorScheme="purple" variant="subtle" fontSize="10px">
                        STRICT BOUNDARIES
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      Time-bound, tender-specific authorization letters with verification tokens. Explicitly blocks unauthorized borrowing.
                    </Text>
                  </Box>
                  <Button size="sm" colorScheme="purple" leftIcon={<FiAward />} onClick={passportModal.onOpen}>
                    Grant Pass (إصدار تصريح)
                  </Button>
                </Flex>
              </CardHeader>
              <Divider />
              <CardBody>
                {brandPassports && brandPassports.length > 0 ? (
                  <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                    {brandPassports.map((pass) => (
                      <Card key={pass._id} borderWidth="1px" borderColor={borderColor} p={4} shadow="none">
                        <HStack justify="space-between" mb={2}>
                          <HStack>
                            <FiAward size={20} color="#805AD5" />
                            <Text fontWeight="bold" fontSize="sm">{pass.passport_code}</Text>
                          </HStack>
                          <Badge colorScheme={pass.status === 'active' ? 'purple' : 'gray'} fontSize="10px">
                            {pass.status.toUpperCase()}
                          </Badge>
                        </HStack>
                        <Divider my={2} />
                        <Text fontSize="xs" fontWeight="bold" mb={1}>
                          {pass.credential_type}
                        </Text>
                        <Text fontSize="xs" color="gray.600" mb={3} noOfLines={2}>
                          Scope: {pass.allowed_tender_scope}
                        </Text>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.500">
                            Valid Until (تاريخ الانتهاء):
                          </Text>
                          <Text fontSize="xs" fontWeight="bold">
                            {pass.valid_to}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="xs" color="gray.500">
                            Borrowing Authorized (حق الاقتراض):
                          </Text>
                          <Badge colorScheme={pass.allows_borrowing ? 'red' : 'green'} fontSize="10px">
                            {pass.allows_borrowing ? 'YES' : 'STRICTLY NO (ممنوع الاقتراض)'}
                          </Badge>
                        </HStack>
                        {pass.granted_to_org && (
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="xs" color="gray.500">
                              Beneficiary Partner (الجهة المفوضة):
                            </Text>
                            <Text fontSize="xs" fontWeight="bold">
                              {pass.granted_to_org}
                            </Text>
                          </HStack>
                        )}
                        <HStack justify="space-between" mb={2}>
                          <Text fontSize="xs" color="gray.500">
                            Risk Indemnity (إقرار الضامن الوحيد):
                          </Text>
                          {pass.sole_indemnifier_accepted ? (
                            <Badge colorScheme="green" fontSize="10px">
                              ACCEPTED ✓ (محصن)
                            </Badge>
                          ) : (
                            <Badge colorScheme="orange" fontSize="10px">
                              PENDING WA ACCEPTANCE
                            </Badge>
                          )}
                        </HStack>
                        <Box bg={useColorModeValue('gray.50', 'gray.900')} p={2} rounded="md" mt={2}>
                          <Text fontSize="10px" color="gray.500" fontFamily="mono">
                            Verification Token: {pass.verification_token.substring(0, 16)}...
                          </Text>
                        </Box>
                      </Card>
                    ))}
                  </Grid>
                ) : (
                  <Box p={8} textAlign="center">
                    <FiAward size={40} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
                    <Text fontWeight="medium" color="gray.600">
                      No Permission Passes issued
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          {/* TAB 4: PROJECTS & COLLABORATIONS */}
          <TabPanel px={0}>
            <Card bg={cardBg} borderWidth="1px" borderColor={borderColor} shadow="sm">
              <CardHeader>
                <HStack spacing={2}>
                  <Text fontSize="md" fontWeight="bold">
                    Projects & Partnership Scopes (المشاريع واتفاقيات التحالف)
                  </Text>
                  <Badge colorScheme="teal" variant="subtle" fontSize="10px">
                    0% FEE SUPPORT
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  Consortium projects governed by explicit fee agreements (including 0% fee partnerships).
                </Text>
              </CardHeader>
              <Divider />
              <CardBody p={0}>
                {collaborations && collaborations.length > 0 ? (
                  <Table variant="simple" size="sm">
                    <Thead bg={useColorModeValue('gray.50', 'gray.900')}>
                      <Tr>
                        <Th>Agreement # (رقم الاتفاقية)</Th>
                        <Th>Partner & Scope (الشريك)</Th>
                        <Th>Fee Structure (هيكل الرسوم)</Th>
                        <Th>Effective Window (الفترة)</Th>
                        <Th>Liability Cap (سقف المسؤولية)</Th>
                        <Th>Status (الحالة)</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {collaborations.map((c) => (
                        <Tr key={c._id}>
                          <Td fontWeight="bold" color="blue.600" fontFamily="mono" fontSize="xs">
                            {c.agreement_code}
                          </Td>
                          <Td>
                            <Text fontWeight="medium" fontSize="xs">{c.partner_name}</Text>
                            <Text fontSize="10px" color="gray.500">{c.collaboration_type}</Text>
                          </Td>
                          <Td>
                            {c.management_fee_type === 'zero_fee' ? (
                              <Badge colorScheme="teal" fontSize="10px">0% Fee (شراكة بدون رسوم إدارة)</Badge>
                            ) : (
                              <Badge colorScheme="blue" fontSize="10px">
                                {c.management_fee_value}% ({c.management_fee_type})
                              </Badge>
                            )}
                          </Td>
                          <Td fontSize="xs">
                            {c.effective_from} to {c.effective_to}
                          </Td>
                          <Td fontWeight="bold" fontSize="xs">{c.liability_cap ? formatSAR(c.liability_cap) : 'Uncapped'}</Td>
                          <Td>
                            <Badge colorScheme={c.status === 'active' ? 'green' : 'gray'} fontSize="10px">
                              {c.status.toUpperCase()}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                ) : (
                  <Box p={8} textAlign="center">
                    <FiLayers size={40} color="#CBD5E0" style={{ margin: '0 auto 12px' }} />
                    <Text fontWeight="medium" color="gray.600">
                      No active collaboration agreements found
                    </Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* MODAL 1: LOG INCOMING NAFITH NOTICE (THE TRIPWIRE) */}
      <Modal isOpen={nafithModal.isOpen} onClose={nafithModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <FiBell color="#DD6B20" />
              <Text>Log Incoming Nafith Notice (قيد إشعار منصة نافذ)</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Alert status="warning" rounded="md" fontSize="xs">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="xs">Instant Nafith SMS Tripwire</AlertTitle>
                  <AlertDescription fontSize="11px">
                    When you receive an SMS from Nafith (وزارة العدل) indicating a supplier has requested a Sanad Amr, enter the details here immediately to verify authority and trigger partner backup guarantees.
                  </AlertDescription>
                </Box>
              </Alert>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Nafith Notice # (رقم الطلب)</FormLabel>
                  <Input
                    placeholder="e.g. NAF-2026-9921"
                    value={nafithForm.notice_number}
                    onChange={(e) => setNafithForm({ ...nafithForm, notice_number: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Tied Project (المشروع)</FormLabel>
                  <Select
                    value={nafithForm.project_id}
                    onChange={(e) => setNafithForm({ ...nafithForm, project_id: e.target.value })}
                  >
                    {projects?.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Creditor / Supplier Name (المورد الدائن من الرسالة)</FormLabel>
                <Input
                  placeholder="e.g. Saudi Ready-Mix Concrete Co."
                  value={nafithForm.creditor_name}
                  onChange={(e) => setNafithForm({ ...nafithForm, creditor_name: e.target.value })}
                />
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Amount Requested (المبلغ بالريال)</FormLabel>
                  <NumberInput
                    value={nafithForm.amount}
                    min={1000}
                    onChange={(_, val) => setNafithForm({ ...nafithForm, amount: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Supplier CR Number (السجل التجاري)</FormLabel>
                  <Input
                    placeholder="e.g. 1010294819"
                    value={nafithForm.creditor_cr}
                    onChange={(e) => setNafithForm({ ...nafithForm, creditor_cr: e.target.value })}
                  />
                </FormControl>
              </HStack>

              {/* CRITICAL QUESTION: DID PARTNER B INFORM YOU? */}
              <Box w="full" p={3} borderWidth="1.5px" borderColor={nafithForm.is_authorized ? "green.300" : "red.400"} bg={nafithForm.is_authorized ? "green.50" : "red.50"} rounded="md">
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Text fontSize="xs" fontWeight="bold" color={nafithForm.is_authorized ? "green.900" : "red.900"}>
                      Did Partner B inform you before ordering this? (هل أبلغكم الشريك قبل الطلب؟)
                    </Text>
                    <Text fontSize="10px" color="gray.600">
                      If NO, this is a rogue unauthorized PO. Do not sign on your Nafith app!
                    </Text>
                  </Box>
                  <Switch
                    colorScheme="green"
                    isChecked={nafithForm.is_authorized}
                    onChange={(e) => setNafithForm({ ...nafithForm, is_authorized: e.target.checked })}
                  />
                </FormControl>
              </Box>

              {nafithForm.is_authorized ? (
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Partner Backup Guarantee Reference (رقم السند المضاد من الشريك)</FormLabel>
                  <Input
                    placeholder="e.g. SM-2026-005"
                    value={nafithForm.counter_indemnity_ref}
                    onChange={(e) => setNafithForm({ ...nafithForm, counter_indemnity_ref: e.target.value })}
                  />
                  <Text fontSize="10px" color="gray.500" mt={1}>
                    Policy: Only click "Accept" on Nafith mobile after Partner B delivers this signed counter-guarantee.
                  </Text>
                </FormControl>
              ) : (
                <Alert status="error" rounded="md" fontSize="xs">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="xs">🚨 ACTION REQUIRED: REJECT ON NAFITH</AlertTitle>
                    <AlertDescription fontSize="10px">
                      This PO was submitted without your consent. Open your Nafith mobile application, locate Notice #{nafithForm.notice_number}, and click REJECT to protect Company A's credit profile.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              <Button
                colorScheme={nafithForm.is_authorized ? "orange" : "red"}
                w="full"
                onClick={handleLogNafithNotice}
                mt={2}
              >
                {nafithForm.is_authorized ? "Record in Vault & Lock Milestone Escrow" : "Log Rogue Alert & Flag For Rejection"}
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL 2: ISSUE SANAD AMR */}
      <Modal isOpen={sanadModal.isOpen} onClose={sanadModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Issue Payment Guarantee (Sanad Amr / سند لأمر)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Tied Project (المشروع)</FormLabel>
                <Select
                  value={sanadForm.project_id}
                  onChange={(e) => setSanadForm({ ...sanadForm, project_id: e.target.value as any })}
                >
                  {projects?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Creditor / Beneficiary (المورد أو البنك المستفيد)</FormLabel>
                <Input
                  placeholder="e.g. Saudi Ready-Mix Co."
                  value={sanadForm.creditor_name}
                  onChange={(e) => setSanadForm({ ...sanadForm, creditor_name: e.target.value })}
                />
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Amount (المبلغ بالريال)</FormLabel>
                  <NumberInput
                    value={sanadForm.amount}
                    min={1000}
                    onChange={(_, val) => setSanadForm({ ...sanadForm, amount: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Maturity Date (تاريخ الاستحقاق)</FormLabel>
                  <Input
                    type="date"
                    value={sanadForm.due_date}
                    onChange={(e) => setSanadForm({ ...sanadForm, due_date: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel fontSize="xs">Commercial Purpose (الغرض التجاري)</FormLabel>
                <Input
                  value={sanadForm.purpose}
                  onChange={(e) => setSanadForm({ ...sanadForm, purpose: e.target.value })}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel fontSize="xs" mb="0">
                  Counter-Secured by Partner (Sanad Mudhaad / سند مضاد من الشريك)?
                </FormLabel>
                <Switch
                  isChecked={sanadForm.counter_secured}
                  onChange={(e) => setSanadForm({ ...sanadForm, counter_secured: e.target.checked })}
                />
              </FormControl>

              {sanadForm.counter_secured && (
                <FormControl>
                  <FormLabel fontSize="xs">Counter-Security Description</FormLabel>
                  <Input
                    value={sanadForm.counter_security_details}
                    onChange={(e) => setSanadForm({ ...sanadForm, counter_security_details: e.target.value })}
                  />
                </FormControl>
              )}

              <Button colorScheme="red" w="full" onClick={handleCreateSanad} mt={2}>
                Issue & Lock Exposure Cap
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL 3: REGISTER BORROWING FACILITY */}
      <Modal isOpen={facilityModal.isOpen} onClose={facilityModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Register Credit / Borrowing Facility (تسهيل بنكي)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Lender Name (اسم البنك أو جهة التمويل)</FormLabel>
                <Input
                  placeholder="e.g. Al Rajhi Bank, SNB"
                  value={facilityForm.lender_name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, lender_name: e.target.value })}
                />
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Facility Type (نوع التسهيل)</FormLabel>
                  <Select
                    value={facilityForm.facility_type}
                    onChange={(e) => setFacilityForm({ ...facilityForm, facility_type: e.target.value as any })}
                  >
                    <option value="bank_loan">Bank Loan / Murabaha (مرابحة بنكية)</option>
                    <option value="invoice_factoring">Invoice Factoring (خصم فواتير)</option>
                    <option value="supplier_credit_line">Supplier Credit Line (تسهيل موردين)</option>
                    <option value="overdraft">Bank Overdraft (سحب على المكشوف)</option>
                    <option value="kafala">Kafala SME Facility (برنامج كفالة)</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Approved Limit (الحد المعتمد بالريال)</FormLabel>
                  <NumberInput
                    value={facilityForm.approved_limit}
                    onChange={(_, val) => setFacilityForm({ ...facilityForm, approved_limit: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </HStack>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Finance Cost Rate (%) (نسبة الأرباح/التكلفة)</FormLabel>
                  <NumberInput
                    value={facilityForm.finance_cost_rate}
                    onChange={(_, val) => setFacilityForm({ ...facilityForm, finance_cost_rate: val || 0 })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="xs">Expiry Date (تاريخ الانتهاء)</FormLabel>
                  <Input
                    type="date"
                    value={facilityForm.expiry_date}
                    onChange={(e) => setFacilityForm({ ...facilityForm, expiry_date: e.target.value })}
                  />
                </FormControl>
              </HStack>

              <Alert status="info" rounded="md" fontSize="xs">
                <AlertIcon />
                Enforces Priority-1 Waterfall: Client milestone receipts pay off this facility before funds release to operating partner.
              </Alert>

              <Button
                colorScheme="blue"
                w="full"
                onClick={() => {
                  try {
                    createBorrowingFacility({
                      lender_name: facilityForm.lender_name,
                      facility_type: facilityForm.facility_type,
                      approved_limit: facilityForm.approved_limit,
                      finance_cost_rate: facilityForm.finance_cost_rate,
                      expiry_date: facilityForm.expiry_date,
                    });
                    toast({ title: 'Facility Registered', status: 'success' });
                    facilityModal.onClose();
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message, status: 'error' });
                  }
                }}
              >
                Save & Enforce Priority Waterfall
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* MODAL 4: GRANT BRAND PASSPORT */}
      <Modal isOpen={passportModal.isOpen} onClose={passportModal.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Grant Project Permission Pass (تصريح استخدام السجل)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="xs">Credential Type (نوع الوثيقة المصرح بها)</FormLabel>
                <Input
                  value={passportForm.credential_type}
                  onChange={(e) => setPassportForm({ ...passportForm, credential_type: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Certificate / Registration Number (رقم السجل/الشهادة)</FormLabel>
                <Input
                  value={passportForm.certificate_reference}
                  onChange={(e) => setPassportForm({ ...passportForm, certificate_reference: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="xs">Allowed Tender Scope (نطاق المشروع المصرح به حصراً)</FormLabel>
                <Textarea
                  value={passportForm.allowed_tender_scope}
                  onChange={(e) => setPassportForm({ ...passportForm, allowed_tender_scope: e.target.value })}
                  placeholder="e.g. Exclusively for Aramco Tender #99. Cannot be used for bank loans."
                  rows={3}
                />
              </FormControl>

              <HStack w="full">
                <FormControl isRequired>
                  <FormLabel fontSize="xs">Valid Until (تاريخ الانتهاء)</FormLabel>
                  <Input
                    type="date"
                    value={passportForm.valid_to}
                    onChange={(e) => setPassportForm({ ...passportForm, valid_to: e.target.value })}
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" pt={4}>
                  <FormLabel fontSize="xs" mb="0">
                    Authorize Borrowing? (السماح بالاقتراض؟)
                  </FormLabel>
                  <Switch
                    isChecked={passportForm.allows_borrowing}
                    onChange={(e) => setPassportForm({ ...passportForm, allows_borrowing: e.target.checked })}
                  />
                </FormControl>
              </HStack>

              <Button
                colorScheme="purple"
                w="full"
                onClick={() => {
                  try {
                    grantBrandPassport({
                      credential_type: passportForm.credential_type,
                      certificate_reference: passportForm.certificate_reference,
                      allowed_tender_scope: passportForm.allowed_tender_scope,
                      valid_to: passportForm.valid_to,
                      allows_borrowing: passportForm.allows_borrowing,
                    });
                    toast({ title: 'Passport Granted (تم إصدار التصريح)', status: 'success' });
                    passportModal.onClose();
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message, status: 'error' });
                  }
                }}
              >
                Issue Digital Brand Passport (إصدار تصريح معتمد)
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GovernanceDashboard;
