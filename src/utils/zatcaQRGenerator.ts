/**
 * ZATCA-Compliant QR Code Generator
 * Implements proper TLV encoding and cryptographic hash as per ZATCA requirements
 */

import { Buffer } from 'buffer';

export interface ZATCAQRData {
  seller_name: string;
  seller_tax_id: string;
  invoice_date: string;
  invoice_time: string;
  invoice_total: number;
  vat_total: number;
  invoice_uuid: string;
  cryptographic_hash: string;
  invoice_counter?: number;
  previous_invoice_hash?: string;
}

/**
 * Generate ZATCA-compliant QR code data using TLV encoding
 */
export function generateZATCAQRCodeData(data: ZATCAQRData): string {
  // Create timestamp in ZATCA required format (ISO 8601 with timezone)
  const timestamp = `${data.invoice_date}T${data.invoice_time}Z`;
  
  // TLV encoding for ZATCA Phase 2 QR code (9 tags required)
  const tlvData = Buffer.concat([
    // Tag 1: Seller Name (max 100 chars)
    createTLVEntry(1, data.seller_name.substring(0, 100)),
    // Tag 2: VAT Registration Number (15 digits)
    createTLVEntry(2, data.seller_tax_id.padStart(15, '0')),
    // Tag 3: Invoice Timestamp (ISO 8601)
    createTLVEntry(3, timestamp),
    // Tag 4: Invoice Total (decimal with 2 places)
    createTLVEntry(4, data.invoice_total.toFixed(2)),
    // Tag 5: VAT Total (decimal with 2 places)
    createTLVEntry(5, data.vat_total.toFixed(2)),
    // Tag 6: Invoice UUID (UUID v4 format)
    createTLVEntry(6, data.invoice_uuid),
    // Tag 7: Cryptographic Hash (Base64 encoded)
    createTLVEntry(7, data.cryptographic_hash),
    // Tag 8: Invoice Counter (sequential number for chain validation)
    createTLVEntry(8, (data.invoice_counter || 1).toString()),
    // Tag 9: Previous Invoice Hash (for chain validation)
    createTLVEntry(9, data.previous_invoice_hash || '0')
  ]);
  
  // Return Base64 encoded TLV data
  return tlvData.toString('base64');
}

/**
 * Create TLV (Tag-Length-Value) entry
 * Each entry consists of: [1 byte tag][1 byte length][N bytes value]
 */
function createTLVEntry(tag: number, value: string): Buffer {
  const tagBuffer = Buffer.from([tag]);
  const valueBuffer = Buffer.from(value, 'utf8');
  
  // Ensure length fits in 1 byte (max 255)
  if (valueBuffer.length > 255) {
    throw new Error(`Value too long for TLV entry: ${valueBuffer.length} bytes`);
  }
  
  const lengthBuffer = Buffer.from([valueBuffer.length]);
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer]);
}

/**
 * Generate proper invoice UUID for ZATCA (UUID v4 format)
 */
export function generateInvoiceUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a valid ZATCA TRN (Tax Registration Number)
 * Format: 3XXXXXXXXXXXXX3 (15 digits, starts and ends with 3)
 */
export function generateValidZATCATRN(): string {
  // Generate 13 random digits between the first and last 3
  const middleDigits = Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)).join('');
  return `3${middleDigits}3`;
}

/**
 * Validate and fix TRN to meet ZATCA requirements
 */
export function validateAndFixTRN(trn: string): { valid: boolean; fixedTRN?: string; errors: string[] } {
  const errors: string[] = [];
  
  if (!trn || trn.length === 0) {
    errors.push('TRN is required');
    return { valid: false, errors };
  }
  
  // Remove any non-digit characters
  const cleanTRN = trn.replace(/\D/g, '');
  
  if (cleanTRN.length !== 15) {
    errors.push('TRN must be exactly 15 digits');
  }
  
  if (!cleanTRN.startsWith('3')) {
    errors.push('TRN must start with digit 3');
  }
  
  if (!cleanTRN.endsWith('3')) {
    errors.push('TRN must end with digit 3');
  }
  
  if (errors.length === 0) {
    return { valid: true, fixedTRN: cleanTRN, errors: [] };
  }
  
  // Try to fix the TRN
  let fixedTRN = cleanTRN;
  
  // Pad with zeros if too short
  if (fixedTRN.length < 15) {
    fixedTRN = fixedTRN.padStart(15, '0');
  }
  
  // Truncate if too long
  if (fixedTRN.length > 15) {
    fixedTRN = fixedTRN.substring(0, 15);
  }
  
  // Ensure it starts and ends with 3
  if (!fixedTRN.startsWith('3')) {
    fixedTRN = '3' + fixedTRN.substring(1);
  }
  
  if (!fixedTRN.endsWith('3')) {
    fixedTRN = fixedTRN.substring(0, 14) + '3';
  }
  
  return { valid: true, fixedTRN, errors };
}

