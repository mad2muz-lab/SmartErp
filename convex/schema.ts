import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core ERP Tables
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    website: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    currency: v.string(),
    vat_number: v.string(),
    vat_rate: v.string(),
    timezone: v.string(),
    language: v.string(),
    profit_sharing_enabled: v.boolean(),
    profit_sharing_percentage: v.string(),
    is_active: v.boolean(),
    is_default: v.optional(v.boolean()),
    // New fields for enhanced organization management
    name_arabic: v.optional(v.string()),
    industry: v.optional(v.array(v.string())),
    address_arabic: v.optional(v.string()),
    vat_number_arabic: v.optional(v.string()),
    cr_number: v.optional(v.string()),
    cr_number_arabic: v.optional(v.string()),
    // Detailed address fields for invoicing and business documents
    building_number: v.optional(v.string()),
    building_number_arabic: v.optional(v.string()),
    street: v.optional(v.string()),
    street_arabic: v.optional(v.string()),
    additional_number: v.optional(v.string()),
    additional_number_arabic: v.optional(v.string()),
    district: v.optional(v.string()),
    district_arabic: v.optional(v.string()),
    city: v.optional(v.string()),
    city_arabic: v.optional(v.string()),
    state_province: v.optional(v.string()),
    state_province_arabic: v.optional(v.string()),
    zip_postal_code: v.optional(v.string()),
    zip_postal_code_arabic: v.optional(v.string()),
    country: v.optional(v.string()),
    country_arabic: v.optional(v.string()),
    // Header/Footer display configuration
    header_display_config: v.optional(v.object({
      logo: v.boolean(),
      name: v.boolean(),
      name_arabic: v.boolean(),
      email: v.boolean(),
      phone: v.boolean(),
      address: v.boolean(),
      address_arabic: v.boolean(),
      website: v.boolean(),
      vat_number: v.boolean(),
      vat_number_arabic: v.boolean(),
      cr_number: v.boolean(),
      cr_number_arabic: v.boolean(),
      industry: v.boolean(),
    })),
    footer_display_config: v.optional(v.object({
      logo: v.boolean(),
      name: v.boolean(),
      name_arabic: v.boolean(),
      email: v.boolean(),
      phone: v.boolean(),
      address: v.boolean(),
      address_arabic: v.boolean(),
      website: v.boolean(),
      vat_number: v.boolean(),
      vat_number_arabic: v.boolean(),
      cr_number: v.boolean(),
      cr_number_arabic: v.boolean(),
      industry: v.boolean(),
    })),
    // Custom header/footer image fields
    company_header_image_url: v.optional(v.string()),
    company_footer_image_url: v.optional(v.string()),
    use_custom_header_footer: v.optional(v.boolean()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_slug", ["slug"]),

  user_profiles: defineTable({
    user_id: v.optional(v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.string(),
    department: v.optional(v.string()),
    organization_id: v.optional(v.id("organizations")),
    is_active: v.boolean(),
    created_at: v.optional(v.string()),
    updated_at: v.optional(v.string()),
    // Google OAuth fields
    google_id: v.optional(v.string()),
    name: v.optional(v.string()),
    given_name: v.optional(v.string()),
    family_name: v.optional(v.string()),
    picture: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
    last_login: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    // Additional fields
    is_project_owner: v.optional(v.boolean()),
    role_changed_at: v.optional(v.string()),
    role_changed_by: v.optional(v.string()),
  })
  .index("by_user_id", ["user_id"])
  .index("by_organization", ["organization_id"])
  .index("by_google_id", ["google_id"])
  .index("by_email", ["email"]),

  user_organization_access: defineTable({
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    role: v.string(),
    permissions: v.array(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_user_org", ["user_id", "organization_id"]),

  model_access_control: defineTable({
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    model_name: v.string(),
    can_read: v.boolean(),
    can_create: v.boolean(),
    can_update: v.boolean(),
    can_delete: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_user_org_model", ["user_id", "organization_id", "model_name"]),

  // Global Admin Database - Maintains all global administrators
  global_admins: defineTable({
    user_id: v.id("user_profiles"),
    email: v.string(),
    name: v.string(),
    role: v.string(), // super_admin, admin, etc.
    permissions: v.array(v.string()),
    is_active: v.boolean(),
    created_by: v.optional(v.id("user_profiles")),
    created_at: v.string(),
    updated_at: v.string(),
    last_login: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_user_id", ["user_id"]).index("by_email", ["email"]).index("by_role", ["role"]),

  // Global Admin Approval Requests - For new user signups requiring global admin approval
  global_admin_approvals: defineTable({
    user_id: v.id("user_profiles"),
    email: v.string(),
    name: v.string(),
    given_name: v.string(),
    family_name: v.string(),
    picture: v.optional(v.string()),
    email_verified: v.boolean(),
    requested_at: v.string(),
    global_admin_approved: v.optional(v.id("global_admins")), // Reference to global admin who approved
    global_admin_approved_at: v.optional(v.string()),
    status: v.string(), // pending_global_approval, approved, rejected
    notes: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
  }).index("by_user_id", ["user_id"]).index("by_status", ["status"]).index("by_email", ["email"]),

  // Organization Assignment Requests - After global admin approval, users request organization access
  organization_assignment_requests: defineTable({
    user_id: v.id("user_profiles"),
    email: v.string(),
    requested_organization_id: v.id("organizations"),
    requested_role: v.string(),
    requested_permissions: v.array(v.string()),
    requested_by_user: v.id("user_profiles"), // User who requested the assignment
    requested_at: v.string(),
    organization_admin_approved: v.optional(v.id("user_profiles")), // Organization admin who approved
    organization_admin_approved_at: v.optional(v.string()),
    global_admin_override: v.optional(v.id("global_admins")), // Global admin who overrode
    global_admin_override_at: v.optional(v.string()),
    status: v.string(), // pending, approved, rejected, global_override
    notes: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
  }).index("by_user", ["user_id"]).index("by_organization", ["requested_organization_id"]).index("by_status", ["status"]),

  pending_user_approvals: defineTable({
    user_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    role: v.string(),
    organization_id: v.id("organizations"),
    requested_by: v.string(),
    requested_at: v.string(),
    approved_by: v.optional(v.string()),
    approved_at: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
  }).index("by_organization", ["organization_id"]).index("by_status", ["status"]),

  customers: defineTable({
    customer_company_name: v.string(), // Combined customer/company name (required)
    customer_company_name_arabic: v.optional(v.string()), // Arabic name (optional)
    customer_type: v.union(v.literal("business"), v.literal("individual")), // Business or Individual
    contact_person: v.optional(v.string()),
    contact_person_arabic: v.optional(v.string()), // Arabic contact person name
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    address_arabic: v.optional(v.string()), // Arabic address
    // Detailed address fields for invoicing and business documents
    building_number: v.optional(v.string()),
    building_number_arabic: v.optional(v.string()),
    street: v.optional(v.string()),
    street_arabic: v.optional(v.string()),
    additional_number: v.optional(v.string()),
    additional_number_arabic: v.optional(v.string()),
    district: v.optional(v.string()),
    district_arabic: v.optional(v.string()),
    city: v.optional(v.string()),
    city_arabic: v.optional(v.string()),
    state_province: v.optional(v.string()),
    state_province_arabic: v.optional(v.string()),
    zip_postal_code: v.optional(v.string()),
    zip_postal_code_arabic: v.optional(v.string()),
    country: v.optional(v.string()),
    country_arabic: v.optional(v.string()),
    website: v.optional(v.string()),
    vat_number: v.optional(v.string()), // Changed from tax_id to vat_number
    cr_number: v.optional(v.string()), // Added CR number field
    payment_terms: v.optional(v.string()),
    custom_payment_terms: v.optional(v.string()), // For custom payment terms
    credit_days: v.optional(v.number()), // Credit days for payment terms
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()), // Arabic notes
    // Bank Details
    bank_name: v.optional(v.string()),
    bank_name_arabic: v.optional(v.string()), // Arabic bank name
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    swift_code: v.optional(v.string()),
    bank_address: v.optional(v.string()),
    bank_address_arabic: v.optional(v.string()), // Arabic bank address
    account_holder_name: v.optional(v.string()),
    account_holder_name_arabic: v.optional(v.string()), // Arabic account holder name
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),

  }).index("by_organization", ["organization_id"]).index("by_name", ["customer_company_name"]),

  leads: defineTable({
    // Essential lead fields
    lead_number: v.string(), // Auto-generated lead number for tracking
    name: v.string(),
    status: v.string(),
    priority: v.string(),
    assigned_to: v.optional(v.string()),
    
    // Quotation-like fields for smooth conversion
    customer_id: v.optional(v.id("customers")),
    customer_name: v.optional(v.string()), // Added for display purposes
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
    currency: v.string(),
    subtotal: v.optional(v.number()),
    tax_rate: v.optional(v.number()),
    tax_amount: v.optional(v.number()),
    total_amount: v.optional(v.number()),
    terms_conditions: v.optional(v.string()),
    notes: v.optional(v.string()),
    
    // Legacy fields (kept for backward compatibility)
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.string(),
    value: v.optional(v.number()), // Maps to total_amount
    estimated_value: v.optional(v.number()), // Added for frontend compatibility
    organization_id: v.id("organizations"),
    next_follow_up: v.optional(v.string()),
    reminder_scheduled: v.optional(v.boolean()),
    reminder_date: v.optional(v.string()),
    closure_type: v.optional(v.union(v.literal("quotation"), v.literal("lost"), v.literal("closed"))),
    quotation_id: v.optional(v.id("quotations")),
    tags: v.optional(v.array(v.string())),
    created_by: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_status", ["status"]).index("by_assigned", ["assigned_to"]).index("by_lead_number", ["lead_number"]),

  // New table for lead items
  lead_items: defineTable({
    lead_id: v.id("leads"),
    item_name: v.string(),
    description: v.optional(v.string()),
    quality: v.string(), // Quality specification
    quantity: v.number(),
    unit_price: v.number(),
    total_price: v.number(),
    currency: v.string(),
    organization_id: v.id("organizations"),
    created_at: v.string(),
  }).index("by_lead", ["lead_id"]).index("by_organization", ["organization_id"]),

  inventory: defineTable({
    name: v.string(),
    name_arabic: v.optional(v.string()), // Arabic item name
    sku: v.string(),
    description: v.optional(v.string()),
    description_arabic: v.optional(v.string()), // Arabic description
    category: v.string(),
    category_arabic: v.optional(v.string()), // Arabic category
    brand: v.optional(v.string()),
    brand_arabic: v.optional(v.string()), // Arabic brand name
    model: v.optional(v.string()),
    unit: v.string(),
    cost_price: v.number(),
    current_price: v.number(),
    currency: v.string(),
    quantity_in_stock: v.number(),
    minimum_stock_level: v.optional(v.number()),
    maximum_stock_level: v.optional(v.number()),
    reorder_point: v.optional(v.number()),
    reorder_quantity: v.optional(v.number()),
    supplier_id: v.optional(v.id("suppliers")),
    dimensions: v.optional(v.string()),
    weight: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_sku", ["sku"]).index("by_category", ["category"]),

  quotations: defineTable({
    quotation_number: v.string(),
    customer_id: v.id("customers"),
    organization_id: v.id("organizations"),
    issue_date: v.string(),
    expiry_date: v.string(),
    currency: v.string(),
    subtotal: v.number(),
    discount_amount: v.number(),
    tax_rate: v.optional(v.number()),
    tax_amount: v.number(),
    total_amount: v.number(),
    status: v.string(),
    terms_conditions: v.optional(v.string()),
    notes: v.optional(v.string()),
    // New fields for enhanced quotation management
    reference_number: v.optional(v.string()), // Renamed from subject
    salesperson: v.optional(v.string()), // New salesperson field
    markup_percentage: v.optional(v.number()), // Markup percentage for total price
    // Lead connection fields - optional as quotations can be created directly or from leads
    lead_id: v.optional(v.id("leads")), // Reference to the lead if quotation was created from a lead
    lead_number: v.optional(v.string()), // Lead number for easy reference and display
    // Additional fields to support frontend requirements
    customer_name: v.optional(v.string()), // Customer name for display purposes
    description: v.optional(v.string()), // Description field for quotations
    valid_until: v.optional(v.string()), // Alternative to expiry_date for frontend compatibility
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_customer", ["customer_id"]).index("by_status", ["status"]).index("by_lead", ["lead_id"]),

  quotation_items: defineTable({
    quotation_id: v.id("quotations"),
    inventory_id: v.id("inventory"),
    quantity: v.number(),
    unit: v.optional(v.string()), // Unit field for quotation items
    unit_price: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.number(),
    // [2025-01-11] Added - VAT amount per line item for enhanced quotation management
    vat_amount: v.optional(v.number()), // VAT amount per line item
    notes: v.optional(v.string()),
    // New fields for enhanced item management
    purchase_price: v.optional(v.number()), // Purchase price for reference and calculations
    markup_amount: v.optional(v.number()), // Markup amount for this item
    inventory_name: v.optional(v.string()), // Store inventory name for reference
    // [2025-01-11] Added - Delivery tracking fields for partial delivery management
    delivered_quantity: v.optional(v.number()), // Total quantity delivered across all delivery notes
    remaining_quantity: v.optional(v.number()), // Remaining quantity to be delivered (calculated field)
    created_at: v.string(),
  }).index("by_quotation", ["quotation_id"]).index("by_inventory", ["inventory_id"]),

  // Organization Terms & Conditions for persistent storage
  organization_terms: defineTable({
    organization_id: v.id("organizations"),
    terms_conditions: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]),

  // Intelligent Process Flow Tables
  process_flows: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    organization_id: v.id("organizations"),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]),

  process_stages: defineTable({
    process_flow_id: v.id("process_flows"),
    name: v.string(),
    description: v.optional(v.string()),
    order_index: v.number(),
    is_automated: v.boolean(),
    required_fields: v.optional(v.array(v.string())),
    auto_advance_conditions: v.optional(v.array(v.string())),
    created_at: v.string(),
  }).index("by_process_flow", ["process_flow_id"]).index("by_order", ["process_flow_id", "order_index"]),

  inquiry_processes: defineTable({
    inquiry_id: v.string(),
    process_flow_id: v.id("process_flows"),
    current_stage_id: v.id("process_stages"),
    customer_id: v.optional(v.id("customers")),
    lead_id: v.optional(v.id("leads")),
    organization_id: v.id("organizations"),
    status: v.string(), // active, completed, cancelled
    priority: v.string(),
    estimated_value: v.optional(v.number()),
    currency: v.string(),
    assigned_to: v.optional(v.string()),
    created_by: v.string(),
    started_at: v.string(),
    completed_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_status", ["status"]).index("by_assigned", ["assigned_to"]),

  process_actions: defineTable({
    inquiry_process_id: v.id("inquiry_processes"),
    stage_id: v.id("process_stages"),
    action_type: v.string(), // SYSTEM, USER, AI
    action_name: v.string(),
    description: v.string(),
    data: v.optional(v.any()),
    status: v.string(), // pending, completed, failed
    processing_time: v.optional(v.number()),
    error_message: v.optional(v.string()),
    triggered_by: v.string(),
    dependencies: v.optional(v.array(v.string())),
    next_actions: v.optional(v.array(v.string())),
    created_at: v.string(),
    completed_at: v.optional(v.string()),
  }).index("by_inquiry_process", ["inquiry_process_id"]).index("by_stage", ["stage_id"]).index("by_status", ["status"]),

  ai_recommendations: defineTable({
    inquiry_process_id: v.id("inquiry_processes"),
    recommendation_type: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.string(),
    action_items: v.array(v.string()),
    confidence_score: v.number(),
    is_implemented: v.boolean(),
    created_at: v.string(),
    implemented_at: v.optional(v.string()),
  }).index("by_inquiry_process", ["inquiry_process_id"]).index("by_type", ["recommendation_type"]),

  automation_rules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    trigger_conditions: v.array(v.string()),
    action_conditions: v.array(v.string()),
    actions: v.array(v.string()),
    priority: v.number(),
    is_active: v.boolean(),
    organization_id: v.id("organizations"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_priority", ["priority"]),

  suppliers: defineTable({
    name: v.string(),
    name_arabic: v.optional(v.string()), // Arabic supplier name
    contact_person: v.optional(v.string()),
    contact_person_arabic: v.optional(v.string()), // Arabic contact person name
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    address_arabic: v.optional(v.string()), // Arabic address
    // Detailed address fields for invoicing and business documents
    building_number: v.optional(v.string()),
    street: v.optional(v.string()),
    additional_number: v.optional(v.string()),
    district: v.optional(v.string()),
    city: v.optional(v.string()),
    state_province: v.optional(v.string()),
    zip_postal_code: v.optional(v.string()),
    country: v.optional(v.string()),
    website: v.optional(v.string()),
    vat_number: v.optional(v.string()),
    cr_number: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    credit_days: v.optional(v.number()), // Credit days for payment terms
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()), // Arabic notes
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_name", ["name"]),



  // Security tables
  rate_limit_attempts: defineTable({
    ip: v.string(),
    action: v.union(v.literal("auth"), v.literal("signup"), v.literal("password_reset")),
    user_agent: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_ip_action", ["ip", "action"])
    .index("by_timestamp", ["timestamp"]),

  user_sessions: defineTable({
    user_id: v.id("user_profiles"),
    user_agent: v.string(),
    ip_address: v.string(),
    device_info: v.string(),
    created_at: v.number(),
    expires_at: v.number(),
    is_active: v.boolean(),
    last_activity: v.number(),
  }).index("by_user", ["user_id"])
    .index("by_expiry", ["expires_at"])
    .index("by_active", ["is_active"]),

  // Security audit tables
  security_audit_logs: defineTable({
    event_type: v.string(),
    user_id: v.optional(v.id("user_profiles")),
    ip_address: v.string(),
    user_agent: v.string(),
    details: v.string(),
    severity: v.string(),
    metadata: v.record(v.string(), v.any()),
    timestamp: v.number(),
  }).index("by_user", ["user_id"])
    .index("by_event_type", ["event_type"])
    .index("by_severity", ["severity"])
    .index("by_timestamp", ["timestamp"])
    .index("by_ip", ["ip_address"]),

  security_alerts: defineTable({
    log_id: v.id("security_audit_logs"),
    alert_type: v.string(),
    message: v.string(),
    is_resolved: v.boolean(),
    created_at: v.number(),
  }).index("by_resolved", ["is_resolved"])
    .index("by_type", ["alert_type"])
    .index("by_created", ["created_at"]),



  account_locks: defineTable({
    user_id: v.id("user_profiles"),
    reason: v.string(),
    locked_until: v.number(),
    created_at: v.number(),
  }).index("by_user_id", ["user_id"])
    .index("by_locked_until", ["locked_until"]),

  // Pending registrations table (secure registration flow)
  pending_registrations: defineTable({
    google_id: v.string(),
    email: v.string(),
    name: v.string(),
    given_name: v.string(),
    family_name: v.string(),
    picture: v.string(),
    email_verified: v.boolean(),
    ip_address: v.string(),
    user_agent: v.string(),
    status: v.union(v.literal("pending_approval"), v.literal("approved"), v.literal("rejected")),
    approved_by: v.optional(v.id("user_profiles")),
    approved_at: v.optional(v.number()),
    rejected_by: v.optional(v.id("user_profiles")),
    rejected_at: v.optional(v.number()),
    rejection_reason: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_created", ["created_at"])
    .index("by_ip", ["ip_address"]),

  // User countdown tracking for access management
  user_countdowns: defineTable({
    user_id: v.id("user_profiles"),
    organization_id: v.optional(v.id("organizations")),
    countdown_type: v.union(v.literal("days"), v.literal("months"), v.literal("years")),
    countdown_value: v.number(), // Total countdown value
    remaining_value: v.number(), // Remaining countdown value
    start_date: v.number(), // Unix timestamp when countdown started
    end_date: v.number(), // Unix timestamp when countdown will end
    is_active: v.boolean(),
    created_by: v.id("user_profiles"), // Who created this countdown
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_user_id", ["user_id"])
    .index("by_organization", ["organization_id"])
    .index("by_active_status", ["is_active"])
    .index("by_end_date", ["end_date"]),

  // Delivery Notes Management Tables
  delivery_notes: defineTable({
    delivery_note_number: v.string(), // Auto-generated DN-YYYY-XXXXX
    quotation_id: v.optional(v.id("quotations")), // Link to source quotation
    quotation_number: v.optional(v.string()), // Store quotation number for display
    customer_id: v.id("customers"),
    organization_id: v.id("organizations"),
    issue_date: v.string(),
    delivery_date: v.string(),
    delivery_address: v.string(),
    delivery_address_arabic: v.optional(v.string()),
    // Detailed delivery address fields for precise delivery location
    delivery_building_number: v.optional(v.string()),
    delivery_street: v.optional(v.string()),
    delivery_additional_number: v.optional(v.string()),
    delivery_district: v.optional(v.string()),
    delivery_city: v.optional(v.string()),
    delivery_state_province: v.optional(v.string()),
    delivery_zip_postal_code: v.optional(v.string()),
    delivery_country: v.optional(v.string()),
    received_by: v.optional(v.string()), // Person who received the delivery
    received_by_signature: v.optional(v.string()), // Digital signature or name
    customer_po_project_ref: v.optional(v.string()), // Customer PO/Project reference
    status: v.string(), // draft, issued, delivered, completed
    notes: v.optional(v.string()),
    template_id: v.optional(v.id("print_templates")), // Assigned print template
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_customer", ["customer_id"])
    .index("by_quotation", ["quotation_id"])
    .index("by_status", ["status"])
    .index("by_template", ["template_id"]),

  // Print Templates Table - For managing document print templates
  print_templates: defineTable({
    name: v.string(), // Template name (e.g., "Standard Delivery Note", "Arabic Delivery Note")
    description: v.optional(v.string()), // Template description
    template_type: v.string(), // "delivery_note", "quotation", "invoice", etc.
    organization_id: v.id("organizations"), // Which organization owns this template
    is_default: v.boolean(), // Is this the default template for this type
    is_active: v.boolean(), // Is this template active/available for use
    
    // Template configuration - overrides organization settings
    header_config: v.optional(v.object({
      logo: v.boolean(),
      name: v.boolean(),
      name_arabic: v.boolean(),
      email: v.boolean(),
      phone: v.boolean(),
      address: v.boolean(),
      address_arabic: v.boolean(),
      website: v.boolean(),
      vat_number: v.boolean(),
      vat_number_arabic: v.boolean(),
      cr_number: v.boolean(),
      cr_number_arabic: v.boolean(),
      industry: v.boolean(),
      // Custom header/footer image fields
      company_header_image: v.optional(v.boolean()),
      company_footer_image: v.optional(v.boolean()),
    })),
    
    footer_config: v.optional(v.object({
      logo: v.boolean(),
      name: v.boolean(),
      name_arabic: v.boolean(),
      email: v.boolean(),
      phone: v.boolean(),
      address: v.boolean(),
      address_arabic: v.boolean(),
      website: v.boolean(),
      vat_number: v.boolean(),
      vat_number_arabic: v.boolean(),
      cr_number: v.boolean(),
      cr_number_arabic: v.boolean(),
      industry: v.boolean(),
      // Custom header/footer image fields
      company_header_image: v.optional(v.boolean()),
      company_footer_image: v.optional(v.boolean()),
    })),
    
    // Custom styling and layout options
    custom_styles: v.optional(v.object({
      primary_color: v.optional(v.string()), // Hex color for headers, borders
      secondary_color: v.optional(v.string()), // Hex color for accents
      font_family: v.optional(v.string()), // Font family for the template
      font_size: v.optional(v.string()), // Base font size
      border_style: v.optional(v.string()), // Border style (solid, dashed, etc.)
      border_width: v.optional(v.string()), // Border width
      header_height: v.optional(v.string()), // Header section height
      footer_height: v.optional(v.string()), // Footer section height
    })),
    
    // Template-specific content overrides
    custom_content: v.optional(v.object({
      header_text: v.optional(v.string()), // Custom header text
      header_text_arabic: v.optional(v.string()), // Custom header text in Arabic
      footer_text: v.optional(v.string()), // Custom footer text
      footer_text_arabic: v.optional(v.string()), // Custom footer text in Arabic
      watermark_text: v.optional(v.string()), // Watermark text
      watermark_text_arabic: v.optional(v.string()), // Watermark text in Arabic
    })),
    
    // Template metadata
    created_by: v.optional(v.string()), // User who created the template
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_type", ["template_type"])
    .index("by_organization_type", ["organization_id", "template_type"])
    .index("by_default", ["organization_id", "template_type", "is_default"]),

  delivery_note_items: defineTable({
    delivery_note_id: v.id("delivery_notes"),
    inventory_id: v.id("inventory"),
    quantity: v.number(),
    unit: v.optional(v.string()), // Unit field for delivery note items
    delivered_quantity: v.optional(v.number()), // Actual delivered quantity
    notes: v.optional(v.string()),
    // [2025-01-11] Added - Link back to quotation item for delivery tracking
    quotation_item_id: v.optional(v.id("quotation_items")), // Reference to the original quotation item
    created_at: v.string(),
  }).index("by_delivery_note", ["delivery_note_id"])
    .index("by_inventory", ["inventory_id"])
    .index("by_quotation_item", ["quotation_item_id"]),

  // Procurement Management Tables
  purchase_requisitions: defineTable({
    pr_number: v.string(), // Auto-generated PR-YYYY-XXXXX
    organization_id: v.id("organizations"),
    department: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    justification: v.string(),
    currency: v.string(),
    total_estimated_cost: v.number(),
    status: v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("rejected"), v.literal("converted")),
    requester_id: v.optional(v.string()), // Added to maintain compatibility with existing data
    requisition_date: v.optional(v.string()), // [2025-01-11] Added - Requisition date field
    required_date: v.optional(v.string()), // [2025-01-11] Added - Required date field
    notes: v.optional(v.string()), // [2025-01-11] Added - Notes field
    submitted_by: v.optional(v.string()),
    submitted_at: v.optional(v.string()),
    approved_by: v.optional(v.string()),
    approved_at: v.optional(v.string()),
    rejected_by: v.optional(v.string()),
    rejected_at: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
    converted_to_po: v.optional(v.id("purchase_orders")),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_status", ["status"])
    .index("by_pr_number", ["pr_number"])
    .index("by_submitted_by", ["submitted_by"]),

  purchase_requisition_items: defineTable({
    purchase_requisition_id: v.id("purchase_requisitions"),
    inventory_id: v.optional(v.id("inventory")),
    item_name: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    estimated_unit_price: v.number(),
    total_estimated_price: v.number(),
    specifications: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))), // [2025-01-11] Added - Item priority
    required_date: v.optional(v.string()), // [2025-01-11] Added - Item required date
    created_at: v.string(),
  }).index("by_purchase_requisition", ["purchase_requisition_id"])
    .index("by_inventory", ["inventory_id"]),

  purchase_orders: defineTable({
    po_number: v.string(), // Auto-generated PO-YYYY-XXXXX
    organization_id: v.id("organizations"),
    supplier_id: v.id("suppliers"),
    issue_date: v.string(),
    expected_delivery_date: v.optional(v.string()),
    currency: v.string(),
    subtotal: v.number(),
    discount_amount: v.number(),
    tax_rate: v.number(),
    tax_amount: v.number(),
    total_amount: v.number(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("confirmed"), v.literal("received"), v.literal("completed"), v.literal("cancelled")),
    payment_terms: v.optional(v.string()),
    delivery_address: v.optional(v.string()),
    notes: v.optional(v.string()),
    sent_by: v.optional(v.string()),
    sent_at: v.optional(v.string()),
    confirmed_by: v.optional(v.string()),
    confirmed_at: v.optional(v.string()),
    source_pr_id: v.optional(v.id("purchase_requisitions")),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_supplier", ["supplier_id"])
    .index("by_status", ["status"])
    .index("by_po_number", ["po_number"])
    .index("by_source_pr", ["source_pr_id"]),

  purchase_order_items: defineTable({
    purchase_order_id: v.id("purchase_orders"),
    inventory_id: v.optional(v.id("inventory")),
    item_name: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    unit_price: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.number(),
    notes: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_purchase_order", ["purchase_order_id"])
    .index("by_inventory", ["inventory_id"]),

  material_receipts: defineTable({
    receipt_number: v.string(), // Auto-generated MR-YYYY-XXXXX
    organization_id: v.id("organizations"),
    purchase_order_id: v.id("purchase_orders"),
    supplier_id: v.id("suppliers"),
    receipt_date: v.string(),
    delivery_note_number: v.optional(v.string()),
    status: v.union(v.literal("received"), v.literal("partially_received"), v.literal("completed")),
    notes: v.optional(v.string()),
    received_by: v.optional(v.string()),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_purchase_order", ["purchase_order_id"])
    .index("by_supplier", ["supplier_id"])
    .index("by_status", ["status"])
    .index("by_receipt_number", ["receipt_number"]),

  material_receipt_items: defineTable({
    material_receipt_id: v.id("material_receipts"),
    purchase_order_item_id: v.id("purchase_order_items"),
    item_name: v.string(),
    quantity_ordered: v.number(),
    quantity_received: v.number(),
    quantity_accepted: v.number(),
    quantity_rejected: v.number(),
    rejection_reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_material_receipt", ["material_receipt_id"])
    .index("by_purchase_order_item", ["purchase_order_item_id"]),

  // Email Management for Procurement
  procurement_emails: defineTable({
    organization_id: v.id("organizations"),
    email_type: v.union(v.literal("purchase_order"), v.literal("material_receipt"), v.literal("approval_request")),
    related_id: v.string(), // ID of the related document (PO, MR, etc.)
    recipient_email: v.string(),
    subject: v.string(),
    body: v.string(),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("delivered"), v.literal("failed")),
    sent_at: v.optional(v.string()),
    sent_by: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_email_type", ["email_type"])
    .index("by_status", ["status"])
    .index("by_related_id", ["related_id"]),

  // Profit Sharing System Tables
  partners: defineTable({
    organization_id: v.id("organizations"),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    email: v.optional(v.string()), // Made optional for backward compatibility
    phone: v.optional(v.string()),
    role: v.union(v.literal("business_partner"), v.literal("investor"), v.literal("saudi_sponsor"), v.literal("customer_referral"), v.literal("owner")), // Added "owner" role
    profit_percentage: v.optional(v.number()), // Made optional for backward compatibility - Percentage of profit this partner receives
    is_active: v.boolean(),
    notes: v.optional(v.string()),
    metadata: v.optional(v.any()), // Added for backward compatibility with existing data
    created_by: v.optional(v.string()), // Made optional for backward compatibility
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_role", ["role"])
    .index("by_active", ["is_active"]),

  order_financials: defineTable({
    organization_id: v.id("organizations"),
    quotation_id: v.id("quotations"),
    order_value_excl_vat: v.number(), // Total order value excluding VAT
    order_value_vat: v.number(), // VAT amount
    order_value_incl_vat: v.number(), // Total order value including VAT
    cost_excl_vat: v.number(), // Cost excluding VAT
    cost_vat: v.number(), // VAT on cost
    cost_incl_vat: v.number(), // Total cost including VAT
    markup_percentage: v.number(), // Markup percentage from quotation
    profit_amount: v.number(), // Calculated profit amount
    saudi_sponsor_percentage: v.number(), // Saudi sponsor percentage (default 2%)
    saudi_sponsor_amount: v.number(), // Saudi sponsor amount
    customer_referral_percentage: v.optional(v.number()), // Customer referral percentage if applicable
    customer_referral_amount: v.optional(v.number()), // Customer referral amount
    remaining_profit: v.number(), // Profit remaining after sponsor and referral deductions
    distribution_mode: v.union(v.literal("equal"), v.literal("percentage")), // How partners share remaining profit
    payment_status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("distributed")),
    payment_confirmed_at: v.optional(v.string()),
    payment_confirmed_by: v.optional(v.string()),
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_quotation", ["quotation_id"])
    .index("by_payment_status", ["payment_status"])
    .index("by_created_at", ["created_at"]),

  profit_distributions: defineTable({
    organization_id: v.id("organizations"),
    order_financial_id: v.id("order_financials"),
    partner_id: v.id("partners"),
    partner_name: v.string(), // Denormalized for performance
    partner_role: v.string(), // Denormalized for performance
    distribution_type: v.union(v.literal("saudi_sponsor"), v.literal("customer_referral"), v.literal("business_partner"), v.literal("investor")),
    percentage: v.number(), // Percentage of profit this partner receives
    amount: v.number(), // Actual amount distributed
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
    paid_at: v.optional(v.string()),
    paid_by: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_order_financial", ["order_financial_id"])
    .index("by_partner", ["partner_id"])
    .index("by_status", ["status"])
    .index("by_distribution_type", ["distribution_type"]),

  company_expenses: defineTable({
    organization_id: v.id("organizations"),
    expense_type: v.union(v.literal("registration"), v.literal("office_rent"), v.literal("utilities"), v.literal("marketing"), v.literal("Office Supplies"), v.literal("other")),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()), // Default SAR - made optional for existing data
    expense_date: v.string(),
    category: v.optional(v.string()),
    status: v.optional(v.string()), // Add status field for existing data
    approval_status: v.optional(v.string()), // Add approval status field
    invoice_details: v.optional(v.string()), // Add invoice details field
    remarks: v.optional(v.string()), // Add remarks field
    receipt_url: v.optional(v.string()),
    is_shared: v.optional(v.boolean()), // Whether this expense is shared among partners - made optional for existing data
    shared_percentage: v.optional(v.number()), // Percentage of expense shared among partners
    paid_by_partner_id: v.optional(v.id("partners")), // Partner who paid for this expense
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_expense_type", ["expense_type"])
    .index("by_expense_date", ["expense_date"])
    .index("by_is_shared", ["is_shared"]),

  profit_sharing_config: defineTable({
    organization_id: v.id("organizations"),
    saudi_sponsor_percentage: v.optional(v.number()), // Default 2%
    default_distribution_mode: v.optional(v.union(v.literal("equal"), v.literal("percentage"), v.literal("fixed_shares"))), // How partners share profit
    auto_distribute_on_payment: v.optional(v.boolean()), // Auto-distribute when payment confirmed
    require_approval_for_distribution: v.optional(v.boolean()), // Require approval before distribution
    currency: v.optional(v.string()), // Default SAR
    is_active: v.optional(v.boolean()),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
    // Legacy fields from existing table
    default_sponsor_pct: v.optional(v.number()),
    default_customer_ref_pct: v.optional(v.number()),
    sponsor_calc_base: v.optional(v.string()),
    loss_policy: v.optional(v.string()),
    residual_policy: v.optional(v.string()),
    rounding_rule: v.optional(v.string()),
  }).index("by_organization", ["organization_id"])
    .index("by_active", ["is_active"]),

  // ZATCA-Compliant Invoice Management Tables
  invoices: defineTable({
    // Basic Invoice Information
    invoice_number: v.string(),
    organization_id: v.id("organizations"),
    customer_id: v.id("customers"),
    
    // Reference Links (Optional - for tracking conversion sources)
    quotation_id: v.optional(v.id("quotations")),
    delivery_note_id: v.optional(v.id("delivery_notes")),
    lead_id: v.optional(v.id("leads")),
    purchase_order_id: v.optional(v.id("purchase_orders")),
    
    // Invoice Type and Reference Chain
    reference_type: v.optional(v.union(
      v.literal("lead"),
      v.literal("quotation"), 
      v.literal("purchase_order"),
      v.literal("delivery_note"),
      v.literal("standalone")
    )),
    reference_chain: v.optional(v.array(v.string())),
    
    // Enhanced Process Flow References
    process_flow_id: v.optional(v.id("process_flows")),
    inquiry_process_id: v.optional(v.id("inquiry_processes")),
    source_lead_number: v.optional(v.string()),
    source_quotation_number: v.optional(v.string()),
    source_delivery_note_number: v.optional(v.string()),
    source_purchase_order_number: v.optional(v.string()),
    
    // Invoice Classification
    invoice_type: v.union(
      v.literal("standard"),
      v.literal("simplified"),
      v.literal("credit_note"),
      v.literal("debit_note")
    ),
    
    // Dates
    invoice_date: v.string(),
    supply_date: v.optional(v.string()),
    due_date: v.optional(v.string()),
    
    // Customer Information (Denormalized for performance)
    customer_name: v.string(),
    customer_name_arabic: v.optional(v.string()),
    customer_address: v.string(),
    customer_address_arabic: v.optional(v.string()),
    customer_vat_number: v.optional(v.string()),
    customer_tax_id: v.optional(v.string()),
    
    // Financial Information
    subtotal: v.number(),
    total_discount: v.number(),
    total_vat: v.number(),
    grand_total: v.number(),
    currency: v.string(),
    vat_rate: v.number(),
    vat_amount_sar: v.number(),
    
    // Terms and Conditions
    payment_terms: v.string(),
    delivery_terms: v.string(),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    
    // Tax Treatment
    is_reverse_charge: v.optional(v.boolean()),
    is_self_accounting: v.optional(v.boolean()),
    tax_treatment: v.optional(v.string()),
    tax_treatment_arabic: v.optional(v.string()),
    
    // Invoice Status
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
    
    // ZATCA Compliance Fields
    is_filed: v.boolean(),
    is_validated: v.optional(v.boolean()),
    is_submitted: v.optional(v.boolean()),
    is_compliant: v.optional(v.boolean()),
    
    // ZATCA Technical Fields
    validation_result: v.optional(v.any()),
    validation_date: v.optional(v.string()),
    zatca_validation_uuid: v.optional(v.string()),
    
    submission_result: v.optional(v.any()),
    submission_date: v.optional(v.string()),
    zatca_reference: v.optional(v.string()),
    zatca_submission_uuid: v.optional(v.string()),
    zatca_qr_code: v.optional(v.string()),
    zatca_invoice_hash: v.optional(v.string()),
    zatca_digital_signature: v.optional(v.string()),
    zatca_ubl_xml: v.optional(v.string()),
    zatca_submission_status: v.optional(v.string()),
    zatca_submission_timestamp: v.optional(v.string()),
    
    compliance_result: v.optional(v.any()),
    compliance_date: v.optional(v.string()),
    
    // Digital Signature Fields
    digital_signature: v.optional(v.string()),
    signature_hash: v.optional(v.string()),
    certificate_serial: v.optional(v.string()),
    signature_date: v.optional(v.string()),
    
    // QR Code and Hash
    qr_code: v.optional(v.string()),
    qr_content: v.optional(v.string()),
    qr_generated_date: v.optional(v.string()),
    invoice_hash: v.optional(v.string()),
    hash_generated_date: v.optional(v.string()),
    
    // Audit Fields
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_customer", ["customer_id"])
    .index("by_quotation", ["quotation_id"])
    .index("by_delivery_note", ["delivery_note_id"])
    .index("by_lead", ["lead_id"])
    .index("by_purchase_order", ["purchase_order_id"])
    .index("by_status", ["status"])
    .index("by_invoice_type", ["invoice_type"])
    .index("by_invoice_date", ["invoice_date"])
    .index("by_zatca_validation_uuid", ["zatca_validation_uuid"])
    .index("by_zatca_submission_uuid", ["zatca_submission_uuid"]),

  // Invoice Items Table
  invoice_items: defineTable({
    invoice_id: v.id("invoices"),
    item_number: v.number(),
    
    // Item Description
    description: v.string(),
    description_arabic: v.string(),
    
    // Quantity and Pricing
    quantity: v.number(),
    unit: v.string(),
    unit_price: v.number(),
    discount_amount: v.optional(v.number()),
    discount_percentage: v.optional(v.number()),
    taxable_amount: v.number(),
    
    // VAT Information
    vat_rate: v.number(),
    vat_amount: v.number(),
    total_amount: v.number(),
    
    // Supply Type
    supply_type: v.string(),
    supply_type_arabic: v.optional(v.string()),
    
    // Tax Exemptions
    is_zero_rated: v.optional(v.boolean()),
    is_exempt: v.optional(v.boolean()),
    exemption_reason: v.optional(v.string()),
    exemption_reason_arabic: v.optional(v.string()),
    
    // Inventory Reference
    inventory_id: v.optional(v.id("inventory")),
    sku: v.optional(v.string()),
    
    // Additional fields to match quotation model
    purchase_price: v.optional(v.number()), // Purchase price for reference and calculations
    markup_amount: v.optional(v.number()), // Markup amount for this item
    inventory_name: v.optional(v.string()), // Store inventory name for reference
    notes: v.optional(v.string()), // Notes field
    total_price: v.optional(v.number()), // Total price (for compatibility with quotation model)
    
    // Audit Fields
    created_at: v.string(),
  }).index("by_invoice", ["invoice_id"])
    .index("by_inventory", ["inventory_id"]),

  // ZATCA XML Records Table (for audit trail)
  zatca_xml_records: defineTable({
    invoice_id: v.id("invoices"),
    xml_content: v.string(),
    xml_hash: v.string(),
    submission_uuid: v.string(),
    zatca_reference: v.optional(v.string()),
    environment: v.union(v.literal("sandbox"), v.literal("production")),
    submission_type: v.union(v.literal("validation"), v.literal("submission")),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_invoice", ["invoice_id"])
    .index("by_submission_uuid", ["submission_uuid"])
    .index("by_environment", ["environment"])
    .index("by_submission_type", ["submission_type"]),

  // ZATCA Audit Logs Table
  zatca_audit_logs: defineTable({
    invoice_id: v.id("invoices"),
    operation_type: v.string(),
    details: v.string(),
    zatca_reference: v.string(),
    error_message: v.string(),
    user_id: v.string(),
    organization_id: v.id("organizations"),
    timestamp: v.string(),
    created_at: v.string(),
  }).index("by_invoice", ["invoice_id"])
    .index("by_organization", ["organization_id"])
    .index("by_timestamp", ["timestamp"])
    .index("by_operation_type", ["operation_type"]),

  // Process References Table - Enhanced traceability and audit trail
  process_references: defineTable({
    // Source Document Information
    source_type: v.union(
      v.literal("lead"),
      v.literal("quotation"),
      v.literal("purchase_order"),
      v.literal("delivery_note"),
      v.literal("invoice")
    ),
    source_id: v.string(), // ID of the source document
    source_number: v.string(), // Human-readable number (e.g., "LEAD-123", "QT-456")
    
    // Target Document Information
    target_type: v.union(
      v.literal("quotation"),
      v.literal("invoice"),
      v.literal("delivery_note"),
      v.literal("purchase_order")
    ),
    target_id: v.string(), // ID of the target document
    target_number: v.string(), // Human-readable number
    
    // Process Flow Information
    organization_id: v.id("organizations"),
    process_flow_id: v.optional(v.id("process_flows")),
    inquiry_process_id: v.optional(v.id("inquiry_processes")),
    
    // Reference Chain Information
    reference_chain: v.array(v.object({
      step: v.number(),
      document_type: v.string(),
      document_id: v.string(),
      document_number: v.string(),
      action: v.string(), // "created", "converted", "updated", "approved"
      timestamp: v.string(),
      user_id: v.string(),
      user_name: v.string(),
      metadata: v.optional(v.any())
    })),
    
    // Financial Tracking
    source_amount: v.optional(v.number()),
    target_amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    conversion_rate: v.optional(v.number()),
    
    // Status and Validation
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("archived")
    ),
    is_primary_reference: v.boolean(), // True if this is the main source
    validation_status: v.optional(v.union(
      v.literal("valid"),
      v.literal("invalid"),
      v.literal("pending")
    )),
    
    // Audit Information
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
    notes: v.optional(v.string())
  }).index("by_source", ["source_type", "source_id"])
    .index("by_target", ["target_type", "target_id"])
    .index("by_organization", ["organization_id"])
    .index("by_process_flow", ["process_flow_id"])
    .index("by_inquiry_process", ["inquiry_process_id"])
    .index("by_status", ["status"])
    .index("by_primary_reference", ["is_primary_reference"]),
});
