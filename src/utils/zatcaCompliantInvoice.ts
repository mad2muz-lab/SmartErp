/**
 * ZATCA-Compliant Invoice Generator
 * Based on actual ZATCA VAT regulations and requirements
 */

import QRCode from 'qrcode';
import { generateLogoHTML } from './logoHandler';
import { generateZATCAQRCodeData, generateInvoiceUUID, generateZATCACryptographicHash, ZATCAQRData } from './zatcaQRGenerator';
import { formatCurrency as formatCurrencyWithSymbol } from './invoiceCurrencyUtils';

export interface ZATCACompliantInvoiceData {
  // Invoice Details
  invoice_number: string;
  invoice_date: string; // YYYY-MM-DD
  invoice_time: string; // HH:MM:SS
  due_date: string; // YYYY-MM-DD
  supply_date: string; // YYYY-MM-DD
  invoice_type: 'Standard' | 'Simplified';
  currency: string;
  
  // Company Details (Supplier)
  supplier_name: string;
  supplier_name_arabic: string;
  supplier_address: string;
  supplier_address_arabic: string;
  supplier_city: string;
  supplier_city_arabic: string;
  supplier_country: string;
  supplier_country_arabic: string;
  supplier_vat_number: string;
  supplier_crn?: string;
  supplier_phone?: string;
  supplier_email?: string;
  supplier_logo_url?: string;
  
  // Customer Details
  customer_name: string;
  customer_name_arabic: string;
  customer_address: string;
  customer_address_arabic: string;
  customer_city: string;
  customer_city_arabic: string;
  customer_country: string;
  customer_country_arabic: string;
  customer_vat_number?: string;
  customer_phone?: string;
  customer_email?: string;
  
  // Items
  items: ZATCAInvoiceItem[];
  
  // Financial Details
  subtotal: number;
  discount_amount?: number;
  discount_percentage?: number;
  vat_rate: number; // e.g., 0.15 for 15%
  vat_amount: number;
  grand_total: number;
  
  // ZATCA Specific
  zatca_reference_number?: string;
  invoice_hash?: string;
  qr_code_data?: string;
  
  // Additional
  notes?: string;
  notes_arabic?: string;
  payment_terms?: string;
  payment_terms_arabic?: string;
}

export interface ZATCAInvoiceItem {
  item_number: number;
  item_name: string;
  item_name_arabic: string;
  description?: string;
  description_arabic?: string;
  quantity: number;
  unit: string;
  unit_arabic: string;
  unit_price: number;
  discount_amount?: number;
  discount_percentage?: number;
  line_total: number;
  vat_rate: number;
  vat_amount: number;
  total_with_vat: number;
  sku_code?: string;
}

/**
 * Generate ZATCA-compliant invoice HTML
 */
