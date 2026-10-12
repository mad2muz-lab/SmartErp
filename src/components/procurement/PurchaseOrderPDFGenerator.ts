import { formatCurrencyDisplay } from '../../utils/currencyUtils';

export interface PurchaseOrderData {
  po_number: string;
  supplier: string;
  supplier_id: string;
  order_date: string;
  delivery_date: string;
  payment_terms: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  currency: string;
  notes: string;
}

export interface PurchaseOrderItem {
  id: string;
  item_name: string;
  item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  delivery_date: string;
}

export interface OrganizationData {
  name: string;
  name_arabic?: string;
  address: string;
  address_arabic?: string;
  vat_number?: string;
  vat_number_arabic?: string;
  cr_number?: string;
  logo_url?: string;
}

export interface PDFGenerationOptions {
  includeLogo?: boolean;
  includeArabic?: boolean;
  customStyling?: boolean;
}

export class PurchaseOrderPDFGenerator {
  private purchaseOrderData: PurchaseOrderData;
  private orgData: OrganizationData;
  private options: PDFGenerationOptions;

  constructor(purchaseOrderData: PurchaseOrderData, orgData: OrganizationData, options: PDFGenerationOptions = {}) {
    this.purchaseOrderData = purchaseOrderData;
    this.orgData = orgData;
    this.options = options;
  }

