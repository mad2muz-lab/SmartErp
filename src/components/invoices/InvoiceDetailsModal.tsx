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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Divider,
  Grid,
  GridItem,
  Button,
  useColorModeValue,
  Card,
  CardBody,
  Icon,
  Image,
  Flex,
  Spacer,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Progress,
  Tooltip,
  Box
} from '@chakra-ui/react';
import { 
  FiDownload, 
  FiPrinter, 
  FiEdit, 
  FiCalendar,
  FiUser,
  FiFileText,
  FiCheck,
  FiAlertCircle,
  FiShield,
  FiHome,
  FiMapPin,
  FiHash,
  FiPhone,
  FiMail,
  FiCode
} from 'react-icons/fi';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
// import SaudiRiyalDisplay from '../SaudiRiyalDisplay';
import ZATCAInvoiceActions from './ZATCAInvoiceActions';
import FormattedCurrencyDisplay from '../FormattedCurrencyDisplay';
import { ZatcaQRView, ZatcaTLVData, buildZatcaUblXml, ZatcaXmlViewerModal, ZatcaInvoicePayload, ZatcaInvoiceReceiptModal } from '../../modules/zatca';
// import { generateInvoicePDF, printInvoice } from '../../utils/pdfGenerator';

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice
}) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Fetch invoice details with items using deployed invoiceQueries:getInvoiceById
  const invoiceDetailsData = useQuery(
    (api as any).invoiceQueries.getInvoiceById,
    invoice?._id ? { invoice_id: invoice._id as Id<"invoices"> } : "skip"
  );
  const invoiceDetails = invoiceDetailsData ? {
    invoice: invoiceDetailsData.invoice,
    items: invoiceDetailsData.invoiceItems || []
  } : null;

  // TODO: Replace with actual submission status when function is deployed
  // const submissionStatus = useQuery(
  //   api.invoiceManagement.getInvoiceSubmissionStatus,
  //   invoice?._id ? { invoice_id: invoice._id as Id<"invoices"> } : "skip"
  // );
  const submissionStatus = null; // Temporary fix until function is deployed
  
  // TODO: Replace with actual compliance data when function is deployed
  // const rawComplianceData = useQuery(
  //   api.invoiceTemplates.getZATCAComplianceChecklist,
  //   invoice?._id ? { invoice_id: invoice._id as Id<"invoices"> } : "skip"
  // );
  const rawComplianceData = null; // Temporary fix until function is deployed

  // PDF generation action using deployed action
  const generatePDF = useAction((api as any)['pdf/invoiceGenerator'].generateInvoicePDF);
  
  // Use submission-aware compliance data
  const complianceData = submissionStatus ? {
    ...rawComplianceData,
    compliance_score: submissionStatus.compliance_score,
    is_compliant: submissionStatus.compliance_score === 100,
    summary: {
      ...rawComplianceData?.summary,
      missing_requirements: submissionStatus.compliance_score === 100 ? 0 : rawComplianceData?.summary?.missing_requirements || 0
    }
  } : rawComplianceData;

  // Fetch organization details
  const organizationDetails = useQuery(
    api.organizations.getOrganization,
    invoice?.organization_id ? { id: invoice.organization_id as Id<"organizations"> } : "skip"
  );

  // Create a refresh function that forces re-render
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleRefresh = () => {
    // Force re-render by updating the key
    setRefreshKey(prev => prev + 1);
  };

  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [generatedXml, setGeneratedXml] = useState('');

  const handleOpenXmlModal = () => {
    if (!invoice || !organizationDetails) return;

    const payload: ZatcaInvoicePayload = {
      uuid: invoice.zatca_submission_uuid || '00000000-0000-4000-8000-000000000000',
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type || 'standard',
      transactionType: invoice.transaction_type || 'invoice',
      issueDate: invoice.invoice_date,
      issueTime: invoice.invoice_time || '12:00:00',
      currency: invoice.currency || 'SAR',
      seller: {
        name: organizationDetails.name,
        nameArabic: organizationDetails.name_arabic,
        vatNumber: organizationDetails.vat_number || '310123456789003',
        address: {
          streetName: organizationDetails.address || 'King Fahd Road',
          buildingNumber: '1234',
          city: 'Riyadh',
          postalCode: '12345',
          district: 'Al Olaya',
          countryCode: 'SA',
        },
      },
      buyer: invoice.customer_name ? {
        name: invoice.customer_name,
        nameArabic: invoice.customer_name_arabic,
        vatNumber: invoice.customer_vat_number || '300000000000003',
        address: {
          streetName: invoice.customer_address || 'Customer Street',
          buildingNumber: '1000',
          city: 'Riyadh',
          postalCode: '12345',
          district: 'District',
          countryCode: 'SA',
        },
      } : undefined,
      items: (invoiceDetails?.items || []).map((item: any, idx: number) => ({
        id: (idx + 1).toString(),
        name: item.description,
        nameArabic: item.description_arabic,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || 0,
        vatRate: (item.vat_rate || 15) / 100,
        vatCategory: 'S',
        totalExcludingVat: (item.quantity || 1) * (item.unit_price || 0),
        vatAmount: item.vat_amount || 0,
        totalWithVat: item.total_amount || 0,
      })),
      subtotal: invoice.subtotal || 0,
      totalDiscount: invoice.total_discount || 0,
      taxableAmount: (invoice.subtotal || 0) - (invoice.total_discount || 0),
      vatTotal: invoice.total_vat || 0,
      grandTotal: invoice.grand_total || 0,
    };

    const xml = buildZatcaUblXml(payload);
    setGeneratedXml(xml);
    setIsXmlModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'sent': return 'blue';
      case 'paid': return 'green';
      case 'overdue': return 'red';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // Note: Using SaudiRiyalDisplay component for proper currency formatting

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownload = () => {
    if (!invoiceDetails || !organizationDetails) return;
    
    const pdfData = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      supply_date: invoice.supply_date,
      due_date: invoice.due_date || '',
      customer_name: invoice.customer_name,
      customer_name_arabic: invoice.customer_name_arabic,
      customer_address: invoice.customer_address,
      customer_address_arabic: invoice.customer_address_arabic,
      customer_vat_number: invoice.customer_vat_number || '',
      subtotal: invoice.subtotal,
      total_discount: invoice.total_discount || 0,
      total_vat: invoice.total_vat,
      grand_total: invoice.grand_total,
      currency: invoice.currency,
      vat_rate: invoice.vat_rate,
      tax_treatment: invoice.tax_treatment,
      tax_treatment_arabic: invoice.tax_treatment_arabic,
      notes: invoice.notes,
      notes_arabic: invoice.notes_arabic,
      items: invoiceDetails.items.map((item: any) => ({
        description: item.description,
        description_arabic: item.description_arabic,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        discount_percentage: item.discount_percentage,
        vat_rate: item.vat_rate,
        vat_amount: item.vat_amount,
        total_amount: item.total_amount,
      })),
      organization: {
        name: organizationDetails.name,
        name_arabic: organizationDetails.name_arabic,
        address: organizationDetails.address,
        address_arabic: organizationDetails.address_arabic,
        vat_number: organizationDetails.vat_number,
        vat_number_arabic: organizationDetails.vat_number_arabic,
        cr_number: organizationDetails.cr_number,
        cr_number_arabic: organizationDetails.cr_number_arabic,
        phone: organizationDetails.phone,
        email: organizationDetails.email,
        website: organizationDetails.website,
        logo_url: organizationDetails.logo_url,
      },
    };
    
    // Generate PDF using Convex action
    generatePDF({ invoice_id: invoice._id as Id<"invoices"> });
  };

  const handlePrint = () => {
    if (!invoiceDetails || !organizationDetails) return;
    
    const printData = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.invoice_date,
      supply_date: invoice.supply_date,
      due_date: invoice.due_date || '',
      customer_name: invoice.customer_name,
      customer_name_arabic: invoice.customer_name_arabic,
      customer_address: invoice.customer_address,
      customer_address_arabic: invoice.customer_address_arabic,
      customer_vat_number: invoice.customer_vat_number || '',
      subtotal: invoice.subtotal,
      total_discount: invoice.total_discount || 0,
      total_vat: invoice.total_vat,
      grand_total: invoice.grand_total,
      currency: invoice.currency,
      vat_rate: invoice.vat_rate,
      tax_treatment: invoice.tax_treatment,
      tax_treatment_arabic: invoice.tax_treatment_arabic,
      notes: invoice.notes,
      notes_arabic: invoice.notes_arabic,
      items: invoiceDetails.items.map((item: any) => ({
        description: item.description,
        description_arabic: item.description_arabic,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount || 0,
        discount_percentage: item.discount_percentage,
        vat_rate: item.vat_rate,
        vat_amount: item.vat_amount,
        total_amount: item.total_amount,
      })),
      organization: {
        name: organizationDetails.name,
        name_arabic: organizationDetails.name_arabic,
        address: organizationDetails.address,
        address_arabic: organizationDetails.address_arabic,
        vat_number: organizationDetails.vat_number,
        vat_number_arabic: organizationDetails.vat_number_arabic,
        cr_number: organizationDetails.cr_number,
        cr_number_arabic: organizationDetails.cr_number_arabic,
        phone: organizationDetails.phone,
        email: organizationDetails.email,
        website: organizationDetails.website,
        logo_url: organizationDetails.logo_url,
      },
    };
    
    // Print using Convex action (same as PDF generation)
    generatePDF({ invoice_id: invoice._id as Id<"invoices"> });
  };

  const handleEdit = () => {
    // TODO: Implement edit functionality
    console.log('Edit invoice:', invoice.invoice_number);
  };

  if (!invoice) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflowY="auto">
        <ModalHeader>
          <HStack>
            <Icon as={FiFileText} />
            <Text>Invoice Details</Text>
            <Spacer />
            <Badge colorScheme={getStatusColor(invoice.status)} size="lg">
              {invoice.status.toUpperCase()}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Invoice Header */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  <Box>
                    <Text fontWeight="bold" mb={3} fontSize="lg">
                      Invoice #{invoice.invoice_number}
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Icon as={FiCalendar} />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Date:</Text> {formatDate(invoice.invoice_date)}
                        </Text>
                      </HStack>
                      {invoice.supply_date && (
                        <HStack>
                          <Icon as={FiCalendar} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Supply Date:</Text> {formatDate(invoice.supply_date)}
                          </Text>
                        </HStack>
                      )}
                      {invoice.due_date && (
                        <HStack>
                          <Icon as={FiCalendar} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Due Date:</Text> {formatDate(invoice.due_date)}
                          </Text>
                        </HStack>
                      )}
                      <HStack>
                        <Icon as={FiFileText} />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Type:</Text> {invoice.invoice_type}
                        </Text>
                      </HStack>
                      {invoice.is_reverse_charge && (
                        <Badge colorScheme="orange" size="sm">
                          Reverse Charge
                        </Badge>
                      )}
                      {invoice.tax_treatment && (
                        <HStack>
                          <Icon as={FiShield} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Tax Treatment:</Text> {invoice.tax_treatment}
                          </Text>
                        </HStack>
                      )}
                      {invoice.tax_treatment_arabic && (
                        <HStack>
                          <Icon as={FiShield} />
                          <Text fontSize="sm" dir="rtl">
                            <Text as="span" fontWeight="medium">المعاملة الضريبية:</Text> {invoice.tax_treatment_arabic}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={3} fontSize="lg">
                      Customer Information
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Icon as={FiUser} />
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Name:</Text> {invoice.customer_name}
                        </Text>
                      </HStack>
                      {invoice.customer_name_arabic && (
                        <Text fontSize="sm" dir="rtl">
                          {invoice.customer_name_arabic}
                        </Text>
                      )}
                      {invoice.customer_vat_number && (
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">VAT:</Text> {invoice.customer_vat_number}
                        </Text>
                      )}
                      <Text fontSize="sm">
                        <Text as="span" fontWeight="medium">Address:</Text> {invoice.customer_address}
                      </Text>
                      {invoice.customer_address_arabic && (
                        <Text fontSize="sm" dir="rtl">
                          {invoice.customer_address_arabic}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </Grid>
              </CardBody>
            </Card>

            {/* Company Information */}
            {organizationDetails && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <Text fontWeight="bold" mb={3} fontSize="lg">
                    Company Information
                  </Text>
                  <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                    <Box>
                      <VStack align="stretch" spacing={2}>
                        <HStack>
                          <Icon as={FiHome} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Company:</Text> {organizationDetails.name}
                          </Text>
                        </HStack>
                        {organizationDetails.name_arabic && (
                          <HStack>
                            <Icon as={FiHome} />
                            <Text fontSize="sm" dir="rtl">
                              <Text as="span" fontWeight="medium">الشركة:</Text> {organizationDetails.name_arabic}
                            </Text>
                          </HStack>
                        )}
                        <HStack>
                          <Icon as={FiMapPin} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Address:</Text> {organizationDetails.address}
                          </Text>
                        </HStack>
                        {organizationDetails.address_arabic && (
                          <HStack>
                            <Icon as={FiMapPin} />
                            <Text fontSize="sm" dir="rtl">
                              <Text as="span" fontWeight="medium">العنوان:</Text> {organizationDetails.address_arabic}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                    <Box>
                      <VStack align="stretch" spacing={2}>
                        <HStack>
                          <Icon as={FiHash} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">VAT Number:</Text> {organizationDetails.vat_number}
                          </Text>
                        </HStack>
                        {organizationDetails.cr_number && (
                          <HStack>
                            <Icon as={FiHash} />
                            <Text fontSize="sm">
                              <Text as="span" fontWeight="medium">CR Number:</Text> {organizationDetails.cr_number}
                            </Text>
                          </HStack>
                        )}
                        <HStack>
                          <Icon as={FiPhone} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Phone:</Text> {organizationDetails.phone}
                          </Text>
                        </HStack>
                        <HStack>
                          <Icon as={FiMail} />
                          <Text fontSize="sm">
                            <Text as="span" fontWeight="medium">Email:</Text> {organizationDetails.email}
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  </Grid>
                  {organizationDetails.logo_url && (
                    <Box mt={4} textAlign="center">
                      <Image 
                        src={organizationDetails.logo_url} 
                        alt="Company Logo" 
                        maxH="100px" 
                        maxW="200px"
                        objectFit="contain"
                      />
                    </Box>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Invoice Items */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Text fontWeight="bold" mb={4}>Invoice Items</Text>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>#</Th>
                        <Th>Description</Th>
                        <Th>Qty</Th>
                        <Th>Unit Price</Th>
                        <Th>Discount</Th>
                        <Th>VAT %</Th>
                        <Th>VAT Amount</Th>
                        <Th>Total</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {invoiceDetails?.items && invoiceDetails.items.length > 0 ? (
                        invoiceDetails.items.map((item: any, index: number) => (
                          <Tr key={index}>
                            <Td>{item.item_number}</Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm">{item.description}</Text>
                                {item.description_arabic && (
                                  <Text fontSize="xs" color="gray.600" dir="rtl">
                                    {item.description_arabic}
                                  </Text>
                                )}
                                {item.supply_type && (
                                  <Badge size="xs" colorScheme={item.is_zero_rated ? "green" : item.is_exempt ? "purple" : "blue"}>
                                    {item.supply_type}
                                  </Badge>
                                )}
                              </VStack>
                            </Td>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm">{item.quantity}</Text>
                                <Text fontSize="xs" color="gray.600">{item.unit}</Text>
                              </VStack>
                            </Td>
                            <Td><Text color="green.600"><FormattedCurrencyDisplay amount={item.unit_price || 0} currency={invoice.currency || 'SAR'} /></Text></Td>
                            <Td><Text color="red.500"><FormattedCurrencyDisplay amount={item.discount_amount || 0} currency={invoice.currency || 'SAR'} /></Text></Td>
                            <Td>{(item.vat_rate || 15)}%</Td>
                            <Td><Text color="blue.600"><FormattedCurrencyDisplay amount={item.vat_amount || 0} currency={invoice.currency || 'SAR'} /></Text></Td>
                            <Td fontWeight="medium"><Text color="green.600" fontWeight="bold"><FormattedCurrencyDisplay amount={item.total_amount || 0} currency={invoice.currency || 'SAR'} /></Text></Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={8} textAlign="center" color="gray.500">
                            No items found
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </CardBody>
            </Card>

            {/* Invoice Summary */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                  <Box>
                    <Text fontWeight="bold" mb={3}>Terms & Conditions</Text>
                    <VStack align="stretch" spacing={2}>
                      <Text fontSize="sm">
                        <Text as="span" fontWeight="medium">Payment Terms:</Text> {invoice.payment_terms}
                      </Text>
                      <Text fontSize="sm">
                        <Text as="span" fontWeight="medium">Delivery Terms:</Text> {invoice.delivery_terms}
                      </Text>
                      {invoice.notes && (
                        <Text fontSize="sm">
                          <Text as="span" fontWeight="medium">Notes:</Text> {invoice.notes}
                        </Text>
                      )}
                    </VStack>
                  </Box>

                  <Box>
                    <Text fontWeight="bold" mb={3}>Invoice Summary</Text>
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Subtotal:</Text>
                        <Text color="green.600" fontSize="sm"><FormattedCurrencyDisplay amount={invoice.subtotal || 0} currency={invoice.currency || 'SAR'} /></Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Total Discount:</Text>
                        <Text fontSize="sm" color="red.500">
                          -<FormattedCurrencyDisplay amount={invoice.total_discount || 0} currency={invoice.currency || 'SAR'} />
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Total VAT:</Text>
                        <Text color="blue.600" fontSize="sm"><FormattedCurrencyDisplay amount={invoice.total_vat || 0} currency={invoice.currency || 'SAR'} /></Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between" fontWeight="bold">
                        <Text>Grand Total:</Text>
                        <Text color="blue.500" fontSize="lg" fontWeight="bold"><FormattedCurrencyDisplay amount={invoice.grand_total || 0} currency={invoice.currency || 'SAR'} /></Text>
                      </HStack>
                    </VStack>
                  </Box>
                </Grid>
              </CardBody>
            </Card>

            {/* ZATCA Compliance Status */}
            {complianceData && (
              <Card bg={cardBg} borderColor={borderColor}>
                <CardBody>
                  <HStack mb={4}>
                    <Icon as={FiShield} />
                    <Text fontWeight="bold">ZATCA Compliance Status</Text>
                    <Spacer />
                    <Badge colorScheme={complianceData.is_compliant ? "green" : "red"} size="lg">
                      {complianceData.compliance_score}%
                    </Badge>
                  </HStack>
                  
                  <Progress 
                    value={complianceData.compliance_score} 
                    colorScheme={complianceData.is_compliant ? "green" : "red"}
                    size="lg"
                    mb={4}
                  />
                  
                  <Alert status={complianceData.is_compliant ? "success" : "warning"}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle>
                        {complianceData.is_compliant ? "ZATCA Compliant" : "Compliance Issues"}
                      </AlertTitle>
                      <AlertDescription>
                        {complianceData.is_compliant 
                          ? "This invoice meets all ZATCA VAT Implementing Regulations requirements. You can now validate and submit to ZATCA."
                          : `${complianceData.summary.missing_requirements} requirements need attention.`
                        }
                      </AlertDescription>
                    </Box>
                  </Alert>
                  
                  {invoice.is_filed && (
                    <Alert status="info" mt={3}>
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Filed with ZATCA</AlertTitle>
                        <AlertDescription>
                          Filed on {invoice.filing_date} - Reference: {invoice.filing_reference}
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </CardBody>
              </Card>
            )}

            {/* Official ZATCA QR Code */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <HStack mb={3}>
                  <Icon as={FiShield} color="teal.500" />
                  <Text fontWeight="bold">Official ZATCA QR Code (رمز الاستجابة السريعة للهيئة)</Text>
                </HStack>
                <Box p={3} bg="gray.50" borderRadius="md" textAlign="center">
                  <ZatcaQRView
                    tlvData={{
                      sellerName: organizationDetails?.name || 'Seller',
                      vatNumber: organizationDetails?.vat_number || '310123456789003',
                      timestamp: `${invoice.invoice_date}T${invoice.invoice_time || '12:00:00'}Z`,
                      totalWithVat: invoice.grand_total || 0,
                      vatTotal: invoice.total_vat || 0,
                      invoiceHash: invoice.zatca_invoice_hash,
                      digitalSignature: invoice.zatca_digital_signature,
                    }}
                    size={160}
                    showInspectButton={true}
                  />
                </Box>
              </CardBody>
            </Card>

            {/* Invoice Metadata */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <Text fontWeight="bold" mb={3}>Invoice Information</Text>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Created</Text>
                    <Text fontSize="sm">{formatDate(invoice.created_at)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Last Updated</Text>
                    <Text fontSize="sm">{formatDate(invoice.updated_at)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Created By</Text>
                    <Text fontSize="sm">{invoice.created_by}</Text>
                  </Box>
                </Grid>
              </CardBody>
            </Card>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<FiEdit />}
              onClick={handleEdit}
            >
              Edit Invoice
            </Button>
            <Button
              colorScheme="green"
              leftIcon={<FiDownload />}
              onClick={handleDownload}
            >
              Download PDF
            </Button>
            <Button
              colorScheme="purple"
              leftIcon={<FiPrinter />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              colorScheme="orange"
              variant="solid"
              leftIcon={<FiPrinter />}
              onClick={() => setIsReceiptModalOpen(true)}
            >
              ZATCA Receipt (80mm POS)
            </Button>
            <Button
              colorScheme="teal"
              variant="outline"
              leftIcon={<FiCode />}
              onClick={handleOpenXmlModal}
            >
              ZATCA XML
            </Button>
          </HStack>
          
          {/* ZATCA Actions */}
          <VStack spacing={3} align="stretch" mt={4}>
            <Text fontWeight="semibold" fontSize="sm" color="gray.600">
              ZATCA Submission Status
            </Text>
            <ZATCAInvoiceActions 
              key={refreshKey}
              invoice={invoiceDetails?.invoice || invoice} 
              onRefresh={handleRefresh} 
            />
          </VStack>
        </ModalFooter>
      </ModalContent>

      {/* ZATCA UBL 2.1 XML Viewer & Exporter */}
      <ZatcaXmlViewerModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        xmlContent={generatedXml}
        invoiceNumber={invoice?.invoice_number || 'invoice'}
      />

      {/* ZATCA Thermal Receipt Modal (80mm & A4) */}
      <ZatcaInvoiceReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        sellerName={organizationDetails?.name || 'شركة النجاح للتجارة والمقاولات'}
        sellerVatNumber={organizationDetails?.vat_number || '310860308200003'}
        sellerCrNumber={organizationDetails?.cr_number}
        sellerAddress={organizationDetails?.address}
        sellerPhone={organizationDetails?.phone}
        invoiceNumber={invoice?.invoice_number || 'INV-2026-00001'}
        invoiceDate={invoice?.invoice_date || new Date().toISOString()}
        invoiceTime={invoice?.invoice_time || '12:00:00'}
        invoiceType={invoice?.invoice_type === 'simplified' ? 'simplified' : 'standard'}
        customerName={invoice?.customer_name}
        customerVatNumber={invoice?.customer_vat_number}
        items={(invoiceDetails?.items || []).map((it: any) => ({
          name: it.description || it.inventory_name || 'Item',
          nameArabic: it.description_arabic,
          qty: it.quantity || 1,
          unitPrice: it.unit_price || 0,
          vatRate: it.vat_rate || 15,
          subtotal: it.total_amount || (it.quantity * it.unit_price) || 0,
        }))}
        subtotal={invoice?.subtotal || 0}
        totalVat={invoice?.total_vat || 0}
        grandTotal={invoice?.grand_total || 0}
        currency={invoice?.currency || 'SAR'}
        invoiceHash={invoice?.zatca_invoice_hash}
        digitalSignature={invoice?.zatca_digital_signature}
      />
    </Modal>
  );
};

export default InvoiceDetailsModal;
