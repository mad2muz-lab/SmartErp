/**
 * QR Code Generator for ZATCA Compliance
 */

import QRCode from 'qrcode';

export interface ZATCAQRData {
  seller_name: string;
  seller_tax_id: string;
  invoice_date: string;
  invoice_total: number;
  vat_total: number;
  invoice_hash: string;
  invoice_number?: string;
  customer_tax_id?: string;
}

/**
 * Generate QR code data string for ZATCA compliance
 */
export function generateZATCAQRDataString(data: ZATCAQRData): string {
  // ZATCA requires specific format for QR code data
  const qrData = {
    seller_name: data.seller_name,
    seller_tax_id: data.seller_tax_id,
    invoice_date: data.invoice_date,
    invoice_total: data.invoice_total,
    vat_total: data.vat_total,
    invoice_hash: data.invoice_hash
  };
  
  return JSON.stringify(qrData);
}

/**
 * Generate QR code as base64 image
 */
export async function generateQRCodeBase64(data: ZATCAQRData, options?: {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}): Promise<string> {
  try {
    const qrDataString = generateZATCAQRDataString(data);
    
    const qrOptions = {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const
    };
    
    const qrCodeBase64 = await QRCode.toDataURL(qrDataString, qrOptions);
    return qrCodeBase64;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(data: ZATCAQRData, options?: {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}): Promise<string> {
  try {
    const qrDataString = generateZATCAQRDataString(data);
    
    const qrOptions = {
      width: options?.width || 200,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || '#000000',
        light: options?.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const
    };
    
    const qrCodeSVG = await QRCode.toString(qrDataString, { 
      ...qrOptions, 
      type: 'svg' 
    });
    return qrCodeSVG;
  } catch (error) {
    console.error('QR code SVG generation error:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

/**
 * Generate QR code HTML element
 */
export async function generateQRCodeHTML(data: ZATCAQRData, options?: {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  className?: string;
}): Promise<string> {
  try {
    const qrCodeBase64 = await generateQRCodeBase64(data, options);
    
    return `
      <div class="qr-code-container ${options?.className || ''}" style="text-align: center;">
        <img src="${qrCodeBase64}" 
             alt="ZATCA QR Code" 
             style="width: ${options?.width || 200}px; height: ${options?.width || 200}px; border: 1px solid #ddd; border-radius: 4px;" />
        <div style="font-size: 10px; color: #666; margin-top: 5px;">
          ZATCA QR Code / رمز الاستجابة السريعة
        </div>
      </div>
    `;
  } catch (error) {
    console.error('QR code HTML generation error:', error);
    return `
      <div class="qr-code-placeholder" style="text-align: center; padding: 20px; border: 2px dashed #ccc; border-radius: 4px;">
        <div style="font-size: 12px; color: #666;">
          QR Code Generation Failed<br>
          رمز الاستجابة السريعة فشل في التوليد
        </div>
      </div>
    `;
  }
}

/**
 * Generate QR code for invoice with proper ZATCA data
 */
export async function generateInvoiceQRCode(invoice: any): Promise<{
  qrCodeHTML: string;
  qrCodeBase64: string;
  qrDataString: string;
}> {
  try {
    // Prepare ZATCA QR data
    const qrData: ZATCAQRData = {
      seller_name: invoice.organization_name || 'TradingERP System',
      seller_tax_id: invoice.organization_tax_id || '300000000000003',
      invoice_date: invoice.invoice_date || new Date().toISOString(),
      invoice_total: invoice.grand_total || 0,
      vat_total: invoice.total_vat || 0,
      invoice_hash: invoice.invoice_hash || generateInvoiceHash(invoice),
      invoice_number: invoice.invoice_number || invoice._id,
      customer_tax_id: invoice.customer_tax_id
    };
    
    // Generate QR code components
    const qrCodeHTML = await generateQRCodeHTML(qrData, {
      width: 120,
      margin: 1,
      color: {
        dark: '#2c5aa0',
        light: '#FFFFFF'
      },
      className: 'zatca-qr-code'
    });
    
    const qrCodeBase64 = await generateQRCodeBase64(qrData, {
      width: 120,
      margin: 1,
      color: {
        dark: '#2c5aa0',
        light: '#FFFFFF'
      }
    });
    
    const qrDataString = generateZATCAQRDataString(qrData);
    
    return {
      qrCodeHTML,
      qrCodeBase64,
      qrDataString
    };
  } catch (error) {
    console.error('Invoice QR code generation error:', error);
    throw new Error('Failed to generate invoice QR code');
  }
}

/**
 * Generate simple invoice hash for ZATCA compliance
 */
function generateInvoiceHash(invoice: any): string {
  const hashData = {
    invoice_number: invoice.invoice_number || invoice._id,
    invoice_date: invoice.invoice_date,
    supplier_tax_id: invoice.organization_tax_id || '300000000000003',
    customer_tax_id: invoice.customer_tax_id,
    grand_total: invoice.grand_total || 0,
    vat_amount: invoice.total_vat || 0
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
