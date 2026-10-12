import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatTermsToHtml } from '../../utils/termsFormatter';

export interface MultiPagePDFData {
  quotation: {
    quotation_number: string;
    customer_name: string;
    customer_name_arabic?: string;
    date: string;
    currency: string;
    tax_rate: number;
    terms_conditions?: string;
    notes?: string;
  };
  organization: {
    name: string;
    name_arabic: string;
    address: string;
    address_arabic: string;
    email: string;
    phone: string;
    vat_number: string;
    vat_number_arabic?: string;
    cr_number: string;
    logo_url?: string;
    header_display_config?: {
      logo?: boolean;
      name?: boolean;
      name_arabic?: boolean;
      email?: boolean;
      phone?: boolean;
      address?: boolean;
      address_arabic?: boolean;
      website?: boolean;
      vat_number?: boolean;
      vat_number_arabic?: boolean;
      cr_number?: boolean;
      cr_number_arabic?: boolean;
    };
    footer_display_config?: {
      name?: boolean;
      name_arabic?: boolean;
      email?: boolean;
      phone?: boolean;
      address_arabic?: boolean;
    };
  };
  items: Array<{
    name: string;
    name_arabic?: string;
    quantity: number;
    unit?: string; // Unit field for items
    unitPrice: number;
    discountPercentage?: number;
    vatPercentage: number;
    vatAmount: number;
    totalPrice: number;
  }>;
  financials: {
    subtotal: number;
    totalVat: number;
    grandTotal: number;
  };
}

export class MultiPagePDFGenerator {
  private data: MultiPagePDFData;
  private itemsPerPage: number;

  constructor(data: MultiPagePDFData) {
    this.data = data;
    this.itemsPerPage = this.calculateOptimalItemsPerPage();
  }

  private calculateOptimalItemsPerPage(): number {
    const totalItems = this.data.items.length;
    
    // Optimal balance: 8 items per page for readability
    if (totalItems <= 8) {
      // For small quotations, fit all items on one page
      return totalItems;
    } else if (totalItems <= 16) {
      // For medium quotations, fit 8 items per page
      return 8;
    } else if (totalItems <= 24) {
      // For larger quotations, fit 8 items per page
      return 8;
    } else {
      // For very large quotations, fit 8 items per page
      return 8;
    }
  }

