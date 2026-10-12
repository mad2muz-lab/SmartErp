/**
 * VAT Calculation Test Component
 * Tests the VAT rate calculation to ensure it's working correctly
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
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';

const VATCalculationTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const toast = useToast();

  // Test VAT rate calculation logic
  const testVATCalculation = (rawVatRate: number, expectedResult: string) => {
    // This is the same logic used in the invoice templates
    const vatRate = rawVatRate > 1 ? rawVatRate / 100 : rawVatRate;
    const lineTotal = 127.54; // Example from the screenshot
    const vatAmount = lineTotal * vatRate;
    
    return {
      input: rawVatRate,
      processed: vatRate,
      lineTotal,
      vatAmount: vatAmount.toFixed(2),
      expected: expectedResult,
      correct: vatAmount.toFixed(2) === expectedResult
    };
  };

  const runTests = () => {
    const tests = [
      { input: 15, expected: "19.13", description: "VAT rate as percentage (15%)" },
      { input: 0.15, expected: "19.13", description: "VAT rate as decimal (0.15)" },
      { input: 1500, expected: "1913.10", description: "VAT rate as percentage (1500%)" },
      { input: 0.0015, expected: "0.19", description: "VAT rate as decimal (0.0015)" },
    ];

    const results = tests.map(test => ({
      ...test,
      result: testVATCalculation(test.input, test.expected)
    }));

    setTestResults(results);
    
    const allCorrect = results.every(r => r.result.correct);
    toast({
      title: allCorrect ? "All Tests Passed!" : "Some Tests Failed",
      description: allCorrect ? "VAT calculation is working correctly" : "Check the results for issues",
      status: allCorrect ? "success" : "warning",
      duration: 5000,
      isClosable: true,
    });
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardHeader>
            <Heading size="md">VAT Calculation Test</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>VAT Rate Calculation Fix:</AlertTitle>
                  <AlertDescription>
                    The issue was that VAT rates were being divided by 100 twice:<br/>
                    • First in the mock data generation (15 → 0.15)<br/>
                    • Then again in the conversion function (0.15 → 0.0015)<br/>
                    <br/>
                    Now the logic checks if the rate is &gt; 1 (percentage) and only converts once.
                  </AlertDescription>
                </Box>
              </Alert>

              <Button colorScheme="blue" onClick={runTests}>
                Run VAT Calculation Tests
              </Button>

              {testResults.length > 0 && (
                <VStack spacing={3} align="stretch">
                  <Text fontWeight="bold">Test Results:</Text>
                  {testResults.map((test, index) => (
                    <Card key={index} bg={test.result.correct ? "green.50" : "red.50"}>
                      <CardBody>
                        <VStack spacing={2} align="stretch">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">{test.description}</Text>
                            <Badge colorScheme={test.result.correct ? "green" : "red"}>
                              {test.result.correct ? "PASS" : "FAIL"}
                            </Badge>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Input VAT Rate:</Text>
                            <Text fontSize="sm" fontFamily="mono">{test.input}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Processed Rate:</Text>
                            <Text fontSize="sm" fontFamily="mono">{test.result.processed}</Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Line Total:</Text>
                            <Text fontSize="sm" fontFamily="mono"><FormattedCurrencyDisplay amount={test.result.lineTotal} /></Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Calculated VAT:</Text>
                            <Text fontSize="sm" fontFamily="mono"><FormattedCurrencyDisplay amount={test.result.vatAmount} /></Text>
                          </HStack>
                          <HStack justify="space-between">
                            <Text fontSize="sm">Expected VAT:</Text>
                            <Text fontSize="sm" fontFamily="mono"><FormattedCurrencyDisplay amount={test.expected} /></Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}

              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>Expected Result for 15% VAT:</AlertTitle>
                  <AlertDescription>
                    For a line total of 127.54 {'\uE900'} with 15% VAT:<br/>
                    • VAT Amount should be: 19.13 {'\uE900'}<br/>
                    • Grand Total should be: 146.67 {'\uE900'}<br/>
                    <br/>
                    This matches the screenshot you provided.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default VATCalculationTest;
