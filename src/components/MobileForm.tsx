import React from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Textarea,
  Select,
  Button,
  VStack,
  HStack,
  Box,
  useBreakpointValue,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';

interface MobileFormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  minH?: string;
  fontSize?: string;
}

const MobileFormField: React.FC<MobileFormFieldProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  options = [],
  value = '',
  onChange,
  error,
  required = false,
  disabled = false,
  minH = '48px',
  fontSize = 'md',
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const errorBorderColor = useColorModeValue('red.300', 'red.500');
  const bg = useColorModeValue('white', 'gray.700');

  const renderField = () => {
    const commonProps = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => 
        onChange?.(e.target.value),
      placeholder,
      disabled,
      bg,
      borderColor: error ? errorBorderColor : borderColor,
      _focus: {
        borderColor: error ? errorBorderColor : 'blue.500',
        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
      },
      _hover: {
        borderColor: 'gray.300',
      },
      size: isMobile ? 'lg' : 'md',
      minH: isMobile ? minH : 'auto',
      fontSize: isMobile ? fontSize : 'sm',
      borderRadius: 'md',
      transition: 'all 0.2s',
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={isMobile ? 4 : 3}
            resize="vertical"
            minH={isMobile ? '120px' : '80px'}
          />
        );
      case 'select':
        return (
          <Select {...commonProps}>
            <option value="">{placeholder || 'Select an option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        );
      default:
        return (
          <Input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  return (
    <FormControl isInvalid={!!error} isRequired={required}>
      <FormLabel
        fontSize={isMobile ? 'sm' : 'md'}
        fontWeight="medium"
        mb={isMobile ? 3 : 2}
        color={useColorModeValue('gray.700', 'gray.200')}
      >
        {label}
      </FormLabel>
      {renderField()}
      {error && (
        <FormErrorMessage fontSize={isMobile ? 'xs' : 'sm'} mt={2}>
          {error}
        </FormErrorMessage>
      )}
    </FormControl>
  );
};

interface MobileFormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitText?: string;
  isLoading?: boolean;
  submitButtonProps?: any;
  spacing?: number;
}

const MobileForm: React.FC<MobileFormProps> = ({
  children,
  onSubmit,
  submitText = 'Submit',
  isLoading = false,
  submitButtonProps = {},
  spacing = 6,
}) => {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      w="full"
      maxW="100%"
    >
      <VStack 
        spacing={isMobile ? spacing : 4} 
        align="stretch"
        w="full"
      >
        {children}
        {onSubmit && (
          <Button
            type="submit"
            colorScheme="blue"
            size={isMobile ? 'lg' : 'md'}
            minH={isMobile ? '56px' : 'auto'}
            fontSize={isMobile ? 'md' : 'sm'}
            fontWeight="semibold"
            isLoading={isLoading}
            loadingText="Submitting..."
            borderRadius="lg"
            boxShadow="md"
            _hover={{
              transform: 'translateY(-1px)',
              boxShadow: 'lg',
            }}
            _active={{
              transform: 'translateY(0)',
            }}
            transition="all 0.2s"
            {...submitButtonProps}
          >
            {submitText}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export { MobileForm, MobileFormField };
