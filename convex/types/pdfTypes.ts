// PDF-related type definitions and interfaces

export interface QuotationData {
  _id: string;
  quotation_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_arabic?: string;
  date: string;
  valid_until: string;
  currency: string;
  tax_rate: number;
  terms_conditions?: string;
  items: Array<{
    inventory_name: string;
    inventory_name_arabic?: string;
    description?: string;
    quantity: number;
    unit_price: number;
    rate: number;
    total_price: number;
    amount: number;
    vat_percentage: number;
    vat_amount: number;
    discount_percentage: number;
  }>;
  template_id?: string;
}

export interface DeliveryNoteData {
  _id: string;
  delivery_note_number: string;
  customer_id: string;
  customer_name: string;
  customer_name_arabic?: string;
  issue_date: string;
  delivery_date: string;
  delivery_address: string;
  delivery_address_arabic?: string;
  // Detailed delivery address fields for precise delivery location
  delivery_building_number?: string;
  delivery_street?: string;
  delivery_additional_number?: string;
  delivery_district?: string;
  delivery_city?: string;
  delivery_state_province?: string;
  delivery_zip_postal_code?: string;
  delivery_country?: string;
  received_by?: string;
  received_by_signature?: string;
  status: string;
  notes?: string;
  items: Array<{
    inventory_name: string;
    inventory_name_arabic?: string;
    quantity: number;
    unit?: string; // [2025-01-11] Added - Unit field for delivery note items
    delivered_quantity?: number;
    notes?: string;
  }>;
  template_id?: string;
}

export interface OrganizationData {
  name: string;
  name_arabic?: string;
  address?: string;
  address_arabic?: string;
  // Detailed address fields for invoicing and business documents
  building_number?: string;
  street?: string;
  additional_number?: string;
  district?: string;
  city?: string;
  state_province?: string;
  zip_postal_code?: string;
  country?: string;
  vat_number?: string;
  vat_number_arabic?: string;
  cr_number?: string;
  cr_number_arabic?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  header_config?: any;
  footer_config?: any;
}

export interface PDFGenerationResult {
  success: boolean;
  htmlContent?: string;
  error?: string;
}

export interface TemplateData {
  _id: string;
  name: string;
  description?: string;
  template_type: string;
  organization_id: string;
  is_default: boolean;
  is_active: boolean;
  header_config?: any;
  footer_config?: any;
  custom_styles?: any;
  custom_content?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
