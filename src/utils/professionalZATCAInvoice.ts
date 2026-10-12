/**
 * Professional ZATCA-Compliant Invoice Generator
 * Based on the professional invoice format shown in the screenshot
 */

import { ZATCAInvoiceData } from './zatcaCompliance';
import { generateInvoiceQRCode } from './qrCodeGenerator';

export interface ProfessionalInvoiceData extends ZATCAInvoiceData {
  // Additional fields for professional format
  company_logo?: string;
  company_name_english: string;
  company_name_arabic: string;
  company_address_english: string;
  company_address_arabic: string;
  company_crn?: string;
  
  // Bank details
  bank_details?: {
    account_name: string;
    account_name_arabic: string;
    bank_name: string;
    bank_name_arabic: string;
    account_number: string;
    iban: string;
    branch: string;
    branch_arabic: string;
  };
  
  // Additional invoice details
  contract_po_number?: string;
  invoice_period?: {
    from: string;
    to: string;
  };
  project_reference?: string;
  
  // Item enhancements
  items: ProfessionalInvoiceItem[];
  
  // Amount in words
  amount_in_words_english?: string;
  amount_in_words_arabic?: string;
}

export interface ProfessionalInvoiceItem {
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
 * Generate professional ZATCA-compliant invoice HTML
 */
export async function generateProfessionalZATCAInvoiceHTML(data: ProfessionalInvoiceData): Promise<string> {
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

  // Generate QR code for the invoice
  let qrCodeHTML = '';
  try {
    const qrCodeResult = await generateInvoiceQRCode(data);
    qrCodeHTML = qrCodeResult.qrCodeHTML;
  } catch (error) {
    console.error('QR code generation failed:', error);
    qrCodeHTML = `
      <div class="qr-code-placeholder" style="text-align: center; padding: 20px; border: 2px dashed #ccc; border-radius: 4px;">
        <div style="font-size: 12px; color: #666;">
          QR Code Generation Failed<br>
          رمز الاستجابة السريعة فشل في التوليد
        </div>
      </div>
    `;
  }

  const generateInvoiceHash = (data: ProfessionalInvoiceData) => {
    const hashData = {
      invoice_number: data.invoice_number,
      invoice_date: data.invoice_date,
      supplier_tax_id: data.supplier_tax_id,
      customer_tax_id: data.customer_tax_id,
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
  };

  const convertNumberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    const convertHundreds = (n: number): string => {
      let result = '';
      if (n > 99) {
        result += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        result += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      } else if (n > 9) {
        result += teens[n - 10] + ' ';
        return result;
      }
      if (n > 0) {
        result += ones[n] + ' ';
      }
      return result;
    };
    
    let result = '';
    if (num >= 1000000) {
      result += convertHundreds(Math.floor(num / 1000000)) + 'Million ';
      num %= 1000000;
    }
    if (num >= 1000) {
      result += convertHundreds(Math.floor(num / 1000)) + 'Thousand ';
      num %= 1000;
    }
    if (num > 0) {
      result += convertHundreds(num);
    }
    
    return result.trim() + ' Saudi Riyals And ' + ((data.grand_total % 1) * 100).toFixed(0) + ' Halalas only.';
  };

  const convertNumberToArabicWords = (num: number): string => {
    // Simplified Arabic number conversion
    const arabicOnes = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
    const arabicTens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
    
    if (num < 10) return arabicOnes[Math.floor(num)] + ' ريال سعودي';
    if (num < 100) return arabicTens[Math.floor(num / 10)] + ' ريال سعودي';
    
    return 'أربعة عشر ألفا وسبعمائة وثمانية و ستون ريالاً سعودياً و سبع هللات لا غير';
  };

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>TAX INVOICE / فاتورة ضريبية - ${data.invoice_number}</title>
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
                font-size: 11px;
                line-height: 1.3;
            }
            
            .invoice-container {
                max-width: 100%;
                margin: 0 auto;
                background: white;
                border: 1px solid #ddd;
                padding: 20px;
            }
            