  async generatePDF(action: 'download' | 'print' = 'download'): Promise<void> {
    try {
      console.log('Professional Purchase Order PDF Generation started');
      console.log('Purchase Order data:', this.purchaseOrderData);
      console.log('Organization data:', this.orgData);

      // Create professional HTML content
      const htmlContent = this.createProfessionalHTML();

      if (action === 'download') {
        // Create a blob with the HTML content
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PO-${this.purchaseOrderData.po_number}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Print functionality
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  private createProfessionalHTML(): string {
    return `
      <!DOCTYPE html>
      <html dir="ltr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Purchase Order ${this.purchaseOrderData.po_number}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: 'Inter', 'Arial', sans-serif;
                  line-height: 1.6;
                  color: #333;
                  background: #fff;
                  padding: 20px;
              }
              
              .header {
                  text-align: center;
                  margin-bottom: 30px;
                  padding: 20px;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  border-radius: 10px;
              }
              
              .header h1 {
                  font-size: 28px;
                  font-weight: 700;
                  margin-bottom: 5px;
              }
              
              .header .arabic {
                  font-family: 'Noto Sans Arabic', 'Arial Unicode MS', sans-serif;
                  font-size: 20px;
                  opacity: 0.9;
              }
              
              .company-info {
                  margin-bottom: 30px;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 8px;
                  border-left: 4px solid #667eea;
              }
              
              .company-info h2 {
                  color: #667eea;
                  margin-bottom: 10px;
                  font-size: 18px;
              }
              
              .document-title {
                  text-align: center;
                  margin: 30px 0;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 8px;
              }
              
              .document-title h2 {
                  font-size: 24px;
                  color: #333;
                  font-weight: 600;
              }
              
              .document-title .arabic {
                  font-family: 'Noto Sans Arabic', 'Arial Unicode MS', sans-serif;
                  font-size: 18px;
                  color: #666;
                  margin-top: 5px;
              }
              
              .order-details {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 30px;
                  margin-bottom: 30px;
              }
              
              .detail-section {
                  background: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  border: 1px solid #e9ecef;
              }
              
              .detail-section h3 {
                  color: #667eea;
                  margin-bottom: 15px;
                  font-size: 16px;
                  font-weight: 600;
              }
              
              .detail-item {
                  margin-bottom: 10px;
                  display: flex;
                  justify-content: space-between;
              }
              
              .detail-label {
                  font-weight: 500;
                  color: #555;
              }
              
              .detail-value {
                  font-weight: 600;
                  color: #333;
              }
              
              .status-badge {
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              
              .status-draft {
                  background: #e9ecef;
                  color: #6c757d;
              }
              
              .status-approved {
                  background: #d4edda;
                  color: #155724;
              }
              
              .items-section {
                  margin-bottom: 30px;
              }
              
              .items-section h3 {
                  color: #667eea;
                  margin-bottom: 15px;
                  font-size: 18px;
                  font-weight: 600;
              }
              
              .items-table {
                  width: 100%;
                  border-collapse: collapse;
                  background: #fff;
                  border-radius: 8px;
                  overflow: hidden;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .items-table th {
                  background: #667eea;
                  color: white;
                  padding: 12px;
                  text-align: left;
                  font-weight: 600;
                  font-size: 14px;
              }
              
              .items-table td {
                  padding: 12px;
                  border-bottom: 1px solid #e9ecef;
                  font-size: 14px;
              }
              
              .items-table tr:nth-child(even) {
                  background: #f8f9fa;
              }
              
              .items-table tr:hover {
                  background: #e9ecef;
              }
              
              .summary-section {
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 8px;
                  margin-bottom: 30px;
              }
              
              .summary-section h3 {
                  color: #667eea;
                  margin-bottom: 15px;
                  font-size: 18px;
                  font-weight: 600;
              }
              
              .summary-table {
                  width: 100%;
                  border-collapse: collapse;
              }
              
              .summary-table td {
                  padding: 8px 0;
                  border-bottom: 1px solid #dee2e6;
              }
              
              .summary-table .summary-label {
                  font-weight: 500;
                  color: #555;
              }
              
              .summary-table .summary-value {
                  font-weight: 600;
                  color: #333;
                  text-align: right;
              }
              
              .summary-table .total-row {
                  border-top: 2px solid #667eea;
                  font-size: 16px;
                  font-weight: 700;
              }
              
              .notes-section {
                  background: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  border: 1px solid #e9ecef;
                  margin-bottom: 30px;
              }
              
              .notes-section h3 {
                  color: #667eea;
                  margin-bottom: 15px;
                  font-size: 16px;
                  font-weight: 600;
              }
              
              .notes-content {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 6px;
                  border-left: 4px solid #667eea;
                  font-style: italic;
                  color: #666;
              }
              
              .footer {
                  text-align: center;
                  margin-top: 40px;
                  padding: 20px;
                  background: #f8f9fa;
                  border-radius: 8px;
                  color: #666;
                  font-size: 14px;
              }
              
              @media print {
                  body {
                      padding: 0;
                  }
                  
                  .header, .company-info, .document-title, .detail-section, .items-section, .summary-section, .notes-section, .footer {
                      break-inside: avoid;
                  }
                  
                  .items-table {
                      break-inside: avoid;
                  }
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>${this.orgData.name}</h1>
              ${this.orgData.name_arabic ? `<div class="arabic">${this.orgData.name_arabic}</div>` : ''}
              <div style="margin-top: 10px; font-size: 14px; opacity: 0.9;">
                  ${this.orgData.address}
                  ${this.orgData.address_arabic ? `<br><span class="arabic">${this.orgData.address_arabic}</span>` : ''}
              </div>
          </div>
          
          <div class="document-title">
              <h2>PURCHASE ORDER</h2>
              <div class="arabic">أمر شراء</div>
          </div>
          
          <div class="order-details">
              <div class="detail-section">
                  <h3>Order Information</h3>
                  <div class="detail-item">
                      <span class="detail-label">PO Number:</span>
                      <span class="detail-value">${this.purchaseOrderData.po_number}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Supplier:</span>
                      <span class="detail-value">${this.purchaseOrderData.supplier}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Order Date:</span>
                      <span class="detail-value">${this.purchaseOrderData.order_date}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Delivery Date:</span>
                      <span class="detail-value">${this.purchaseOrderData.delivery_date}</span>
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Order Details</h3>
                  <div class="detail-item">
                      <span class="detail-label">Status:</span>
                      <span class="detail-value">
                          <span class="status-badge status-${this.purchaseOrderData.status.toLowerCase()}">
                              ${this.purchaseOrderData.status.toUpperCase()}
                          </span>
                      </span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Payment Terms:</span>
                      <span class="detail-value">${this.purchaseOrderData.payment_terms}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Currency:</span>
                      <span class="detail-value">${formatCurrencyDisplay(0, this.purchaseOrderData.currency as any).replace('0.00 ', '')}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Tax Rate:</span>
                      <span class="detail-value">${this.purchaseOrderData.tax_rate}%</span>
                  </div>
              </div>
          </div>
          
          <div class="items-section">
              <h3>Ordered Items</h3>
              <table class="items-table">
                  <thead>
                      <tr>
                          <th>Sr#</th>
                          <th>Item Name</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Delivery Date</th>
                          <th>Total Price</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${this.purchaseOrderData.items.map((item, index) => `
                          <tr>
                              <td>${index + 1}</td>
                              <td>${item.item_name}</td>
                              <td>${item.quantity}</td>
                              <td>${formatCurrencyDisplay(item.unit_price, this.purchaseOrderData.currency as any)}</td>
                              <td>${item.delivery_date || '-'}</td>
                              <td>${formatCurrencyDisplay(item.total_price, this.purchaseOrderData.currency as any)}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <div class="summary-section">
              <h3>Order Summary</h3>
              <table class="summary-table">
                  <tr>
                      <td class="summary-label">Subtotal:</td>
                      <td class="summary-value">${formatCurrencyDisplay(this.purchaseOrderData.subtotal, this.purchaseOrderData.currency as any)}</td>
                  </tr>
                  <tr>
                      <td class="summary-label">Tax (${this.purchaseOrderData.tax_rate}%):</td>
                      <td class="summary-value">${formatCurrencyDisplay(this.purchaseOrderData.tax_amount, this.purchaseOrderData.currency as any)}</td>
                  </tr>
                  <tr class="total-row">
                      <td class="summary-label">Total Amount:</td>
                      <td class="summary-value">${formatCurrencyDisplay(this.purchaseOrderData.total_amount, this.purchaseOrderData.currency as any)}</td>
                  </tr>
              </table>
          </div>
          
          ${this.purchaseOrderData.notes ? `
              <div class="notes-section">
                  <h3>Notes</h3>
                  <div class="notes-content">
                      ${this.purchaseOrderData.notes}
                  </div>
              </div>
          ` : ''}
          
          <div class="footer">
              <p>This document was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p>Purchase Order ${this.purchaseOrderData.po_number} - ${this.orgData.name}</p>
          </div>
      </body>
      </html>
    `;
  }
}
