import React, { useState } from 'react';
import { IconButton, IconButtonProps, useToast } from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import PurchaseOrderPDF from './PurchaseOrderPDF';

interface PurchaseOrderPDFButtonProps extends Omit<IconButtonProps, 'onClick'> {
  purchaseOrder: any;
  supplier: any;
  organization: any;
  fileName?: string;
}

const PurchaseOrderPDFButton: React.FC<PurchaseOrderPDFButtonProps> = ({
  purchaseOrder,
  supplier,
  organization,
  fileName,
  ...buttonProps
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch PO items
  const poItems = useQuery(api.purchaseOrderItems.listPurchaseOrderItems, {
    purchase_order_id: purchaseOrder._id as any
  });

  const defaultFileName = `${purchaseOrder.po_number}_PurchaseOrder.pdf`;
  const finalFileName = fileName || defaultFileName;

  if (!poItems) {
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
        <PurchaseOrderPDF
          purchaseOrder={purchaseOrder}
          items={poItems}
          supplier={supplier}
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

export default PurchaseOrderPDFButton;
