import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts
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
    borderBottom: '2px solid #3b82f6',
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
    color: '#3b82f6',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  prInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  prNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  prDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  requesterSection: {
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
  requesterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requesterDetails: {
    flex: 1,
    marginRight: 20,
  },
  requesterName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  requesterInfoText: {
    fontSize: 10,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  prDetails: {
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
  colItem: { width: '25%' },
  colDesc: { width: '25%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
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
  justificationSection: {
    marginBottom: 20,
  },
  justificationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  justificationText: {
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

interface PurchaseRequisitionPDFProps {
  purchaseRequisition: any;
  items: any[];
  organization: any;
}

const PurchaseRequisitionPDF: React.FC<PurchaseRequisitionPDFProps> = ({
  purchaseRequisition,
  items,
  organization,
}) => {
  const formatCurrency = (amount: number) => {
    return `${purchaseRequisition.currency} ${amount.toFixed(2)}`;
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
            <View style={styles.prInfo}>
              <Text style={styles.prNumber}>{purchaseRequisition.pr_number}</Text>
              <Text style={styles.prDate}>
                Date: {formatDate(purchaseRequisition.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Requester and PR Details */}
        <View style={styles.requesterSection}>
          <Text style={styles.sectionTitle}>PURCHASE REQUISITION</Text>
          <View style={styles.requesterInfo}>
            <View style={styles.requesterDetails}>
              <Text style={styles.requesterName}>Requester:</Text>
              <Text style={styles.requesterInfoText}>
                User ID: {purchaseRequisition.requester_id}
                {'\n'}
                Department: {purchaseRequisition.department || 'Not specified'}
              </Text>
            </View>
            <View style={styles.prDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>PR Number:</Text>
                <Text style={styles.detailValue}>{purchaseRequisition.pr_number}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Priority:</Text>
                <Text style={styles.detailValue}>{purchaseRequisition.priority}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={styles.detailValue}>{purchaseRequisition.status}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Department:</Text>
                <Text style={styles.detailValue}>
                  {purchaseRequisition.department || 'Not specified'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colItem]}>Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Est. Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colItem]}>{item.item_name}</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>
                {item.description || '-'}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>
                {formatCurrency(item.estimated_unit_price)}
              </Text>
              <Text style={[styles.tableCell, styles.colTotal]}>
                {formatCurrency(item.total_estimated_price)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Total Estimated Cost:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {formatCurrency(purchaseRequisition.total_estimated_cost)}
            </Text>
          </View>
        </View>

        {/* Justification */}
        <View style={styles.footer}>
          <View style={styles.justificationSection}>
            <Text style={styles.justificationTitle}>Justification:</Text>
            <Text style={styles.justificationText}>
              {purchaseRequisition.justification || 'No justification provided.'}
            </Text>
          </View>

          {/* Approval Section */}
          <View style={styles.approvalSection}>
            <View style={styles.approvalBox}>
              <Text style={styles.approvalTitle}>Department Approval</Text>
              <View style={styles.approvalLine} />
              <Text style={styles.approvalLabel}>Name & Signature</Text>
              {purchaseRequisition.approved_by && (
                <Text style={styles.approvalLabel}>
                  Date: {purchaseRequisition.approved_at ? formatDate(purchaseRequisition.approved_at) : 'Pending'}
                </Text>
              )}
            </View>
            <View style={styles.approvalBox}>
              <Text style={styles.approvalTitle}>Finance Approval</Text>
              <View style={styles.approvalLine} />
              <Text style={styles.approvalLabel}>Name & Signature</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PurchaseRequisitionPDF;
