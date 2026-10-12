import React, { useState } from 'react';
import { IconButton, IconButtonProps, useToast } from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import PurchaseRequisitionPDF from './PurchaseRequisitionPDF';

interface PurchaseRequisitionPDFButtonProps extends Omit<IconButtonProps, 'onClick'> {
  purchaseRequisition: any;
  organization: any;
  fileName?: string;
}

const PurchaseRequisitionPDFButton: React.FC<PurchaseRequisitionPDFButtonProps> = ({
  purchaseRequisition,
  organization,
  fileName,
  ...buttonProps
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch PR items
  const prItems = useQuery(api.purchaseRequisitionItems.listPurchaseRequisitionItems, {
    purchase_requisition_id: purchaseRequisition._id as any
  });

  const defaultFileName = `${purchaseRequisition.pr_number}_PurchaseRequisition.pdf`;
  const finalFileName = fileName || defaultFileName;

  if (!prItems) {
    return (
      <IconButton
        icon={<DownloadIcon />}
        isLoading={true}
        isDisabled={true}
        {...buttonProps}
      />
    );
  }

  return (
    <PDFDownloadLink
      document={
        <PurchaseRequisitionPDF
          purchaseRequisition={purchaseRequisition}
          items={prItems}
          organization={organization}
        />
      }
      fileName={finalFileName}
      style={{ textDecoration: 'none' }}
    >
      {({ blob, url, loading, error }) => (
        <IconButton
          icon={<DownloadIcon />}
          isLoading={loading || isLoading}
          isDisabled={loading || isLoading || !!error}
          onClick={() => {
            if (error) {
              toast({
                title: 'Error',
                description: 'Failed to generate PDF',
                status: 'error',
                duration: 3000,
              });
            }
          }}
          {...buttonProps}
        />
      )}
    </PDFDownloadLink>
  );
};

export default PurchaseRequisitionPDFButton;
