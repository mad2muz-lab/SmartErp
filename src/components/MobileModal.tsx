import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useBreakpointValue,
  useColorModeValue,
  Box,
  VStack,
  HStack,
  Text,
} from '@chakra-ui/react';

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isConfirmDisabled?: boolean;
}

const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showFooter = true,
  footerContent,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  isConfirmDisabled = false,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Adjust size for mobile
  const modalSize = isMobile ? (size === 'full' ? 'full' : 'full') : size;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={modalSize}
      isCentered
      scrollBehavior="inside"
      closeOnOverlayClick={!isLoading}
      closeOnEsc={!isLoading}
    >
      <ModalOverlay 
        bg="blackAlpha.600" 
        backdropFilter="blur(10px)"
      />
      <ModalContent
        bg={bg}
        border="1px"
        borderColor={borderColor}
        borderRadius={isMobile ? '0' : 'lg'}
        mx={isMobile ? 0 : 4}
        my={isMobile ? 0 : 4}
        maxH={isMobile ? '100vh' : '90vh'}
        minH={isMobile ? '100vh' : 'auto'}
        display="flex"
        flexDirection="column"
      >
        <ModalHeader
          pb={3}
          borderBottom="1px"
          borderColor={borderColor}
          bg={useColorModeValue('gray.50', 'gray.700')}
          borderRadius={isMobile ? '0' : 'lg 0 0 0'}
        >
          <HStack justify="space-between" align="center">
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              fontWeight="bold"
              color={useColorModeValue('gray.800', 'white')}
              flex={1}
            >
              {title}
            </Text>
            <ModalCloseButton
              size={isMobile ? 'lg' : 'md'}
              minH={isMobile ? '40px' : '32px'}
              minW={isMobile ? '40px' : '32px'}
              borderRadius="md"
              _hover={{ bg: 'gray.100' }}
              isDisabled={isLoading}
            />
          </HStack>
        </ModalHeader>

        <ModalBody
          flex={1}
          p={{ base: 4, md: 6 }}
          overflowY="auto"
        >
          <VStack spacing={4} align="stretch">
            {children}
          </VStack>
        </ModalBody>

        {showFooter && (
          <ModalFooter
            pt={3}
            borderTop="1px"
            borderColor={borderColor}
            bg={useColorModeValue('gray.50', 'gray.700')}
            borderRadius={isMobile ? '0' : '0 0 lg 0'}
          >
            <HStack spacing={3} justify="flex-end" w="full">
              {footerContent ? (
                footerContent
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    size={isMobile ? 'lg' : 'md'}
                    minH={isMobile ? '48px' : 'auto'}
                    fontSize={{ base: 'md', md: 'sm' }}
                    isDisabled={isLoading}
                  >
                    {cancelText}
                  </Button>
                  {onConfirm && (
                    <Button
                      colorScheme="blue"
                      onClick={onConfirm}
                      size={isMobile ? 'lg' : 'md'}
                      minH={isMobile ? '48px' : 'auto'}
                      fontSize={{ base: 'md', md: 'sm' }}
                      fontWeight="semibold"
                      isLoading={isLoading}
                      isDisabled={isConfirmDisabled}
                    >
                      {confirmText}
                    </Button>
                  )}
                </>
              )}
            </HStack>
          </ModalFooter>
        )}
      </ModalContent>
    </Modal>
  );
};

export default MobileModal;
