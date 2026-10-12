/**
 * ZATCA Offline In-Memory QR Code Generator
 * 
 * Generates official ZATCA QR codes completely in-memory using local libraries.
 * Zero external API calls, 100% offline-ready, compliant with Saudi data sovereignty rules.
 */

import QRCode from 'qrcode';
import { ZatcaTLVData } from '../types/zatca.types';
import { generateZatcaTLVBase64 } from './tlvEncoder';

export interface QRCodeOptions {
  width?: number; // Default: 200px
  margin?: number; // Default: 1 (ZATCA recommends minimal quiet zone for thermal printers)
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Default: 'M' (ZATCA standard recommendation)
}

/**
 * Generates a Base64 Data URL (PNG) for an invoice QR code
 * Returns: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
 */
export async function generateZatcaQRCodeDataURL(
  data: ZatcaTLVData,
  options?: QRCodeOptions
): Promise<string> {
  const tlvBase64 = generateZatcaTLVBase64(data);
  
  return QRCode.toDataURL(tlvBase64, {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    margin: options?.margin ?? 1,
    width: options?.width ?? 200,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

/**
 * Generates an SVG string representation of the QR code
 * Ideal for thermal printers and crisp vector PDF rendering
 */
export async function generateZatcaQRCodeSVG(
  data: ZatcaTLVData,
  options?: QRCodeOptions
): Promise<string> {
  const tlvBase64 = generateZatcaTLVBase64(data);
  
  return QRCode.toString(tlvBase64, {
    type: 'svg',
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    margin: options?.margin ?? 1,
    width: options?.width ?? 200
  });
}

/**
 * Helper to generate QR from raw invoice fields directly
 */
export async function generateInvoiceQR(params: {
  sellerName: string;
  sellerVat: string;
  invoiceDate: string; // YYYY-MM-DD
  invoiceTime: string; // HH:mm:ss
  totalWithVat: number;
  vatTotal: number;
  // Optional Phase 2 parameters
  invoiceHash?: string;
  digitalSignature?: string;
  publicKey?: string;
  zatcaStamp?: string;
}): Promise<{ base64Tlv: string; qrDataUrl: string }> {
  // Format timestamp to ISO 8601 UTC
  const cleanDate = params.invoiceDate.trim();
  const cleanTime = params.invoiceTime.trim().length === 5 
    ? `${params.invoiceTime.trim()}:00` 
    : params.invoiceTime.trim();
  const timestamp = `${cleanDate}T${cleanTime}Z`;

  const tlvData: ZatcaTLVData = {
    sellerName: params.sellerName,
    vatNumber: params.sellerVat,
    timestamp,
    totalWithVat: params.totalWithVat,
    vatTotal: params.vatTotal,
    invoiceHash: params.invoiceHash,
    digitalSignature: params.digitalSignature,
    publicKey: params.publicKey,
    zatcaStamp: params.zatcaStamp
  };

  const base64Tlv = generateZatcaTLVBase64(tlvData);
  const qrDataUrl = await generateZatcaQRCodeDataURL(tlvData);

  return { base64Tlv, qrDataUrl };
}
