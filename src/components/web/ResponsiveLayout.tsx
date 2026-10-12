import React, { useMemo } from 'react';
import {
  Box,
  Flex,
  useDisclosure,
  IconButton,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
  HStack,
  Text,
  Heading,
  useBreakpointValue,
  Button,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuGroup,
  MenuDivider,
  Divider,
  useColorModeValue,
  useToast,
  Badge,
  Card,
  Select,
  Icon,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuth } from '../../contexts/shared/AuthContext';
import { useLanguage } from '../../contexts/shared/LanguageContext';
import OrganizationSelector from '../OrganizationSelector';
import MobileBottomNav from '../MobileBottomNav';
import { vendorAuthService } from '../../services/vendorAuthService';
import {
  FiHome,
  FiUsers,
  FiTarget,
  FiPackage,
  FiFileText,
  FiSettings,
  FiZap,
  FiChevronDown,
  FiTruck,
  FiCreditCard,
  FiLogOut,
  FiUser,
  FiShield,
  FiShoppingCart,
  FiShoppingBag,
  FiGrid,
  FiLayers,
  FiCheck,
  FiBriefcase,
  FiArrowLeft,
  FiArrowRight,
} from 'react-icons/fi';
import { FaStore } from 'react-icons/fa';
import { SaudiRiyalIcon } from '../icons/SaudiRiyalIcon';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

