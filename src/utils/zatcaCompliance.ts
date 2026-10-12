/**
 * ZATCA Compliance Utilities
 * Based on ZATCA VAT Regulations - Article 53
 */

export interface ZATCAInvoiceData {
  // Invoice Details
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  supply_date?: string;
  
  // Supplier Details
  supplier_name: string;
  supplier_name_arabic: string;
  supplier_address: string;
  supplier_address_arabic: string;
  supplier_tax_id: string;
  supplier_phone?: string;
  supplier_email?: string;
  
  // Customer Details
  customer_name: string;
  customer_name_arabic: string;
  customer_address: string;
  customer_address_arabic: string;
  customer_tax_id?: string;
  customer_phone?: string;
  customer_email?: string;
  
  // Items
  items: ZATCAInvoiceItem[];
  
  // Financial Details
  subtotal: number;
  discount_amount?: number;
  discount_percentage?: number;
  vat_rate: number;
  vat_amount: number;
  grand_total: number;
  
  // ZATCA Specific
  zatca_reference?: string;
  invoice_hash?: string;
  qr_code_data?: string;
  
  // Additional Fields
  notes?: string;
  notes_arabic?: string;
  payment_terms?: string;
  payment_terms_arabic?: string;
}

export interface ZATCAInvoiceItem {
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
}

/**
 * Generate ZATCA-compliant invoice HTML
 */
