/**
 * Clean Professional Invoice Generator
 * Based on the clean quotation format from the screenshot
 */

export interface CleanInvoiceData {
  // Invoice Details
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  currency: string;
  
  // Company Details
  company_name_english: string;
  company_name_arabic: string;
  company_address_english: string;
  company_address_arabic: string;
  company_logo?: string;
  
  // Customer Details
  customer_name: string;
  customer_name_arabic: string;
  customer_address?: string;
  customer_address_arabic?: string;
  
  // Tax Information
  tax_rate: number;
  company_vat_number?: string;
  company_crn?: string;
  customer_vat_number?: string;
  
  // Items
  items: CleanInvoiceItem[];
  
  // Financial Summary
  subtotal: number;
  vat_amount: number;
  grand_total: number;
  
  // Terms and Conditions
  terms_conditions?: string[];
  
  // Contact Information
  contact_email?: string;
  contact_phone?: string;
  website?: string;
}

export interface CleanInvoiceItem {
  item_number: number;
  item_name: string;
  item_name_arabic: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total: number;
  vat_amount: number;
}

/**
 * Generate clean professional invoice HTML based on quotation format
 */
export function generateCleanProfessionalInvoiceHTML(data: CleanInvoiceData): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${(amount || 0).toFixed(2)} \uE900`;
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>INVOICE / فاتورة - ${data.invoice_number}</title>
        <style>
            @page {
                size: A4;
                margin: 15mm;
            }
            
            * {
                box-sizing: border-box;
            }
            
            body { 
                font-family: 'Arial', 'Tahoma', sans-serif; 
                margin: 0;
                padding: 0;
                direction: rtl;
                background: white;
                color: #333;
                font-size: 12px;
                line-height: 1.4;
            }
            
            .invoice-container {
                max-width: 100%;
                margin: 0 auto;
                background: white;
                padding: 20px;
            }
            
            /* Header Section */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid #333;
            }
            
            .company-info {
                flex: 1;
            }
            
            .company-name-english {
                font-size: 16px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .company-name-arabic {
                font-size: 14px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .company-address {
                font-size: 11px;
                color: #666;
                line-height: 1.3;
            }
            
            .logo-section {
                flex: 0 0 120px;
                text-align: center;
                padding: 10px;
            }
            
            .logo-placeholder {
                width: 80px;
                height: 80px;
                background: #f0f0f0;
                border: 2px solid #ddd;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 10px;
                font-size: 10px;
                color: #666;
                text-align: center;
            }
            
            .logo-text {
                font-size: 10px;
                font-weight: bold;
                color: #333;
            }
            
            /* Invoice Title */
            .invoice-title {
                text-align: center;
                margin: 30px 0;
                padding: 20px 0;
                border-top: 2px solid #333;
                border-bottom: 2px solid #333;
            }
            
            .invoice-title h1 {
                font-size: 28px;
                font-weight: bold;
                color: #333;
                margin: 0 0 10px 0;
            }
            
            .invoice-title h2 {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin: 0;
            }
            
            /* Invoice Details Section */
            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
            }
            
            .details-left, .details-right {
                flex: 1;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 12px;
            }
            
            .detail-label {
                font-weight: bold;
                color: #333;
                min-width: 120px;
            }
            
            .detail-value {
                color: #333;
                flex: 1;
                text-align: right;
            }
            
            .customer-section {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #ccc;
            }
            
            .customer-name {
                font-size: 14px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .customer-name-arabic {
                font-size: 12px;
                color: #666;
                margin-bottom: 10px;
            }
            
            /* Items Table */
            .items-section {
                margin-bottom: 30px;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #333;
                font-size: 11px;
            }
            
            .items-table th {
                background-color: #333;
                color: white;
                padding: 12px 8px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #333;
            }
            
            .items-table td {
                padding: 10px 8px;
                text-align: center;
                border: 1px solid #333;
                vertical-align: top;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .item-description {
                text-align: right;
                font-size: 10px;
            }
            
            .item-description .english {
                font-weight: bold;
                margin-bottom: 3px;
            }
            
            .item-description .arabic {
                color: #666;
                font-style: italic;
            }
            
            /* Summary Section */
            .summary-section {
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
            }
            
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                font-size: 13px;
            }
            
            .summary-label {
                font-weight: bold;
                color: #333;
            }
            
            .summary-value {
                font-weight: bold;
                color: #333;
            }
            
            .grand-total {
                font-size: 16px;
                font-weight: bold;
                border-top: 2px solid #333;
                padding-top: 10px;
                margin-top: 15px;
            }
            
            /* Terms and Conditions */
            .terms-section {
                margin-bottom: 30px;
            }
            
            .terms-title {
                font-size: 14px;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
            }
            
            .terms-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .terms-list li {
                margin-bottom: 5px;
                font-size: 11px;
                color: #333;
            }
            
            /* Footer Section */
            .footer {
                display: flex;
                justify-content: space-between;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 2px solid #333;
                font-size: 10px;
                color: #666;
            }
            
            .footer-left, .footer-right {
                flex: 1;
            }
            
            .footer-row {
                margin-bottom: 3px;
            }
            
            .footer-label {
                font-weight: bold;
                color: #333;
            }
            
            @media print {
                body { margin: 0; }
                .invoice-container { padding: 0; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <div class="company-info">
                    <div class="company-name-english">${data.company_name_english}</div>
                    <div class="company-name-arabic">${data.company_name_arabic}</div>
                    <div class="company-address">${data.company_address_english}</div>
                </div>
                <div class="logo-section">
                    <div class="logo-placeholder">
                        ${data.company_logo || 'LOGO'}
                    </div>
                    <div class="logo-text">${data.company_name_english}</div>
                </div>
            </div>

            <!-- Invoice Title -->
            <div class="invoice-title">
                <h1>INVOICE</h1>
                <h2>فاتورة</h2>
            </div>

            <!-- Invoice Details -->
            <div class="invoice-details">
                <div class="details-left">
                    <div class="detail-row">
                        <span class="detail-label">Invoice #:</span>
                        <span class="detail-value">${data.invoice_number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${formatDate(data.invoice_date)}</span>
                    </div>
                    ${data.due_date ? `
                    <div class="detail-row">
                        <span class="detail-label">Due Date:</span>
                        <span class="detail-value">${formatDate(data.due_date)}</span>
                    </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Currency:</span>
                        <span class="detail-value">${data.currency}</span>
                    </div>
                </div>
                
                <div class="details-right">
                    <div class="customer-section">
                        <div class="customer-name">Customer: ${data.customer_name}</div>
                        <div class="customer-name-arabic">${data.customer_name_arabic}</div>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Tax Rate:</span>
                        <span class="detail-value">${data.tax_rate}%</span>
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <div class="items-section">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 45%;">Item & Description</th>
                            <th style="width: 10%;">Qty</th>
                            <th style="width: 10%;">Unit</th>
                            <th style="width: 15%;">Unit Price</th>
                            <th style="width: 15%;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map((item) => `
                            <tr>
                                <td>${item.item_number}</td>
                                <td class="item-description">
                                    <div class="english">${item.item_name}</div>
                                    <div class="arabic">${item.item_name_arabic}</div>
                                </td>
                                <td>${item.quantity}</td>
                                <td>${item.unit}</td>
                                <td>${formatCurrency(item.unit_price)} ${data.currency}</td>
                                <td>${formatCurrency(item.total)} ${data.currency}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Summary Section -->
            <div class="summary-section">
                <div class="summary-row">
                    <span class="summary-label">Subtotal:</span>
                    <span class="summary-value">${formatCurrency(data.subtotal)} ${data.currency}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">VAT (${data.tax_rate}%):</span>
                    <span class="summary-value">${formatCurrency(data.vat_amount)} ${data.currency}</span>
                </div>
                <div class="summary-row grand-total">
                    <span class="summary-label">GRAND TOTAL:</span>
                    <span class="summary-value">${formatCurrency(data.grand_total)} ${data.currency}</span>
                </div>
            </div>

            <!-- Terms and Conditions -->
            ${data.terms_conditions && data.terms_conditions.length > 0 ? `
            <div class="terms-section">
                <div class="terms-title">Terms & Conditions</div>
                <ul class="terms-list">
                    ${data.terms_conditions.map(term => `<li>${term}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
                <div class="footer-left">
                    <div class="footer-row">${data.company_address_english}</div>
                    ${data.company_vat_number ? `<div class="footer-row"><span class="footer-label">VAT:</span> ${data.company_vat_number}</div>` : ''}
                    ${data.company_crn ? `<div class="footer-row"><span class="footer-label">CR:</span> ${data.company_crn}</div>` : ''}
                    ${data.contact_email ? `<div class="footer-row"><span class="footer-label">Email:</span> ${data.contact_email}</div>` : ''}
                    ${data.contact_phone ? `<div class="footer-row"><span class="footer-label">Phone:</span> ${data.contact_phone}</div>` : ''}
                </div>
                <div class="footer-right">
                    <div class="footer-row">${data.company_address_arabic}</div>
                    ${data.company_vat_number ? `<div class="footer-row"><span class="footer-label">رقم الضريبة:</span> ${data.company_vat_number}</div>` : ''}
                    ${data.company_crn ? `<div class="footer-row"><span class="footer-label">السجل التجاري:</span> ${data.company_crn}</div>` : ''}
                    ${data.website ? `<div class="footer-row"><span class="footer-label">Website:</span> ${data.website}</div>` : ''}
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Convert regular invoice data to clean professional format
 */
export function convertToCleanInvoiceFormat(invoice: any): CleanInvoiceData {
  return {
    // Invoice Details
    invoice_number: invoice.invoice_number || invoice._id,
    invoice_date: invoice.invoice_date || new Date().toISOString(),
    due_date: invoice.due_date,
    currency: invoice.currency || 'SAR',
    
    // Company Details
    company_name_english: invoice.organization_name || 'TradingERP System',
    company_name_arabic: invoice.organization_name_arabic || 'نظام إدارة التجارة',
    company_address_english: invoice.organization_address || 'Riyadh, Saudi Arabia',
    company_address_arabic: invoice.organization_address_arabic || 'الرياض، المملكة العربية السعودية',
    company_logo: invoice.organization_logo,
    
    // Customer Details
    customer_name: invoice.customer_name || 'N/A',
    customer_name_arabic: invoice.customer_name_arabic || 'غير محدد',
    customer_address: invoice.customer_address,
    customer_address_arabic: invoice.customer_address_arabic,
    
    // Tax Information
    tax_rate: invoice.vat_rate || 15,
    company_vat_number: invoice.organization_tax_id,
    company_crn: invoice.organization_crn,
    customer_vat_number: invoice.customer_tax_id,
    
    // Items
    items: (invoice.items || []).map((item: any, index: number) => ({
      item_number: index + 1,
      item_name: item.inventory_name || item.description || 'Item',
      item_name_arabic: item.inventory_name_arabic || item.description_arabic || 'صنف',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      unit_price: item.unit_price || 0,
      total: (item.quantity || 1) * (item.unit_price || 0),
      vat_amount: ((item.quantity || 1) * (item.unit_price || 0)) * ((invoice.vat_rate || 15) / 100)
    })),
    
    // Financial Summary
    subtotal: invoice.subtotal || 0,
    vat_amount: invoice.total_vat || 0,
    grand_total: invoice.grand_total || 0,
    
    // Terms and Conditions
    terms_conditions: invoice.terms_conditions || ['* Payment terms as agreed'],
    
    // Contact Information
    contact_email: invoice.organization_email,
    contact_phone: invoice.organization_phone,
    website: invoice.organization_website
  };
}