  async generatePDF(action: 'download' | 'print' = 'download'): Promise<void> {
    try {
      console.log('=== MULTI-PAGE PDF GENERATION STARTED ===');
      console.log('Total items:', this.data.items.length);
      console.log('Optimal items per page:', this.itemsPerPage);
      console.log('Expected pages:', Math.ceil(this.data.items.length / this.itemsPerPage));
      
      // Calculate total pages needed
      const totalPages = Math.ceil(this.data.items.length / this.itemsPerPage);
      console.log('Total pages needed:', totalPages);

      // For printing, we need to generate all HTML pages first
      let allPagesHTML = '';
      if (action === 'print') {
        // Generate a single HTML document with all pages
        allPagesHTML = this.generateMultiPageHTML(totalPages);
      }

      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Generate each page
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        console.log(`Generating page ${pageNum} of ${totalPages}`);
        
        // Add new page (except for first page)
        if (pageNum > 1) {
          pdf.addPage();
        }

        // Get items for this page
        const startIndex = (pageNum - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.data.items.length);
        const pageItems = this.data.items.slice(startIndex, endIndex);
        
        console.log(`Page ${pageNum} items: ${startIndex + 1} to ${endIndex}`);

        // Generate HTML for this page
        const pageHTML = this.generatePageHTML(pageNum, totalPages, pageItems);
        
        // Convert HTML to canvas
        const canvas = await this.convertHTMLToCanvas(pageHTML);
        
        // Add canvas to PDF
        const imgData = canvas.toDataURL('image/png', 1.0);
        const canvasAspectRatio = canvas.height / canvas.width;
        
        // Calculate dimensions to fit A4
        let imgWidth = pdfWidth - 20; // 10mm margin on each side
        let imgHeight = imgWidth * canvasAspectRatio;
        
        // If height exceeds page, scale down
        if (imgHeight > pdfHeight - 20) {
          imgHeight = pdfHeight - 20;
          imgWidth = imgHeight / canvasAspectRatio;
        }
        
        // Center the image on the page
        const offsetX = (pdfWidth - imgWidth) / 2;
        const offsetY = (pdfHeight - imgHeight) / 2;
        
        pdf.addImage(imgData, 'PNG', offsetX, offsetY, imgWidth, imgHeight);
      }

      // Generate PDF based on action
      if (action === 'download') {
        const fileName = `quotation-${this.data.quotation.quotation_number}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        console.log('Multi-page PDF downloaded successfully');
      } else if (action === 'print') {
        // For printing, we'll use HTML directly instead of PDF
        // This gives better control over the print process
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
          // Write the HTML content directly
          printWindow.document.write(allPagesHTML);
          printWindow.document.close();
          
          // Wait for fonts to load
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            // Don't auto-close - let user control the window
          }, 1000);
        }
        console.log('Multi-page PDF opened for printing');
      }

    } catch (error) {
      console.error('Error generating multi-page PDF:', error);
      throw error;
    }
  }

  private generatePageHTML(pageNum: number, totalPages: number, pageItems: any[]): string {
    const { quotation, organization, financials } = this.data;
    
    // Get header and footer configurations with defaults
    const headerConfig = organization.header_display_config || {
      logo: true,
      name: true,
      name_arabic: true,
      email: true,
      phone: true,
      address: true,
      address_arabic: true,
      vat_number: true,
      vat_number_arabic: true,
      cr_number: true,
      cr_number_arabic: true
    };
    
    const footerConfig = organization.footer_display_config || {
      name: true,
      name_arabic: true,
      email: true,
      phone: true,
      address_arabic: true
    };

    // Determine if this is the last page
    const isLastPage = pageNum === totalPages;
    
    // Calculate financials for this page (only show on last page)
    const showTerms = isLastPage && Boolean(quotation.terms_conditions || quotation.notes);

    return `
<!DOCTYPE html>
<html dir="ltr" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation - Page ${pageNum}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=block" rel="stylesheet">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            width: 794px; /* A4 width in pixels */
            height: 1123px; /* A4 height in pixels */
            background: white;
            box-sizing: border-box;
            position: relative;
        }
        
        /* Professional letterhead header */
        .letterhead {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            border: 2px solid #333;
            border-top: none;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 70px;
            background: white;
            z-index: 10;
        }
        
        /* Main content area */
        .main-content {
            margin-top: 100px;
            margin-bottom: 60px;
            padding: 15px;
            min-height: calc(100% - 160px);
        }
        
        /* Company info sections */
        .english-company {
            flex: 1;
            text-align: left;
        }
        
        .center-logo {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
        }
        
        .arabic-company {
            flex: 1;
            text-align: right;
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
        }
        
        /* Quotation title */
        .quotation-title {
            text-align: center;
            margin: 0 0 10px 0;
            padding: 8px;
            border: 1px solid #333;
            background-color: #f5f5f5;
        }
        
        .title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        
        .arabic-title {
            font-size: 14px;
            font-weight: bold;
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
            color: #333;
        }
        
        /* Quote details section */
        .quote-details-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px;
            border: 1px solid #333;
        }
        
        .quote-left {
            text-align: left;
        }
        
        .quote-right {
            text-align: right;
        }
        
        /* Customer name with Arabic support */
        .customer-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .customer-name-arabic {
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
            font-size: 9px;
            color: #666;
        }
        
        /* Items table */
        .items-section {
            margin-bottom: 12px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 10px;
            border: 2px solid #333;
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
        
        .items-table td:first-child,
        .items-table td:nth-child(3),
        .items-table td:nth-child(5) {
            text-align: center;
        }
        
        .items-table td:nth-child(4),
        .items-table td:nth-child(6),
        .items-table td:nth-child(7) {
            text-align: right;
        }
        
        /* Item name with Arabic support */
        .item-name {
            font-weight: normal;
        }
        
        .item-name-arabic {
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
            font-size: 9px;
            color: #666;
            margin-top: 2px;
        }
        
        /* Summary section */
        .summary {
            margin-top: 15px;
            margin-bottom: 15px;
        }
        
        .summary-table {
            width: 50%;
            float: right;
            border-collapse: collapse;
            font-size: 11px;
        }
        
        .summary-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: right;
        }
        
