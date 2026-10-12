/**
 * ZATCA Compliance Test Component
 * Helps debug and verify ZATCA QR code compliance
 */

import React, { useState } from 'react';
import FormattedCurrencyDisplay from '../FormattedCurrencyDisplay';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  VStack,
  HStack,
  Text,
  Textarea,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { generateZATCAQRCodeData, generateInvoiceUUID, generateZATCACryptographicHash, parseTLVData, validateZATCAQRData, ZATCAQRData, generateValidZATCATRN, validateAndFixTRN } from '../../utils/zatcaQRGenerator';
import VATCalculationTest from './VATCalculationTest';

const ZATCAComplianceTest: React.FC = () => {
  const [testData, setTestData] = useState<ZATCAQRData>({
    seller_name: 'TradingERP Company',
    seller_tax_id: generateValidZATCATRN(), // Use valid ZATCA TRN
    invoice_date: '2024-01-15',
    invoice_time: '14:30:00',
    invoice_total: 1000.00,
    vat_total: 150.00,
    invoice_uuid: generateInvoiceUUID(),
    cryptographic_hash: ''
  });
  
  const [generatedQRData, setGeneratedQRData] = useState<string>('');
  const [parsedData, setParsedData] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [showVATTest, setShowVATTest] = useState(false);
  const toast = useToast();

  const handleGenerateQR = async () => {
    try {
      // Generate cryptographic hash
      const hash = await generateZATCACryptographicHash(
        'INV-2024-001',
        testData.invoice_date,
        testData.invoice_time,
        testData.seller_tax_id,
        testData.invoice_total,
        testData.vat_total,
        testData.invoice_uuid
      );
      
      const dataWithHash = { ...testData, cryptographic_hash: hash };
      
      // Generate QR code data
      const qrData = generateZATCAQRCodeData(dataWithHash);
      setGeneratedQRData(qrData);
      
      // Parse back to verify
      const parsed = parseTLVData(qrData);
      setParsedData(parsed);
      
      // Validate
      const validation = validateZATCAQRData(dataWithHash);
      setValidationResult(validation);
      
      toast({
        title: "QR Code Generated",
        description: validation.valid ? "ZATCA-compliant QR code generated successfully" : "QR code generated with validation errors",
        status: validation.valid ? "success" : "warning",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('QR generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleTestWithRealData = () => {
    // Test with the data from the scan result, but fix the TRN
    const invalidTRN = '000000123456789';
    const trnValidation = validateAndFixTRN(invalidTRN);
    
    const realData: ZATCAQRData = {
      seller_name: 'Rawabi Contracting and Trading old',
      seller_tax_id: trnValidation.fixedTRN || generateValidZATCATRN(),
      invoice_date: '2025-09-19',
      invoice_time: '00:00:00',
      invoice_total: 4140,
      vat_total: 540,
      invoice_uuid: generateInvoiceUUID(),
      cryptographic_hash: '5682A902'
    };
    
    setTestData(realData);
    toast({
      title: "Test Data Loaded",
      description: `Loaded data from scan result. TRN fixed: ${invalidTRN} → ${realData.seller_tax_id}`,
      status: "info",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardHeader>
            <Heading size="md">ZATCA QR Code Compliance Test</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>ZATCA Compliance Issues Fixed:</AlertTitle>
                  <AlertDescription>
                    • Changed from JSON to TLV (Tag-Length-Value) encoding<br/>
                    • Added proper cryptographic hash (SHA-256)<br/>
                    • Added invoice UUID for tracking<br/>
                    • Fixed timestamp format (ISO 8601 with timezone)<br/>
                    • Added proper field validation
                  </AlertDescription>
                </Box>
              </Alert>

              <HStack spacing={4}>
                <Button colorScheme="blue" onClick={handleGenerateQR}>
                  Generate ZATCA QR Code
                </Button>
                <Button colorScheme="orange" variant="outline" onClick={handleTestWithRealData}>
                  Test with Real Data
                </Button>
                <Button colorScheme="green" variant="outline" onClick={() => setShowVATTest(!showVATTest)}>
                  {showVATTest ? "Hide" : "Show"} VAT Test
                </Button>
              </HStack>

              {validationResult && (
                <Alert status={validationResult.valid ? "success" : "error"}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      Validation: {validationResult.valid ? "PASSED" : "FAILED"}
                    </AlertTitle>
                    {validationResult.errors.length > 0 && (
                      <AlertDescription>
                        Errors: {validationResult.errors.join(', ')}
                      </AlertDescription>
                    )}
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Test Data</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack>
                <Text fontWeight="bold" minW="120px">Seller Name:</Text>
                <Text>{testData.seller_name}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="120px">VAT Number:</Text>
                <Text>{testData.seller_tax_id}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="120px">Invoice Date:</Text>
                <Text>{testData.invoice_date}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="120px">Invoice Time:</Text>
                <Text>{testData.invoice_time}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="120px">Invoice Total:</Text>
                <Text><FormattedCurrencyDisplay amount={testData.invoice_total} /></Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="120px">VAT Total:</Text>
                <Text><FormattedCurrencyDisplay amount={testData.vat_total} /></Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold" minW="120px">Invoice UUID:</Text>
                <Text fontFamily="mono" fontSize="sm">{testData.invoice_uuid}</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {generatedQRData && (
          <Card>
            <CardHeader>
              <Heading size="md">Generated QR Code Data (Base64 TLV)</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Textarea
                  value={generatedQRData}
                  readOnly
                  fontFamily="mono"
                  fontSize="sm"
                  rows={4}
                  placeholder="Generated QR code data will appear here..."
                />
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold" mb={2}>Parsed TLV Data:</Text>
                  <VStack spacing={2} align="stretch">
                    {Object.entries(parsedData).map(([key, value]) => (
                      <HStack key={key} justify="space-between">
                        <Text fontWeight="medium" minW="150px">{key}:</Text>
                        <Text fontFamily="mono" fontSize="sm">{value}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <Heading size="md">ZATCA Compliance Checklist</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>TLV (Tag-Length-Value) encoding instead of JSON</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>Proper timestamp format (ISO 8601 with timezone)</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>Cryptographic hash using SHA-256</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>Invoice UUID for tracking</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>VAT number validation (15 digits)</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>Base64 encoded binary data</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>Proper field length validation</Text>
              </HStack>
              <HStack>
                <Badge colorScheme="green">✓</Badge>
                <Text>ZATCA TRN validation (15 digits, starts/ends with 3)</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {showVATTest && (
          <VATCalculationTest />
        )}
      </VStack>
    </Box>
  );
};

export default ZATCAComplianceTest;
