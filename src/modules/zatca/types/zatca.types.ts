/**
 * ZATCA E-Invoicing Module - Types & Interfaces
 * Compatible with ZATCA (KSA Tax and Customs Authority) Phase 1 & Phase 2 specifications.
 * 
 * This module is completely self-contained and can be exported as a standalone package.
 */

export type ZatcaInvoiceType = 'standard' | 'simplified';
export type ZatcaTransactionType = 'invoice' | 'credit_note' | 'debit_note';

export type ZatcaEnvironment = 'sandbox' | 'simulation' | 'production';

export type ZatcaComplianceStatus = 
  | 'not_reported'
  | 'pending'
  | 'reported'      // B2C Simplified Invoices
  | 'cleared'       // B2B Standard Invoices approved by ZATCA
  | 'rejected'
  | 'warning';

/**
 * Standard ZATCA Address format (National Address)
 */
export interface ZatcaAddress {
  streetName: string;
  buildingNumber: string; // 4 digits
  additionalNumber?: string; // 4 digits (optional but recommended)
  city: string;
  postalCode: string; // 5 digits
  district: string;
  countryCode: string; // Usually 'SA'
}

/**
 * Party Information (Seller or Buyer)
 */
export interface ZatcaParty {
  name: string;
  nameArabic?: string;
  vatNumber: string; // 15 digits starting and ending with 3
  crNumber?: string; // Commercial Registration Number (10 digits)
  address: ZatcaAddress;
}

/**
 * Individual Line Item on a ZATCA Invoice
 */
export interface ZatcaInvoiceItem {
  id: string;
  name: string;
  nameArabic?: string;
  quantity: number;
  unitPrice: number; // Excluding VAT
  discountAmount?: number;
  vatRate: number; // E.g. 0.15 for 15% standard rate
  vatCategory: 'S' | 'Z' | 'E' | 'O'; // Standard (15%), Zero rated (0%), Exempt, Out of scope
  totalExcludingVat: number;
  vatAmount: number;
  totalWithVat: number;
}

/**
 * Full Canonical ZATCA Invoice Payload
 */
export interface ZatcaInvoicePayload {
  uuid: string; // UUID v4
  invoiceNumber: string; // Sequential identifier (e.g. INV-2026-0001)
  invoiceType: ZatcaInvoiceType; // 'standard' (B2B) or 'simplified' (B2C)
  transactionType: ZatcaTransactionType; // 'invoice' (388), 'credit_note' (381), 'debit_note' (383)
  issueDate: string; // YYYY-MM-DD
  issueTime: string; // HH:mm:ss
  supplyDate?: string; // YYYY-MM-DD
  
  seller: ZatcaParty;
  buyer?: ZatcaParty; // Required for B2B Standard invoices, optional for B2C
  
  items: ZatcaInvoiceItem[];
  
  // Totals
  subtotal: number; // Line items total before discount & VAT
  totalDiscount: number;
  taxableAmount: number; // Subtotal - totalDiscount
  vatTotal: number;
  grandTotal: number; // taxableAmount + vatTotal
  
  currency: string; // 'SAR'
  paymentMeansCode?: string; // '10' (Cash), '30' (Bank Transfer), '48' (Credit/Debit Card)
  
  // Phase 2 Cryptographic Chaining
  previousInvoiceHash?: string; // Base64 SHA-256 of previous invoice (or '0' for first invoice)
  invoiceCounter?: number; // Sequential ICV counter
  
  // Reference for Credit / Debit notes
  originalInvoiceNumber?: string;
  originalInvoiceUuid?: string;
  billingReferenceReason?: string;
}

/**
 * TLV Tags Data Structure for QR Code
 */
export interface ZatcaTLVData {
  sellerName: string;
  vatNumber: string;
  timestamp: string; // ISO 8601: YYYY-MM-DDTHH:mm:ssZ
  totalWithVat: number | string;
  vatTotal: number | string;
  // Phase 2 Optional / Mandatory Tags (Tags 6-9)
  invoiceHash?: string; // Tag 6 (Base64 SHA-256)
  digitalSignature?: string; // Tag 7 (Base64 ECDSA Signature)
  publicKey?: string; // Tag 8 (Base64 ECDSA Public Key)
  zatcaStamp?: string; // Tag 9 (Base64 ZATCA cryptographic stamp)
}

/**
 * Device / EGS (E-Invoicing Generation Solution) Credentials
 */
export interface ZatcaEgsCredentials {
  egsUuid: string;
  organizationName: string;
  vatNumber: string;
  branchName: string;
  environment: ZatcaEnvironment;
  
  // Cryptographic Keys
  privateKeyPem: string;
  publicKeyPem: string;
  csrPem?: string;
  
  // ZATCA Issued Tokens
  complianceCsid?: string;
  complianceSecret?: string;
  productionCsid?: string;
  productionSecret?: string;
  
  isOnboarded: boolean;
  onboardedAt?: string;
  expiresAt?: string;
}

/**
 * ZATCA API Response
 */
export interface ZatcaApiResponse {
  success: boolean;
  statusCode: number;
  status: ZatcaComplianceStatus;
  reportingStatus?: 'REPORTED' | 'NOT_REPORTED';
  clearanceStatus?: 'CLEARED' | 'NOT_CLEARED';
  invoiceHash?: string;
  clearedInvoiceXml?: string;
  validationResults?: {
    infoMessages?: Array<{ code: string; message: string; status: string }>;
    warningMessages?: Array<{ code: string; message: string; status: string }>;
    errorMessages?: Array<{ code: string; message: string; status: string }>;
  };
  rawResponse?: any;
}