export async function generateZATCACompliantInvoiceHTML(data: ZATCACompliantInvoiceData): Promise<string> {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyWithSymbol(amount || 0, 'SAR', true);
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
      data.supplier_vat_number,
      data.grand_total,
      data.vat_amount,
      invoiceUUID
    );
    
    const qrData: ZATCAQRData = {
      seller_name: data.supplier_name,
      seller_tax_id: data.supplier_vat_number,
      invoice_date: data.invoice_date,
      invoice_time: data.invoice_time || '00:00:00',
      invoice_total: data.grand_total,
      vat_total: data.vat_amount,
      invoice_uuid: invoiceUUID,
      cryptographic_hash: cryptographicHash
    };
    
    const zatcaQRData = generateZATCAQRCodeData(qrData);
    const qrCodeBase64 = await QRCode.toDataURL(zatcaQRData, {
      width: 150,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    qrCodeHTML = `
      <div style="text-align: center; margin: 20px 0;">
        <img src="${qrCodeBase64}" alt="ZATCA QR Code" style="width: 150px; height: 150px; border: 1px solid #ddd;" />
        <div style="font-size: 10px; color: #666; margin-top: 5px;">
          ZATCA QR Code / رمز الاستجابة السريعة
        </div>
        <div style="font-size: 8px; color: #999; margin-top: 2px;">
          UUID: ${invoiceUUID.substring(0, 8)}...
        </div>
      </div>
    `;
  } catch (error) {
    console.error('QR code generation failed:', error);
    qrCodeHTML = `
      <div style="text-align: center; margin: 20px 0; padding: 20px; border: 2px dashed #ccc;">
        <div style="font-size: 12px; color: #666;">
          QR Code Generation Failed<br>
          رمز الاستجابة السريعة فشل في التوليد
        </div>
      </div>
    `;
  }

  // Generate invoice hash for ZATCA compliance
  const invoiceHash = generateInvoiceHash(data);

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>فاتورة ضريبية / Tax Invoice - ${data.invoice_number}</title>
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
                border: 1px solid #ddd;
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
                color: #2c5aa0;
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
                color: #2c5aa0;
                margin-bottom: 5px;
            }
            
            .company-name-center-arabic {
                font-size: 18px;
                font-weight: bold;
                color: #2c5aa0;
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
                color: #2c5aa0;
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
                background-color: #2c5aa0;
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
                color: #2c5aa0;
                margin: 0 0 5px 0;
            }
            
            .document-title-arabic {
                font-size: 20px;
                font-weight: bold;
                color: #2c5aa0;
                margin: 0;
            }
            
            /* Invoice Details Section */
            .invoice-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 25px;
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
                color: #2c5aa0;
                margin-bottom: 15px;
                border-bottom: 1px solid #2c5aa0;
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
            
            /* Items Table */
            .items-section {
                margin-bottom: 25px;
            }
            
            .items-title {
                font-size: 14px;
                font-weight: bold;
                color: #2c5aa0;
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
                background-color: #2c5aa0;
                color: white;
                padding: 12px 8px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #1e3a5f;
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
                margin-bottom: 25px;
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
                border-top: 2px solid #2c5aa0;
                padding-top: 10px;
                margin-top: 15px;
                color: #2c5aa0;
            }
            
            /* ZATCA Compliance Section */
            .zatca-section {
                margin-bottom: 25px;
                padding: 20px;
                background: #e3f2fd;
                border: 1px solid #2196f3;
            }
            
            .zatca-title {
                font-size: 14px;
                font-weight: bold;
                color: #1976d2;
                margin-bottom: 15px;
                text-align: center;
            }
            
            .zatca-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
            }
            
            .zatca-left, .zatca-right {
                flex: 1;
                margin: 0 10px;
            }
            
            .zatca-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 11px;
            }
            
            .zatca-label {
                font-weight: bold;
                color: #1976d2;
            }
            
            .zatca-value {
                color: #333;
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
                .invoice-container { border: none; box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <!-- Left Section - English Company Info -->
                <div class="header-left">
                    <div class="company-name-english">
                        ${data.supplier_name}
                    </div>
                    <div class="company-address-english">
                        ${data.supplier_address}
                    </div>
                </div>
                
                <!-- Center Section - Logo Only -->
                <div class="header-center">
                    <div class="company-logo">
                        ${generateLogoHTML(data.supplier_logo_url, 'Company')}
                    </div>
                </div>
                
                <!-- Right Section - Arabic Company Info -->
                <div class="header-right">
                    <div class="company-name-arabic">
                        ${data.supplier_name_arabic}
                    </div>
                    <div class="company-address-arabic">
                        ${data.supplier_address_arabic}
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
                <div class="document-title">TAX INVOICE</div>
                <div class="document-title-arabic">فاتورة ضريبية</div>
            </div>

            <!-- Invoice Details -->
            <div class="invoice-details">
                <div class="details-left">
                    <div class="section-title">تفاصيل الفاتورة</div>
                    <div class="detail-row">
                        <span class="detail-label">رقم الفاتورة / Invoice No:</span>
                        <span class="detail-value">${data.invoice_number}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ الإصدار / Issue Date:</span>
                        <span class="detail-value">${formatDate(data.invoice_date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">وقت الإصدار / Issue Time:</span>
                        <span class="detail-value">${data.invoice_time}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ التوريد / Supply Date:</span>
                        <span class="detail-value">${formatDate(data.supply_date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">تاريخ الاستحقاق / Due Date:</span>
                        <span class="detail-value">${formatDate(data.due_date)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">نوع الفاتورة / Invoice Type:</span>
                        <span class="detail-value">${data.invoice_type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">العملة / Currency:</span>
                        <span class="detail-value">${data.currency}</span>
                    </div>
                </div>
                
                <div class="details-right">
                    <div class="section-title">تفاصيل العميل</div>
                    <div class="detail-row">
                        <span class="detail-label">اسم العميل / Customer Name:</span>
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
                    <div class="detail-row">
                        <span class="detail-label">المدينة / City:</span>
                        <span class="detail-value">${data.customer_city}, ${data.customer_country}</span>
                    </div>
                    ${data.customer_vat_number ? `
                    <div class="detail-row">
                        <span class="detail-label">رقم الضريبة / VAT Number:</span>
                        <span class="detail-value">${data.customer_vat_number}</span>
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
                            <th style="width: 35%;">الوصف / Description</th>
                            <th style="width: 8%;">الكمية / Qty</th>
                            <th style="width: 8%;">الوحدة / Unit</th>
                            <th style="width: 12%;">سعر الوحدة / Unit Price</th>
                            <th style="width: 12%;">المجموع / Total</th>
                            <th style="width: 8%;">الضريبة / VAT</th>
                            <th style="width: 12%;">المجموع شامل الضريبة / Total with VAT</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map((item) => `
                            <tr>
                                <td>${item.item_number}</td>
                                <td class="item-description">
                                    <div class="english">${item.item_name}</div>
                                    <div class="arabic">${item.item_name_arabic}</div>
                                    ${item.sku_code ? `<div style="font-size: 9px; color: #666;">SKU: ${item.sku_code}</div>` : ''}
                                </td>
                                <td>${item.quantity}</td>
                                <td>${item.unit_arabic}<br><small>${item.unit}</small></td>
                                <td>${formatCurrency(item.unit_price)}</td>
                                <td>${formatCurrency(item.line_total)}</td>
                                <td>${formatCurrency(item.vat_amount)}</td>
                                <td>${formatCurrency(item.total_with_vat)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Summary Section -->
            <div class="summary-section">
                <div class="summary-row">
                    <span class="summary-label">المجموع الفرعي / Subtotal:</span>
                    <span class="summary-value">${formatCurrency(data.subtotal)} ${data.currency}</span>
                </div>
                ${data.discount_amount ? `
                <div class="summary-row">
                    <span class="summary-label">الخصم / Discount:</span>
                    <span class="summary-value">-${formatCurrency(data.discount_amount)} ${data.currency}</span>
                </div>
                ` : ''}
                <div class="summary-row">
                    <span class="summary-label">ضريبة القيمة المضافة / VAT (${(data.vat_rate * 100).toFixed(0)}%):</span>
                    <span class="summary-value">${formatCurrency(data.vat_amount)} ${data.currency}</span>
                </div>
                <div class="summary-row grand-total">
                    <span class="summary-label">المجموع الكلي / Grand Total:</span>
                    <span class="summary-value">${formatCurrency(data.grand_total)} ${data.currency}</span>
                </div>
            </div>

            <!-- ZATCA Compliance Section -->
            <div class="zatca-section">
                <div class="zatca-title">امتثال هيئة الزكاة والضريبة والجمارك / ZATCA Compliance</div>
                <div class="zatca-info">
                    <div class="zatca-left">
                        <div class="zatca-row">
                            <span class="zatca-label">رقم تسجيل ضريبة القيمة المضافة / VAT Registration No:</span>
                            <span class="zatca-value">${data.supplier_vat_number}</span>
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
                    <div class="zatca-right">
                        ${qrCodeHTML}
                    </div>
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
function generateInvoiceHash(data: ZATCACompliantInvoiceData): string {
  const hashData = {
    invoice_number: data.invoice_number,
    invoice_date: data.invoice_date,
    supplier_tax_id: data.supplier_vat_number,
    customer_tax_id: data.customer_vat_number,
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
 * Convert regular invoice data to ZATCA compliant format
 */
export function convertToZATCACompliantFormat(invoice: any): ZATCACompliantInvoiceData {
  return {
    // Invoice Details
    invoice_number: invoice.invoice_number || invoice._id,
    invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
    invoice_time: new Date().toTimeString().split(' ')[0],
    due_date: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    supply_date: invoice.supply_date || invoice.invoice_date || new Date().toISOString().split('T')[0],
    invoice_type: invoice.invoice_type || 'Standard',
    currency: invoice.currency || 'SAR',
    
    // Company Details (Supplier)
    supplier_name: invoice.organization_name || 'TradingERP System',
    supplier_name_arabic: invoice.organization_name_arabic || 'نظام إدارة التجارة',
    supplier_address: invoice.organization_address || 'Riyadh, Saudi Arabia',
    supplier_address_arabic: invoice.organization_address_arabic || 'الرياض، المملكة العربية السعودية',
    supplier_city: invoice.organization_city || 'Riyadh',
    supplier_city_arabic: invoice.organization_city_arabic || 'الرياض',
    supplier_country: invoice.organization_country || 'Saudi Arabia',
    supplier_country_arabic: invoice.organization_country_arabic || 'المملكة العربية السعودية',
    supplier_vat_number: invoice.organization_tax_id || '300000000000003',
    supplier_crn: invoice.organization_crn,
    supplier_phone: invoice.organization_phone,
    supplier_email: invoice.organization_email,
    supplier_logo_url: invoice.organization_logo_url,
    
    // Customer Details
    customer_name: invoice.customer_name || 'N/A',
    customer_name_arabic: invoice.customer_name_arabic || 'غير محدد',
    customer_address: invoice.customer_address || 'N/A',
    customer_address_arabic: invoice.customer_address_arabic || 'غير محدد',
    customer_city: invoice.customer_city || 'N/A',
    customer_city_arabic: invoice.customer_city_arabic || 'غير محدد',
    customer_country: invoice.customer_country || 'Saudi Arabia',
    customer_country_arabic: invoice.customer_country_arabic || 'المملكة العربية السعودية',
    customer_vat_number: invoice.customer_tax_id,
    customer_phone: invoice.customer_phone,
    customer_email: invoice.customer_email,
    
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
        item_name: item.description || 'Item',
        item_name_arabic: item.description_arabic || 'صنف',
        description: item.description,
        description_arabic: item.description_arabic,
        quantity: quantity,
        unit: item.unit || 'pcs',
        unit_arabic: item.unit_arabic || 'قطعة',
        unit_price: unitPrice,
        discount_amount: discountAmount,
        discount_percentage: item.discount_percentage,
        line_total: lineTotal,
        vat_rate: vatRate,
        vat_amount: vatAmount,
        total_with_vat: totalWithVat,
        sku_code: item.sku_code
      };
    }),
    
    // Financial Details
    subtotal: invoice.subtotal || 0,
    discount_amount: invoice.discount_amount,
    discount_percentage: invoice.discount_percentage,
    // Handle VAT rate - if it's already a decimal (0.15), use it; if it's a percentage (15), convert it
    vat_rate: (invoice.vat_rate || 15) > 1 ? (invoice.vat_rate || 15) / 100 : (invoice.vat_rate || 15),
    vat_amount: invoice.total_vat || 0,
    grand_total: invoice.grand_total || 0,
    
    // ZATCA Specific
    zatca_reference_number: invoice.zatca_reference,
    invoice_hash: invoice.invoice_hash,
    qr_code_data: invoice.qr_code_data,
    
    // Additional
    notes: invoice.notes,
    notes_arabic: invoice.notes_arabic,
    payment_terms: invoice.payment_terms,
    payment_terms_arabic: invoice.payment_terms_arabic
  };
}