export function generateZATCAInvoiceHTML(data: ZATCAInvoiceData): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('ar-SA');
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
        <title>فاتورة ضريبية / Tax Invoice - ${data.invoice_number}</title>
        <style>
            @page {
                size: A4;
                margin: 20mm;
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
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 3px solid #2c5aa0;
                padding-bottom: 20px;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: bold;
                color: #2c5aa0;
                margin: 0 0 10px 0;
            }
            
            .header h2 {
                font-size: 18px;
                color: #666;
                margin: 0;
            }
            
            .invoice-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 20px;
                border: 1px solid #dee2e6;
            }
            
            .bilingual-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
            }
            
            .arabic-section {
                flex: 1;
                text-align: right;
                padding-right: 20px;
            }
            
            .english-section {
                flex: 1;
                text-align: left;
                padding-left: 20px;
                border-left: 1px solid #dee2e6;
            }
            
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #2c5aa0;
                margin-bottom: 15px;
                border-bottom: 2px solid #2c5aa0;
                padding-bottom: 5px;
            }
            
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                padding: 5px 0;
            }
            
            .detail-label {
                font-weight: bold;
                color: #495057;
            }
            
            .detail-value {
                color: #212529;
            }
            
            .items-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                background: white;
                border: 1px solid #dee2e6;
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
                border: 1px solid #dee2e6;
                vertical-align: top;
            }
            
            .items-table tr:nth-child(even) {
                background-color: #f8f9fa;
            }
            
            .totals-section {
                margin-top: 30px;
                text-align: left;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                padding: 8px 0;
                border-bottom: 1px solid #dee2e6;
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
                font-size: 16px;
                font-weight: bold;
                border-top: 3px solid #2c5aa0;
                border-bottom: 3px solid #2c5aa0;
                background-color: #f8f9fa;
                padding: 15px 0;
                margin-top: 15px;
            }
            
            .grand-total .total-value {
                color: #2c5aa0;
                font-size: 18px;
            }
            
            .footer {
                margin-top: 40px;
                text-align: center;
                padding-top: 20px;
                border-top: 2px solid #dee2e6;
                font-size: 11px;
                color: #6c757d;
            }
            
            .zatca-info {
                background: #e3f2fd;
                border: 1px solid #2196f3;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
            }
            
            .zatca-title {
                font-weight: bold;
                color: #1976d2;
                margin-bottom: 10px;
            }
            
            .qr-code {
                text-align: center;
                margin: 20px 0;
                padding: 20px;
                border: 2px dashed #2c5aa0;
                border-radius: 8px;
            }
            
            .vat-breakdown {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
            }
            
            .vat-title {
                font-weight: bold;
                color: #856404;
                margin-bottom: 10px;
            }
            
            @media print {
                body { margin: 0; }
                .invoice-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <h1>فاتورة ضريبية / Tax Invoice</h1>
                <h2>نظام إدارة التجارة / Trading Management System</h2>
            </div>

            <!-- Invoice Details -->
            <div class="invoice-details">
                <div class="bilingual-section">
                    <div class="arabic-section">
                        <div class="section-title">تفاصيل الفاتورة</div>
                        <div class="detail-row">
                            <span class="detail-label">رقم الفاتورة:</span>
                            <span class="detail-value">${data.invoice_number}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">تاريخ الفاتورة:</span>
                            <span class="detail-value">${formatDate(data.invoice_date)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">تاريخ التوريد:</span>
                            <span class="detail-value">${formatDate(data.supply_date || data.invoice_date)}</span>
                        </div>
                        ${data.due_date ? `
                        <div class="detail-row">
                            <span class="detail-label">تاريخ الاستحقاق:</span>
                            <span class="detail-value">${formatDate(data.due_date)}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="english-section">
                        <div class="section-title">Invoice Details</div>
                        <div class="detail-row">
                            <span class="detail-label">Invoice Number:</span>
                            <span class="detail-value">${data.invoice_number}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Invoice Date:</span>
                            <span class="detail-value">${formatDate(data.invoice_date)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Supply Date:</span>
                            <span class="detail-value">${formatDate(data.supply_date || data.invoice_date)}</span>
                        </div>
                        ${data.due_date ? `
                        <div class="detail-row">
                            <span class="detail-label">Due Date:</span>
                            <span class="detail-value">${formatDate(data.due_date)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Supplier Details -->
            <div class="invoice-details">
                <div class="bilingual-section">
                    <div class="arabic-section">
                        <div class="section-title">بيانات المورد</div>
                        <div class="detail-row">
                            <span class="detail-label">اسم المورد:</span>
                            <span class="detail-value">${data.supplier_name_arabic}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">الرقم الضريبي:</span>
                            <span class="detail-value">${data.supplier_tax_id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">العنوان:</span>
                            <span class="detail-value">${data.supplier_address_arabic}</span>
                        </div>
                        ${data.supplier_phone ? `
                        <div class="detail-row">
                            <span class="detail-label">الهاتف:</span>
                            <span class="detail-value">${data.supplier_phone}</span>
                        </div>
                        ` : ''}
                        ${data.supplier_email ? `
                        <div class="detail-row">
                            <span class="detail-label">البريد الإلكتروني:</span>
                            <span class="detail-value">${data.supplier_email}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="english-section">
                        <div class="section-title">Supplier Details</div>
                        <div class="detail-row">
                            <span class="detail-label">Supplier Name:</span>
                            <span class="detail-value">${data.supplier_name}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Tax ID:</span>
                            <span class="detail-value">${data.supplier_tax_id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${data.supplier_address}</span>
                        </div>
                        ${data.supplier_phone ? `
                        <div class="detail-row">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${data.supplier_phone}</span>
                        </div>
                        ` : ''}
                        ${data.supplier_email ? `
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${data.supplier_email}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Customer Details -->
            <div class="invoice-details">
                <div class="bilingual-section">
                    <div class="arabic-section">
                        <div class="section-title">بيانات العميل</div>
                        <div class="detail-row">
                            <span class="detail-label">اسم العميل:</span>
                            <span class="detail-value">${data.customer_name_arabic}</span>
                        </div>
                        ${data.customer_tax_id ? `
                        <div class="detail-row">
                            <span class="detail-label">الرقم الضريبي:</span>
                            <span class="detail-value">${data.customer_tax_id}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <span class="detail-label">العنوان:</span>
                            <span class="detail-value">${data.customer_address_arabic}</span>
                        </div>
                        ${data.customer_phone ? `
                        <div class="detail-row">
                            <span class="detail-label">الهاتف:</span>
                            <span class="detail-value">${data.customer_phone}</span>
                        </div>
                        ` : ''}
                        ${data.customer_email ? `
                        <div class="detail-row">
                            <span class="detail-label">البريد الإلكتروني:</span>
                            <span class="detail-value">${data.customer_email}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="english-section">
                        <div class="section-title">Customer Details</div>
                        <div class="detail-row">
                            <span class="detail-label">Customer Name:</span>
                            <span class="detail-value">${data.customer_name}</span>
                        </div>
                        ${data.customer_tax_id ? `
                        <div class="detail-row">
                            <span class="detail-label">Tax ID:</span>
                            <span class="detail-value">${data.customer_tax_id}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${data.customer_address}</span>
                        </div>
                        ${data.customer_phone ? `
                        <div class="detail-row">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${data.customer_phone}</span>
                        </div>
                        ` : ''}
                        ${data.customer_email ? `
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${data.customer_email}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Items Table -->
            <div class="section-title">تفاصيل الأصناف / Items Details</div>
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 30%;">الوصف / Description</th>
                        <th style="width: 10%;">الكمية / Quantity</th>
                        <th style="width: 10%;">الوحدة / Unit</th>
                        <th style="width: 15%;">سعر الوحدة / Unit Price</th>
                        <th style="width: 10%;">الخصم / Discount</th>
                        <th style="width: 15%;">المجموع / Total</th>
                        <th style="width: 10%;">الضريبة / VAT</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item, index) => `
                        <tr>
                            <td style="text-align: right;">
                                <strong>${item.item_name_arabic}</strong><br>
                                <small>${item.item_name}</small>
                                ${item.description_arabic ? `<br><small>${item.description_arabic}</small>` : ''}
                                ${item.description ? `<br><small>${item.description}</small>` : ''}
                            </td>
                            <td>${item.quantity}</td>
                            <td>${item.unit_arabic}<br><small>${item.unit}</small></td>
                            <td>${formatCurrency(item.unit_price)} \uE900</td>
                            <td>
                                ${item.discount_amount ? `${formatCurrency(item.discount_amount)} \uE900` : ''}
                                ${item.discount_percentage ? `${item.discount_percentage}%` : ''}
                            </td>
                            <td>${formatCurrency(item.line_total)} \uE900</td>
                            <td>
                                ${formatCurrency(item.vat_amount)} \uE900<br>
                                <small>(${item.vat_rate}%)</small>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- VAT Breakdown -->
            <div class="vat-breakdown">
                <div class="vat-title">تفاصيل ضريبة القيمة المضافة / VAT Breakdown</div>
                <div class="detail-row">
                    <span class="detail-label">المجموع الفرعي / Subtotal:</span>
                    <span class="detail-value">${formatCurrency(data.subtotal)} \uE900</span>
                </div>
                ${data.discount_amount ? `
                <div class="detail-row">
                    <span class="detail-label">الخصم / Discount:</span>
                    <span class="detail-value">-${formatCurrency(data.discount_amount)} \uE900</span>
                </div>
                ` : ''}
                <div class="detail-row">
                    <span class="detail-label">ضريبة القيمة المضافة (${data.vat_rate}%) / VAT:</span>
                    <span class="detail-value">${formatCurrency(data.vat_amount)} \uE900</span>
                </div>
            </div>

            <!-- Totals -->
            <div class="totals-section">
                <div class="total-row">
                    <span class="total-label">المجموع الفرعي / Subtotal:</span>
                    <span class="total-value">${formatCurrency(data.subtotal)} \uE900</span>
                </div>
                ${data.discount_amount ? `
                <div class="total-row">
                    <span class="total-label">الخصم / Discount:</span>
                    <span class="total-value">-${formatCurrency(data.discount_amount)} \uE900</span>
                </div>
                ` : ''}
                <div class="total-row">
                    <span class="total-label">ضريبة القيمة المضافة (${data.vat_rate}%) / VAT:</span>
                    <span class="total-value">${formatCurrency(data.vat_amount)} \uE900</span>
                </div>
                <div class="total-row grand-total">
                    <span class="total-label">المجموع الكلي / Grand Total:</span>
                    <span class="total-value">${formatCurrency(data.grand_total)} \uE900</span>
                </div>
            </div>

            <!-- ZATCA Information -->
            ${data.zatca_reference ? `
            <div class="zatca-info">
                <div class="zatca-title">معلومات هيئة الزكاة والضريبة والجمارك / ZATCA Information</div>
                <div class="detail-row">
                    <span class="detail-label">الرقم المرجعي / Reference Number:</span>
                    <span class="detail-value">${data.zatca_reference}</span>
                </div>
                ${data.invoice_hash ? `
                <div class="detail-row">
                    <span class="detail-label">البصمة الرقمية / Digital Hash:</span>
                    <span class="detail-value">${data.invoice_hash}</span>
                </div>
                ` : ''}
            </div>
            ` : ''}

            <!-- QR Code Placeholder -->
            ${data.qr_code_data ? `
            <div class="qr-code">
                <div class="zatca-title">رمز الاستجابة السريعة / QR Code</div>
                <div style="font-family: monospace; font-size: 10px; word-break: break-all;">
                    ${data.qr_code_data}
                </div>
            </div>
            ` : ''}

            <!-- Payment Terms -->
            ${data.payment_terms ? `
            <div class="invoice-details">
                <div class="bilingual-section">
                    <div class="arabic-section">
                        <div class="section-title">شروط الدفع</div>
                        <div class="detail-value">${data.payment_terms_arabic || data.payment_terms}</div>
                    </div>
                    <div class="english-section">
                        <div class="section-title">Payment Terms</div>
                        <div class="detail-value">${data.payment_terms}</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Notes -->
            ${data.notes ? `
            <div class="invoice-details">
                <div class="bilingual-section">
                    <div class="arabic-section">
                        <div class="section-title">ملاحظات</div>
                        <div class="detail-value">${data.notes_arabic || data.notes}</div>
                    </div>
                    <div class="english-section">
                        <div class="section-title">Notes</div>
                        <div class="detail-value">${data.notes}</div>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
                <p>تم إنشاء هذه الفاتورة وفقاً لأنظمة هيئة الزكاة والضريبة والجمارك</p>
                <p>This invoice was generated in compliance with ZATCA regulations</p>
                <p>تاريخ الإنشاء / Generated on: ${new Date().toLocaleDateString('ar-SA')} - ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Generate QR Code data for ZATCA compliance
 */
export function generateZATCAQRCodeData(data: ZATCAInvoiceData): string {
  const qrData = {
    seller_name: data.supplier_name,
    seller_tax_id: data.supplier_tax_id,
    invoice_date: data.invoice_date,
    invoice_total: data.grand_total,
    vat_total: data.vat_amount,
    invoice_hash: data.invoice_hash || generateInvoiceHash(data)
  };
  
  return JSON.stringify(qrData);
}

/**
 * Generate invoice hash for ZATCA compliance
 */
export function generateInvoiceHash(data: ZATCAInvoiceData): string {
  const hashData = {
    invoice_number: data.invoice_number,
    invoice_date: data.invoice_date,
    supplier_tax_id: data.supplier_tax_id,
    customer_tax_id: data.customer_tax_id,
    grand_total: data.grand_total,
    vat_amount: data.vat_amount
  };
  
  // Simple hash generation (in production, use proper cryptographic hash)
  const hashString = JSON.stringify(hashData);
  let hash = 0;
  for (let i = 0; i < hashString.length; i++) {
    const char = hashString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16).toUpperCase();
}

/**
 * Convert regular invoice data to ZATCA-compliant format
 */
export function convertToZATCAFormat(invoice: any): ZATCAInvoiceData {
  return {
    // Invoice Details
    invoice_number: invoice.invoice_number || invoice._id,
    invoice_date: invoice.invoice_date || new Date().toISOString(),
    due_date: invoice.due_date,
    supply_date: invoice.supply_date || invoice.invoice_date,
    
    // Supplier Details (Organization)
    supplier_name: invoice.organization_name || 'TradingERP System',
    supplier_name_arabic: invoice.organization_name_arabic || 'نظام إدارة التجارة',
    supplier_address: invoice.organization_address || 'Riyadh, Saudi Arabia',
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
      total_with_vat: ((item.quantity || 1) * (item.unit_price || 0) - (item.discount_amount || 0)) * (1 + (item.vat_rate || invoice.vat_rate || 15) / 100)
    })),
    
    // Financial Details
    subtotal: invoice.subtotal || 0,
    discount_amount: invoice.discount_amount,
    discount_percentage: invoice.discount_percentage,
    vat_rate: invoice.vat_rate || 15,
    vat_amount: invoice.total_vat || 0,
    grand_total: invoice.grand_total || 0,
    
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
