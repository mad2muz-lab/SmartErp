import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all suppliers for an organization
export const listSuppliers = query({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  returns: v.any(),
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

      return await ctx.db
        .query("suppliers")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("asc")
        .collect();
    } catch (err) {
      console.warn("listSuppliers fallback:", err);
      return [];
    }
  },
});

// Get a specific supplier
export const getSupplier = query({
  args: { id: v.id("suppliers") },
  returns: v.union(
    v.object({
      _id: v.id("suppliers"),
      _creationTime: v.number(),
      name: v.string(),
      name_arabic: v.optional(v.string()),
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
      credit_limit: v.optional(v.number()),
      reliability_rating: v.optional(v.number()),
      tags: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
      notes_arabic: v.optional(v.string()),
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

// Create a new supplier
export const createSupplier = mutation({
  args: {
    supplier_type: v.optional(v.union(v.literal("general"), v.literal("recruitment_agency"))),
    name: v.string(),
    name_arabic: v.optional(v.string()),
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
    credit_days: v.optional(v.number()),
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
    notes_arabic: v.optional(v.string()),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
  },
  returns: v.id("suppliers"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("suppliers", {
      supplier_type: args.supplier_type,
      name: args.name,
      name_arabic: args.name_arabic,
      contact_person: args.contact_person,
      contact_person_arabic: args.contact_person_arabic,
      email: args.email,
      phone: args.phone,
      address: args.address,
      address_arabic: args.address_arabic,
      // Detailed address fields
      building_number: args.building_number,
      street: args.street,
      additional_number: args.additional_number,
      district: args.district,
      city: args.city,
      state_province: args.state_province,
      zip_postal_code: args.zip_postal_code,
      country: args.country,
      website: args.website,
      vat_number: args.vat_number,
      cr_number: args.cr_number,
      payment_terms: args.payment_terms,
      credit_days: args.credit_days,
      credit_limit: args.credit_limit,
      reliability_rating: args.reliability_rating,
      service_ids: args.service_ids,
      recruitment_license_number: args.recruitment_license_number,
      recruitment_license_country: args.recruitment_license_country,
      recruitment_license_expiry: args.recruitment_license_expiry,
      recruitment_countries: args.recruitment_countries,
      recruitment_job_categories: args.recruitment_job_categories,
      recruitment_screening_checks: args.recruitment_screening_checks,
      recruitment_fee_model: args.recruitment_fee_model,
      recruitment_fee_amount: args.recruitment_fee_amount,
      recruitment_fee_currency: args.recruitment_fee_currency,
      recruitment_replacement_days: args.recruitment_replacement_days,
      tags: args.tags,
      notes: args.notes,
      notes_arabic: args.notes_arabic,
      organization_id: args.organization_id,
      created_by: args.created_by,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update a supplier
export const updateSupplier = mutation({
  args: {
    id: v.id("suppliers"),
    supplier_type: v.optional(v.union(v.literal("general"), v.literal("recruitment_agency"))),
    name: v.string(),
    name_arabic: v.optional(v.string()),
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
    credit_days: v.optional(v.number()),
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
    notes_arabic: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updateData } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updateData,
      updated_at: now,
    });
    
    return null;
  },
});

// Delete a supplier (soft delete)
export const deleteSupplier = mutation({
  args: { id: v.id("suppliers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });
    
    return null;
  },
});
