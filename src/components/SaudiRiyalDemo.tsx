import React from 'react';
import { Box, VStack, Text, Heading, Code, Divider } from '@chakra-ui/react';
import SaudiRiyalSymbol, { SaudiRiyalAmount, SaudiRiyalSymbolOnly } from './SaudiRiyalSymbol';

/**
 * Demo component showing how to use Saudi Riyal symbol throughout the application
 * This demonstrates the various ways to implement the symbol following usage guidelines
 */
export const SaudiRiyalDemo: React.FC = () => {
  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg" textAlign="center">
          Saudi Riyal Symbol (共) Implementation Demo
        </Heading>
        
        <Text fontSize="md" color="gray.600" textAlign="center">
          This demonstrates how the Saudi Riyal symbol is implemented throughout the application
          using the PNG image, following the usage guidelines.
        </Text>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>1. Basic Symbol Display</Heading>
          <VStack spacing={3} align="start">
            <Box>
              <Text fontWeight="medium">Symbol Only:</Text>
              <SaudiRiyalSymbolOnly size="medium" />
            </Box>
            <Box>
              <Text fontWeight="medium">Symbol with Amount:</Text>
              <SaudiRiyalAmount amount={1234.56} size="medium" />
            </Box>
            <Box>
              <Text fontWeight="medium">Custom Amount:</Text>
              <SaudiRiyalSymbol amount={999.99} size="large" />
            </Box>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>2. CSS-Based Implementation</Heading>
          <VStack spacing={3} align="start">
            <Box>
              <Text fontWeight="medium">Using CSS classes:</Text>
              <span className="currency-display-sar">
                <span className="saudi-riyal-symbol"></span>
                <span className="amount">2,500.00</span>
              </span>
            </Box>
            <Box>
              <Text fontWeight="medium">With custom styling:</Text>
              <span className="currency-display-sar" style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                <span className="saudi-riyal-symbol"></span>
                <span className="amount">5,750.25</span>
              </span>
            </Box>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>3. Usage Guidelines Compliance</Heading>
          <VStack spacing={2} align="start" fontSize="sm">
            <Text>✅ <strong>Position:</strong> Symbol positioned to the left of the numeral</Text>
            <Text>✅ <strong>Spacing:</strong> 0.25em space between symbol and numeral</Text>
            <Text>✅ <strong>Proportions:</strong> Image proportions maintained</Text>
            <Text>✅ <strong>Geometry:</strong> Geometric structure preserved</Text>
            <Text>✅ <strong>Alignment:</strong> Proper baseline alignment</Text>
            <Text>✅ <strong>Direction:</strong> Correct symbol orientation</Text>
            <Text>✅ <strong>Negative Space:</strong> Adequate spacing around symbol</Text>
            <Text>✅ <strong>Contrast:</strong> High contrast with background</Text>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>4. Implementation Examples</Heading>
          <VStack spacing={4} align="start">
            <Box>
              <Text fontWeight="medium">In Tables:</Text>
              <Code p={2} borderRadius="md" display="block">
                {`<span className="currency-display-sar">
  <span className="saudi-riyal-symbol"></span>
  <span className="amount">1,250.00</span>
</span>`}
              </Code>
            </Box>
            
            <Box>
              <Text fontWeight="medium">In Forms:</Text>
              <Code p={2} borderRadius="md" display="block">
                {`<SaudiRiyalAmount amount={formData.price} size="medium" />`}
              </Code>
            </Box>
            
            <Box>
              <Text fontWeight="medium">In Cards:</Text>
              <Code p={2} borderRadius="md" display="block">
                {`<span className="currency-display-sar">
  <span className="saudi-riyal-symbol"></span>
  <span className="amount">{totalAmount}</span>
</span>`}
              </Code>
            </Box>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>5. Responsive Design</Heading>
          <VStack spacing={3} align="start">
            <Box>
              <Text fontWeight="medium">Small Size:</Text>
              <SaudiRiyalAmount amount={100.00} size="small" />
            </Box>
            <Box>
              <Text fontWeight="medium">Medium Size (Default):</Text>
              <SaudiRiyalAmount amount={100.00} size="medium" />
            </Box>
            <Box>
              <Text fontWeight="medium">Large Size:</Text>
              <SaudiRiyalAmount amount={100.00} size="large" />
            </Box>
          </VStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>6. File Structure</Heading>
          <VStack spacing={2} align="start" fontSize="sm">
            <Text><strong>CSS:</strong> <Code>src/utils/saudiRiyalSymbol.css</Code></Text>
            <Text><strong>Component:</strong> <Code>src/components/SaudiRiyalSymbol.tsx</Code></Text>
            <Text><strong>Utilities:</strong> <Code>src/utils/saudiRiyalUtils.ts</Code></Text>
            <Text><strong>Image:</strong> <Code>/plan/Saudi_Riyal_Symbol-1.png</Code></Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SaudiRiyalDemo;
