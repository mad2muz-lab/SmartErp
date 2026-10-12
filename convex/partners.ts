import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Partners Management System
 * Handles business partners, investors, Saudi sponsors, and customer referrals
 */

// Get all partners for organization
export const getPartners = query({
  args: {
    organization_id: v.id("organizations"),
    role: v.optional(v.union(v.literal("business_partner"), v.literal("investor"), v.literal("saudi_sponsor"), v.literal("customer_referral"))),
    is_active: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    _id: v.id("partners"),
    organization_id: v.id("organizations"),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(v.literal("business_partner"), v.literal("investor"), v.literal("saudi_sponsor"), v.literal("customer_referral"), v.literal("owner")),
    profit_percentage: v.optional(v.number()),
    is_active: v.boolean(),
    notes: v.optional(v.string()),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
    metadata: v.optional(v.any()),
    _creationTime: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("partners")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id));
    
    if (args.role) {
      query = query.filter((q) => q.eq(q.field("role"), args.role));
    }
    
    if (args.is_active !== undefined) {
      query = query.filter((q) => q.eq(q.field("is_active"), args.is_active));
    }
    
    const partners = await query.collect();
    return partners;
  },
});

// Get partner by ID
export const getPartner = query({
  args: {
    partner_id: v.id("partners"),
  },
  returns: v.union(v.object({
    _id: v.id("partners"),
    organization_id: v.id("organizations"),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(v.literal("business_partner"), v.literal("investor"), v.literal("saudi_sponsor"), v.literal("customer_referral"), v.literal("owner")),
    profit_percentage: v.optional(v.number()),
    is_active: v.boolean(),
    notes: v.optional(v.string()),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
    metadata: v.optional(v.any()),
    _creationTime: v.number(),
  }), v.null()),
  handler: async (ctx, args) => {
    const partner = await ctx.db.get(args.partner_id);
    return partner;
  },
});

// Create new partner
export const createPartner = mutation({
  args: {
    organization_id: v.id("organizations"),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("business_partner"), v.literal("investor"), v.literal("saudi_sponsor"), v.literal("customer_referral")),
    profit_percentage: v.number(),
    notes: v.optional(v.string()),
    created_by: v.string(),
  },
  returns: v.id("partners"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if partner with same email already exists
    const existingPartner = await ctx.db
      .query("partners")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("email"), args.email))
      .unique();
    
    if (existingPartner) {
      throw new Error("Partner with this email already exists");
    }
    
    return await ctx.db.insert("partners", {
      organization_id: args.organization_id,
      name: args.name,
      name_arabic: args.name_arabic,
      email: args.email,
      phone: args.phone,
      role: args.role,
      profit_percentage: args.profit_percentage,
      is_active: true,
      notes: args.notes,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update partner
export const updatePartner = mutation({
  args: {
    partner_id: v.id("partners"),
    name: v.optional(v.string()),
    name_arabic: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.union(v.literal("business_partner"), v.literal("investor"), v.literal("saudi_sponsor"), v.literal("customer_referral"))),
    profit_percentage: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    updated_by: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const partner = await ctx.db.get(args.partner_id);
    if (!partner) {
      return {
        success: false,
        message: "Partner not found",
      };
    }
    
    // Check if email is being changed and if it already exists
    if (args.email && args.email !== partner.email) {
      const existingPartner = await ctx.db
        .query("partners")
        .withIndex("by_organization", (q) => q.eq("organization_id", partner.organization_id))
        .filter((q) => q.eq(q.field("email"), args.email))
        .unique();
      
      if (existingPartner) {
        return {
          success: false,
          message: "Partner with this email already exists",
        };
      }
    }
    
    const updateData: any = {
      updated_at: now,
    };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.name_arabic !== undefined) updateData.name_arabic = args.name_arabic;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.role !== undefined) updateData.role = args.role;
    if (args.profit_percentage !== undefined) updateData.profit_percentage = args.profit_percentage;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;
    if (args.notes !== undefined) updateData.notes = args.notes;
    
    await ctx.db.patch(args.partner_id, updateData);
    
    return {
      success: true,
      message: "Partner updated successfully",
    };
  },
});

// Delete partner (soft delete by setting is_active to false)
export const deletePartner = mutation({
  args: {
    partner_id: v.id("partners"),
    deleted_by: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const partner = await ctx.db.get(args.partner_id);
    if (!partner) {
      return {
        success: false,
        message: "Partner not found",
      };
    }
    
    // Check if partner has any profit distributions
    const distributions = await ctx.db
      .query("profit_distributions")
      .withIndex("by_partner", (q) => q.eq("partner_id", args.partner_id))
      .collect();
    
    if (distributions.length > 0) {
      // Soft delete - set is_active to false
      await ctx.db.patch(args.partner_id, {
        is_active: false,
        updated_at: now,
      });
      
      return {
        success: true,
        message: "Partner deactivated successfully (has existing distributions)",
      };
    } else {
      // Hard delete if no distributions
      await ctx.db.delete(args.partner_id);
      
      return {
        success: true,
        message: "Partner deleted successfully",
      };
    }
  },
});

