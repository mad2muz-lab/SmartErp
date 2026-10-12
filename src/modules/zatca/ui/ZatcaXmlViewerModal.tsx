import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  Box,
  Text,
  HStack,
  Icon,
  Code,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { FiCode, FiCopy, FiCheck, FiDownload } from 'react-icons/fi';

interface ZatcaXmlViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlContent: string;
  invoiceNumber: string;
}

export const ZatcaXmlViewerModal: React.FC<ZatcaXmlViewerModalProps> = ({
  isOpen,
  onClose,
  xmlContent,
  invoiceNumber,
}) => {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    toast({
      title: 'XML Copied to Clipboard',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber || 'zatca_invoice'}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent maxH="85vh" borderRadius="xl" overflow="hidden">
        <ModalHeader bg="gray.800" color="white" py={3}>
          <HStack justify="space-between" pr={6}>
            <HStack spacing={2}>
              <Icon as={FiCode} color="teal.300" />
              <Text fontSize="md" fontWeight="bold">
                Saudi ZATCA UBL 2.1 XML ({invoiceNumber})
              </Text>
            </HStack>
            <Badge colorScheme="teal" fontSize="2xs" px={2} py={0.5} borderRadius="full">
              UBL 2.1 Profile
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" />

        <ModalBody p={0} overflowY="auto">
          <Box p={4} bg="#1e1e1e">
            <Code
              display="block"
              whiteSpace="pre"
              fontSize="xs"
              color="#d4d4d4"
              bg="transparent"
              fontFamily="'Fira Code', 'Courier New', monospace"
            >
              {xmlContent}
            </Code>
          </Box>
        </ModalBody>

        <ModalFooter bg="gray.50" py={3}>
          <HStack spacing={3} w="full" justify="space-between">
            <Text fontSize="xs" color="gray.500">
              Compliant with ZATCA Electronic Invoicing Technical Specifications
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Icon as={copied ? FiCheck : FiCopy} />}
                onClick={handleCopy}
              >
                {copied ? 'Copied' : 'Copy XML'}
              </Button>
              <Button
                size="sm"
                colorScheme="teal"
                leftIcon={<Icon as={FiDownload} />}
                onClick={handleDownload}
              >
                Download XML File
              </Button>
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
