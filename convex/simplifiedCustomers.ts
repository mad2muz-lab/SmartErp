import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Simplified Customer Management
 * Only essential fields for ZATCA compliance and business operations
 */

// Get customers by organization (simplified)
export const listCustomers = query({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  handler: async (ctx, args) => {
    try {
      if (!args.organization_id || (typeof args.organization_id === "string" && (
        args.organization_id.startsWith("org_") ||
        args.organization_id.startsWith("temp_") ||
        args.organization_id.startsWith("demo_") ||
        args.organization_id.startsWith("local_") ||
        args.organization_id.startsWith("vnd_") ||
        args.organization_id.startsWith("vendor_")
      ))) {
        return [];
      }

      const customers = await ctx.db
        .query("customers")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("asc")
        .collect();
      
      return customers;
    } catch (err) {
      console.warn("simplified listCustomers fallback:", err);
      return [];
    }
  },
});

// Get customer by ID (simplified)
export const getCustomer = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new customer (modular - all fields preserved)
export const createCustomer = mutation({
  args: {
    // CUSTOMER BASIC INFORMATION
    customer_company_name: v.string(),
    customer_company_name_arabic: v.optional(v.string()),
    customer_type: v.union(v.literal("business"), v.literal("individual")),
    contact_person: v.optional(v.string()),
    contact_person_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    
    // ADDRESS INFORMATION
    address: v.string(),
    address_arabic: v.optional(v.string()),
    building_number: v.optional(v.string()),
    building_number_arabic: v.optional(v.string()),
    street: v.optional(v.string()),
    street_arabic: v.optional(v.string()),
    additional_number: v.optional(v.string()),
    additional_number_arabic: v.optional(v.string()),
    district: v.optional(v.string()),
    district_arabic: v.optional(v.string()),
    city: v.string(),
    city_arabic: v.optional(v.string()),
    state_province: v.optional(v.string()),
    state_province_arabic: v.optional(v.string()),
    zip_postal_code: v.optional(v.string()),
    zip_postal_code_arabic: v.optional(v.string()),
    country: v.string(),
    country_arabic: v.optional(v.string()),
    
    // BUSINESS INFORMATION
    website: v.optional(v.string()),
    vat_number: v.string(),
    cr_number: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    custom_payment_terms: v.optional(v.string()),
    credit_days: v.optional(v.number()),
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    
    // BANK DETAILS
    bank_name: v.optional(v.string()),
    bank_name_arabic: v.optional(v.string()),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    swift_code: v.optional(v.string()),
    bank_address: v.optional(v.string()),
    bank_address_arabic: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_holder_name_arabic: v.optional(v.string()),
    
    // SYSTEM FIELDS
    organization_id: v.id("organizations"),
    created_by: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate required fields
    if (!args.customer_company_name.trim()) {
      throw new Error("Company name is required");
    }
    
    if (!args.vat_number.trim()) {
      throw new Error("VAT number is required for ZATCA compliance");
    }
    
    if (!args.address.trim()) {
      throw new Error("Address is required for ZATCA compliance");
    }
    
    if (!args.city.trim()) {
      throw new Error("City is required for ZATCA compliance");
    }

    // Check for duplicate VAT number in the same organization
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("vat_number"), args.vat_number))
      .first();

    if (existingCustomer) {
      throw new Error("Customer with this VAT number already exists");
    }

    // Create customer with all fields preserved
    const customerId = await ctx.db.insert("customers", {
      // Customer basic information
      customer_company_name: args.customer_company_name,
      customer_company_name_arabic: args.customer_company_name_arabic || "",
      customer_type: args.customer_type,
      contact_person: args.contact_person || "",
      contact_person_arabic: args.contact_person_arabic || "",
      email: args.email || "",
      phone: args.phone || "",
      
      // Address information
      address: args.address,
      address_arabic: args.address_arabic || "",
      building_number: args.building_number || "",
      building_number_arabic: args.building_number_arabic || "",
      street: args.street || "",
      street_arabic: args.street_arabic || "",
      additional_number: args.additional_number || "",
      additional_number_arabic: args.additional_number_arabic || "",
      district: args.district || "",
      district_arabic: args.district_arabic || "",
      city: args.city,
      city_arabic: args.city_arabic || "",
      state_province: args.state_province || "",
      state_province_arabic: args.state_province_arabic || "",
      zip_postal_code: args.zip_postal_code || "",
      zip_postal_code_arabic: args.zip_postal_code_arabic || "",
      country: args.country,
      country_arabic: args.country_arabic || "",
      
      // Business information
      website: args.website || "",
      vat_number: args.vat_number,
      cr_number: args.cr_number || "",
      payment_terms: args.payment_terms || "Net 30",
      custom_payment_terms: args.custom_payment_terms || "",
      credit_days: args.credit_days || 0,
      credit_limit: args.credit_limit || 0,
      reliability_rating: args.reliability_rating || 5,
      notes: args.notes || "",
      notes_arabic: args.notes_arabic || "",
      
      // Bank details
      bank_name: args.bank_name || "",
      bank_name_arabic: args.bank_name_arabic || "",
      account_number: args.account_number || "",
      iban: args.iban || "",
      swift_code: args.swift_code || "",
      bank_address: args.bank_address || "",
      bank_address_arabic: args.bank_address_arabic || "",
      account_holder_name: args.account_holder_name || "",
      account_holder_name_arabic: args.account_holder_name_arabic || "",
      
      // System fields
      organization_id: args.organization_id,
      is_active: true,
      created_by: args.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return customerId;
  },
});

