import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  useToast,
  useColorModeValue,
  useBreakpointValue,
  useMediaQuery,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Divider,
  Badge,
  Flex,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
} from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../contexts/shared/AuthContext';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiDownload, 
  FiPrinter, 
  FiShare2, 
  FiMoreVertical,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiFileText
} from 'react-icons/fi';
import QRCode from 'qrcode';
import { useNavigate, useParams } from 'react-router-dom';

interface Invoice {
  _id: string;
  // Quotation fields
  quotation_number?: string;
  // Delivery note fields  
  delivery_note_number?: string;
  // Common fields
  customer_id: string;
  customer_name?: string;
  issue_date?: string;
  valid_until?: string; // For quotations
  delivery_date?: string; // For delivery notes
  currency?: string;
  total_amount?: number;
  subtotal?: number;
  status: string;
  quotation_id?: string;
  delivery_note_id?: string;
  _creationTime: number;
  updated_at?: string;
  created_at?: string;
}

const InvoiceViewScreen: React.FC = () => {
  console.log('🚀 InvoiceViewScreen component loaded');
  const { user, organizationDetails, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isLargerThan768] = useMediaQuery('(min-width: 768px)');

  // Generate QR code for the invoice
  const generateQRCode = async (invoiceData: any) => {
    try {
      const qrData = {
        invoiceNumber: invoiceData.quotation_number || invoiceData.delivery_note_number,
        customerName: invoiceData.customer_name,
        amount: invoiceData.total_amount || invoiceData.subtotal || 0,
        date: invoiceData.issue_date || new Date().toISOString(),
        organization: organizationDetails?.name,
        uuid: invoiceData._id
      };
      
      const qrString = JSON.stringify(qrData);
      const qrCodeUrl = await QRCode.toDataURL(qrString, {
        width: 120,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrCodeUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // For now, we'll use quotations data as invoices since the invoice functions aren't deployed
  const quotations = useQuery(
    api.quotations.listQuotations,
    organizationDetails?._id ? {
      organization_id: organizationDetails._id,
    } : 'skip'
  );

  // Also get delivery notes data
  const deliveryNotes = useQuery(
    api.deliveryNotes.listDeliveryNotes,
    organizationDetails?._id ? {
      organization_id: organizationDetails._id,
    } : 'skip'
  );

  // Get organization details for invoice header
  const organization = useQuery(
    api.organizations.getOrganization,
    organizationDetails?._id ? {
      id: organizationDetails._id,
    } : 'skip'
  );

  // Use organizationDetails as fallback if organization query fails
  const orgData = organization || organizationDetails;
  
  console.log('📊 Organization Data Debug:', {
    organization,
    organizationDetails,
    orgData,
    hasOrgData: !!orgData,
    logoUrl: orgData?.logo_url
  });

  // Find the invoice (check both quotations and delivery notes)
  const quotationInvoice = quotations?.find(q => q._id === id);
  const deliveryNoteInvoice = deliveryNotes?.find(dn => dn._id === id);
  const invoice = quotationInvoice || deliveryNoteInvoice;

  // Debug logging
  console.log('InvoiceViewScreen Debug:', {
    id,
    quotationsCount: quotations?.length,
    deliveryNotesCount: deliveryNotes?.length,
    quotationInvoice,
    deliveryNoteInvoice,
    invoice,
    organization,
    organizationDetails,
    orgData,
    logoUrl: orgData?.logo_url,
    hasLogo: !!orgData?.logo_url,
    organizationId: organizationDetails?._id,
    invoiceFields: invoice ? Object.keys(invoice) : null,
    invoiceAmounts: invoice ? {
      subtotal: invoice.subtotal,
      total_amount: invoice.total_amount,
      grand_total: invoice.grand_total
    } : null
  });

  // Generate QR code when invoice data is available
  React.useEffect(() => {
    if (invoice && orgData) {
      generateQRCode(invoice);
    }
  }, [invoice, orgData]);

  // Show loading while auth is initializing
  if (authLoading || !organizationDetails) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Invoice Details</Heading>
            <Text color="gray.600">Loading...</Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box>
        <VStack spacing={6} align="stretch">
          <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
            <HStack spacing={4}>
              <Button
                leftIcon={<FiArrowLeft />}
                variant="ghost"
                onClick={() => navigate('/invoices')}
              >
                Back to Invoices
              </Button>
              <Box>
                <Heading size="lg" mb={2}>Invoice Not Found</Heading>
                <Text color="gray.600">
                  The requested invoice could not be found.
                </Text>
              </Box>
            </HStack>
          </Flex>
          <Alert status="error">
            <AlertIcon />
            <Box>
              <AlertTitle>Invoice not found!</AlertTitle>
              <AlertDescription>
                The invoice you're looking for doesn't exist or you don't have permission to view it.
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      </Box>
    );
  }

  const formatCurrency = (amount: number, currency?: string) => {
    const validCurrency = currency && currency.length === 3 ? currency : 'SAR';
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: validCurrency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-SA');
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast({
      title: 'Download Started',
      description: 'Invoice PDF download will be available soon.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Invoice ${invoice.quotation_number || invoice.delivery_note_number}`,
        text: `Invoice ${invoice.quotation_number || invoice.delivery_note_number} for ${invoice.customer_name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link Copied',
        description: 'Invoice link copied to clipboard.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <style>
        {`
          @media print {
            .invoice-template {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              box-shadow: none !important;
              border: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4} className="no-print">
          <HStack spacing={4}>
            <Button
              leftIcon={<FiArrowLeft />}
              variant="ghost"
              onClick={() => navigate('/invoices')}
            >
              Back to Invoices
            </Button>
            <Box>
              <Heading size="lg" mb={2}>Invoice {invoice.quotation_number || invoice.delivery_note_number}</Heading>
              <Text color="gray.600">
                Created on {formatDate(new Date(invoice._creationTime).toISOString())}
              </Text>
            </Box>
          </HStack>
          <HStack spacing={2}>
            <Button
              leftIcon={<FiEdit />}
              variant="outline"
              onClick={() => navigate(`/invoices/${invoice._id}/edit`)}
            >
              Edit
            </Button>
            <Button
              leftIcon={<FiPrinter />}
              colorScheme="blue"
              onClick={handlePrint}
            >
              Print
            </Button>
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMoreVertical />}
                variant="outline"
              />
              <MenuList>
                <MenuItem icon={<FiDownload />} onClick={handleDownload}>
                  Download PDF
                </MenuItem>
                <MenuItem icon={<FiShare2 />} onClick={handleShare}>
                  Share
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>

        {/* Professional Invoice Template */}
        <Box
          maxW="100%"
          mx="auto"
          bg="white"
          p={6}
          border="1px solid #e2e8f0"
          borderRadius="md"
          boxShadow="lg"
          className="invoice-template"
          overflow="hidden"
        >
          {/* Professional Letterhead Header */}
          <Box
            border="1px solid #333"
            p={4}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            minH="80px"
            mb={5}
            bg="white"
          >
            {/* Left Side: English Company Info */}
            <Box flex="1" textAlign="left" fontSize="11px">
              {orgData?.name && (
                <Text fontWeight="bold" fontSize="13px" mb={1}>
                  {orgData.name}
                </Text>
              )}
              {orgData?.address && (
                <Text fontSize="10px" mb={1}>
                  {orgData.address}
                </Text>
              )}
              {orgData?.vat_number && (
                <Text fontSize="10px" mb={1}>
                  VAT: {orgData.vat_number}
                </Text>
              )}
              {orgData?.cr_number && (
                <Text fontSize="10px" mb={1}>
                  CR: {orgData.cr_number}
                </Text>
              )}
              {orgData?.email && (
                <Text fontSize="10px" mb={1}>
                  Email: {orgData.email}
                </Text>
              )}
              {orgData?.phone && (
                <Text fontSize="10px" mb={1}>
                  Phone: {orgData.phone}
                </Text>
              )}
            </Box>

            {/* Center: Logo */}
            <Box flex="1" display="flex" justifyContent="center" alignItems="center">
              {orgData?.logo_url ? (
                <img 
                  src={orgData.logo_url} 
                  alt="Company Logo" 
                  style={{ 
                    maxHeight: '112px', 
                    maxWidth: '210px', 
                    objectFit: 'contain',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '8px',
                    backgroundColor: 'white'
                  }}
                  onError={(e) => {
                    console.log('Logo failed to load:', orgData.logo_url);
                    e.currentTarget.style.display = 'none';
                    // Show fallback text
                    const fallbackText = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                    if (fallbackText) {
                      (fallbackText as HTMLElement).style.display = 'block';
                    }
                  }}
                />
              ) : null}
              <Text 
                className="logo-fallback"
                fontSize="20px" 
                color="#d32f2f" 
                fontWeight="bold"
                style={{ display: orgData?.logo_url ? 'none' : 'block' }}
              >
                INVOICE
              </Text>
            </Box>

            {/* Right Side: Arabic Company Info */}
            <Box flex="1" textAlign="right" fontSize="11px" dir="rtl">
              {orgData?.name_arabic && (
                <Text fontWeight="bold" fontSize="13px" mb={1} fontFamily="'Noto Sans Arabic', 'Amiri', Arial, sans-serif">
                  {orgData.name_arabic}
                </Text>
              )}
              {orgData?.address_arabic && (
                <Text fontSize="10px" mb={1} fontFamily="'Noto Sans Arabic', 'Amiri', Arial, sans-serif">
                  {orgData.address_arabic}
                </Text>
              )}
              {orgData?.vat_number_arabic && (
                <Text fontSize="10px" mb={1} fontFamily="'Noto Sans Arabic', 'Amiri', Arial, sans-serif">
                  رقم الضريبة: {orgData.vat_number_arabic}
                </Text>
              )}
              {orgData?.cr_number_arabic && (
                <Text fontSize="10px" mb={1} fontFamily="'Noto Sans Arabic', 'Amiri', Arial, sans-serif">
                  س.ت: {orgData.cr_number_arabic}
                </Text>
              )}
            </Box>
          </Box>

          {/* Invoice Title */}
          <Box
            textAlign="center"
            mb={4}
            p={3}
            border="1px solid #333"
            bg="gray.50"
          >
            <Text fontSize="16px" fontWeight="bold" mb={1} color="#333">
              TAX INVOICE
            </Text>
            <Text fontSize="14px" fontWeight="bold" color="#333" fontFamily="'Noto Sans Arabic', 'Amiri', Arial, sans-serif" dir="rtl">
              فاتورة ضريبية
            </Text>
          </Box>

          {/* Seller and Buyer Details */}
          <Box display="flex" gap={4} mb={4}>
            {/* Seller Details */}
            <Box flex="1" p={3} border="1px solid #333">
              <Text fontWeight="bold" mb={2} fontSize="13px">
                Seller Details / تفاصيل المورد
              </Text>
              <VStack align="start" spacing={1} fontSize="11px">
                <HStack>
                  <Text fontWeight="bold" minW="80px">Name:</Text>
                  <Text>{organization?.name || 'Company Name'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Street Name:</Text>
                  <Text>{organization?.street || 'Street Address'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Building No:</Text>
                  <Text>{organization?.building_number || '1234'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">City:</Text>
                  <Text>{organization?.city || 'Riyadh'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Addl. No:</Text>
                  <Text>{organization?.additional_number || '5678'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">District:</Text>
                  <Text>{organization?.district || 'District'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Postal Code:</Text>
                  <Text>{organization?.zip_postal_code || '12345'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Country:</Text>
                  <Text>{organization?.country || 'Saudi Arabia'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">VAT Number:</Text>
                  <Text>{organization?.vat_number || '300000000000003'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">CR Number:</Text>
                  <Text>{organization?.cr_number || 'CR123456789'}</Text>
                </HStack>
              </VStack>
            </Box>

            {/* Buyer Details */}
            <Box flex="1" p={3} border="1px solid #333">
              <Text fontWeight="bold" mb={2} fontSize="13px">
                Buyer Details / تفاصيل شركة العميل
              </Text>
              <VStack align="start" spacing={1} fontSize="11px">
                <HStack>
                  <Text fontWeight="bold" minW="80px">Name:</Text>
                  <Text>{invoice.customer_name || 'Customer Name'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Street Name:</Text>
                  <Text>{invoice.customer_address || 'Customer Address'}</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Building No:</Text>
                  <Text>N/A</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">City:</Text>
                  <Text>N/A</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Addl. No:</Text>
                  <Text>N/A</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">District:</Text>
                  <Text>N/A</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Postal Code:</Text>
                  <Text>N/A</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">Country:</Text>
                  <Text>Saudi Arabia</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">VAT Number:</Text>
                  <Text>N/A</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="80px">CR Number:</Text>
                  <Text>N/A</Text>
                </HStack>
              </VStack>
            </Box>
          </Box>

          {/* Invoice Dates and Terms */}
          <Box mb={4} p={3} border="1px solid #333">
            <SimpleGrid columns={4} spacing={4} fontSize="11px">
              <Box>
                <Text fontWeight="bold">Invoice Date / تاريخ الفاتورة:</Text>
                <Text>{invoice.issue_date ? formatDate(invoice.issue_date) : formatDate(new Date().toISOString())}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Supply Date / تاريخ التسليم:</Text>
                <Text>{invoice.delivery_date ? formatDate(invoice.delivery_date) : 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Contract/PO No / رقم أمر الشراء:</Text>
                <Text>{invoice.customer_po_project_ref || 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Due Date / تاريخ الاستحقاق:</Text>
                <Text>{invoice.valid_until ? formatDate(invoice.valid_until) : 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Invoice Period / فترة الفاتورة:</Text>
                <Text>N/A</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Project / Reference No / رقم المرجع:</Text>
                <Text>{invoice.quotation_number || invoice.delivery_note_number || 'N/A'}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Payment Terms / شروط الدفع:</Text>
                <Text>Upon Delivery</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Delivery Reference / رقم مرجع التسليم:</Text>
                <Text>{invoice.delivery_note_number || 'N/A'}</Text>
              </Box>
            </SimpleGrid>
          </Box>

          {/* Comprehensive Invoice Items Table */}
          <Box mb={4}>
            <TableContainer>
              <Table variant="simple" size="sm" border="1px solid #333">
                <Thead>
                  <Tr bg="gray.100">
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">#</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Code (SKU) / الرمز</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Nature of goods or service / تفاصيل السلع أو الخدمات</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Qty / الكمية</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Unit / الوحدة</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Unit Price (SAR) / سعر الوحدة (ريال سعودي)</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Discount (SAR) / الخصومات (ريال سعودي)</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Taxable Amount (SAR) / سعر الخاضع للضريبة (ريال سعودي)</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Tax Rate % / نسبة الضريبة</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Tax Amount (SAR) / مبلغ الضريبة (ريال سعودي)</Th>
                    <Th border="1px solid #333" fontSize="9px" textAlign="center">Total with Tax (SAR) / الإجمالي (ريال سعودي)</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">1</Td>
                    <Td border="1px solid #333" fontSize="9px">{invoice.quotation_number || invoice.delivery_note_number}</Td>
                    <Td border="1px solid #333" fontSize="9px">
                      {invoice.notes || 'Delivery of goods and services'}
                    </Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">1</Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">pcs</Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">
                      {formatCurrency(invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000, invoice.currency || 'SAR')}
                    </Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">0.00</Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">
                      {formatCurrency(invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000, invoice.currency || 'SAR')}
                    </Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">15%</Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">
                      {formatCurrency((invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000) * 0.15, invoice.currency || 'SAR')}
                    </Td>
                    <Td border="1px solid #333" textAlign="center" fontSize="9px">
                      {formatCurrency((invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000) * 1.15, invoice.currency || 'SAR')}
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
            <Text fontSize="9px" mt={2} textAlign="center">
              ***** Nothing follow / لا شيء يتبع*****
            </Text>
          </Box>

          {/* Amount in Words and Financial Summary */}
          <Box display="flex" gap={4} mb={4}>
            {/* Amount in Words */}
            <Box flex="1" p={3} border="1px solid #333">
              <Text fontWeight="bold" mb={2} fontSize="12px">
                Amount in Words / المبلغ بالكلمات
              </Text>
              <Text fontSize="11px" mb={1}>
                {(() => {
                  const amount = (invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000) * 1.15;
                  const amountStr = amount.toFixed(2);
                  return `${amountStr} Saudi Riyals only.`;
                })()}
              </Text>
              <Text fontSize="11px" fontFamily="'Noto Sans Arabic', 'Amiri', Arial, sans-serif" dir="rtl">
                {(() => {
                  const amount = (invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000) * 1.15;
                  const amountStr = amount.toFixed(2);
                  return `${amountStr} ريال سعودي فقط`;
                })()}
              </Text>
            </Box>

            {/* Financial Summary */}
            <Box flex="1" p={3} border="1px solid #333" bg="gray.50">
              <Text fontWeight="bold" mb={2} fontSize="12px">
                Financial Summary / الملخص المالي
              </Text>
              <VStack align="end" spacing={1} fontSize="11px">
                <HStack>
                  <Text>Gross Total / السعر الاجمالي:</Text>
                  <Text fontWeight="bold">
                    {formatCurrency(invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000, invoice.currency || 'SAR')}
                  </Text>
                </HStack>
                <HStack>
                  <Text>Total Discount / الخصم الاضاقي:</Text>
                  <Text fontWeight="bold">0.00</Text>
                </HStack>
                <HStack>
                  <Text>Total excl. VAT / الإجمالي غير شامل ضريبة القيمة المضافة:</Text>
                  <Text fontWeight="bold">
                    {formatCurrency(invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000, invoice.currency || 'SAR')}
                  </Text>
                </HStack>
                <HStack>
                  <Text>VAT Amount / ضريبة القيمة المضافة:</Text>
                  <Text fontWeight="bold">
                    {formatCurrency((invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000) * 0.15, invoice.currency || 'SAR')}
                  </Text>
                </HStack>
                <HStack>
                  <Text>Amount Incl. VAT / المبلغ شاملاً ضريبة القيمة المضافة:</Text>
                  <Text fontWeight="bold" fontSize="12px" color="green.600">
                    {formatCurrency((invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000) * 1.15, invoice.currency || 'SAR')}
                  </Text>
                </HStack>
                <HStack>
                  <Text>Less: Advance / أقل : المبلغ المستلم مقدما:</Text>
                  <Text fontWeight="bold">0.00</Text>
                </HStack>
                <HStack>
                  <Text>Less: Other Deductions / أقل : حسومات أخرى:</Text>
                  <Text fontWeight="bold">0.00</Text>
                </HStack>
                <HStack>
                  <Text>Less: Retention / أقل : مبلغ الاحتفاظ:</Text>
                  <Text fontWeight="bold">0.00</Text>
                </HStack>
                <HStack>
                  <Text>Balance Due / إجمالي المبلغ المستحق:</Text>
                  <Text fontWeight="bold" fontSize="12px" color="green.600">
                    {formatCurrency((invoice.subtotal || invoice.total_amount || invoice.grand_total || 1000) * 1.15, invoice.currency || 'SAR')}
                  </Text>
                </HStack>
              </VStack>
            </Box>
          </Box>

          {/* Payment Details and QR Code */}
          <Box display="flex" gap={4} mb={4}>
            {/* Payment Details */}
            <Box flex="1" p={3} border="1px solid #333">
              <Text fontWeight="bold" mb={2} fontSize="12px">
                Payment Details / تفاصيل الدفع
              </Text>
              <VStack align="start" spacing={1} fontSize="11px">
                <HStack>
                  <Text fontWeight="bold" minW="100px">Account Number / رقم الحساب:</Text>
                  <Text>12345678901234</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="100px">Bank:</Text>
                  <Text>Al Rajhi Bank</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="100px">IBAN:</Text>
                  <Text>SA5380000112345678901234</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="100px">Account Holder:</Text>
                  <Text>Al Huda Trading Est.</Text>
                </HStack>
                <HStack>
                  <Text fontWeight="bold" minW="100px">Swift:</Text>
                  <Text>RJHISARI</Text>
                </HStack>
              </VStack>
            </Box>

            {/* QR Code */}
            <Box flex="1" p={3} border="1px solid #333" textAlign="center">
              <Text fontWeight="bold" mb={2} fontSize="12px">
                QR Code / رمز الاستجابة السريعة
              </Text>
              <Box 
                width="120px" 
                height="120px" 
                bg="white" 
                border="1px solid #333" 
                mx="auto" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                mb={2}
              >
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain' 
                    }}
                  />
                ) : (
                  <Text fontSize="9px" textAlign="center">
                    QR Code<br/>Loading...
                  </Text>
                )}
              </Box>
              <Text fontSize="9px">UUID: {invoice._id.slice(-8)}</Text>
              <Text fontSize="9px">Invoice: {invoice.quotation_number || invoice.delivery_note_number}</Text>
            </Box>
          </Box>

          {/* Footer */}
          <Box textAlign="center" fontSize="9px" mt={6}>
            <Text>
              This invoice was generated by TradingERP System - ZATCA Phase 2 Compliant
            </Text>
          </Box>
        </Box>

        {/* Actions */}
        <Card className="no-print">
          <CardBody>
            <HStack spacing={4} justify="center">
              <Button
                leftIcon={<FiEdit />}
                variant="outline"
                onClick={() => navigate(`/invoices/${invoice._id}/edit`)}
              >
                Edit Invoice
              </Button>
              <Button
                leftIcon={<FiPrinter />}
                colorScheme="blue"
                onClick={handlePrint}
              >
                Print Invoice
              </Button>
              <Button
                leftIcon={<FiDownload />}
                variant="outline"
                onClick={handleDownload}
              >
                Download PDF
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default InvoiceViewScreen;
