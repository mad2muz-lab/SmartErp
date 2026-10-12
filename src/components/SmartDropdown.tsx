import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Input,
  List,
  ListItem,
  Text,
  VStack,
  HStack,
  Icon,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiSearch, FiPlus, FiChevronDown } from 'react-icons/fi';
import { filterEntries, addCustomEntry } from '../data/customEntries';

interface SmartDropdownProps {
  value: string;
  onChange: (value: string) => void;
  onAutoCreate?: (value: string) => Promise<void>;
  placeholder: string;
  options: string[];
  type: 'category' | 'unit' | 'supplier' | 'customer' | 'inventory_item' | 'payment_terms' | 'department';
  organization_id: string;
  defaultValue?: string;
  isDisabled?: boolean;
  autoFocus?: boolean;
}

export const SmartDropdown: React.FC<SmartDropdownProps> = ({
  value,
  onChange,
  onAutoCreate,
  placeholder,
  options = [],
  type,
  organization_id,
  defaultValue,
  isDisabled = false,
  autoFocus = false,
}) => {
  // Ensure options is always an array and filter out any undefined/null values
  const safeOptions = useMemo(() => 
    Array.isArray(options) ? options.filter(option => option != null) : [], 
    [options]
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useBreakpointValue({ base: true, md: false });
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  // Set default value on first load
  useEffect(() => {
    if (!value && defaultValue && options.includes(defaultValue)) {
      onChange(defaultValue);
    }
  }, [value, defaultValue, options, onChange]);

  // Filter options based on search term
  useEffect(() => {
    const filtered = filterEntries(safeOptions, searchTerm);
    setFilteredOptions(filtered);
    
    // Show custom input if no exact match and search term is not empty
    const hasExactMatch = safeOptions.some(option => 
      option && option.toLowerCase() === searchTerm.toLowerCase()
    );
    const shouldShowCustom = searchTerm.length > 0 && !hasExactMatch && searchTerm.trim().length > 0;
    setShowCustomInput(shouldShowCustom);
  }, [searchTerm, safeOptions]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setShowCustomInput(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (selectedValue: string) => {
    // If this is a custom value (not in existing options), auto-create it
    if (onAutoCreate && !safeOptions.includes(selectedValue)) {
      try {
        await onAutoCreate(selectedValue);
      } catch (error) {
        console.error('Error auto-creating item:', error);
        return; // Don't proceed if auto-creation fails
      }
    }
    
    onChange(selectedValue);
    setSearchTerm('');
    setIsOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomAdd = () => {
    if (customValue.trim()) {
      // Add to local storage
      addCustomEntry(type, customValue.trim(), organization_id);
      
      // Update the value
      onChange(customValue.trim());
      setSearchTerm('');
      setCustomValue('');
      setIsOpen(false);
      setShowCustomInput(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!searchTerm) {
      setFilteredOptions(safeOptions);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showCustomInput && customValue.trim()) {
        handleCustomAdd();
      } else if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else if (searchTerm.trim()) {
        // If no options match but we have a search term, auto-create it
        handleSelect(searchTerm.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setShowCustomInput(false);
    }
  };

  const displayValue = isOpen ? searchTerm : value;

  return (
    <Box position="relative" ref={dropdownRef} w="full">
      <InputGroup size={isMobile ? 'lg' : 'md'}>
        <InputLeftElement pointerEvents="none" pl={isMobile ? 3 : 2}>
          <Icon as={FiSearch} color="gray.400" boxSize={isMobile ? 5 : 4} />
        </InputLeftElement>
        <Input
          ref={inputRef}
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          isDisabled={isDisabled}
          autoFocus={autoFocus}
          pr="2.5rem"
          minH={isMobile ? '48px' : 'auto'}
          fontSize={isMobile ? 'md' : 'sm'}
          borderRadius="md"
          _focus={{
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
          }}
        />
        <Box
          position="absolute"
          right="0.75rem"
          top="50%"
          transform="translateY(-50%)"
          pointerEvents="none"
          zIndex={1}
        >
          <Icon as={FiChevronDown} color="gray.400" boxSize={isMobile ? 5 : 4} />
        </Box>
      </InputGroup>

      {isOpen && (
        <Box
          position="fixed"
          top={inputRef.current ? inputRef.current.getBoundingClientRect().bottom + 5 : "auto"}
          left={inputRef.current ? inputRef.current.getBoundingClientRect().left : 0}
          width={inputRef.current ? inputRef.current.offsetWidth : "auto"}
          bg={bg}
          border="1px"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="lg"
          zIndex={9999}
          maxH={isMobile ? "250px" : "300px"}
          overflowY="auto"
          style={{
            maxHeight: isMobile ? "250px" : "300px",
            overflowY: "auto",
            overflowX: "hidden"
          }}
        >
          <VStack spacing={0} align="stretch">
            {filteredOptions.length > 0 && (
              <List spacing={0}>
                {filteredOptions.map((option, index) => (
                  <ListItem
                    key={index}
                    px={isMobile ? 4 : 3}
                    py={isMobile ? 4 : 2}
                    cursor="pointer"
                    _hover={{ bg: hoverBg }}
                    onClick={() => handleSelect(option)}
                    borderBottom="1px"
                    borderColor={borderColor}
                    fontSize={isMobile ? 'md' : 'sm'}
                    minH={isMobile ? '48px' : 'auto'}
                    display="flex"
                    alignItems="center"
                  >
                    <Text fontSize="inherit">{option}</Text>
                  </ListItem>
                ))}
              </List>
            )}

            {showCustomInput && (
              <Box p={isMobile ? 4 : 3} borderTop="1px" borderColor={borderColor}>
                <VStack spacing={isMobile ? 3 : 2}>
                  <Input
                    size={isMobile ? 'md' : 'sm'}
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={`Add "${searchTerm}" as new ${type}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomAdd();
                      }
                    }}
                    minH={isMobile ? '40px' : 'auto'}
                  />
                  <HStack spacing={2} w="full" justify="center">
                    <Icon
                      as={FiPlus}
                      boxSize={isMobile ? 5 : 4}
                      color="blue.500"
                      cursor="pointer"
                      onClick={handleCustomAdd}
                      p={1}
                      borderRadius="md"
                      _hover={{ bg: 'blue.50' }}
                    />
                    <Text fontSize={isMobile ? 'sm' : 'xs'} color="blue.500">
                      Add New
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            )}

            {filteredOptions.length === 0 && !showCustomInput && searchTerm && (
              <Box p={isMobile ? 4 : 3} textAlign="center">
                <Text fontSize={isMobile ? 'md' : 'sm'} color="gray.500">
                  No {type}s found
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      )}
    </Box>
  );
};
