import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core ERP Tables
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    website: v.optional(v.string()),
    logo_url: v.optional(v.string()),
    currency: v.optional(v.string()),
    vat_number: v.optional(v.string()),
    vat_rate: v.optional(v.string()),
    timezone: v.optional(v.string()),
    language: v.optional(v.string()),
    profit_sharing_enabled: v.optional(v.boolean()),
    profit_sharing_percentage: v.optional(v.string()),
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
    branch_name: v.optional(v.string()),
    branch_name_arabic: v.optional(v.string()),
    zatca_business_category: v.optional(v.string()),
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
    role: v.optional(v.string()),
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
    can_view_others: v.optional(v.boolean()),
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
    customer_ar_account_id: v.optional(v.union(v.id("chart_of_accounts"), v.string())),
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
    qr_code: v.optional(v.string()),
    qr_generated_at: v.optional(v.string()),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_sku", ["sku"]).index("by_category", ["category"]),

  inventory_movements: defineTable({
    inventory_id: v.id("inventory"),
    organization_id: v.id("organizations"),
    movement_type: v.union(v.literal("in"), v.literal("out")),
    quantity: v.number(),
    previous_quantity: v.number(),
    new_quantity: v.number(),
    reference: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_by: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("by_inventory", ["inventory_id"])
    .index("by_organization", ["organization_id"]),

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
    description_title: v.optional(v.string()), // Description title for quotations
    sync_items_to_inventory: v.optional(v.boolean()), // Sync items to inventory flag
    has_investor: v.optional(v.boolean()),
    investor_percentage: v.optional(v.number()),
    valid_until: v.optional(v.string()), // Alternative to expiry_date for frontend compatibility
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]).index("by_customer", ["customer_id"]).index("by_status", ["status"]).index("by_lead", ["lead_id"]),

  quotation_items: defineTable({
    quotation_id: v.id("quotations"),
    inventory_id: v.optional(v.id("inventory")),
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
    // WBS and Title fields for hierarchical sub-categorization
    wbs_code: v.optional(v.string()), // e.g. "1.0", "1.1", "1.2"
    item_title: v.optional(v.string()), // Distinct title/heading for the line item
    is_section_header: v.optional(v.boolean()), // Identifies if this row is a WBS section header
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
    supplier_type: v.optional(v.union(v.literal("general"), v.literal("recruitment_agency"))),
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
    service_ids: v.optional(v.array(v.string())),
    recruitment_license_number: v.optional(v.string()),
    recruitment_license_country: v.optional(v.string()),
    recruitment_license_expiry: v.optional(v.string()),
    recruitment_countries: v.optional(v.array(v.string())),
    recruitment_job_categories: v.optional(v.array(v.string())),
    recruitment_screening_checks: v.optional(v.array(v.string())),
    recruitment_fee_model: v.optional(v.string()),
    recruitment_fee_amount: v.optional(v.number()),
    recruitment_fee_currency: v.optional(v.string()),
    recruitment_replacement_days: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()), // Arabic notes
    supplier_ap_account_id: v.optional(v.union(v.id("chart_of_accounts"), v.string())),
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
    customer_address: v.optional(v.string()),
    customer_address_arabic: v.optional(v.string()),
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
    requested_by: v.optional(v.string()), // Added for backward compatibility
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
    is_section_header: v.optional(v.boolean()),
    item_no: v.optional(v.string()),
    item_title: v.optional(v.string()),
    unit: v.optional(v.string()),
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
    project_name: v.optional(v.string()),
    supplier_quotation_ref: v.optional(v.string()),
    terms_conditions: v.optional(v.string()),
    terms_conditions_title: v.optional(v.string()),
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
    unit: v.optional(v.string()),
    unit_price: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.number(),
    notes: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
    item_no: v.optional(v.string()),
    item_title: v.optional(v.string()),
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
    truck_number: v.optional(v.string()),
    driver_name: v.optional(v.string()),
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
    payment_source: v.optional(v.string()), // 'personal_reimbursement' | 'petty_cash'
    manager_approved_by: v.optional(v.string()),
    manager_approved_at: v.optional(v.string()),
    accountant_reviewed_by: v.optional(v.string()),
    accountant_reviewed_at: v.optional(v.string()),
    journal_voucher_number: v.optional(v.string()),
    vat_amount: v.optional(v.number()),
    subtotal_amount: v.optional(v.number()),
    vat_number: v.optional(v.string()),
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
    reference_type: v.optional(v.string()),
    reference_chain: v.optional(v.array(v.string())),
    
    // Enhanced Process Flow References
    process_flow_id: v.optional(v.id("process_flows")),
    inquiry_process_id: v.optional(v.id("inquiry_processes")),
    source_lead_number: v.optional(v.string()),
    source_quotation_number: v.optional(v.string()),
    source_delivery_note_number: v.optional(v.string()),
    source_purchase_order_number: v.optional(v.string()),
    
    // Invoice Classification
    invoice_type: v.string(),
    
    // Dates
    invoice_date: v.string(),
    supply_date: v.optional(v.string()),
    due_date: v.optional(v.string()),
    
    // Customer Information (Denormalized for performance)
    customer_name: v.string(),
    customer_name_arabic: v.optional(v.string()),
    customer_address: v.optional(v.string()),
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
    payment_terms: v.optional(v.string()),
    delivery_terms: v.optional(v.string()),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    terms_conditions: v.optional(v.string()),
    customer_po_reference: v.optional(v.string()),
    delivery_note_number: v.optional(v.string()),
    advance_amount: v.optional(v.number()),
    balance_due: v.optional(v.number()),
    other_deductions: v.optional(v.number()),
    retention_amount: v.optional(v.number()),
    qr_code_data: v.optional(v.string()),
    seller_bank_details: v.optional(v.string()),
    customer_bank_details: v.optional(v.string()),
    project_reference: v.optional(v.string()),
    is_advance_payment_request: v.optional(v.boolean()),
    
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
    zatca_enabled: v.optional(v.boolean()),
    zatca_invoice_counter: v.optional(v.number()),
    zatca_invoice_type: v.optional(v.string()),
    zatca_previous_hash: v.optional(v.string()),
    zatca_qr_code_tlv: v.optional(v.string()),
    zatca_uuid: v.optional(v.string()),
    zatca_xml_content: v.optional(v.string()),
    
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
    item_number: v.optional(v.number()),
    
    // Item Description
    description: v.string(),
    description_arabic: v.optional(v.string()),
    
    // Quantity and Pricing
    quantity: v.number(),
    delivered_quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    unit_price: v.number(),
    discount_amount: v.optional(v.number()),
    discount_percentage: v.optional(v.number()),
    taxable_amount: v.optional(v.number()),
    
    // VAT Information
    vat_rate: v.number(),
    vat_amount: v.number(),
    total_amount: v.optional(v.number()),
    line_total: v.optional(v.number()),
    line_total_with_vat: v.optional(v.number()),
    quotation_item_id: v.optional(v.union(v.id("quotation_items"), v.string())),
    
    // Supply Type
    supply_type: v.optional(v.string()),
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

  // Units table for inventory management
  units: defineTable({
    name: v.string(),
    name_arabic: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    abbreviation_arabic: v.optional(v.string()),
    category: v.optional(v.string()),
    is_predefined: v.optional(v.boolean()),
    organization_id: v.id("organizations"),
    is_active: v.boolean(),
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  // ========================================
  // CORE ACCOUNTING MODULE TABLES
  // ========================================

  accounting_settings: defineTable({
    organization_id: v.id("organizations"),
    fiscal_year_start: v.string(),
    default_currency: v.string(),
    base_currency: v.string(),
    auto_generate_voucher_numbers: v.boolean(),
    voucher_number_prefix: v.string(),
    receipt_number_prefix: v.string(),
    payment_number_prefix: v.string(),
    enable_multi_currency: v.boolean(),
    enable_budget_control: v.boolean(),
    enable_approval_workflow: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]),

  fiscal_periods: defineTable({
    organization_id: v.id("organizations"),
    fiscal_year: v.string(),
    period_code: v.string(),
    period_name: v.string(),
    start_date: v.string(),
    end_date: v.string(),
    is_closed: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_fiscal_year", ["organization_id", "fiscal_year"])
    .index("by_organization", ["organization_id"]),

  chart_of_accounts: defineTable({
    organization_id: v.id("organizations"),
    account_code: v.string(),
    account_name: v.string(),
    account_name_arabic: v.optional(v.string()),
    account_type: v.string(),
    account_category: v.string(),
    normal_balance: v.optional(v.string()),
    parent_account_id: v.optional(v.id("chart_of_accounts")),
    description: v.optional(v.string()),
    created_by: v.union(v.id("user_profiles"), v.string()),
    is_active: v.boolean(),
    is_system_account: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_account_code", ["organization_id", "account_code"])
    .index("by_account_type", ["organization_id", "account_type"])
    .index("by_parent_account", ["parent_account_id"]),

  general_ledger: defineTable({
    organization_id: v.id("organizations"),
    account_id: v.id("chart_of_accounts"),
    transaction_id: v.string(),
    transaction_type: v.string(),
    reference_id: v.optional(v.string()),
    reference_type: v.optional(v.string()),
    debit_amount: v.number(),
    credit_amount: v.number(),
    balance: v.number(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    transaction_date: v.string(),
    fiscal_year: v.string(),
    fiscal_period: v.string(),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_account", ["organization_id", "account_id"])
    .index("by_transaction", ["transaction_id"])
    .index("by_transaction_date", ["organization_id", "transaction_date"])
    .index("by_fiscal_period", ["organization_id", "fiscal_period"]),

  journal_vouchers: defineTable({
    organization_id: v.id("organizations"),
    voucher_number: v.string(),
    voucher_date: v.string(),
    reference_number: v.optional(v.string()),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    total_debit: v.number(),
    total_credit: v.number(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    status: v.string(),
    fiscal_year: v.string(),
    fiscal_period: v.string(),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_voucher_number", ["organization_id", "voucher_number"])
    .index("by_voucher_date", ["organization_id", "voucher_date"])
    .index("by_status", ["organization_id", "status"]),

  journal_voucher_entries: defineTable({
    organization_id: v.id("organizations"),
    voucher_id: v.id("journal_vouchers"),
    account_id: v.id("chart_of_accounts"),
    debit_amount: v.number(),
    credit_amount: v.number(),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    reference: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_voucher", ["voucher_id"])
    .index("by_account", ["account_id"]),

  payments: defineTable({
    organization_id: v.id("organizations"),
    payment_number: v.string(),
    payment_date: v.string(),
    supplier_id: v.optional(v.id("suppliers")),
    supplier_name: v.optional(v.string()),
    payment_method: v.string(),
    bank_account_id: v.optional(v.id("chart_of_accounts")),
    amount: v.number(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    reference_invoice_ids: v.optional(v.array(v.string())),
    status: v.string(),
    fiscal_year: v.string(),
    fiscal_period: v.string(),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_payment_number", ["organization_id", "payment_number"])
    .index("by_payment_date", ["organization_id", "payment_date"])
    .index("by_supplier", ["organization_id", "supplier_id"]),

  receipts: defineTable({
    organization_id: v.id("organizations"),
    receipt_number: v.string(),
    receipt_date: v.string(),
    customer_id: v.optional(v.id("customers")),
    customer_name: v.optional(v.string()),
    payment_method: v.string(),
    bank_account_id: v.optional(v.id("chart_of_accounts")),
    amount: v.number(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    reference_invoice_ids: v.optional(v.array(v.string())),
    status: v.string(),
    fiscal_year: v.string(),
    fiscal_period: v.string(),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_receipt_number", ["organization_id", "receipt_number"])
    .index("by_receipt_date", ["organization_id", "receipt_date"])
    .index("by_customer", ["organization_id", "customer_id"]),

  // ========================================
  // CORPORATE GOVERNANCE & MULTI-COMPANY TABLES
  // ========================================

  projects: defineTable({
    organization_id: v.id("organizations"), // Lead Contractor / Project Owner Org
    project_code: v.string(),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    client_name: v.string(),
    contract_value: v.number(),
    currency: v.string(),
    start_date: v.string(),
    planned_end_date: v.string(),
    actual_end_date: v.optional(v.string()),
    location: v.optional(v.string()),
    status: v.union(v.literal("tender"), v.literal("active"), v.literal("suspended"), v.literal("completed"), v.literal("closed")),
    description: v.optional(v.string()),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_project_code", ["project_code"])
    .index("by_status", ["organization_id", "status"]),

  collaboration_agreements: defineTable({
    agreement_code: v.string(),
    project_id: v.id("projects"),
    primary_organization_id: v.id("organizations"), // Legal Umbrella (Company A)
    partner_organization_id: v.id("organizations"), // Operating Partner (Company B, C, D)
    collaboration_type: v.string(), // "CR_BRAND_SPONSORSHIP", "EQUIPMENT_LEASE", "MANPOWER_SECONDMENT", "CONSORTIUM_JV", "SHARED_PROCUREMENT", "GENERAL_SUBCONTRACT"
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("suspended"), v.literal("terminated"), v.literal("completed")),
    effective_from: v.string(),
    effective_to: v.string(),
    management_fee_type: v.union(v.literal("zero_fee"), v.literal("percentage"), v.literal("fixed_monthly"), v.literal("profit_split")),
    management_fee_value: v.number(), // 0 for zero fee, e.g. 3 for 3%
    liability_cap: v.optional(v.number()),
    dispute_jurisdiction: v.optional(v.string()),
    terms_summary: v.optional(v.string()),
    signed_by_primary: v.optional(v.id("user_profiles")),
    signed_by_partner: v.optional(v.id("user_profiles")),
    signed_at: v.optional(v.string()),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_primary_org", ["primary_organization_id"])
    .index("by_partner_org", ["partner_organization_id"])
    .index("by_project", ["project_id"])
    .index("by_status", ["status"]),

  promissory_notes: defineTable({
    note_number: v.string(), // e.g. "SANAD-2026-001"
    project_id: v.id("projects"),
    collaboration_agreement_id: v.optional(v.id("collaboration_agreements")),
    issuing_organization_id: v.id("organizations"), // Company A (Legal Debtor on note)
    beneficiary_organization_id: v.id("organizations"), // Company B (Operating company using it)
    creditor_name: v.string(), // Supplier / Vendor / Bank holding the note
    creditor_cr: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    issue_date: v.string(),
    due_date: v.string(),
    nafith_reference: v.optional(v.string()),
    purpose: v.string(),
    counter_secured: v.boolean(), // True if Company B signed a counter-indemnity note
    counter_security_details: v.optional(v.string()),
    counter_security_doc_url: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("discharged"), v.literal("enforced"), v.literal("disputed")),
    discharged_at: v.optional(v.string()),
    discharged_by: v.optional(v.id("user_profiles")),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_issuing_org", ["issuing_organization_id"])
    .index("by_beneficiary_org", ["beneficiary_organization_id"])
    .index("by_project", ["project_id"])
    .index("by_due_date", ["due_date"])
    .index("by_status", ["status"]),

  borrowing_facilities: defineTable({
    facility_code: v.string(),
    legal_debtor_organization_id: v.id("organizations"), // Company A (whose name facility is opened in)
    beneficiary_organization_id: v.id("organizations"), // Company B (who draws and uses funds)
    project_id: v.optional(v.id("projects")),
    lender_name: v.string(),
    facility_type: v.union(v.literal("bank_loan"), v.literal("overdraft"), v.literal("invoice_factoring"), v.literal("supplier_credit_line"), v.literal("kafala")),
    approved_limit: v.number(),
    drawn_amount: v.number(),
    outstanding_balance: v.number(),
    finance_cost_rate: v.number(), // Interest / Murabaha percentage
    currency: v.string(),
    start_date: v.string(),
    expiry_date: v.string(),
    counter_indemnity_verified: v.boolean(),
    repayment_waterfall_priority: v.number(), // Default 1 (Senior priority)
    status: v.union(v.literal("active"), v.literal("frozen"), v.literal("closed")),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_debtor_org", ["legal_debtor_organization_id"])
    .index("by_beneficiary_org", ["beneficiary_organization_id"])
    .index("by_status", ["status"]),

  credit_drawdowns: defineTable({
    drawdown_reference: v.string(),
    facility_id: v.id("borrowing_facilities"),
    project_id: v.id("projects"),
    requested_by_org_id: v.id("organizations"), // Company B
    approved_by_org_id: v.id("organizations"), // Company A
    drawdown_amount: v.number(),
    accrued_fees: v.number(),
    drawdown_date: v.string(),
    repayment_due_date: v.string(),
    purpose_details: v.string(),
    repaid_amount: v.number(),
    status: v.union(v.literal("requested"), v.literal("approved"), v.literal("disbursed"), v.literal("repaid"), v.literal("defaulted")),
    approved_by: v.optional(v.id("user_profiles")),
    approved_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_facility", ["facility_id"])
    .index("by_project", ["project_id"])
    .index("by_status", ["status"]),

  credential_authorizations: defineTable({
    passport_code: v.string(),
    authorizing_organization_id: v.id("organizations"), // Company A
    authorized_organization_id: v.id("organizations"), // Company B
    project_id: v.optional(v.id("projects")),
    credential_type: v.string(), // "Commercial Registration (CR)", "Class 1 Contractor Classification", "Aramco Vendor Code", etc.
    certificate_reference: v.string(),
    allowed_tender_scope: v.string(),
    max_authorized_value: v.optional(v.number()),
    valid_from: v.string(),
    valid_to: v.string(),
    verification_token: v.string(), // Cryptographic token for verification QR
    allows_borrowing: v.boolean(),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("revoked")),
    approved_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_authorizing_org", ["authorizing_organization_id"])
    .index("by_authorized_org", ["authorized_organization_id"])
    .index("by_token", ["verification_token"])
    .index("by_status", ["status"]),

  responsibility_matrices: defineTable({
    project_id: v.id("projects"),
    activity_name: v.string(),
    wbs_code: v.optional(v.string()),
    discipline: v.string(), // "Civil", "Mechanical", "Electrical", "HSE", "Billing", "Procurement"
    organization_id: v.id("organizations"),
    raci_role: v.union(v.literal("R"), v.literal("A"), v.literal("C"), v.literal("I"), v.literal("INDEMNIFIER")),
    liability_notes: v.optional(v.string()),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_project", ["project_id"])
    .index("by_org", ["organization_id"])
    .index("by_project_discipline", ["project_id", "discipline"]),

  resources: defineTable({
    owner_organization_id: v.id("organizations"),
    category: v.union(v.literal("manpower"), v.literal("heavy_equipment"), v.literal("light_vehicle"), v.literal("material"), v.literal("specialist"), v.literal("facility"), v.literal("financial_credit"), v.literal("license")),
    sub_category: v.string(),
    identifier: v.string(),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    standard_unit: v.string(),
    base_rate: v.number(),
    currency: v.string(),
    current_status: v.union(v.literal("available"), v.literal("allocated"), v.literal("maintenance"), v.literal("retired")),
    current_location: v.optional(v.string()),
    specifications: v.optional(v.any()),
    expiry_date: v.optional(v.string()),
    is_sharable_externally: v.boolean(),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_owner", ["owner_organization_id"])
    .index("by_category", ["owner_organization_id", "category"])
    .index("by_status", ["owner_organization_id", "current_status"]),

  resource_requests: defineTable({
    request_number: v.string(),
    project_id: v.id("projects"),
    collaboration_agreement_id: v.optional(v.id("collaboration_agreements")),
    requesting_organization_id: v.id("organizations"),
    supplying_organization_id: v.id("organizations"),
    resource_id: v.optional(v.id("resources")),
    category: v.string(),
    quantity: v.number(),
    unit: v.string(),
    requested_rate: v.number(),
    start_date: v.string(),
    end_date: v.string(),
    mobilization_location: v.string(),
    terms_conditions: v.optional(v.string()),
    counter_offer_data: v.optional(v.any()),
    status: v.union(v.literal("submitted"), v.literal("counter_offered"), v.literal("approved"), v.literal("rejected"), v.literal("allocated"), v.literal("cancelled")),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_requesting_org", ["requesting_organization_id"])
    .index("by_supplying_org", ["supplying_organization_id"])
    .index("by_project", ["project_id"])
    .index("by_status", ["status"]),

  resource_allocations: defineTable({
    allocation_number: v.string(),
    request_id: v.id("resource_requests"),
    resource_id: v.id("resources"),
    project_id: v.id("projects"),
    supplying_organization_id: v.id("organizations"),
    receiving_organization_id: v.id("organizations"),
    handover_date: v.string(),
    handover_meter_reading: v.optional(v.number()),
    handover_condition_notes: v.optional(v.string()),
    handover_signoff_by: v.optional(v.id("user_profiles")),
    expected_return_date: v.string(),
    actual_return_date: v.optional(v.string()),
    return_meter_reading: v.optional(v.number()),
    return_condition_notes: v.optional(v.string()),
    return_signoff_by: v.optional(v.id("user_profiles")),
    status: v.union(v.literal("mobilizing"), v.literal("active_on_site"), v.literal("demobilizing"), v.literal("returned"), v.literal("maintenance_hold")),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_resource", ["resource_id"])
    .index("by_request", ["request_id"])
    .index("by_project", ["project_id"])
    .index("by_status", ["status"]),

  inter_company_transactions: defineTable({
    transaction_code: v.string(),
    project_id: v.id("projects"),
    collaboration_agreement_id: v.optional(v.id("collaboration_agreements")),
    debtor_organization_id: v.id("organizations"), // Owes money
    creditor_organization_id: v.id("organizations"), // Receives money
    allocation_id: v.optional(v.id("resource_allocations")),
    transaction_type: v.union(
      v.literal("client_progress_share"),
      v.literal("material_recharge"),
      v.literal("equipment_hire"),
      v.literal("manpower_subcontract"),
      v.literal("site_fuel_dispensed"),
      v.literal("camp_accommodation"),
      v.literal("management_fee"),
      v.literal("safety_fine_deduction"),
      v.literal("debt_repayment")
    ),
    amount_excl_vat: v.number(),
    vat_rate: v.number(), // 15
    vat_amount: v.number(),
    total_amount: v.number(),
    currency: v.string(),
    transaction_date: v.string(),
    description: v.string(),
    supporting_doc_url: v.optional(v.string()),
    reference_po_or_invoice: v.optional(v.string()),
    is_settled: v.boolean(),
    settlement_id: v.optional(v.id("bilateral_settlements")),
    status: v.union(v.literal("unverified"), v.literal("verified"), v.literal("disputed"), v.literal("approved_for_settlement"), v.literal("settled")),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_debtor_org", ["debtor_organization_id"])
    .index("by_creditor_org", ["creditor_organization_id"])
    .index("by_project", ["project_id"])
    .index("by_settled", ["is_settled"])
    .index("by_status", ["status"]),

  bilateral_settlements: defineTable({
    settlement_reference: v.string(), // e.g. "SETTLE-2026-10-001"
    collaboration_agreement_id: v.optional(v.id("collaboration_agreements")),
    organization_a_id: v.id("organizations"),
    organization_b_id: v.id("organizations"),
    statement_period_start: v.string(),
    statement_period_end: v.string(),
    gross_a_to_b: v.number(),
    gross_b_to_a: v.number(),
    net_vat_offset: v.number(),
    net_payable_amount: v.number(),
    net_payer_organization_id: v.id("organizations"),
    net_payee_organization_id: v.id("organizations"),
    currency: v.string(),
    status: v.union(v.literal("draft"), v.literal("reconciled"), v.literal("signed"), v.literal("discharged")),
    signed_by_a: v.optional(v.id("user_profiles")),
    signed_by_b: v.optional(v.id("user_profiles")),
    payment_reference: v.optional(v.string()),
    discharged_at: v.optional(v.string()),
    created_by: v.id("user_profiles"),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_org_pair", ["organization_a_id", "organization_b_id"])
    .index("by_status", ["status"]),

  governance_audit_logs: defineTable({
    entity_type: v.string(), // "promissory_note", "drawdown", "credential_auth", "counter_offer", "settlement"
    entity_id: v.string(),
    action: v.string(),
    actor_user_id: v.id("user_profiles"),
    actor_organization_id: v.id("organizations"),
    timestamp: v.string(),
    previous_state: v.optional(v.any()),
    new_state: v.optional(v.any()),
    reason: v.optional(v.string()),
    ip_address: v.optional(v.string()),
  }).index("by_entity", ["entity_type", "entity_id"])
    .index("by_org", ["actor_organization_id"])
    .index("by_timestamp", ["timestamp"]),

  // ==========================================
  // HR, KSA SALARY & RESTRICTED ACCESS MODULE
  // ==========================================
  employees: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    user_id: v.optional(v.union(v.id("user_profiles"), v.string())),
    employee_number: v.string(), // e.g. "EMP-001"
    first_name: v.string(),
    last_name: v.string(),
    full_name_arabic: v.string(),
    national_id_or_iqama: v.string(), // 10-digit Saudi ID or Iqama
    nationality: v.string(), // "SA" or ISO-2
    is_saudi: v.boolean(),
    gender: v.string(), // "male" | "female"
    job_title: v.string(),
    job_title_arabic: v.optional(v.string()),
    department: v.string(),
    date_of_birth: v.optional(v.string()),
    hire_date: v.string(),
    contract_type: v.string(), // "fixed_term" | "indefinite"
    probation_end_date: v.optional(v.string()),

    // Enhanced Employment Classification & Work Parameters
    employment_type: v.optional(v.string()), // "permanent" | "fixed_term" | "probationary" | "part_time" | "temporary" | "consultant" | "ajeer_subcontracted" | "intern_tamheer" | "remote"
    work_location: v.optional(v.string()), // "head_office_riyadh" | "khobar_branch" | "jeddah_hub" | "site_project" | "remote"
    site_project_name: v.optional(v.string()),
    work_location_spl: v.optional(v.string()), // Saudi Post (SPL) Short Address e.g. "RRRD2929"
    work_location_gps: v.optional(v.string()), // GPS Lat,Lng e.g. "24.7136, 46.6753"
    work_location_maps_url: v.optional(v.string()), // Google Maps URL

    // National Address (العنوان الوطني - Saudi Post SPL)
    national_address: v.optional(v.object({
      short_address: v.optional(v.string()), // e.g. "RRRD2929" (Primary SPL National Address)
      spl_address: v.optional(v.string()),
      gps_coordinates: v.optional(v.string()),
      building_number: v.optional(v.string()),
      street_name: v.optional(v.string()),
      street_name_arabic: v.optional(v.string()),
      district: v.optional(v.string()),
      district_arabic: v.optional(v.string()),
      city: v.optional(v.string()),
      city_arabic: v.optional(v.string()),
      postal_code: v.optional(v.string()),
      additional_number: v.optional(v.string()),
    })),

    // Medical Examination & Reports (الكشف الطبي / فحص الإقامة وما قبل التوظيف / منصة إفادة Efada)
    medical_report: v.optional(v.object({
      status: v.string(), // "fit" | "unfit" | "pending_results"
      medical_center: v.string(),
      exam_date: v.string(),
      report_reference_no: v.optional(v.string()), // Efada / Report reference
      attachment_url: v.optional(v.string()),
      file_name: v.optional(v.string()),
      notes: v.optional(v.string()),
    })),

    // Emergency Contact & Medical Notes
    emergency_contact: v.optional(v.object({
      name: v.string(),
      relationship: v.string(),
      phone_primary: v.string(),
      phone_secondary: v.optional(v.string()),
      city: v.optional(v.string()),
    })),
    blood_group: v.optional(v.string()), // "A+", "B+", "O+", "AB+", etc.
    chronic_medical_notes: v.optional(v.string()),

    // GOSI (التأمينات الاجتماعية) Details
    gosi_subscriber_number: v.optional(v.string()),
    gosi_registration_date: v.optional(v.string()),

    // Dependents for Medical Insurance (CCHI)
    dependents: v.optional(v.array(v.object({
      full_name: v.string(),
      relationship: v.string(), // "spouse" | "son" | "daughter" | "parent"
      national_id_or_iqama: v.string(),
      date_of_birth: v.optional(v.string()),
      gender: v.string(),
    }))),

    // Qiwa (منصة قوى - MHRSD) Contract Integration
    qiwa_contract_id: v.optional(v.string()), // e.g. "QW-10829471"
    qiwa_contract_status: v.optional(v.string()), // "authenticated" | "pending_signature" | "draft" | "unlinked"
    qiwa_authenticated_at: v.optional(v.string()),

    status: v.string(), // "active" | "pending_whatsapp_approval" | "on_leave" | "probation" | "terminated"
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Saudi Banking & WPS (Wage Protection System)
    bank_name: v.string(), // e.g. "Al Rajhi Bank"
    bank_swift_code: v.string(), // e.g. "RJHISARI"
    iban: v.string(), // 24-character Saudi IBAN (SA...)

    // ERP Access Control & Granular Permissions
    erp_access_enabled: v.boolean(),
    assigned_role: v.string(), // "sales_officer", "procurement_specialist", "accountant", "cashier", "warehouse_manager", "hr_manager", "general_staff"
    module_permissions: v.array(v.string()), // Array of specific permission keys e.g. ["quotations:create", "quotations:read", "invoices:read"]
    data_scope: v.string(), // "own" | "department" | "organization"

    // WhatsApp Approval Tracking for Access
    access_approval_status: v.string(), // "none" | "pending_whatsapp_approval" | "approved" | "rejected"
    access_approved_by: v.optional(v.string()),
    // Employment Level (1 to 7) & Org Chart Hierarchy
    employment_level: v.optional(v.number()), // 1 (C-Suite) to 7 (Entry/Intern)
    reports_to_id: v.optional(v.string()), // Reports-to employee ID for Org Chart

    // 2FA Security
    phone_2fa_verified: v.optional(v.boolean()),
    two_factor_enabled: v.optional(v.boolean()),

    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_user_id", ["user_id"])
    .index("by_national_id", ["national_id_or_iqama"])
    .index("by_emp_number", ["organization_id", "employee_number"]),

  // Employee Salary Contract (KSA Labor Law & GOSI Compliant)
  employee_compensation: defineTable({
    employee_id: v.union(v.id("employees"), v.string()),
    organization_id: v.union(v.id("organizations"), v.string()),
    basic_salary: v.number(),
    housing_allowance: v.number(), // Typically 25% of basic
    transport_allowance: v.number(),
    other_allowances: v.number(),
    currency: v.string(), // "SAR"

    // GOSI (General Organization for Social Insurance)
    is_saudi: v.boolean(),
    gosi_applicable: v.boolean(),
    gosi_employee_rate: v.number(), // 0.0975 for Saudi (9% Annuities + 0.75% SANED), 0 for Expat
    gosi_employer_rate: v.number(), // 0.1175 for Saudi, 0.02 for Expat
    gosi_employee_deduction: v.number(),
    gosi_employer_contribution: v.number(),

    // Totals
    gross_salary: v.number(), // Basic + Housing + Transport + Other
    net_salary: v.number(), // Gross - GOSI Employee Deduction

    effective_date: v.string(),
    status: v.string(), // "active" | "pending_whatsapp_approval" | "rejected"
    approval_request_id: v.optional(v.string()),

    // Qiwa (منصة قوى) Contract Mirroring
    qiwa_contract_id: v.optional(v.string()),
    qiwa_contract_status: v.optional(v.string()),
    qiwa_authenticated_at: v.optional(v.string()),

    approved_by: v.optional(v.string()),
    approved_at: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_employee", ["employee_id"])
    .index("by_organization", ["organization_id"]),

  // Stakeholder Approvers for WhatsApp Bot
  stakeholder_approvers: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    full_name: v.string(),
    role: v.string(), // "sponsor", "managing_director", "cfo", "hr_director", "owner"
    phone_number: v.string(), // e.g. "+966501234567"
    is_active: v.boolean(),
    notification_channel: v.string(), // "whatsapp"
    approval_scope: v.array(v.string()), // ["erp_access", "salary_contract", "payroll_batch", "all"]
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_org", ["organization_id"])
    .index("by_phone", ["phone_number"]),

  // WhatsApp Approval Request Log & Audit Trail
  whatsapp_approval_requests: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    request_type: v.string(), // "erp_access" | "salary_contract" | "payroll_batch" | "eosb_settlement"
    reference_id: v.string(), // e.g. "EMP-001", "PAY-2026-10"
    reference_record_id: v.string(),
    verification_token: v.string(), // Unique one-time token for callback authentication
    approver_phone: v.string(),
    approver_name: v.string(),
    status: v.string(), // "pending" | "approved" | "rejected" | "expired"
    summary_text: v.string(),
    payload: v.optional(v.string()), // JSON string of details
    sent_at: v.string(),
    responded_at: v.optional(v.string()),
    raw_whatsapp_payload: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
  }).index("by_token", ["verification_token"])
    .index("by_status", ["status"])
    .index("by_org", ["organization_id"])
    .index("by_ref", ["reference_record_id"]),

  // Monthly Payroll Runs & WPS SIF Generation
  payroll_runs: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    payroll_month: v.string(), // e.g. "2026-10"
    total_employees: v.number(),
    total_basic: v.number(),
    total_housing: v.number(),
    total_allowances: v.number(),
    total_gosi_deductions: v.number(),
    total_net_payable: v.number(),
    currency: v.string(), // "SAR"
    status: v.string(), // "draft" | "pending_whatsapp_approval" | "approved" | "processed"
    whatsapp_approval_id: v.optional(v.string()),
    approved_by_stakeholder: v.optional(v.string()),
    approved_at: v.optional(v.string()),
    sif_file_generated: v.boolean(),
    sif_file_content: v.optional(v.string()), // SAMA/Mudad standard SIF text
    processed_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_org_month", ["organization_id", "payroll_month"])
    .index("by_org", ["organization_id"]),

  // Custom User-Defined Departments
  departments: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    parent_department_id: v.optional(v.string()),
    head_of_department_id: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"]),

  // Custom User-Defined Banks & Bank Accounts
  organization_banks: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    bank_name: v.string(),
    bank_name_arabic: v.optional(v.string()),
    swift_code: v.string(),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    currency: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
  }).index("by_organization", ["organization_id"]),

  // Phone 2FA Verification Codes
  phone_verifications: defineTable({
    phone_number: v.string(),
    otp_code: v.string(),
    expires_at: v.string(),
    verified: v.boolean(),
    created_at: v.string(),
  }).index("by_phone", ["phone_number"]),

  // Employee Leaves & Vacations (Saudi Labor Law Articles 109-117 Compliant)
  employee_leaves: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    leave_type: v.string(), // "annual" | "sick" | "unpaid" | "marriage" | "paternity" | "bereavement" | "maternity" | "hajj"
    start_date: v.string(), // "YYYY-MM-DD"
    end_date: v.string(),   // "YYYY-MM-DD"
    days_count: v.number(),
    status: v.string(), // "pending_manager_approval" | "pending_hr_approval" | "approved" | "rejected"
    manager_approval_request_id: v.optional(v.string()),
    hr_approval_request_id: v.optional(v.string()),
    travel_outside_saudi: v.optional(v.boolean()),
    medical_report_ref: v.optional(v.string()), // Sehhaty (صحتي) SL report number
    notes: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_employee", ["employee_id"])
    .index("by_org", ["organization_id"])
    .index("by_emp_dates", ["employee_id", "start_date"]),

  employee_exit_reentry_tasks: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    leave_id: v.id("employee_leaves"),
    status: v.string(), // "pending" | "in_progress" | "completed" | "cancelled"
    created_at: v.string(),
    updated_at: v.string(),
    notes: v.optional(v.string()),
  }).index("by_org", ["organization_id"])
    .index("by_leave", ["leave_id"]),

  // Employee Legal Documents & Expiries (Iqama, Passport, CCHI Insurance, Licenses)
  employee_legal_documents: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    document_type: v.string(), // "iqama" | "national_id" | "passport" | "medical_insurance" | "driving_license" | "professional_accreditation" | "ajeer_notice"
    document_number: v.string(),
    issue_date_gregorian: v.string(),
    issue_date_hijri: v.optional(v.string()),
    expiry_date_gregorian: v.string(),
    expiry_date_hijri: v.optional(v.string()),
    issuing_authority: v.optional(v.string()), // "Jawazat" | "Moroor" | "SCE" | "SOCPA" | "CCHI"
    insurance_provider: v.optional(v.string()),
    insurance_class: v.optional(v.string()), // "VIP" | "Class A" | "Class B" | "Class C"
    insurance_policy_number: v.optional(v.string()),
    file_url: v.optional(v.string()),
    status: v.string(), // "valid" | "expiring_soon" | "expired"
    notes: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_employee", ["employee_id"])
    .index("by_org", ["organization_id"])
    .index("by_org_expiry", ["organization_id", "expiry_date_gregorian"]),

  // Company Asset Catalog (Hardware, Vehicles, Machinery, Furniture)
  assets: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    asset_tag: v.string(), // e.g. "AST-IT-001", "AST-VEH-001"
    asset_name: v.string(),
    asset_name_arabic: v.optional(v.string()),
    category: v.string(), // "it_hardware" | "vehicles_fleet" | "machinery_tools" | "furniture" | "mobile_telecom" | "facility_equipment"
    sub_category: v.optional(v.string()),
    brand: v.string(),
    model: v.string(),
    serial_number: v.optional(v.string()),
    barcode_or_qr_code: v.string(),
    purchase_date: v.string(),
    purchase_cost: v.number(),
    currency: v.string(), // "SAR"
    supplier_id: v.optional(v.string()),
    warranty_expiry_date: v.optional(v.string()),
    useful_life_months: v.optional(v.number()),
    salvage_value: v.optional(v.number()),
    current_book_value: v.optional(v.number()),

    // Fleet & Vehicle Specific Compliance
    vehicle_details: v.optional(v.object({
      plate_number: v.string(),
      plate_number_arabic: v.optional(v.string()),
      istimara_expiry: v.string(),
      fahas_expiry: v.string(),
      insurance_policy_number: v.string(),
      insurance_expiry: v.string(),
      fuel_card_number: v.optional(v.string()),
      current_odometer_km: v.optional(v.number()),
    })),

    status: v.string(), // "available" | "pending_handover_acceptance" | "assigned_custody" | "under_maintenance" | "damaged" | "disposed_written_off"
    current_holder_employee_id: v.optional(v.string()),
    physical_location: v.string(),
    notes: v.optional(v.string()),
    // WhatsApp Approval & Acceptance fields
    custody_whatsapp_request_id: v.optional(v.string()),
    custody_acceptance_status: v.optional(v.string()), // "pending" | "accepted" | "rejected"
    custody_accepted_at: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_asset_tag", ["organization_id", "asset_tag"])
    .index("by_category", ["organization_id", "category"])
    .index("by_status", ["organization_id", "status"])
    .index("by_holder", ["current_holder_employee_id"]),

  // Asset Custody Handover & Return History (سجل تسليم واسترداد العهد)
  asset_custody_logs: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    asset_id: v.union(v.id("assets"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    action: v.string(), // "handover" | "return" | "transfer"
    assigned_date: v.string(),
    returned_date: v.optional(v.string()),
    condition_at_handover: v.string(), // "new" | "excellent" | "good" | "fair"
    condition_at_return: v.optional(v.string()), // "good" | "damaged" | "lost"
    handover_form_url: v.optional(v.string()),
    handed_over_by_user_id: v.string(),
    received_by_signature: v.optional(v.string()),
    notes: v.optional(v.string()),
    // WhatsApp Acceptance / Signoff Details
    whatsapp_request_id: v.optional(v.string()),
    acceptance_status: v.optional(v.string()), // "pending" | "accepted" | "rejected"
    accepted_at: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_asset", ["asset_id"])
    .index("by_employee", ["employee_id"]),

  // Asset Maintenance & Repairs Log
  asset_maintenance_logs: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    asset_id: v.union(v.id("assets"), v.string()),
    service_type: v.string(), // "routine_inspection" | "preventative" | "repair" | "accident_damage"
    service_date: v.string(),
    cost: v.number(),
    service_provider: v.string(),
    invoice_reference: v.optional(v.string()),
    next_service_due_date: v.optional(v.string()),
    performed_by: v.string(),
    notes: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_asset", ["asset_id"]),

  // Targeted Stakeholder Reminders & Activity Notifications
  stakeholder_notifications: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    category: v.string(), // "legal_document" | "fleet_vehicle" | "it_asset" | "asset_clearance" | "probation_review"
    target_role: v.string(), // "hr_manager" | "gro_officer" | "fleet_manager" | "it_admin" | "direct_manager" | "finance_manager"
    target_user_id: v.optional(v.string()),
    employee_id: v.optional(v.string()),
    asset_id: v.optional(v.string()),
    title: v.string(),
    title_arabic: v.string(),
    message: v.string(),
    message_arabic: v.string(),
    urgency: v.string(), // "info" | "warning" | "critical"
    action_url: v.optional(v.string()),
    is_read: v.boolean(),
    action_taken: v.boolean(),
    created_at: v.string(),
  }).index("by_org", ["organization_id"])
    .index("by_role", ["organization_id", "target_role"])
    .index("by_urgency", ["organization_id", "urgency"]),

  // Employee Self-Service Asset Audits & Attestations (التدقيق والتحقق الذاتي للعهدة)
  asset_audits: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    asset_id: v.union(v.id("assets"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    audit_campaign_name: v.optional(v.string()), // e.g. "Q4-2026-Self-Audit"
    audit_date: v.string(), // YYYY-MM-DD
    reported_condition: v.string(), // "excellent" | "good" | "fair" | "damaged" | "needs_maintenance"
    operational_status: v.string(), // "fully_operational" | "minor_issues" | "inoperable"
    qr_scanned_verified: v.boolean(), // true if scanned matching QR tag
    scanned_tag_payload: v.optional(v.string()),
    photos: v.array(v.string()), // Base64 or uploaded image URLs
    gps_latitude: v.optional(v.number()),
    gps_longitude: v.optional(v.number()),
    notes: v.optional(v.string()),
    verification_status: v.string(), // "submitted" | "approved" | "flagged_discrepancy"
    reviewed_by: v.optional(v.string()),
    reviewed_at: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_organization", ["organization_id"])
    .index("by_asset", ["asset_id"])
    .index("by_employee", ["employee_id"])
    .index("by_status", ["organization_id", "verification_status"]),

  // WhatsApp Bot Continuous Learning & Vendor COA Memory
  whatsapp_bot_training_memory: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    vendor_name: v.string(), // e.g. "Aldrees Petroleum", "Jarir Bookstore"
    vendor_cr_or_vat: v.optional(v.string()), // Tax ID or CR
    learned_account_code: v.string(), // e.g. "5210"
    learned_account_name: v.string(), // e.g. "Travel & Transportation"
    confidence_score: v.number(), // 0.0 to 1.0
    times_trained: v.number(), // Usage counter
    last_verified_by_user_id: v.optional(v.string()),
    last_trained_at: v.string(),
    notes: v.optional(v.string()),
  }).index("by_org", ["organization_id"])
    .index("by_vendor", ["organization_id", "vendor_name"]),

  // WhatsApp Unified Message Inbound & Outbound Audit Trail
  whatsapp_messages: defineTable({
    organization_id: v.union(v.id("organizations"), v.string()),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    phone_number: v.string(), // Normalized +9665XXXXXXXX
    sender_name: v.optional(v.string()),
    recipient_name: v.optional(v.string()),
    message_type: v.string(), // "text" | "interactive_button" | "image" | "template"
    content_text: v.string(),
    media_url: v.optional(v.string()),
    action_type: v.optional(v.string()), // "expense_ocr" | "po_approval" | "custody_ack" | "leave_req" | "general"
    status: v.string(), // "delivered" | "read" | "processed" | "failed"
    delivery_timestamp: v.string(),
    metadata: v.optional(v.string()), // JSON metadata
  }).index("by_org", ["organization_id"])
    .index("by_phone", ["phone_number"])
    .index("by_action", ["organization_id", "action_type"]),
});