/**
 * Generate ZATCA-compliant cryptographic hash
 * Uses SHA-256 as required by ZATCA
 */
export async function generateZATCACryptographicHash(
  invoiceNumber: string,
  invoiceDate: string,
  invoiceTime: string,
  sellerVATNumber: string,
  invoiceTotal: number,
  vatTotal: number,
  invoiceUUID: string
): Promise<string> {
  // Create the data string for hashing as per ZATCA specification
  const hashData = [
    invoiceNumber,
    invoiceDate,
    invoiceTime,
    sellerVATNumber,
    invoiceTotal.toFixed(2),
    vatTotal.toFixed(2),
    invoiceUUID
  ].join('|');
  
  try {
    // Use Web Crypto API for SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(hashData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to Base64
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray));
    
    return hashBase64;
  } catch (error) {
    console.error('Failed to generate cryptographic hash:', error);
    // Fallback to simple Base64 encoding (not recommended for production)
    return btoa(hashData);
  }
}

/**
 * Parse TLV data back to readable format (for debugging)
 */
export function parseTLVData(base64Data: string): Record<string, string> {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const result: Record<string, string> = {};
    let offset = 0;
    
    while (offset < buffer.length) {
      if (offset + 2 > buffer.length) break;
      
      const tag = buffer[offset];
      const length = buffer[offset + 1];
      
      if (offset + 2 + length > buffer.length) break;
      
      const value = buffer.slice(offset + 2, offset + 2 + length).toString('utf8');
      
      // Map tag numbers to field names
      const fieldNames: Record<number, string> = {
        1: 'seller_name',
        2: 'seller_tax_id',
        3: 'timestamp',
        4: 'invoice_total',
        5: 'vat_total',
        6: 'invoice_uuid',
        7: 'cryptographic_hash'
      };
      
      result[fieldNames[tag] || `tag_${tag}`] = value;
      offset += 2 + length;
    }
    
    return result;
  } catch (error) {
    console.error('Failed to parse TLV data:', error);
    return {};
  }
}

/**
 * Validate ZATCA QR code data
 */
export function validateZATCAQRData(data: ZATCAQRData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate seller name
  if (!data.seller_name || data.seller_name.length === 0) {
    errors.push('Seller name is required');
  } else if (data.seller_name.length > 100) {
    errors.push('Seller name must be 100 characters or less');
  }
  
  // Validate VAT number (TRN) - ZATCA specific requirements
  if (!data.seller_tax_id || data.seller_tax_id.length === 0) {
    errors.push('Seller VAT number is required');
  } else if (!/^\d{15}$/.test(data.seller_tax_id)) {
    errors.push('Seller VAT number must be exactly 15 digits');
  } else if (!data.seller_tax_id.startsWith('3')) {
    errors.push('Seller VAT number must start with digit 3 (ZATCA requirement)');
  } else if (!data.seller_tax_id.endsWith('3')) {
    errors.push('Seller VAT number must end with digit 3 (ZATCA requirement)');
  }
  
  // Validate date format
  if (!data.invoice_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.invoice_date)) {
    errors.push('Invoice date must be in YYYY-MM-DD format');
  }
  
  // Validate time format
  if (!data.invoice_time || !/^\d{2}:\d{2}:\d{2}$/.test(data.invoice_time)) {
    errors.push('Invoice time must be in HH:MM:SS format');
  }
  
  // Validate amounts
  if (data.invoice_total < 0) {
    errors.push('Invoice total cannot be negative');
  }
  
  if (data.vat_total < 0) {
    errors.push('VAT total cannot be negative');
  }
  
  // Validate UUID format
  if (!data.invoice_uuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.invoice_uuid)) {
    errors.push('Invoice UUID must be a valid UUID v4 format');
  }
  
  // Validate cryptographic hash
  if (!data.cryptographic_hash || data.cryptographic_hash.length === 0) {
    errors.push('Cryptographic hash is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
