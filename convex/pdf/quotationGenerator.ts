"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { QuotationData, OrganizationData, PDFGenerationResult } from "../types/pdfTypes";
import { formatDetailedAddress, processTextForPDF, formatCurrency, validatePDFData } from "../utils/pdfHelpers";

// [2026] Enhanced - Professional Terms & Conditions Formatter
// Preserves user's intended format (numbers, bullets, key-value pairs, paragraphs) without flattening or stripping
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAndHighlightKey(content: string): string {
  const kvMatch = content.match(/^([A-Za-z0-9\u0600-\u06FF\s\/\-_&]+(?:\([^\)]+\))?)\s*[:：]\s*(.+)$/);
  if (kvMatch && kvMatch[1].length < 45) {
    return `<strong style="color: #1a202c; font-weight: 600;">${escapeHtml(kvMatch[1])}:</strong> <span>${escapeHtml(kvMatch[2])}</span>`;
  }
  return escapeHtml(content);
}

function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

function formatTermsAndConditions(termsText: string): string {
  if (!termsText || termsText.trim() === '') {
    return '';
  }

  const trimmed = termsText.trim();

  // If text already has rich HTML tags, preserve directly
  if (/<(ul|ol|li|p|div|br|table|span|b|strong)[^>]*>/i.test(trimmed)) {
    return `<div class="formatted-terms-html" style="line-height: 1.5; font-size: inherit;">${trimmed}</div>`;
  }

  const rawLines = trimmed.split(/\r?\n/);
  const htmlChunks: string[] = [];
  let currentListType: 'ol' | 'ul' | null = null;
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListType && currentListItems.length > 0) {
      if (currentListType === 'ol') {
        htmlChunks.push(
          `<ol style="margin: 4px 0 6px 0; padding-left: 20px; list-style-type: decimal; line-height: 1.5;">` +
          currentListItems.map(item => `<li style="margin-bottom: 3px; padding-left: 2px;">${item}</li>`).join('') +
          `</ol>`
        );
      } else {
        htmlChunks.push(
          `<ul style="margin: 4px 0 6px 0; padding-left: 20px; list-style-type: disc; line-height: 1.5;">` +
          currentListItems.map(item => `<li style="margin-bottom: 3px; padding-left: 2px;">${item}</li>`).join('') +
          `</ul>`
        );
      }
      currentListType = null;
      currentListItems = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const line = raw.trim();

    if (!line) {
      flushList();
      continue;
    }

    const isRtl = isArabicText(line);
    const dirAttr = isRtl ? ' dir="rtl" style="direction: rtl; text-align: right;"' : '';

    // Check if line is numbered item: e.g. "1. ", "1.1 ", "1) ", "(1) ", "١. ", "a) "
    const numberedMatch = line.match(/^(\d+(?:\.\d+)*|[a-zA-Z]|[ivxIVX]+|[٠-٩]+)[\.\)\:\-]\s+(.*)$/);
    if (numberedMatch) {
      if (currentListType && currentListType !== 'ol') {
        flushList();
      }
      currentListType = 'ol';
      const content = numberedMatch[2] || '';
      currentListItems.push(escapeHtmlAndHighlightKey(content));
      continue;
    }

    // Check if line is a bullet item: e.g. "• ", "- ", "* ", "– ", "▪ "
    const bulletMatch = line.match(/^[•\-\*–—▪▫►\+]\s+(.*)$/);
    if (bulletMatch) {
      if (currentListType && currentListType !== 'ul') {
        flushList();
      }
      currentListType = 'ul';
      const content = bulletMatch[1] || '';
      currentListItems.push(escapeHtmlAndHighlightKey(content));
      continue;
    }

    // Flush any ongoing list before handling standalone line
    flushList();

    // Check for key-value pair, e.g. "Payment Terms: 100% in advance" or "Validity: 30 days"
    const kvMatch = line.match(/^([A-Za-z0-9\u0600-\u06FF\s\/\-_&]+(?:\([^\)]+\))?)\s*[:：]\s*(.+)$/);
    if (kvMatch && kvMatch[1].length < 45) {
      htmlChunks.push(
        `<div${dirAttr} style="margin-bottom: 3px; line-height: 1.5;">` +
        `<strong style="color: #1a202c; font-weight: 600;">${escapeHtml(kvMatch[1])}:</strong> ` +
        `<span>${escapeHtml(kvMatch[2])}</span>` +
        `</div>`
      );
    } else {
      const isHeadingLike = line.endsWith(':') || (line.length < 50 && line === line.toUpperCase());
      if (isHeadingLike) {
        htmlChunks.push(
          `<div${dirAttr} style="font-weight: 600; color: #2d3748; margin-top: 5px; margin-bottom: 3px; font-size: 1.02em;">${escapeHtml(line)}</div>`
        );
      } else {
        htmlChunks.push(
          `<p${dirAttr} style="margin: 0 0 5px 0; line-height: 1.5; color: #2d3748;">${escapeHtml(line)}</p>`
        );
      }
    }
  }

  flushList();

  return htmlChunks.join('');
}

