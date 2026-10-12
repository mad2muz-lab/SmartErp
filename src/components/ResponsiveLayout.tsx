import React, { useState, useEffect } from 'react';
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
  Divider,
  useColorModeValue,
  useToast,
  Badge,
  Card,
  Tooltip,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import OrganizationSelector from './OrganizationSelector';
import MobileBottomNav from './MobileBottomNav';
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
} from 'react-icons/fi';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, organizationDetails, loading: authLoading } = useAuth();
  
  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Loading...</Heading>
            <Text color="gray.600">Initializing application...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }
  const toast = useToast();
  
  // Check if user is a global admin
  const globalAdmins = useQuery(api.globalUserManagement.listGlobalAdmins);
  const isGlobalAdmin = globalAdmins && globalAdmins.some(ga => ga.user_id === user?.id && ga.is_active);
  
  // Enhanced responsive breakpoints
  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  
  // Color mode values
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  // Auto-close mobile menu on navigation
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [location.pathname, isMobile, isOpen, onClose]);

  const menuItems = [
    { name: 'Dashboard', icon: FiHome, path: '/' },
    { name: 'Customers', icon: FiUsers, path: '/customers' },
    { name: 'Leads', icon: FiTarget, path: '/leads' },
    { name: 'Inventory', icon: FiPackage, path: '/inventory' },
    { name: 'Suppliers', icon: FiTruck, path: '/suppliers' },
    { name: 'Quotations', icon: FiFileText, path: '/quotations' },
    { name: 'Delivery Notes', icon: FiFileText, path: '/delivery-notes' },
    { name: 'Invoices', icon: FiCreditCard, path: '/invoices' }, // Clean professional invoicing
    { name: 'Procurement', icon: FiShoppingCart, path: '/procurement' },
    { name: 'Intelligent Process Flow', icon: FiZap, path: '/intelligent-process-flow' },
    { name: 'Settings', icon: FiSettings, path: '/settings' },
  ];

  // Add Global Admin link for super admins and global admins
  const isSuperAdmin = user?.role === 'super_admin';
  
  const adminMenuItems = (isSuperAdmin || isGlobalAdmin)
    ? [...menuItems, { name: 'Global Admin', icon: FiShield, path: '/admin/global' }]
    : menuItems;

  const NavigationMenu = () => (
    <VStack spacing={2} align="stretch" w="full" overflowY="auto">
      {adminMenuItems.map((item) => {
        const Icon = item.icon;
        // Fix: Check if current path starts with item path for sub-paths
        const isActive = location.pathname === item.path || 
                        (item.path !== '/' && location.pathname.startsWith(item.path));
        
        const buttonContent = (
          <Button
            key={item.path}
            variant={isActive ? 'solid' : 'ghost'}
            colorScheme={isActive ? 'blue' : 'gray'}
            leftIcon={<Icon />}
            justifyContent="flex-start"
            // Special styling for Procurement when active (sub-path)
            bg={item.path === '/procurement' && location.pathname.startsWith('/procurement') ? 'blue.100' : undefined}
            border={item.path === '/procurement' && location.pathname.startsWith('/procurement') ? '2px solid' : undefined}
            borderColor={item.path === '/procurement' && location.pathname.startsWith('/procurement') ? 'blue.300' : undefined}
            onClick={() => {
              console.log(`🔍 DEBUG: Navigating from ${location.pathname} to ${item.path}`);
              // Always force navigation for Procurement to ensure it works as back button
              if (item.path === '/procurement') {
                console.log('🔍 DEBUG: Force navigating to Procurement Dashboard');
                // Force a hard refresh to ensure the page actually changes
                window.location.href = '/procurement';
                // Close mobile menu if open
                if (isMobile) onClose();
                return;
              } else {
                // For other items, use normal navigation
                navigate(item.path);
                if (isMobile) onClose();
              }
            }}
            size={isMobile ? "md" : "lg"}
            borderRadius="md"
            _hover={{
              bg: isActive ? 'blue.600' : 'gray.100',
            }}
            transition="all 0.2s"
            whiteSpace="nowrap"
            textAlign="left"
            minH={isMobile ? "44px" : "auto"} // Ensure touch-friendly height on mobile
            fontSize={isMobile ? "sm" : "md"}
            px={isMobile ? 3 : 4}
          >
            {item.name}
          </Button>
        );

        // Add tooltip for Procurement when on sub-paths
        if (item.path === '/procurement' && location.pathname.startsWith('/procurement') && location.pathname !== '/procurement') {
          return (
            <Tooltip 
              key={item.path}
              label="Click to return to Procurement Dashboard" 
              placement="right"
              hasArrow
            >
              {buttonContent}
            </Tooltip>
          );
        }

        // Add special styling and tooltip for Procurement button when on procurement sub-paths
        if (item.path === '/procurement' && location.pathname.startsWith('/procurement')) {
          return (
            <Tooltip 
              key={item.path}
              label="Click to return to Procurement Dashboard" 
              placement="right"
              hasArrow
            >
              <Button
                key={item.path}
                variant="solid"
                colorScheme="blue"
                leftIcon={<Icon />}
                justifyContent="flex-start"
                bg="blue.100"
                border="2px solid"
                borderColor="blue.300"
                onClick={() => {
                  console.log('🔍 DEBUG: Procurement sidebar button clicked - forcing navigation');
                  // Force a hard refresh to ensure the page actually changes
                  window.location.href = '/procurement';
                  if (isMobile) onClose();
                }}
                size={isMobile ? "md" : "lg"}
                borderRadius="md"
                _hover={{
                  bg: 'blue.200',
                }}
                transition="all 0.2s"
                whiteSpace="nowrap"
                textAlign="left"
                minH={isMobile ? "44px" : "auto"}
                fontSize={isMobile ? "sm" : "md"}
                px={isMobile ? 3 : 4}
              >
                {item.name}
              </Button>
            </Tooltip>
          );
        }

        return buttonContent;
      })}
    </VStack>
  );

  const Header = () => (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      px={4}
      py={3}
      h="60px"
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
      boxShadow="sm"
    >
      {/* Mobile Menu Button */}
      {isMobile && (
        <IconButton
          aria-label="Open menu"
          icon={<HamburgerIcon />}
          onClick={onOpen}
          variant="ghost"
          size="md"
        />
      )}

      {/* Logo/Brand */}
      <Box flex="1" textAlign={isMobile ? "center" : "left"}>
        <Heading
          size={isMobile ? "md" : "lg"}
          color="blue.600"
          fontWeight="bold"
        >
          Trading ERP
        </Heading>
      </Box>



      {/* User Menu */}
      <HStack spacing={2}>
        
        <Menu>
          <MenuButton
            as={Button}
            variant="ghost"
            size="sm"
            rightIcon={<FiChevronDown />}
            leftIcon={
              <Avatar
                size="sm"
                name={`${user?.firstName} ${user?.lastName}`}
                src={user?.picture}
              />
            }
          >
            {!isMobile && (
              <Text fontSize="sm" fontWeight="medium">
                {user?.firstName} {user?.lastName}
              </Text>
            )}
          </MenuButton>
          <MenuList>
            <MenuItem icon={<FiUser />} onClick={() => navigate('/profile')}>
              Profile
            </MenuItem>
            <MenuItem icon={<FiSettings />} onClick={() => navigate('/settings')}>
              Settings
            </MenuItem>
            {(isSuperAdmin || isGlobalAdmin) && (
              <>
                <Divider />
                <MenuItem icon={<FiShield />} onClick={() => navigate('/admin/global')}>
                  Global Admin
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem 
              icon={<FiLogOut />} 
              onClick={() => {
                logout();
                toast({
                  title: "Logged out",
                  description: "You have been successfully logged out",
                  status: "success",
                  duration: 3000,
                  isClosable: true,
                });
              }}
              color="red.500"
            >
              Logout
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );

  const Sidebar = () => (
    <Box
      as="nav"
      w={isDesktop ? "280px" : "240px"}
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      h="calc(100vh - 60px)"
      position="fixed"
      left={0}
      top="60px"
      zIndex={5}
      overflowY="auto"
      display={{ base: "none", lg: "block" }}
    >
      <VStack spacing={4} p={4} align="stretch" minH="100%">
        {/* Organization Selector */}
        <OrganizationSelector />
        
        {/* Navigation Menu */}
        <Box flex="1">
          <NavigationMenu />
        </Box>
      </VStack>
    </Box>
  );

  const MobileDrawer = () => (
    <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="full">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>
          <Heading size="md" color="blue.600" fontWeight="bold">
            Trading ERP
          </Heading>
        </DrawerHeader>
        <DrawerBody>
          <VStack spacing={4} align="stretch">

            
            <OrganizationSelector />
            <NavigationMenu />
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Header />
      
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Drawer */}
      <MobileDrawer />
      
      {/* Main Content */}
      <Box
        ml={{ base: 0, lg: isDesktop ? "280px" : "240px" }}
        pt={{ base: "60px", lg: "60px" }}
        pb={{ base: "90px", md: 0 }} // Optimized bottom padding for mobile bottom nav
        minH="100vh"
      >
        <Box
          as="main"
          p={{ base: 4, md: 6, lg: 8 }}
          maxW="100%"
          mx="auto"
          minH="calc(100vh - 150px)" // Optimized minimum height for mobile
        >
          {children}
        </Box>
      </Box>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </Box>
  );
};

export default ResponsiveLayout;