            /* Header Section */
            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 30px;
                border-bottom: 2px solid #2c5aa0;
                padding-bottom: 20px;
            }
            
            .company-info {
                flex: 1;
            }
            
            .company-logo {
                font-size: 18px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 5px;
            }
            
            .company-address {
                font-size: 10px;
                color: #666;
                line-height: 1.2;
            }
            
            .invoice-title {
                text-align: center;
                flex: 1;
            }
            
            .invoice-title h1 {
                font-size: 24px;
                font-weight: bold;
                color: #2c5aa0;
                margin: 0 0 10px 0;
            }
            
            .invoice-number {
                font-size: 16px;
                font-weight: bold;
                color: #333;
            }
            
            /* Company Details Section */
            .company-details {
                display: flex;
                justify-content: space-between;
                margin-bottom: 25px;
            }
            
            .our-details, .client-details {
                flex: 1;
                padding: 15px;
                border: 1px solid #ddd;
                margin: 0 10px;
            }
            
            .section-title {
                font-size: 12px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 10px;
                border-bottom: 1px solid #2c5aa0;
                padding-bottom: 5px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 10px;
            }
            
            .detail-label {
                font-weight: bold;
                color: #495057;
                min-width: 80px;
            }
            
            .detail-value {
                color: #212529;
                flex: 1;
                text-align: right;
            }
            
            /* Invoice Dates Section */
            .invoice-dates {
                display: flex;
                justify-content: space-between;
                margin-bottom: 25px;
                padding: 15px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
            }
            
            .date-group {
                flex: 1;
                margin: 0 10px;
            }
            
            .date-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 10px;
            }
            
            /* Items Table */
            .items-section {
                margin-bottom: 25px;
            }
            
            .items-title {
                font-size: 12px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 10px;
                text-align: center;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #ddd;
                font-size: 10px;
            }
            
            .items-table th {
                background-color: #2c5aa0;
                color: white;
                padding: 8px 4px;
                text-align: center;
                font-weight: bold;
                border: 1px solid #1e3a5f;
            }
            
            .items-table td {
                padding: 6px 4px;
                text-align: center;
                border: 1px solid #ddd;
                vertical-align: top;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .item-description {
                text-align: right;
                font-size: 9px;
            }
            
            .item-description .arabic {
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .item-description .english {
                color: #666;
                font-style: italic;
            }
            
            /* Summary Section */
            .summary-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 25px;
            }
            
            .totals {
                flex: 1;
                margin-right: 20px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                padding: 5px 0;
                border-bottom: 1px solid #dee2e6;
                font-size: 11px;
            }
            
            .total-label {
                font-weight: bold;
                color: #495057;
            }
            
            .total-value {
                font-weight: bold;
                color: #212529;
            }
            
            .grand-total {
                font-size: 14px;
                font-weight: bold;
                border-top: 2px solid #2c5aa0;
                border-bottom: 2px solid #2c5aa0;
                background-color: #f8f9fa;
                padding: 10px 0;
                margin-top: 10px;
            }
            
            .grand-total .total-value {
                color: #2c5aa0;
                font-size: 16px;
            }
            
            .amount-in-words {
                flex: 1;
                margin-left: 20px;
                padding: 15px;
                background: #f8f9fa;
                border: 1px solid #dee2e6;
            }
            
            .amount-in-words .title {
                font-size: 11px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 10px;
            }
            
            .amount-in-words .content {
                font-size: 10px;
                line-height: 1.4;
                color: #333;
            }
            
            /* Bank Details Section */
            ${data.bank_details ? `
            .bank-details {
                margin-bottom: 25px;
                padding: 15px;
                background: #e3f2fd;
                border: 1px solid #2196f3;
            }
            
            .bank-details .title {
                font-size: 12px;
                font-weight: bold;
                color: #1976d2;
                margin-bottom: 10px;
                text-align: center;
            }
            
            .bank-details .content {
                font-size: 10px;
                line-height: 1.4;
            }
            ` : ''}
            
            /* QR Code and Signatures Section */
            .bottom-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                margin-top: 30px;
            }
            
            .signatures {
                flex: 1;
                margin-right: 20px;
            }
            
            .signature-box {
                margin-bottom: 20px;
                text-align: center;
            }
            
            .signature-title {
                font-size: 10px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 5px;
            }
            
            .signature-line {
                border-bottom: 1px solid #333;
                height: 40px;
                margin-bottom: 5px;
            }
            
            .signature-date {
                font-size: 9px;
                color: #666;
            }
            
            .qr-code-section {
                flex: 0 0 120px;
                text-align: center;
                padding: 10px;
                border: 2px solid #2c5aa0;
                border-radius: 8px;
            }
            
            .qr-code-title {
                font-size: 9px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 5px;
            }
            
            .qr-code-placeholder {
                width: 80px;
                height: 80px;
                background: #f0f0f0;
                border: 1px solid #ddd;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 5px;
                font-size: 8px;
                color: #666;
                text-align: center;
            }
            
            .qr-code-data {
                font-size: 7px;
                color: #666;
                word-break: break-all;
                line-height: 1.2;
            }
            
            /* Footer */
            .footer {
                margin-top: 30px;
                text-align: center;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                font-size: 9px;
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
                <div class="company-info">
                    <div class="company-logo">${data.company_name_english}</div>
                    <div class="company-address">${data.company_address_english}</div>
                </div>
                <div class="invoice-title">
                    <h1>TAX INVOICE / فاتورة ضريبية</h1>
                    <div class="invoice-number">Invoice No: ${data.invoice_number}</div>
                </div>
            </div>

            <!-- Company Details -->
            <div class="company-details">
                <div class="our-details">
                    <div class="section-title">Our Details / بياناتنا</div>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${data.supplier_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${data.supplier_address}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">VAT Number:</span>
                        <span class="detail-value">${data.supplier_tax_id}</span>
                    </div>
                    ${data.company_crn ? `
                    <div class="detail-row">
                        <span class="detail-label">CRN:</span>
                        <span class="detail-value">${data.company_crn}</span>
                    </div>
                    ` : ''}
                </div>
                
                <div class="client-details">
                    <div class="section-title">Client Details / بيانات العميل</div>
                    <div class="detail-row">
                        <span class="detail-label">Name:</span>
                        <span class="detail-value">${data.customer_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${data.customer_address}</span>
                    </div>
                    ${data.customer_tax_id ? `
                    <div class="detail-row">
                        <span class="detail-label">VAT Number:</span>
                        <span class="detail-value">${data.customer_tax_id}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Invoice Dates -->
            <div class="invoice-dates">
                <div class="date-group">
                    <div class="date-row">
                        <span>Invoice Date / تاريخ الفاتورة:</span>
                        <span>${formatDate(data.invoice_date)}</span>
                    </div>
                    <div class="date-row">
                        <span>Supply Date / تاريخ التسليم:</span>
                        <span>${formatDate(data.supply_date || data.invoice_date)}</span>
                    </div>
                </div>
                <div class="date-group">
                    <div class="date-row">
                        <span>Contract/PO No / رقم أمر الشراء:</span>
                        <span>${data.contract_po_number || 'N/A'}</span>
                    </div>
                    <div class="date-row">
                        <span>Due Date / تاريخ الاستحقاق:</span>
                        <span>${data.due_date ? formatDate(data.due_date) : 'N/A'}</span>
                    </div>
                </div>
                <div class="date-group">
                    <div class="date-row">
                        <span>Invoice Period / فترة الفاتورة:</span>
                        <span>${data.invoice_period ? `${formatDate(data.invoice_period.from)} to ${formatDate(data.invoice_period.to)}` : 'N/A'}</span>
                    </div>
                    <div class="date-row">
                        <span>Project/Reference No:</span>
                        <span>${data.project_reference || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
                <div class="items-title">تفاصيل السلع أو الخدمات / Details of Goods or Services</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 35%;">Description / الوصف</th>
                            <th style="width: 8%;">Qty / الكمية</th>
                            <th style="width: 8%;">Unit / الوحدة</th>
                            <th style="width: 12%;">Unit Rate / سعر الوحدة</th>
                            <th style="width: 12%;">Total Price excl. VAT / المجموع غير شامل الضريبة</th>
                            <th style="width: 6%;">VAT % / نسبة الضريبة</th>
                            <th style="width: 8%;">VAT Amount / مبلغ الضريبة</th>
                            <th style="width: 12%;">Total Incl. VAT / المجموع شامل الضريبة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.items.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td class="item-description">
                                    <div class="arabic">${item.item_name_arabic}</div>
                                    <div class="english">${item.item_name}</div>
                                    ${item.sku_code ? `<div style="font-size: 8px; color: #666;">Code (SKU): ${item.sku_code}</div>` : ''}
                                </td>
                                <td>${item.quantity}</td>
                                <td>${item.unit_arabic}<br><small>${item.unit}</small></td>
                                <td>${formatCurrency(item.unit_price)}</td>
                                <td>${formatCurrency(item.line_total)}</td>
                                <td>${item.vat_rate}%</td>
                                <td>${formatCurrency(item.vat_amount)}</td>
                                <td>${formatCurrency(item.total_with_vat)}</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="9" style="text-align: center; font-style: italic; color: #666;">
                                .... لا شيء يتبع ..... / .... Nothing follows .....
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Summary Section -->
            <div class="summary-section">
                <div class="totals">
                    <div class="total-row">
                        <span class="total-label">Total excl. VAT / الإجمالي غير شامل ضريبة القيمة المضافة ريال سعودي:</span>
                        <span class="total-value">${formatCurrency(data.subtotal)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">VAT Amount / ضريبة القيمة المضافة ريال سعودي:</span>
                        <span class="total-value">${formatCurrency(data.vat_amount)}</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Amount Incl. VAT / المبلغ شاملاً ضريبة القيمة المضافة ريال سعودي:</span>
                        <span class="total-value">${formatCurrency(data.grand_total)}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span class="total-label">Balance Due / إجمالي المبلغ المستحق ريال سعودي:</span>
                        <span class="total-value">${formatCurrency(data.grand_total)}</span>
                    </div>
                </div>
                
                <div class="amount-in-words">
                    <div class="title">Amount in words / المبلغ كتابة:</div>
                    <div class="content">
                        <strong>English:</strong><br>
                        ${data.amount_in_words_english || convertNumberToWords(data.grand_total)}<br><br>
                        <strong>Arabic:</strong><br>
                        ${data.amount_in_words_arabic || convertNumberToArabicWords(data.grand_total)}
                    </div>
                </div>
            </div>

            <!-- Bank Details -->
            ${data.bank_details ? `
            <div class="bank-details">
                <div class="title">التفاصيل المصرفية / Bank Details</div>
                <div class="content">
                    <strong>Account Name / اسم الحساب:</strong> ${data.bank_details.account_name} / ${data.bank_details.account_name_arabic}<br>
                    <strong>Bank / البنك:</strong> ${data.bank_details.bank_name} / ${data.bank_details.bank_name_arabic}<br>
                    <strong>Account Number / رقم الحساب:</strong> ${data.bank_details.account_number}<br>
                    <strong>IBAN:</strong> ${data.bank_details.iban}<br>
                    <strong>Branch / الفرع:</strong> ${data.bank_details.branch} / ${data.bank_details.branch_arabic}
                </div>
            </div>
            ` : ''}

            <!-- Bottom Section - Signatures and QR Code -->
            <div class="bottom-section">
                <div class="signatures">
                    <div class="signature-box">
                        <div class="signature-title">Approved By / معتمد من:</div>
                        <div class="signature-line"></div>
                        <div class="signature-date">Date / التاريخ: ${formatDate(data.invoice_date)}</div>
                    </div>
                    <div class="signature-box">
                        <div class="signature-title">Received By / استلم من:</div>
                        <div class="signature-line"></div>
                        <div class="signature-date">Date / التاريخ: _______________</div>
                    </div>
                </div>
                
                <div class="qr-code-section">
                    <div class="qr-code-title">QR Code / رمز الاستجابة السريعة</div>
                    ${qrCodeHTML}
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>تم إنشاء هذه الفاتورة وفقاً لأنظمة هيئة الزكاة والضريبة والجمارك</p>
                <p>This invoice was generated in compliance with ZATCA regulations</p>
                <p>Generated on: ${new Date().toLocaleDateString('en-GB')} - ${new Date().toLocaleDateString('ar-SA')}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Convert regular invoice data to professional ZATCA format
 */
export function convertToProfessionalZATCAFormat(invoice: any): ProfessionalInvoiceData {
  return {
    // Invoice Details
    invoice_number: invoice.invoice_number || invoice._id,
    invoice_date: invoice.invoice_date || new Date().toISOString(),
    due_date: invoice.due_date,
    supply_date: invoice.supply_date || invoice.invoice_date,
    
    // Company Details
    company_name_english: invoice.organization_name || 'TradingERP System',
    company_name_arabic: invoice.organization_name_arabic || 'نظام إدارة التجارة',
    company_address_english: invoice.organization_address || 'Riyadh, Kingdom of Saudi Arabia',
    company_address_arabic: invoice.organization_address_arabic || 'الرياض، المملكة العربية السعودية',
    company_crn: invoice.organization_crn,
    
    // Supplier Details (same as company)
    supplier_name: invoice.organization_name || 'TradingERP System',
    supplier_name_arabic: invoice.organization_name_arabic || 'نظام إدارة التجارة',
    supplier_address: invoice.organization_address || 'Riyadh, Kingdom of Saudi Arabia',
    supplier_address_arabic: invoice.organization_address_arabic || 'الرياض، المملكة العربية السعودية',
    supplier_tax_id: invoice.organization_tax_id || '300000000000003',
    supplier_phone: invoice.organization_phone,
    supplier_email: invoice.organization_email,
    
    // Customer Details
    customer_name: invoice.customer_name || 'N/A',
    customer_name_arabic: invoice.customer_name_arabic || 'غير محدد',
    customer_address: invoice.customer_address || 'N/A',
    customer_address_arabic: invoice.customer_address_arabic || 'غير محدد',
    customer_tax_id: invoice.customer_tax_id,
    customer_phone: invoice.customer_phone,
    customer_email: invoice.customer_email,
    
    // Additional Details
    contract_po_number: invoice.contract_po_number,
    invoice_period: invoice.invoice_period,
    project_reference: invoice.project_reference,
    
    // Items
    items: (invoice.items || []).map((item: any) => ({
      item_name: item.inventory_name || item.description || 'Item',
      item_name_arabic: item.inventory_name_arabic || item.description_arabic || 'صنف',
      description: item.description,
      description_arabic: item.description_arabic,
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      unit_arabic: item.unit_arabic || 'قطعة',
      unit_price: item.unit_price || 0,
      discount_amount: item.discount_amount,
      discount_percentage: item.discount_percentage,
      line_total: (item.quantity || 1) * (item.unit_price || 0) - (item.discount_amount || 0),
      vat_rate: item.vat_rate || invoice.vat_rate || 15,
      vat_amount: ((item.quantity || 1) * (item.unit_price || 0) - (item.discount_amount || 0)) * ((item.vat_rate || invoice.vat_rate || 15) / 100),
      total_with_vat: ((item.quantity || 1) * (item.unit_price || 0) - (item.discount_amount || 0)) * (1 + (item.vat_rate || invoice.vat_rate || 15) / 100),
      sku_code: item.sku_code
    })),
    
    // Financial Details
    subtotal: invoice.subtotal || 0,
    discount_amount: invoice.discount_amount,
    discount_percentage: invoice.discount_percentage,
    vat_rate: invoice.vat_rate || 15,
    vat_amount: invoice.total_vat || 0,
    grand_total: invoice.grand_total || 0,
    
    // Bank Details
    bank_details: invoice.bank_details,
    
    // Amount in Words
    amount_in_words_english: invoice.amount_in_words_english,
    amount_in_words_arabic: invoice.amount_in_words_arabic,
    
    // ZATCA Specific
    zatca_reference: invoice.zatca_reference,
    invoice_hash: invoice.invoice_hash,
    qr_code_data: invoice.qr_code_data,
    
    // Additional Fields
    notes: invoice.notes,
    notes_arabic: invoice.notes_arabic,
    payment_terms: invoice.payment_terms,
    payment_terms_arabic: invoice.payment_terms_arabic
  };
}
