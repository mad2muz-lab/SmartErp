import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts (optional - for better typography)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfA.ttf', fontWeight: 'normal' },
    { src: 'https://fonts.gstatic.com/s/helveticaneue/v70/1Ptsg8zYS_SKggPNyC0IT4ttDfB.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 20,
  },
  companyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  poInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  poNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  poDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  supplierSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 5,
  },
  supplierInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supplierDetails: {
    flex: 1,
    marginRight: 20,
  },
  supplierName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  supplierAddress: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  poDetails: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 80,
    color: '#374151',
  },
  detailValue: {
    fontSize: 10,
    color: '#1f2937',
    flex: 1,
  },
  itemsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: '1px solid #d1d5db',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    fontSize: 9,
    color: '#1f2937',
  },
  colWbs: { width: '8%' },
  colItem: { width: '25%' },
  colDesc: { width: '25%' },
  colQty: { width: '8%', textAlign: 'center' },
  colUnit: { width: '8%', textAlign: 'center' },
  colPrice: { width: '13%', textAlign: 'right' },
  colTotal: { width: '13%', textAlign: 'right' },
  sectionHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f3f4f6',
    borderBottom: '1px solid #d1d5db',
  },
  sectionHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
    width: '100%',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
    width: 200,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
    marginRight: 10,
  },
  totalValue: {
    fontSize: 10,
    width: 90,
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: 12,
    fontWeight: 'bold',
    borderTop: '1px solid #d1d5db',
    paddingTop: 5,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
  },
  termsSection: {
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 9,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  approvalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  approvalBox: {
    width: '45%',
    border: '1px solid #d1d5db',
    padding: 15,
  },
  approvalTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  approvalLine: {
    borderBottom: '1px solid #d1d5db',
    marginBottom: 5,
    height: 20,
  },
  approvalLabel: {
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});

interface PurchaseOrderPDFProps {
  purchaseOrder: any;
  items: any[];
  supplier: any;
  organization: any;
}

const PurchaseOrderPDF: React.FC<PurchaseOrderPDFProps> = ({
  purchaseOrder,
  items,
  supplier,
  organization,
}) => {
  const formatCurrency = (amount: number) => {
    return `${purchaseOrder.currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <View>
              <Text style={styles.companyName}>
                {organization?.name || 'TradingERP'}
              </Text>
              <Text style={styles.companyDetails}>
                {organization?.address || '123 Business Street\nCity, State 12345'}
              </Text>
              <Text style={styles.companyDetails}>
                Phone: {organization?.phone || '+1 (555) 123-4567'}
                {'\n'}
                Email: {organization?.email || 'info@tradingerp.com'}
              </Text>
            </View>
            <View style={styles.poInfo}>
              <Text style={styles.poNumber}>{purchaseOrder.po_number}</Text>
              <Text style={styles.poDate}>
                Date: {formatDate(purchaseOrder.issue_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Supplier and PO Details */}
        <View style={styles.supplierSection}>
          <Text style={styles.sectionTitle}>PURCHASE ORDER</Text>
          <View style={styles.supplierInfo}>
            <View style={styles.supplierDetails}>
              <Text style={styles.supplierName}>Supplier:</Text>
              <Text style={styles.supplierAddress}>
                {supplier?.name || 'Supplier Name'}
                {'\n'}
                {supplier?.address || 'Supplier Address'}
                {'\n'}
                {supplier?.phone && `Phone: ${supplier.phone}`}
                {'\n'}
                {supplier?.email && `Email: ${supplier.email}`}
              </Text>
            </View>
            <View style={styles.poDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PO Number:</Text>
                <Text style={styles.detailValue}>{purchaseOrder.po_number}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Issue Date:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(purchaseOrder.issue_date)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Date:</Text>
                <Text style={styles.detailValue}>
                  {purchaseOrder.expected_delivery_date
                    ? formatDate(purchaseOrder.expected_delivery_date)
                    : 'TBD'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Terms:</Text>
                <Text style={styles.detailValue}>
                  {purchaseOrder.payment_terms || 'Net 30'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Address:</Text>
                <Text style={styles.detailValue}>
                  {purchaseOrder.delivery_address || 'Company Address'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colWbs]}>WBS #</Text>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>Unit</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {items.map((item, index) => {
            if ((item as any).is_section_header) {
              return (
                <View key={index} style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionHeaderText}>
                    {(item as any).item_no ? `${(item as any).item_no}. ` : ''}
                    {(item as any).item_title || item.item_name}
                  </Text>
                </View>
              );
            }
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.colWbs]}>{(item as any).item_no || `${index + 1}`}</Text>
                <Text style={[styles.tableCell, styles.colItem, { fontWeight: 'bold' }]}>{item.item_name}</Text>
                <Text style={[styles.tableCell, styles.colDesc]}>
                  {item.description || '-'}
                </Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{(item as any).unit || 'pcs'}</Text>
                <Text style={[styles.tableCell, styles.colPrice]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.tableCell, styles.colTotal]}>
                  {formatCurrency(item.total_price)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(purchaseOrder.subtotal)}
            </Text>
          </View>
          {purchaseOrder.discount_amount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount:</Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(purchaseOrder.discount_amount)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax ({purchaseOrder.tax_rate}%):</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(purchaseOrder.tax_amount)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {formatCurrency(purchaseOrder.total_amount)}
            </Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.footer}>
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms and Conditions:</Text>
            <Text style={styles.termsText}>
              {purchaseOrder.notes || 'Standard terms and conditions apply. Payment terms as specified above. Delivery to be made to the address specified.'}
            </Text>
          </View>

          {/* Approval Section */}
          <View style={styles.approvalSection}>
            <View style={styles.approvalBox}>
              <Text style={styles.approvalTitle}>Approved By</Text>
              <View style={styles.approvalLine} />
              <Text style={styles.approvalLabel}>Name & Signature</Text>
              {purchaseOrder.approved_by && (
                <Text style={styles.approvalLabel}>
                  Date: {purchaseOrder.approved_at ? formatDate(purchaseOrder.approved_at) : 'Pending'}
                </Text>
              )}
            </View>
            <View style={styles.approvalBox}>
              <Text style={styles.approvalTitle}>Authorized By</Text>
              <View style={styles.approvalLine} />
              <Text style={styles.approvalLabel}>Name & Signature</Text>
              {purchaseOrder.authorized_by && (
                <Text style={styles.approvalLabel}>
                  Date: {purchaseOrder.authorized_at ? formatDate(purchaseOrder.authorized_at) : 'Pending'}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PurchaseOrderPDF;
