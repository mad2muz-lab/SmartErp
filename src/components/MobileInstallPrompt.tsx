import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  HStack,
  VStack,
  IconButton,
  useColorModeValue,
  useBreakpointValue,
  useToast,
} from '@chakra-ui/react';
import { FiDownload, FiX, FiSmartphone } from 'react-icons/fi';
import { isPWAInstalled, showInstallPrompt } from '../utils/pwa';

const MobileInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();
  
  const bg = useColorModeValue('blue.50', 'blue.900');
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const textColor = useColorModeValue('blue.800', 'blue.100');

  useEffect(() => {
    // Check if already installed
    if (isPWAInstalled()) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast({
        title: 'App Installed!',
        description: 'Trading ERP has been installed on your device.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: 'Installation Started',
          description: 'Please follow the prompts to install the app.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to avoid showing again for a while
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show on desktop or if already dismissed recently
  if (!isMobile || !showPrompt) {
    return null;
  }

  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed');
  if (dismissedTime && Date.now() - parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom="80px" // Above mobile bottom nav
      left={4}
      right={4}
      bg={bg}
      border="1px"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      zIndex={30}
      boxShadow="lg"
    >
      <HStack justify="space-between" align="flex-start">
        <VStack align="flex-start" spacing={2} flex={1}>
          <HStack spacing={2}>
            <FiSmartphone color={textColor} />
            <Text fontSize="sm" fontWeight="medium" color={textColor}>
              Install Trading ERP
            </Text>
          </HStack>
          <Text fontSize="xs" color={textColor} opacity={0.8}>
            Add to home screen for quick access and offline use
          </Text>
        </VStack>
        
        <VStack spacing={2}>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<FiDownload />}
            onClick={handleInstall}
          >
            Install
          </Button>
          <IconButton
            size="sm"
            variant="ghost"
            icon={<FiX />}
            aria-label="Dismiss"
            onClick={handleDismiss}
          />
        </VStack>
      </HStack>
    </Box>
  );
};

export default MobileInstallPrompt;
