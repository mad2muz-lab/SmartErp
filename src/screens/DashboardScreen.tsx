import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  VStack,
  HStack,
  Icon,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useColorModeValue,
  useBreakpointValue,
  Flex,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { useLanguage } from '../contexts/shared/LanguageContext';
import { PullToRefresh, isMobileDevice } from '../utils/mobileTouch';
import { SaudiRiyalIcon } from '../components/icons/SaudiRiyalIcon';
import { getCurrencySymbol } from '../utils/currencyUtils';
import { isConvexOrgId } from '../utils/accountingUtils';
import {
  FiUsers,
  FiTarget,
  FiPackage,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiCreditCard,
  FiShoppingCart,
  FiTruck,
  FiShoppingBag,
  FiShield,
  FiZap,
  FiSettings,
  FiSearch,
  FiArrowRight,
  FiArrowLeft,
  FiGrid,
  FiLayers,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiExternalLink,
  FiX,
  FiSparkles,
  FiMail,
  FiMessageSquare,
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { WhatsAppExpenseBotDrawer } from '../components/expenses/WhatsAppExpenseBotDrawer';

type ModuleCategory = 'all' | 'sales' | 'supply' | 'retail' | 'finance' | 'system';

interface ModuleTile {
  id: string;
  name: string;
  category: 'sales' | 'supply' | 'retail' | 'finance' | 'system';
  categoryLabel: string;
  description: string;
  icon: any;
  path: string;
  colorScheme: string;
  gradient: string;
  bgTint: string;
  badgeCount?: number | string;
  badgeLabel?: string;
  quickActions: Array<{
    label: string;
    path: string;
  }>;
  adminOnly?: boolean;
}

const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentLanguage, isRtl, dir, t } = useLanguage();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Hoisted color mode values for module tiles (Hooks must NOT be called inside useMemo or loops)
  const blueBgTint = useColorModeValue('blue.50', 'blue.900');
  const tealBgTint = useColorModeValue('teal.50', 'teal.900');
  const purpleBgTint = useColorModeValue('purple.50', 'purple.900');
  const cyanBgTint = useColorModeValue('cyan.50', 'cyan.900');
  const greenBgTint = useColorModeValue('green.50', 'green.900');
  const orangeBgTint = useColorModeValue('orange.50', 'orange.900');
  const yellowBgTint = useColorModeValue('yellow.50', 'yellow.900');
  const pinkBgTint = useColorModeValue('pink.50', 'pink.900');
  const indigoBgTint = useColorModeValue('indigo.50', 'indigo.900');
  const grayBgTint = useColorModeValue('gray.100', 'gray.700');
  const redBgTint = useColorModeValue('red.50', 'red.900');

  // Hoisted colors for inputs, buttons, activity and process flow
  const searchInputBg = useColorModeValue('gray.50', 'gray.900');
  const chipBg = useColorModeValue('gray.100', 'gray.700');
  const chipColor = useColorModeValue('gray.700', 'gray.200');
  const activityItemBg = useColorModeValue('gray.50', 'gray.700');
  const activityItemHoverBg = useColorModeValue('gray.100', 'gray.600');
  const pfBlueBg = useColorModeValue('blue.50', 'blue.900');
  const pfBlueColor = useColorModeValue('blue.700', 'blue.200');
  const pfGreenBg = useColorModeValue('green.50', 'green.900');
  const pfGreenColor = useColorModeValue('green.700', 'green.200');
  const pfOrangeBg = useColorModeValue('orange.50', 'orange.900');
  const pfOrangeColor = useColorModeValue('orange.700', 'orange.200');
  const pfPurpleBg = useColorModeValue('purple.50', 'purple.900');
  const pfPurpleColor = useColorModeValue('purple.700', 'purple.200');

  // Filtering states for the Tile Launcher
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory>('all');
  const [showWhatsAppBot, setShowWhatsAppBot] = useState(false);

  // Fetch data from Convex
  const organizations = useQuery(api.organizations.listOrganizations);
  const { selectedOrganization, user } = useAuth();
  const isConvex = isConvexOrgId(selectedOrganization);

  const currentOrg = useMemo(() => {
    if (!organizations || !selectedOrganization) return null;
    return organizations.find((org: any) => org._id === selectedOrganization);
  }, [organizations, selectedOrganization]);

  // Check if user is a global or super admin
  const globalAdmins = useQuery(api.globalUserManagement.listGlobalAdmins);
  const isGlobalAdmin = globalAdmins && Array.isArray(globalAdmins) && globalAdmins.some(ga => String(ga.user_id) === String(user?.id) && ga.is_active);
  const isSuperAdmin = user?.role === 'super_admin';
  const hasGlobalAdminAccess = isSuperAdmin || isGlobalAdmin;

  // Fetch real dashboard statistics
  const dashboardStats = useQuery(
    api.dashboard.getDashboardStats,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // Fetch recent activity
  const recentActivity = useQuery(
    api.dashboard.getRecentActivity,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // Fetch profit sharing data
  const profitSharingData = useQuery(
    api.profitSharing.getProfitSharingDashboard,
    isConvex ? { organization_id: selectedOrganization as any } : "skip"
  );

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize pull-to-refresh for mobile
  useEffect(() => {
    if (isMobile && containerRef.current && isMobileDevice()) {
      const pullToRefresh = new PullToRefresh(containerRef.current, handleRefresh);
      return () => {
        pullToRefresh.destroy();
      };
    }
  }, [isMobile]);

  // Use real data or fallback to zeros
  const stats = dashboardStats || {
    customers: 0,
    leads: 0,
    inventory: 0,
    quotations: 0,
    revenue: 0,
    growth: 0,
    currency: 'SAR',
  };

  // All 16 ERP modules mapped from the left sidebar into tiles
  const allModules: ModuleTile[] = useMemo(() => [
    // 💼 Sales & CRM
    {
      id: 'customers',
      name: t('navCustomers', 'Customers'),
      category: 'sales',
      categoryLabel: t('catSales', 'Sales & CRM'),
      description: t('descCustomers', 'Manage corporate accounts, credit limits, contacts & directory'),
      icon: FiUsers,
      path: '/customers',
      colorScheme: 'blue',
      gradient: 'linear(to-br, blue.500, blue.700)',
      bgTint: blueBgTint,
      badgeCount: stats.customers,
      badgeLabel: t('navCustomers', 'Accounts'),
      quickActions: [
        { label: t('view', 'All Accounts'), path: '/customers' },
        { label: t('addNew', '+ Add Client'), path: '/customers' },
      ],
    },
    {
      id: 'leads',
      name: t('navLeads', 'Leads & Pipeline'),
      category: 'sales',
      categoryLabel: t('catSales', 'Sales & CRM'),
      description: t('descLeads', 'Track sales pipeline, opportunities, conversion & stages'),
      icon: FiTarget,
      path: '/leads',
      colorScheme: 'teal',
      gradient: 'linear(to-br, teal.500, teal.700)',
      bgTint: tealBgTint,
      badgeCount: stats.leads,
      badgeLabel: t('navLeads', 'Leads'),
      quickActions: [
        { label: t('navLeads', 'Sales Funnel'), path: '/leads' },
        { label: t('addNew', '+ New Lead'), path: '/leads' },
      ],
    },
    {
      id: 'quotations',
      name: t('navQuotations', 'Quotations'),
      category: 'sales',
      categoryLabel: t('catSales', 'Sales & CRM'),
      description: t('descQuotations', 'Generate formal quotations, WBS itemization & track revisions'),
      icon: FiFileText,
      path: '/quotations',
      colorScheme: 'purple',
      gradient: 'linear(to-br, purple.500, purple.700)',
      bgTint: purpleBgTint,
      badgeCount: stats.quotations,
      badgeLabel: t('quotations', 'Quotes'),
      quickActions: [
        { label: t('quotations', 'All Quotes'), path: '/quotations' },
        { label: t('addNew', '+ New Quote'), path: '/quotations' },
      ],
    },
    {
      id: 'delivery-notes',
      name: t('navDeliveryNotes', 'Delivery Notes'),
      category: 'sales',
      categoryLabel: t('catSales', 'Sales & CRM'),
      description: t('descDeliveryNotes', 'Issue delivery notes, track dispatch & shipment handovers'),
      icon: FiFileText,
      path: '/delivery-notes',
      colorScheme: 'cyan',
      gradient: 'linear(to-br, cyan.600, cyan.800)',
      bgTint: cyanBgTint,
      badgeLabel: t('badgeLive', 'Dispatch'),
      quickActions: [
        { label: t('navDeliveryNotes', 'Dispatch Records'), path: '/delivery-notes' },
        { label: t('addNew', '+ New Note'), path: '/delivery-notes' },
      ],
    },
    {
      id: 'invoices',
      name: t('navInvoices', 'Invoices & Billing'),
      category: 'sales',
      categoryLabel: t('catSales', 'Sales & CRM'),
      description: t('descInvoices', 'Issue ZATCA e-invoices, track receivables & payment statuses'),
      icon: FiCreditCard,
      path: '/invoices',
      colorScheme: 'green',
      gradient: 'linear(to-br, green.500, green.700)',
      bgTint: greenBgTint,
      badgeLabel: 'ZATCA Phase-2',
      quickActions: [
        { label: t('navInvoices', 'Tax Invoices'), path: '/invoices' },
        { label: t('addNew', '+ Issue Invoice'), path: '/invoices' },
      ],
    },

    // 📦 Supply Chain & Procurement
    {
      id: 'procurement',
      name: t('navProcurement', 'Procurement Hub'),
      category: 'supply',
      categoryLabel: t('catSupply', 'Supply Chain'),
      description: t('descProcurement', 'Manage Purchase Requisitions (PR), Orders (PO) & Receiving'),
      icon: FiShoppingCart,
      path: '/procurement',
      colorScheme: 'orange',
      gradient: 'linear(to-br, orange.500, orange.700)',
      bgTint: orangeBgTint,
      badgeLabel: 'PR & PO',
      quickActions: [
        { label: 'Requisitions (PR)', path: '/procurement' },
        { label: 'Orders (PO)', path: '/procurement' },
      ],
    },
    {
      id: 'suppliers',
      name: t('navSuppliers', 'Suppliers Directory'),
      category: 'supply',
      categoryLabel: t('catSupply', 'Supply Chain'),
      description: t('descSuppliers', 'Supplier directory, commercial registrations & vendor ratings'),
      icon: FiTruck,
      path: '/suppliers',
      colorScheme: 'yellow',
      gradient: 'linear(to-br, yellow.500, orange.600)',
      bgTint: yellowBgTint,
      badgeLabel: t('badgeLive', 'Active'),
      quickActions: [
        { label: t('navSuppliers', 'Directory'), path: '/suppliers' },
        { label: t('addNew', '+ Add Supplier'), path: '/suppliers' },
      ],
    },
    {
      id: 'inventory',
      name: t('navInventory', 'Inventory & Stock'),
      category: 'supply',
      categoryLabel: t('catSupply', 'Supply Chain'),
      description: t('descInventory', 'Stock catalog, SKU management, low stock alerts & warehouse'),
      icon: FiPackage,
      path: '/inventory',
      colorScheme: 'amber',
      gradient: 'linear(to-br, orange.500, amber.700)',
      bgTint: orangeBgTint,
      badgeCount: stats.inventory,
      badgeLabel: t('inventoryItems', 'Items'),
      quickActions: [
        { label: t('navInventory', 'Stock List'), path: '/inventory' },
        { label: t('addNew', '+ Add Item'), path: '/inventory' },
      ],
    },
    {
      id: 'process-flow',
      name: t('navProcessFlow', 'Intelligent Process Flow'),
      category: 'supply',
      categoryLabel: t('catSupply', 'Supply Chain'),
      description: t('descProcessFlow', 'Intelligent process tracking, workflow automation & alerts'),
      icon: FiZap,
      path: '/intelligent-process-flow',
      colorScheme: 'blue',
      gradient: 'linear(to-br, blue.600, indigo.700)',
      bgTint: blueBgTint,
      badgeLabel: 'AI Engine',
      quickActions: [
        { label: t('navProcessFlow', 'Process Flow'), path: '/intelligent-process-flow' },
      ],
    },
    {
      id: 'procureflow-mail',
      name: 'ProcureFlow Mail & Sourcing',
      category: 'supply',
      categoryLabel: t('catSupply', 'Supply Chain'),
      description: 'Collaborative team email client, supplier RFQ hunting, stage profiles & quotation follow-up radar',
      icon: FiMail,
      path: 'http://localhost:5000',
      colorScheme: 'blue',
      gradient: 'linear(to-br, blue.500, blue.700)',
      bgTint: blueBgTint,
      badgeLabel: 'Live Email • Port 5000',
      quickActions: [
        { label: 'Team Radar', path: 'http://localhost:5000' },
        { label: 'Projects & Sourcing', path: 'http://localhost:5000' },
      ],
    },

    // 🏪 Point of Sale & Retail
    {
      id: 'pos',
      name: t('navQuickPos', 'Quick POS Cashier'),
      category: 'retail',
      categoryLabel: t('catRetail', 'POS & Retail'),
      description: t('descQuickPos', 'Fast cashier checkout, barcode scanning & instant ZATCA receipt'),
      icon: FiShoppingBag,
      path: '/pos',
      colorScheme: 'whatsapp',
      gradient: 'linear(to-br, green.500, teal.700)',
      bgTint: greenBgTint,
      badgeLabel: t('quickActionPos', 'Fast POS'),
      quickActions: [
        { label: t('quickActionPos', 'Open Terminal'), path: '/pos' },
      ],
    },
    {
      id: 'vendors',
      name: t('navVendorsHub', 'Vendors & Stores Hub'),
      category: 'retail',
      categoryLabel: t('catRetail', 'POS & Retail'),
      description: t('descVendorsHub', 'Manage multi-vendor outlets, commission models & store profiles'),
      icon: FaStore,
      path: '/admin/vendors',
      colorScheme: 'pink',
      gradient: 'linear(to-br, pink.500, purple.700)',
      bgTint: pinkBgTint,
      badgeLabel: 'Multi-Store',
      quickActions: [
        { label: t('navVendorsHub', 'Manage Outlets'), path: '/admin/vendors' },
      ],
    },

    // ⚖️ Finance & Corporate Governance
    {
      id: 'accounting',
      name: t('navAccounting', 'Accounting & Ledger'),
      category: 'finance',
      categoryLabel: t('catFinance', 'Finance & Legal'),
      description: t('descAccounting', 'Double-entry bookkeeping, chart of accounts, vouchers & ledger'),
      icon: SaudiRiyalIcon,
      path: '/accounting',
      colorScheme: 'yellow',
      gradient: 'linear(to-br, yellow.600, amber.700)',
      bgTint: yellowBgTint,
      badgeLabel: stats.currency === 'SAR' || !stats.currency ? getCurrencySymbol('SAR') : stats.currency,
      quickActions: [
        { label: t('navAccounting', 'General Ledger'), path: '/accounting' },
        { label: 'Vouchers & Journals', path: '/accounting' },
      ],
    },
    {
      id: 'whatsapp-bot',
      name: 'WhatsApp AI Bot (مساعد واتساب)',
      category: 'finance',
      categoryLabel: t('catFinance', 'Finance & Legal'),
      description: 'Unified enterprise assistant: Snap expense receipts & COC attestations, approve POs, travel cash advances & sign off custody',
      icon: FiMessageSquare,
      path: '#whatsapp-bot',
      colorScheme: 'whatsapp',
      gradient: 'linear(to-br, green.500, teal.700)',
      bgTint: greenBgTint,
      badgeLabel: 'Online AI Agent',
      quickActions: [
        { label: '🤖 Open Bot Assistant', path: '#whatsapp-bot' },
        { label: '📸 Snap Expense Receipt', path: '/profit-sharing/expenses' },
        { label: '📋 Pending Approvals', path: '/pending-approvals' },
      ],
    },
    {
      id: 'governance',
      name: t('navGovernance', 'Corporate Governance'),
      category: 'finance',
      categoryLabel: t('catFinance', 'Finance & Legal'),
      description: t('descGovernance', 'Board meetings, resolutions, shareholder register & compliance'),
      icon: FiShield,
      path: '/governance',
      colorScheme: 'indigo',
      gradient: 'linear(to-br, indigo.500, blue.800)',
      bgTint: indigoBgTint,
      badgeLabel: 'Corporate',
      quickActions: [
        { label: t('navGovernance', 'Resolutions'), path: '/governance' },
        { label: 'Shareholder Register', path: '/governance' },
      ],
    },
    {
      id: 'profit-sharing',
      name: t('navProfitSharing', 'Profit Sharing'),
      category: 'finance',
      categoryLabel: t('catFinance', 'Finance & Legal'),
      description: t('descProfitSharing', 'Net profit distribution, partner equity & sponsor allocation'),
      icon: FiCreditCard,
      path: '/profit-sharing',
      colorScheme: 'teal',
      gradient: 'linear(to-br, teal.500, green.700)',
      bgTint: tealBgTint,
      badgeLabel: profitSharingData
        ? `${profitSharingData.total_profit?.toLocaleString() || 0} ${getCurrencySymbol('SAR')}`
        : 'Distributions',
      quickActions: [
        { label: t('navProfitSharing', 'Distributions'), path: '/profit-sharing' },
        { label: t('saudiSponsor', 'Sponsor Pool'), path: '/profit-sharing' },
      ],
    },
    {
      id: 'hr',
      name: t('navHr', 'HR & Workforce (الموارد البشرية)'),
      category: 'finance',
      categoryLabel: t('catFinance', 'Finance & Legal'),
      description: t('descHr', 'Saudi Labor Law, GOSI, restricted ERP access & WhatsApp sign-offs'),
      icon: FiUsers,
      path: '/hr',
      colorScheme: 'purple',
      gradient: 'linear(to-br, purple.500, indigo.700)',
      bgTint: purpleBgTint,
      badgeLabel: 'KSA WPS / مُدد',
      quickActions: [
        { label: t('navHr', 'Workforce Directory'), path: '/hr' },
        { label: 'WPS Payroll & SIF', path: '/hr' },
      ],
    },
    {
      id: 'assets',
      name: t('navAssets', 'Assets & Custody (العهد والأصول)'),
      category: 'finance',
      categoryLabel: t('catFinance', 'Finance & Legal'),
      description: t('descAssets', 'Company equipment custody, fleet vehicle Istimara/Fahas inspection & handover slips'),
      icon: FiLayers,
      path: '/assets',
      colorScheme: 'teal',
      gradient: 'linear(to-br, teal.500, cyan.700)',
      bgTint: tealBgTint,
      badgeLabel: 'Custody & Fleet',
      quickActions: [
        { label: 'Asset Catalog', path: '/assets' },
        { label: 'Vehicle Fleet', path: '/assets' },
      ],
    },

    // ⚙️ Operations & Administration
    {
      id: 'settings',
      name: t('navSettings', 'System Settings'),
      category: 'system',
      categoryLabel: t('catSystem', 'System & Admin'),
      description: t('descSettings', 'Company info, ZATCA Phase-2, tax rates & user preferences'),
      icon: FiSettings,
      path: '/settings',
      colorScheme: 'gray',
      gradient: 'linear(to-br, gray.600, gray.800)',
      bgTint: grayBgTint,
      badgeLabel: 'Configuration',
      quickActions: [
        { label: t('navSettings', 'Company Info'), path: '/settings' },
        { label: 'ZATCA & Tax', path: '/settings' },
      ],
    },
    ...(hasGlobalAdminAccess ? [{
      id: 'global-admin',
      name: t('navGlobalAdmin', 'Global Admin Portal'),
      category: 'system' as const,
      categoryLabel: t('catSystem', 'System & Admin'),
      description: t('descGlobalAdmin', 'Multi-tenant administration, organization setup & global access'),
      icon: FiShield,
      path: '/admin/global',
      colorScheme: 'red',
      gradient: 'linear(to-br, red.500, red.800)',
      bgTint: redBgTint,
      badgeLabel: 'SuperAdmin',
      quickActions: [
        { label: t('navGlobalAdmin', 'Multi-Tenant Setup'), path: '/admin/global' },
      ],
      adminOnly: true,
    }] : []),
  ], [t, stats, profitSharingData, hasGlobalAdminAccess, blueBgTint, tealBgTint, purpleBgTint, cyanBgTint, greenBgTint, orangeBgTint, yellowBgTint, pinkBgTint, indigoBgTint, grayBgTint, redBgTint]);

  // Filter modules by category and search keyword
  const filteredModules = useMemo(() => {
    return allModules.filter(module => {
      const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        module.name.toLowerCase().includes(q) ||
        module.description.toLowerCase().includes(q) ||
        module.categoryLabel.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [allModules, selectedCategory, searchQuery]);

  // Category tab definitions
  const categories: Array<{ id: ModuleCategory; label: string; count: number }> = useMemo(() => [
    { id: 'all', label: t('hubCatAll', t('catAll', 'All Modules')), count: allModules.length },
    { id: 'sales', label: t('catSales', 'Sales & CRM'), count: allModules.filter(m => m.category === 'sales').length },
    { id: 'supply', label: t('catSupply', 'Supply Chain'), count: allModules.filter(m => m.category === 'supply').length },
    { id: 'retail', label: t('catRetail', 'POS & Retail'), count: allModules.filter(m => m.category === 'retail').length },
    { id: 'finance', label: t('catFinance', 'Finance & Legal'), count: allModules.filter(m => m.category === 'finance').length },
    { id: 'system', label: t('catSystem', 'System & Admin'), count: allModules.filter(m => m.category === 'system').length },
  ], [allModules, t]);

  const ArrowIcon = isRtl ? FiArrowLeft : FiArrowRight;

  return (
    <Box
      ref={containerRef}
      overflowY="auto"
      maxH={isMobile ? "100vh" : "auto"}
      position="relative"
      dir={dir}
      pb={12}
    >
      <VStack spacing={{ base: 5, md: 7 }} align="stretch">
        {/* ======================================================== */}
        {/* EXECUTIVE HERO BANNER & SEARCH                           */}
        {/* ======================================================== */}
        <Card
          bg={cardBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="2xl"
          overflow="hidden"
          boxShadow="sm"
          position="relative"
        >
          {/* Subtle decorative top accent bar */}
          <Box h="4px" bgGradient="linear(to-r, blue.500, teal.400, purple.500)" />
          
          <CardBody p={{ base: 4, md: 6, lg: 7 }}>
            <Flex
              direction={{ base: 'column', lg: 'row' }}
              justify="space-between"
              align={{ base: 'stretch', lg: 'center' }}
              gap={5}
            >
              {/* Left Title & Status */}
              <VStack align="flex-start" spacing={2}>
                <HStack spacing={2} wrap="wrap">
                  <Badge
                    colorScheme="blue"
                    variant="subtle"
                    px={2.5}
                    py={0.5}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    Enterprise Suite
                  </Badge>
                  {currentOrg?.name && (
                    <Badge
                      colorScheme="purple"
                      variant="outline"
                      px={2.5}
                      py={0.5}
                      borderRadius="full"
                      fontSize="xs"
                    >
                      🏢 {currentOrg.name}
                    </Badge>
                  )}
                  <HStack spacing={1.5} color="green.500" fontSize="xs" fontWeight="semibold">
                    <Box w={2} h={2} borderRadius="full" bg="green.500" />
                    <Text>{t('systemStatus', 'Cloud Operational')}</Text>
                  </HStack>
                </HStack>

                <Heading size={{ base: 'lg', md: 'xl' }} letterSpacing="tight">
                  {user?.firstName ? (
                    `${t('dashWelcome', 'Welcome back')}, ${user.firstName}`
                  ) : (
                    t('brandTitle', 'Trading ERP System')
                  )}
                </Heading>

                <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
                  {t('hubSubtitle', 'Unified Enterprise Operations & Intelligent Management Hub')}
                </Text>
              </VStack>

              {/* Right Search Command Bar */}
              <Box minW={{ base: '100%', md: '360px', lg: '400px' }}>
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FiSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder={t('hubSearchPlaceholder', 'Search modules or shortcuts (e.g. Quotes, PO, POS)...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    borderRadius="xl"
                    bg={searchInputBg}
                    borderColor={borderColor}
                    _focus={{
                      borderColor: 'blue.500',
                      boxShadow: '0 0 0 1px #3182ce',
                    }}
                    fontSize="sm"
                  />
                  {searchQuery && (
                    <InputRightElement>
                      <IconButton
                        aria-label="Clear search"
                        icon={<FiX />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setSearchQuery('')}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>
              </Box>
            </Flex>
          </CardBody>
        </Card>

        {/* ======================================================== */}
        {/* EXECUTIVE KPI PERFORMANCE RIBBON                         */}
        {/* ======================================================== */}
        <SimpleGrid columns={{ base: 2, sm: 2, md: 3, lg: 6 }} spacing={{ base: 3, md: 4 }}>
          {/* Revenue */}
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={3.5}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                {t('monthlyRevenue', 'Revenue')}
              </Text>
              <Icon as={SaudiRiyalIcon} color="green.500" boxSize={4} />
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {Math.round(stats.revenue).toLocaleString()}
              <Text as="span" fontSize="xs" fontWeight="normal" color="gray.500" mx={1}>
                {stats.currency === 'SAR' || !stats.currency
                  ? <Icon as={SaudiRiyalIcon} boxSize="0.8em" verticalAlign="-0.08em" />
                  : stats.currency}
              </Text>
            </Text>
          </Card>

          {/* Customers */}
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={3.5}
            cursor="pointer"
            onClick={() => navigate('/customers')}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md', borderColor: 'blue.300' }}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                {t('totalCustomers', 'Customers')}
              </Text>
              <Icon as={FiUsers} color="blue.500" boxSize={4} />
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              {stats.customers.toLocaleString()}
            </Text>
          </Card>

          {/* Leads */}
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={3.5}
            cursor="pointer"
            onClick={() => navigate('/leads')}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md', borderColor: 'teal.300' }}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                {t('activeLeads', 'Active Leads')}
              </Text>
              <Icon as={FiTarget} color="teal.500" boxSize={4} />
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="teal.600">
              {stats.leads.toLocaleString()}
            </Text>
          </Card>

          {/* Quotations */}
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={3.5}
            cursor="pointer"
            onClick={() => navigate('/quotations')}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md', borderColor: 'purple.300' }}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                {t('quotations', 'Quotations')}
              </Text>
              <Icon as={FiFileText} color="purple.500" boxSize={4} />
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="purple.600">
              {stats.quotations.toLocaleString()}
            </Text>
          </Card>

          {/* Inventory */}
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={3.5}
            cursor="pointer"
            onClick={() => navigate('/inventory')}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md', borderColor: 'orange.300' }}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                {t('inventoryItems', 'Inventory')}
              </Text>
              <Icon as={FiPackage} color="orange.500" boxSize={4} />
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="orange.600">
              {stats.inventory.toLocaleString()}
            </Text>
          </Card>

          {/* Profit Sharing */}
          <Card
            bg={cardBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="xl"
            p={3.5}
            cursor="pointer"
            onClick={() => navigate('/profit-sharing')}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', shadow: 'md', borderColor: 'green.300' }}
          >
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                {t('totalProfit', 'Net Profit')}
              </Text>
              <Icon as={FiTrendingUp} color="green.500" boxSize={4} />
            </HStack>
            <Text fontSize="lg" fontWeight="bold" color="green.600">
              {profitSharingData
                ? Math.round(profitSharingData.total_profit || 0).toLocaleString()
                : '0'}
              <Text as="span" fontSize="xs" fontWeight="normal" color="gray.500" mx={1}>
                <Icon as={SaudiRiyalIcon} boxSize="0.8em" verticalAlign="-0.08em" />
              </Text>
            </Text>
          </Card>
        </SimpleGrid>

        {/* ======================================================== */}
        {/* CATEGORY FILTER TABS                                     */}
        {/* ======================================================== */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align={{ base: 'flex-start', md: 'center' }}
          gap={3}
          wrap="wrap"
        >
          <HStack spacing={2} wrap="wrap" overflowX="auto" py={1} maxW="100%">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={isSelected ? 'solid' : 'outline'}
                  colorScheme={isSelected ? 'blue' : 'gray'}
                  borderRadius="full"
                  px={3.5}
                  fontSize="xs"
                  fontWeight={isSelected ? 'bold' : 'medium'}
                  onClick={() => setSelectedCategory(cat.id)}
                  rightIcon={
                    <Badge
                      colorScheme={isSelected ? 'whiteAlpha' : 'gray'}
                      borderRadius="full"
                      fontSize="2xs"
                      px={1.5}
                    >
                      {cat.count}
                    </Badge>
                  }
                >
                  {cat.label}
                </Button>
              );
            })}
          </HStack>

          <Text fontSize="xs" color="gray.500" fontWeight="medium">
            {t('viewAllRecords', 'Showing')} {filteredModules.length} {t('hubCatAll', 'Modules')}
          </Text>
        </Flex>

        {/* ======================================================== */}
        {/* MODULE TILES GRID (ENTERPRISE APP LAUNCHER)              */}
        {/* ======================================================== */}
        <SimpleGrid
          columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
          spacing={{ base: 4, md: 5, lg: 6 }}
        >
          {filteredModules.map((module) => {
            const TileIcon = module.icon;
            return (
              <Card
                key={module.id}
                bg={cardBg}
                border="1px solid"
                borderColor={borderColor}
                borderRadius="2xl"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                cursor="pointer"
                position="relative"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: '0 14px 28px -4px rgba(0, 0, 0, 0.1), 0 6px 12px -2px rgba(0, 0, 0, 0.05)',
                  borderColor: `${module.colorScheme}.400`,
                }}
                onClick={() => {
                  if (module.path === '#whatsapp-bot') {
                    setShowWhatsAppBot(true);
                  } else if (module.path.startsWith('http')) {
                    window.open(module.path, '_blank');
                  } else {
                    navigate(module.path);
                  }
                }}
              >
                {/* Top Tile Header */}
                <CardHeader p={5} pb={3}>
                  <Flex justify="space-between" align="center" mb={4}>
                    {/* Domain Category Tag */}
                    <Badge
                      colorScheme={module.colorScheme}
                      variant="subtle"
                      borderRadius="md"
                      px={2}
                      py={0.5}
                      fontSize="2xs"
                      fontWeight="bold"
                      className={module.id === 'accounting' || module.id === 'profit-sharing' ? 'procurement-currency-sar' : undefined}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      {module.categoryLabel}
                    </Badge>

                    {/* Live Metric / Status Badge */}
                    {(module.badgeCount !== undefined || module.badgeLabel) && (
                      <Badge
                        colorScheme={module.colorScheme}
                        variant="solid"
                        borderRadius="full"
                        px={2.5}
                        py={0.5}
                        fontSize="2xs"
                        fontWeight="bold"
                      >
                        {module.badgeCount !== undefined
                          ? `${typeof module.badgeCount === 'number' ? module.badgeCount.toLocaleString() : module.badgeCount} ${module.badgeLabel || ''}`
                          : module.badgeLabel}
                      </Badge>
                    )}
                  </Flex>

                  {/* Icon & Title */}
                  <HStack spacing={3.5} align="center">
                    <Box
                      p={3}
                      bgGradient={module.gradient}
                      color="white"
                      borderRadius="xl"
                      minW="48px"
                      minH="48px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="sm"
                    >
                      <Icon as={TileIcon} boxSize={5} />
                    </Box>

                    <VStack align="flex-start" spacing={0.5} flex="1">
                      <Heading size="sm" fontWeight="bold" noOfLines={1}>
                        {module.name}
                      </Heading>
                      <Text fontSize="xs" color="gray.500" noOfLines={2}>
                        {module.description}
                      </Text>
                    </VStack>
                  </HStack>
                </CardHeader>

                {/* Body: Direct Shortcut Chips */}
                <CardBody px={5} py={2}>
                  {module.quickActions && module.quickActions.length > 0 && (
                    <HStack spacing={1.5} wrap="wrap">
                      {module.quickActions.map((qa, idx) => (
                        <Button
                          key={idx}
                          size="xs"
                          variant="ghost"
                          bg={chipBg}
                          color={chipColor}
                          _hover={{
                            bg: `${module.colorScheme}.100`,
                            color: `${module.colorScheme}.800`,
                          }}
                          borderRadius="md"
                          fontSize="2xs"
                          px={2}
                          py={1}
                          h="auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (qa.path === '#whatsapp-bot') {
                              setShowWhatsAppBot(true);
                            } else if (qa.path.startsWith('http')) {
                              window.open(qa.path, '_blank');
                            } else {
                              navigate(qa.path);
                            }
                          }}
                        >
                          {qa.label}
                        </Button>
                      ))}
                    </HStack>
                  )}
                </CardBody>

                {/* Footer: Open Module Button */}
                <CardFooter p={5} pt={3}>
                  <Button
                    w="full"
                    size="sm"
                    variant="ghost"
                    colorScheme={module.colorScheme}
                    justifyContent="space-between"
                    borderRadius="lg"
                    rightIcon={<Icon as={ArrowIcon} />}
                    _groupHover={{
                      bg: `${module.colorScheme}.50`,
                    }}
                  >
                    <Text fontSize="xs" fontWeight="semibold">
                      {t('openModule', 'Open Module')}
                    </Text>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </SimpleGrid>

        {/* ======================================================== */}
        {/* RECENT OPERATIONAL ACTIVITY & INTELLIGENT FLOW           */}
        {/* ======================================================== */}
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={{ base: 5, md: 6 }}>
          {/* Recent Activity Card */}
          <GridItem>
            <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="2xl">
              <CardHeader pb={3}>
                <Flex justify="space-between" align="center">
                  <HStack spacing={2}>
                    <Icon as={FiActivity} color="blue.500" />
                    <Heading size="sm">{t('recentActivity', 'Recent Activity Stream')}</Heading>
                  </HStack>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleRefresh}
                    isLoading={isRefreshing}
                  >
                    {t('refresh', 'Refresh')}
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody pt={2}>
                <VStack spacing={3} align="stretch">
                  {recentActivity && recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity, index) => (
                      <HStack
                        key={index}
                        justify="space-between"
                        p={3}
                        borderRadius="xl"
                        bg={activityItemBg}
                        transition="all 0.2s"
                        _hover={{ bg: activityItemHoverBg }}
                      >
                        <VStack align="flex-start" spacing={0.5}>
                          <Text fontWeight="semibold" fontSize="sm">
                            {activity.title}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {activity.description}
                          </Text>
                        </VStack>
                        <Badge
                          colorScheme={
                            activity.status === "New" ? "green" :
                            activity.status === "Updated" ? "blue" :
                            activity.status === "Generated" ? "purple" : "orange"
                          }
                          fontSize="xs"
                          borderRadius="md"
                          px={2}
                          py={0.5}
                        >
                          {activity.status}
                        </Badge>
                      </HStack>
                    ))
                  ) : (
                    <Box py={6} textAlign="center">
                      <Icon as={FiClock} color="gray.400" boxSize={8} mb={2} />
                      <Text color="gray.500" fontSize="sm">
                        {t('noRecentActivity', 'No recent operational activity recorded')}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Intelligent Process Flow Summary */}
          <GridItem>
            <Card
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="2xl"
              cursor="pointer"
              onClick={() => navigate('/intelligent-process-flow')}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'md' }}
            >
              <CardHeader pb={3}>
                <HStack justify="space-between">
                  <HStack spacing={2}>
                    <Icon as={FiZap} color="purple.500" />
                    <Heading size="sm">{t('navProcessFlow', 'Process Flow AI')}</Heading>
                  </HStack>
                  <Icon as={ArrowIcon} color="gray.400" />
                </HStack>
              </CardHeader>
              <CardBody pt={2}>
                <VStack spacing={3} align="stretch">
                  <HStack
                    justify="space-between"
                    p={2.5}
                    borderRadius="lg"
                    bg={pfBlueBg}
                  >
                    <Text fontSize="xs" fontWeight="medium" color={pfBlueColor}>
                      {t('activeProcesses', 'Active Workflows')}
                    </Text>
                    <Badge colorScheme="blue" borderRadius="full">0</Badge>
                  </HStack>

                  <HStack
                    justify="space-between"
                    p={2.5}
                    borderRadius="lg"
                    bg={pfGreenBg}
                  >
                    <Text fontSize="xs" fontWeight="medium" color={pfGreenColor}>
                      {t('completedToday', 'Completed Today')}
                    </Text>
                    <Badge colorScheme="green" borderRadius="full">0</Badge>
                  </HStack>

                  <HStack
                    justify="space-between"
                    p={2.5}
                    borderRadius="lg"
                    bg={pfOrangeBg}
                  >
                    <Text fontSize="xs" fontWeight="medium" color={pfOrangeColor}>
                      {t('pendingActions', 'Pending Actions')}
                    </Text>
                    <Badge colorScheme="orange" borderRadius="full">0</Badge>
                  </HStack>

                  <HStack
                    justify="space-between"
                    p={2.5}
                    borderRadius="lg"
                    bg={pfPurpleBg}
                  >
                    <Text fontSize="xs" fontWeight="medium" color={pfPurpleColor}>
                      {t('aiRecommendations', 'AI Insights')}
                    </Text>
                    <Badge colorScheme="purple" borderRadius="full">0</Badge>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </VStack>

      {/* WhatsApp Multi-Module AI Assistant Drawer */}
      <WhatsAppExpenseBotDrawer
        isOpen={showWhatsAppBot}
        onClose={() => setShowWhatsAppBot(false)}
        organizationId={selectedOrganization || ''}
        currentUser={user}
      />
    </Box>
  );
};

export default DashboardScreen;
