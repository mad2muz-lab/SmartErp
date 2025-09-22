import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Code,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Icon,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  GridItem,
  Image,
  Link
} from '@chakra-ui/react';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiShield, 
  FiEye, 
  FiDownload, 
  FiFileText, 
  FiEdit,
  FiAlertCircle
} from 'react-icons/fi';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface ZATCAComplianceViewerProps {
  invoiceId: Id<"invoices">;
  isOpen: boolean;
  onClose: () => void;
}

const ZATCAComplianceViewer: React.FC<ZATCAComplianceViewerProps> = ({ 
  invoiceId, 
  isOpen, 
  onClose 
}) => {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const codeBg = useColorModeValue('gray.50', 'gray.700');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'xml' | 'qr' | 'hash' | 'signature'>('overview');

  // Get invoice details (only when modal is open)
  const invoiceData = useQuery(
    isOpen ? api.invoiceManagement.getInvoiceDetails : "skip",
    isOpen ? { invoice_id: invoiceId } : "skip"
  );

  // Get audit logs (only when modal is open) - Temporarily disabled
  // const auditLogs = useQuery(
  //   isOpen ? api.zatca.auditLogger.getInvoiceAuditLogs : "skip",
  //   isOpen ? { invoice_id: invoiceId } : "skip"
  // );
  const auditLogs = null; // Temporarily disabled

  if (!invoiceData || !invoiceData.invoice) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>ZATCA Compliance Viewer</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Loading invoice data...</Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  const invoice = invoiceData.invoice;
  const organization = invoiceData.organization;
  const customer = invoiceData.customer;

  // Calculate compliance status
  const getComplianceStatus = () => {
    const components = {
      xml: !!invoice.zatca_ubl_xml,
      qr: !!invoice.zatca_qr_code,
      hash: !!invoice.zatca_invoice_hash,
      signature: !!invoice.zatca_digital_signature,
      reference: !!invoice.zatca_reference
    };
    
    const completedComponents = Object.values(components).filter(Boolean).length;
    const totalComponents = Object.keys(components).length;
    const completionPercentage = (completedComponents / totalComponents) * 100;
    
    let status = 'pending';
    let color = 'red';
    let icon = FiXCircle;
    
    if (invoice.is_compliant) {
      status = 'compliant';
      color = 'green';
      icon = FiCheckCircle;
    } else if (invoice.is_submitted) {
      status = 'submitted';
      color = 'blue';
      icon = FiShield;
    } else if (invoice.is_validated) {
      status = 'validated';
      color = 'yellow';
      icon = FiClock;
    }
    
    return { status, color, icon, components, completedComponents, totalComponents, completionPercentage };
  };

  const compliance = getComplianceStatus();

  // Download functions
  const downloadXML = () => {
    if (invoice.zatca_ubl_xml) {
      const blob = new Blob([invoice.zatca_ubl_xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice.invoice_number}_zatca.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadQRCode = () => {
    if (invoice.zatca_qr_code) {
      // Create QR code image (this would need a QR code library)
      const qrData = atob(invoice.zatca_qr_code);
      const blob = new Blob([qrData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice.invoice_number}_qr.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiShield },
    { id: 'xml', label: 'UBL XML', icon: FiFileText },
    { id: 'qr', label: 'QR Code', icon: FiShield },
    { id: 'hash', label: 'Hash', icon: FiShield },
    { id: 'signature', label: 'Signature', icon: FiEdit }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <Icon as={FiShield} />
            <Text>ZATCA Compliance Viewer</Text>
            <Badge colorScheme={compliance.color} fontSize="sm">
              {compliance.status.toUpperCase()}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody overflowY="auto">
          <VStack spacing={6} align="stretch">
            {/* Invoice Header */}
            <Card>
              <CardHeader>
                <Heading size="md">Invoice Information</Heading>
              </CardHeader>
              <CardBody>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text><strong>Invoice Number:</strong> {invoice.invoice_number}</Text>
                      <Text><strong>Date:</strong> {invoice.invoice_date}</Text>
                      <Text><strong>Customer:</strong> {invoice.customer_name}</Text>
                      <Text><strong>Total:</strong> {invoice.grand_total} {invoice.currency}</Text>
                    </VStack>
                  </GridItem>
                  <GridItem>
                    <VStack align="start" spacing={2}>
                      <Text><strong>ZATCA Reference:</strong> {invoice.zatca_reference || 'N/A'}</Text>
                      <Text><strong>Submission UUID:</strong> {invoice.zatca_submission_uuid || 'N/A'}</Text>
                      <Text><strong>Validation Status:</strong> 
                        <Badge colorScheme={invoice.is_validated ? 'green' : 'red'} ml={2}>
                          {invoice.is_validated ? 'Validated' : 'Not Validated'}
                        </Badge>
                      </Text>
                      <Text><strong>Submission Status:</strong> 
                        <Badge colorScheme={invoice.is_submitted ? 'green' : 'red'} ml={2}>
                          {invoice.is_submitted ? 'Submitted' : 'Not Submitted'}
                        </Badge>
                      </Text>
                    </VStack>
                  </GridItem>
                </Grid>
              </CardBody>
            </Card>

            {/* Compliance Overview */}
            <Card>
              <CardHeader>
                <Heading size="md">Compliance Overview</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <HStack spacing={4} w="full">
                    <Stat>
                      <StatLabel>Completion</StatLabel>
                      <StatNumber>{compliance.completionPercentage.toFixed(1)}%</StatNumber>
                      <StatHelpText>
                        <StatArrow type={compliance.completionPercentage === 100 ? 'increase' : 'decrease'} />
                        {compliance.completedComponents}/{compliance.totalComponents} components
                      </StatHelpText>
                    </Stat>
                    <Box flex={1}>
                      <Progress 
                        value={compliance.completionPercentage} 
                        colorScheme={compliance.color}
                        size="lg"
                        borderRadius="md"
                      />
                    </Box>
                  </HStack>

                  <Grid templateColumns="repeat(5, 1fr)" gap={4} w="full">
                    {Object.entries(compliance.components).map(([key, value]) => (
                      <GridItem key={key}>
                        <VStack spacing={2}>
                          <Icon 
                            as={value ? FiCheckCircle : FiXCircle} 
                            color={value ? 'green.500' : 'red.500'}
                            boxSize={6}
                          />
                          <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
                            {key}
                          </Text>
                          <Badge colorScheme={value ? 'green' : 'red'} size="sm">
                            {value ? 'Ready' : 'Missing'}
                          </Badge>
                        </VStack>
                      </GridItem>
                    ))}
                  </Grid>
                </VStack>
              </CardBody>
            </Card>

            {/* Tab Navigation */}
            <HStack spacing={2} borderBottom="1px" borderColor={borderColor} pb={2}>
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedTab === tab.id ? 'solid' : 'ghost'}
                  colorScheme={selectedTab === tab.id ? 'blue' : 'gray'}
                  size="sm"
                  leftIcon={<Icon as={tab.icon} />}
                  onClick={() => setSelectedTab(tab.id as any)}
                >
                  {tab.label}
                </Button>
              ))}
            </HStack>

            {/* Tab Content */}
            {selectedTab === 'overview' && (
              <VStack spacing={4} align="stretch">
                <Alert status={compliance.status === 'compliant' ? 'success' : 'warning'}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      {compliance.status === 'compliant' ? 'ZATCA Compliant' : 'ZATCA Compliance Incomplete'}
                    </AlertTitle>
                    <AlertDescription>
                      {compliance.status === 'compliant' 
                        ? 'This invoice meets all ZATCA e-invoicing requirements and is ready for submission.'
                        : `This invoice is ${compliance.completionPercentage.toFixed(1)}% complete. ${compliance.totalComponents - compliance.completedComponents} components are missing.`
                      }
                    </AlertDescription>
                  </Box>
                </Alert>

                {/* Audit Trail */}
                {auditLogs && auditLogs.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <Heading size="md">Audit Trail</Heading>
                    </CardHeader>
                    <CardBody>
                      <TableContainer>
                        <Table size="sm">
                          <Thead>
                            <Tr>
                              <Th>Timestamp</Th>
                              <Th>Operation</Th>
                              <Th>Details</Th>
                              <Th>Status</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {auditLogs.slice(0, 10).map((log: any) => (
                              <Tr key={log._id}>
                                <Td>{new Date(log.timestamp).toLocaleString()}</Td>
                                <Td>
                                  <Badge colorScheme="blue" size="sm">
                                    {log.operation_type}
                                  </Badge>
                                </Td>
                                <Td>{log.details}</Td>
                                <Td>
                                  <Icon as={log.error_message ? FiXCircle : FiCheckCircle} 
                                        color={log.error_message ? 'red.500' : 'green.500'} />
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </TableContainer>
                    </CardBody>
                  </Card>
                ) : (
                  <Card>
                    <CardBody>
                      <Text color="gray.500" textAlign="center" py={4}>
                        Audit logs are temporarily unavailable. This feature will be restored soon.
                      </Text>
                    </CardBody>
                  </Card>
                )}
              </VStack>
            )}

            {selectedTab === 'xml' && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">UBL XML Document</Text>
                  <Button 
                    size="sm" 
                    leftIcon={<Icon as={FiDownload} />}
                    onClick={downloadXML}
                    isDisabled={!invoice.zatca_ubl_xml}
                  >
                    Download XML
                  </Button>
                </HStack>
                {invoice.zatca_ubl_xml ? (
                  <Box 
                    p={4} 
                    bg={codeBg} 
                    borderRadius="md"
                    maxH="400px"
                    overflowY="auto"
                  >
                    <Code 
                      display="block" 
                      whiteSpace="pre-wrap" 
                      fontSize="xs"
                      p={4}
                      borderRadius="md"
                    >
                      {invoice.zatca_ubl_xml}
                    </Code>
                  </Box>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>XML Not Generated</AlertTitle>
                    <AlertDescription>
                      UBL XML document has not been generated for this invoice.
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            )}

            {selectedTab === 'qr' && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">QR Code Data</Text>
                  <Button 
                    size="sm" 
                    leftIcon={<Icon as={FiDownload} />}
                    onClick={downloadQRCode}
                    isDisabled={!invoice.zatca_qr_code}
                  >
                    Download QR Data
                  </Button>
                </HStack>
                {invoice.zatca_qr_code ? (
                  <VStack spacing={4}>
                    <Box 
                      p={4} 
                      bg={codeBg} 
                      borderRadius="md"
                      w="full"
                    >
                      <Text fontSize="sm" fontWeight="bold" mb={2}>QR Code Content (Base64):</Text>
                      <Code 
                        display="block" 
                        whiteSpace="pre-wrap" 
                        fontSize="xs"
                        p={2}
                        borderRadius="md"
                        maxH="200px"
                        overflowY="auto"
                      >
                        {invoice.zatca_qr_code}
                      </Code>
                    </Box>
                    <Alert status="info">
                      <AlertIcon />
                      <AlertDescription>
                        This QR code contains all required ZATCA data fields. It can be used to generate a visual QR code for the invoice PDF.
                      </AlertDescription>
                    </Alert>
                  </VStack>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>QR Code Not Generated</AlertTitle>
                    <AlertDescription>
                      QR code data has not been generated for this invoice.
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            )}

            {selectedTab === 'hash' && (
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold">Invoice Hash</Text>
                {invoice.zatca_invoice_hash ? (
                  <Box 
                    p={4} 
                    bg={codeBg} 
                    borderRadius="md"
                  >
                    <Text fontSize="sm" fontWeight="bold" mb={2}>SHA-256 Hash (Base64):</Text>
                    <Code 
                      display="block" 
                      whiteSpace="pre-wrap" 
                      fontSize="xs"
                      p={2}
                      borderRadius="md"
                    >
                      {invoice.zatca_invoice_hash}
                    </Code>
                    <Alert status="info" mt={4}>
                      <AlertIcon />
                      <AlertDescription>
                        This is the SHA-256 hash of the UBL XML document, used for ZATCA compliance verification.
                      </AlertDescription>
                    </Alert>
                  </Box>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>Hash Not Generated</AlertTitle>
                    <AlertDescription>
                      Invoice hash has not been generated for this invoice.
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            )}

            {selectedTab === 'signature' && (
              <VStack spacing={4} align="stretch">
                <Text fontWeight="bold">Digital Signature</Text>
                {invoice.zatca_digital_signature ? (
                  <Box 
                    p={4} 
                    bg={codeBg} 
                    borderRadius="md"
                  >
                    <Text fontSize="sm" fontWeight="bold" mb={2}>Digital Signature (JSON):</Text>
                    <Code 
                      display="block" 
                      whiteSpace="pre-wrap" 
                      fontSize="xs"
                      p={2}
                      borderRadius="md"
                      maxH="200px"
                      overflowY="auto"
                    >
                      {invoice.zatca_digital_signature}
                    </Code>
                    <Alert status="info" mt={4}>
                      <AlertIcon />
                      <AlertDescription>
                        This is the digital signature for ZATCA compliance. In production, this would be a real cryptographic signature.
                      </AlertDescription>
                    </Alert>
                  </Box>
                ) : (
                  <Alert status="warning">
                    <AlertIcon />
                    <AlertTitle>Signature Not Generated</AlertTitle>
                    <AlertDescription>
                      Digital signature has not been generated for this invoice.
                    </AlertDescription>
                  </Alert>
                )}
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ZATCAComplianceViewer;
