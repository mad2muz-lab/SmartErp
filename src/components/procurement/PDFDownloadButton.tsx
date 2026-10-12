import React from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DownloadIcon } from '@chakra-ui/icons';

interface PDFDownloadButtonProps extends Omit<ButtonProps, 'onClick'> {
  document: React.ReactElement;
  fileName: string;
  children?: React.ReactNode;
  isLoading?: boolean;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  document,
  fileName,
  children,
  isLoading = false,
  ...buttonProps
}) => {
  return (
    <PDFDownloadLink
      document={document}
      fileName={fileName}
      style={{ textDecoration: 'none' }}
    >
      {({ blob, url, loading, error }) => (
        <Button
          leftIcon={<DownloadIcon />}
          isLoading={loading || isLoading}
          isDisabled={loading || isLoading || !!error}
          {...buttonProps}
        >
          {children || 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default PDFDownloadButton;