// [2025-01-11] Added - Date formatting function for DD-MM-YYYY format
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original if invalid
    }
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original if error
  }
}

// Generate Arabic PDF action
export const generateArabicPDF = action({
  args: {
    quotationData: v.object({
      _id: v.string(),
      quotation_number: v.string(),
      customer_id: v.string(),
      customer_name: v.string(),
      customer_name_arabic: v.optional(v.string()),
      date: v.string(),
      valid_until: v.string(),
      currency: v.string(),
      tax_rate: v.number(),
      terms_conditions: v.optional(v.string()),
      notes: v.optional(v.string()),
      items: v.array(v.object({
        wbs_code: v.optional(v.string()),
        item_title: v.optional(v.string()),
        is_section_header: v.optional(v.boolean()),
        inventory_name: v.string(),
        inventory_name_arabic: v.optional(v.string()),
        description: v.string(),
        quantity: v.number(),
        unit: v.optional(v.string()), // Unit field for quotation items
        unit_price: v.number(),
        rate: v.number(),
        total_price: v.number(),
        amount: v.number(),
        vat_percentage: v.number(),
        vat_amount: v.number(),
        discount_percentage: v.optional(v.number()),
      }))
    }),
    orgData: v.object({
      name: v.string(),
      name_arabic: v.optional(v.string()),
      address: v.string(),
      address_arabic: v.optional(v.string()),
      vat_number: v.string(),
      vat_number_arabic: v.optional(v.string()),
      cr_number: v.optional(v.string()),
      cr_number_arabic: v.optional(v.string()),
      email: v.string(),
      phone: v.string(),
      website: v.optional(v.string()),
      logo_url: v.optional(v.string()),
      header_config: v.optional(v.any()),
      footer_config: v.optional(v.any()),
      // Custom header/footer image fields
      company_header_image_url: v.optional(v.string()),
      company_footer_image_url: v.optional(v.string()),
      use_custom_header_footer: v.optional(v.boolean()),
    }),
    action: v.union(v.literal("download"), v.literal("print")),
    templateData: v.optional(v.any())
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    pdfData: v.optional(v.string()),
    htmlContent: v.optional(v.string()),
    shouldConvertToPDF: v.optional(v.boolean())
  }),
  handler: async (ctx, args): Promise<any> => {
    try {
      console.log('Generating professional PDF with proper Arabic text support');

      // Calculate totals from items
      let subtotal = 0;
      let totalVat = 0;

      const processedItems = args.quotationData.items.map((item, index) => {
        const unitPrice = item.unit_price || item.rate || 0;
        const quantity = item.quantity || 0;
        // [2025-01-11] Fixed - VAT percentage precision and use stored vat_amount
        const vatPercentage = Math.round((item.vat_percentage || args.quotationData.tax_rate || 15) * 100) / 100;
        const itemTotal = item.total_price || item.amount || (unitPrice * quantity);
        // [2025-01-11] Enhanced - Use stored vat_amount from database or calculate if missing
        const itemVat = item.vat_amount || (itemTotal * vatPercentage) / 100;

        subtotal += itemTotal;
        totalVat += itemVat;

        return {
          index: index + 1,
          wbs_code: item.wbs_code,
          item_title: item.item_title,
          is_section_header: Boolean(item.is_section_header),
          description: item.description,
          name: item.inventory_name || item.item_name || item.description || 'N/A',
          name_arabic: item.inventory_name_arabic || '',
          quantity: quantity,
          unit: item.unit || 'pcs',
          unitPrice: unitPrice,
          vatPercentage: vatPercentage,
          vatAmount: itemVat,
          totalPrice: itemTotal
        };
      });

      const grandTotal = subtotal + totalVat;

      // Log the actual data being used
      console.log('=== ACTUAL DATA FROM DATABASE ===');
      console.log('Organization Data:', JSON.stringify(args.orgData, null, 2));
      console.log('Quotation Data:', JSON.stringify(args.quotationData, null, 2));
      console.log('Processed Items:', JSON.stringify(processedItems, null, 2));
      console.log('Financials:', { subtotal, totalVat, grandTotal });
      console.log('=== END DATA LOG ===');

      // Use template data if available, otherwise fall back to organization data
      const effectiveOrgData = args.templateData && args.templateData.header_config ? {
        ...args.orgData,
        header_config: args.templateData.header_config || args.orgData.header_config,
        footer_config: args.templateData.footer_config || args.orgData.footer_config,
      } : args.orgData;

      // Generate HTML with proper Arabic text support
      const htmlContent = generateSimpleArabicPDF({
        quotation: args.quotationData,
        organization: effectiveOrgData,
        items: processedItems,
        financials: {
          subtotal,
          totalVat,
          grandTotal
        },
        templateData: args.templateData
      });

      // Return HTML content that will be converted to PDF on the client side
      // This ensures proper Arabic font rendering using browser capabilities
      return {
        success: true,
        message: 'PDF HTML generated with proper Arabic text support',
        htmlContent: htmlContent,
        shouldConvertToPDF: true
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
});

// Generate proper PDF with Arabic text support using a client-side approach
function generateSimpleArabicPDF(data: {
  quotation: any;
  organization: any;
  items: any[];
  financials: { subtotal: number; totalVat: number; grandTotal: number };
  templateData?: any;
}): string {
  const { quotation, organization, items, financials, templateData } = data;

  // Instead of generating a text-based PDF, return HTML that can be converted to PDF on the client
  // This HTML will have proper Arabic font support and can be converted to PDF using browser APIs
  const htmlContent = `<!DOCTYPE html>
<html dir="ltr" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>Quotation</title>
    <!-- Preload Arabic fonts for better rendering -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=block" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=block" rel="stylesheet">
    <style>
        /* Load Arabic font with fallbacks */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');

        body {
            font-family: 'Noto Sans Arabic', 'Amiri', Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #333333;
            background: white;
            box-sizing: border-box;
            direction: ltr;
        }

        /* Professional letterhead header */
        .letterhead {
            border: 1px solid #333333;
            border-top: none;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 80px;
            background: white;
            margin-bottom: 20px;
        }

        /* Company info sections */
        .english-company {
            flex: 1;
            text-align: left;
            font-size: 11px;
            align-self: flex-start;
        }

        .center-logo {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
        }

        .arabic-company {
            flex: 1;
            text-align: right;
            direction: rtl;
            font-family: 'Noto Sans Arabic', 'Amiri', Arial, sans-serif;
            font-size: 11px;
            align-self: flex-start;
        }

        /* Quotation title */
        .quotation-title {
            text-align: center;
            margin: 0 0 15px 0;
            padding: 10px;
            border: 1px solid #333333;
            background-color: #f5f5f5;
        }

        .title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }

        .arabic-title {
            font-size: 14px;
            font-weight: bold;
            direction: rtl;
            font-family: 'Noto Sans Arabic', 'Amiri', Arial, sans-serif;
            color: #333;
        }

        /* Quotation details section */
        .quotation-details-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding: 8px;
            border: 1px solid #333;
        }

        .quotation-left {
            text-align: left;
            flex: 1;
        }

        .quotation-right {
            text-align: right;
            flex: 1;
        }

        /* Customer name with Arabic support */
        .customer-name {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 13px;
        }

        .customer-name-arabic {
            direction: rtl;
            font-family: 'Noto Sans Arabic', 'Amiri', Arial, sans-serif;
            font-size: 12px;
            color: #666;
            margin-top: 3px;
        }

        /* Items table */
        .items-section {
            margin-bottom: 15px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
            border: 1px solid #333;
        }

        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: 6px 8px;
            text-align: left;
            vertical-align: top;
        }

        .items-table th {
            background-color: #e6e6e6;
            color: #333;
            font-weight: bold;
            text-align: center;
            font-size: 10px;
        }

        .items-table td:nth-child(2) {
            text-align: left;
        }

        .items-table td:nth-child(3),
        .items-table td:nth-child(4),
        .items-table td:nth-child(5),
        .items-table td:nth-child(6),
        .items-table td:nth-child(7),
        .items-table td:nth-child(8) {
            text-align: center;
        }

        /* Item name with Arabic support */
        .item-name {
            font-weight: normal;
            font-size: 11px;
        }

        .item-name-arabic {
            direction: rtl;
            font-family: 'Noto Sans Arabic', 'Amiri', Arial, sans-serif;
            font-size: 10px;
            color: #666;
            margin-top: 3px;
        }

        /* Financial summary section */
        .financial-summary {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #333;
            background-color: #f9f9f9;
        }

        .financial-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 11px;
        }

        .financial-label {
            font-weight: bold;
        }

        .financial-value {
            text-align: right;
        }

        .grand-total {
            border-top: 2px solid #333;
            padding-top: 8px;
            font-size: 12px;
            font-weight: bold;
            color:rgb(0, 0, 0);
        }

        /* Terms and conditions & Additional notes */
        .terms-section, .notes-section {
            margin-bottom: 14px;
            margin-top: 14px;
            padding: 10px 14px;
            border: 1px solid #cbd5e0;
            border-left: 3.5px solid #2b6cb0;
            background-color: #f8fafc;
            border-radius: 4px;
            page-break-inside: avoid;
        }

        .notes-section {
            border-left: 3.5px solid #4a5568;
        }

        .terms-title, .notes-title {
            font-weight: 700;
            margin-bottom: 6px;
            font-size: 11px;
            color: #2b6cb0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
        }

        .notes-title {
            color: #4a5568;
        }

        .terms-content, .notes-content {
            font-size: 9.5px;
            line-height: 1.5;
            color: #2d3748;
        }

        /* Professional footer */
        .footer {
            padding: 10px;
            border: 2px solid #333;
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            background: white;
            margin-top: 25px;
        }

        .footer-left {
            text-align: left;
        }

        .footer-right {
            text-align: right;
        }

        /* Status badge */
        .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-draft { background-color: #ffd700; color: #333; }
        .status-approved { background-color: #32cd32; color: white; }
        .status-rejected { background-color: #dc143c; color: white; }

        @media print {
            body { margin: 0; }
            .letterhead { page-break-after: avoid; }
        }

        /* Ensure Arabic text displays correctly */
        .arabic-text {
            direction: rtl;
            font-family: 'Noto Sans Arabic', 'Amiri', Arial, sans-serif;
        }

        /* Enhanced Arabic font support */
        .rtl-text {
            direction: rtl;
            text-align: right;
            font-family: 'Noto Sans Arabic', 'Amiri', Arial, sans-serif;
        }
    </style>
</head>
<body>
    <!-- Professional Letterhead at Top -->
    <div class="letterhead">
        <!-- Left Side: English Company Info -->
        <div class="english-company">
            ${organization.header_config?.name ? `<div style="font-weight: bold; font-size: 13px; margin-bottom: 3px;">${organization.name}</div>` : ''}
            ${organization.header_config?.address ? `<div style="font-size: 10px; margin-bottom: 2px;">${organization.address}</div>` : ''}
            ${organization.header_config?.vat_number && organization.vat_number ? `<div style="font-size: 10px; margin-bottom: 2px;">VAT: ${organization.vat_number}</div>` : ''}
            ${organization.header_config?.cr_number && organization.cr_number ? `<div style="font-size: 10px; margin-bottom: 2px;">CR: ${organization.cr_number}</div>` : ''}
            ${organization.header_config?.email && organization.email ? `<div style="font-size: 10px; margin-bottom: 2px;">Email: ${organization.email}</div>` : ''}
            ${organization.header_config?.phone && organization.phone ? `<div style="font-size: 10px; margin-bottom: 2px;">Phone: ${organization.phone}</div>` : ''}
            ${organization.header_config?.website && organization.website ? `<div style="font-size: 10px; margin-bottom: 2px;">Website: ${organization.website}</div>` : ''}
        </div>

        <!-- Center: Logo or Title -->
        <div class="center-logo">
            ${organization.header_config?.logo && organization.logo_url ? `<img src="${organization.logo_url}" alt="Logo" style="max-height: 112px; max-width: 210px; object-fit: contain;">` : '<div style="font-size: 20px; color: #d32f2f;">QUOTATION</div>'}
        </div>

        <!-- Right Side: Arabic Company Info -->
        <div class="arabic-company">
            ${organization.header_config?.name_arabic ? `<div style="font-weight: bold; font-size: 13px; margin-bottom: 3px;">${organization.name_arabic}</div>` : ''}
            ${organization.header_config?.address_arabic ? `<div style="font-size: 10px; margin-bottom: 2px;">${organization.address_arabic}</div>` : ''}
            ${organization.header_config?.vat_number_arabic && organization.vat_number_arabic ? `<div style="font-size: 10px; margin-bottom: 2px;">رقم الضريبة: ${organization.vat_number_arabic}</div>` : ''}
            ${organization.header_config?.cr_number_arabic && organization.cr_number_arabic ? `<div style="font-size: 10px; margin-bottom: 2px;">السجل التجاري: ${organization.cr_number_arabic}</div>` : ''}
        </div>
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
        <!-- Quotation Title -->
        <div class="quotation-title">
            <div class="title">QUOTATION</div>
            <div class="arabic-title">عرض أسعار</div>
        </div>

        <!-- Quotation Details -->
        <div class="quotation-details-section">
            <div class="quotation-left">
                <div><strong>Quotation #:</strong> ${quotation.quotation_number}</div>
                <div><strong>Date:</strong> ${formatDate(quotation.date)}</div>
                <div><strong>Valid Until:</strong> ${formatDate(quotation.valid_until)}</div>
                <div><strong>Currency:</strong> ${quotation.currency}</div>
            </div>
            <div class="quotation-right">
                <div class="customer-name"><strong>Customer:</strong> ${quotation.customer_name}</div>
                ${quotation.customer_name_arabic ? `<div class="customer-name-arabic">${quotation.customer_name_arabic}</div>` : ''}
                <div><strong>Tax Rate:</strong> ${quotation.tax_rate}%</div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="items-section">
            <div style="font-size: 12px; font-weight: bold; margin-bottom: 6px; color: #333;">Items & Services</div>

            <table class="items-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Item & Description</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>VAT Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => item.is_section_header ? `
                        <tr style="background-color: #f0f4f8; font-weight: bold;">
                            <td style="font-weight: 700; color: #2b6cb0;">${item.wbs_code || item.index}</td>
                            <td colspan="6" style="font-weight: 700; color: #2b6cb0; font-size: 13px; text-align: left;">
                                ${item.item_title || item.name}
                                ${item.name_arabic ? `<span class="item-name-arabic" style="margin-left: 10px;">${item.name_arabic}</span>` : ''}
                            </td>
                        </tr>
                    ` : `
                        <tr>
                            <td style="font-weight: 600;">${item.wbs_code || item.index}</td>
                            <td>
                                ${item.item_title ? `<div style="font-weight: bold; color: #1a202c; font-size: 12px; margin-bottom: 2px;">${item.item_title}</div>` : ''}
                                <div class="item-name" style="${item.item_title ? 'color: #4a5568;' : ''}">${item.name}</div>
                                ${item.name_arabic ? `<div class="item-name-arabic">${item.name_arabic}</div>` : ''}
                                ${item.description && item.description !== item.name && item.description !== item.item_title ? `<div style="font-size: 11px; color: #718096; margin-top: 2px; white-space: pre-line;">${item.description}</div>` : ''}
                            </td>
                            <td>${item.quantity}</td>
                            <td>${item.unit || 'pcs'}</td>
                            <td>${formatCurrency(item.unitPrice, quotation.currency)}</td>
                            <td>${formatCurrency(item.totalPrice, quotation.currency)}</td>
                            <td>${formatCurrency(item.vatAmount, quotation.currency)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Financial Summary -->
        <div class="financial-summary">
            <div class="financial-row">
                <span class="financial-label">Subtotal:</span>
                <span class="financial-value">${formatCurrency(financials.subtotal, quotation.currency)}</span>
            </div>
            <div class="financial-row">
                <span class="financial-label">VAT (${quotation.tax_rate}%):</span>
                <span class="financial-value">${formatCurrency(financials.totalVat, quotation.currency)}</span>
            </div>
            <div class="financial-row grand-total">
                <span class="financial-label">GRAND TOTAL:</span>
                <span class="financial-value">${formatCurrency(financials.grandTotal, quotation.currency)}</span>
            </div>
        </div>

        <!-- Terms and Conditions -->
        ${quotation.terms_conditions ? `
        <div class="terms-section">
            <div class="terms-title">Terms & Conditions</div>
            <div class="terms-content">${formatTermsAndConditions(quotation.terms_conditions)}</div>
        </div>
        ` : ''}

        <!-- Notes / Special Instructions -->
        ${quotation.notes ? `
        <div class="notes-section">
            <div class="notes-title">Notes & Special Instructions</div>
            <div class="notes-content">${formatTermsAndConditions(quotation.notes)}</div>
        </div>
        ` : ''}

        <!-- Professional Footer -->
        <div class="footer">
            <div class="footer-left">
                ${organization.footer_config?.name ? `<div style="font-weight: bold; margin-bottom: 3px;">${organization.name}</div>` : ''}
                ${organization.footer_config?.address && organization.address ? `<div style="font-size: 8px; margin-bottom: 2px;">${organization.address}</div>` : ''}
                ${organization.footer_config?.vat_number && organization.vat_number ? `<div style="font-size: 8px; margin-bottom: 2px;">VAT: ${organization.vat_number}</div>` : ''}
                ${organization.footer_config?.cr_number && organization.cr_number ? `<div style="font-size: 8px; margin-bottom: 2px;">CR: ${organization.cr_number}</div>` : ''}
                ${organization.footer_config?.email && organization.email ? `<div style="font-size: 8px; margin-bottom: 2px;">Email: ${organization.email}</div>` : ''}
                ${organization.footer_config?.phone && organization.phone ? `<div style="font-size: 8px; margin-bottom: 2px;">Phone: ${organization.phone}</div>` : ''}
            </div>

            <div class="footer-right">
                ${organization.footer_config?.name_arabic && organization.name_arabic ? `<div style="font-weight: bold; margin-bottom: 3px; direction: rtl; font-family: 'Noto Sans Arabic', Arial, sans-serif;">${organization.name_arabic}</div>` : ''}
                ${organization.footer_config?.address_arabic && organization.address_arabic ? `<div style="font-size: 8px; margin-bottom: 2px; direction: rtl; font-family: 'Noto Sans Arabic', Arial, sans-serif;">${organization.address_arabic}</div>` : ''}
                ${organization.footer_config?.vat_number_arabic && organization.vat_number_arabic ? `<div style="font-size: 8px; margin-bottom: 2px; direction: rtl; font-family: 'Noto Sans Arabic', Arial, sans-serif;">رقم الضريبة: ${organization.vat_number_arabic}</div>` : ''}
                ${organization.footer_config?.cr_number_arabic && organization.cr_number_arabic ? `<div style="font-size: 8px; margin-bottom: 2px; direction: rtl; font-family: 'Noto Sans Arabic', Arial, sans-serif;">السجل التجاري: ${organization.cr_number_arabic}</div>` : ''}
                ${organization.footer_config?.website && organization.website ? `<div style="font-size: 8px; margin-bottom: 2px;">Website: ${organization.website}</div>` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;

  return htmlContent;
}
