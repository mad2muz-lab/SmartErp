import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { FiShield, FiCheckCircle } from 'react-icons/fi';
import OneClickZATCACompliance from './OneClickZATCACompliance';

interface ZATCAComplianceButtonProps {
  invoice: any;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const ZATCAComplianceButton: React.FC<ZATCAComplianceButtonProps> = ({
  invoice,
  size = 'md',
  variant = 'solid',
  onSuccess,
  onError
}) => {
  const toast = useToast();

  // Check if invoice is already compliant
  const isAlreadyCompliant = () => {
    return invoice.zatca_csid && 
           invoice.zatca_certificate && 
           invoice.zatca_xml && 
           invoice.digital_signature && 
           invoice.zatca_reference;
  };

  if (isAlreadyCompliant()) {
    return (
      <Button
        colorScheme="green"
        leftIcon={<FiCheckCircle />}
        size={size}
        variant={variant}
        isDisabled
      >
        ZATCA Compliant ✓
      </Button>
    );
  }

  return (
    <OneClickZATCACompliance 
      invoice={invoice}
      onSuccess={() => {
        toast({
          title: "ZATCA Compliance Complete!",
          description: "Invoice is now fully compliant and ready for submission",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        onSuccess?.();
      }}
      onError={(error) => {
        toast({
          title: "ZATCA Compliance Failed",
          description: error,
          status: "error",
          duration: 8000,
          isClosable: true,
        });
        onError?.(error);
      }}
    />
  );
};

export default ZATCAComplianceButton;
