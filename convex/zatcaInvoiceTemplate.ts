/**
 * Generate ZATCA-compliant invoice HTML template
 * Based on the official ZATCA Phase 2 format requirements
 */

export function generateZATCACompliantInvoiceHTML(data: {
  invoice: any;
  items: any[];
  organization: any;
  customer?: any;
  invoice_id: string;
  calculatedSubtotal: number;
  calculatedVat: number;
  calculatedGrandTotal: number;
}): string {
  const { invoice, items, organization, customer, invoice_id, calculatedSubtotal, calculatedVat, calculatedGrandTotal } = data;

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Invoice - ${invoice.invoice_number}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        .invoice-container {
            max-width: 95%;
            margin: 0 auto;
            transform: scale(0.9);
            transform-origin: top center;
        }
        
        /* Header Section - Keep existing design */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .header-left {
            flex: 1;
            text-align: left;
        }
        
        .header-center {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 20px;
        }
        
        .header-right {
            flex: 1;
            text-align: right;
        }
        
        .company-logo {
            width: 120px;
            height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            overflow: hidden;
            margin-right: 20px;
        }
        
        .company-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .company-logo-fallback {
            width: 100%;
            height: 100%;
            background: #2f704a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-address {
            font-size: 11px;
            line-height: 1.3;
        }
        
        /* Invoice Title */
        .invoice-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            border: 2px solid #333;
            padding: 8px;
            background: #f5f5f5;
        }
        
        /* ZATCA Format - Seller and Buyer Details */
        .zatca-details-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .seller-details, .buyer-details {
            border: 1px solid #333;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .details-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
            text-align: center;
        }
        
        .details-title.arabic {
            direction: rtl;
            text-align: center;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
        }
        
        .detail-label {
            font-weight: bold;
            min-width: 120px;
        }
        
        .detail-value {
            text-align: right;
            flex: 1;
        }
        
        /* Invoice Information Table */
        .invoice-info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        
        .invoice-info-table th,
        .invoice-info-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        
        .invoice-info-table th {
            background: #f0f0f0;
            font-weight: bold;
            width: 25%;
        }
        
        .invoice-info-table td {
            width: 25%;
        }
        
        /* Line Items Table - ZATCA Format */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: 6px;
            text-align: center;
            vertical-align: top;
        }
        
        .items-table th {
            background: #f0f0f0;
            font-weight: bold;
        }
        
        .items-table .item-description {
            text-align: left;
            max-width: 200px;
        }
        
        .items-table .amount {
            text-align: right;
        }
        
        /* Financial Summary - Right Side */
        .financial-summary {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .amount-in-words {
            border: 1px solid #333;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .amount-in-words h4 {
            margin: 0 0 10px 0;
            font-size: 12px;
            font-weight: bold;
        }
        
        .amount-in-words p {
            margin: 5px 0;
            font-size: 11px;
            line-height: 1.4;
        }
        
        .totals-section {
            border: 1px solid #333;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .totals-section h4 {
            margin: 0 0 10px 0;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
        }
        
        .total-row.final {
            font-weight: bold;
            font-size: 12px;
            border-top: 2px solid #333;
            padding-top: 8px;
            margin-top: 10px;
        }
        
        
        .bank-details h4 {
            margin: 0 0 10px 0;
            font-size: 12px;
            font-weight: bold;
            text-align: center;
        }
        
        .bank-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 10px;
        }
        
        /* Bank Details and QR Code Table */
        .bank-qr-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }
        
        .bank-qr-table th,
        .bank-qr-table td {
            border: 1px solid #333;
            padding: 8px;
            vertical-align: top;
        }
        
        .bank-qr-table th {
            background: #f0f0f0;
            font-weight: bold;
            width: 20%;
        }
        
        .bank-qr-table td {
            width: 30%;
        }
        
        .qr-cell {
            text-align: center;
            background: white;
            vertical-align: middle;
            height: auto;
        }
        
        .qr-placeholder {
            width: 100px;
            height: 100px;
            border: 2px solid #333;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 6px auto;
            background-color: #ffffff;
            overflow: hidden;
            padding: 3px;
        }
        
        .qr-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .qr-fallback {
            text-align: center;
            font-size: 8px;
            line-height: 1.1;
            color: #333;
            font-weight: bold;
        }
        
        .qr-title {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .qr-data {
            margin: 2px 0;
        }
        
        .qr-line {
            margin: 1px 0;
            font-size: 7px;
        }
        
        .qr-uuid {
            font-size: 8px;
            color: #666;
            margin-top: 5px;
        }
        
        /* Footer */
        .footer-note {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 20px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .invoice-container { max-width: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header Section - Keep existing design -->
        <div class="header">
            <div class="header-left">
                <div class="company-info">
                    <div class="company-name">${organization.name}</div>
                    <div class="company-address">
                        ${organization.address}<br>
                        ${organization.city || 'Riyadh'}, Kingdom of Saudi Arabia<br>
                        VAT: ${organization.vat_number} | CR Number: ${organization.cr_number || 'N/A'}
                    </div>
                </div>
            </div>
            <div class="header-center">
                <div class="company-logo">
                    ${organization.logo_url ? 
                        `<img src="${organization.logo_url}" alt="${organization.name} Logo" style="width: 100%; height: 100%; object-fit: contain;" onerror="console.log('Logo failed to load:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';" onload="console.log('Logo loaded successfully:', this.src);" />
                         <div class="company-logo-fallback" style="display: none;">${organization.name.substring(0, 2).toUpperCase()}</div>` : 
                        `<div class="company-logo-fallback">${organization.name.substring(0, 2).toUpperCase()}</div>`
                    }
                </div>
            </div>
            <div class="header-right">
                <div class="company-info">
                    <div class="company-name" style="font-size: 18px; margin-bottom: 5px;">${organization.name_arabic || 'شركة رواسي للمقاولات والتجارة'}</div>
                    <div class="company-address" style="font-size: 11px; line-height: 1.3;">
                        ${organization.address_arabic || 'الرياض، المملكة العربية السعودية'}<br>
                        ${organization.city_arabic || 'الرياض'}, المملكة العربية السعودية<br>
                        ضريبة القيمة المضافة: ${organization.vat_number} | رقم السجل التجاري: ${organization.cr_number || 'غير محدد'}
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoice Title -->
        <div class="invoice-title">
            TAX INVOICE / فاتورة ضريبية
        </div>

        <!-- ZATCA Format - Seller and Buyer Details -->
        <div class="zatca-details-section">
            <div class="seller-details">
                <div class="details-title">Seller Details / تفاصيل المورد</div>
                <div class="details-title arabic">تفاصيل المورد</div>
                <div class="detail-row">
                    <span class="detail-label">Name / الاسم:</span>
                    <span class="detail-value">${organization.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Street Name / اسم الشارع:</span>
                    <span class="detail-value">${organization.street || organization.address || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Building No / رقم المبنى:</span>
                    <span class="detail-value">${organization.building_number || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">City / المدينة:</span>
                    <span class="detail-value">${organization.city || 'Riyadh'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Addl. No / الرقم الإضافي:</span>
                    <span class="detail-value">${organization.additional_number || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">District / الحي:</span>
                    <span class="detail-value">${organization.district || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Postal Code / الرمز البريدي:</span>
                    <span class="detail-value">${organization.zip_postal_code || organization.postal_code || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Country / البلد:</span>
                    <span class="detail-value">Saudi Arabia / المملكة العربية السعودية</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">VAT Number / الرقم الضريبي:</span>
                    <span class="detail-value">${organization.vat_number || '300000000000003'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">CR Number / رقم السجل التجاري:</span>
                    <span class="detail-value">${organization.cr_number || 'N/A'}</span>
                </div>
            </div>
            
            <div class="buyer-details">
                <div class="details-title">Buyer Details / تفاصيل شركة العميل</div>
                <div class="details-title arabic">تفاصيل شركة العميل</div>
                <div class="detail-row">
                    <span class="detail-label">Name / الاسم:</span>
                    <span class="detail-value">${customer?.customer_company_name || invoice.customer_name || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Street Name / اسم الشارع:</span>
                    <span class="detail-value">${customer?.street || invoice.customer_address || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Building No / رقم المبنى:</span>
                    <span class="detail-value">${customer?.building_number || invoice.customer_building_number || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">City / المدينة:</span>
                    <span class="detail-value">${customer?.city || invoice.customer_city || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Addl. No / الرقم الإضافي:</span>
                    <span class="detail-value">${customer?.additional_number || invoice.customer_additional_number || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">District / الحي:</span>
                    <span class="detail-value">${customer?.district || invoice.customer_district || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Postal Code / الرمز البريدي:</span>
                    <span class="detail-value">${customer?.zip_postal_code || invoice.customer_postal_code || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Country / البلد:</span>
                    <span class="detail-value">Saudi Arabia / المملكة العربية السعودية</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">VAT Number / الرقم الضريبي:</span>
                    <span class="detail-value">${customer?.vat_number || invoice.customer_vat_number || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">CR Number / رقم السجل التجاري:</span>
                    <span class="detail-value">${customer?.cr_number || invoice.customer_crn || 'N/A'}</span>
                </div>
            </div>
        </div>

        <!-- Invoice Information Table -->
        <table class="invoice-info-table">
            <tr>
                <th>Invoice Date / تاريخ الفاتورة</th>
                <td>${formatDate(invoice.invoice_date)}</td>
                <th>Supply Date / تاريخ التسليم</th>
                <td>${formatDate(invoice.supply_date || invoice.invoice_date)}</td>
            </tr>
            <tr>
                <th>Contract/PO No / رقم أمر الشراء</th>
                <td>${invoice.contract_number || 'N/A'}</td>
                <th>Due Date / تاريخ الاستحقاق</th>
                <td>${formatDate(invoice.due_date)}</td>
            </tr>
            <tr>
                <th>Invoice Period / فترة الفاتورة</th>
                <td>${invoice.invoice_period || 'N/A'}</td>
                <th>Project / Reference No / رقم المرجع</th>
                <td>${invoice.project_reference || 'N/A'}</td>
            </tr>
            <tr>
                <th>Payment Terms / شروط الدفع</th>
                <td>${customer?.payment_terms || invoice.payment_terms || 'N/A'}</td>
                <th>Delivery Reference / رقم مرجع التسليم</th>
                <td>${invoice.source_delivery_note_number || 'N/A'}</td>
            </tr>
        </table>

        <!-- Line Items Table - ZATCA Format -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Code (SKU) / الرمز</th>
                    <th>Nature of goods or service / تفاصيل السلع أو الخدمات</th>
                    <th>Qty / الكمية</th>
                    <th>Unit / وحدة</th>
                    <th>Unit Price (SAR) / سعر الوحدة (ريال سعودي)</th>
                    <th>Discount (SAR) / الخصومات (ريال سعودي)</th>
                    <th>Taxable Amount (SAR) / سعر الوحدة الخاضع للضريبة (ريال سعودي)</th>
                    <th>Tax Rate % / نسبة الضريبة</th>
                    <th>Tax Amount (SAR) / مبلغ الضريبة (ريال سعودي)</th>
                    <th>Total with Tax (SAR) / الإجمالي (ريال سعودي)</th>
                </tr>
            </thead>
            <tbody>
                ${items && items.length > 0 ? items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.sku || 'N/A'}</td>
                    <td class="item-description">${item.description || 'No description'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>${item.unit || 'Each'}</td>
                    <td class="amount">${(item.unit_price || 0).toFixed(2)} \uFDFC</td>
                    <td class="amount">${(item.discount_amount || 0).toFixed(2)} \uFDFC</td>
                    <td class="amount">${((item.unit_price || 0) * (item.quantity || 0) - (item.discount_amount || 0)).toFixed(2)} \uFDFC</td>
                    <td>${item.vat_rate || 15}%</td>
                    <td class="amount">${(item.vat_amount || 0).toFixed(2)} \uFDFC</td>
                    <td class="amount">${(item.total_amount || 0).toFixed(2)} \uFDFC</td>
                </tr>
                `).join('') : `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 20px; color: #666;">
                        No items found for this invoice
                    </td>
                </tr>
                `}
            </tbody>
        </table>

        <!-- Financial Summary -->
        <div class="financial-summary">
            <div class="amount-in-words">
                <h4>Amount in Words / المبلغ بالكلمات</h4>
                <p><strong>English:</strong> ${convertNumberToWords(calculatedGrandTotal)} Saudi Riyals only.</p>
                <p><strong>Arabic:</strong> ${convertNumberToWordsArabic(calculatedGrandTotal)} فقط.</p>
            </div>
            
            <div class="totals-section">
                <h4>Financial Summary / الملخص المالي</h4>
                <div class="total-row">
                    <span>Gross Total / السعر الاجمالي:</span>
                    <span>${calculatedSubtotal.toFixed(2)} \uFDFC</span>
                </div>
                <div class="total-row">
                    <span>Total Discount / الخصم الاضاقي:</span>
                    <span>0.00 \uFDFC</span>
                </div>
                <div class="total-row">
                    <span>Total excl. VAT / الإجمالي غير شامل ضريبة القيمة المضافة:</span>
                    <span>${calculatedSubtotal.toFixed(2)} \uFDFC</span>
                </div>
                <div class="total-row">
                    <span>VAT Amount / ضريبة القيمة المضافة:</span>
                    <span>${calculatedVat.toFixed(2)} \uFDFC</span>
                </div>
                <div class="total-row final">
                    <span>Amount Incl. VAT / المبلغ شاملاً ضريبة القيمة المضافة:</span>
                    <span>${calculatedGrandTotal.toFixed(2)} \uFDFC</span>
                </div>
                <div class="total-row">
                    <span>Less: Advance / أقل : المبلغ المستلم مقدما:</span>
                    <span>0.00 \uFDFC</span>
                </div>
                <div class="total-row">
                    <span>Less: Other Deductions / أقل : حسومات أخرى:</span>
                    <span>0.00 \uFDFC</span>
                </div>
                <div class="total-row">
                    <span>Less: Retention / أقل : مبلغ الاحتفاظ:</span>
                    <span>0.00 \uFDFC</span>
                </div>
                <div class="total-row final">
                    <span>Balance Due / إجمالي المبلغ المستحق:</span>
                    <span>${calculatedGrandTotal.toFixed(2)} \uFDFC</span>
                </div>
            </div>
        </div>

        <!-- Bank Details and QR Code Table -->
        <table class="bank-qr-table">
            <tr>
                <th>Account Number / رقم الحساب</th>
                <td>
                    <div style="font-weight: bold; margin-bottom: 8px;">${customer?.account_number || 'N/A'}</div>
                    <div style="font-size: 9px; margin-bottom: 4px;"><strong>Bank:</strong> ${customer?.bank_name || ''}${customer?.bank_name_arabic ? (customer?.bank_name ? ` / ${customer.bank_name_arabic}` : customer.bank_name_arabic) : ''}</div>
                    <div style="font-size: 9px; margin-bottom: 4px;"><strong>IBAN:</strong> ${customer?.iban || 'N/A'}</div>
                    <div style="font-size: 9px; margin-bottom: 4px;"><strong>Account Holder:</strong> ${customer?.account_holder_name || ''}${customer?.account_holder_name_arabic ? (customer?.account_holder_name ? ` / ${customer.account_holder_name_arabic}` : customer.account_holder_name_arabic) : ''}</div>
                    <div style="font-size: 9px; margin-bottom: 4px;"><strong>Swift:</strong> ${customer?.swift_code || 'N/A'}</div>
                    ${customer?.bank_address ? `<div style="font-size: 9px;"><strong>Bank Address:</strong> ${customer.bank_address}${customer?.bank_address_arabic ? ` / ${customer.bank_address_arabic}` : ''}</div>` : ''}
                </td>
                <th rowspan="1">QR Code / رمز الاستجابة السريعة</th>
                <td class="qr-cell" rowspan="1">
                    <div class="qr-placeholder">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(generateZATCAQRCode({
                            sellerName: organization.name || 'Rawabi Contracting and Trading',
                            vatNumber: organization.vat_number || '300000000000003',
                            timestamp: new Date().toISOString(),
                            invoiceTotal: calculatedGrandTotal,
                            vatTotal: calculatedVat,
                            invoiceHash: invoice.zatca_invoice_hash || '31AF053F',
                            cryptographicStamp: invoice.zatca_cryptographic_stamp || '4e84cb6b-...'
                        }))}" 
                             alt="ZATCA QR Code" 
                             style="width: 100%; height: 100%; object-fit: contain;" 
                             onload="this.nextElementSibling.style.display='none';"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="qr-fallback" style="display: none; width: 100%; height: 100%; background: #f0f0f0; border: 1px solid #ccc; flex-direction: column; justify-content: center; align-items: center; font-size: 8px; text-align: center; padding: 2px;">
                            <div style="font-weight: bold; margin-bottom: 2px;">ZATCA QR</div>
                            <div>1: ${organization.name || 'Rawabi Contracting and Trading'}</div>
                            <div>2: ${organization.vat_number || '300000000000003'}</div>
                            <div>3: ${new Date().toISOString()}</div>
                            <div>4: ${calculatedGrandTotal.toFixed(2)} \uFDFC</div>
                            <div>5: ${calculatedVat.toFixed(2)} \uFDFC</div>
                            <div>6: ${invoice.zatca_invoice_hash || '31AF053F'}</div>
                            <div>7: ${invoice.zatca_cryptographic_stamp || '4e84cb6b-...'}</div>
                        </div>
                    </div>
                    <div class="qr-uuid">UUID: ${invoice.zatca_submission_uuid || '4e84cb6b-...'}</div>
                    <div class="qr-uuid">Invoice: ${invoice.invoice_number || 'N/A'}</div>
                </td>
            </tr>
        </table>

        <!-- Footer -->
        <div class="footer-note">
            This invoice was generated by TradingERP System - ZATCA Phase 2 Compliant
        </div>
    </div>
</body>
</html>`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Convert number to words in English
 */
function convertNumberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num === 0) return 'Zero';
  
  let integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  let result = '';
  
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    result += convertHundreds(thousands) + ' Thousand ';
    integerPart = integerPart % 1000;
  }
  
  if (integerPart >= 100) {
    result += convertHundreds(integerPart);
  } else if (integerPart > 0) {
    result += convertTens(integerPart);
  }
  
  if (decimalPart > 0) {
    result += ' And ' + convertTens(decimalPart) + ' Halalas';
  }
  
  return result.trim();
}

function convertHundreds(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  let result = '';
  
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  
  if (num > 0) {
    result += convertTens(num);
  }
  
  return result;
}

function convertTens(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num < 10) {
    return ones[num];
  } else if (num < 20) {
    return teens[num - 10];
  } else {
    return tens[Math.floor(num / 10)] + (num % 10 > 0 ? ' ' + ones[num % 10] : '');
  }
}

/**
 * Convert number to words in Arabic
 */
function convertNumberToWordsArabic(num: number): string {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  
  if (num === 0) return 'صفر';
  
  let integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);
  
  let result = '';
  
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    result += convertHundredsArabic(thousands) + ' ألف ';
    integerPart = integerPart % 1000;
  }
  
  if (integerPart >= 100) {
    result += convertHundredsArabic(integerPart);
  } else if (integerPart > 0) {
    result += convertTensArabic(integerPart);
  }
  
  if (decimalPart > 0) {
    result += ' و ' + convertTensArabic(decimalPart) + ' هللة';
  }
  
  return result.trim() + ' ريالاً سعودياً';
}

function convertHundredsArabic(num: number): string {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  
  let result = '';
  
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' مائة ';
    num %= 100;
  }
  
  if (num > 0) {
    result += convertTensArabic(num);
  }
  
  return result;
}

function convertTensArabic(num: number): string {
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  
  if (num < 10) {
    return ones[num];
  } else if (num < 20) {
    return teens[num - 10];
  } else {
    return tens[Math.floor(num / 10)] + (num % 10 > 0 ? ' و ' + ones[num % 10] : '');
  }
}

/**
 * Generate ZATCA Phase 2 compliant QR code using TLV format
 */
function generateZATCAQRCode(data: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: number;
  vatTotal: number;
  invoiceHash: string;
  cryptographicStamp: string;
}): string {
  // ZATCA Phase 2 QR Code Format - TLV (Tag-Length-Value) format
  const fields = [
    { tag: 1, value: data.sellerName },
    { tag: 2, value: data.vatNumber },
    { tag: 3, value: data.timestamp },
    { tag: 4, value: data.invoiceTotal.toFixed(2) },
    { tag: 5, value: data.vatTotal.toFixed(2) },
    { tag: 6, value: data.invoiceHash },
    { tag: 7, value: data.cryptographicStamp },
  ];
  
  let tlvData = '';
  for (const field of fields) {
    const valueHex = stringToHex(field.value);
    const length = valueHex.length / 2;
    tlvData += field.tag.toString(16).padStart(2, '0');
    tlvData += length.toString(16).padStart(2, '0');
    tlvData += valueHex;
  }
  
  return hexToBase64(tlvData);
}

/**
 * Convert string to hex representation
 */
function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert hex string to Base64
 */
function hexToBase64(hex: string): string {
  let binary = '';
  for (let i = 0; i < hex.length; i += 2) {
    binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = i < binary.length ? binary.charCodeAt(i++) : 0;
    const c = i < binary.length ? binary.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}
