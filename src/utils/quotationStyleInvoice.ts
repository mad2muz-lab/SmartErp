/**
 * Quotation-Style Invoice Generator
 * Creates invoices with the same professional layout as quotations
 */

import QRCode from 'qrcode';
import { generateZATCAQRCodeData, generateInvoiceUUID, generateZATCACryptographicHash, ZATCAQRData, validateAndFixTRN } from './zatcaQRGenerator';
import { generateLogoHTML } from './logoHandler';
import { formatCurrency as formatCurrencyWithSymbol, formatCurrencyHTML } from './invoiceCurrencyUtils';
import { generateSaudiRiyalFontCSS } from './fontEmbedder';

export interface QuotationStyleInvoiceData {
  // Invoice Details
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  
  // Company Details
  company_name: string;
  company_name_arabic: string;
  company_address: string;
  company_address_arabic: string;
  company_vat_id: string;
  company_cr_number?: string;
  company_email?: string;
  company_phone?: string;
  company_website?: string;
  company_logo_url?: string;
  
  // Customer Details
  customer_name: string;
  customer_name_arabic: string;
  customer_address: string;
  customer_address_arabic: string;
  customer_vat_id?: string;
  
  // Items
  items: QuotationStyleInvoiceItem[];
  
  // Financial Details
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  
  // ZATCA Compliance
  zatca_reference_number?: string;
  invoice_hash?: string;
  qr_code_data?: string;
}

export interface QuotationStyleInvoiceItem {
  item_number: number;
  description: string;
  description_arabic: string;
  quantity: number;
  unit: string;
  unit_arabic: string;
  unit_price: number;
  line_total: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
}

/**
 * Generate quotation-style invoice HTML
 */
