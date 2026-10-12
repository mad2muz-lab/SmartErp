// PDF generation utility functions

import { OrganizationData, DeliveryNoteData } from "../types/pdfTypes";

// Helper function to format detailed address
export function formatDetailedAddress(org: OrganizationData): string {
  const addressParts = [];

  if (org.building_number) addressParts.push(`Building: ${org.building_number}`);
  if (org.street) addressParts.push(org.street);
  if (org.additional_number) addressParts.push(`Additional: ${org.additional_number}`);
  if (org.district) addressParts.push(`District: ${org.district}`);
  if (org.city) addressParts.push(org.city);
  if (org.state_province) addressParts.push(org.state_province);
  if (org.zip_postal_code) addressParts.push(org.zip_postal_code);
  if (org.country) addressParts.push(org.country);

  // If we have detailed address parts, use them; otherwise fall back to single address
  if (addressParts.length > 0) {
    return addressParts.join(', ');
  }

  return org.address || '';
}

// Helper function to format detailed delivery address
export function formatDetailedDeliveryAddress(deliveryData: DeliveryNoteData): string {
  const addressParts = [];

  if (deliveryData.delivery_building_number) addressParts.push(`Building: ${deliveryData.delivery_building_number}`);
  if (deliveryData.delivery_street) addressParts.push(deliveryData.delivery_street);
  if (deliveryData.delivery_additional_number) addressParts.push(`Additional: ${deliveryData.delivery_additional_number}`);
  if (deliveryData.delivery_district) addressParts.push(`District: ${deliveryData.delivery_district}`);
  if (deliveryData.delivery_city) addressParts.push(deliveryData.delivery_city);
  if (deliveryData.delivery_state_province) addressParts.push(deliveryData.delivery_state_province);
  if (deliveryData.delivery_zip_postal_code) addressParts.push(deliveryData.delivery_zip_postal_code);
  if (deliveryData.delivery_country) addressParts.push(deliveryData.delivery_country);

  // If we have detailed address parts, use them; otherwise fall back to single address
  if (addressParts.length > 0) {
    return addressParts.join(', ');
  }

  return deliveryData.delivery_address || '';
}

// Process text for PDF with Arabic support
export function processTextForPDF(text: string): string {
  if (!text) return '';

  // Escape special PDF characters
  return text.replace(/[()\\]/g, '\\$&').replace(/[\r\n]/g, ' ');
}

// Get status badge class for styling
export function getStatusBadgeClass(status: string): string {
  const statusClasses: { [key: string]: string } = {
    'draft': 'status-draft',
    'issued': 'status-issued',
    'delivered': 'status-delivered',
    'completed': 'status-completed'
  };

  return statusClasses[status] || 'status-draft';
}

// Format currency with proper symbols and thousand separators
export function formatCurrency(amount: number, currency: string = 'SAR'): string {
  const currencySymbols: { [key: string]: string } = {
    'SAR': 'SAR',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };

  const symbol = currencySymbols[currency] || currency;
  
  // [2025-01-11] Added - Add thousand separators for better readability
  const formattedAmount = amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return `${formattedAmount} ${symbol}`;
}

// Validate PDF generation data
export function validatePDFData(data: any, type: 'quotation' | 'delivery_note'): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data) {
    errors.push(`${type} data is required`);
    return { isValid: false, errors };
  }

  if (type === 'quotation') {
    if (!data.quotation_number) errors.push('Quotation number is required');
    if (!data.customer_name) errors.push('Customer name is required');
    if (!data.items || !Array.isArray(data.items)) errors.push('Items array is required');
  } else if (type === 'delivery_note') {
    if (!data.delivery_note_number) errors.push('Delivery note number is required');
    if (!data.customer_name) errors.push('Customer name is required');
    if (!data.items || !Array.isArray(data.items)) errors.push('Items array is required');
  }

  return { isValid: errors.length === 0, errors };
}

// Create PDF metadata
export function createPDFMetadata(title: string, subject?: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:dc="http://purl.org/dc/elements/1.1/">
  <rdf:Description rdf:about="">
    <dc:title>${title}</dc:title>
    ${subject ? `<dc:subject>${subject}</dc:subject>` : ''}
    <dc:creator>TradingERP</dc:creator>
    <dc:date>${new Date().toISOString()}</dc:date>
  </rdf:Description>
</rdf:RDF>`;
}
