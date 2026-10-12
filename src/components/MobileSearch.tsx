import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  VStack,
  HStack,
  Text,
  useColorModeValue,
  useBreakpointValue,
  useOutsideClick,
} from '@chakra-ui/react';
import { FiSearch, FiX, FiFilter } from 'react-icons/fi';

interface MobileSearchProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  showFilters?: boolean;
  onFilterClick?: () => void;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

const MobileSearch: React.FC<MobileSearchProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  onClear,
  showFilters = false,
  onFilterClick,
  suggestions = [],
  onSuggestionClick,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const suggestionBg = useColorModeValue('gray.50', 'gray.700');
  const suggestionHoverBg = useColorModeValue('gray.100', 'gray.600');

  useOutsideClick({
    ref: containerRef,
    handler: () => {
      setIsFocused(false);
      setShowSuggestions(false);
    },
  });

  useEffect(() => {
    setShowSuggestions(isFocused && suggestions.length > 0);
  }, [isFocused, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(newValue.length > 0 && suggestions.length > 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    onChange('');
    onClear?.();
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onSuggestionClick?.(suggestion);
    setShowSuggestions(false);
    onSearch?.(suggestion);
  };

  return (
    <Box ref={containerRef} position="relative" w="full">
      <InputGroup size={isMobile ? 'lg' : 'md'}>
        <InputLeftElement pointerEvents="none" pl={isMobile ? 3 : 2}>
          <FiSearch color="gray.400" size={isMobile ? 20 : 16} />
        </InputLeftElement>
        
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          bg={bg}
          borderColor={isFocused ? 'blue.500' : borderColor}
          _focus={{
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
          }}
          _hover={{
            borderColor: 'gray.300',
          }}
          minH={isMobile ? '48px' : 'auto'}
          fontSize={isMobile ? 'md' : 'sm'}
          borderRadius="lg"
          transition="all 0.2s"
        />
        
        <InputRightElement pr={isMobile ? 2 : 1}>
          <HStack spacing={1}>
            {value && (
              <IconButton
                aria-label="Clear search"
                icon={<FiX />}
                size={isMobile ? 'md' : 'sm'}
                variant="ghost"
                onClick={handleClear}
                minH={isMobile ? '40px' : '32px'}
                minW={isMobile ? '40px' : '32px'}
                borderRadius="md"
                _hover={{ bg: 'gray.100' }}
              />
            )}
            {showFilters && onFilterClick && (
              <IconButton
                aria-label="Show filters"
                icon={<FiFilter />}
                size={isMobile ? 'md' : 'sm'}
                variant="ghost"
                onClick={onFilterClick}
                minH={isMobile ? '40px' : '32px'}
                minW={isMobile ? '40px' : '32px'}
                borderRadius="md"
                _hover={{ bg: 'gray.100' }}
              />
            )}
          </HStack>
        </InputRightElement>
      </InputGroup>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg={bg}
          border="1px"
          borderColor={borderColor}
          borderRadius="lg"
          boxShadow="xl"
          zIndex={10}
          maxH={isMobile ? "250px" : "200px"}
          overflowY="auto"
          mt={2}
        >
          <VStack spacing={0} align="stretch">
            {suggestions.map((suggestion, index) => (
              <Box
                key={index}
                px={isMobile ? 4 : 3}
                py={isMobile ? 4 : 3}
                cursor="pointer"
                bg={suggestionBg}
                _hover={{ bg: suggestionHoverBg }}
                onClick={() => handleSuggestionClick(suggestion)}
                borderBottom={index < suggestions.length - 1 ? '1px' : 'none'}
                borderColor={borderColor}
                transition="all 0.2s"
                minH={isMobile ? '48px' : 'auto'}
                display="flex"
                alignItems="center"
              >
                <Text 
                  fontSize={isMobile ? 'md' : 'sm'} 
                  noOfLines={1}
                  color={useColorModeValue('gray.800', 'white')}
                >
                  {suggestion}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default MobileSearch;
