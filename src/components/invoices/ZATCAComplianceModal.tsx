import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Progress,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
  ListIcon,
  Divider,
} from '@chakra-ui/react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';

interface ZATCAComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  complianceResult: {
    is_compliant: boolean;
    compliance_score: number;
    errors: string[];
    warnings: string[];
  } | null;
  invoiceNumber?: string;
}

const ZATCAComplianceModal: React.FC<ZATCAComplianceModalProps> = ({
  isOpen,
  onClose,
  complianceResult,
  invoiceNumber
}) => {
  if (!complianceResult) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'yellow';
    return 'red';
  };

  const getComplianceStatus = (isCompliant: boolean) => {
    return isCompliant ? 'Compliant' : 'Non-Compliant';
  };

  const getComplianceColor = (isCompliant: boolean) => {
    return isCompliant ? 'green' : 'red';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Text>ZATCA Compliance Check</Text>
            {invoiceNumber && (
              <Badge colorScheme="blue" fontSize="sm">
                {invoiceNumber}
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Compliance Score */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">Compliance Score</Text>
                <Badge colorScheme={getScoreColor(complianceResult.compliance_score)}>
                  {complianceResult.compliance_score}%
                </Badge>
              </HStack>
              <Progress 
                value={complianceResult.compliance_score} 
                colorScheme={getScoreColor(complianceResult.compliance_score)}
                size="lg"
                borderRadius="md"
              />
            </Box>

            {/* Overall Status */}
            <Alert status={complianceResult.is_compliant ? 'success' : 'error'}>
              <AlertIcon />
              <Box>
                <AlertTitle>
                  {getComplianceStatus(complianceResult.is_compliant)}
                </AlertTitle>
                <AlertDescription>
                  {complianceResult.is_compliant 
                    ? 'This invoice meets all ZATCA requirements and is ready for submission.'
                    : 'This invoice has compliance issues that need to be resolved before submission.'
                  }
                </AlertDescription>
              </Box>
            </Alert>

            {/* Errors */}
            {complianceResult.errors.length > 0 && (
              <Box>
                <Text fontWeight="bold" color="red.500" mb={3}>
                  Compliance Errors ({complianceResult.errors.length})
                </Text>
                <List spacing={2}>
                  {complianceResult.errors.map((error, index) => (
                    <ListItem key={index}>
                      <HStack align="start">
                        <ListIcon as={FiXCircle} color="red.500" />
                        <Text fontSize="sm">{error}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Warnings */}
            {complianceResult.warnings.length > 0 && (
              <Box>
                <Text fontWeight="bold" color="orange.500" mb={3}>
                  Warnings ({complianceResult.warnings.length})
                </Text>
                <List spacing={2}>
                  {complianceResult.warnings.map((warning, index) => (
                    <ListItem key={index}>
                      <HStack align="start">
                        <ListIcon as={FiAlertTriangle} color="orange.500" />
                        <Text fontSize="sm">{warning}</Text>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Success Message */}
            {complianceResult.is_compliant && complianceResult.errors.length === 0 && (
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>All Requirements Met!</AlertTitle>
                  <AlertDescription>
                    This invoice is fully compliant with ZATCA regulations and ready for submission.
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Text fontSize="sm" color="gray.500">
              ZATCA Article 53(5) Compliance Check
            </Text>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ZATCAComplianceModal;
