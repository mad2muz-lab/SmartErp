import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get customers by organization
export const listCustomers = query({
  args: { organization_id: v.id("organizations") },
  returns: v.array(v.object({
    _id: v.id("customers"),
    _creationTime: v.number(),
    customer_company_name: v.string(),
    customer_company_name_arabic: v.optional(v.string()),
    customer_type: v.union(v.literal("business"), v.literal("individual")),
    contact_person: v.optional(v.string()),
    contact_person_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    address_arabic: v.optional(v.string()),
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
    custom_payment_terms: v.optional(v.string()),
    credit_days: v.optional(v.number()),
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    // Bank Details
    bank_name: v.optional(v.string()),
    bank_name_arabic: v.optional(v.string()),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    swift_code: v.optional(v.string()),
    bank_address: v.optional(v.string()),
    bank_address_arabic: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_holder_name_arabic: v.optional(v.string()),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  })),
  handler: async (ctx, args) => {
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("asc")
      .collect();
    
    return customers;
  },
});

// Get customer by ID
export const getCustomer = query({
  args: { id: v.id("customers") },
  returns: v.union(
    v.object({
      _id: v.id("customers"),
      _creationTime: v.number(),
      customer_company_name: v.string(),
      customer_company_name_arabic: v.optional(v.string()),
      customer_type: v.union(v.literal("business"), v.literal("individual")),
      contact_person: v.optional(v.string()),
      contact_person_arabic: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.string()),
      address: v.optional(v.string()),
      address_arabic: v.optional(v.string()),
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
    custom_payment_terms: v.optional(v.string()),
    credit_days: v.optional(v.number()),
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    // Bank Details
    bank_name: v.optional(v.string()),
    bank_name_arabic: v.optional(v.string()),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    swift_code: v.optional(v.string()),
    bank_address: v.optional(v.string()),
    bank_address_arabic: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_holder_name_arabic: v.optional(v.string()),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
      is_active: v.boolean(),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new customer
export const createCustomer = mutation({
  args: {
    customer_company_name: v.string(),
    customer_company_name_arabic: v.optional(v.string()),
    customer_type: v.union(v.literal("business"), v.literal("individual")),
    contact_person: v.optional(v.string()),
    contact_person_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    address_arabic: v.optional(v.string()),
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
    custom_payment_terms: v.optional(v.string()),
    credit_days: v.optional(v.number()),
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    // Bank Details
    bank_name: v.optional(v.string()),
    bank_name_arabic: v.optional(v.string()),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    swift_code: v.optional(v.string()),
    bank_address: v.optional(v.string()),
    bank_address_arabic: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_holder_name_arabic: v.optional(v.string()),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
  },
  returns: v.id("customers"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("customers", {
      ...args,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update customer
export const updateCustomer = mutation({
  args: {
    id: v.id("customers"),
    customer_company_name: v.optional(v.string()),
    customer_company_name_arabic: v.optional(v.string()),
    customer_type: v.optional(v.union(v.literal("business"), v.literal("individual"))),
    contact_person: v.optional(v.string()),
    contact_person_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    address_arabic: v.optional(v.string()),
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
    custom_payment_terms: v.optional(v.string()),
    credit_days: v.optional(v.number()),
    credit_limit: v.optional(v.number()),
    reliability_rating: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    // Bank Details
    bank_name: v.optional(v.string()),
    bank_name_arabic: v.optional(v.string()),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    swift_code: v.optional(v.string()),
    bank_address: v.optional(v.string()),
    bank_address_arabic: v.optional(v.string()),
    account_holder_name: v.optional(v.string()),
    account_holder_name_arabic: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updates,
      updated_at: now,
    });
    
    return null;
  },
});

// Delete customer (soft delete)
export const deleteCustomer = mutation({
  args: { id: v.id("customers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.id, {
      is_active: false,
      updated_at: now,
    });
    
    return null;
  },
});
