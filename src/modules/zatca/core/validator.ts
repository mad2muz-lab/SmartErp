/**
 * ZATCA Pre-Flight Invoice Validator
 * 
 * Verifies that all mandatory fields, tax registration numbers, and financial
 * calculations adhere to official ZATCA guidelines before issuing or submitting to FATOORA.
 */

import { ZatcaInvoicePayload, ZatcaParty } from '../types/zatca.types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a Saudi Tax Registration Number (TRN / الرقم الضريبي)
 * Must be 15 digits, starting with 3 and ending with 3.
 */
export function isValidZatcaTRN(trn?: string): boolean {
  if (!trn) return false;
  const clean = trn.trim().replace(/\s+/g, '');
  return /^3\d{13}3$/.test(clean);
}

/**
 * Validates a party (Seller or Buyer)
 */
export function validateZatcaParty(
  party: ZatcaParty, 
  role: 'Seller' | 'Buyer', 
  isB2B: boolean
): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Seller is always required to have a valid name & TRN
  if (!party.name || party.name.trim().length === 0) {
    errors.push(`${role} name is required.`);
  }

  // TRN check
  if (!party.vatNumber || party.vatNumber.trim().length === 0) {
    if (role === 'Seller' || isB2B) {
      errors.push(`${role} VAT Number (TRN) is required.`);
    }
  } else if (!isValidZatcaTRN(party.vatNumber)) {
    errors.push(
      `${role} VAT Number "${party.vatNumber}" is invalid. Must be exactly 15 digits starting and ending with 3.`
    );
  }

  // Address validation
  const addr = party.address;
  if (!addr) {
    if (role === 'Seller' || isB2B) {
      errors.push(`${role} national address is required.`);
    }
  } else {
    if (!addr.streetName || addr.streetName.trim().length === 0) {
      if (role === 'Seller' || isB2B) errors.push(`${role} street name is required.`);
    }
    if (!addr.city || addr.city.trim().length === 0) {
      if (role === 'Seller' || isB2B) errors.push(`${role} city is required.`);
    }
    if (!addr.buildingNumber || !/^\d{4}$/.test(addr.buildingNumber.trim())) {
      warnings.push(`${role} building number should be a 4-digit number per Saudi National Address standard.`);
    }
    if (!addr.postalCode || !/^\d{5}$/.test(addr.postalCode.trim())) {
      warnings.push(`${role} postal code should be a 5-digit number per Saudi National Address standard.`);
    }
  }

  return { errors, warnings };
}

/**
 * Full pre-flight validation on an invoice payload
 */
export function validateZatcaInvoice(payload: ZatcaInvoicePayload): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Basic Metadata
  if (!payload.invoiceNumber || payload.invoiceNumber.trim().length === 0) {
    errors.push('Invoice number is required.');
  }

  if (!payload.issueDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.issueDate)) {
    errors.push('Issue date must be in YYYY-MM-DD format.');
  }

  if (!payload.issueTime) {
    errors.push('Issue time is required.');
  }

  // 2. Validate Seller
  const sellerCheck = validateZatcaParty(payload.seller, 'Seller', true);
  errors.push(...sellerCheck.errors);
  warnings.push(...sellerCheck.warnings);

  // 3. Validate Buyer (Mandatory for Standard B2B, Optional for Simplified B2C)
  const isB2B = payload.invoiceType === 'standard';
  if (isB2B) {
    if (!payload.buyer) {
      errors.push('Buyer details and VAT number are mandatory for Standard Tax Invoices (B2B).');
    } else {
      const buyerCheck = validateZatcaParty(payload.buyer, 'Buyer', true);
      errors.push(...buyerCheck.errors);
      warnings.push(...buyerCheck.warnings);
    }
  }

  // 4. Validate Credit / Debit Note Reference
  if (payload.transactionType === 'credit_note' || payload.transactionType === 'debit_note') {
    if (!payload.originalInvoiceNumber) {
      errors.push('Credit/Debit notes must reference the original invoice number.');
    }
    if (!payload.billingReferenceReason) {
      warnings.push('Reason for issuing Credit/Debit note is strongly recommended.');
    }
  }

  // 5. Line items
  if (!payload.items || payload.items.length === 0) {
    errors.push('Invoice must contain at least one line item.');
  } else {
    let calculatedSubtotal = 0;
    let calculatedVat = 0;

    payload.items.forEach((item, index) => {
      const idx = index + 1;
      if (!item.name || item.name.trim().length === 0) {
        errors.push(`Line item #${idx}: Description is required.`);
      }
      if (item.quantity <= 0) {
        errors.push(`Line item #${idx}: Quantity must be greater than 0.`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Line item #${idx}: Unit price cannot be negative.`);
      }

      calculatedSubtotal += item.totalExcludingVat;
      calculatedVat += item.vatAmount;
    });

    // Check financial totals match line calculations within 0.05 SAR tolerance
    const calculatedGrandTotal = calculatedSubtotal + calculatedVat - (payload.totalDiscount || 0);
    if (Math.abs(calculatedGrandTotal - payload.grandTotal) > 0.05) {
      errors.push(
        `Invoice totals mismatch: Sum of items (${calculatedGrandTotal.toFixed(2)}) does not match Grand Total (${payload.grandTotal.toFixed(2)}).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
