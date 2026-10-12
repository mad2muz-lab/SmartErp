import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '../contexts/shared/AuthContext';
import { 
  FiHome,
  FiFileText,
  FiCreditCard,
  FiBarChart,
  FiSettings,
  FiRefreshCw,
  FiInbox,
  FiSend,
} from 'react-icons/fi';
import { SaudiRiyalIcon } from '../components/icons/SaudiRiyalIcon';
import { isConvexOrgId } from '../utils/accountingUtils';
import '../utils/saudiRiyalSymbol.css';
import '../utils/procurementCurrency.css';

// Import accounting components
import AccountingDashboard from '../components/accounting/AccountingDashboard';
import ChartOfAccounts from '../components/accounting/ChartOfAccounts';
import JournalVouchers from '../components/accounting/JournalVouchers';
import ReceiptsManagement from '../components/accounting/ReceiptsManagement';
import PaymentsManagement from '../components/accounting/PaymentsManagement';
import FinancialReports from '../components/accounting/FinancialReports';
import AccountingSettings from '../components/accounting/AccountingSettings';
import AccountingReviewBin from '../components/accounting/AccountingReviewBin';

const AccountingScreen: React.FC = () => {
  const { user, selectedOrganization, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [actionTrigger, setActionTrigger] = useState<{ tab: number; action?: string; timestamp: number } | null>(null);

  const handleNavigateTab = (tabIndex: number, action?: string) => {
    setActiveTab(tabIndex);
    if (action) {
      setActionTrigger({ tab: tabIndex, action, timestamp: Date.now() });
    }
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Handle both string ID and object cases
  const organizationId = typeof selectedOrganization === 'string' 
    ? selectedOrganization 
    : selectedOrganization?._id;
  
  const isConvex = isConvexOrgId(organizationId);

  const queryArgs = isConvex ? { organization_id: organizationId as any } : "skip";
  
  const accountingSettings = useQuery(
    api.accounting.accountingSettings.getAccountingSettings,
    queryArgs
  );

  const reviewExpenses = useQuery(
    api.whatsappApprovals.listAccountingReviewExpenses,
    queryArgs
  );
  const pendingReviewCount = reviewExpenses ? reviewExpenses.length : 0;

  const [localInitialized, setLocalInitialized] = useState<boolean>(() => {
    if (!organizationId) return false;
    try {
      return localStorage.getItem(`trading_erp_accounting_initialized_${organizationId}`) === 'true';
    } catch {
      return false;
    }
  });

  const isInitialized = (accountingSettings !== undefined && accountingSettings !== null) || localInitialized;

  // Initialize mutation for Convex
  const initializeSettings = useMutation(api.accounting.accountingSettings.initializeAccountingSettings);

  const handleInitializeNow = async () => {
    try {
      if (isConvex && organizationId) {
        await initializeSettings({
          organization_id: organizationId as Id<"organizations">,
        });
      } else if (organizationId) {
        localStorage.setItem(`trading_erp_accounting_initialized_${organizationId}`, 'true');
        setLocalInitialized(true);
      }
      toast({
        title: 'Accounting module initialized successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (err: any) {
      // If already initialized or mock mode, mark initialized
      if (organizationId) {
        localStorage.setItem(`trading_erp_accounting_initialized_${organizationId}`, 'true');
        setLocalInitialized(true);
      }
      toast({
        title: 'Standard accounting setup activated',
        description: err?.message || 'Using standard Chart of Accounts structure',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <Box p={6}>
        <Text>Loading accounting system...</Text>
      </Box>
    );
  }

  // Show error if no user or organization
  if (!user && !selectedOrganization) {
    return (
      <Box p={6}>
        <Alert status="error" borderRadius="xl">
          <AlertIcon />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You need to be logged in and have an organization selected to access the accounting system.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiHome,
      component: AccountingDashboard,
      description: 'Financial overview and key metrics',
    },
    {
      id: 'accounting-bin',
      label: pendingReviewCount > 0 ? `📥 Review Bin (${pendingReviewCount})` : '📥 Accounting Review Bin',
      icon: FiInbox,
      component: AccountingReviewBin,
      description: 'Audit manager-approved WhatsApp expenses & assign accounting heads',
    },
    {
      id: 'chart-of-accounts',
      label: 'Chart of Accounts',
      icon: FiFileText,
      component: ChartOfAccounts,
      description: 'Manage your organization\'s chart of accounts',
    },
    {
      id: 'journal-vouchers',
      label: 'Journal Vouchers',
      icon: FiCreditCard,
      component: JournalVouchers,
      description: 'Create and manage manual journal entries',
    },
    {
      id: 'receipts',
      label: 'Receipts',
      icon: FiInbox,
      component: ReceiptsManagement,
      description: 'Record and manage cash and bank receipts',
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: FiSend,
      component: PaymentsManagement,
      description: 'Record and manage payments to suppliers',
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      icon: FiBarChart,
      component: FinancialReports,
      description: 'Generate balance sheets, P&L, and other reports',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: FiSettings,
      component: AccountingSettings,
      description: 'Configure accounting system settings',
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box p={6} borderBottom="1px" borderColor={borderColor}>
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <VStack align="start" spacing={1}>
            <HStack spacing={3}>
              <Text fontSize="2xl" fontWeight="bold">
                Accounting & General Ledger
              </Text>
              <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                Active
              </Badge>
              {!isConvex && (
                <Badge colorScheme="purple" fontSize="xs" px={2} py={0.5} borderRadius="full">
                  Store POS Mode
                </Badge>
              )}
            </HStack>
            <Text color="gray.600" fontSize="sm">
              Comprehensive financial management, Chart of Accounts, receipts, and ZATCA compliance
            </Text>
          </VStack>

          {!isInitialized && (
            <Button
              leftIcon={<FiRefreshCw />}
              colorScheme="blue"
              variant="outline"
              size="sm"
              onClick={onOpen}
            >
              Initialize Accounts
            </Button>
          )}
        </HStack>
      </Box>

      {/* Main Tabs Navigation */}
      <Tabs 
        index={activeTab} 
        onChange={(idx) => setActiveTab(idx)}
        variant="enclosed"
        colorScheme="blue"
      >
        <Box px={6} py={4} borderBottom="1px" borderColor={borderColor} overflowX="auto">
          <TabList>
            {tabs.map((tab) => (
              <Tab key={tab.id} fontSize="sm" whiteSpace="nowrap">
                <HStack spacing={2}>
                  <tab.icon />
                  <Text>{tab.label}</Text>
                </HStack>
              </Tab>
            ))}
          </TabList>
        </Box>

        <TabPanels>
          {tabs.map((tab, idx) => {
            const Component = tab.component as any;
            return (
              <TabPanel key={tab.id} p={0}>
                <Component
                  organizationId={organizationId || 'default'}
                  userId={user?.id as any || 'user_guest'}
                  onNavigateTab={handleNavigateTab}
                  triggerAction={actionTrigger?.tab === idx ? actionTrigger : null}
                />
              </TabPanel>
            );
          })}
        </TabPanels>
      </Tabs>

      {/* Initialize Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Initialize Accounting System</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  This will activate the standard Saudi Chart of Accounts and default fiscal settings for your organization.
                </AlertDescription>
              </Alert>
              <VStack spacing={2} align="start" w="full" pl={2}>
                <Text fontWeight="semibold" fontSize="sm">Structure Includes:</Text>
                <Text fontSize="sm">• Saudi Standard Chart of Accounts (Assets, Liabilities, Equity, Revenue, COGS, Expenses)</Text>
                <Text fontSize="sm">• ZATCA VAT 15% Tax Ledger</Text>
                <Text fontSize="sm">• Cash & Bank Operational Accounts</Text>
                <Text fontSize="sm">• Default Voucher & Receipt Numbering (JV, RCP, PAY)</Text>
              </VStack>
              <HStack spacing={4} w="full" pt={2}>
                <Button colorScheme="blue" flex={1} onClick={handleInitializeNow}>
                  Initialize Now
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

export default AccountingScreen;
