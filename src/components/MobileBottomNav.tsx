import React, { useEffect, useRef } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Text,
  useColorModeValue,
  useBreakpointValue,
  VStack,
  Badge,
  Flex,
  useMediaQuery,
} from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SwipeNavigation } from '../utils/mobileTouch';
import {
  FiHome,
  FiUsers,
  FiTarget,
  FiPackage,
  FiFileText,
  FiCreditCard,
  FiSettings,
} from 'react-icons/fi';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const navRef = useRef<HTMLDivElement>(null);

  // Check for very narrow screens (like One Plus 11)
  const [isVeryNarrow] = useMediaQuery('(max-width: 420px)');

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');
  const activeBg = useColorModeValue('blue.50', 'blue.900');

  // Define navigation routes for swipe functionality
  const navRoutes = ['/', '/customers', '/leads', '/inventory', '/quotations', '/invoices', '/settings'];

  // Initialize swipe navigation (hooks must be called before any returns)
  useEffect(() => {
    if (isMobile && navRef.current) {
      const swipeNav = new SwipeNavigation(
        navRef.current,
        navRoutes,
        navigate,
        location.pathname
      );

      return () => {
        swipeNav.destroy();
      };
    }
  }, [navigate, location.pathname, isMobile]);

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // 50ms vibration
    }
  };

  // Only show on mobile
  if (!isMobile) return null;

  const navItems = [
    { name: 'Dashboard', icon: FiHome, path: '/', shortName: 'Home' },
    { name: 'Customers', icon: FiUsers, path: '/customers', shortName: 'Customers' },
    { name: 'Leads', icon: FiTarget, path: '/leads', shortName: 'Leads' },
    { name: 'Inventory', icon: FiPackage, path: '/inventory', shortName: 'Inventory' },
    { name: 'Quotations', icon: FiFileText, path: '/quotations', shortName: 'Quotes' },
    { name: 'Invoices', icon: FiCreditCard, path: '/invoices', shortName: 'Invoices' },
    { name: 'Settings', icon: FiSettings, path: '/settings', shortName: 'Settings' },
  ];



  return (
    <Box
      ref={navRef}
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg={bg}
      borderTop="1px"
      borderColor={borderColor}
      zIndex={20}
      display={{ base: "block", md: "none" }}
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.1)"
      backdropFilter="blur(10px)"
      backgroundColor={useColorModeValue('rgba(255, 255, 255, 0.95)', 'rgba(26, 32, 44, 0.95)')}
      overflow="hidden" // Prevent horizontal scrolling
    >
      <Flex 
        justify="space-between" 
        align="center"
        py={isVeryNarrow ? 2 : 3} 
        px={isVeryNarrow ? 1 : 2}
        minH={isVeryNarrow ? "70px" : "80px"}
        maxW="100vw"
        overflow="hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const displayName = isVeryNarrow ? item.shortName : item.name;
          
          return (
            <VStack
              key={item.path}
              flex={1}
              spacing={isVeryNarrow ? 0.5 : 1}
              cursor="pointer"
              onClick={() => {
                triggerHapticFeedback();
                navigate(item.path);
              }}
              py={isVeryNarrow ? 1 : 2}
              px={isVeryNarrow ? 0.5 : 1}
              borderRadius="lg"
              bg={isActive ? activeBg : 'transparent'}
              _hover={{
                bg: isActive ? activeBg : useColorModeValue('gray.50', 'gray.700'),
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              transition="all 0.2s"
              minH={isVeryNarrow ? "50px" : "60px"}
              justify="center"
              maxW={isVeryNarrow ? "60px" : "none"}
              minW={isVeryNarrow ? "60px" : "none"}
            >
              <IconButton
                aria-label={item.name}
                icon={<Icon />}
                variant="ghost"
                size={isVeryNarrow ? "xs" : "sm"}
                color={isActive ? activeColor : inactiveColor}
                _hover={{ bg: 'transparent' }}
                _active={{ bg: 'transparent' }}
                minH={isVeryNarrow ? "28px" : "32px"}
                minW={isVeryNarrow ? "28px" : "32px"}
                borderRadius="md"
              />
              <Text
                fontSize={isVeryNarrow ? "10px" : "xs"}
                color={isActive ? activeColor : inactiveColor}
                fontWeight={isActive ? "semibold" : "medium"}
                textAlign="center"
                lineHeight="1"
                noOfLines={1}
                overflow="hidden"
                textOverflow="ellipsis"
                maxW="100%"
              >
                {displayName}
              </Text>
              {isActive && (
                <Box
                  w={isVeryNarrow ? "3px" : "4px"}
                  h={isVeryNarrow ? "3px" : "4px"}
                  bg={activeColor}
                  borderRadius="full"
                  mt={isVeryNarrow ? 0.5 : 1}
                />
              )}
            </VStack>
          );
        })}
      </Flex>
    </Box>
  );
};

// Floating Action Button for mobile screens
export const FloatingActionButton: React.FC<{
  icon: React.ComponentType<any>;
  onClick: () => void;
  colorScheme?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}> = ({
  icon: Icon,
  onClick,
  colorScheme = 'blue',
  size = 'lg',
  position = 'bottom-right'
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (!isMobile) return null;

  const positionStyles = {
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
  };

  const sizeStyles = {
    sm: { w: 12, h: 12 },
    md: { w: 14, h: 14 },
    lg: { w: 16, h: 16 },
  };

  return (
    <Box
      position="fixed"
      {...positionStyles[position]}
      zIndex={30}
    >
      <IconButton
        aria-label="Quick action"
        icon={<Icon />}
        colorScheme={colorScheme}
        rounded="full"
        size={size}
        {...sizeStyles[size]}
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.15)"
        _hover={{
          transform: 'scale(1.05)',
          boxShadow: '0 6px 25px rgba(0, 0, 0, 0.2)',
        }}
        _active={{
          transform: 'scale(0.95)',
        }}
        transition="all 0.2s"
        onClick={() => {
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
          onClick();
        }}
      />
    </Box>
  );
};

export default MobileBottomNav;
