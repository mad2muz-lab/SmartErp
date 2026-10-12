/**
 * ZATCA TLV (Tag-Length-Value) Binary Encoder
 * 
 * Implements the official Saudi ZATCA specification for QR code generation.
 * Handles UTF-8 multi-byte characters (Arabic/English) flawlessly across both
 * browser and Node.js environments without third-party dependencies.
 * 
 * Specification:
 * - Tag 1: Seller's Name (Mandatory)
 * - Tag 2: VAT Registration Number (15 digits) (Mandatory)
 * - Tag 3: Time Stamp (ISO 8601: YYYY-MM-DDTHH:mm:ssZ) (Mandatory)
 * - Tag 4: Invoice Total (with VAT) (Mandatory)
 * - Tag 5: VAT Total (Mandatory)
 * - Tag 6: Hash of XML Invoice (Phase 2 only)
 * - Tag 7: ECDSA Digital Signature (Phase 2 only)
 * - Tag 8: ECDSA Public Key (Phase 2 only)
 * - Tag 9: ZATCA Cryptographic Stamp (Phase 2 B2B Cleared only)
 */

import { ZatcaTLVData } from '../types/zatca.types';

/**
 * Encodes a string value into a TLV Uint8Array block [Tag (1 byte)][Length (1 byte)][Value (N bytes)]
 */
export function encodeTLVField(tag: number, value: string): Uint8Array {
  // Use TextEncoder to get exact UTF-8 byte representation
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  
  if (valueBytes.length > 255) {
    // If value exceeds 255 bytes, truncate or warn according to ZATCA rules
    console.warn(`[ZATCA TLV] Tag ${tag} value exceeds 255 bytes (${valueBytes.length} bytes). Truncating to 255 bytes.`);
    const truncated = valueBytes.slice(0, 255);
    const result = new Uint8Array(2 + truncated.length);
    result[0] = tag;
    result[1] = truncated.length;
    result.set(truncated, 2);
    return result;
  }
  
  const result = new Uint8Array(2 + valueBytes.length);
  result[0] = tag;
  result[1] = valueBytes.length;
  result.set(valueBytes, 2);
  
  return result;
}

/**
 * Encodes raw byte array (for binary signatures/hashes/keys if already in Uint8Array form)
 */
export function encodeTLVBytes(tag: number, bytes: Uint8Array): Uint8Array {
  const length = Math.min(bytes.length, 255);
  const result = new Uint8Array(2 + length);
  result[0] = tag;
  result[1] = length;
  result.set(bytes.slice(0, length), 2);
  return result;
}

/**
 * Converts a Uint8Array into a standard Base64 string across any environment
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  // Check if running in browser with window.btoa
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  // Node.js fallback
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  
  // Pure JS fallback
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    result += i + 1 < len ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '=';
    result += i + 2 < len ? chars[b2 & 63] : '=';
  }
  return result;
}

/**
 * Decode Base64 string back to Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  
  throw new Error('No base64 decoder available in current environment');
}

/**
 * Concatenates multiple Uint8Arrays into one
 */
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Formats monetary amounts strictly to 2 decimal places as required by ZATCA
 */
function formatAmount(val: number | string): string {
  if (typeof val === 'number') {
    return val.toFixed(2);
  }
  const num = parseFloat(val);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

/**
 * Generates the official ZATCA Base64 TLV string from invoice data.
 * 
 * In Phase 1 mode, it strictly encodes Tags 1-5.
 * In Phase 2 mode (when cryptographic fields are provided), it encodes Tags 1-9.
 */
export function generateZatcaTLVBase64(data: ZatcaTLVData): string {
  const fields: Uint8Array[] = [
    // Tag 1: Seller's Name
    encodeTLVField(1, data.sellerName.trim()),
    // Tag 2: VAT Registration Number (15 digits)
    encodeTLVField(2, data.vatNumber.trim()),
    // Tag 3: Timestamp (ISO 8601 UTC or KSA time)
    encodeTLVField(3, data.timestamp.trim()),
    // Tag 4: Invoice Total (with VAT)
    encodeTLVField(4, formatAmount(data.totalWithVat)),
    // Tag 5: VAT Total
    encodeTLVField(5, formatAmount(data.vatTotal)),
  ];

  // Phase 2 Tags (Only included if valid Phase 2 data is supplied)
  if (data.invoiceHash) {
    fields.push(encodeTLVField(6, data.invoiceHash));
  }
  if (data.digitalSignature) {
    fields.push(encodeTLVField(7, data.digitalSignature));
  }
  if (data.publicKey) {
    fields.push(encodeTLVField(8, data.publicKey));
  }
  if (data.zatcaStamp) {
    fields.push(encodeTLVField(9, data.zatcaStamp));
  }

  const combined = concatUint8Arrays(fields);
  return uint8ArrayToBase64(combined);
}

/**
 * Parses and decodes a ZATCA TLV Base64 QR code string back into its constituent tags.
 * Useful for auditing, testing, and debugging invoices.
 */
export function parseZatcaTLVBase64(base64: string): Record<number, string> {
  const bytes = base64ToUint8Array(base64);
  const result: Record<number, string> = {};
  const decoder = new TextDecoder('utf-8');
  
  let i = 0;
  while (i < bytes.length) {
    const tag = bytes[i];
    if (i + 1 >= bytes.length) break;
    const length = bytes[i + 1];
    const valueStart = i + 2;
    const valueEnd = valueStart + length;
    
    if (valueEnd > bytes.length) {
      console.warn(`[ZATCA TLV Parser] Tag ${tag} length ${length} extends beyond payload size.`);
      break;
    }
    
    const valueSlice = bytes.subarray(valueStart, valueEnd);
    result[tag] = decoder.decode(valueSlice);
    i = valueEnd;
  }
  
  return result;
}
