import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  IconButton,
  IconButtonProps,
  useToast,
  useDisclosure,
} from '@chakra-ui/react';
import { EmailIcon } from '@chakra-ui/icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import EmailComposer from './EmailComposer';
import { PDFDownloadLink } from '@react-pdf/renderer';

interface EmailButtonProps extends Omit<IconButtonProps, 'onClick'> {
  organizationId: Id<"organizations"> | string;
  documentType: 'purchase_order' | 'purchase_requisition' | 'material_receipt';
  documentId: Id<"purchase_orders" | "purchase_requisitions" | "material_receipts">;
  documentNumber: string;
  supplierEmail?: string;
  supplierName?: string;
  pdfComponent: React.ComponentType<any>;
  pdfProps: any;
  fileName?: string;
}

const EmailButton: React.FC<EmailButtonProps> = ({
  organizationId,
  documentType,
  documentId,
  documentNumber,
  supplierEmail,
  supplierName,
  pdfComponent: PDFComponent,
  pdfProps,
  fileName,
  ...buttonProps
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  // Get organization details
  const organization = useQuery(api.organizations.getOrganization, {
    id: organizationId as any,
  });

  const handleEmailClick = async () => {
    if (!supplierEmail) {
      toast({
        title: 'No Supplier Email',
        description: 'Please add supplier email address to send emails',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsGeneratingPdf(true);
    onOpen();

    try {
      // Generate PDF blob
      const pdfBlob = await generatePDFBlob();
      setPdfBlob(pdfBlob);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF for email attachment',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generatePDFBlob = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Create a temporary div to render the PDF
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        // Render PDF component
        const pdfElement = (
          <PDFDownloadLink
            document={<PDFComponent {...pdfProps} />}
            fileName={fileName || `${documentType}_${documentNumber}.pdf`}
          >
            {({ blob, url, loading, error }) => {
              if (loading) return <div>Loading PDF...</div>;
              if (error) {
                reject(error);
                return <div>Error generating PDF</div>;
              }
              if (blob) {
                resolve(blob);
                return <div>PDF Ready</div>;
              }
              return <div>Generating PDF...</div>;
            }}
          </PDFDownloadLink>
        );

        // Render the PDF component
        const root = createRoot(tempDiv);
        root.render(pdfElement);

        // Cleanup after a short delay
        setTimeout(() => {
          document.body.removeChild(tempDiv);
        }, 1000);
      } catch (error) {
        reject(error);
      }
    });
  };

  return (
    <>
      <IconButton
        aria-label="Send Email"
        icon={<EmailIcon />}
        onClick={handleEmailClick}
        isLoading={isGeneratingPdf}
        colorScheme="blue"
        variant="ghost"
        size="sm"
        {...buttonProps}
      />

      <EmailComposer
        isOpen={isOpen}
        onClose={onClose}
        organizationId={organizationId}
        documentType={documentType}
        documentId={documentId}
        documentNumber={documentNumber}
        supplierEmail={supplierEmail}
        supplierName={supplierName}
        pdfBlob={pdfBlob || undefined}
        pdfFileName={fileName || `${documentType}_${documentNumber}.pdf`}
      />
    </>
  );
};

export default EmailButton;