// Get partner's profit distributions
export const getPartnerDistributions = query({
  args: {
    organization_id: v.id("organizations"),
    partner_id: v.id("partners"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(v.object({
      _id: v.id("profit_distributions"),
      order_financial_id: v.id("order_financials"),
      distribution_type: v.union(v.literal("saudi_sponsor"), v.literal("customer_referral"), v.literal("business_partner"), v.literal("investor")),
      percentage: v.number(),
      amount: v.number(),
      status: v.union(v.literal("pending"), v.literal("paid"), v.literal("cancelled")),
      paid_at: v.optional(v.string()),
      created_at: v.string(),
      quotation: v.optional(v.object({
        quotation_number: v.string(),
        customer_name: v.string(),
        order_value_excl_vat: v.number(),
      })),
    })),
    isDone: v.boolean(),
    continueCursor: v.optional(v.string()),
    total_amount: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let query = ctx.db
      .query("profit_distributions")
      .withIndex("by_partner", (q) => q.eq("partner_id", args.partner_id))
      .filter((q) => q.eq(q.field("organization_id"), args.organization_id))
      .order("desc");
    
    let result;
    if (args.cursor) {
      result = await query.paginate({ cursor: args.cursor, numItems: limit });
    } else {
      result = await query.paginate({ cursor: null, numItems: limit });
    }
    
    // Get quotation details for each distribution
    const itemsWithQuotations = await Promise.all(
      result.page.map(async (item) => {
        const orderFinancial = await ctx.db.get(item.order_financial_id);
        let quotation = undefined;
        
        if (orderFinancial) {
          const quotationData = await ctx.db.get(orderFinancial.quotation_id);
          if (quotationData) {
            quotation = {
              quotation_number: (quotationData as any).quotation_number || "",
              customer_name: (quotationData as any).customer_name || "",
              order_value_excl_vat: orderFinancial.order_value_excl_vat,
            };
          }
        }
        
        return {
          ...item,
          quotation,
        };
      })
    );
    
    // Calculate total amount for this partner
    const allDistributions = await ctx.db
      .query("profit_distributions")
      .withIndex("by_partner", (q) => q.eq("partner_id", args.partner_id))
      .filter((q) => q.eq(q.field("organization_id"), args.organization_id))
      .collect();
    
    const totalAmount = allDistributions.reduce((sum, dist) => sum + dist.amount, 0);
    
    return {
      items: itemsWithQuotations,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      total_amount: totalAmount,
    };
  },
});

// Get partners summary for dashboard
export const getPartnersSummary = query({
  args: {
    organization_id: v.id("organizations"),
  },
  returns: v.object({
    total_partners: v.number(),
    active_partners: v.number(),
    business_partners: v.number(),
    investors: v.number(),
    saudi_sponsors: v.number(),
    customer_referrals: v.number(),
    total_distributed: v.number(),
    partners_by_role: v.array(v.object({
      role: v.string(),
      count: v.number(),
      total_distributed: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // Get all partners
    const partners = await ctx.db
      .query("partners")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .collect();
    
    const totalPartners = partners.length;
    const activePartners = partners.filter(p => p.is_active).length;
    const businessPartners = partners.filter(p => p.role === "business_partner").length;
    const investors = partners.filter(p => p.role === "investor").length;
    const saudiSponsors = partners.filter(p => p.role === "saudi_sponsor").length;
    const customerReferrals = partners.filter(p => p.role === "customer_referral").length;
    
    // Get all distributions for this organization
    const distributions = await ctx.db
      .query("profit_distributions")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .collect();
    
    const totalDistributed = distributions.reduce((sum, dist) => sum + dist.amount, 0);
    
    // Calculate distributions by role
    const partnersByRole = [];
    const roles = ["business_partner", "investor", "saudi_sponsor", "customer_referral"];
    
    for (const role of roles) {
      const rolePartners = partners.filter(p => p.role === role);
      const roleDistributions = distributions.filter(d => d.distribution_type === role);
      const roleTotalDistributed = roleDistributions.reduce((sum, dist) => sum + dist.amount, 0);
      
      partnersByRole.push({
        role,
        count: rolePartners.length,
        total_distributed: roleTotalDistributed,
      });
    }
    
    return {
      total_partners: totalPartners,
      active_partners: activePartners,
      business_partners: businessPartners,
      investors: investors,
      saudi_sponsors: saudiSponsors,
      customer_referrals: customerReferrals,
      total_distributed: totalDistributed,
      partners_by_role: partnersByRole,
    };
  },
});

// Validate partner profit percentages
export const validatePartnerPercentages = query({
  args: {
    organization_id: v.id("organizations"),
    exclude_partner_id: v.optional(v.id("partners")),
  },
  returns: v.object({
    is_valid: v.boolean(),
    total_percentage: v.number(),
    message: v.string(),
    partners: v.array(v.object({
      partner_id: v.id("partners"),
      name: v.string(),
      role: v.union(v.literal("business_partner"), v.literal("investor"), v.literal("saudi_sponsor"), v.literal("customer_referral"), v.literal("owner")),
      profit_percentage: v.optional(v.number()),
    })),
  }),
  handler: async (ctx, args) => {
    const partners = await ctx.db
      .query("partners")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    
    // Filter out excluded partner if provided
    const filteredPartners = args.exclude_partner_id 
      ? partners.filter(p => p._id !== args.exclude_partner_id)
      : partners;
    
    // Only consider business partners and investors for percentage validation
    const businessPartners = filteredPartners.filter(p => 
      p.role === "business_partner" || p.role === "investor"
    );
    
    const totalPercentage = businessPartners.reduce((sum, p) => sum + (p.profit_percentage || 0), 0);
    
    const partnersData = businessPartners.map(p => ({
      partner_id: p._id,
      name: p.name,
      role: p.role,
      profit_percentage: p.profit_percentage,
    }));
    
    let message = "";
    let isValid = true;
    
    if (totalPercentage > 100) {
      isValid = false;
      message = `Total percentage (${totalPercentage}%) exceeds 100%. Please adjust partner percentages.`;
    } else if (totalPercentage < 100) {
      message = `Total percentage (${totalPercentage}%) is less than 100%. Remaining ${100 - totalPercentage}% will be distributed equally.`;
    } else {
      message = "Partner percentages are valid.";
    }
    
    return {
      is_valid: isValid,
      total_percentage: totalPercentage,
      message,
      partners: partnersData,
    };
  },
});
