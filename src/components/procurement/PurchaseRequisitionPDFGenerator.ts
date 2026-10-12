import { formatCurrencyDisplay } from '../../utils/currencyUtils';

export interface PurchaseRequisitionData {
  pr_number: string;
  department: string;
  priority: string;
  requested_by: string;
  request_date: string;
  required_date: string;
  justification: string;
  items: PurchaseRequisitionItem[];
  total_amount: number;
  status: string;
  currency: string;
  notes: string;
}

export interface PurchaseRequisitionItem {
  id: string;
  item_name: string;
  item_id: string;
  description: string;
  quantity: number;
  estimated_unit_price: number;
  total_estimated_price: number;
  priority: string;
  required_date: string;
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

export class PurchaseRequisitionPDFGenerator {
  private requisitionData: PurchaseRequisitionData;
  private orgData: OrganizationData;
  private options: PDFGenerationOptions;

  constructor(requisitionData: PurchaseRequisitionData, orgData: OrganizationData, options: PDFGenerationOptions = {}) {
    this.requisitionData = requisitionData;
    this.orgData = orgData;
    this.options = options;
  }

  async generatePDF(action: 'download' | 'print' = 'download'): Promise<void> {
    try {
      console.log('Professional Purchase Requisition PDF Generation started');
      console.log('Requisition data:', this.requisitionData);
      console.log('Organization data:', this.orgData);

      // Create professional HTML content
      const htmlContent = this.createProfessionalHTML();

      if (action === 'download') {
        // Create a blob with the HTML content
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PR-${this.requisitionData.pr_number}.html`;
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
          <title>Purchase Requisition ${this.requisitionData.pr_number}</title>
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
              
              .requisition-details {
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
              
              .priority-badge {
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 600;
                  text-transform: uppercase;
              }
              
              .priority-low {
                  background: #d1ecf1;
                  color: #0c5460;
              }
              
              .priority-medium {
                  background: #fff3cd;
                  color: #856404;
              }
              
              .priority-high {
                  background: #f8d7da;
                  color: #721c24;
              }
              
              .priority-urgent {
                  background: #f5c6cb;
                  color: #721c24;
              }
              
              .justification-section {
                  background: #fff;
                  padding: 20px;
                  border-radius: 8px;
                  border: 1px solid #e9ecef;
                  margin-bottom: 30px;
              }
              
              .justification-section h3 {
                  color: #667eea;
                  margin-bottom: 15px;
                  font-size: 16px;
                  font-weight: 600;
              }
              
              .justification-content {
                  background: #f8f9fa;
                  padding: 15px;
                  border-radius: 6px;
                  border-left: 4px solid #667eea;
                  font-style: italic;
                  color: #666;
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
              
              .total-section {
                  background: #f8f9fa;
                  padding: 20px;
                  border-radius: 8px;
                  margin-bottom: 30px;
                  text-align: right;
              }
              
              .total-section h3 {
                  color: #667eea;
                  margin-bottom: 15px;
                  font-size: 18px;
                  font-weight: 600;
              }
              
              .total-amount {
                  font-size: 24px;
                  font-weight: 700;
                  color: #333;
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
                  
                  .header, .company-info, .document-title, .detail-section, .justification-section, .items-section, .total-section, .notes-section, .footer {
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
              <h2>PURCHASE REQUISITION</h2>
              <div class="arabic">طلب شراء</div>
          </div>
          
          <div class="requisition-details">
              <div class="detail-section">
                  <h3>Requisition Information</h3>
                  <div class="detail-item">
                      <span class="detail-label">PR Number:</span>
                      <span class="detail-value">${this.requisitionData.pr_number}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Department:</span>
                      <span class="detail-value">${this.requisitionData.department}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Requested By:</span>
                      <span class="detail-value">${this.requisitionData.requested_by}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Request Date:</span>
                      <span class="detail-value">${this.requisitionData.request_date}</span>
                  </div>
              </div>
              
              <div class="detail-section">
                  <h3>Requisition Details</h3>
                  <div class="detail-item">
                      <span class="detail-label">Priority:</span>
                      <span class="detail-value">
                          <span class="priority-badge priority-${this.requisitionData.priority.toLowerCase()}">
                              ${this.requisitionData.priority.toUpperCase()}
                          </span>
                      </span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Status:</span>
                      <span class="detail-value">
                          <span class="status-badge status-${this.requisitionData.status.toLowerCase()}">
                              ${this.requisitionData.status.toUpperCase()}
                          </span>
                      </span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Required Date:</span>
                      <span class="detail-value">${this.requisitionData.required_date}</span>
                  </div>
                  <div class="detail-item">
                      <span class="detail-label">Currency:</span>
                      <span class="detail-value">${formatCurrencyDisplay(0, this.requisitionData.currency as any).replace('0.00 ', '')}</span>
                  </div>
              </div>
          </div>
          
          <div class="justification-section">
              <h3>Justification</h3>
              <div class="justification-content">
                  ${this.requisitionData.justification}
              </div>
          </div>
          
          <div class="items-section">
              <h3>Requested Items</h3>
              <table class="items-table">
                  <thead>
                      <tr>
                          <th>Sr#</th>
                          <th>Item Name</th>
                          <th>Quantity</th>
                          <th>Est. Unit Price</th>
                          <th>Priority</th>
                          <th>Required Date</th>
                          <th>Total Price</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${this.requisitionData.items.map((item, index) => `
                          <tr>
                              <td>${index + 1}</td>
                              <td>${item.item_name}</td>
                              <td>${item.quantity}</td>
                              <td>${formatCurrencyDisplay(item.estimated_unit_price, this.requisitionData.currency as any)}</td>
                              <td>
                                  <span class="priority-badge priority-${item.priority.toLowerCase()}">
                                      ${item.priority.toUpperCase()}
                                  </span>
                              </td>
                              <td>${item.required_date || '-'}</td>
                              <td>${formatCurrencyDisplay(item.total_estimated_price, this.requisitionData.currency as any)}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          </div>
          
          <div class="total-section">
              <h3>Total Amount</h3>
              <div class="total-amount">
                  ${formatCurrencyDisplay(this.requisitionData.total_amount, this.requisitionData.currency as any)}
              </div>
          </div>
          
          ${this.requisitionData.notes ? `
              <div class="notes-section">
                  <h3>Notes</h3>
                  <div class="notes-content">
                      ${this.requisitionData.notes}
                  </div>
              </div>
          ` : ''}
          
          <div class="footer">
              <p>This document was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              <p>Purchase Requisition ${this.requisitionData.pr_number} - ${this.orgData.name}</p>
          </div>
      </body>
      </html>
    `;
  }
}
