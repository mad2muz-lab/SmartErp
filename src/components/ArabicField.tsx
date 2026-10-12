import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  HStack,
  Icon,
  Text,
  Spinner,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiEdit3 } from 'react-icons/fi';
import { translateToArabic } from '../utils/translationService';

interface ArabicFieldProps {
  label: string;
  englishValue: string;
  arabicValue: string;
  onArabicChange: (value: string) => void;
  placeholder?: string;
  isTextarea?: boolean;
  autoTranslate?: boolean;
  isReadOnly?: boolean;
}

const ArabicField: React.FC<ArabicFieldProps> = ({
  label,
  englishValue,
  arabicValue,
  onArabicChange,
  placeholder = '',
  isTextarea = false,
  autoTranslate = true,
  isReadOnly = false,
}) => {
  const autoTranslateEnabled = autoTranslate && import.meta.env.VITE_LOCAL_DEMO_AUTH !== 'true';
  const [isTranslating, setIsTranslating] = useState(false);
  const [manuallyEdited, setManuallyEdited] = useState(false);
  const translationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const manuallyEditedRef = useRef(false);
  const onArabicChangeRef = useRef(onArabicChange);
  onArabicChangeRef.current = onArabicChange;

  const isMobile = useBreakpointValue({ base: true, md: false });
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bg = useColorModeValue('white', 'gray.700');

  // Auto-translate English to Arabic with debouncing
  useEffect(() => {
    const currentRequest = ++requestId.current;
    if (translationTimer.current) clearTimeout(translationTimer.current);
    setIsTranslating(false);

    if (!autoTranslateEnabled || !englishValue.trim() || manuallyEdited) return;

    translationTimer.current = setTimeout(async () => {
      if (manuallyEditedRef.current || currentRequest !== requestId.current) return;
      setIsTranslating(true);
      try {
        const translated = await translateToArabic(englishValue);
        if (translated && !manuallyEditedRef.current && currentRequest === requestId.current) {
          onArabicChangeRef.current(translated);
        }
      } catch (error) {
        console.error('Translation failed:', error);
      } finally {
        if (currentRequest === requestId.current) setIsTranslating(false);
      }
    }, 1000);

    return () => {
      if (translationTimer.current) clearTimeout(translationTimer.current);
      if (currentRequest === requestId.current) requestId.current += 1;
    };
  }, [englishValue, autoTranslateEnabled, manuallyEdited]);

  const handleArabicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    manuallyEditedRef.current = true;
    requestId.current += 1;
    if (translationTimer.current) clearTimeout(translationTimer.current);
    setIsTranslating(false);
    setManuallyEdited(true);
    onArabicChange(e.target.value);
  };

  const InputComponent = isTextarea ? Textarea : Input;

  return (
    <FormControl>
      <FormLabel
        fontSize={{ base: 'sm', md: 'md' }}
        mb={{ base: 2, md: 1 }}
        color={useColorModeValue('gray.700', 'gray.200')}
      >
        <HStack spacing={2}>
          <Icon as={FiEdit3} boxSize={isMobile ? 4 : 3} />
          <Text>{label} (Arabic)</Text>
          {isTranslating && <Spinner size="xs" />}
          {manuallyEdited && (
            <Box w={2} h={2} bg="blue.500" borderRadius="full" />
          )}
        </HStack>
      </FormLabel>
      
      <InputComponent
        value={arabicValue}
        onChange={handleArabicChange}
        placeholder={`${placeholder} (Arabic)`}
        border="1px"
        borderColor={borderColor}
        bg={isReadOnly ? 'gray.50' : bg}
        textAlign="right"
        dir="rtl"
        fontFamily="'Noto Sans Arabic', 'Arial Unicode MS', sans-serif"
        size={{ base: 'lg', md: 'md' }}
        minH={isMobile ? (isTextarea ? '120px' : '48px') : 'auto'}
        fontSize={{ base: 'md', md: 'sm' }}
        borderRadius="md"
        isReadOnly={isReadOnly}
        _focus={{
          borderColor: 'blue.500',
          boxShadow: '0 0 0 1px blue.500',
        }}
        _hover={{
          borderColor: 'gray.300',
        }}
        transition="all 0.2s"
      />
      
      {autoTranslateEnabled && !manuallyEdited && arabicValue && (
        <Text 
          fontSize={{ base: 'xs', md: 'xs' }} 
          color="gray.500" 
          mt={2} 
          textAlign="right"
        >
          Auto-translated from English
        </Text>
      )}
      {manuallyEdited && (
        <Text 
          fontSize={{ base: 'xs', md: 'xs' }} 
          color="blue.500" 
          mt={2} 
          textAlign="right"
        >
          Manually edited
        </Text>
      )}
    </FormControl>
  );
};

export default ArabicField;
