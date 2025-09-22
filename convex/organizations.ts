import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Get all organizations
export const listOrganizations = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("organizations"),
    _creationTime: v.number(),
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
    // New fields
    name_arabic: v.optional(v.string()),
    industry: v.optional(v.array(v.string())),
    address_arabic: v.optional(v.string()),
    vat_number_arabic: v.optional(v.string()),
    cr_number: v.optional(v.string()),
    cr_number_arabic: v.optional(v.string()),
    // Detailed address fields for invoicing and business documents
    building_number: v.optional(v.string()),
    street: v.optional(v.string()),
    additional_number: v.optional(v.string()),
    district: v.optional(v.string()),
    city: v.optional(v.string()),
    state_province: v.optional(v.string()),
    zip_postal_code: v.optional(v.string()),
    country: v.optional(v.string()),
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
  })),
  handler: async (ctx) => {
    const organizations = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("asc")
      .collect();
    
    // Filter out the is_default field to avoid validation errors
    return organizations.map(org => {
      const { is_default, ...orgWithoutDefault } = org;
      return orgWithoutDefault;
    });
  },
});

// Get organization by ID
export const getOrganization = query({
  args: { id: v.id("organizations") },
  returns: v.union(
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
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
      // New fields
      name_arabic: v.optional(v.string()),
      industry: v.optional(v.array(v.string())),
      address_arabic: v.optional(v.string()),
      vat_number_arabic: v.optional(v.string()),
      cr_number: v.optional(v.string()),
      cr_number_arabic: v.optional(v.string()),
      // Detailed address fields for invoicing and business documents
      building_number: v.optional(v.string()),
      street: v.optional(v.string()),
      additional_number: v.optional(v.string()),
      district: v.optional(v.string()),
      city: v.optional(v.string()),
      state_province: v.optional(v.string()),
      zip_postal_code: v.optional(v.string()),
      country: v.optional(v.string()),
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
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.id);
    if (!organization) return null;
    
    // Filter out the is_default field to avoid validation errors
    const { is_default, ...orgWithoutDefault } = organization;
    return orgWithoutDefault;
  },
});

/**
 * Get organization with logo URL converted from file ID
 */
export const getOrganizationWithLogoUrl: any = action({
  args: { id: v.id("organizations") },
  returns: v.union(
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
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
      // New fields
      name_arabic: v.optional(v.string()),
      industry: v.optional(v.array(v.string())),
      address_arabic: v.optional(v.string()),
      vat_number_arabic: v.optional(v.string()),
      cr_number: v.optional(v.string()),
      cr_number_arabic: v.optional(v.string()),
      // Detailed address fields for invoicing and business documents
      building_number: v.optional(v.string()),
      street: v.optional(v.string()),
      additional_number: v.optional(v.string()),
      district: v.optional(v.string()),
      city: v.optional(v.string()),
      state_province: v.optional(v.string()),
      zip_postal_code: v.optional(v.string()),
      country: v.optional(v.string()),
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
    }),
    v.null()
  ),
  handler: async (ctx: any, args: any): Promise<any> => {
    const organization = await ctx.runQuery(api.organizations.getOrganization, { id: args.id });
    if (!organization) return null;
    
    // Convert logo file ID to URL if it exists
    let logoUrl = organization.logo_url;
    if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('http')) {
      try {
        const fullLogoUrl = await ctx.storage.getUrl(logoUrl);
        logoUrl = fullLogoUrl;
      } catch (error) {
        console.warn('Failed to get logo URL:', error);
        logoUrl = undefined; // Clear logo if URL retrieval fails
      }
    }
    
    return {
      ...organization,
      logo_url: logoUrl
    };
  },
});

// Create new organization
export const createOrganization = mutation({
  args: {
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
    // New fields
    name_arabic: v.optional(v.string()),
    industry: v.optional(v.array(v.string())),
    address_arabic: v.optional(v.string()),
    vat_number_arabic: v.optional(v.string()),
    cr_number: v.optional(v.string()),
    cr_number_arabic: v.optional(v.string()),
    // Detailed address fields for invoicing and business documents
    building_number: v.optional(v.string()),
    street: v.optional(v.string()),
    additional_number: v.optional(v.string()),
    district: v.optional(v.string()),
    city: v.optional(v.string()),
    state_province: v.optional(v.string()),
    zip_postal_code: v.optional(v.string()),
    country: v.optional(v.string()),
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
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("organizations", {
      ...args,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  },
});

// Set organization as default
export const setDefaultOrganization = mutation({
  args: { id: v.id("organizations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First, unset all organizations as default
    const allOrganizations = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    
    for (const org of allOrganizations) {
      await ctx.db.patch(org._id, { is_default: false });
    }
    
    // Set the selected organization as default
    await ctx.db.patch(args.id, { is_default: true });
    
    return null;
  },
});

// Update organization
export const updateOrganization = mutation({
  args: {
    id: v.id("organizations"),
    name: v.optional(v.string()),
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
    // New fields
    name_arabic: v.optional(v.string()),
    industry: v.optional(v.array(v.string())),
    address_arabic: v.optional(v.string()),
    vat_number_arabic: v.optional(v.string()),
    cr_number: v.optional(v.string()),
    cr_number_arabic: v.optional(v.string()),
    // Detailed address fields for invoicing and business documents
    building_number: v.optional(v.string()),
    street: v.optional(v.string()),
    additional_number: v.optional(v.string()),
    district: v.optional(v.string()),
    city: v.optional(v.string()),
    state_province: v.optional(v.string()),
    zip_postal_code: v.optional(v.string()),
    country: v.optional(v.string()),
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