// Update customer (modular - all fields preserved)
export const updateCustomer = mutation({
  args: {
    id: v.id("customers"),
    // CUSTOMER BASIC INFORMATION
    customer_company_name: v.optional(v.string()),
    customer_company_name_arabic: v.optional(v.string()),
    customer_type: v.optional(v.union(v.literal("business"), v.literal("individual"))),
    contact_person: v.optional(v.string()),
    contact_person_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    
    // ADDRESS INFORMATION
    address: v.optional(v.string()),
    address_arabic: v.optional(v.string()),
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
    
    // BUSINESS INFORMATION
    website: v.optional(v.string()),
    vat_number: v.optional(v.string()),
    cr_number: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    custom_payment_terms: v.optional(v.string()),
    credit_days: v.optional(v.number()),
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    
    // BANK DETAILS
    bank_name: v.optional(v.string()),
    bank_name_arabic: v.optional(v.string()),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    swift_code: v.optional(v.string()),
    bank_address: v.optional(v.string()),
    bank_address_arabic: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_holder_name_arabic: v.optional(v.string()),
    
    // SYSTEM FIELDS
    updated_by: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, updated_by, ...updateData } = args;
    
    // Get existing customer
    const existingCustomer = await ctx.db.get(id);
    if (!existingCustomer) {
      throw new Error("Customer not found");
    }

    // Validate VAT number if being updated
    if (updateData.vat_number && updateData.vat_number !== existingCustomer.vat_number) {
      const duplicateCustomer = await ctx.db
        .query("customers")
        .withIndex("by_organization", (q) => q.eq("organization_id", existingCustomer.organization_id))
        .filter((q) => q.eq(q.field("vat_number"), updateData.vat_number))
        .filter((q) => q.neq(q.field("_id"), id))
        .first();

      if (duplicateCustomer) {
        throw new Error("Customer with this VAT number already exists");
      }
    }

    // Update customer
    await ctx.db.patch(id, {
      ...updateData,
      updated_by,
      updated_at: new Date().toISOString(),
    });

    return id;
  },
});

// Delete customer (soft delete)
export const deleteCustomer = mutation({
  args: {
    id: v.id("customers"),
    deleted_by: v.string(),
  },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Soft delete by setting is_active to false
    await ctx.db.patch(args.id, {
      is_active: false,
      updated_by: args.deleted_by,
      updated_at: new Date().toISOString(),
    });

    return args.id;
  },
});

// Get customer for invoice generation (returns only fields needed for ZATCA compliance)
export const getCustomerForInvoice = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Return only fields needed for ZATCA-compliant invoices
    return {
      _id: customer._id,
      customer_company_name: customer.customer_company_name,
      customer_type: customer.customer_type,
      vat_number: customer.vat_number,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      contact_person: customer.contact_person,
      email: customer.email,
      phone: customer.phone,
      payment_terms: customer.payment_terms,
    };
  },
});

// Get customer for quotation generation
export const getCustomerForQuotation = query({
  args: { id: v.id("customers") },
  handler: async (ctx, args) => {
    const customer = await ctx.db.get(args.id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Return only fields needed for quotations
    return {
      _id: customer._id,
      customer_company_name: customer.customer_company_name,
      customer_type: customer.customer_type,
      contact_person: customer.contact_person,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      payment_terms: customer.payment_terms,
    };
  },
});
