import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  useBreakpointValue,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  isAction?: boolean;
}

interface MobileTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  isLoading?: boolean;
}

const MobileTable: React.FC<MobileTableProps> = ({
  data,
  columns,
  onRowClick,
  isLoading = false,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.600');
  
  // Move all useColorModeValue calls to the top to maintain hooks order
  const textColor = useColorModeValue('gray.800', 'white');
  const headerBg = useColorModeValue('gray.50', 'gray.600');
  const headerTextColor = useColorModeValue('gray.700', 'gray.200');

  // Filter out action columns for mobile cards
  const displayColumns = columns.filter(col => !col.isAction);
  const actionColumns = columns.filter(col => col.isAction);

  if (isMobile) {
    return (
      <VStack spacing={4} align="stretch">
        {data.map((row, index) => (
          <Card
            key={index}
            bg={cardBg}
            border="1px"
            borderColor={borderColor}
            cursor={onRowClick ? "pointer" : "default"}
            onClick={() => onRowClick?.(row)}
            _hover={onRowClick ? { 
              transform: "translateY(-2px)", 
              shadow: "lg",
              bg: hoverBg,
            } : {}}
            transition="all 0.2s"
            borderRadius="lg"
            overflow="hidden"
          >
            <CardBody p={{ base: 4, md: 6 }}>
              <VStack spacing={4} align="stretch">
                {displayColumns.map((column) => (
                  <Box key={column.key}>
                    <Text 
                      fontSize={{ base: 'xs', md: 'sm' }} 
                      color="gray.500" 
                      fontWeight="medium" 
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {column.label}
                    </Text>
                    <Box>
                      {column.render ? column.render(row[column.key], row) : (
                        <Text 
                          fontSize={{ base: 'md', md: 'sm' }} 
                          fontWeight="medium"
                          color={textColor}
                          noOfLines={2}
                        >
                          {row[column.key] || '-'}
                        </Text>
                      )}
                    </Box>
                  </Box>
                ))}
                
                {/* Action buttons */}
                {actionColumns.length > 0 && (
                  <Box 
                    pt={3} 
                    borderTop="1px" 
                    borderColor={borderColor}
                    mt={2}
                  >
                    <HStack spacing={3} justify="flex-end" flexWrap="wrap">
                      {actionColumns.map((column) => (
                        <Box key={column.key}>
                          {column.render?.(row[column.key], row)}
                        </Box>
                      ))}
                    </HStack>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        ))}
        
        {data.length === 0 && !isLoading && (
          <Card bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody p={8}>
              <VStack spacing={4} align="center">
                <Text color="gray.500" fontSize="lg" fontWeight="medium">
                  No data available
                </Text>
                <Text color="gray.400" fontSize="sm" textAlign="center">
                  There are no items to display at the moment.
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    );
  }

  // Desktop table view
  return (
    <Box overflowX="auto" borderRadius="lg" border="1px" borderColor={borderColor}>
      <Table variant="simple" size="sm">
        <Thead>
          <Tr bg={headerBg}>
            {columns.map((column) => (
              <Th key={column.key} py={4} px={4}>
                <Text fontSize="sm" fontWeight="semibold" color={headerTextColor}>
                  {column.label}
                </Text>
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row, index) => (
            <Tr
              key={index}
              cursor={onRowClick ? "pointer" : "default"}
              onClick={() => onRowClick?.(row)}
              _hover={onRowClick ? { bg: hoverBg } : {}}
              transition="all 0.2s"
            >
              {columns.map((column) => (
                <Td key={column.key} py={3} px={4}>
                  {column.render ? column.render(row[column.key], row) : (
                    <Text fontSize="sm" color={textColor}>
                      {row[column.key] || '-'}
                    </Text>
                  )}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      {data.length === 0 && !isLoading && (
        <Box p={8} textAlign="center">
          <Text color="gray.500" fontSize="lg" fontWeight="medium">
            No data available
          </Text>
          <Text color="gray.400" fontSize="sm" mt={2}>
            There are no items to display at the moment.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default MobileTable;