        .summary-label {
            background-color: #f5f5f5;
            font-weight: bold;
            width: 40%;
        }
        
        .summary-value {
            width: 60%;
        }
        
        .total-row td {
            font-weight: bold;
            background-color: #e6e6e6;
            font-size: 12px;
        }
        
        .arabic-text {
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
        }
        
        /* Terms & Conditions */
        .terms-section {
            margin-top: 30px;
            page-break-inside: avoid;
        }
        
        .terms-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
        }
        
        .terms-content {
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            white-space: normal;
        }
        
        /* Professional footer */
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px;
            border: 2px solid #333;
            border-bottom: none;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            background: white;
            z-index: 10;
        }
        
        .footer-left {
            text-align: left;
        }
        
        .footer-right {
            text-align: right;
        }
        
        .page-number {
            position: absolute;
            bottom: 5px;
            right: 20px;
            font-size: 10px;
            color: #666;
        }
        
        /* Utility classes */
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    </style>
</head>
<body>
    <!-- Professional Letterhead at Top -->
    <div class="letterhead">
        <!-- Left Side: English Company Info -->
        <div class="english-company">
            ${headerConfig.name ? `<div><strong>${organization.name}</strong></div>` : ''}
            ${headerConfig.address ? `<div>${organization.address}</div>` : ''}
            ${headerConfig.email ? `<div>Email: ${organization.email}</div>` : ''}
            ${headerConfig.phone ? `<div>Phone: ${organization.phone}</div>` : ''}
            ${headerConfig.vat_number ? `<div>VAT: ${organization.vat_number}</div>` : ''}
            ${headerConfig.cr_number ? `<div>CR: ${organization.cr_number}</div>` : ''}
        </div>
        
        <!-- Center: Company Logo/Title -->
        <div class="center-logo">
            ${headerConfig.logo && organization.logo_url ? `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
                    <img src="${organization.logo_url}" 
                         alt="Company Logo" 
                         style="max-width: 80px; max-height: 60px; object-fit: contain; border: 1px solid #ddd; padding: 5px; background: white; display: block; margin: 0 auto;"
                         onerror="this.style.display='none'; this.parentElement.nextElementSibling.style.display='flex';">
                </div>
                <div style="display: none; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #333; padding: 8px; border-radius: 5px; background: #f0f0f0;">
                    <div style="font-size: 14px; font-weight: bold; color: #0066cc; text-align: center;">LOGO</div>
                    <div style="font-size: 10px; margin-top: 2px; text-align: center;">EST. 2024</div>
                </div>
            ` : headerConfig.logo ? `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid #333; padding: 8px; border-radius: 5px; background: #f0f0f0;">
                    <div style="font-size: 14px; font-weight: bold; color: #0066cc; text-align: center;">LOGO</div>
                    <div style="font-size: 10px; margin-top: 2px; text-align: center;">EST. 2024</div>
                </div>
            ` : ''}
        </div>
        
        <!-- Right Side: Arabic Company Info -->
        <div class="arabic-company">
            ${headerConfig.name_arabic ? `<div class="arabic-text"><strong>${organization.name_arabic}</strong></div>` : ''}
            ${headerConfig.address_arabic ? `<div class="arabic-text">${organization.address_arabic}</div>` : ''}
            ${headerConfig.vat_number_arabic ? `<div class="arabic-text">الرقم الضريبي: ${organization.vat_number_arabic || organization.vat_number}</div>` : ''}
            ${headerConfig.cr_number_arabic ? `<div class="arabic-text">سجل تجاري: ${organization.cr_number}</div>` : ''}
        </div>
    </div>
    
    <!-- Main Content Area -->
    <div class="main-content">
        <!-- Quotation Title -->
        <div class="quotation-title">
            <div class="title">QUOTATION</div>
            <div class="arabic-title">عرض أسعار</div>
        </div>
        
        <!-- Quote Details -->
        <div class="quote-details-section">
            <div class="quote-left">
                <div><strong>Attention:</strong></div>
                <div class="customer-name">${quotation.customer_name}</div>
                ${quotation.customer_name_arabic ? `<div class="customer-name-arabic">${quotation.customer_name_arabic}</div>` : ''}
                <div><strong>Quote #:</strong> ${quotation.quotation_number}</div>
            </div>
            <div class="quote-right">
                <div><strong>Date:</strong> ${new Date(quotation.date).toLocaleDateString()}</div>
                <div><strong>Currency:</strong> ${quotation.currency}</div>
                <div><strong>Page:</strong> ${pageNum} of ${totalPages}</div>
            </div>
        </div>
    
        <!-- Professional Items Table -->
        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">Sr#</th>
                        <th style="width: 30%;">Descriptions</th>
                        <th style="width: 8%;">Qty</th>
                        <th style="width: 8%;">Unit</th>
                        <th style="width: 10%;">Rate</th>
                        <th style="width: 7%;">Discount %</th>
                        <th style="width: 8%;">VAT %</th>
                        <th style="width: 10%;">VAT Amount</th>
                        <th style="width: 10%;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageItems.map((item, index) => {
                        const globalIndex = (pageNum - 1) * this.itemsPerPage + index;
                        const unitPrice = item.unitPrice || 0;
                        const quantity = item.quantity || 0;
                        const discountPercentage = item.discountPercentage || 0;
                        const vatPercentage = item.vatPercentage || 0;
                        const vatAmount = item.vatAmount || 0;
                        const totalPrice = item.totalPrice || 0;
                        return `
                            <tr>
                                <td style="text-align: center;">${globalIndex + 1}</td>
                                <td>
                                    <div class="item-name">${item.name || ''}</div>
                                    ${item.name_arabic ? `<div class="item-name-arabic">${item.name_arabic}</div>` : ''}
                                </td>
                                <td style="text-align: center;">${quantity}</td>
                                <td style="text-align: center;">${item.unit || 'pcs'}</td>
                                <td style="text-align: right;">${quotation.currency} ${unitPrice.toFixed(2)}</td>
                                <td style="text-align: center;">${discountPercentage}%</td>
                                <td style="text-align: center;">${vatPercentage}%</td>
                                <td style="text-align: right;">${quotation.currency} ${vatAmount.toFixed(2)}</td>
                                <td style="text-align: right;">${quotation.currency} ${totalPrice.toFixed(2)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        ${showFinancials ? `
        <!-- Professional Summary Table -->
        <div class="summary clearfix">
            <table class="summary-table">
                <tr>
                    <td class="summary-label">Sub Total:</td>
                    <td class="summary-value">${quotation.currency} ${(financials.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="summary-label">VAT (${quotation.tax_rate || 0}%):</td>
                    <td class="summary-value">${quotation.currency} ${(financials.totalVat || 0).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td class="summary-label">Total:</td>
                    <td class="summary-value">${quotation.currency} ${(financials.grandTotal || 0).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td class="summary-label arabic-text">المجموع:</td>
                    <td class="summary-value">${quotation.currency} ${(financials.grandTotal || 0).toFixed(2)}</td>
                </tr>
            </table>
        </div>
        ` : ''}
        
        ${quotation.terms_conditions ? `
        <!-- Terms & Conditions Section -->
        <div class="terms-section">
            <h3 class="terms-title">Terms & Conditions</h3>
            <div class="terms-content">${formatTermsToHtml(quotation.terms_conditions)}</div>
        </div>
        ` : ''}
        ${quotation.notes ? `
        <!-- Notes Section -->
        <div class="terms-section" style="margin-top: 15px;">
            <h3 class="terms-title" style="color: #4a5568;">Notes & Special Instructions</h3>
            <div class="terms-content">${formatTermsToHtml(quotation.notes)}</div>
        </div>
        ` : ''}
    </div> <!-- End main-content -->
    
    <!-- Professional Footer at Bottom -->
    <div class="footer">
        <div class="footer-left">
            ${footerConfig.email ? `<div>Email: ${organization.email}</div>` : ''}
            ${footerConfig.name ? `<div>${organization.name}</div>` : ''}
        </div>
        <div class="footer-right arabic-text">
            ${footerConfig.phone ? `<div>الهاتف: ${organization.phone}</div>` : ''}
            ${footerConfig.name_arabic ? `<div>${organization.name_arabic}</div>` : ''}
            ${footerConfig.address_arabic ? `<div>${organization.address_arabic}</div>` : ''}
        </div>
    </div>
    
    <!-- Page Number -->
    <div class="page-number">Page ${pageNum} of ${totalPages}</div>
    
    <!-- Optimization Info (only on first page) -->
    ${pageNum === 1 ? `
    <div class="optimization-info" style="position: absolute; bottom: 5px; left: 10px; font-size: 8px; color: #666;">
      Optimized: ${this.itemsPerPage} items/page for ${this.data.items.length} total items
    </div>
    ` : ''}
</body>
</html>
    `;
  }

  private generateMultiPageHTML(totalPages: number): string {
    const { quotation, organization, financials } = this.data;
    
    // Get header and footer configurations with defaults
    const headerConfig = organization.header_display_config || {
      logo: true,
      name: true,
      name_arabic: true,
      email: true,
      phone: true,
      address: true,
      address_arabic: true,
      vat_number: true,
      vat_number_arabic: true,
      cr_number: true,
      cr_number_arabic: true
    };
    
    const footerConfig = organization.footer_display_config || {
      name: true,
      name_arabic: true,
      email: true,
      phone: true,
      address_arabic: true
    };

    // Generate all page content
    let allPagesContent = '';
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const startIndex = (pageNum - 1) * this.itemsPerPage;
      const endIndex = Math.min(startIndex + this.itemsPerPage, this.data.items.length);
      const pageItems = this.data.items.slice(startIndex, endIndex);
      const isLastPage = pageNum === totalPages;
      const showTerms = isLastPage && Boolean(quotation.terms_conditions || quotation.notes);

      // Generate page content without the HTML wrapper
      const pageContent = this.generatePageContent(pageNum, totalPages, pageItems, showFinancials, showTerms, headerConfig, footerConfig);
      allPagesContent += `
        <div class="page" style="page-break-after: always; width: 794px; height: 1123px; position: relative; background: white; margin-bottom: 20px; border: 1px solid #ccc;">
          ${pageContent}
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html dir="ltr" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation - ${quotation.quotation_number}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=block" rel="stylesheet">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: #f5f5f5;
        }
        
        .page {
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 0 auto 20px auto;
        }
        
        /* Professional letterhead header */
        .letterhead {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            border: 2px solid #333;
            border-top: none;
            padding: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 70px;
            background: white;
            z-index: 10;
        }
        
        /* Main content area */
        .main-content {
            margin-top: 100px;
            margin-bottom: 60px;
            padding: 15px;
            min-height: calc(100% - 160px);
        }
        
        /* Company info sections */
        .english-company {
            flex: 1;
            text-align: left;
        }
        
        .center-logo {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
        }
        
        .arabic-company {
            flex: 1;
            text-align: right;
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
        }
        
        /* Quotation title */
        .quotation-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0;
            color: #333;
        }
        
        /* Quotation details */
        .quotation-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 12px;
        }
        
        .quotation-info, .customer-info {
            flex: 1;
        }
        
        .quotation-info {
            text-align: left;
        }
        
        .customer-info {
            text-align: right;
        }
        
        /* Items table */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 10px;
        }
        
        .items-table th, .items-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        /* Financial summary */
        .financial-summary {
            margin-top: 20px;
            text-align: right;
        }
        
        .financial-summary table {
            margin-left: auto;
            border-collapse: collapse;
            font-size: 12px;
        }
        
        .financial-summary td {
            padding: 5px 15px;
            border: none;
        }
        
        .summary-label {
            text-align: right;
            font-weight: bold;
        }
        
        .summary-value {
            text-align: left;
        }
        
        .total-row {
            border-top: 2px solid #333 !important;
            font-weight: bold;
            font-size: 14px;
        }
        
        /* Terms & Conditions */
        .terms-section {
            margin-top: 30px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        
        .terms-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        
        .terms-content {
            font-size: 11px;
            line-height: 1.5;
            white-space: normal;
        }
        
        /* Footer */
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            border: 2px solid #333;
            border-bottom: none;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            font-size: 10px;
        }
        
        .footer-left {
            text-align: left;
        }
        
        .footer-right {
            text-align: right;
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
        }
        
        /* Page number */
        .page-number {
            position: absolute;
            bottom: 5px;
            right: 10px;
            font-size: 10px;
            color: #666;
        }
        
        /* Arabic text support */
        .arabic-text {
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
        }
        
        /* Print styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .page {
                box-shadow: none;
                margin: 0;
                page-break-after: always;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
        }
    </style>
</head>
<body>
    ${allPagesContent}
</body>
</html>
    `;
  }

  private generatePageContent(pageNum: number, totalPages: number, pageItems: any[], showFinancials: boolean, showTerms: boolean, headerConfig: any, footerConfig: any): string {
    const { quotation, organization, financials } = this.data;

    return `
    <!-- Professional letterhead header -->
    <div class="letterhead">
        <div class="english-company">
            ${headerConfig.name ? `<div style="font-weight: bold; font-size: 14px;">${organization.name}</div>` : ''}
            ${headerConfig.email ? `<div>Email: ${organization.email}</div>` : ''}
            ${headerConfig.phone ? `<div>Phone: ${organization.phone}</div>` : ''}
            ${headerConfig.address ? `<div>${organization.address}</div>` : ''}
            ${headerConfig.vat_number ? `<div>VAT: ${organization.vat_number}</div>` : ''}
            ${headerConfig.cr_number ? `<div>CR: ${organization.cr_number}</div>` : ''}
        </div>
        
        <div class="center-logo">
            ${headerConfig.logo && organization.logo_url ? 
                `<img src="${organization.logo_url}" alt="Logo" style="max-height: 50px; max-width: 150px;">` : 
                '<div>LOGO</div>'
            }
        </div>
        
        <div class="arabic-company">
            ${headerConfig.name_arabic ? `<div style="font-weight: bold; font-size: 14px;">${organization.name_arabic}</div>` : ''}
            ${headerConfig.address_arabic ? `<div>${organization.address_arabic}</div>` : ''}
            ${headerConfig.vat_number_arabic ? `<div>الرقم الضريبي: ${organization.vat_number_arabic}</div>` : ''}
            ${headerConfig.cr_number_arabic ? `<div>رقم السجل التجاري: ${organization.cr_number_arabic}</div>` : ''}
        </div>
    </div>
    
    <!-- Main content area -->
    <div class="main-content">
        <!-- Quotation title -->
        <div class="quotation-title">QUOTATION</div>
        
        <!-- Quotation details -->
        <div class="quotation-details">
            <div class="quotation-info">
                <div><strong>Quotation Number:</strong> ${quotation.quotation_number}</div>
                <div><strong>Date:</strong> ${new Date(quotation.created_at).toLocaleDateString()}</div>
                <div><strong>Valid Until:</strong> ${quotation.valid_until ? new Date(quotation.valid_until).toLocaleDateString() : 'N/A'}</div>
            </div>
            <div class="customer-info">
                <div><strong>Customer:</strong> ${quotation.customer_name}</div>
                <div><strong>Contact:</strong> ${quotation.customer_contact || 'N/A'}</div>
                <div><strong>Address:</strong> ${quotation.customer_address || 'N/A'}</div>
            </div>
        </div>
        
        <!-- Items table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${pageItems.map((item, index) => {
                    const itemNumber = (pageNum - 1) * this.itemsPerPage + index + 1;
                    const unitPrice = item.unit_price || 0;
                    const quantity = item.quantity || 0;
                    const total = unitPrice * quantity;
                    return `
                    <tr>
                        <td>${itemNumber}</td>
                        <td>${item.name || ''}</td>
                        <td>${item.description || ''}</td>
                        <td>${quantity}</td>
                        <td>${item.unit || 'pcs'}</td>
                        <td>${quotation.currency} ${unitPrice.toFixed(2)}</td>
                        <td>${quotation.currency} ${total.toFixed(2)}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        ${showFinancials ? `
        <!-- Financial summary -->
        <div class="financial-summary">
            <table>
                <tr>
                    <td class="summary-label">Subtotal:</td>
                    <td class="summary-value">${quotation.currency} ${(financials.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="summary-label">VAT (${quotation.vat_rate || 0}%):</td>
                    <td class="summary-value">${quotation.currency} ${(financials.vat || 0).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td class="summary-label">Total:</td>
                    <td class="summary-value">${quotation.currency} ${(financials.grandTotal || 0).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td class="summary-label arabic-text">المجموع:</td>
                    <td class="summary-value">${quotation.currency} ${(financials.grandTotal || 0).toFixed(2)}</td>
                </tr>
            </table>
        </div>
        ` : ''}
        
        ${quotation.terms_conditions ? `
        <!-- Terms & Conditions Section -->
        <div class="terms-section">
            <h3 class="terms-title">Terms & Conditions</h3>
            <div class="terms-content">${formatTermsToHtml(quotation.terms_conditions)}</div>
        </div>
        ` : ''}
        ${quotation.notes ? `
        <!-- Notes Section -->
        <div class="terms-section" style="margin-top: 15px;">
            <h3 class="terms-title" style="color: #4a5568;">Notes & Special Instructions</h3>
            <div class="terms-content">${formatTermsToHtml(quotation.notes)}</div>
        </div>
        ` : ''}
    </div> <!-- End main-content -->
    
    <!-- Professional Footer at Bottom -->
    <div class="footer">
        <div class="footer-left">
            ${footerConfig.email ? `<div>Email: ${organization.email}</div>` : ''}
            ${footerConfig.name ? `<div>${organization.name}</div>` : ''}
        </div>
        <div class="footer-right arabic-text">
            ${footerConfig.phone ? `<div>الهاتف: ${organization.phone}</div>` : ''}
            ${footerConfig.name_arabic ? `<div>${organization.name_arabic}</div>` : ''}
            ${footerConfig.address_arabic ? `<div>${organization.address_arabic}</div>` : ''}
        </div>
    </div>
    
    <!-- Page Number -->
    <div class="page-number">Page ${pageNum} of ${totalPages}</div>
    `;
  }

  private async convertHTMLToCanvas(htmlContent: string): Promise<HTMLCanvasElement> {
    // Create a temporary container for the HTML content
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.top = '-10000px';
    container.style.left = '-10000px';
    container.style.width = '794px'; // A4 width in pixels
    container.style.height = '1123px'; // A4 height in pixels
    container.style.background = 'white';
    container.style.transform = 'scale(1)';
    container.style.transformOrigin = 'top left';
    container.style.boxSizing = 'border-box';
    
    document.body.appendChild(container);

    // Wait for fonts to load
    console.log('Waiting for Arabic fonts to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (document.fonts) {
      try {
        await document.fonts.load('400 16px "Noto Sans Arabic"');
        console.log('Arabic font loaded successfully');
      } catch (fontError) {
        console.log('Font loading warning:', fontError);
      }
    }

    // Convert HTML to canvas with high quality
    console.log('Converting HTML to canvas...');
    const canvas = await html2canvas(container, {
      scale: 2, // Higher resolution for crisp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels
      height: 1123, // A4 height in pixels
      scrollX: 0,
      scrollY: 0,
      logging: false,
      removeContainer: true
    });

    // Remove the temporary container
    document.body.removeChild(container);

    return canvas;
  }
}
