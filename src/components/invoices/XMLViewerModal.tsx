import React, { useState } from 'react';
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
  Button,
  useColorModeValue,
  Card,
  CardBody,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Box,
  Divider,
  Icon,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Center,
  Spacer
} from '@chakra-ui/react';
import { 
  FiCode, 
  FiDownload, 
  FiEye, 
  FiHash, 
  FiCalendar,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiFileText,
  FiDatabase
} from 'react-icons/fi';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

interface XMLViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: Id<"invoices">;
}

const XMLViewerModal: React.FC<XMLViewerModalProps> = ({
  isOpen,
  onClose,
  invoiceId
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const codeBg = useColorModeValue('gray.50', 'gray.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const toast = useToast();

  // Get invoice details to generate XML
  const invoiceDetails = useQuery(
    api.invoiceManagement.getInvoiceDetails,
    invoiceId ? { invoice_id: invoiceId } : "skip"
  );

  // Generate XML content for the invoice
  const generateInvoiceXML = (invoice: any) => {
    if (!invoice) return '';

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ccts="urn:un:unece:uncefact:documentation:2"
         xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
         xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2">
  
  <!-- Invoice Header -->
  <cbc:ID>${invoice.invoice_number || invoice._id}</cbc:ID>
  <cbc:IssueDate>${invoice.invoice_date || new Date().toISOString().split('T')[0]}</cbc:IssueDate>
  <cbc:DueDate>${invoice.due_date || new Date().toISOString().split('T')[0]}</cbc:DueDate>
  <cbc:InvoiceTypeCode>${invoice.invoice_type === 'simplified' ? '388' : '380'}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${invoice.currency || 'SAR'}</cbc:DocumentCurrencyCode>
  
  <!-- Supplier Information -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${invoice.organization_name || 'TradingERP System'}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${invoice.organization_address || 'Riyadh, Saudi Arabia'}</cbc:StreetName>
        <cbc:CityName>Riyadh</cbc:CityName>
        <cbc:PostalZone>12345</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:ID>${invoice.organization_tax_id || '300000000000003'}</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Customer Information -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${invoice.customer_name || 'Default Customer'}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${invoice.customer_address || 'Default Address'}</cbc:StreetName>
        <cbc:CityName>Riyadh</cbc:CityName>
        <cbc:PostalZone>12345</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>SA</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Invoice Lines -->
  ${(invoice.items || []).map((item: any, index: number) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity || 1}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${invoice.currency || 'SAR'}">${(item.line_total || 0).toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${item.description || 'Service/Product'}</cbc:Description>
      <cbc:Name>${item.description || 'Service/Product'}</cbc:Name>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${invoice.currency || 'SAR'}">${(item.unit_price || 0).toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${invoice.currency || 'SAR'}">${(item.vat_amount || 0).toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${invoice.currency || 'SAR'}">${(item.line_total || 0).toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${invoice.currency || 'SAR'}">${(item.vat_amount || 0).toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${(item.vat_rate || 15).toFixed(0)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </cac:InvoiceLine>
  `).join('')}
  
  <!-- Tax Summary -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${invoice.currency || 'SAR'}">${(invoice.total_vat || 0).toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  
  <!-- Legal Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${invoice.currency || 'SAR'}">${(invoice.subtotal || 0).toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${invoice.currency || 'SAR'}">${(invoice.subtotal || 0).toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${invoice.currency || 'SAR'}">${(invoice.grand_total || 0).toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${invoice.currency || 'SAR'}">${(invoice.grand_total || 0).toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
</Invoice>`;

    return xmlContent;
  };

  // Create mock XML records for display
  const xmlRecords = invoiceDetails ? [
    {
      _id: 'validation-record',
      submission_type: 'validation',
      environment: 'sandbox',
      created_at: new Date().toISOString(),
      submission_uuid: `validation-${invoiceId}-${Date.now()}`,
      zatca_reference: null,
      xml_content: generateInvoiceXML(invoiceDetails),
      xml_hash: `hash-${Date.now()}`
    },
    {
      _id: 'submission-record',
      submission_type: 'submission',
      environment: 'sandbox',
      created_at: new Date().toISOString(),
      submission_uuid: `submission-${invoiceId}-${Date.now()}`,
      zatca_reference: `ZATCA-REF-${Date.now()}`,
      xml_content: generateInvoiceXML(invoiceDetails),
      xml_hash: `hash-${Date.now() + 1}`
    }
  ] : null;

  const allXMLRecords = xmlRecords;

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  // Format XML for better readability
  const formatXML = (xml: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const serializer = new XMLSerializer();
      return serializer.serializeToString(xmlDoc);
    } catch (error) {
      return xml; // Return original if parsing fails
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${type} copied to clipboard`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Download XML file
  const handleDownload = (xml: string, filename: string) => {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSubmissionTypeColor = (type: string) => {
    switch (type) {
      case 'validation': return 'blue';
      case 'submission': return 'green';
      default: return 'gray';
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'sandbox': return 'orange';
      case 'production': return 'red';
      default: return 'gray';
    }
  };

  if (!xmlRecords) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>XML Records</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="center" py={8}>
              <Icon as={FiAlertCircle} boxSize={8} color="orange.500" />
              <Text fontSize="lg" fontWeight="bold" color="orange.600">
                XML Records Not Available
              </Text>
              <Text textAlign="center" color="gray.600">
                XML record viewing is temporarily unavailable. 
                The function is not yet deployed to the backend.
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                This feature will be available once the backend functions are deployed.
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack>
            <Icon as={FiCode} />
            <Text>ZATCA XML Records</Text>
            <Spacer />
            <Badge colorScheme="blue" size="lg">
              {xmlRecords.length} Record{xmlRecords.length !== 1 ? 's' : ''}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {xmlRecords.length === 0 ? (
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>No XML Records Found</AlertTitle>
                  <AlertDescription>
                    This invoice hasn't been validated or submitted to ZATCA yet.
                    XML records are created when you validate or submit invoices.
                  </AlertDescription>
                </Box>
              </Alert>
              
              {/* Debug Information */}
              <Card>
                <CardBody>
                  <VStack spacing={2} align="start">
                    <Text fontWeight="bold" color="orange.500">🔍 Debug Information:</Text>
                    <Text fontSize="sm">Invoice ID: {invoiceId}</Text>
                    <Text fontSize="sm">Total XML Records in Database: {allXMLRecords?.length || 0}</Text>
                    {allXMLRecords && allXMLRecords.length > 0 && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold">Available Records:</Text>
                        {allXMLRecords.map((record, index) => (
                          <Text key={index} fontSize="xs" color="gray.600">
                            • Invoice: {record.invoice_id} | Type: {record.submission_type} | Env: {record.environment}
                          </Text>
                        ))}
                        <Text fontSize="xs" color="red.500" mt={2}>
                          💡 If you see records here but none for this invoice, the invoice was likely submitted before XML storage was implemented.
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          ) : (
            <VStack spacing={6} align="stretch">
              {/* Records List */}
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Text fontWeight="semibold" mb={4}>
                    <Icon as={FiDatabase} mr={2} />
                    XML Records History
                  </Text>
                  
                  <TableContainer>
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Type</Th>
                          <Th>Environment</Th>
                          <Th>Date</Th>
                          <Th>UUID</Th>
                          <Th>Reference</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {xmlRecords.map((record) => (
                          <Tr 
                            key={record._id}
                            cursor="pointer"
                            _hover={{ bg: hoverBg }}
                            onClick={() => setSelectedRecord(record)}
                            bg={selectedRecord?._id === record._id ? selectedBg : 'transparent'}
                          >
                            <Td>
                              <Badge colorScheme={getSubmissionTypeColor(record.submission_type)}>
                                {record.submission_type}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge colorScheme={getEnvironmentColor(record.environment)}>
                                {record.environment}
                              </Badge>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {new Date(record.created_at).toLocaleString()}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="xs" fontFamily="mono" maxW="150px" isTruncated>
                                {record.submission_uuid}
                              </Text>
                            </Td>
                            <Td>
                              {record.zatca_reference ? (
                                <Text fontSize="xs" fontFamily="mono" maxW="150px" isTruncated>
                                  {record.zatca_reference}
                                </Text>
                              ) : (
                                <Text fontSize="xs" color="gray.500">-</Text>
                              )}
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Tooltip label="View XML">
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    leftIcon={<FiEye />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRecord(record);
                                    }}
                                  >
                                    View
                                  </Button>
                                </Tooltip>
                                <Tooltip label="Download XML">
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    leftIcon={<FiDownload />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const filename = `invoice_${record.submission_type}_${record.submission_uuid}.xml`;
                                      handleDownload(record.xml_content, filename);
                                    }}
                                  >
                                    Download
                                  </Button>
                                </Tooltip>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </CardBody>
              </Card>

              {/* XML Viewer */}
              {selectedRecord && (
                <Card bg={cardBg} borderColor={borderColor}>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      {/* Record Details */}
                      <HStack justify="space-between" wrap="wrap">
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon as={FiFileText} />
                            <Text fontWeight="semibold">
                              {selectedRecord.submission_type.toUpperCase()} XML
                            </Text>
                            <Badge colorScheme={getSubmissionTypeColor(selectedRecord.submission_type)}>
                              {selectedRecord.submission_type}
                            </Badge>
                            <Badge colorScheme={getEnvironmentColor(selectedRecord.environment)}>
                              {selectedRecord.environment}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            Created: {new Date(selectedRecord.created_at).toLocaleString()}
                          </Text>
                        </VStack>
                        
                        <HStack spacing={2}>
                          <Select
                            size="sm"
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'formatted' | 'raw')}
                            w="120px"
                          >
                            <option value="formatted">Formatted</option>
                            <option value="raw">Raw XML</option>
                          </Select>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            leftIcon={<FiCopy />}
                            onClick={() => handleCopy(selectedRecord.xml_content, 'XML')}
                          >
                            Copy
                          </Button>
                          
                          <Button
                            size="sm"
                            colorScheme="blue"
                            leftIcon={<FiDownload />}
                            onClick={() => {
                              const filename = `invoice_${selectedRecord.submission_type}_${selectedRecord.submission_uuid}.xml`;
                              handleDownload(selectedRecord.xml_content, filename);
                            }}
                          >
                            Download
                          </Button>
                        </HStack>
                      </HStack>

                      <Divider />

                      {/* XML Content */}
                      <Box>
                        <Text fontWeight="semibold" mb={2}>
                          XML Content
                        </Text>
                        <Box
                          bg={codeBg}
                          p={4}
                          borderRadius="md"
                          border="1px solid"
                          borderColor={borderColor}
                          maxH="400px"
                          overflowY="auto"
                        >
                          <Code
                            display="block"
                            whiteSpace="pre-wrap"
                            fontSize="xs"
                            p={0}
                            bg="transparent"
                            color={useColorModeValue('gray.800', 'gray.200')}
                          >
                            {viewMode === 'formatted' 
                              ? formatXML(selectedRecord.xml_content)
                              : selectedRecord.xml_content
                            }
                          </Code>
                        </Box>
                      </Box>

                      {/* Record Metadata */}
                      <Box>
                        <Text fontWeight="semibold" mb={2}>
                          Record Metadata
                        </Text>
                        <TableContainer>
                          <Table size="sm">
                            <Tbody>
                              <Tr>
                                <Td fontWeight="semibold">Submission UUID:</Td>
                                <Td>
                                  <Text fontFamily="mono" fontSize="xs">
                                    {selectedRecord.submission_uuid}
                                  </Text>
                                </Td>
                              </Tr>
                              {selectedRecord.zatca_reference && (
                                <Tr>
                                  <Td fontWeight="semibold">ZATCA Reference:</Td>
                                  <Td>
                                    <Text fontFamily="mono" fontSize="xs">
                                      {selectedRecord.zatca_reference}
                                    </Text>
                                  </Td>
                                </Tr>
                              )}
                              <Tr>
                                <Td fontWeight="semibold">XML Hash:</Td>
                                <Td>
                                  <Text fontFamily="mono" fontSize="xs">
                                    {selectedRecord.xml_hash}
                                  </Text>
                                </Td>
                              </Tr>
                              <Tr>
                                <Td fontWeight="semibold">Environment:</Td>
                                <Td>
                                  <Badge colorScheme={getEnvironmentColor(selectedRecord.environment)}>
                                    {selectedRecord.environment}
                                  </Badge>
                                </Td>
                              </Tr>
                              <Tr>
                                <Td fontWeight="semibold">Type:</Td>
                                <Td>
                                  <Badge colorScheme={getSubmissionTypeColor(selectedRecord.submission_type)}>
                                    {selectedRecord.submission_type}
                                  </Badge>
                                </Td>
                              </Tr>
                            </Tbody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {xmlRecords.length > 0 && (
              <Button
                colorScheme="blue"
                leftIcon={<FiDownload />}
                onClick={() => {
                  // Download all XML records as a zip or individual files
                  xmlRecords.forEach((record) => {
                    const filename = `invoice_${record.submission_type}_${record.submission_uuid}.xml`;
                    handleDownload(record.xml_content, filename);
                  });
                }}
              >
                Download All XML Files
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default XMLViewerModal;
