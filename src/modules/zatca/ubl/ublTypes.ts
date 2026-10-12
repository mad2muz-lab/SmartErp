/**
 * ZATCA UBL 2.1 Specification Data Models
 * Follows the ZATCA Saudi Arabia E-Invoicing Profile for UBL 2.1.
 */

export interface UblXmlOptions {
  includeQrCode?: boolean;
  base64QrCode?: string;
  previousInvoiceHash?: string;
  invoiceCounter?: number;
}

export type UblInvoiceTypeCode = '388' | '381' | '383'; // 388: Invoice, 381: Credit Note, 383: Debit Note
export type UblInvoiceSubtype = '0100000' | '0200000'; // 01: Standard (B2B), 02: Simplified (B2C)
