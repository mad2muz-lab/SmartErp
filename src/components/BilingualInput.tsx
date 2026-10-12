import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  HStack,
  Icon,
  Text,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiGlobe, FiEdit3 } from 'react-icons/fi';
import { translateToArabic, translateToEnglish } from '../utils/translationService';

interface BilingualInputProps {
  label: string;
  englishValue: string;
  arabicValue: string;
  onEnglishChange: (value: string) => void;
  onArabicChange: (value: string) => void;
  placeholder?: string;
  isTextarea?: boolean;
  isRequired?: boolean;
  autoTranslate?: boolean;
}

const BilingualInput: React.FC<BilingualInputProps> = ({
  label,
  englishValue,
  arabicValue,
  onEnglishChange,
  onArabicChange,
  placeholder = '',
  isTextarea = false,
  isRequired = false,
  autoTranslate = true,
}) => {
  const autoTranslateEnabled = autoTranslate && import.meta.env.VITE_LOCAL_DEMO_AUTH !== 'true';
  const [isTranslating, setIsTranslating] = useState(false);
  const [manuallyEditedEnglish, setManuallyEditedEnglish] = useState(false);
  const [manuallyEditedArabic, setManuallyEditedArabic] = useState(false);
  const [translationTimer, setTranslationTimer] = useState<NodeJS.Timeout | null>(null);

  const tabBg = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Auto-translate English to Arabic with debouncing
  useEffect(() => {
    if (!autoTranslateEnabled || !englishValue || manuallyEditedArabic) return;

    // Clear existing timer
    if (translationTimer) {
      clearTimeout(translationTimer);
    }

    // Set new timer for debounced translation
    const timer = setTimeout(async () => {
      if (englishValue.trim() && !manuallyEditedArabic) {
        setIsTranslating(true);
        try {
          const translated = await translateToArabic(englishValue);
          if (translated && !manuallyEditedArabic) {
            onArabicChange(translated);
          }
        } catch (error) {
          console.error('Translation failed:', error);
        } finally {
          setIsTranslating(false);
        }
      }
    }, 1000); // 1 second debounce

    setTranslationTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [englishValue, autoTranslateEnabled, manuallyEditedArabic, onArabicChange]);

  // Auto-translate Arabic to English with debouncing
  useEffect(() => {
    if (!autoTranslateEnabled || !arabicValue || manuallyEditedEnglish) return;

    // Clear existing timer
    if (translationTimer) {
      clearTimeout(translationTimer);
    }

    // Set new timer for debounced translation
    const timer = setTimeout(async () => {
      if (arabicValue.trim() && !manuallyEditedEnglish) {
        setIsTranslating(true);
        try {
          const translated = await translateToEnglish(arabicValue);
          if (translated && !manuallyEditedEnglish) {
            onEnglishChange(translated);
          }
        } catch (error) {
          console.error('Translation failed:', error);
        } finally {
          setIsTranslating(false);
        }
      }
    }, 1000); // 1 second debounce

    setTranslationTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [arabicValue, autoTranslateEnabled, manuallyEditedEnglish, onEnglishChange]);

  const handleEnglishChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManuallyEditedEnglish(true);
    onEnglishChange(e.target.value);
  };

  const handleArabicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setManuallyEditedArabic(true);
    onArabicChange(e.target.value);
  };

  const InputComponent = isTextarea ? Textarea : Input;

  return (
    <FormControl isRequired={isRequired}>
      <FormLabel>{label}</FormLabel>
      {autoTranslateEnabled && (
        <Text fontSize="xs" color="blue.600" mb={2} fontWeight="medium">
          💡 Type in either language - it will auto-translate to the other language
        </Text>
      )}
      <Tabs variant="enclosed" size="sm">
        <TabList>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FiGlobe} />
              <Text>English</Text>
            </HStack>
          </Tab>
          <Tab>
            <HStack spacing={2}>
              <Icon as={FiEdit3} />
              <Text>العربية</Text>
              {isTranslating && <Spinner size="xs" />}
              {manuallyEditedArabic && (
                <Box w={2} h={2} bg="blue.500" borderRadius="full" />
              )}
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} pt={2}>
            <InputComponent
              value={englishValue}
              onChange={handleEnglishChange}
              placeholder={autoTranslateEnabled ? `${placeholder} (will auto-translate to Arabic)` : placeholder}
              bg={tabBg}
              border="1px"
              borderColor={borderColor}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500',
              }}
            />
            {autoTranslateEnabled && !manuallyEditedEnglish && (
              <Text fontSize="xs" color="green.500" mt={1}>
                ✅ Auto-translated from Arabic
              </Text>
            )}
            {manuallyEditedEnglish && (
              <Text fontSize="xs" color="blue.500" mt={1}>
                ✏️ Manually edited (you can still edit this)
              </Text>
            )}
          </TabPanel>
          
          <TabPanel p={0} pt={2}>
            <InputComponent
              value={arabicValue}
              onChange={handleArabicChange}
              placeholder={autoTranslateEnabled ? "Auto-translated from English (or type manually)" : `${placeholder} (Arabic)`}
              bg={tabBg}
              border="1px"
              borderColor={borderColor}
              textAlign="right"
              dir="rtl"
              fontFamily="'Noto Sans Arabic', 'Arial Unicode MS', sans-serif"
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px blue.500',
              }}
            />
            {autoTranslateEnabled && !manuallyEditedArabic && (
              <Text fontSize="xs" color="green.500" mt={1} textAlign="right">
                ✅ Auto-translated from English
              </Text>
            )}
            {manuallyEditedArabic && (
              <Text fontSize="xs" color="blue.500" mt={1} textAlign="right">
                ✏️ Manually edited (you can still edit this)
              </Text>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </FormControl>
  );
};

export default BilingualInput;