interface NavSection {
  titleKey: string;
  defaultTitle: string;
  items: Array<{
    name: string;
    icon: any;
    path: string;
    adminOnly?: boolean;
  }>;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    logout,
    loading: authLoading,
    selectedOrganization,
    setSelectedOrganization,
    activeVendor,
  } = useAuth();
  const {
    currentLanguage,
    setLanguage,
    isRtl,
    dir,
    activeLangConfig,
    supportedLanguages,
    t,
  } = useLanguage();
  const toast = useToast();

  // Query organizations for the Header Organization Switcher
  const allOrganizations = useQuery(api.organizations.listOrganizations);
  const isConvexUser = Boolean(
    user?.id &&
    !activeVendor &&
    user?.role !== 'vendor' &&
    !user.id.startsWith('vendor_') &&
    !user.id.startsWith('vnd_') &&
    user.id !== 'local-demo-user'
  );
  const userOrganizations = useQuery(
    api.globalUserManagement.getUserOrganizationAssignments,
    isConvexUser ? { user_id: user?.id as any } : 'skip'
  );
  const switchOrganizationMutation = useMutation(api.globalUserManagement.switchUserPrimaryOrganization);

  // Compute effective organization list
  const effectiveOrganizations = useMemo(() => {
    if (userOrganizations && userOrganizations.length > 0) {
      return userOrganizations;
    }
    if (allOrganizations && allOrganizations.length > 0) {
      return allOrganizations.map(org => ({
        organization_id: org._id,
        organization_name: org.name_arabic ? `${org.name} (${org.name_arabic})` : org.name,
        role: (user?.role || 'admin').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        is_primary: org._id === selectedOrganization,
        is_active: org.is_active ?? true,
        organization_currency: org.currency || 'SAR',
      }));
    }
    return [];
  }, [userOrganizations, allOrganizations, selectedOrganization, user?.role]);

  const currentOrgData = useMemo(() => {
    return effectiveOrganizations.find(o => o.organization_id === selectedOrganization);
  }, [effectiveOrganizations, selectedOrganization]);

  const handleOrgSwitch = async (orgId: string) => {
    setSelectedOrganization(orgId);
    try {
      localStorage.setItem('trading-erp-organization', orgId);
    } catch (e) {
      console.warn('Failed to save organization to localStorage:', e);
    }
    if (isConvexUser && user?.id) {
      try {
        await switchOrganizationMutation({
          user_id: user.id as any,
          organization_id: orgId as any,
        });
      } catch (err) {
        console.warn('Failed to persist primary org switch:', err);
      }
    }
    toast({
      title: 'Organization Switched',
      status: 'info',
      duration: 1500,
      isClosable: true,
    });
  };

  // Check if user is a global admin or super admin
  const globalAdmins = useQuery(api.globalUserManagement.listGlobalAdmins);
  const isGlobalAdmin = globalAdmins && Array.isArray(globalAdmins) && globalAdmins.some(ga => String(ga.user_id) === String(user?.id) && ga.is_active);
  const isSuperAdmin = user?.role === 'super_admin';
  const hasGlobalAdminAccess = isSuperAdmin || isGlobalAdmin;

  // Responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Color mode values (hoisted to top level)
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const menuActiveBg = useColorModeValue('blue.50', 'blue.900');
  const hoverGrayBg = useColorModeValue('gray.50', 'gray.700');
  const cardSubtleBg = useColorModeValue('gray.50', 'gray.700');
  const pageBg = useColorModeValue('gray.50', 'gray.900');
  const bannerBlueText = useColorModeValue('blue.700', 'blue.200');

  // Grouped Navigation Sections (used in Header Quick Launcher & Mobile Drawer)
  const navSections: NavSection[] = useMemo(() => [
    {
      titleKey: 'catSales',
      defaultTitle: 'Sales & CRM',
      items: [
        { name: t('navCustomers', 'Customers'), icon: FiUsers, path: '/customers' },
        { name: t('navLeads', 'Leads & Pipeline'), icon: FiTarget, path: '/leads' },
        { name: t('navQuotations', 'Quotations'), icon: FiFileText, path: '/quotations' },
        { name: t('navDeliveryNotes', 'Delivery Notes'), icon: FiFileText, path: '/delivery-notes' },
        { name: t('navInvoices', 'Invoices & Billing'), icon: FiCreditCard, path: '/invoices' },
      ],
    },
    {
      titleKey: 'catSupply',
      defaultTitle: 'Supply Chain',
      items: [
        { name: t('navProcurement', 'Procurement Hub'), icon: FiShoppingCart, path: '/procurement' },
        { name: t('navSuppliers', 'Suppliers Directory'), icon: FiTruck, path: '/suppliers' },
        { name: t('navInventory', 'Inventory & Stock'), icon: FiPackage, path: '/inventory' },
        { name: t('navProcessFlow', 'Process Flow AI'), icon: FiZap, path: '/intelligent-process-flow' },
      ],
    },
    {
      titleKey: 'catRetail',
      defaultTitle: 'POS & Retail',
      items: [
        { name: t('navQuickPos', 'Quick POS (كاشير)'), icon: FiShoppingBag, path: '/pos' },
        { name: t('navVendorsHub', 'Vendors Hub (المتاجر)'), icon: FaStore, path: '/admin/vendors' },
      ],
    },
    {
      titleKey: 'catFinance',
      defaultTitle: 'Finance & Governance',
      items: [
        { name: t('navAccounting', 'Accounting'), icon: SaudiRiyalIcon, path: '/accounting' },
        { name: t('navGovernance', 'Corporate Governance'), icon: FiShield, path: '/governance' },
        { name: t('navProfitSharing', 'Profit Sharing'), icon: FiCreditCard, path: '/profit-sharing' },
        { name: t('navHr', 'HR & Workforce'), icon: FiUsers, path: '/hr' },
        { name: t('navAssets', 'Assets & Custody (العهد والأصول)'), icon: FiLayers, path: '/assets' },
      ],
    },
    {
      titleKey: 'catSystem',
      defaultTitle: 'System & Admin',
      items: [
        { name: t('navSettings', 'Settings'), icon: FiSettings, path: '/settings' },
        ...(hasGlobalAdminAccess
          ? [{ name: t('navGlobalAdmin', 'Global Admin'), icon: FiShield, path: '/admin/global', adminOnly: true }]
          : []),
      ],
    },
  ], [t, hasGlobalAdminAccess]);

  // Determine current active module from route
  const currentModule = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return null;
    for (const section of navSections) {
      const match = section.items.find(item => item.path === path || (item.path !== '/' && path.startsWith(item.path)));
      if (match) {
        return {
          ...match,
          sectionKey: section.titleKey,
          sectionTitle: section.defaultTitle,
        };
      }
    }
    return null;
  }, [location.pathname, navSections]);

  if (authLoading) {
    return (
      <Box p={8}>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Loading...</Heading>
            <Text color="gray.600">Initializing application...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  // Header Component
  const Header = () => (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px={{ base: 3, md: 5, lg: 6 }}
      py={2.5}
      h="64px"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={30}
      boxShadow="sm"
    >
      {/* Left: Brand Identity + Navigation Hub Shortcuts */}
      <HStack spacing={{ base: 2, md: 3 }}>
        {isMobile && (
          <IconButton
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            variant="ghost"
            size="sm"
          />
        )}

        {/* Brand Logo & Title */}
        <HStack
          spacing={2.5}
          cursor="pointer"
          onClick={() => navigate('/')}
          userSelect="none"
          mr={{ base: 1, md: 2 }}
        >
          <Box
            p={2}
            bgGradient="linear(to-br, blue.600, blue.700)"
            color="white"
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="sm"
          >
            <Icon as={FiGrid} boxSize={4} />
          </Box>
          <VStack align="flex-start" spacing={0}>
            <Heading size="sm" color="blue.600" fontWeight="extrabold" letterSpacing="tight">
              {t('brandTitle', 'Trading ERP')}
            </Heading>
            {!isMobile && (
              <Text fontSize="2xs" color="gray.400" fontWeight="semibold">
                Enterprise Operations
              </Text>
            )}
          </VStack>
        </HStack>

        {/* Desktop Hub / Back to Dashboard Button */}
        {!isMobile && (
          <Button
            size="sm"
            variant={location.pathname === '/' ? 'solid' : 'outline'}
            colorScheme="blue"
            leftIcon={<Icon as={location.pathname === '/' ? FiGrid : (isRtl ? FiArrowRight : FiArrowLeft)} />}
            borderRadius="lg"
            px={3}
            fontSize="xs"
            fontWeight="bold"
            onClick={() => navigate('/')}
            _hover={{
              bg: menuActiveBg,
            }}
          >
            {location.pathname === '/'
              ? t('navDashboard', 'Operations Hub')
              : t('backToDashboard', 'Back to Dashboard')}
          </Button>
        )}

        {/* Desktop Quick Modules Menu Dropdown */}
        {!isMobile && (
          <Menu placement="bottom-start">
            <MenuButton
              as={Button}
              size="sm"
              variant="outline"
              borderColor={borderColor}
              leftIcon={<Icon as={FiLayers} />}
              rightIcon={<Icon as={FiChevronDown} />}
              borderRadius="lg"
              px={3}
              fontSize="xs"
              _hover={{ bg: hoverGrayBg }}
            >
              {t('quickShortcuts', 'Modules')}
            </MenuButton>
            <MenuList
              zIndex={100}
              shadow="2xl"
              borderRadius="xl"
              p={2}
              maxH="82vh"
              overflowY="auto"
              minW="280px"
            >
              <MenuItem
                icon={<FiHome />}
                onClick={() => navigate('/')}
                fontWeight="bold"
                color="blue.600"
                borderRadius="md"
              >
                {t('navDashboard', 'Operations Hub (Landing Page)')}
              </MenuItem>
              <MenuDivider />

              {navSections.map((sec, sIdx) => (
                <MenuGroup
                  key={sIdx}
                  title={t(sec.titleKey, sec.defaultTitle)}
                  fontSize="2xs"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color="gray.400"
                >
                  {sec.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <MenuItem
                        key={item.path}
                        icon={<ItemIcon />}
                        onClick={() => navigate(item.path)}
                        bg={isActive ? menuActiveBg : undefined}
                        color={isActive ? 'blue.600' : undefined}
                        fontWeight={isActive ? 'bold' : 'normal'}
                        borderRadius="md"
                        fontSize="xs"
                        py={2}
                      >
                        {item.name}
                      </MenuItem>
                    );
                  })}
                </MenuGroup>
              ))}
            </MenuList>
          </Menu>
        )}
      </HStack>

      {/* Right: Organization Switcher + Language Selector + User Profile */}
      <HStack spacing={{ base: 1.5, md: 2.5 }}>
        {/* Header Organization Switcher Dropdown */}
        {activeVendor || user?.role === 'vendor' ? (
          <Button
            size="sm"
            colorScheme="teal"
            variant="subtle"
            borderRadius="lg"
            fontSize="xs"
            leftIcon={<Icon as={FiBriefcase} />}
            onClick={() => {
              vendorAuthService.endVendorSession();
              localStorage.removeItem('trading_erp_active_vendor_session');
              if (allOrganizations && allOrganizations.length > 0) {
                const targetOrg = allOrganizations[0]._id;
                setSelectedOrganization(targetOrg);
                localStorage.setItem('trading-erp-organization', targetOrg);
              }
              window.location.reload();
            }}
          >
            {!isMobile && (activeVendor?.storeName || 'Vendor POS')}
          </Button>
        ) : (
          effectiveOrganizations.length > 0 && (
            <Menu placement="bottom-end">
              <MenuButton
                as={Button}
                size="sm"
                variant="outline"
                borderColor={borderColor}
                borderRadius="lg"
                px={2.5}
                h="34px"
                rightIcon={<Icon as={FiChevronDown} />}
                _hover={{ bg: hoverGrayBg }}
              >
                <HStack spacing={1.5}>
                  <Text fontSize="xs">🏢</Text>
                  <Text fontSize="xs" fontWeight="bold" maxW={{ base: '90px', sm: '140px', md: '180px' }} isTruncated>
                    {currentOrgData?.organization_name || t('activeVendor', 'Organization')}
                  </Text>
                </HStack>
              </MenuButton>
              <MenuList zIndex={100} shadow="xl" borderRadius="xl" minW="260px" p={2}>
                <Box px={3} py={1.5} mb={1}>
                  <Text fontSize="2xs" fontWeight="bold" textTransform="uppercase" color="gray.400">
                    Switch Organization / تبديل المنشأة
                  </Text>
                </Box>
                {effectiveOrganizations.map((org) => {
                  const isSelected = org.organization_id === selectedOrganization;
                  return (
                    <MenuItem
                      key={org.organization_id}
                      onClick={() => handleOrgSwitch(org.organization_id)}
                      borderRadius="md"
                      py={2}
                      bg={isSelected ? menuActiveBg : undefined}
                      color={isSelected ? 'blue.600' : undefined}
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      <HStack justify="space-between" w="full">
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="xs" fontWeight="semibold" isTruncated>
                            {org.organization_name}
                          </Text>
                          <Text fontSize="2xs" color="gray.400">
                            {org.role} • {org.organization_currency || 'SAR'}
                          </Text>
                        </VStack>
                        {isSelected && <Icon as={FiCheck} color="blue.600" />}
                      </HStack>
                    </MenuItem>
                  );
                })}
              </MenuList>
            </Menu>
          )
        )}

        {/* Universal Language Selector Dropdown */}
        <Menu placement="bottom-end">
          <MenuButton
            as={Button}
            variant="outline"
            size="sm"
            px={2.5}
            h="34px"
            borderRadius="lg"
            borderColor={borderColor}
            rightIcon={<Icon as={FiChevronDown} />}
            title={t('selectLanguage', 'Select System Language')}
            _hover={{ bg: hoverGrayBg }}
          >
            <HStack spacing={1.5}>
              <Text fontSize="sm">{activeLangConfig.flag}</Text>
              {!isMobile && (
                <Text fontSize="xs" fontWeight="bold">
                  {activeLangConfig.nativeName}
                </Text>
              )}
            </HStack>
          </MenuButton>
          <MenuList zIndex={100} shadow="xl" borderRadius="xl" minW="210px" py={1}>
            {supportedLanguages.map((lang) => (
              <MenuItem
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  toast({
                    title: `${lang.flag} ${lang.nativeName}`,
                    description: lang.code === 'ar' ? 'تم تحويل لغة النظام بنجاح' : `Switched system language to ${lang.name}`,
                    status: 'info',
                    duration: 1500,
                    isClosable: true,
                  });
                }}
                fontWeight={currentLanguage === lang.code ? 'bold' : 'normal'}
                bg={currentLanguage === lang.code ? menuActiveBg : undefined}
                color={currentLanguage === lang.code ? 'blue.600' : undefined}
                py={2}
              >
                <HStack justify="space-between" w="full">
                  <HStack spacing={2}>
                    <Text fontSize="md">{lang.flag}</Text>
                    <Text fontSize="sm" fontWeight={currentLanguage === lang.code ? 'bold' : 'medium'}>
                      {lang.nativeName}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.400">
                    {lang.name}
                  </Text>
                </HStack>
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        {/* User Menu */}
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            size="sm"
            h="34px"
            rightIcon={<Icon as={FiChevronDown} />}
            leftIcon={
              <Avatar
                size="xs"
                name={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
                src={user?.picture}
              />
            }
            borderRadius="lg"
          >
            {!isMobile && (
              <Text fontSize="xs" fontWeight="medium">
                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User'}
              </Text>
            )}
          </MenuButton>
          <MenuList zIndex={100} shadow="xl" borderRadius="xl">
            <MenuItem icon={<FiGrid />} onClick={() => navigate('/')}>
              {t('navDashboard', 'Operations Hub')}
            </MenuItem>
            <MenuItem icon={<FiUser />} onClick={() => navigate('/profile')}>
              {t('userProfile', 'Profile')}
            </MenuItem>
            <MenuItem icon={<FiSettings />} onClick={() => navigate('/settings')}>
              {t('userSettings', 'Settings')}
            </MenuItem>
            {hasGlobalAdminAccess && (
              <>
                <Divider />
                <MenuItem icon={<FiShield />} onClick={() => navigate('/admin/global')}>
                  {t('navGlobalAdmin', 'Global Admin')}
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem
              icon={<FiLogOut />}
              onClick={() => {
                logout();
                toast({
                  title: t('loggedOutTitle', 'Logged out'),
                  description: t('loggedOutDesc', 'You have been successfully logged out'),
                  status: 'success',
                  duration: 3000,
                  isClosable: true,
                });
              }}
              color="red.500"
            >
              {t('userLogout', 'Logout')}
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );

  // Mobile Drawer Navigation (only displayed when mobile hamburger is tapped)
  const MobileDrawer = () => (
    <Drawer isOpen={isOpen} placement={isRtl ? 'right' : 'left'} onClose={onClose} size="full">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <HStack spacing={2}>
            <Box p={1.5} bg="blue.600" color="white" borderRadius="md">
              <Icon as={FiGrid} boxSize={4} />
            </Box>
            <Heading size="md" color="blue.600" fontWeight="bold">
              Trading ERP
            </Heading>
          </HStack>
        </DrawerHeader>
        <DrawerBody pb={10}>
          <VStack spacing={4} align="stretch">
            {/* Mobile Language Switcher Row */}
            <Card bg={cardSubtleBg} p={2} borderRadius="md">
              <HStack justify="space-between" align="center">
                <Text fontSize="xs" fontWeight="bold" color="gray.500">
                  {t('languageSelector', 'Language / اللغة')}:
                </Text>
                <Select
                  size="sm"
                  w="auto"
                  value={currentLanguage}
                  onChange={(e) => {
                    const newLang = e.target.value as any;
                    setLanguage(newLang);
                    toast({
                      title: `Language changed to ${newLang.toUpperCase()}`,
                      status: 'info',
                      duration: 1500,
                    });
                  }}
                  borderRadius="md"
                  fontSize="xs"
                >
                  {supportedLanguages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.nativeName}
                    </option>
                  ))}
                </Select>
              </HStack>
            </Card>

            <OrganizationSelector />

            {/* Mobile Navigation List */}
            <VStack spacing={2} align="stretch" w="full">
              <Button
                variant={location.pathname === '/' ? 'solid' : 'ghost'}
                colorScheme="blue"
                leftIcon={<FiHome />}
                justifyContent="flex-start"
                onClick={() => {
                  navigate('/');
                  onClose();
                }}
                size="md"
                borderRadius="lg"
              >
                {t('navDashboard', 'Operations Hub')}
              </Button>

              {navSections.map((sec, idx) => (
                <Box key={idx} pt={2}>
                  <Text
                    fontSize="2xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    color="gray.400"
                    px={3}
                    py={1}
                  >
                    {t(sec.titleKey, sec.defaultTitle)}
                  </Text>
                  <VStack spacing={1} align="stretch">
                    {sec.items.map((item) => {
                      const IconComp = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Button
                          key={item.path}
                          variant={isActive ? 'solid' : 'ghost'}
                          colorScheme={isActive ? 'blue' : 'gray'}
                          leftIcon={<IconComp />}
                          justifyContent="flex-start"
                          onClick={() => {
                            navigate(item.path);
                            onClose();
                          }}
                          size="md"
                          borderRadius="lg"
                          fontSize="sm"
                        >
                          {item.name}
                        </Button>
                      );
                    })}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  return (
    <Box minH="100vh" bg={pageBg} dir={dir}>
      <Header />

      {/* Mobile Drawer (Only on small screens) */}
      <MobileDrawer />

      {/* Full Width Main Content Canvas (No Left Sidebar) */}
      <Box
        as="main"
        key={currentLanguage}
        p={{ base: 3, md: 5, lg: 7 }}
        maxW="1680px"
        mx="auto"
        minH="calc(100vh - 64px)"
        pb={{ base: '90px', md: 8 }}
      >
        {/* Back to Dashboard Banner on Every Module Screen */}
        {location.pathname !== '/' && (
          <Flex
            align="center"
            justify="space-between"
            mb={{ base: 4, md: 5 }}
            pb={{ base: 2.5, md: 3 }}
            borderBottom="1px solid"
            borderColor={borderColor}
            wrap="wrap"
            gap={3}
          >
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              borderRadius="xl"
              px={3.5}
              h="36px"
              leftIcon={<Icon as={isRtl ? FiArrowRight : FiArrowLeft} boxSize={4} />}
              onClick={() => navigate('/')}
              _hover={{
                bg: menuActiveBg,
                borderColor: 'blue.400',
                transform: isRtl ? 'translateX(2px)' : 'translateX(-2px)',
              }}
              transition="all 0.15s ease-in-out"
              boxShadow="xs"
            >
              <Text fontSize="xs" fontWeight="bold">
                {t('backToDashboard', 'Back to Dashboard')}
              </Text>
            </Button>

            {currentModule && (
              <HStack spacing={2} wrap="wrap">
                <Badge
                  colorScheme="gray"
                  variant="subtle"
                  borderRadius="md"
                  px={2.5}
                  py={1}
                  fontSize="2xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  {t(currentModule.sectionKey, currentModule.sectionTitle)}
                </Badge>
                <Text fontSize="xs" color="gray.400">/</Text>
                <HStack
                  spacing={1.5}
                  bg={menuActiveBg}
                  px={3}
                  py={1}
                  borderRadius="md"
                >
                  <Icon as={currentModule.icon} color="blue.600" boxSize={3.5} />
                  <Text fontSize="xs" fontWeight="bold" color={bannerBlueText}>
                    {currentModule.name}
                  </Text>
                </HStack>
              </HStack>
            )}
          </Flex>
        )}

        {children}
      </Box>

      {/* Mobile Bottom Navigation (Only on mobile) */}
      <MobileBottomNav />
    </Box>
  );
};

export default ResponsiveLayout;
