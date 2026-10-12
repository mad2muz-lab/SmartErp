import React from 'react';
import {
  Box,
  Spinner,
  Text,
  VStack,
  HStack,
  Skeleton,
  SkeletonText,
  Card,
  CardBody,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';

interface MobileLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const MobileLoading: React.FC<MobileLoadingProps> = ({
  message = 'Loading...',
  size = 'lg',
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <VStack spacing={4} justify="center" align="center" minH="200px">
      <Spinner
        size={isMobile ? 'lg' : size}
        color="blue.500"
        thickness="3px"
        speed="0.65s"
      />
      <Text
        color={textColor}
        fontSize={isMobile ? 'sm' : 'md'}
        fontWeight="medium"
      >
        {message}
      </Text>
    </VStack>
  );
};

interface MobileSkeletonProps {
  rows?: number;
  height?: string;
  showAvatar?: boolean;
}

const MobileSkeleton: React.FC<MobileSkeletonProps> = ({
  rows = 3,
  height = '20px',
  showAvatar = false,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (isMobile) {
    return (
      <Card bg={cardBg} border="1px" borderColor={borderColor} mb={4}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {showAvatar && (
              <HStack spacing={3}>
                <Skeleton height="40px" width="40px" borderRadius="full" />
                <VStack spacing={2} align="stretch" flex={1}>
                  <Skeleton height="16px" width="60%" />
                  <Skeleton height="14px" width="40%" />
                </VStack>
              </HStack>
            )}
            <SkeletonText
              noOfLines={rows}
              spacing={3}
              skeletonHeight={height}
            />
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box>
      {showAvatar && (
        <HStack spacing={3} mb={4}>
          <Skeleton height="40px" width="40px" borderRadius="full" />
          <VStack spacing={2} align="stretch" flex={1}>
            <Skeleton height="16px" width="60%" />
            <Skeleton height="14px" width="40%" />
          </VStack>
        </HStack>
      )}
      <SkeletonText
        noOfLines={rows}
        spacing={3}
        skeletonHeight={height}
      />
    </Box>
  );
};

interface MobileTableSkeletonProps {
  rows?: number;
  columns?: number;
}

const MobileTableSkeleton: React.FC<MobileTableSkeletonProps> = ({
  rows = 5,
  columns = 4,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (isMobile) {
    return (
      <VStack spacing={4} align="stretch">
        {Array.from({ length: rows }).map((_, index) => (
          <Card key={index} bg={cardBg} border="1px" borderColor={borderColor}>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <Box key={colIndex}>
                    <Skeleton height="12px" width="30%" mb={1} />
                    <Skeleton height="16px" width="100%" />
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>
    );
  }

  return (
    <Box>
      {Array.from({ length: rows }).map((_, index) => (
        <HStack key={index} spacing={4} mb={3}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="20px" flex={1} />
          ))}
        </HStack>
      ))}
    </Box>
  );
};

export { MobileLoading, MobileSkeleton, MobileTableSkeleton };
