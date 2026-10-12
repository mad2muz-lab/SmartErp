import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatTermsToHtml } from '../../utils/termsFormatter';

export interface ArabicPDFData {
  quotation: {
    quotation_number: string;
    customer_name: string;
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
      industry?: boolean;
    };
    footer_display_config?: {
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
      industry?: boolean;
    };
  };
  items: Array<{
    name: string;
    quantity: number;
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

export class ArabicPDFRenderer {
  private data: ArabicPDFData;

  constructor(data: ArabicPDFData) {
    this.data = data;
  }

  private createHTMLContent(): string {
    const { quotation, organization, items, financials } = this.data;
    
    // Get header and footer configurations with defaults
    console.log('=== ARABICPDFRENDERER TEMPLATE CONFIG DEBUG ===');
    console.log('organization.header_display_config:', organization.header_display_config);
    console.log('organization.footer_display_config:', organization.footer_display_config);
    
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
      phone: true
    };
    
    console.log('Final headerConfig being used:', headerConfig);
    console.log('Final footerConfig being used:', footerConfig);
    console.log('=== END ARABICPDFRENDERER CONFIG DEBUG ===');

    return `
<!DOCTYPE html>
<html dir="ltr" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation</title>
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
            width: 794px; /* Full A4 width */
            height: 1123px; /* Full A4 height - fixed height */
            background: white;
            box-sizing: border-box;
            position: relative; /* For absolute positioning */
        }
        
        /* Professional letterhead header - Absolute top */
        .letterhead {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            border: 2px solid #333;
            border-top: none; /* Touch top edge */
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 80px;
            background: white;
            z-index: 10;
        }
        
        /* Main content area */
        .main-content {
            margin-top: 110px; /* Space for header */
            margin-bottom: 80px; /* Space for footer */
            padding: 20px;
            min-height: calc(100% - 190px); /* Remaining space */
        }
        
        /* Left side - English company info */
        .english-company {
            flex: 1;
            text-align: left;
        }
        
        /* Center - Logo or main title */
        .center-logo {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
        }
        
        /* Right side - Arabic company info */
        .arabic-company {
            flex: 1;
            text-align: right;
            direction: rtl;
            font-family: 'Noto Sans Arabic', Arial, sans-serif;
        }
        
        .quotation-title {
            text-align: center;
            margin: 0 0 15px 0; /* Remove top margin */
            padding: 10px;
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
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #333;
        }
        
        .quote-left {
            text-align: left;
        }
        
        .quote-right {
            text-align: right;
        }
        
        .customer-section {
            margin-bottom: 15px;
            padding: 10px 0;
            border-bottom: 1px solid #ddd;
        }
        
        .quotation-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            font-size: 10px;
        }
        
        .items-section {
            margin-bottom: 12px;
        }
        
        .items-header {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #333;
        }
        
        /* Professional table styling */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
            border: 2px solid #333;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
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
        
        /* Professional summary section */
        .summary {
            margin-top: 20px;
            margin-bottom: 20px;
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
        
        /* Professional footer - Absolute bottom */
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 15px;
            border: 2px solid #333;
            border-bottom: none; /* Touch bottom edge */
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
                <div>${quotation.customer_name}</div>
                <div><strong>Quote #:</strong> ${quotation.quotation_number}</div>
            </div>
            <div class="quote-right">
                <div><strong>Date:</strong> ${new Date(quotation.date).toLocaleDateString()}</div>
                <div><strong>Currency:</strong> ${quotation.currency}</div>
            </div>
        </div>
    
        <!-- Professional Items Table -->
        <div class="items-section">
            <table class="items-table">
                <thead>
                    <tr>
                        <th style="width: 6%;">Sr#</th>
                        <th style="width: 35%;">Descriptions</th>
                        <th style="width: 10%;">Qty</th>
                        <th style="width: 12%;">Rate</th>
                        <th style="width: 8%;">Discount %</th>
                        <th style="width: 10%;">VAT %</th>
                        <th style="width: 12%;">VAT Amount</th>
                        <th style="width: 12%;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map((item, index) => `
                        <tr>
                            <td style="text-align: center;">${index + 1}</td>
                            <td>${item.name}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${quotation.currency} ${item.unitPrice.toFixed(2)}</td>
                            <td style="text-align: center;">${item.discountPercentage || 0}%</td>
                            <td style="text-align: center;">${item.vatPercentage}%</td>
                            <td style="text-align: right;">${quotation.currency} ${item.vatAmount.toFixed(2)}</td>
                            <td style="text-align: right;">${quotation.currency} ${item.totalPrice.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Professional Summary Table -->
        <div class="summary clearfix">
            <table class="summary-table">
                <tr>
                    <td class="summary-label">Sub Total:</td>
                    <td class="summary-value">${quotation.currency} ${financials.subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="summary-label">VAT (${quotation.tax_rate}%):</td>
                    <td class="summary-value">${quotation.currency} ${financials.totalVat.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td class="summary-label">Total:</td>
                    <td class="summary-value">${quotation.currency} ${financials.grandTotal.toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                    <td class="summary-label arabic-text">المجموع:</td>
                    <td class="summary-value">${quotation.currency} ${financials.grandTotal.toFixed(2)}</td>
                </tr>
            </table>
        </div>
        
        <!-- Terms & Conditions Section -->
        ${quotation.terms_conditions ? `
        <div class="terms-section" style="margin-top: 25px; page-break-inside: avoid; background-color: #f8fafc; border: 1px solid #cbd5e0; border-left: 3.5px solid #2b6cb0; border-radius: 4px; padding: 10px 14px;">
            <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #2b6cb0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                Terms & Conditions
            </h3>
            <div style="font-size: 10px; line-height: 1.5; color: #2d3748;">
                ${formatTermsToHtml(quotation.terms_conditions)}
            </div>
        </div>
        ` : ''}

        <!-- Notes / Special Instructions -->
        ${quotation.notes ? `
        <div class="notes-section" style="margin-top: 15px; page-break-inside: avoid; background-color: #f8fafc; border: 1px solid #cbd5e0; border-left: 3.5px solid #4a5568; border-radius: 4px; padding: 10px 14px;">
            <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #4a5568; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                Notes & Special Instructions
            </h3>
            <div style="font-size: 10px; line-height: 1.5; color: #2d3748;">
                ${formatTermsToHtml(quotation.notes)}
            </div>
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
        </div>
    </div>
</body>
</html>
    `;
  }

  async generatePDF(action: 'download' | 'print' = 'download'): Promise<void> {
    try {
      console.log('Generating PDF with proper Arabic text from database...');
      console.log('Arabic company name from database:', this.data.organization.name_arabic);
      console.log('Arabic address from database:', this.data.organization.address_arabic);
      console.log('Logo URL from database:', this.data.organization.logo_url);
      console.log('Header display config:', this.data.organization.header_display_config);
      console.log('Footer display config:', this.data.organization.footer_display_config);

      // Create a temporary container for the HTML content
      const container = document.createElement('div');
      container.innerHTML = this.createHTMLContent();
      container.style.position = 'absolute';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.width = '794px'; // Full A4 width in pixels at 96 DPI
      container.style.height = 'auto';
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
        width: 794, // A4 width in pixels at 96 DPI
        height: container.scrollHeight, // Dynamic height based on content
        scrollX: 0,
        scrollY: 0,
        logging: false, // Disable html2canvas logging
        removeContainer: true
      });

      // Remove the temporary container
      document.body.removeChild(container);

      // Create PDF from canvas
      console.log('Creating PDF from canvas...');
      const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate proper scaling to fit content
      const canvasAspectRatio = canvas.height / canvas.width;
      
      let imgWidth = pdfWidth;
      let imgHeight = pdfWidth * canvasAspectRatio;
      
      // If content is taller than A4, scale it to fit
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight / canvasAspectRatio;
      }
      
      // Center the image on the page
      const offsetX = (pdfWidth - imgWidth) / 2;
      const offsetY = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', offsetX, offsetY, imgWidth, imgHeight);

      // Generate PDF based on action
      if (action === 'download') {
        const fileName = `quotation-${this.data.quotation.quotation_number}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        console.log('PDF downloaded successfully with Arabic text');
      } else if (action === 'print') {
        // Enhanced print implementation - prevent auto-close
        try {
          // Method 1: Create blob and object URL
          const pdfBlob = pdf.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          // Open in new window with specific features
          const printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
          
          if (printWindow) {
            // Wait longer for PDF to fully load
            printWindow.addEventListener('load', () => {
              setTimeout(() => {
                printWindow.print();
                console.log('Print dialog opened - window will remain open');
                
                // Don't auto-close - let user control the window
                // Only clean up URL after longer delay to ensure printing completes
                setTimeout(() => {
                  URL.revokeObjectURL(pdfUrl);
                }, 5000); // 5 seconds instead of 1 second
                
              }, 1000); // Wait 1 second for PDF to render
            });
            
            // Fallback: if load event doesn't fire, still try to print
            setTimeout(() => {
              if (printWindow && !printWindow.closed) {
                printWindow.print();
              }
            }, 2000);
            
            console.log('PDF opened for printing with Arabic text - window will stay open');
          } else {
            // Fallback: if popup blocked, try iframe method
            console.log('Popup blocked, trying iframe method...');
            const pdfDataUri = pdf.output('datauristring');
            const printFrame = document.createElement('iframe');
            printFrame.style.position = 'fixed';
            printFrame.style.right = '0';
            printFrame.style.bottom = '0';
            printFrame.style.width = '0';
            printFrame.style.height = '0';
            printFrame.style.border = '0';
            printFrame.src = pdfDataUri;
            
            document.body.appendChild(printFrame);
            
            printFrame.onload = () => {
              setTimeout(() => {
                printFrame.contentWindow?.print();
                // Remove iframe after printing
                setTimeout(() => {
                  document.body.removeChild(printFrame);
                }, 3000);
              }, 500);
            };
          }
        } catch (printError) {
          console.error('Print error:', printError);
          // Final fallback: download instead
          const fileName = `quotation-${this.data.quotation.quotation_number}-print.pdf`;
          pdf.save(fileName);
          console.log('Print failed, downloaded PDF instead');
        }
      }

    } catch (error) {
      console.error('Error generating PDF with Arabic support:', error);
      throw error;
    }
  }
}