export async function generateQuotationStyleInvoiceHTML(data: QuotationStyleInvoiceData): Promise<string> {
  console.log('🔍 Generating quotation-style invoice HTML with data:', data);
  console.log('🔍 Logo URL in template data:', data.company_logo_url);
  
  // Calculate VAT total from line items to ensure accuracy
  const calculatedVatTotal = data.items.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
  const finalVatAmount = calculatedVatTotal > 0 ? calculatedVatTotal : data.vat_amount;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    const result = `<span class="currency-sar-symbol">${(amount || 0).toFixed(2)} &#xe900;</span>`;
    console.log('🔍 formatCurrency in quotationStyleInvoice - amount:', amount, 'result:', result);
    return result;
  };

  // Generate QR Code for ZATCA compliance
  let qrCodeHTML = '';
  try {
    // Generate proper ZATCA-compliant QR data
    const invoiceUUID = data.zatca_reference_number || generateInvoiceUUID();
    const cryptographicHash = await generateZATCACryptographicHash(
      data.invoice_number,
      data.invoice_date,
      data.invoice_time || '00:00:00',
      data.company_vat_id,
      data.grand_total,
      data.vat_amount,
      invoiceUUID
    );
    
    // Validate and fix TRN to ensure ZATCA compliance
    const trnValidation = validateAndFixTRN(data.company_vat_id);
    const validTRN = trnValidation.fixedTRN || data.company_vat_id;
    
    console.log('🔍 TRN Validation:', {
      original: data.company_vat_id,
      valid: trnValidation.valid,
      fixed: validTRN,
      errors: trnValidation.errors
    });
    
    const qrData: ZATCAQRData = {
      seller_name: data.company_name,
      seller_tax_id: validTRN,
      invoice_date: data.invoice_date,
      invoice_time: data.invoice_time || '00:00:00',
      invoice_total: data.grand_total,
      vat_total: finalVatAmount,
      invoice_uuid: invoiceUUID,
      cryptographic_hash: cryptographicHash,
      invoice_counter: 1, // TODO: Get actual invoice counter from database
      previous_invoice_hash: '0' // TODO: Get previous invoice hash for chain validation
    };
    
    const zatcaQRData = generateZATCAQRCodeData(qrData);
    const qrCodeBase64 = await QRCode.toDataURL(zatcaQRData, {
      width: 120,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    qrCodeHTML = `
      <div style="text-align: center; margin: 10px 0;">
        <img src="${qrCodeBase64}" alt="ZATCA QR Code" style="width: 120px; height: 120px; border: 1px solid #ddd;" />
        <div style="font-size: 9px; color: #666; margin-top: 3px;">
          ZATCA QR Code
        </div>
        <div style="font-size: 7px; color: #999; margin-top: 1px;">
          UUID: ${invoiceUUID.substring(0, 8)}...
        </div>
      </div>
    `;
  } catch (error) {
    console.error('QR code generation failed:', error);
    qrCodeHTML = `
      <div style="text-align: center; margin: 10px 0; padding: 10px; border: 1px dashed #ccc;">
        <div style="font-size: 10px; color: #666;">
          QR Code Not Available
        </div>
      </div>
    `;
  }

  // Generate invoice hash for ZATCA compliance
  const invoiceHash = generateInvoiceHash(data);
  
  console.log('🔍 About to generate HTML template with data:', data);
  console.log('🔍 formatCurrency test:', formatCurrency(123.45));
  console.log('🔍 VAT Calculation:', {
    calculatedVatTotal,
    dataVatAmount: data.vat_amount,
    finalVatAmount,
    itemsCount: data.items.length
  });
  
  return `
    <!DOCTYPE html>
    <html dir="ltr" lang="en">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة / Invoice - ${data.invoice_number}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            /* Saudi Riyal Font - Embedded for PDF compatibility */
            ${generateSaudiRiyalFontCSS()}
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
                direction: ltr;
                background: white;
                color: #333;
                font-size: 12px;
                line-height: 1.4;
            }
            
            .container {
                width: 100%;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            
            /* Header Section - Quotation Style */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
                padding-bottom: 15px;
            }
            
            /* Left Section - English Company Info */
            .header-left {
                flex: 1;
                text-align: left;
            }
            
            .company-name-english {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .company-address-english {
                font-size: 12px;
                color: #666;
                line-height: 1.3;
            }
            
            /* Center Section - Logo and Company Name */
            .header-center {
                flex: 1;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .company-logo {
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .company-name-center {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .company-name-center-arabic {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            /* Right Section - Arabic Company Info */
            .header-right {
                flex: 1;
                text-align: right;
            }
            
            .company-name-arabic {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .company-address-arabic {
                font-size: 12px;
                color: #666;
                line-height: 1.3;
            }
            
            /* Horizontal Separators */
            .separators {
                margin-bottom: 20px;
            }
            
            .separator-line {
                height: 1px;
                background-color: #333;
                margin: 2px 0;
            }
            
            /* Document Title Section */
            .document-title-section {
                background-color: #f5f5f5;
                padding: 15px;
                text-align: center;
                margin-bottom: 30px;
            }
            
            .document-title {
                font-size: 24px;
                font-weight: bold;
                color: #333;
                margin: 0 0 5px 0;
            }
            
            .document-title-arabic {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                margin: 0;
            }
            
            /* Details Section - Quotation Style */
            .details-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                padding: 20px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
            }
            
            .details-left, .details-right {
                flex: 1;
                margin: 0 15px;
            }
            
            .section-title {
                font-size: 14px;
                font-weight: bold;
                color: #333;
                margin-bottom: 15px;
                border-bottom: 1px solid #333;
                padding-bottom: 5px;
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
            
            
            /* Items Table - Quotation Style */
            .items-section {
                margin-bottom: 30px;
            }
            
            .items-title {
                font-size: 16px;
                font-weight: bold;
                color: #333;
                margin-bottom: 15px;
                text-align: center;
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
                font-family: 'SaudiRiyal', 'Arial Unicode MS', 'Tahoma', 'Arial', sans-serif;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .item-description {
                text-align: left;
                font-size: 10px;
            }
            
            .item-description .english {
                font-weight: bold;
                margin-bottom: 3px;
                color: #333;
            }
            
            .item-description .arabic {
                color: #666;
                font-style: italic;
            }
            
            /* Summary Section - Quotation Style */
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
                font-size: 18px;
                font-weight: bold;
                border-top: 2px solid #333;
                padding-top: 10px;
                margin-top: 15px;
                color: #333;
            }
            
            /* ZATCA Section - Compact */
            .zatca-section {
                margin-bottom: 20px;
                padding: 15px;
                background: #e3f2fd;
                border: 1px solid #2196f3;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .zatca-info {
                flex: 1;
            }
            
            .zatca-title {
                font-size: 12px;
                font-weight: bold;
                color: #1976d2;
                margin-bottom: 10px;
            }
            
            .zatca-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 3px;
                font-size: 10px;
            }
            
            .zatca-label {
                font-weight: bold;
                color: #1976d2;
            }
            
            .zatca-value {
                color: #333;
            }
            
            .zatca-qr {
                flex: 0 0 auto;
                margin-left: 20px;
            }
            
            /* Footer */
            .footer {
                margin-top: 30px;
                text-align: center;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                font-size: 10px;
                color: #666;
            }
            
            @media print {
                body { margin: 0; }
                .container { border: none; box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <!-- Left Section - English Company Info -->
                <div class="header-left">
                    <div class="company-name-english">
                        ${data.company_name}
                    </div>
                    <div class="company-address-english">
                        ${data.company_address}
                    </div>
                </div>
                
                <!-- Center Section - Logo Only -->
                <div class="header-center">
                    <div class="company-logo">
                        ${generateLogoHTML(data.company_logo_url, 'Company')}
                    </div>
                </div>
                
                <!-- Right Section - Arabic Company Info -->
                <div class="header-right">
                    <div class="company-name-arabic">
                        ${data.company_name_arabic}
                    </div>
                    <div class="company-address-arabic">
                        ${data.company_address_arabic}
                    </div>
                </div>
            </div>
            
            <!-- Horizontal Separators -->
            <div class="separators">
                <div class="separator-line"></div>
                <div class="separator-line"></div>
            </div>
            
            <!-- Document Title Section -->
            <div class="document-title-section">
                <div class="document-title">INVOICE</div>
                <div class="document-title-arabic">فاتورة</div>
            </div>

            <!-- Details Section -->
            <div class="details-section">
                <div class="details-left">
                    <div class="section-title">تفاصيل الفاتورة</div>
                    <div class="detail-row">
                        <span class="detail-label">رقم الفاتورة / Invoice No:</span>
                        <span class="detail-value">${data.invoice_number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ الفاتورة / Date:</span>
                        <span class="detail-value">${formatDate(data.invoice_date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ الاستحقاق / Due Date:</span>
                        <span class="detail-value">${formatDate(data.due_date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">العملة / Currency:</span>
                        <span class="detail-value currency-sar-symbol">&#xe900;</span>
                    </div>
                </div>
                
                <div class="details-right">
                    <div class="section-title">تفاصيل العميل</div>
                    <div class="detail-row">
                        <span class="detail-label">اسم العميل / Customer:</span>
                        <span class="detail-value">${data.customer_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">الاسم العربي / Arabic Name:</span>
                        <span class="detail-value">${data.customer_name_arabic}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">العنوان / Address:</span>
                        <span class="detail-value">${data.customer_address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">العنوان العربي / Arabic Address:</span>
                        <span class="detail-value">${data.customer_address_arabic}</span>
                    </div>
                    ${data.customer_vat_id ? `
                    <div class="detail-row">
                        <span class="detail-label">رقم الضريبة / VAT Number:</span>
                        <span class="detail-value">${data.customer_vat_id}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Items Table -->
            <div class="items-section">
                <div class="items-title">تفاصيل الأصناف / Items Details</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 40%;">Item & Description</th>
                            <th style="width: 8%;">Qty</th>
                            <th style="width: 8%;">Unit</th>
                            <th style="width: 12%;">Unit Price</th>
                            <th style="width: 12%;">Total</th>
                            <th style="width: 15%;">VAT Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map((item) => `
                            <tr>
                                <td>${item.item_number}</td>
                                <td class="item-description">
                                    <div class="english">${item.description}</div>
                                    <div class="arabic">${item.description_arabic}</div>
                                </td>
                                <td>${item.quantity}</td>
                                <td>${item.unit}</td>
                                <td>${formatCurrencyWithSymbol(item.unit_price, 'SAR')}</td>
                                <td>${formatCurrencyWithSymbol(item.line_total, 'SAR')}</td>
                                <td>${formatCurrencyWithSymbol(item.vat_amount, 'SAR')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Summary Section -->
            <div class="summary-section">
                <div class="summary-row">
                    <span class="summary-label">المجموع الفرعي / Subtotal:</span>
                    <span class="summary-value">${formatCurrencyWithSymbol(data.subtotal, 'SAR')}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">ضريبة القيمة المضافة / VAT (${(data.vat_rate * 100).toFixed(0)}%):</span>
                    <span class="summary-value">${formatCurrencyWithSymbol(finalVatAmount, 'SAR')}</span>
                </div>
                <div class="summary-row grand-total">
                    <span class="summary-label">المجموع الكلي / Grand Total:</span>
                    <span class="summary-value">${formatCurrencyWithSymbol(data.subtotal + finalVatAmount, 'SAR')}</span>
                </div>
            </div>

            <!-- ZATCA Section -->
            <div class="zatca-section">
                <div class="zatca-info">
                    <div class="zatca-title">امتثال هيئة الزكاة والضريبة والجمارك / ZATCA Compliance</div>
                    <div class="zatca-row">
                        <span class="zatca-label">رقم تسجيل ضريبة القيمة المضافة / VAT Registration No:</span>
                        <span class="zatca-value">${data.company_vat_id}</span>
                    </div>
                    <div class="zatca-row">
                        <span class="zatca-label">الرقم المرجعي / Reference Number:</span>
                        <span class="zatca-value">${data.zatca_reference_number || 'N/A'}</span>
                    </div>
                    <div class="zatca-row">
                        <span class="zatca-label">التوقيع الرقمي / Digital Signature:</span>
                        <span class="zatca-value">${invoiceHash}</span>
                    </div>
                </div>
                <div class="zatca-qr">
                    ${qrCodeHTML}
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>تم إنشاء هذه الفاتورة وفقاً لأنظمة هيئة الزكاة والضريبة والجمارك</p>
                <p>This invoice was generated in compliance with ZATCA regulations</p>
                <p>تاريخ الإنشاء / Generated on: ${new Date().toLocaleDateString('en-GB')} - ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// QR code generation functions moved to zatcaQRGenerator.ts

/**
 * Generate invoice hash for ZATCA compliance
 */
function generateInvoiceHash(data: QuotationStyleInvoiceData): string {
  const hashData = {
    invoice_number: data.invoice_number,
    invoice_date: data.invoice_date,
    supplier_tax_id: data.company_vat_id,
    customer_tax_id: data.customer_vat_id,
    grand_total: data.grand_total,
    vat_amount: data.vat_amount
  };
  
  const hashString = JSON.stringify(hashData);
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(16).toUpperCase();
}

/**
 * Convert regular invoice data to quotation-style format
 */
export function convertToQuotationStyleFormat(invoice: any): QuotationStyleInvoiceData {
  console.log('🔍 Converting invoice to quotation style format:', invoice);
  console.log('🔍 Organization logo URL in conversion:', invoice.organization_logo_url);
  
  return {
    // Invoice Details
    invoice_number: invoice.invoice_number || invoice._id,
    invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
    due_date: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currency: invoice.currency || 'SAR',
    
    // Company Details
    company_name: invoice.organization_name || 'TradingERP System',
    company_name_arabic: invoice.organization_name_arabic || 'نظام إدارة التجارة',
    company_address: invoice.organization_address || 'Riyadh, Saudi Arabia',
    company_address_arabic: invoice.organization_address_arabic || 'الرياض، المملكة العربية السعودية',
    company_vat_id: invoice.organization_tax_id || '300000000000003',
    company_cr_number: invoice.organization_crn,
    company_email: invoice.organization_email,
    company_phone: invoice.organization_phone,
    company_website: invoice.organization_website,
    company_logo_url: invoice.organization_logo_url,
    
    // Customer Details
    customer_name: invoice.customer_name || 'Unknown Customer',
    customer_name_arabic: invoice.customer_name_arabic || 'غير محدد',
    customer_address: invoice.customer_address || 'N/A',
    customer_address_arabic: invoice.customer_address_arabic || 'غير محدد',
    customer_vat_id: invoice.customer_tax_id,
    
    // Items
    items: (invoice.items || []).map((item: any, index: number) => {
      const quantity = item.quantity || 1;
      const unitPrice = item.unit_price || 0;
      const discountAmount = item.discount_amount || 0;
      // Handle VAT rate - if it's already a decimal (0.15), use it; if it's a percentage (15), convert it
      const rawVatRate = item.vat_rate || invoice.vat_rate || 15;
      const vatRate = rawVatRate > 1 ? rawVatRate / 100 : rawVatRate;
      
      const lineTotal = (quantity * unitPrice) - discountAmount;
      const vatAmount = lineTotal * vatRate;
      const totalWithVat = lineTotal + vatAmount;
      
      return {
        item_number: item.item_number || (index + 1),
        description: item.description || 'Item',
        description_arabic: item.description_arabic || 'صنف',
        quantity: quantity,
        unit: item.unit || 'pcs',
        unit_arabic: item.unit_arabic || 'قطعة',
        unit_price: unitPrice,
        line_total: lineTotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_with_vat: totalWithVat
      };
    }),
    
    // Financial Details
    subtotal: invoice.subtotal || 0,
    // Handle VAT rate - if it's already a decimal (0.15), use it; if it's a percentage (15), convert it
    vat_rate: (invoice.vat_rate || 15) > 1 ? (invoice.vat_rate || 15) / 100 : (invoice.vat_rate || 15),
    vat_amount: invoice.total_vat || 0,
    grand_total: invoice.grand_total || 0,
    
    // ZATCA Compliance
    zatca_reference_number: invoice.zatca_reference,
    invoice_hash: invoice.invoice_hash,
    qr_code_data: invoice.qr_code_data
  };
}
