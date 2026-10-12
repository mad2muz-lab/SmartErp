/**
 * ZATCA-Compliant PDF Generator
 * Generates proper PDF invoices that comply with ZATCA regulations
 */

import { generateZATCAInvoiceHTML, convertToZATCAFormat, generateZATCAQRCodeData, generateInvoiceHash, ZATCAInvoiceData } from './zatcaCompliance';
import { generateProfessionalZATCAInvoiceHTML, convertToProfessionalZATCAFormat, ProfessionalInvoiceData } from './professionalZATCAInvoice';
import { generateCleanProfessionalInvoiceHTML, convertToCleanInvoiceFormat, CleanInvoiceData } from './cleanProfessionalInvoice';
import { generateZATCACompliantInvoiceHTML, convertToZATCACompliantFormat, ZATCACompliantInvoiceData } from './zatcaCompliantInvoice';
import { generateQuotationStyleInvoiceHTML, convertToQuotationStyleFormat, QuotationStyleInvoiceData } from './quotationStyleInvoice';

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  quality?: 'low' | 'medium' | 'high';
}

/**
 * Generate ZATCA-compliant PDF from invoice data
 */
export async function generateZATCAPDF(
  invoice: any,
  options: PDFGenerationOptions = {}
): Promise<{
  success: boolean;
  pdfBlob?: Blob;
  htmlContent?: string;
  error?: string;
}> {
  try {
    // Convert invoice to ZATCA format
    const zatcaData = convertToZATCAFormat(invoice);
    
    // Generate hash and QR code data
    zatcaData.invoice_hash = generateInvoiceHash(zatcaData);
    zatcaData.qr_code_data = generateZATCAQRCodeData(zatcaData);
    
    // Generate ZATCA-compliant HTML
    const htmlContent = generateZATCAInvoiceHTML(zatcaData);
    
    // Try to generate PDF using browser's print functionality
    const pdfBlob = await htmlToPDF(htmlContent, options);
    
    return {
      success: true,
      pdfBlob,
      htmlContent
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate Professional ZATCA-compliant PDF from invoice data
 */
export async function generateProfessionalZATCAPDF(
  invoice: any,
  options: PDFGenerationOptions = {}
): Promise<{
  success: boolean;
  pdfBlob?: Blob;
  htmlContent?: string;
  error?: string;
}> {
  try {
    // Convert invoice to professional ZATCA format
    const professionalData = convertToProfessionalZATCAFormat(invoice);
    
    // Generate hash and QR code data
    professionalData.invoice_hash = generateInvoiceHash(professionalData);
    professionalData.qr_code_data = generateZATCAQRCodeData(professionalData);
    
    // Generate professional ZATCA-compliant HTML with QR code
    const htmlContent = await generateProfessionalZATCAInvoiceHTML(professionalData);
    
    // Try to generate PDF using browser's print functionality
    const pdfBlob = await htmlToPDF(htmlContent, options);
    
    return {
      success: true,
      pdfBlob,
      htmlContent
    };
  } catch (error) {
    console.error('Professional PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate Clean Professional Invoice PDF (based on quotation format)
 */
export function generateCleanProfessionalInvoicePDF(
  invoice: any,
  options: PDFGenerationOptions = {}
): Promise<{
  success: boolean;
  pdfBlob?: Blob;
  htmlContent?: string;
  error?: string;
}> {
  try {
    // Convert invoice to clean professional format
    const cleanData = convertToCleanInvoiceFormat(invoice);
    
    // Generate clean professional HTML
    const htmlContent = generateCleanProfessionalInvoiceHTML(cleanData);
    
    // Try to generate PDF using browser's print functionality
    const pdfBlob = htmlToPDF(htmlContent, options);
    
    return Promise.resolve({
      success: true,
      pdfBlob,
      htmlContent
    });
  } catch (error) {
    console.error('Clean professional PDF generation error:', error);
    return Promise.resolve({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Generate Truly ZATCA-Compliant Invoice PDF
 */
export async function generateTrulyZATCACompliantInvoicePDF(
  invoice: any,
  options: PDFGenerationOptions = {}
): Promise<{
  success: boolean;
  pdfBlob?: Blob;
  htmlContent?: string;
  error?: string;
}> {
  try {
    // Convert invoice to ZATCA compliant format
    const zatcaData = convertToZATCACompliantFormat(invoice);
    
    // Generate ZATCA compliant HTML with QR code
    const htmlContent = await generateZATCACompliantInvoiceHTML(zatcaData);
    
    // Try to generate PDF using browser's print functionality
    const pdfBlob = await htmlToPDF(htmlContent, options);
    
    return {
      success: true,
      pdfBlob,
      htmlContent
    };
  } catch (error) {
    console.error('ZATCA compliant PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Convert HTML to PDF using browser's print functionality
 */
async function htmlToPDF(htmlContent: string, options: PDFGenerationOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        reject(new Error('Unable to open print window'));
        return;
      }

      // Write HTML content to the window
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to load
      printWindow.onload = () => {
        try {
          // Add print styles
          const printStyles = `
            <style>
              @media print {
                body { margin: 0; }
                .invoice-container { box-shadow: none; }
                @page {
                  size: ${options.format || 'A4'} ${options.orientation || 'portrait'};
                  margin: ${options.margin?.top || 20}mm ${options.margin?.right || 20}mm ${options.margin?.bottom || 20}mm ${options.margin?.left || 20}mm;
                }
              }
            </style>
          `;
          printWindow.document.head.insertAdjacentHTML('beforeend', printStyles);

          // Trigger print dialog
          printWindow.print();
          
          // Close window after printing
          setTimeout(() => {
            printWindow.close();
          }, 1000);

          // For now, return the HTML content as a blob
          // In a real implementation, you would capture the PDF from the print dialog
          const blob = new Blob([htmlContent], { type: 'text/html' });
          resolve(blob);
        } catch (error) {
          printWindow.close();
          reject(error);
        }
      };

      printWindow.onerror = () => {
        printWindow.close();
        reject(new Error('Error loading print window'));
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Download ZATCA-compliant PDF
 */
export async function downloadZATCAPDF(
  invoice: any,
  filename?: string,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateZATCAPDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Generate filename
    const invoiceNumber = invoice.invoice_number || invoice._id;
    const defaultFilename = `ZATCA-Invoice-${invoiceNumber}.html`;
    const finalFilename = filename || defaultFilename;

    // Create download link
    if (result.pdfBlob) {
      const url = URL.createObjectURL(result.pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (result.htmlContent) {
      // Fallback to HTML download
      const blob = new Blob([result.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    };
  }
}

/**
 * Download Professional ZATCA-compliant PDF
 */
export async function downloadProfessionalZATCAPDF(
  invoice: any,
  filename?: string,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateProfessionalZATCAPDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Generate filename
    const invoiceNumber = invoice.invoice_number || invoice._id;
    const defaultFilename = `Professional-ZATCA-Invoice-${invoiceNumber}.html`;
    const finalFilename = filename || defaultFilename;

    // Create download link
    if (result.pdfBlob) {
      const url = URL.createObjectURL(result.pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (result.htmlContent) {
      // Fallback to HTML download
      const blob = new Blob([result.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { success: true };
  } catch (error) {
    console.error('Professional download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    };
  }
}

/**
 * Download Clean Professional Invoice PDF
 */
export async function downloadCleanProfessionalInvoicePDF(
  invoice: any,
  filename?: string,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateCleanProfessionalInvoicePDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Generate filename
    const invoiceNumber = invoice.invoice_number || invoice._id;
    const defaultFilename = `Clean-Invoice-${invoiceNumber}.html`;
    const finalFilename = filename || defaultFilename;

    // Create download link - prioritize HTML content
    if (result.htmlContent) {
      // Use HTML content for download
      const blob = new Blob([result.htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (result.pdfBlob) {
      // Fallback to PDF blob if available
      const url = URL.createObjectURL(result.pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { success: true };
  } catch (error) {
    console.error('Clean professional download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    };
  }
}

/**
 * Preview ZATCA-compliant invoice in new window
 */
export async function previewZATCAInvoice(
  invoice: any,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateZATCAPDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Open in new window for preview
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      return {
        success: false,
        error: 'Unable to open preview window'
      };
    }

    previewWindow.document.write(result.htmlContent || '');
    previewWindow.document.close();

    return { success: true };
  } catch (error) {
    console.error('Preview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed'
    };
  }
}

/**
 * Preview Professional ZATCA-compliant invoice in new window
 */
export async function previewProfessionalZATCAInvoice(
  invoice: any,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateProfessionalZATCAPDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Open in new window for preview
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      return {
        success: false,
        error: 'Unable to open preview window'
      };
    }

    previewWindow.document.write(result.htmlContent || '');
    previewWindow.document.close();

    return { success: true };
  } catch (error) {
    console.error('Professional preview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed'
    };
  }
}

/**
 * Preview Clean Professional Invoice in new window
 */
export async function previewCleanProfessionalInvoice(
  invoice: any,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateCleanProfessionalInvoicePDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Open in new window for preview
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      return {
        success: false,
        error: 'Unable to open preview window'
      };
    }

    previewWindow.document.write(result.htmlContent || '');
    previewWindow.document.close();

    return { success: true };
  } catch (error) {
    console.error('Clean professional preview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed'
    };
  }
}

/**
 * Download Truly ZATCA-Compliant Invoice PDF
 */
export async function downloadTrulyZATCACompliantInvoicePDF(
  invoice: any,
  filename?: string,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateTrulyZATCACompliantInvoicePDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Generate filename
    const invoiceNumber = invoice.invoice_number || invoice._id;
    const defaultFilename = `ZATCA-Compliant-Invoice-${invoiceNumber}.html`;
    const finalFilename = filename || defaultFilename;

    // Create download link - prioritize HTML content
    if (result.htmlContent) {
      // Use HTML content for download
      const blob = new Blob([result.htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (result.pdfBlob) {
      // Fallback to PDF blob if available
      const url = URL.createObjectURL(result.pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { success: true };
  } catch (error) {
    console.error('ZATCA compliant download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    };
  }
}

/**
 * Preview Truly ZATCA-Compliant Invoice in new window
 */
export async function previewTrulyZATCACompliantInvoice(
  invoice: any,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateTrulyZATCACompliantInvoicePDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Open in new window for preview
    const previewWindow = window.open('', '_blank');
    if (!previewWindow) {
      return {
        success: false,
        error: 'Unable to open preview window'
      };
    }

    previewWindow.document.write(result.htmlContent || '');
    previewWindow.document.close();

    return { success: true };
  } catch (error) {
    console.error('ZATCA compliant preview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed'
    };
  }
}

/**
 * Generate Quotation-Style ZATCA-Compliant Invoice PDF
 */
export async function generateQuotationStyleZATCAInvoicePDF(
  invoice: any,
  options: PDFGenerationOptions = {}
): Promise<{
  success: boolean;
  pdfBlob?: Blob;
  htmlContent?: string;
  error?: string;
}> {
  try {
    // Convert invoice to quotation-style format
    const quotationStyleData = convertToQuotationStyleFormat(invoice);
    
    // Generate quotation-style HTML with QR code
    const htmlContent = await generateQuotationStyleInvoiceHTML(quotationStyleData);
    
    // Try to generate PDF using browser's print functionality
    const pdfBlob = await htmlToPDF(htmlContent, options);
    
    return {
      success: true,
      pdfBlob,
      htmlContent
    };
  } catch (error) {
    console.error('Quotation-style ZATCA PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Download Quotation-Style ZATCA-Compliant Invoice PDF
 */
export async function downloadQuotationStyleZATCAInvoicePDF(
  invoice: any,
  filename?: string,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateQuotationStyleZATCAInvoicePDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Generate filename
    const invoiceNumber = invoice.invoice_number || invoice._id;
    const defaultFilename = `Quotation-Style-Invoice-${invoiceNumber}.html`;
    const finalFilename = filename || defaultFilename;

    // Create download link - prioritize HTML content
    if (result.htmlContent) {
      // Use HTML content for download
      const blob = new Blob([result.htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (result.pdfBlob) {
      // Fallback to PDF blob if available
      const url = URL.createObjectURL(result.pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return { success: true };
  } catch (error) {
    console.error('Quotation-style ZATCA download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed'
    };
  }
}

/**
 * Preview Quotation-Style ZATCA-Compliant Invoice in new window
 */
export async function previewQuotationStyleZATCAInvoice(
  invoice: any,
  options?: PDFGenerationOptions
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await generateQuotationStyleZATCAInvoicePDF(invoice, options);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    // Try multiple approaches to open preview window
    let previewWindow = null;
    
    // Method 1: Try opening with user gesture
    try {
      previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    } catch (error) {
      console.warn('Method 1 failed:', error);
    }
    
    // Method 2: If first method failed, try with different parameters
    if (!previewWindow) {
      try {
        previewWindow = window.open('', '_blank');
      } catch (error) {
        console.warn('Method 2 failed:', error);
      }
    }
    
    // Method 3: If still failed, try creating a blob URL
    if (!previewWindow) {
      try {
        const blob = new Blob([result.htmlContent || ''], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        previewWindow = window.open(url, '_blank');
        // Clean up the URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        console.warn('Method 3 failed:', error);
      }
    }
    
    if (!previewWindow) {
      return {
        success: false,
        error: 'Unable to open preview window. Please allow popups for this site or try downloading the invoice instead.'
      };
    }

    try {
      previewWindow.document.write(result.htmlContent || '');
      previewWindow.document.close();
      
      // Focus the new window
      previewWindow.focus();
    } catch (error) {
      previewWindow.close();
      return {
        success: false,
        error: 'Error writing content to preview window'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Quotation-style ZATCA preview error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Preview failed'
    };
  }
}

/**
 * Generate ZATCA-compliant invoice data for API submission
 */
export function generateZATCAInvoiceData(invoice: any): {
  zatcaData: ZATCAInvoiceData;
  xmlData: string;
  qrCodeData: string;
  hash: string;
} {
  const zatcaData = convertToZATCAFormat(invoice);
  const hash = generateInvoiceHash(zatcaData);
  const qrCodeData = generateZATCAQRCodeData(zatcaData);
  
  // Generate basic XML structure (simplified for now)
  const xmlData = generateBasicUBLXML(zatcaData, hash);
  
  return {
    zatcaData,
    xmlData,
    qrCodeData,
    hash
  };
}

/**
 * Generate basic UBL XML structure for ZATCA compliance
 */
function generateBasicUBLXML(data: ZATCAInvoiceData, hash: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>${data.invoice_number}</cbc:ID>
  <cbc:IssueDate>${data.invoice_date.split('T')[0]}</cbc:IssueDate>
  <cbc:InvoiceTypeCode>388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.supplier_name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.supplier_address}</cbc:StreetName>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:ID>${data.supplier_tax_id}</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${data.customer_name}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${data.customer_address}</cbc:StreetName>
      </cac:PostalAddress>
      ${data.customer_tax_id ? `
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:ID>${data.customer_tax_id}</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      ` : ''}
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  ${data.items.map((item, index) => `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${item.unit}">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="SAR">${item.line_total}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Description>${item.item_name}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="SAR">${item.unit_price}</cbc:PriceAmount>
    </cac:Price>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="SAR">${item.vat_amount}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="SAR">${item.line_total}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="SAR">${item.vat_amount}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
            <cbc:Percent>${item.vat_rate}</cbc:Percent>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
  </cac:InvoiceLine>
  `).join('')}
  
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${data.vat_amount}</cbc:TaxAmount>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${data.subtotal}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${data.subtotal}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${data.grand_total}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${data.grand_total}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- ZATCA Compliance Fields -->
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  
  <!-- Digital Hash for ZATCA -->
  <cac:AdditionalDocumentReference>
    <cbc:ID>${hash}</cbc:ID>
    <cbc:DocumentTypeCode>130</cbc:DocumentTypeCode>
  </cac:AdditionalDocumentReference>
</Invoice>`;
}
