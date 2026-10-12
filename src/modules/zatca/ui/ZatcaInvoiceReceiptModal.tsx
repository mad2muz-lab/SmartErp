import React, { useRef } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  VStack,
  Text,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPrinter, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { ZatcaQRView } from './ZatcaQRView';
import { RiyalCurrencySymbol } from '../../../components/icons/SaudiRiyalIcon';

export interface ZatcaReceiptItem {
  name: string;
  nameArabic?: string;
  qty: number;
  unitPrice: number;
  vatRate: number; // e.g. 15
  subtotal: number;
}

export interface ZatcaReceiptProps {
  isOpen: boolean;
  onClose: () => void;
  sellerName: string;
  sellerVatNumber: string;
  sellerCrNumber?: string;
  sellerAddress?: string;
  sellerPhone?: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO or YYYY-MM-DD
  invoiceTime?: string; // HH:mm:ss
  invoiceType?: 'simplified' | 'standard';
  customerName?: string;
  customerVatNumber?: string;
  items: ZatcaReceiptItem[];
  subtotal: number;
  totalVat: number;
  grandTotal: number;
  currency?: string;
  invoiceHash?: string;
  digitalSignature?: string;
}

export const ZatcaInvoiceReceiptModal: React.FC<ZatcaReceiptProps> = ({
  isOpen,
  onClose,
  sellerName,
  sellerVatNumber,
  sellerCrNumber,
  sellerAddress,
  sellerPhone,
  invoiceNumber,
  invoiceDate,
  invoiceTime = '12:00:00',
  invoiceType = 'simplified',
  customerName,
  customerVatNumber,
  items,
  subtotal,
  totalVat,
  grandTotal,
  currency = 'SAR',
  invoiceHash,
  digitalSignature,
}) => {
  const [format, setFormat] = React.useState<'thermal80' | 'a4'>('thermal80');
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${invoiceNumber} - ZATCA Receipt</title>
          <style>
            @page {
              size: ${format === 'thermal80' ? '80mm auto' : 'A4'};
              margin: ${format === 'thermal80' ? '4mm' : '15mm'};
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #111;
              background: #fff;
              margin: 0;
              padding: ${format === 'thermal80' ? '2mm' : '8mm'};
              direction: rtl;
              font-size: ${format === 'thermal80' ? '11px' : '13px'};
              line-height: 1.35;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .left { text-align: left; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #555; margin: 6px 0; }
            .double-divider { border-bottom: 2px solid #111; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 4px 2px; }
            th { border-bottom: 1px solid #333; font-weight: bold; }
            .qr-container { display: flex; justify-content: center; margin: 8px 0; }
            .muted { color: #666; font-size: 0.9em; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const isoTimestamp = `${invoiceDate.split('T')[0]}T${invoiceTime}Z`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={format === 'thermal80' ? 'md' : '4xl'}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader borderBottomWidth="1px" pb={3}>
          <HStack justify="space-between" pr={6}>
            <VStack align="start" spacing={0}>
              <Text fontSize="md" fontWeight="bold">
                {format === 'thermal80' ? 'إيصال حراري (80 مم) - Thermal POS' : 'فاتورة ضريبية رسمية (A4)'}
              </Text>
              <Text fontSize="xs" color="gray.500">
                متوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA Phase 1 & 2)
              </Text>
            </VStack>
            <ButtonGroup size="xs" isAttached variant="outline">
              <Button
                colorScheme={format === 'thermal80' ? 'teal' : 'gray'}
                variant={format === 'thermal80' ? 'solid' : 'outline'}
                onClick={() => setFormat('thermal80')}
              >
                80mm POS
              </Button>
              <Button
                colorScheme={format === 'a4' ? 'teal' : 'gray'}
                variant={format === 'a4' ? 'solid' : 'outline'}
                onClick={() => setFormat('a4')}
              >
                A4 Invoice
              </Button>
            </ButtonGroup>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={4} bg={useColorModeValue('gray.50', 'gray.900')}>
          <Box
            ref={printRef}
            bg="white"
            color="black"
            p={format === 'thermal80' ? 4 : 8}
            borderRadius="md"
            boxShadow="sm"
            mx="auto"
            maxW={format === 'thermal80' ? '340px' : '760px'}
            dir="rtl"
            fontFamily="Arial, sans-serif"
            fontSize={format === 'thermal80' ? '12px' : '14px'}
          >
            {/* Header */}
            <VStack spacing={1} textAlign="center" mb={2}>
              <Text fontWeight="bold" fontSize={format === 'thermal80' ? 'md' : 'xl'}>
                {sellerName}
              </Text>
              {sellerAddress && (
                <Text fontSize="xs" color="gray.600">
                  {sellerAddress}
                </Text>
              )}
              {sellerPhone && (
                <Text fontSize="xs" color="gray.600">
                  هاتف / Tel: {sellerPhone}
                </Text>
              )}
              <Text fontSize="xs" fontWeight="bold">
                الرقم الضريبي (TRN): {sellerVatNumber}
              </Text>
              {sellerCrNumber && (
                <Text fontSize="xs" color="gray.600">
                  س.ت / CR: {sellerCrNumber}
                </Text>
              )}
            </VStack>

            <Box borderBottom="2px solid black" my={2} />

            <VStack spacing={0.5} textAlign="center" mb={2}>
              <Text fontWeight="bold" fontSize="sm">
                {invoiceType === 'simplified' ? 'فاتورة ضريبية مبسطة' : 'فاتورة ضريبية'}
              </Text>
              <Text fontSize="2xs" color="gray.600">
                {invoiceType === 'simplified' ? 'SIMPLIFIED TAX INVOICE' : 'TAX INVOICE'}
              </Text>
              <Text fontSize="xs" fontWeight="semibold">
                رقم الفاتورة: {invoiceNumber}
              </Text>
              <Text fontSize="xs" color="gray.600">
                التاريخ: {invoiceDate.split('T')[0]} {invoiceTime}
              </Text>
            </VStack>

            {customerName && (
              <Box borderTop="1px dashed #888" pt={2} mb={2} fontSize="xs">
                <Text fontWeight="semibold">العميل / Buyer: {customerName}</Text>
                {customerVatNumber && <Text>الرقم الضريبي للعميل: {customerVatNumber}</Text>}
              </Box>
            )}

            <Box borderBottom="1px dashed #888" my={2} />

            {/* Line Items */}
            <Box my={2}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: format === 'thermal80' ? '11px' : '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid black', textAlign: 'right' }}>
                    <th style={{ padding: '4px 2px' }}>الصنف / Item</th>
                    <th style={{ padding: '4px 2px', textAlign: 'center' }}>الكمية</th>
                    <th style={{ padding: '4px 2px', textAlign: 'left' }}>السعر</th>
                    <th style={{ padding: '4px 2px', textAlign: 'left' }}>المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                      <td style={{ padding: '4px 2px' }}>
                        <div>{item.nameArabic || item.name}</div>
                        {item.nameArabic && <div style={{ fontSize: '0.85em', color: '#666' }}>{item.name}</div>}
                      </td>
                      <td style={{ padding: '4px 2px', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'left' }}>{item.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'left', fontWeight: 'bold' }}>
                        {item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <Box borderBottom="1px dashed #888" my={2} />

            {/* Totals */}
            <VStack spacing={1} align="stretch" fontSize={format === 'thermal80' ? 'xs' : 'sm'}>
              <HStack justify="space-between">
                <Text>المجموع الفرعي (غير شامل الضريبة):</Text>
                <Text fontWeight="semibold" display="inline-flex" alignItems="center">
                  {subtotal.toFixed(2)} {currency === 'SAR' ? <RiyalCurrencySymbol boxSize="0.95em" ml="2px" /> : currency}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text>ضريبة القيمة المضافة (15% VAT):</Text>
                <Text fontWeight="semibold" display="inline-flex" alignItems="center">
                  {totalVat.toFixed(2)} {currency === 'SAR' ? <RiyalCurrencySymbol boxSize="0.95em" ml="2px" /> : currency}
                </Text>
              </HStack>
              <Box borderBottom="2px solid black" my={1} />
              <HStack justify="space-between" fontSize={format === 'thermal80' ? 'sm' : 'md'} fontWeight="bold">
                <Text>المجموع الكلي (شامل الضريبة):</Text>
                <Text display="inline-flex" alignItems="center">
                  {grandTotal.toFixed(2)} {currency === 'SAR' ? <RiyalCurrencySymbol boxSize="1em" ml="2px" /> : currency}
                </Text>
              </HStack>
            </VStack>

            <Box borderBottom="2px solid black" my={2} />

            {/* Official ZATCA QR Code */}
            <VStack spacing={1} align="center" my={2}>
              <ZatcaQRView
                tlvData={{
                  sellerName,
                  vatNumber: sellerVatNumber,
                  timestamp: isoTimestamp,
                  totalWithVat: grandTotal,
                  vatTotal: totalVat,
                  invoiceHash,
                  digitalSignature,
                }}
                size={format === 'thermal80' ? 140 : 160}
                showInspectButton={false}
              />
              <Text fontSize="2xs" color="gray.500" mt={1}>
                امسح الرمز عبر تطبيق (زاتكا - ZATCA) للتحقق من الفاتورة
              </Text>
            </VStack>

            <Box borderTop="1px dashed #888" pt={2} textAlign="center" fontSize="2xs" color="gray.600">
              <Text>شكراً لتعاملكم معنا • Thank you for your business</Text>
              <Text>نظام إدارة الفواتير المتكامل TradingERP - ZATCA Certified</Text>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter borderTopWidth="1px">
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              إغلاق
            </Button>
            <Button
              colorScheme="teal"
              leftIcon={<FiPrinter />}
              onClick={handlePrint}
            >
              طباعة الإيصال ({format === 'thermal80' ? '80mm POS' : 'A4'})
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
